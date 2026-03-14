// src/bot/features/message-delete/commands/usecases/dialogUtils.ts
// ダイアログ共通ユーティリティ（型定義・モーダルヘルパー）

import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
} from "discord.js";
import type { AllParseKeys } from "../../../../../shared/locale/i18n";
import { tDefault } from "../../../../../shared/locale/localeManager";
import {
  MSG_DEL_CUSTOM_ID,
  MSG_DEL_MODAL_TIMEOUT_MS,
  type MessageDeleteFilter,
} from "../../constants/messageDeleteConstants";
import { parseDateStr } from "../../services/messageDeleteService";

// ===== 型定義 =====

/** コマンドオプションのパース・バリデーション結果 */
export interface ParsedOptions {
  count: number;
  /** ユーザーが count を明示指定したかどうか（ログ出力の有無に使用） */
  countSpecified: boolean;
  targetUserId?: string;
  keyword?: string;
  afterTs: number;
  beforeTs: number;
  afterStr?: string;
  beforeStr?: string;
  daysOption?: number;
  channelId?: string;
}

/** モーダルフィルター設定 */
export interface ModalFilterConfig {
  readonly modalId: string;
  readonly inputId: string;
  readonly titleKey: AllParseKeys;
  readonly labelKey: AllParseKeys;
  readonly placeholderKey: AllParseKeys;
  readonly apply: (
    value: string,
    current: MessageDeleteFilter,
    timezoneOffset: string,
  ) => { filter: MessageDeleteFilter; errorKey?: AllParseKeys };
}

export const DIALOG_TYPE = {
  Confirm: "confirm",
  Cancel: "cancel",
  Timeout: "timeout",
  Back: "back",
} as const;

export type PreviewResult =
  | {
      type: typeof DIALOG_TYPE.Cancel;
      lastInteraction: MessageComponentInteraction;
    }
  | { type: typeof DIALOG_TYPE.Timeout }
  | {
      type: typeof DIALOG_TYPE.Confirm;
      filter: MessageDeleteFilter;
      excludedIds: Set<string>;
      confirmInteraction: MessageComponentInteraction;
    };

export type FinalResult =
  | {
      type: typeof DIALOG_TYPE.Confirm;
      interaction: MessageComponentInteraction;
    }
  | {
      type: typeof DIALOG_TYPE.Cancel;
      interaction: MessageComponentInteraction;
    }
  | { type: typeof DIALOG_TYPE.Timeout }
  | { type: typeof DIALOG_TYPE.Back; interaction: MessageComponentInteraction };

// ===== モーダルフィルター設定マップ =====

export const MODAL_FILTER_CONFIG: Map<string, ModalFilterConfig> = new Map<
  string,
  ModalFilterConfig
>([
  [
    MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_KEYWORD,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_KEYWORD,
      titleKey: "commands:message-delete.modal.keyword.title",
      labelKey: "commands:message-delete.modal.keyword.label",
      placeholderKey: "commands:message-delete.modal.keyword.placeholder",
      apply: (value, current) => ({
        filter: { ...current, keyword: value || undefined },
      }),
    },
  ],
  [
    MSG_DEL_CUSTOM_ID.FILTER_DAYS,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_DAYS,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_DAYS,
      titleKey: "commands:message-delete.modal.days.title",
      labelKey: "commands:message-delete.modal.days.label",
      placeholderKey: "commands:message-delete.modal.days.placeholder",
      apply: (value, current) => {
        if (!value) return { filter: { ...current, days: undefined } };
        const days = parseInt(value, 10);
        if (isNaN(days) || days < 1) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.days_invalid_value" as const,
          };
        }
        return {
          filter: { ...current, days, after: undefined, before: undefined },
        };
      },
    },
  ],
  [
    MSG_DEL_CUSTOM_ID.FILTER_AFTER,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_AFTER,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_AFTER,
      titleKey: "commands:message-delete.modal.after.title",
      labelKey: "commands:message-delete.modal.after.label",
      placeholderKey: "commands:message-delete.modal.after.placeholder",
      apply: (value, current, timezoneOffset) => {
        if (!value) return { filter: { ...current, after: undefined } };
        const afterDate = parseDateStr(value, false, timezoneOffset);
        if (!afterDate) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.after_invalid_format" as const,
          };
        }
        if (current.before && afterDate >= current.before) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.date_range_invalid" as const,
          };
        }
        // afterRaw: ボタンラベルにユーザー入力値をそのまま表示するために保存
        return {
          filter: {
            ...current,
            after: afterDate,
            afterRaw: value,
            days: undefined,
          },
        };
      },
    },
  ],
  [
    MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
    {
      modalId: MSG_DEL_CUSTOM_ID.MODAL_BEFORE,
      inputId: MSG_DEL_CUSTOM_ID.MODAL_INPUT_BEFORE,
      titleKey: "commands:message-delete.modal.before.title",
      labelKey: "commands:message-delete.modal.before.label",
      placeholderKey: "commands:message-delete.modal.before.placeholder",
      apply: (value, current, timezoneOffset) => {
        if (!value) return { filter: { ...current, before: undefined } };
        const beforeDate = parseDateStr(value, true, timezoneOffset);
        if (!beforeDate) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.before_invalid_format" as const,
          };
        }
        if (current.after && current.after >= beforeDate) {
          return {
            filter: current,
            errorKey:
              "commands:message-delete.errors.date_range_invalid" as const,
          };
        }
        // beforeRaw: ボタンラベルにユーザー入力値をそのまま表示するために保存
        return {
          filter: {
            ...current,
            before: beforeDate,
            beforeRaw: value,
            days: undefined,
          },
        };
      },
    },
  ],
]);

