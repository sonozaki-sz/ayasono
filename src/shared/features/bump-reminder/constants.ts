// src/shared/features/bump-reminder/constants.ts
// Bumpリマインダー機能の定数定義

import { env } from "../../config/env";

/**
 * Bumpリマインダー機能の定数
 */
export const BUMP_CONSTANTS = {
  /** Disboard Bot ID */
  DISBOARD_BOT_ID: "302050872383242240",

  /** ディス速 Bot ID */
  DISSOKU_BOT_ID: "761562078095867916",

  /** カスタムID接頭辞 */
  CUSTOM_ID_PREFIX: {
    MENTION_ON: "bump_mention_on:",
    MENTION_OFF: "bump_mention_off:",
  },

  /** ジョブID接頭辞 */
  JOB_ID_PREFIX: "bump-reminder-",
} as const;

/**
 * Bumpリマインダーの状態
 */
export const BUMP_REMINDER_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  CANCELLED: "cancelled",
} as const;

/**
 * Bump検知対象のサービス名
 */
export const BUMP_SERVICES = {
  DISBOARD: "Disboard",
  DISSOKU: "Dissoku",
} as const;

/**
 * Bump検知対象のコマンド名
 */
export const BUMP_COMMANDS = {
  DISBOARD: "bump",
  DISSOKU: "up",
} as const;

/**
 * Bot ID + コマンド名の検知ルール
 */
export const BUMP_DETECTION_RULES = [
  {
    botId: BUMP_CONSTANTS.DISBOARD_BOT_ID,
    commandName: BUMP_COMMANDS.DISBOARD,
    serviceName: BUMP_SERVICES.DISBOARD,
  },
  {
    botId: BUMP_CONSTANTS.DISSOKU_BOT_ID,
    commandName: BUMP_COMMANDS.DISSOKU,
    serviceName: BUMP_SERVICES.DISSOKU,
  },
] as const;

const MS_PER_MINUTE = 60 * 1000;

/**
 * リマインダー遅延時間（分）を取得
 * モジュールロード時に固定しないよう関数として実装
 * TEST_MODE の切り替え（テスト時）を正しく反映する
 */
export function getReminderDelayMinutes(): number {
  return env.TEST_MODE ? 1 : 120;
}

/**
 * 分単位の遅延から実行予定時刻を生成
 */
export function toScheduledAt(delayMinutes: number): Date {
  return new Date(Date.now() + delayMinutes * MS_PER_MINUTE);
}

/**
 * Bump検知対象のサービス名
 */
export type BumpServiceName =
  (typeof BUMP_SERVICES)[keyof typeof BUMP_SERVICES];

export type BumpReminderStatus =
  (typeof BUMP_REMINDER_STATUS)[keyof typeof BUMP_REMINDER_STATUS];

/**
 * 任意文字列が BumpServiceName か判定
 */
export function isBumpServiceName(value: string): value is BumpServiceName {
  return (Object.values(BUMP_SERVICES) as readonly string[]).includes(value);
}

/**
 * Bot ID とコマンド名からサービス名を解決
 */
export function resolveBumpService(
  botId: string,
  commandName: string,
): BumpServiceName | undefined {
  const matchedRule = BUMP_DETECTION_RULES.find(
    (rule) => rule.botId === botId && rule.commandName === commandName,
  );
  return matchedRule?.serviceName;
}

/**
 * BumpリマインダージョブIDを生成
 */
export function toBumpReminderJobId(guildId: string): string {
  return `${BUMP_CONSTANTS.JOB_ID_PREFIX}${guildId}`;
}
