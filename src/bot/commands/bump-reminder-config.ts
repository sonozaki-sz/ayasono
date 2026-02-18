// src/bot/commands/bump-reminder-config.ts
// Bumpリマインダー機能の設定コマンド（サーバー管理権限専用）

import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  DiscordAPIError,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  getGuildConfigRepository,
} from "../../shared/database";
import type { BumpReminderConfig } from "../../shared/database/repositories/GuildConfigRepository";
import { ValidationError } from "../../shared/errors/CustomErrors";
import { handleCommandError } from "../../shared/errors/ErrorHandler";
import { getBumpReminderManager } from "../../shared/features/bump-reminder";
import { getCommandLocalizations, tDefault, tGuild } from "../../shared/locale";
import type { Command } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";
import {
  createErrorEmbed,
  createInfoEmbed,
  createSuccessEmbed,
} from "../../shared/utils/messageResponse";

const BUMP_REMINDER_CONFIG_COMMAND = {
  NAME: "bump-reminder-config",
  SUBCOMMAND: {
    ENABLE: "enable",
    DISABLE: "disable",
    SET_MENTION: "set-mention",
    REMOVE_MENTION: "remove-mention",
    SHOW: "show",
  },
  OPTION: {
    ROLE: "role",
    USER: "user",
    TARGET: "target",
  },
  TARGET_VALUE: {
    ROLE: "role",
    USER: "user",
    USERS: "users",
    ALL: "all",
  },
  CUSTOM_ID_PREFIX: {
    REMOVE_USERS: "bump-remove-users-",
  },
} as const;

/**
 * Bumpリマインダー設定コマンド（サーバー管理権限専用）
 */
export const bumpReminderConfigCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("bump-reminder-config.description");
    const enableDesc = getCommandLocalizations(
      "bump-reminder-config.enable.description",
    );
    const disableDesc = getCommandLocalizations(
      "bump-reminder-config.disable.description",
    );
    const setMentionDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.description",
    );
    const roleDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.role.description",
    );
    const userDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.user.description",
    );
    const removeMentionDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.description",
    );
    const targetDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.description",
    );
    const targetRoleDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.role",
    );
    const targetUserDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.user",
    );
    const targetUsersDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.users",
    );
    const targetAllDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.all",
    );
    const showDesc = getCommandLocalizations(
      "bump-reminder-config.show.description",
    );

    return new SlashCommandBuilder()
      .setName(BUMP_REMINDER_CONFIG_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE)
          .setDescription(enableDesc.ja)
          .setDescriptionLocalizations(enableDesc.localizations),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.DISABLE)
          .setDescription(disableDesc.ja)
          .setDescriptionLocalizations(disableDesc.localizations),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SET_MENTION)
          .setDescription(setMentionDesc.ja)
          .setDescriptionLocalizations(setMentionDesc.localizations)
          .addRoleOption((option) =>
            option
              .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.ROLE)
              .setDescription(roleDesc.ja)
              .setDescriptionLocalizations(roleDesc.localizations)
              .setRequired(false),
          )
          .addUserOption((option) =>
            option
              .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.USER)
              .setDescription(userDesc.ja)
              .setDescriptionLocalizations(userDesc.localizations)
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.REMOVE_MENTION)
          .setDescription(removeMentionDesc.ja)
          .setDescriptionLocalizations(removeMentionDesc.localizations)
          .addStringOption((option) =>
            option
              .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.TARGET)
              .setDescription(targetDesc.ja)
              .setDescriptionLocalizations(targetDesc.localizations)
              .setRequired(true)
              .addChoices(
                {
                  name: targetRoleDesc.ja,
                  name_localizations: targetRoleDesc.localizations,
                  value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ROLE,
                },
                {
                  name: targetUserDesc.ja,
                  name_localizations: targetUserDesc.localizations,
                  value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USER,
                },
                {
                  name: targetUsersDesc.ja,
                  name_localizations: targetUsersDesc.localizations,
                  value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USERS,
                },
                {
                  name: targetAllDesc.ja,
                  name_localizations: targetAllDesc.localizations,
                  value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ALL,
                },
              ),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SHOW)
          .setDescription(showDesc.ja)
          .setDescriptionLocalizations(showDesc.localizations),
      );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Guild ID取得
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError(tDefault("errors:validation.guild_only"));
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE:
          await handleEnable(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.DISABLE:
          await handleDisable(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SET_MENTION:
          await handleSetMention(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.REMOVE_MENTION:
          await handleRemoveMention(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SHOW:
          await handleShowSetting(interaction, guildId);
          break;

        default:
          throw new ValidationError(
            tDefault("errors:validation.invalid_subcommand"),
          );
      }
    } catch (error) {
      // 統一エラーハンドリング
      await handleCommandError(interaction, error);
    }
  },

  cooldown: 3,
};

