// src/bot/features/ticket/handlers/ui/ticketEditPanelModalHandler.ts
// パネル編集モーダル送信ハンドラ

import {
  EmbedBuilder,
  MessageFlags,
  type ModalSubmitInteraction,
  type TextChannel,
} from "discord.js";
import { tInteraction } from "../../../../../shared/locale/localeManager";
import type { ModalHandler } from "../../../../handlers/interactionCreate/ui/types";
import { getBotTicketConfigService } from "../../../../services/botCompositionRoot";
import {
  createErrorEmbed,
  createSuccessEmbed,
} from "../../../../utils/messageResponse";
import { TICKET_CUSTOM_ID } from "../../commands/ticketCommand.constants";

/**
 * パネル編集モーダルの送信を処理するハンドラ
 */
export const ticketEditPanelModalHandler: ModalHandler = {
  matches(customId: string) {
    return customId.startsWith(TICKET_CUSTOM_ID.EDIT_PANEL_MODAL_PREFIX);
  },

  async execute(interaction: ModalSubmitInteraction) {
    const categoryId = interaction.customId.slice(
      TICKET_CUSTOM_ID.EDIT_PANEL_MODAL_PREFIX.length,
    );
    const title = interaction.fields.getTextInputValue(
      TICKET_CUSTOM_ID.EDIT_PANEL_TITLE,
    );
    const description = interaction.fields.getTextInputValue(
      TICKET_CUSTOM_ID.EDIT_PANEL_DESCRIPTION,
    );
    const colorInput = interaction.fields
      .getTextInputValue(TICKET_CUSTOM_ID.EDIT_PANEL_COLOR)
      .trim();

    const configService = getBotTicketConfigService();
    const guildId = interaction.guildId;
    if (!guildId) return;

    // カラー値のバリデーション（空の場合は現在の値を維持）
    const panelColor =
      colorInput && /^#[0-9A-Fa-f]{6}$/.test(colorInput) ? colorInput : null;
    if (colorInput && !panelColor) {
      const embed = createErrorEmbed(
        tInteraction(interaction.locale, "ticket:user-response.invalid_color"),
        { locale: interaction.locale },
      );
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const config = await configService.findByGuildAndCategory(
      guildId,
      categoryId,
    );
    if (!config) {
      const embed = createErrorEmbed(
        tInteraction(
          interaction.locale,
          "ticket:user-response.config_not_found",
        ),
        { locale: interaction.locale },
      );
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const resolvedColor = panelColor ?? config.panelColor;

    // DB の設定を更新
    await configService.update(guildId, categoryId, {
      panelTitle: title,
      panelDescription: description,
      panelColor: resolvedColor,
    });

    // パネルメッセージの Embed を更新
    const guild = interaction.guild;
    try {
      const panelChannel = guild
        ? ((await guild.channels
            .fetch(config.panelChannelId)
            .catch(() => null)) as TextChannel | null)
        : null;
      if (panelChannel) {
        const panelMessage = await panelChannel.messages
          .fetch(config.panelMessageId)
          .catch(() => null);
        if (panelMessage) {
          const updatedEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(Number.parseInt(resolvedColor.slice(1), 16));
          await panelMessage.edit({
            embeds: [updatedEmbed],
          });
        }
      }
    } catch {
      // パネルメッセージの更新に失敗しても設定は保存済み
    }

    const embed = createSuccessEmbed(
      tInteraction(
        interaction.locale,
        "ticket:user-response.edit_panel_success",
      ),
      { locale: interaction.locale },
    );
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
