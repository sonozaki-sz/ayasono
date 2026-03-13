// src/shared/utils/jsonUtils.ts
// JSON パース共通ユーティリティ

import { logger } from "./logger";

/**
 * JSON 文字列を配列としてパースする。
 * パース失敗または非配列値の場合は空配列を返す。
 */
export function parseJsonArray<T>(json: string): T[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (e) {
    logger.warn(
      `parseJsonArray: JSON のパースに失敗しました。空配列を返します。 value="${json}" error="${e instanceof Error ? e.message : String(e)}"`,
    );
    return [];
  }
}
