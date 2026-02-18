// src/bot/commands/ping.ts
// Pingコマンド - ボットの応答速度を確認

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { handleCommandError } from "../../shared/errors/ErrorHandler";
import { tGuild } from "../../shared/locale";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import type { Command } from "../../shared/types/discord";
import { createSuccessEmbed } from "../../shared/utils/messageResponse";

const PING_COMMAND = {
  NAME: "ping",
} as const;

const PING_I18N_KEYS = {
  COMMAND_DESCRIPTION: "ping.description",
  EMBED_MEASURING: "commands:ping.embed.measuring",
  EMBED_RESPONSE: "commands:ping.embed.response",
} as const;

/**
 * Pingコマンド
 * ボットのレイテンシー（応答速度）を確認する
 */
export const pingCommand: Command = {
  data: (() => {
    const desc = getCommandLocalizations(PING_I18N_KEYS.COMMAND_DESCRIPTION);
    return new SlashCommandBuilder()
      .setName(PING_COMMAND.NAME)
      .setDescription(desc.ja)
      .setDescriptionLocalizations(desc.localizations);
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const guildId = interaction.guildId ?? undefined;

      // 初回応答（タイムスタンプ計測用）
      const measuring = await tGuild(guildId, PING_I18N_KEYS.EMBED_MEASURING);
      await interaction.reply({
        content: measuring,
      });
      const sent = await interaction.fetchReply();

      // レイテンシー計算
      const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;
      const wsLatency = interaction.client.ws.ping;

      // 結果をEmbedで表示
      const description = await tGuild(guildId, PING_I18N_KEYS.EMBED_RESPONSE, {
        apiLatency,
        wsLatency,
      });

      const embed = createSuccessEmbed(description);

      await interaction.editReply({
        content: "",
        embeds: [embed],
      });
    } catch (error) {
      await handleCommandError(interaction, error);
    }
  },

  cooldown: 5,
};
