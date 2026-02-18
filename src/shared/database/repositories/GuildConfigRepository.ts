// src/shared/database/repositories/GuildConfigRepository.ts
// Repositoryパターン実装（Prisma版）

import type { PrismaClient } from "@prisma/client";
import type {
  AfkConfig,
  BumpReminderConfig,
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
  GuildConfig,
  IGuildConfigRepository,
  MemberLogConfig,
  StickMessage,
  VacConfig,
} from "../../database/types";
import { DatabaseError } from "../../errors/CustomErrors";
import { tDefault } from "../../locale";
import { logger } from "../../utils/logger";
import { GuildBumpReminderConfigStore } from "./GuildBumpReminderConfigStore";

// 型定義は database/types.ts に集約（後方互換のため re-export）
export type {
  AfkConfig,
  BumpReminderConfig,
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserMode,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
  GuildConfig,
  IAfkRepository,
  IBaseGuildRepository,
  IBumpReminderConfigRepository,
  IGuildConfigRepository,
  IMemberLogRepository,
  IStickMessageRepository,
  IVacRepository,
  MemberLogConfig,
  StickMessage,
  VacConfig,
} from "../../database/types";

export {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_MODE,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
} from "../../database/types";

/**
 * Prisma実装のRepository
 */
export class PrismaGuildConfigRepository implements IGuildConfigRepository {
  private prisma: PrismaClient;
  private readonly DEFAULT_LOCALE = "ja";
  private readonly bumpReminderStore: GuildBumpReminderConfigStore;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.bumpReminderStore = new GuildBumpReminderConfigStore(
      prisma,
      this.DEFAULT_LOCALE,
      this.safeJsonParse.bind(this),
    );
  }

  /**
   * Guild設定を取得
   */
  async getConfig(guildId: string): Promise<GuildConfig | null> {
    try {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
      });

      if (!record) {
        return null;
      }

      return this.recordToConfig(record);
    } catch (error) {
      logger.error(
        tDefault("system:database.get_config_log", { guildId }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.get_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild設定を保存（新規作成）
   */
  async saveConfig(config: GuildConfig): Promise<void> {
    try {
      await this.prisma.guildConfig.create({
        data: {
          guildId: config.guildId,
          locale: config.locale || this.DEFAULT_LOCALE,
          afkConfig: config.afkConfig ? JSON.stringify(config.afkConfig) : null,
          vacConfig: config.vacConfig ? JSON.stringify(config.vacConfig) : null,
          bumpReminderConfig: config.bumpReminderConfig
            ? JSON.stringify(config.bumpReminderConfig)
            : null,
          stickMessages: config.stickMessages
            ? JSON.stringify(config.stickMessages)
            : null,
          memberLogConfig: config.memberLogConfig
            ? JSON.stringify(config.memberLogConfig)
            : null,
        },
      });

      logger.info(
        tDefault("system:database.saved_config", { guildId: config.guildId }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.save_config_log", {
          guildId: config.guildId,
        }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.save_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild設定を更新
   */
  async updateConfig(
    guildId: string,
    updates: Partial<GuildConfig>,
  ): Promise<void> {
    try {
      // 更新データの準備
      const data: Record<string, unknown> = {};

      if (updates.locale !== undefined) data.locale = updates.locale;
      if (updates.afkConfig !== undefined)
        data.afkConfig = JSON.stringify(updates.afkConfig);
      if (updates.vacConfig !== undefined)
        data.vacConfig = JSON.stringify(updates.vacConfig);
      if (updates.bumpReminderConfig !== undefined)
        data.bumpReminderConfig = JSON.stringify(updates.bumpReminderConfig);
      if (updates.stickMessages !== undefined)
        data.stickMessages = JSON.stringify(updates.stickMessages);
      if (updates.memberLogConfig !== undefined)
        data.memberLogConfig = JSON.stringify(updates.memberLogConfig);

      // exists → update/insert の 2 クエリを回避、upsert 1 回に統一
      await this.prisma.guildConfig.upsert({
        where: { guildId },
        update: data,
        create: {
          guildId,
          locale: (updates.locale as string | undefined) ?? this.DEFAULT_LOCALE,
          ...data,
        },
      });

      logger.info(tDefault("system:database.updated_config", { guildId }));
    } catch (error) {
      logger.error(
        tDefault("system:database.update_config_log", { guildId }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.update_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild設定を削除
   */
  async deleteConfig(guildId: string): Promise<void> {
    try {
      await this.prisma.guildConfig.delete({
        where: { guildId },
      });

      logger.info(tDefault("system:database.deleted_config", { guildId }));
    } catch (error) {
      logger.error(
        tDefault("system:database.delete_config_log", { guildId }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.delete_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild設定の存在確認
   */
  async exists(guildId: string): Promise<boolean> {
    try {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { id: true },
      });
      return record !== null;
    } catch (error) {
      logger.error(
        tDefault("system:database.check_existence_log", { guildId }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.check_existence_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild別言語取得
   * localeフィールドのみを取得する専用クエリ（全体取得より効率的）
   */
  async getLocale(guildId: string): Promise<string> {
    try {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { locale: true },
      });
      return record?.locale || this.DEFAULT_LOCALE;
    } catch (error) {
      logger.error(
        tDefault("system:database.get_config_log", { guildId }),
        error,
      );
      return this.DEFAULT_LOCALE;
    }
  }

  /**
   * Guild別言語更新
   */
  async updateLocale(guildId: string, locale: string): Promise<void> {
    await this.updateConfig(guildId, { locale });
  }

  /**
   * 機能別の便利メソッド
   * 各取得メソッドは必要なフィールドのみ select して全体取得を避ける
   */
  async getAfkConfig(guildId: string): Promise<AfkConfig | null> {
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { afkConfig: true },
    });
    return this.safeJsonParse<AfkConfig>(record?.afkConfig ?? null) ?? null;
  }

  async setAfkChannel(guildId: string, channelId: string): Promise<void> {
    await this.updateAfkConfig(guildId, {
      enabled: true,
      channelId,
    });
  }

  async updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void> {
    const maxRetries = 3;
    const nextJson = JSON.stringify(afkConfig);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { afkConfig: true },
      });

      const rawConfig = record?.afkConfig ?? null;
      const existingConfig = this.safeJsonParse<AfkConfig>(rawConfig);

      if (!existingConfig) {
        if (record) {
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              afkConfig: null,
            },
            data: {
              afkConfig: nextJson,
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
              locale: this.DEFAULT_LOCALE,
              afkConfig: nextJson,
            },
          });
        }
        continue;
      }

      const updatedConfig: AfkConfig = {
        ...existingConfig,
        ...afkConfig,
      };

      const updatedJson = JSON.stringify(updatedConfig);
      if (updatedJson === rawConfig) {
        return;
      }

      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          afkConfig: rawConfig,
        },
        data: {
          afkConfig: updatedJson,
        },
      });

      if (result.count > 0) {
        return;
      }
    }

    throw new DatabaseError(
      tDefault("errors:database.update_config_failed") +
        `: afk config update conflict (${guildId})`,
    );
  }

  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    return this.bumpReminderStore.getBumpReminderConfig(guildId);
  }

  async setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void> {
    await this.bumpReminderStore.setBumpReminderEnabled(
      guildId,
      enabled,
      channelId,
    );
  }

  async updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void> {
    await this.bumpReminderStore.updateBumpReminderConfig(
      guildId,
      bumpReminderConfig,
    );
  }

  async setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult> {
    return this.bumpReminderStore.setBumpReminderMentionRole(guildId, roleId);
  }

  async addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult> {
    return this.bumpReminderStore.addBumpReminderMentionUser(guildId, userId);
  }

  async removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult> {
    return this.bumpReminderStore.removeBumpReminderMentionUser(
      guildId,
      userId,
    );
  }

  async clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult> {
    return this.bumpReminderStore.clearBumpReminderMentionUsers(guildId);
  }

  async clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult> {
    return this.bumpReminderStore.clearBumpReminderMentions(guildId);
  }

  async getVacConfig(guildId: string): Promise<VacConfig | null> {
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { vacConfig: true },
    });
    return this.safeJsonParse<VacConfig>(record?.vacConfig ?? null) ?? null;
  }

  async updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void> {
    await this.updateConfig(guildId, { vacConfig });
  }

  async getStickMessages(guildId: string): Promise<StickMessage[]> {
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { stickMessages: true },
    });
    return (
      this.safeJsonParse<StickMessage[]>(record?.stickMessages ?? null) ?? []
    );
  }

  async updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void> {
    await this.updateConfig(guildId, { stickMessages });
  }

  async getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null> {
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { memberLogConfig: true },
    });
    return (
      this.safeJsonParse<MemberLogConfig>(record?.memberLogConfig ?? null) ??
      null
    );
  }

  async updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void> {
    await this.updateConfig(guildId, { memberLogConfig });
  }

  /**
   * PrismaレコードをGuildConfigに変換
   */
  private recordToConfig(record: {
    id: string;
    guildId: string;
    locale: string;
    afkConfig: string | null;
    vacConfig: string | null;
    bumpReminderConfig: string | null;
    stickMessages: string | null;
    memberLogConfig: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): GuildConfig {
    return {
      guildId: record.guildId,
      locale: record.locale,
      afkConfig: this.safeJsonParse<AfkConfig>(record.afkConfig),
      vacConfig: this.safeJsonParse<VacConfig>(record.vacConfig),
      bumpReminderConfig: this.safeJsonParse<BumpReminderConfig>(
        record.bumpReminderConfig,
      ),
      stickMessages: this.safeJsonParse<StickMessage[]>(record.stickMessages),
      memberLogConfig: this.safeJsonParse<MemberLogConfig>(
        record.memberLogConfig,
      ),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * 安全なJSON.parse（エラーハンドリング付き）
   */
  private safeJsonParse<T>(json: string | null): T | undefined {
    if (!json) return undefined;
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      logger.error("Failed to parse JSON config", { json, error });
      return undefined;
    }
  }
}

/**
 * Repositoryインスタンス作成
 */
export const createGuildConfigRepository = (
  prisma: PrismaClient,
): IGuildConfigRepository => {
  return new PrismaGuildConfigRepository(prisma);
};
