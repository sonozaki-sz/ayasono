// src/bot/handlers/buttons/bumpPanel.ts
// Bumpパネルのボタン処理

import type { ButtonInteraction } from "discord.js";
import {
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  getGuildConfigRepository,
} from "../../../shared/database";
import { BUMP_CONSTANTS } from "../../../shared/features/bump-reminder";
import { tDefault } from "../../../shared/locale";
import { getGuildTranslator } from "../../../shared/locale/helpers";
import { safeReply } from "../../../shared/utils/interaction";
import { logger } from "../../../shared/utils/logger";
import {
  createErrorEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../shared/utils/messageResponse";
import type { ButtonHandler } from "./index";

const BUMP_PANEL_LOG_CONSTANTS = {
  ACTION_PREFIX: "Bump mention",
  ACTION_FOR_USER: "for user",
  ACTION_IN_GUILD: "in guild",
  HANDLE_FAILED: "Failed to handle bump panel button",
  REPLY_FAILED: "Failed to send error reply",
} as const;

export const bumpPanelButtonHandler: ButtonHandler = {
  matches(customId) {
    return (
      customId.startsWith(BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON) ||
      customId.startsWith(BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_OFF)
    );
  },

  async execute(interaction: ButtonInteraction) {
    try {
      const customId = interaction.customId;
      const isAdding = customId.startsWith(
        BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON,
      );
      const prefix = isAdding
        ? BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON
        : BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_OFF;
      const guildId = customId.slice(prefix.length);

      if (!interaction.guild || interaction.guild.id !== guildId) {
        await safeReply(interaction, {
          content: tDefault("events:bump-reminder.panel.error"),
          ephemeral: true,
        });
        return;
      }

      const guildConfigRepository = getGuildConfigRepository();
      const userId = interaction.user.id;

      // ギルドの翻訳関数を取得
      const tGuild = await getGuildTranslator(guildId);

      const successTitle = tGuild("events:bump-reminder.panel.success_title");

      if (isAdding) {
        const result = await guildConfigRepository.addBumpReminderMentionUser(
          guildId,
          userId,
        );

        if (result === BUMP_REMINDER_MENTION_USER_ADD_RESULT.NOT_CONFIGURED) {
          await safeReply(interaction, {
            content: tDefault("events:bump-reminder.panel.error"),
            ephemeral: true,
          });
          return;
        }

        if (result === BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS) {
          // 既に追加済み → 警告
          await safeReply(interaction, {
            embeds: [
              createWarningEmbed(
                tGuild("events:bump-reminder.panel.already_added"),
              ),
            ],
            ephemeral: true,
          });
          return;
        }

        await safeReply(interaction, {
          embeds: [
            createSuccessEmbed(
              tGuild("events:bump-reminder.panel.mention_added", {
                user: `<@${userId}>`,
              }),
              { title: successTitle },
            ),
          ],
          ephemeral: true,
        });
      } else {
        const result =
          await guildConfigRepository.removeBumpReminderMentionUser(
            guildId,
            userId,
          );

        if (
          result === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_CONFIGURED
        ) {
          await safeReply(interaction, {
            content: tDefault("events:bump-reminder.panel.error"),
            ephemeral: true,
          });
          return;
        }

        if (result === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_FOUND) {
          // リストにない → 警告
          await safeReply(interaction, {
            embeds: [
              createWarningEmbed(
                tGuild("events:bump-reminder.panel.not_in_list"),
              ),
            ],
            ephemeral: true,
          });
          return;
        }

        await safeReply(interaction, {
          embeds: [
            createSuccessEmbed(
              tGuild("events:bump-reminder.panel.mention_removed", {
                user: `<@${userId}>`,
              }),
              { title: successTitle },
            ),
          ],
          ephemeral: true,
        });
      }

      logger.debug(
        `${BUMP_PANEL_LOG_CONSTANTS.ACTION_PREFIX} ${
          isAdding
            ? BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED
            : BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED
        } ${BUMP_PANEL_LOG_CONSTANTS.ACTION_FOR_USER} ${userId} ${BUMP_PANEL_LOG_CONSTANTS.ACTION_IN_GUILD} ${guildId}`,
      );
    } catch (error) {
      logger.error(BUMP_PANEL_LOG_CONSTANTS.HANDLE_FAILED, error);
      try {
        await safeReply(interaction, {
          embeds: [
            createErrorEmbed(tDefault("events:bump-reminder.panel.error"), {
              title: tDefault("errors:general.error_title"),
            }),
          ],
          ephemeral: true,
        });
      } catch (replyError) {
        logger.error(BUMP_PANEL_LOG_CONSTANTS.REPLY_FAILED, replyError);
      }
    }
  },
};