/**
 * 機能有効化処理
 */
async function handleEnable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // サーバー管理権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  // チャンネルIDを保存（メッセージ送信時に必要）
  const channelId = interaction.channelId;

  // 新しい設定を保存（メンション設定は原子的に保持）
  await getGuildConfigRepository().setBumpReminderEnabled(
    guildId,
    true,
    channelId,
  );

  // 成功メッセージ
  const description = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.enable_success",
  );
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  logger.info(
    tDefault("system:log.bump_reminder_enabled", { guildId, channelId }),
  );
}

/**
 * 機能無効化処理
 */
async function handleDisable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // サーバー管理権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  // 進行中のタイマーをキャンセル
  const bumpReminderManager = getBumpReminderManager();
  await bumpReminderManager.cancelReminder(guildId);

  // 設定を無効化（メンション設定は原子的に保持）
  await getGuildConfigRepository().setBumpReminderEnabled(guildId, false);

  // 成功メッセージ
  const description = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.disable_success",
  );
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  logger.info(tDefault("system:log.bump_reminder_disabled", { guildId }));
}

/**
 * メンションロール・ユーザー設定処理
 */
async function handleSetMention(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // サーバー管理権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const role = interaction.options.getRole(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.ROLE,
  );
  const user = interaction.options.getUser(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.USER,
  );
  const guildConfigRepository = getGuildConfigRepository();
  const currentConfig =
    await guildConfigRepository.getBumpReminderConfig(guildId);

  // どちらも指定されていない場合はエラー（他のバリデーションと一貫して ValidationError をスロー）
  if (!role && !user) {
    throw new ValidationError(
      await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.set_mention_error",
      ),
    );
  }

  let userMessage = "";
  let latestConfig = currentConfig;

  if (user) {
    const addResult = await guildConfigRepository.addBumpReminderMentionUser(
      guildId,
      user.id,
    );

    if (addResult === BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED) {
      userMessage = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.set_mention_user_added",
        {
          user: `<@${user.id}>`,
        },
      );
    } else if (
      addResult === BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS
    ) {
      const removeResult =
        await guildConfigRepository.removeBumpReminderMentionUser(
          guildId,
          user.id,
        );

      if (
        removeResult === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_CONFIGURED
      ) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.set_mention_error",
          ),
        );
      }

      userMessage = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.set_mention_user_removed",
        {
          user: `<@${user.id}>`,
        },
      );
    } else {
      throw new ValidationError(
        await tGuild(
          guildId,
          "commands:bump-reminder-config.embed.set_mention_error",
        ),
      );
    }

    latestConfig = await guildConfigRepository.getBumpReminderConfig(guildId);
  }

  if (role) {
    const roleResult = await guildConfigRepository.setBumpReminderMentionRole(
      guildId,
      role.id,
    );
    if (roleResult === BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED) {
      throw new ValidationError(
        await tGuild(
          guildId,
          "commands:bump-reminder-config.embed.set_mention_error",
        ),
      );
    }
    latestConfig = await guildConfigRepository.getBumpReminderConfig(guildId);
  }

  const finalMentionRoleId = latestConfig?.mentionRoleId;
  const finalMentionUserIds = latestConfig?.mentionUserIds ?? [];

  const messages: string[] = [];
  if (role) {
    const roleMessage = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.set_mention_role_success",
      {
        role: `<@&${role.id}>`,
      },
    );
    messages.push(roleMessage);
  }
  if (userMessage) {
    messages.push(userMessage);
  }

  const embed = createSuccessEmbed(messages.join("\n"), {
    title: await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.success_title",
    ),
  });
  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  logger.info(
    tDefault("system:log.bump_reminder_mention_set", {
      guildId,
      roleId: finalMentionRoleId || "none",
      userIds: finalMentionUserIds.join(",") || "none",
    }),
  );
}

