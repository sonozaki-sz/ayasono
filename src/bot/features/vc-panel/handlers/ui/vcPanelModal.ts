// src/bot/features/vc-panel/handlers/ui/vcPanelModal.ts
// VC操作パネルのモーダル処理（VAC・VC募集など共用）

import {
  ChannelType,
  MessageFlags,
  type GuildMember,
  type ModalSubmitInteraction,
} from "discord.js";
import { tInteraction } from "../../../../../shared/locale/localeManager";
import type { ModalHandler } from "../../../../handlers/interactionCreate/ui/types";
import { safeReply } from "../../../../utils/interaction";
import {
  createErrorEmbed,
  createSuccessEmbed,
} from "../../../../utils/messageResponse";
import {
  getVacPanelChannelId,
  VAC_PANEL_CUSTOM_ID,
} from "../../vcControlPanel";
import { isVcPanelManagedChannel } from "../../vcPanelOwnershipRegistry";

// Discord VC userLimit の許容範囲（0 は無制限）
const LIMIT_MIN = 0;
const LIMIT_MAX = 99;

export const vcPanelModalHandler: ModalHandler = {
  /**
   * ハンドラー対象の customId かを判定する
   * @param customId 判定対象の customId
   * @returns VC操作パネルモーダルなら true
   */
  matches(customId) {
    return (
      customId.startsWith(VAC_PANEL_CUSTOM_ID.RENAME_MODAL_PREFIX) ||
      customId.startsWith(VAC_PANEL_CUSTOM_ID.LIMIT_MODAL_PREFIX)
    );
  },

  /**
   * VC操作パネルのモーダル送信を処理する
   * @param interaction モーダルインタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: ModalSubmitInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      return;
    }

    const isRename = interaction.customId.startsWith(
      VAC_PANEL_CUSTOM_ID.RENAME_MODAL_PREFIX,
    );
    const channelId = getVacPanelChannelId(
      interaction.customId,
      isRename
        ? VAC_PANEL_CUSTOM_ID.RENAME_MODAL_PREFIX
        : VAC_PANEL_CUSTOM_ID.LIMIT_MODAL_PREFIX,
    );

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            tInteraction(interaction.locale, "errors:vac.not_vac_channel"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 登録済みチェッカーで管理対象かを判定
    if (!(await isVcPanelManagedChannel(guild.id, channel.id))) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            tInteraction(interaction.locale, "errors:vac.not_vac_channel"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = (await guild.members
      .fetch(interaction.user.id)
      .catch(() => null)) as GuildMember | null;

    if (!member || member.voice.channelId !== channel.id) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            tInteraction(interaction.locale, "errors:vac.not_in_vc"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (isRename) {
      const newName = interaction.fields
        .getTextInputValue(VAC_PANEL_CUSTOM_ID.RENAME_INPUT)
        .trim();
      if (!newName) {
        await safeReply(interaction, {
          embeds: [
            createErrorEmbed(
              tInteraction(interaction.locale, "errors:vac.not_vac_channel"),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await channel.edit({ name: newName });
      await safeReply(interaction, {
        embeds: [
          createSuccessEmbed(
            tInteraction(interaction.locale, "commands:vac.embed.renamed", {
              name: newName,
            }),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const rawLimit = interaction.fields
      .getTextInputValue(VAC_PANEL_CUSTOM_ID.LIMIT_INPUT)
      .trim();
    const limit = Number.parseInt(rawLimit, 10);

    if (!Number.isInteger(limit) || limit < LIMIT_MIN || limit > LIMIT_MAX) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            tInteraction(interaction.locale, "errors:vac.limit_out_of_range"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await channel.edit({ userLimit: limit });

    const limitLabel =
      limit === 0
        ? tInteraction(interaction.locale, "commands:vac.embed.unlimited")
        : String(limit);

    await safeReply(interaction, {
      embeds: [
        createSuccessEmbed(
          tInteraction(interaction.locale, "commands:vac.embed.limit_changed", {
            limit: limitLabel,
          }),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
