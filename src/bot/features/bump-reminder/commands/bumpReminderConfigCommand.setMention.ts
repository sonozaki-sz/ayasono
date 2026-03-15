// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.setMention.ts
// bump-reminder-config set-mention 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../shared/errors/customErrors";
import { BUMP_REMINDER_MENTION_ROLE_RESULT } from "../../../../shared/features/bump-reminder/bumpReminderConfigService";
import { tDefault, tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotBumpReminderConfigService } from "../../../services/botCompositionRoot";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { BUMP_REMINDER_CONFIG_COMMAND } from "./bumpReminderConfigCommand.constants";
import { ensureManageGuildPermission } from "./bumpReminderConfigCommand.guard";

/**
 * メンションロールを設定する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 */
export async function handleBumpReminderConfigSetMention(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureManageGuildPermission(interaction, guildId);

  // role オプションを取得（required: true なので必ず存在）
  const role = interaction.options.getRole(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.ROLE,
    true,
  );

  const bumpReminderConfigService = getBotBumpReminderConfigService();

  // ロールを上書き設定
  const roleResult = await bumpReminderConfigService.setBumpReminderMentionRole(
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

  // 変更内容を返信
  const roleMessage = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.set_mention_role_success",
    { role: `<@&${role.id}>` },
  );
  const embed = createSuccessEmbed(roleMessage, {
    title: await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.success_title",
    ),
  });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  // 監査用ログ
  logger.info(
    tDefault("system:bump-reminder.config_mention_set", {
      guildId,
      roleId: role.id,
      userIds: "none",
    }),
  );
}
