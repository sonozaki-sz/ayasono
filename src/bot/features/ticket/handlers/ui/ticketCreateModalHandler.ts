// src/bot/features/ticket/handlers/ui/ticketCreateModalHandler.ts
// チケット作成モーダル送信ハンドラ

import { MessageFlags, type ModalSubmitInteraction } from "discord.js";
import {
  logPrefixed,
  tInteraction,
} from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import type { ModalHandler } from "../../../../handlers/interactionCreate/ui/types";
import {
  getBotTicketConfigService,
  getBotTicketRepository,
} from "../../../../services/botCompositionRoot";
import { createSuccessEmbed } from "../../../../utils/messageResponse";
import { TICKET_CUSTOM_ID } from "../../commands/ticketCommand.constants";
import { createTicketChannel } from "../../services/ticketService";

/**
 * チケット作成モーダルの送信を処理するハンドラ
 */
export const ticketCreateModalHandler: ModalHandler = {
  matches(customId: string) {
    return customId.startsWith(TICKET_CUSTOM_ID.CREATE_MODAL_PREFIX);
  },

  async execute(interaction: ModalSubmitInteraction) {
    const categoryId = interaction.customId.slice(
      TICKET_CUSTOM_ID.CREATE_MODAL_PREFIX.length,
    );
    const subject = interaction.fields.getTextInputValue(
      TICKET_CUSTOM_ID.CREATE_MODAL_SUBJECT,
    );
    const detail = interaction.fields.getTextInputValue(
      TICKET_CUSTOM_ID.CREATE_MODAL_DETAIL,
    );

    const guild = interaction.guild;
    if (!guild) return;

    const configService = getBotTicketConfigService();
    const ticketRepository = getBotTicketRepository();

    const { channel } = await createTicketChannel(
      guild,
      categoryId,
      interaction.user.id,
      subject,
      detail,
      configService,
      ticketRepository,
    );

    logger.info(
      logPrefixed("system:log_prefix.ticket", "ticket:log.ticket_created", {
        guildId: guild.id,
        channelId: channel.id,
      }),
    );

    const embed = createSuccessEmbed(
      tInteraction(interaction.locale, "ticket:user-response.ticket_created", {
        channel: `<#${channel.id}>`,
      }),
      { locale: interaction.locale },
    );
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
