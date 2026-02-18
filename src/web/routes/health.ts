// src/web/routes/health.ts
// ヘルスチェックエンドポイント

import { FastifyPluginAsync } from "fastify";
import { getPrismaClient } from "../../shared/utils/prisma";

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  fastify.get("/ready", async (_, reply) => {
    const prisma = getPrismaClient();
    if (!prisma) {
      return reply.status(503).send({
        ready: false,
        reason: "Database not initialized",
      });
    }
    try {
      // 実際にDBへ疎通確認
      await prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch {
      return reply.status(503).send({
        ready: false,
        reason: "Database connection failed",
      });
    }
  });
};