/**
 * 設定表示処理
 */
async function handleShowSetting(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // サーバー管理権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const config =
    await getGuildConfigRepository().getBumpReminderConfig(guildId);

  // 設定がない場合
  if (!config) {
    const title = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.title",
    );
    const message = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.not_configured",
    );
    const embed = createInfoEmbed(message, { title });
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // 設定表示
  const showTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.title",
  );
  const fieldStatus = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.status",
  );
  const fieldMentionRole = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.mention_role",
  );
  const fieldMentionUsers = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.mention_users",
  );
  const labelEnabled = await tGuild(guildId, "common:enabled");
  const labelDisabled = await tGuild(guildId, "common:disabled");
  const labelNone = await tGuild(guildId, "common:none");

  const embed = createInfoEmbed("", {
    title: showTitle,
    fields: [
      {
        name: fieldStatus,
        value: config.enabled ? labelEnabled : labelDisabled,
        inline: true,
      },
      {
        name: fieldMentionRole,
        value: config.mentionRoleId ? `<@&${config.mentionRoleId}>` : labelNone,
        inline: true,
      },
      {
        name: fieldMentionUsers,
        value:
          config.mentionUserIds && config.mentionUserIds.length > 0
            ? config.mentionUserIds.map((id: string) => `<@${id}>`).join(", ")
            : labelNone,
        inline: false,
      },
    ],
  });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

/**
 * メンション削除処理
 */
async function handleRemoveMention(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // サーバー管理権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const target = interaction.options.getString(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.TARGET,
    true,
  );
  const guildConfigRepository = getGuildConfigRepository();
  const currentConfig =
    await guildConfigRepository.getBumpReminderConfig(guildId);
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );

  switch (target) {
    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ROLE: {
      // ロール設定を削除
      const result = await guildConfigRepository.setBumpReminderMentionRole(
        guildId,
        undefined,
      );
      if (result === BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.not_configured",
          ),
        );
      }

      const roleDescription = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.remove_mention_role",
      );
      const roleEmbed = createSuccessEmbed(roleDescription, {
        title: successTitle,
      });
      await interaction.reply({
        embeds: [roleEmbed],
        ephemeral: true,
      });
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      break;
    }

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USER:
      // ユーザー選択UIを表示（ログは handleUserSelectionUI 内で成功時のみ記録）
      await handleUserSelectionUI(interaction, guildId, currentConfig);
      break;

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USERS: {
      // 全ユーザー削除
      const result =
        await guildConfigRepository.clearBumpReminderMentionUsers(guildId);
      if (result === BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.NOT_CONFIGURED) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.not_configured",
          ),
        );
      }

      const usersDescription = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.remove_mention_users",
      );
      const usersEmbed = createSuccessEmbed(usersDescription, {
        title: successTitle,
      });
      await interaction.reply({
        embeds: [usersEmbed],
        ephemeral: true,
      });
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      break;
    }

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ALL: {
      // ロール＋全ユーザー削除
      const result =
        await guildConfigRepository.clearBumpReminderMentions(guildId);
      if (result === BUMP_REMINDER_MENTION_CLEAR_RESULT.NOT_CONFIGURED) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.not_configured",
          ),
        );
      }

      const allDescription = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.remove_mention_all",
      );
      const allEmbed = createSuccessEmbed(allDescription, {
        title: successTitle,
      });
      await interaction.reply({
        embeds: [allEmbed],
        ephemeral: true,
      });
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      break;
    }
  }
}

/**
 * ユーザー選択UI処理
 */
