// src/bot/commands/afk-config.ts
// AFK機能の設定コマンド（サーバー管理権限専用）

import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getGuildConfigRepository } from "../../shared/database";
import { ValidationError } from "../../shared/errors/CustomErrors";
import { handleCommandError } from "../../shared/errors/ErrorHandler";
import { getCommandLocalizations, tDefault, tGuild } from "../../shared/locale";
import type { Command } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";
import {
  createInfoEmbed,
  createSuccessEmbed,
} from "../../shared/utils/messageResponse";

const AFK_CONFIG_COMMAND = {
  NAME: "afk-config",
  SUBCOMMAND: {
    SET_CHANNEL: "set-ch",
    SHOW: "show",
  },
  OPTION: {
    CHANNEL: "channel",
  },
} as const;

/**
 * AFK設定コマンド（サーバー管理権限専用）
 */
export const afkConfigCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("afk-config.description");
    const setChDesc = getCommandLocalizations("afk-config.set-ch.description");
    const channelDesc = getCommandLocalizations(
      "afk-config.set-ch.channel.description",
    );
    const showDesc = getCommandLocalizations("afk-config.show.description");

    return new SlashCommandBuilder()
      .setName(AFK_CONFIG_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(AFK_CONFIG_COMMAND.SUBCOMMAND.SET_CHANNEL)
          .setDescription(setChDesc.ja)
          .setDescriptionLocalizations(setChDesc.localizations)
          .addChannelOption((option) =>
            option
              .setName(AFK_CONFIG_COMMAND.OPTION.CHANNEL)
              .setDescription(channelDesc.ja)
              .setDescriptionLocalizations(channelDesc.localizations)
              .addChannelTypes(ChannelType.GuildVoice)
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(AFK_CONFIG_COMMAND.SUBCOMMAND.SHOW)
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
        case AFK_CONFIG_COMMAND.SUBCOMMAND.SET_CHANNEL:
          await handleSetChannel(interaction, guildId);
          break;

        case AFK_CONFIG_COMMAND.SUBCOMMAND.SHOW:
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
 * チャンネル設定処理
 */
async function handleSetChannel(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // サーバー管理権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const channel = interaction.options.getChannel(
    AFK_CONFIG_COMMAND.OPTION.CHANNEL,
    true,
  );

  // VCチャンネルかチェック
  if (channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:afk.invalid_channel_type"),
    );
  }

  // Repository パターンでデータ保存（CAS更新で競合時の上書きを抑止）
  await getGuildConfigRepository().setAfkChannel(guildId, channel.id);

  // Guild別言語対応
  const description = await tGuild(
    guildId,
    "commands:afk-config.embed.set_ch_success",
    {
      channel: `<#${channel.id}>`,
    },
  );

  const embed = createSuccessEmbed(description);

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  logger.info(
    tDefault("system:afk.configured_log", { guildId, channelId: channel.id }),
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

  const config = await getGuildConfigRepository().getAfkConfig(guildId);

  const title = await tGuild(guildId, "commands:afk-config.embed.title");

  if (!config || !config.enabled || !config.channelId) {
    const description = await tGuild(
      guildId,
      "commands:afk-config.embed.not_configured",
    );
    const embed = createInfoEmbed(description, { title });
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  const fieldChannel = await tGuild(
    guildId,
    "commands:afk-config.embed.field.channel",
  );

  const embed = createInfoEmbed("", {
    title,
    fields: [
      { name: fieldChannel, value: `<#${config.channelId}>`, inline: true },
    ],
  });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export default afkConfigCommand;
