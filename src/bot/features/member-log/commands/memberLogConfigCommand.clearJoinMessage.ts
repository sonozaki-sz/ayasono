// src/bot/features/member-log/commands/memberLogConfigCommand.clearJoinMessage.ts
// member-log-config clear-join-message 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { tDefault, tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotMemberLogConfigService } from "../../../services/botCompositionRoot";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { ensureMemberLogManageGuildPermission } from "./memberLogConfigCommand.guard";

/**
 * カスタム参加メッセージを削除する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleMemberLogConfigClearJoinMessage(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureMemberLogManageGuildPermission(interaction, guildId);

  // 参加メッセージを削除
  await getBotMemberLogConfigService().clearJoinMessage(guildId);

  const description = await tGuild(
    guildId,
    "commands:member-log-config.embed.clear_join_message_success",
  );
  const successTitle = await tGuild(
    guildId,
    "commands:member-log-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  // 監査用ログ
  logger.info(
    tDefault("system:member-log.config_join_message_cleared", { guildId }),
  );
}
