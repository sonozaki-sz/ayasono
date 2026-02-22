// src/bot/features/sticky-message/commands/usecases/stickyMessageView.ts
// sticky-message view ユースケース

import {
  ChannelType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createInfoEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/** Embed コンテンツプレビューの最大文字数 */
const PREVIEW_MAX = 1024;

/**
 * sticky-message view を実行する
 * 指定チャンネルのスティッキーメッセージ設定内容を表示する
 */
export async function handleStickyMessageView(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  void guildId;

  const channelOption = interaction.options.getChannel(
    STICKY_MESSAGE_COMMAND.OPTION.CHANNEL,
    true,
  );

  if (channelOption.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:sticky-message.errors.text_channel_only"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const repository = getBotStickyMessageRepository();
  const sticky = await repository.findByChannel(channelOption.id);

  if (!sticky) {
    await interaction.reply({
      embeds: [
        createInfoEmbed(
          tDefault("commands:sticky-message.remove.notFound.description"),
          {
            title: tDefault("commands:sticky-message.view.notFound.title"),
          },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📌 ${tDefault("commands:sticky-message.view.title")}`)
    .setTimestamp(sticky.updatedAt);

  // チャンネル情報
  embed.addFields({
    name: tDefault("commands:sticky-message.view.field.channel"),
    value: `<#${sticky.channelId}>`,
    inline: true,
  });

  // 形式（プレーン or Embed）
  const format = sticky.embedData
    ? tDefault("commands:sticky-message.view.field.format_embed")
    : tDefault("commands:sticky-message.view.field.format_plain");
  embed.addFields({
    name: tDefault("commands:sticky-message.view.field.format"),
    value: format,
    inline: true,
  });

  // 設定日時
  const setAt = sticky.createdAt.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  embed.addFields({
    name: tDefault("commands:sticky-message.view.field.created_at"),
    value: setAt,
    inline: true,
  });

  // テキスト内容
  const preview =
    sticky.content.length > PREVIEW_MAX
      ? `${sticky.content.substring(0, PREVIEW_MAX)}...`
      : sticky.content;
  embed.addFields({
    name: tDefault("commands:sticky-message.view.field.content"),
    value: `\`\`\`\n${preview}\n\`\`\``,
    inline: false,
  });

  // Embed タイトルが設定されていれば表示
  if (sticky.embedData) {
    try {
      const parsed = JSON.parse(sticky.embedData) as {
        title?: string;
        color?: number;
      };
      if (parsed.title) {
        embed.addFields({
          name: tDefault("commands:sticky-message.view.field.embed_title"),
          value: parsed.title,
          inline: true,
        });
      }
      if (parsed.color !== undefined) {
        embed.addFields({
          name: tDefault("commands:sticky-message.view.field.embed_color"),
          value: `#${parsed.color.toString(16).toUpperCase().padStart(6, "0")}`,
          inline: true,
        });
      }
    } catch {
      // JSON パース失敗は無視
    }
  }

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
