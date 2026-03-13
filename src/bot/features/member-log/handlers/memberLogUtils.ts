// src/bot/features/member-log/handlers/memberLogUtils.ts
// メンバーログハンドラー共通のフォーマットユーティリティ

import type { GuildTFunction } from "../../../../shared/locale/helpers";

/**
 * カスタムメッセージのプレースホルダーを置換する
 * @param template プレースホルダー付きテンプレート文字列
 * @param user ユーザーメンション文字列
 * @param username ユーザー名
 * @param count メンバー数
 * @returns 置換済み文字列
 */
export function formatCustomMessage(
  template: string,
  user: string,
  username: string,
  count: number,
): string {
  // {user}, {username}, {count} プレースホルダーを実値へ置換
  return template
    .replace(/\{user\}/g, user)
    .replace(/\{username\}/g, username)
    .replace(/\{count\}/g, String(count));
}

/**
 * アカウント年齢を「X年Y月Z日」形式の文字列にフォーマットする
 * @param years 年数
 * @param months 月数
 * @param days 日数
 * @param t ギルドロケール対応の翻訳関数
 * @returns フォーマット済み年齢文字列
 */
export function formatAccountAge(
  years: number,
  months: number,
  days: number,
  t: GuildTFunction,
): string {
  const parts: string[] = [];
  if (years > 0) parts.push(t("events:member-log.age.years", { count: years }));
  if (months > 0)
    parts.push(t("events:member-log.age.months", { count: months }));
  if (days > 0 || parts.length === 0)
    parts.push(t("events:member-log.age.days", { count: days }));
  return parts.join(t("events:member-log.age.separator"));
}
