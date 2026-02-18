import type { PrismaClient } from "@prisma/client";
import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_MODE,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  type BumpReminderConfig,
  type BumpReminderMentionClearResult,
  type BumpReminderMentionRoleResult,
  type BumpReminderMentionUserAddResult,
  type BumpReminderMentionUserMode,
  type BumpReminderMentionUserRemoveResult,
  type BumpReminderMentionUsersClearResult,
} from "../../database/types";
import { DatabaseError } from "../../errors/CustomErrors";
import { tDefault } from "../../locale";

export class GuildBumpReminderConfigStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly defaultLocale: string,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
  ) {}

  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { bumpReminderConfig: true },
    });
    const parsed = this.safeJsonParse<BumpReminderConfig>(
      record?.bumpReminderConfig ?? null,
    );

    if (parsed) {
      return {
        ...parsed,
        mentionUserIds: Array.isArray(parsed.mentionUserIds)
          ? parsed.mentionUserIds
          : [],
      };
    }

    if (record?.bumpReminderConfig) {
      return null;
    }

    return {
      enabled: true,
      mentionRoleId: undefined,
      mentionUserIds: [],
    };
  }

  async setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      const rawConfig = record?.bumpReminderConfig ?? null;
      const config = this.safeJsonParse<BumpReminderConfig>(rawConfig);

      if (!config) {
        const initialConfig: BumpReminderConfig = {
          enabled,
          channelId,
          mentionRoleId: undefined,
          mentionUserIds: [],
        };
        const initialJson = JSON.stringify(initialConfig);

        if (record) {
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: initialJson,
            },
          });
          if (initResult.count > 0) {
            return;
          }
        } else {
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: initialJson,
            },
          });
        }
        continue;
      }

      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      const updatedConfig: BumpReminderConfig = {
        ...config,
        enabled,
        channelId: channelId ?? config.channelId,
        mentionUserIds,
      };

      const updatedJson = JSON.stringify(updatedConfig);
      if (updatedJson === rawConfig) {
        return;
      }

      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: updatedJson,
        },
      });

      if (result.count > 0) {
        return;
      }
    }

    throw new DatabaseError(
      tDefault("errors:database.update_config_failed") +
        `: bump reminder enable update conflict (${guildId})`,
    );
  }

  async updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void> {
    const maxRetries = 3;
    const nextJson = JSON.stringify(bumpReminderConfig);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      const rawConfig = record?.bumpReminderConfig ?? null;

      if (rawConfig === nextJson) {
        return;
      }

      if (rawConfig === null) {
        if (record) {
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: nextJson,
            },
          });
          if (initResult.count > 0) {
            return;
          }
        } else {
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: nextJson,
            },
          });
        }
        continue;
      }

      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: nextJson,
        },
      });

      if (result.count > 0) {
        return;
      }
    }

    throw new DatabaseError(
      tDefault("errors:database.update_config_failed") +
        `: bump reminder config update conflict (${guildId})`,
    );
  }

  async setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult> {
    return this.mutateBumpReminderConfig(guildId, (config) => {
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      return {
        result: BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
        updatedConfig: {
          ...config,
          mentionRoleId: roleId,
          mentionUserIds,
        },
      };
    });
  }

  async addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult> {
    return this.mutateBumpReminderMentionUsers(
      guildId,
      userId,
      BUMP_REMINDER_MENTION_USER_MODE.ADD,
    ) as Promise<BumpReminderMentionUserAddResult>;
  }

  async removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult> {
    return this.mutateBumpReminderMentionUsers(
      guildId,
      userId,
      BUMP_REMINDER_MENTION_USER_MODE.REMOVE,
    ) as Promise<BumpReminderMentionUserRemoveResult>;
  }

  async clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult> {
    return this.mutateBumpReminderConfig(guildId, (config) => {
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      if (mentionUserIds.length === 0) {
        return {
          result: BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
          updatedConfig: {
            ...config,
            mentionUserIds,
          },
          skipWrite: true,
        };
      }

      return {
        result: BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.CLEARED,
        updatedConfig: {
          ...config,
          mentionUserIds: [],
        },
      };
    });
  }

  async clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult> {
    return this.mutateBumpReminderConfig(guildId, (config) => {
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      if (!config.mentionRoleId && mentionUserIds.length === 0) {
        return {
          result: BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED,
          updatedConfig: {
            ...config,
            mentionRoleId: undefined,
            mentionUserIds,
          },
          skipWrite: true,
        };
      }

      return {
        result: BUMP_REMINDER_MENTION_CLEAR_RESULT.CLEARED,
        updatedConfig: {
          ...config,
          mentionRoleId: undefined,
          mentionUserIds: [],
        },
      };
    });
  }

  private async mutateBumpReminderConfig<
    TResult extends
      | BumpReminderMentionRoleResult
      | BumpReminderMentionUsersClearResult
      | BumpReminderMentionClearResult,
  >(
    guildId: string,
    mutator: (config: BumpReminderConfig) => {
      result: TResult;
      updatedConfig: BumpReminderConfig;
      skipWrite?: boolean;
    },
  ): Promise<
    TResult | typeof BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED
  > {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      const rawConfig = record?.bumpReminderConfig ?? null;
      const config = this.safeJsonParse<BumpReminderConfig>(rawConfig);
      if (!config) {
        if (rawConfig !== null) {
          return BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED;
        }

        const initialConfig: BumpReminderConfig = {
          enabled: true,
          mentionRoleId: undefined,
          mentionUserIds: [],
        };
        const initialJson = JSON.stringify(initialConfig);

        if (record) {
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: initialJson,
            },
          });

          if (initResult.count > 0) {
            continue;
          }
        } else {
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: initialJson,
            },
          });
          continue;
        }

        continue;
      }

      const mutation = mutator(config);
      if (mutation.skipWrite) {
        return mutation.result;
      }

      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: JSON.stringify(mutation.updatedConfig),
        },
      });

      if (result.count > 0) {
        return mutation.result;
      }
    }

    throw new DatabaseError(
      tDefault("errors:database.update_config_failed") +
        `: bump reminder config update conflict (${guildId})`,
    );
  }

  private async mutateBumpReminderMentionUsers(
    guildId: string,
    userId: string,
    mode: BumpReminderMentionUserMode,
  ): Promise<
    BumpReminderMentionUserAddResult | BumpReminderMentionUserRemoveResult
  > {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      const rawConfig = record?.bumpReminderConfig ?? null;
      const config = this.safeJsonParse<BumpReminderConfig>(rawConfig);

      if (!config) {
        if (rawConfig !== null) {
          return BUMP_REMINDER_MENTION_USER_ADD_RESULT.NOT_CONFIGURED;
        }

        const initialConfig: BumpReminderConfig = {
          enabled: true,
          mentionRoleId: undefined,
          mentionUserIds: [],
        };
        const initialJson = JSON.stringify(initialConfig);

        if (record) {
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: initialJson,
            },
          });

          if (initResult.count > 0) {
            continue;
          }
        } else {
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: initialJson,
            },
          });
          continue;
        }

        continue;
      }

      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];
      const exists = mentionUserIds.includes(userId);

      if (mode === BUMP_REMINDER_MENTION_USER_MODE.ADD && exists) {
        return BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS;
      }
      if (mode === BUMP_REMINDER_MENTION_USER_MODE.REMOVE && !exists) {
        return BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_FOUND;
      }

      const nextMentionUserIds =
        mode === BUMP_REMINDER_MENTION_USER_MODE.ADD
          ? [...mentionUserIds, userId]
          : mentionUserIds.filter((id) => id !== userId);

      const updatedConfig: BumpReminderConfig = {
        ...config,
        mentionUserIds: nextMentionUserIds,
      };

      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: JSON.stringify(updatedConfig),
        },
      });

      if (result.count > 0) {
        return mode === BUMP_REMINDER_MENTION_USER_MODE.ADD
          ? BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED
          : BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED;
      }
    }

    throw new DatabaseError(
      tDefault("errors:database.update_config_failed") +
        `: bump reminder mention user update conflict (${guildId})`,
    );
  }
}