async function handleUserSelectionUI(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  currentConfig: BumpReminderConfig | null,
): Promise<void> {
  const mentionUserIds = currentConfig?.mentionUserIds ?? [];

  // ユーザーが登録されていない場合
  if (mentionUserIds.length === 0) {
    const title = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.remove_mention_error_title",
    );
    const description = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.remove_mention_error_no_users",
    );
    const embed = createErrorEmbed(description, { title });
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // Discord の SelectMenu はオプション数が最大 25 件に制限されているため切り詰める
  const SELECT_MENU_OPTION_LIMIT = 25;
  const displayedUserIds = mentionUserIds.slice(0, SELECT_MENU_OPTION_LIMIT);

  // メンションユーザーの表示名を取得してSelectMenuのオプションを構築
  const memberOptions = await Promise.all(
    displayedUserIds.map(async (userId: string) => {
      const member = await interaction.guild?.members
        .fetch(userId)
        .catch(() => null);
      // 優先順位: サーバーニックネーム → ユーザー名 → ID
      const displayName =
        member?.displayName ?? member?.user.username ?? userId;
      return {
        label: displayName.slice(0, 100), // Discord の 100文字制限に対応
        description: `ID: ${userId}`,
        value: userId,
      };
    }),
  );

  // StringSelectMenuを作成
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(
      `${BUMP_REMINDER_CONFIG_COMMAND.CUSTOM_ID_PREFIX.REMOVE_USERS}${guildId}`,
    )
    .setPlaceholder(
      await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.select_users_to_remove",
      ),
    )
    .setMinValues(1)
    .setMaxValues(displayedUserIds.length)
    .addOptions(memberOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu,
  );

  const prompt = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.select_users_to_remove",
  );
  const response = await interaction.reply({
    content: prompt,
    components: [row],
    ephemeral: true,
  });

  // インタラクションを待機（30秒）
  try {
    const selectInteraction = await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) =>
        i.customId ===
          `${BUMP_REMINDER_CONFIG_COMMAND.CUSTOM_ID_PREFIX.REMOVE_USERS}${guildId}` &&
        i.user.id === interaction.user.id,
      time: 30000, // 30秒（ユーザーが選択するのに十分な時間）
    });

    const selectedUserIds = selectInteraction.values;
    const guildConfigRepository = getGuildConfigRepository();
    let removedCount = 0;

    for (const userId of selectedUserIds) {
      const result = await guildConfigRepository.removeBumpReminderMentionUser(
        guildId,
        userId,
      );
      if (result === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED) {
        removedCount++;
      }
    }

    const description = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.remove_mention_select",
      {
        users: selectedUserIds.map((id: string) => `<@${id}>`).join("\n"),
      },
    );
    const successTitle = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.success_title",
    );
    const embed = createSuccessEmbed(description, { title: successTitle });
    await selectInteraction.update({
      content: "",
      embeds: [embed],
      components: [],
    });

    logger.info(
      tDefault("system:log.bump_reminder_users_removed", {
        guildId,
        count: removedCount,
      }),
    );
  } catch (error) {
    // Discord API エラー（ネットワーク障害等）は上位に再スローして統一エラーハンドラに委譲
    if (error instanceof DiscordAPIError) {
      throw error;
    }
    // awaitMessageComponent は time 切れ時に "reason: time" を含む Error をスローする。
    // それ以外の予期しないエラーは再スロー。
    // ※以前の実装では code === "InteractionCollectorError" チェックを行っていたが、
    //   discord.js は実際にこの code をセットしないため常に false となる dead code だった。
    //   また message.includes("time") は "time" を含む無関係なエラーまで捕捉する恐れがあるため、
    //   より具体的なメッセージマッチに修正した。
    if (error instanceof Error && !error.message.includes("reason: time")) {
      // タイムアウト以外の予期しないエラーは再スロー
      throw error;
    }
    // セレクトメニューのコレクタータイムアウト
    await interaction.editReply({
      content: await tGuild(guildId, "errors:interaction.timeout"),
      components: [],
    });
  }
}
