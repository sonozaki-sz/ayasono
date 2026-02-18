// src/shared/locale/helpers.ts
// ローカライゼーション関連のヘルパー関数

import { type ParseKeys } from "i18next";
import type { IGuildConfigRepository } from "../database/repositories/GuildConfigRepository";
import { type AllNamespaces, type SupportedLocale } from "./i18n";

/** 全ネームスペースの翻訳キーを受け取るギルド用翻訳関数型 */
export type GuildTFunction = (
  key: ParseKeys<AllNamespaces>,
  options?: Record<string, unknown>,
) => string;

/**
 * ギルド用の翻訳関数を取得
 * LocaleManager 経由でキャッシュを利用するため、直接 DB クエリを発行しない
 * @param guildId ギルドID
 * @param _guildConfigRepository 後方互換のため残存（現在は LocaleManager キャッシュを使用）
 * @returns 翻訳関数
 */
export async function getGuildTranslator(
  guildId: string,
  _guildConfigRepository?: IGuildConfigRepository,
): Promise<GuildTFunction> {
  const { localeManager } = await import("./index");
  const fixedT = await localeManager.getGuildT(guildId);
  // i18nextのgetFixedTはデフォルトNSにバインドされるが実行時は全NSキーを受け入れるためキャスト
  return fixedT as unknown as GuildTFunction;
}

/**
 * ギルドのロケールを取得して LocaleManager キャッシュを更新させる
 * ロケール設定変更後に呼び出すことでキャッシュを無効化する
 */
export async function invalidateGuildLocaleCache(
  guildId: string,
): Promise<void> {
  const { localeManager } = await import("./index");
  localeManager.invalidateLocaleCache(guildId);
}

export type { SupportedLocale };
