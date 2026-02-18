// src/bot/events/interactionCreate.ts
// インタラクション処理イベント

import { Events } from "discord.js";
import {
  handleCommandError,
  handleInteractionError,
} from "../../shared/errors/ErrorHandler";
import { tDefault, tGuild } from "../../shared/locale";
import type { BotEvent } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";
import type { BotClient } from "../client";
import { buttonHandlers } from "../handlers/buttons";
import { modalHandlers } from "../handlers/modals";

const INTERACTION_CONSTANTS = {
  DEFAULT_COOLDOWN_SECONDS: 3,
  REPLY_EPHEMERAL: true,
} as const;

export const interactionCreateEvent: BotEvent<typeof Events.InteractionCreate> =
  {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
      const client = interaction.client as BotClient;

      // スラッシュコマンド処理
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          logger.warn(
            tDefault("system:interaction.unknown_command", {
              commandName: interaction.commandName,
            }),
          );
          return;
        }

        // クールダウンチェック
        const cooldownTime =
          command.cooldown ?? INTERACTION_CONSTANTS.DEFAULT_COOLDOWN_SECONDS; // デフォルト3秒
        const remaining = client.cooldownManager.check(
          command.data.name,
          interaction.user.id,
          cooldownTime,
        );

        if (remaining > 0) {
          const guildId = interaction.guildId;
          const cooldownMessage = guildId
            ? await tGuild(guildId, "commands:cooldown.wait", {
                seconds: remaining,
              })
            : tDefault("commands:cooldown.wait", { seconds: remaining });
          await interaction.reply({
            content: cooldownMessage,
            ephemeral: INTERACTION_CONSTANTS.REPLY_EPHEMERAL,
          });
          return;
        }

        try {
          await command.execute(interaction);
          logger.debug(
            tDefault("system:interaction.command_executed", {
              commandName: command.data.name,
              userTag: interaction.user.tag,
            }),
          );
        } catch (error) {
          logger.error(
            tDefault("system:interaction.command_error", {
              commandName: command.data.name,
            }),
            error,
          );
          await handleCommandError(interaction, error);
        }
      }

      // オートコンプリート処理
      else if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);

        if (!command || !command.autocomplete) {
          return;
        }

        try {
          await command.autocomplete(interaction);
        } catch (error) {
          logger.error(
            tDefault("system:interaction.autocomplete_error", {
              commandName: interaction.commandName,
            }),
            error,
          );
        }
      }

      // モーダル送信処理
      else if (interaction.isModalSubmit()) {
        // まずプレフィックスマッチングハンドラー（modalHandlers レジストリ）を確認
        const registryHandler = modalHandlers.find((h) =>
          h.matches(interaction.customId),
        );
        if (registryHandler) {
          try {
            await registryHandler.execute(interaction);
            logger.debug(
              tDefault("system:interaction.modal_submitted", {
                customId: interaction.customId,
                userTag: interaction.user.tag,
              }),
            );
          } catch (error) {
            logger.error(
              tDefault("system:interaction.modal_error", {
                customId: interaction.customId,
              }),
              error,
            );
            await handleInteractionError(interaction, error);
          }
          return;
        }

        // フォールバック: client.modals コレクション（完全一致）
        const modal = client.modals.get(interaction.customId);

        if (!modal) {
          logger.warn(
            tDefault("system:interaction.unknown_modal", {
              customId: interaction.customId,
            }),
          );
          return;
        }

        try {
          await modal.execute(interaction);
          logger.debug(
            tDefault("system:interaction.modal_submitted", {
              customId: interaction.customId,
              userTag: interaction.user.tag,
            }),
          );
        } catch (error) {
          logger.error(
            tDefault("system:interaction.modal_error", {
              customId: interaction.customId,
            }),
            error,
          );
          await handleInteractionError(interaction, error);
        }
      }

      // ボタン処理
      else if (interaction.isButton()) {
        for (const handler of buttonHandlers) {
          if (handler.matches(interaction.customId)) {
            try {
              await handler.execute(interaction);
            } catch (error) {
              logger.error(
                tDefault("system:interaction.button_error", {
                  customId: interaction.customId,
                }),
                error,
              );
              await handleInteractionError(interaction, error);
            }
            break;
          }
        }
      }
    },
  };