// ===== モーダルヘルパー =====

/**
 * フィルターモーダルを表示してユーザーの入力値を返す
 * @param i モーダルを表示するトリガーの MessageComponentInteraction
 * @param config モーダルの設定（タイトル・ラベル・プレースホルダー等）
 * @returns ユーザーの入力値（トリム済み）、キャンセル/タイムアウト時は null
 */
export async function showFilterModal(
  i: MessageComponentInteraction,
  config: ModalFilterConfig,
): Promise<string | null> {
  const modal = new ModalBuilder()
    .setCustomId(config.modalId)
    .setTitle(tDefault(config.titleKey))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(config.inputId)
          .setLabel(tDefault(config.labelKey))
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder(tDefault(config.placeholderKey)),
      ),
    );

  await i.showModal(modal);
  const submit = await i
    .awaitModalSubmit({ time: MSG_DEL_MODAL_TIMEOUT_MS })
    .catch(() => null);
  if (!submit) return null;
  await submit.deferUpdate();
  return submit.fields.getTextInputValue(config.inputId).trim();
}

/**
 * モーダル入力値を MODAL_FILTER_CONFIG に基づいてフィルターに適用する
 * @param customId ボタンの customId（フィルター種別を特定するために使用）
 * @param value モーダルに入力された値
 * @param currentFilter 現在のフィルター状態
 * @param timezoneOffset 日付パース時に使用するタイムゾーンオフセット
 * @returns 新しいフィルター状態（エラーの場合は errorKey を含む）
 */
export function applyModalFilterValue(
  customId: string,
  value: string,
  currentFilter: MessageDeleteFilter,
  timezoneOffset: string,
): { filter: MessageDeleteFilter; errorKey?: AllParseKeys } {
  return (
    MODAL_FILTER_CONFIG.get(customId)?.apply(
      value,
      currentFilter,
      timezoneOffset,
    ) ?? {
      filter: currentFilter,
    }
  );
}

/**
 * ページジャンプモーダルを表示してユーザーの入力文字列を返す
 * @param i モーダルを表示するトリガーの MessageComponentInteraction
 * @param totalPages 総ページ数（プレースホルダーに使用）
 * @returns ユーザーの入力文字列（トリム済み）、キャンセル/タイムアウト時は null
 */
export async function showJumpModal(
  i: MessageComponentInteraction | ChatInputCommandInteraction,
  totalPages: number,
): Promise<string | null> {
  const modal = new ModalBuilder()
    .setCustomId(MSG_DEL_CUSTOM_ID.MODAL_JUMP)
    .setTitle(tDefault("commands:message-delete.modal.jump.title"))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(MSG_DEL_CUSTOM_ID.MODAL_INPUT_JUMP)
          .setLabel(tDefault("commands:message-delete.modal.jump.label"))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(
            tDefault("commands:message-delete.modal.jump.placeholder", {
              total: totalPages,
            }),
          ),
      ),
    );

  await i.showModal(modal);
  const submit = await i
    .awaitModalSubmit({ time: MSG_DEL_MODAL_TIMEOUT_MS })
    .catch(() => null);
  if (!submit) return null;
  await submit.deferUpdate();
  return submit.fields
    .getTextInputValue(MSG_DEL_CUSTOM_ID.MODAL_INPUT_JUMP)
    .trim();
}
