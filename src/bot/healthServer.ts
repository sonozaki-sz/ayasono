// src/bot/healthServer.ts
// ボットプロセス用の軽量ヘルスチェック HTTP サーバー
// Docker ヘルスチェックが Discord 接続状態を確認できるようにする

import { createServer, type Server } from "node:http";
import type { BotClient } from "./client";

/** ヘルスチェック用 HTTP サーバーのリッスンポート */
const HEALTH_PORT = 8080;

/**
 * Discord クライアントの接続状態を返す軽量 HTTP サーバーを起動する。
 * GET /health → 200 (接続中) or 503 (未接続)
 */
export function startHealthServer(client: BotClient): Server {
  const server = createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      // Discord.js の WebSocketStatus: 0 = Ready
      const isReady = client.ws.status === 0;
      const statusCode = isReady ? 200 : 503;
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: isReady ? "ok" : "disconnected",
          wsStatus: client.ws.status,
          uptime: process.uptime(),
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(HEALTH_PORT);
  return server;
}
