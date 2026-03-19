// src/bot/features/member-log/commands/memberLogConfigCommand.clearLeaveMessage.ts
// member-log-config clear-leave-message 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import {
  tDefault,
  tInteraction,
} from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotMemberLogConfigService } from "../../../services/botCompositionRoot";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { ensureMemberLogManageGuildPermission } from "./memberLogConfigCommand.guard";

/**
 * カスタム退出メッセージを削除する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleMemberLogConfigClearLeaveMessage(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureMemberLogManageGuildPermission(interaction, guildId);

  // 退出メッセージを削除
  await getBotMemberLogConfigService().clearLeaveMessage(guildId);

  const description = tInteraction(
    interaction.locale,
    "commands:member-log-config.embed.clear_leave_message_success",
  );
  const successTitle = tInteraction(
    interaction.locale,
    "commands:member-log-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  // 監査用ログ
  logger.info(
    tDefault("system:member-log.config_leave_message_cleared", { guildId }),
  );
}
