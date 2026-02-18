// src/shared/config/env.ts
// 環境変数管理（Zod バリデーション）

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Discord
  DISCORD_TOKEN: z.string().min(50, "DISCORD_TOKEN is not configured"),
  DISCORD_APP_ID: z.string().min(10, "DISCORD_APP_ID is not configured"),
  DISCORD_GUILD_ID: z.string().optional(), // 開発用：設定するとギルドコマンドとして即座に登録

  // ロケール
  LOCALE: z.string().default("ja"),

  // データベース
  DATABASE_URL: z.string().default("file:./storage/db.sqlite"),

  // Webサーバー
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  WEB_HOST: z.string().default("0.0.0.0"),

  // JWT（Web UI認証用）
  JWT_SECRET: z.string().optional(),

  // ログレベル
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Note: tDefaultは使用できない（env.tsはi18n初期化前に実行される）
      console.error("❌ Environment variable validation failed:");
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\nPlease check your .env file.");
    }
    process.exit(1);
  }
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
