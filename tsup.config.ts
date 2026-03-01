import { readdirSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "tsup";

/**
 * 指定ディレクトリ内の .ts ファイルを列挙して tsup entry オブジェクトを生成する。
 * @param dir スキャン対象の絶対パス
 * @param outPrefix dist/ 以下の出力先プレフィックス（例: "bot/commands"）
 * @param exclude 除外するファイル名（拡張子なし）
 */
function makeEntries(
  dir: string,
  outPrefix: string,
  exclude: string[] = [],
): Record<string, string> {
  return Object.fromEntries(
    readdirSync(dir)
      .filter((f) => {
        const base = f.replace(/\.ts$/, "");
        return f.endsWith(".ts") && !exclude.includes(base);
      })
      .map((f) => [`${outPrefix}/${f.replace(/\.ts$/, "")}`, resolve(dir, f)]),
  );
}

const srcBot = resolve(process.cwd(), "src/bot");

export default defineConfig({
  entry: {
    // エントリーポイント
    "bot/main": "src/bot/main.ts",
    "web/server": "src/web/server.ts",
    // ローダー（動的インポートで使用するため個別ファイルとして出力）
    "bot/utils/commandLoader": "src/bot/utils/commandLoader.ts",
    "bot/utils/eventLoader": "src/bot/utils/eventLoader.ts",
    // コマンド・イベントは個別ファイルとして出力（動的ロードのため）
    ...makeEntries(resolve(srcBot, "commands"), "bot/commands"),
    ...makeEntries(resolve(srcBot, "events"), "bot/events"),
  },
  outDir: "dist",
  format: ["esm"],
  // 型定義ファイルは不要（型チェックは tsc --noEmit で実施）
  dts: false,
  sourcemap: false,
  clean: true,
  platform: "node",
  target: "node24",
  // コマンド・イベントファイルを個別チャンクで出力するためコード分割を有効化
  splitting: true,
});
