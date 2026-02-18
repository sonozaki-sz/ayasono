// src/web/server.ts
// Fastify Webサーバー

import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { NODE_ENV, env } from "../shared/config/env";
import {
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
} from "../shared/errors/ErrorHandler";
import { localeManager, tDefault } from "../shared/locale";
import { logger } from "../shared/utils/logger";
import { apiRoutes } from "./routes/api";
import { healthRoute } from "./routes/health";

const WEB_SERVER_CONSTANTS = {
  STATIC_PUBLIC_DIR: "public",
  STATIC_PREFIX: "/",
  API_PREFIX: "/api",
  URL_SCHEME_HTTP: "http://",
} as const;

const PROCESS_EXIT_CODE = {
  FAILURE: 1,
} as const;

// ESM では __dirname が存在しないため自前で定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startWebServer() {
  await localeManager.initialize();

  const fastify = Fastify({
    logger: false, // 独自のloggerを使用
    trustProxy: true,
  });

  try {
    // CORS設定
    await fastify.register(fastifyCors, {
      origin:
        env.NODE_ENV === NODE_ENV.PRODUCTION
          ? (env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? [])
          : true,
      credentials: true,
    });

    // 静的ファイル配信
    await fastify.register(fastifyStatic, {
      root: join(__dirname, WEB_SERVER_CONSTANTS.STATIC_PUBLIC_DIR),
      prefix: WEB_SERVER_CONSTANTS.STATIC_PREFIX,
    });

    // ヘルスチェック
    await fastify.register(healthRoute);

    // APIルート（認証は apiRoutes 内で適用）
    await fastify.register(apiRoutes, {
      prefix: WEB_SERVER_CONSTANTS.API_PREFIX,
    });

    // エラーハンドラー
    fastify.setErrorHandler((error, request, reply) => {
      const err = error as Error & { statusCode?: number };
      logger.error(tDefault("system:web.api_error"), {
        error: err.message,
        stack: err.stack,
        url: request.url,
        method: request.method,
      });

      reply.status(err.statusCode || 500).send({
        error: tDefault("system:web.internal_server_error"),
        message:
          env.NODE_ENV === NODE_ENV.DEVELOPMENT ? err.message : undefined,
      });
    });

    // グレースフルシャットダウン（SIGTERM/SIGINT 受信時に進行中リクエストを完了させてから終了）
    setupGracefulShutdown(async () => {
      await fastify.close();
    });

    // サーバー起動
    await fastify.listen({
      port: env.WEB_PORT,
      host: env.WEB_HOST,
    });

    logger.info(
      tDefault("system:web.server_started", {
        url: `${WEB_SERVER_CONSTANTS.URL_SCHEME_HTTP}${env.WEB_HOST}:${env.WEB_PORT}`,
      }),
    );
  } catch (error) {
    logger.error(tDefault("system:web.startup_error"), error);
    process.exit(PROCESS_EXIT_CODE.FAILURE);
  }
}

// グローバルエラーハンドラーを設定（bot/main.ts と共通）
setupGlobalErrorHandlers();

// 起動
startWebServer().catch((error) => {
  logger.error(tDefault("system:web.startup_failed"), error);
  process.exit(PROCESS_EXIT_CODE.FAILURE);
});
