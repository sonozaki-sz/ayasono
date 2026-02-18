// src/web/routes/api/index.ts
// APIルート

import type { FastifyPluginAsync } from "fastify";
import { apiAuthPlugin } from "../../middleware/auth";

export const apiRoutes: FastifyPluginAsync = async (fastify) => {
  // 全 APIルートに認証を適用
  await fastify.register(apiAuthPlugin);

  // TODO: APIルートをここに追加
  fastify.get("/", async () => {
    return {
      message: "Guild Management Bot API",
      version: "2.0.0",
    };
  });
};
