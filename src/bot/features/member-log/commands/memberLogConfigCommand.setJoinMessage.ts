// src/bot/features/member-log/commands/memberLogConfigCommand.setJoinMessage.ts
// member-log-config set-join-message 実行処理

import {
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { MEMBER_LOG_CONFIG_COMMAND } from "./memberLogConfigCommand.constants";
import { ensureMemberLogManageGuildPermission } from "./memberLogConfigCommand.guard";

/**
 * カスタム参加メッセージ設定モーダルを表示する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleMemberLogConfigSetJoinMessage(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureMemberLogManageGuildPermission(interaction, guildId);

  const modal = new ModalBuilder()
    .setCustomId(MEMBER_LOG_CONFIG_COMMAND.SET_JOIN_MESSAGE_MODAL_ID)
    .setTitle(
      tDefault("commands:member-log-config.modal.set_join_message.title"),
    );

  const messageInput = new TextInputBuilder()
    .setCustomId(MEMBER_LOG_CONFIG_COMMAND.MODAL_INPUT_MESSAGE)
    .setLabel(
      tDefault("commands:member-log-config.modal.set_join_message.label"),
    )
    .setPlaceholder(
      tDefault("commands:member-log-config.modal.set_join_message.placeholder"),
    )
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput),
  );

  await interaction.showModal(modal);
}
