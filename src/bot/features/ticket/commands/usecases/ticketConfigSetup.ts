// src/bot/features/ticket/commands/usecases/ticketConfigSetup.ts
// チケット設定セットアップ処理

import crypto from "node:crypto";
import {
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
  RoleSelectMenuBuilder,
} from "discord.js";
import {
  logPrefixed,
  tInteraction,
} from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import { getBotTicketConfigService } from "../../../../services/botCompositionRoot";
import { createErrorEmbed } from "../../../../utils/messageResponse";
import { ticketSetupSessions } from "../../handlers/ui/ticketSetupState";
import {
  TICKET_CONFIG_COMMAND,
  TICKET_CUSTOM_ID,
  TICKET_MAX_STAFF_ROLES,
} from "../ticketCommand.constants";

/**
 * ticket-config setup サブコマンドを処理する
 * @param interaction コマンド実行インタラクション
 * @param guildId ギルドID
 */
export async function handleTicketConfigSetup(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const configService = getBotTicketConfigService();
  const category = interaction.options.getChannel(
    TICKET_CONFIG_COMMAND.OPTION.CATEGORY,
    true,
  );

  // 既にそのカテゴリに設定があるか確認
  const existingConfig = await configService.findByGuildAndCategory(
    guildId,
    category.id,
  );
  if (existingConfig) {
    const embed = createErrorEmbed(
      tInteraction(
        interaction.locale,
        "ticket:user-response.category_already_setup",
      ),
      { locale: interaction.locale },
    );
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // セッションを生成して保存
  const sessionId = crypto.randomUUID();
  ticketSetupSessions.set(sessionId, {
    categoryId: category.id,
    staffRoleIds: [],
    commandInteraction: interaction,
  });

  logger.info(
    logPrefixed("system:log_prefix.ticket", "ticket:log.setup", {
      guildId,
      categoryId: category.id,
    }),
  );

  // ロール選択メニューを送信
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId(`${TICKET_CUSTOM_ID.SETUP_ROLES_PREFIX}${sessionId}`)
    .setPlaceholder(
      tInteraction(interaction.locale, "ticket:ui.select.roles_placeholder"),
    )
    .setMinValues(1)
    .setMaxValues(TICKET_MAX_STAFF_ROLES);

  const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    roleSelect,
  );

  await interaction.reply({
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}
