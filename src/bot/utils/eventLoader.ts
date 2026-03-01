// src/bot/utils/eventLoader.ts
// events/ ディレクトリを自動スキャンしてイベントを動的ロードする

import { readdirSync } from "fs";
import { resolve } from "path";
import type { BotEvent } from "../types/discord";

/**
 * 値が BotEvent 型として有効かを判定するタイプガード
 * name / execute の存在を最低限チェックする
 * @param value 判定対象の値
 * @returns BotEvent 型として有効であれば true
 */
function isBotEvent(value: unknown): value is BotEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "execute" in value &&
    typeof (value as BotEvent).execute === "function"
  );
}

/**
 * events/ ディレクトリ配下のファイルをスキャンし、
 * BotEvent エクスポートを含むモジュールをすべて動的インポートする。
 *
 * - 開発時（tsx）: .ts ファイルをそのまま import
 * - 本番時（tsup ビルド後）: .js ファイルを import
 *
 * @returns ロードされた BotEvent オブジェクトの配列
 */
export async function loadEvents(): Promise<BotEvent[]> {
  const eventsDir = resolve(import.meta.dirname, "../events");

  const files = readdirSync(eventsDir).filter(
    (f) =>
      // .ts（開発）または .js（本番）のみ対象、型定義・マップファイルは除外
      (f.endsWith(".ts") || f.endsWith(".js")) &&
      !f.endsWith(".d.ts") &&
      !f.endsWith(".js.map"),
  );

  const events: BotEvent[] = [];

  for (const file of files) {
    // 絶対パスで動的インポート（開発・本番どちらでも動作）
    const mod: Record<string, unknown> = await import(resolve(eventsDir, file));

    for (const [key, value] of Object.entries(mod)) {
      // default export は named export と同一オブジェクトになるためスキップして重複を防ぐ
      if (key === "default") continue;
      if (isBotEvent(value)) {
        events.push(value);
      }
    }
  }

  return events;
}
