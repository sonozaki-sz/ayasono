// src/shared/database/index.ts
// Database module exports

export * from "./repositories/GuildConfigRepository";
export * from "./types";

import type { PrismaClient } from "@prisma/client";
import { requirePrismaClient } from "../utils/prisma";
import {
  createGuildConfigRepository,
  type IGuildConfigRepository,
} from "./repositories/GuildConfigRepository";

// シングルトンキャッシュ
// Prismaクライアントが差し替えられた場合（テスト等）は自動的に再生成する
let _cachedRepository: IGuildConfigRepository | undefined;
let _cachedPrisma: PrismaClient | undefined;

/**
 * GuildConfigRepositoryのシングルトンを返す
 * Prismaクライアントが変わった場合（テスト時のモック差し替えなど）は自動的に再生成する
 */
export function getGuildConfigRepository(): IGuildConfigRepository {
  const prisma = requirePrismaClient();
  if (!_cachedRepository || _cachedPrisma !== prisma) {
    _cachedRepository = createGuildConfigRepository(prisma);
    _cachedPrisma = prisma;
  }
  return _cachedRepository;
}

/**
 * キャッシュをリセット（テスト用途）
 */
export function resetGuildConfigRepositoryCache(): void {
  _cachedRepository = undefined;
  _cachedPrisma = undefined;
}
