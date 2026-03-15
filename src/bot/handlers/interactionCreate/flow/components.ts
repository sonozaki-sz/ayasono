// src/bot/handlers/interactionCreate/flow/components.ts
// ボタン / セレクトメニュー インタラクションの共通ディスパッチ

import type {
  ButtonInteraction,
  RepliableInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { handleInteractionError } from "../../../errors/interactionErrorHandler";
import { buttonHandlers } from "../ui/buttons";
import {
  roleSelectHandlers,
  stringSelectHandlers,
  userSelectHandlers,
} from "../ui/selectMenus";
import type { InteractionHandler } from "../ui/types";

/**
 * customId に一致する最初のハンドラを検索し実行する汎用ディスパッチ関数
 * @param interaction 対象インタラクション
 * @param handlers ハンドラレジストリ
 * @param errorKey エラーログ用 i18n キー
 */
async function dispatchByCustomId<
  T extends RepliableInteraction & { customId: string },
>(
  interaction: T,
  handlers: readonly InteractionHandler<T>[],
  errorKey: string,
): Promise<void> {
  for (const handler of handlers) {
    if (handler.matches(interaction.customId)) {
      try {
        await handler.execute(interaction);
      } catch (error) {
        logger.error(
          tDefault(errorKey as Parameters<typeof tDefault>[0], {
            customId: interaction.customId,
          }),
          error,
        );
        await handleInteractionError(interaction, error);
      }
      // 最初に一致したハンドラのみ処理して終了
      break;
    }
  }
}

/**
 * ボタンインタラクションをレジストリ解決して実行する
 * @param interaction 対象ボタンインタラクション
 */
export function handleButton(interaction: ButtonInteraction): Promise<void> {
  return dispatchByCustomId(
    interaction,
    buttonHandlers,
    "system:interaction.button_error",
  );
}

/**
 * ユーザーセレクトメニューインタラクションを処理する
 * @param interaction 対象ユーザーセレクトインタラクション
 */
export function handleUserSelectMenu(
  interaction: UserSelectMenuInteraction,
): Promise<void> {
  return dispatchByCustomId(
    interaction,
    userSelectHandlers,
    "system:interaction.select_menu_error",
  );
}

/**
 * ロールセレクトメニューインタラクションを処理する
 * @param interaction 対象ロールセレクトインタラクション
 */
export function handleRoleSelectMenu(
  interaction: RoleSelectMenuInteraction,
): Promise<void> {
  return dispatchByCustomId(
    interaction,
    roleSelectHandlers,
    "system:interaction.select_menu_error",
  );
}

/**
 * 文字列セレクトメニューインタラクションを処理する
 * @param interaction 対象文字列セレクトインタラクション
 */
export function handleStringSelectMenu(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  return dispatchByCustomId(
    interaction,
    stringSelectHandlers,
    "system:interaction.select_menu_error",
  );
}
