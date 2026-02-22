// src/bot/features/sticky-message/commands/usecases/stickyMessageSet.ts
// sticky-message set ユースケース（プレーンテキスト・モーダル入力）

import {
  ActionRowBuilder,
  ChannelType,
  type ChatInputCommandInteraction,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import { createWarningEmbed } from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/**
 * sticky-message set を実行する（モーダルを表示してプレーンテキストを入力させる）
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleStickyMessageSet(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // チャンネルオプションを取得し、テキストチャンネルであることを検証する
  const channelOption = interaction.options.getChannel(
    STICKY_MESSAGE_COMMAND.OPTION.CHANNEL,
    true,
  );

  if (channelOption.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          await tGuild(
            guildId,
            "commands:sticky-message.errors.text_channel_only",
          ),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const repository = getBotStickyMessageRepository();

  // 同チャンネルに既存設定がないか確認する
  const existing = await repository.findByChannel(channelOption.id);
  if (existing) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          await tGuild(
            guildId,
            "commands:sticky-message.set.alreadyExists.description",
          ),
          {
            title: await tGuild(
              guildId,
              "commands:sticky-message.set.alreadyExists.title",
            ),
          },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // モーダルを構築して表示する（tDefault は同期）
  const modal = new ModalBuilder()
    .setCustomId(
      `${STICKY_MESSAGE_COMMAND.SET_MODAL_ID_PREFIX}${channelOption.id}`,
    )
    .setTitle(tDefault("commands:sticky-message.set.modal.title"));

  const messageInput = new TextInputBuilder()
    .setCustomId(STICKY_MESSAGE_COMMAND.SET_MODAL_MESSAGE_INPUT_ID)
    .setLabel(tDefault("commands:sticky-message.set.modal.message.label"))
    .setPlaceholder(
      tDefault("commands:sticky-message.set.modal.message.placeholder"),
    )
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(2000);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput),
  );

  await interaction.showModal(modal);
}
