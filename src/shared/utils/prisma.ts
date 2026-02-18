// src/shared/utils/prisma.ts
// Prisma関連のユーティリティ関数

import type { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

// モジュールレベルでPrismaクライアントを保持（global変数を使わない）
let _prismaClient: PrismaClient | undefined;

/**
 * Prismaクライアントを登録
 * アプリ起動時に一度だけ呼び出す
 */
export function setPrismaClient(prisma: PrismaClient): void {
  _prismaClient = prisma;
}

/**
 * Prismaクライアントを取得
 */
export function getPrismaClient(): PrismaClient | null {
  return _prismaClient ?? null;
}

/**
 * Prismaクライアントを取得（必須）
 * @throws {Error} Prismaクライアントが利用できない場合
 */
export function requirePrismaClient(): PrismaClient {
  const prisma = getPrismaClient();
  if (!prisma) {
    const error = new Error("Prisma client not available");
    logger.error(error.message);
    throw error;
  }
  return prisma;
}
