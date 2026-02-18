// src/shared/features/bump-reminder/repository.ts
// Bumpリマインダー用リポジトリ

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors/CustomErrors";
import { tDefault } from "../../locale";
import { logger } from "../../utils/logger";
import { BUMP_REMINDER_STATUS, type BumpReminderStatus } from "./constants";

/**
 * Bump Reminder型定義
 */
export interface BumpReminder {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string | null; // Prismaはnullを使用
  panelMessageId: string | null; // Bumpパネルメッセージ ID (削除用)
  serviceName: string | null; // サービス名 (Disboard, Dissoku)
  scheduledAt: Date;
  status: BumpReminderStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repositoryインターフェース
 */
export interface IBumpReminderRepository {
  create(
    guildId: string,
    channelId: string,
    scheduledAt: Date,
    messageId?: string,
    panelMessageId?: string,
    serviceName?: string,
  ): Promise<BumpReminder>;
  findById(id: string): Promise<BumpReminder | null>;
  findPendingByGuild(guildId: string): Promise<BumpReminder | null>;
  findAllPending(): Promise<BumpReminder[]>;
  updateStatus(id: string, status: BumpReminderStatus): Promise<void>;
  delete(id: string): Promise<void>;
  cancelByGuild(guildId: string): Promise<void>;
  cancelByGuildAndChannel(guildId: string, channelId: string): Promise<void>;
  cleanupOld(daysOld?: number): Promise<number>;
}

/**
 * Prisma実装
 */
export class BumpReminderRepository implements IBumpReminderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 新しいリマインダーを作成
   * 既存pendingのキャンセルと新規作成をトランザクションで原子的に実行し、競合状態を防ぐ
   */
  async create(
    guildId: string,
    channelId: string,
    scheduledAt: Date,
    messageId?: string,
    panelMessageId?: string,
    serviceName?: string,
  ): Promise<BumpReminder> {
    try {
      const reminder = await this.prisma.$transaction(async (tx) => {
        // 同じギルドの既存pendingリマインダーをキャンセル（重複防止）
        // BumpReminderManager はギルド単位で1件のリマインダーを管理するため、
        // channelId に関わらずすべての pending を取消す
        await tx.bumpReminder.updateMany({
          where: { guildId, status: BUMP_REMINDER_STATUS.PENDING },
          data: { status: BUMP_REMINDER_STATUS.CANCELLED },
        });

        return tx.bumpReminder.create({
          data: {
            guildId,
            channelId,
            messageId,
            panelMessageId,
            serviceName,
            scheduledAt,
            status: BUMP_REMINDER_STATUS.PENDING,
          },
        });
      });

      logger.debug(
        tDefault("system:database.bump_reminder_created", {
          id: reminder.id,
          guildId,
        }),
      );

      return reminder as BumpReminder;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_create_failed", { guildId }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_create_failed", { guildId }),
      );
    }
  }

  /**
   * IDでリマインダーを取得
   */
  async findById(id: string): Promise<BumpReminder | null> {
    try {
      const result = await this.prisma.bumpReminder.findUnique({
        where: { id },
      });
      return result as BumpReminder | null;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_find_failed", { id }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_find_failed", { id }),
      );
    }
  }

  /**
   * ギルドのpendingリマインダーを取得（1つのみ）
   */
  async findPendingByGuild(guildId: string): Promise<BumpReminder | null> {
    try {
      const result = await this.prisma.bumpReminder.findFirst({
        where: {
          guildId,
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });
      return result as BumpReminder | null;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_find_failed", { guildId }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_find_failed", { guildId }),
      );
    }
  }

  /**
   * すべてのpendingリマインダーを取得
   */
  async findAllPending(): Promise<BumpReminder[]> {
    try {
      const results = await this.prisma.bumpReminder.findMany({
        where: {
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });
      return results as BumpReminder[];
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_find_all_failed"),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_find_all_failed"),
      );
    }
  }

  /**
   * ステータスを更新
   */
  async updateStatus(id: string, status: BumpReminderStatus): Promise<void> {
    try {
      await this.prisma.bumpReminder.update({
        where: { id },
        data: { status },
      });

      logger.debug(
        tDefault("system:database.bump_reminder_status_updated", {
          id,
          status,
        }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_update_failed", { id }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_update_failed", { id }),
      );
    }
  }

  /**
   * リマインダーを削除
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.bumpReminder.delete({
        where: { id },
      });

      logger.debug(tDefault("system:database.bump_reminder_deleted", { id }));
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_delete_failed", { id }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_delete_failed", { id }),
      );
    }
  }

  /**
   * ギルドのpendingリマインダーをすべてキャンセル
   */
  async cancelByGuild(guildId: string): Promise<void> {
    try {
      await this.prisma.bumpReminder.updateMany({
        where: {
          guildId,
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        data: {
          status: BUMP_REMINDER_STATUS.CANCELLED,
        },
      });

      logger.debug(
        tDefault("system:database.bump_reminder_cancelled_by_guild", {
          guildId,
        }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_cancel_failed", { guildId }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_cancel_failed", { guildId }),
      );
    }
  }

  /**
   * 特定チャンネルのpendingリマインダーをキャンセル（重複防止用）
   */
  async cancelByGuildAndChannel(
    guildId: string,
    channelId: string,
  ): Promise<void> {
    try {
      await this.prisma.bumpReminder.updateMany({
        where: {
          guildId,
          channelId,
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        data: {
          status: BUMP_REMINDER_STATUS.CANCELLED,
        },
      });

      logger.debug(
        tDefault("system:database.bump_reminder_cancelled_by_channel", {
          guildId,
          channelId,
        }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_cancel_failed", {
          guildId,
          channelId,
        }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_cancel_failed", {
          guildId,
          channelId,
        }),
      );
    }
  }

  /**
   * 古いリマインダーをクリーンアップ
   * @param daysOld 何日前のデータを削除するか（デフォルト: 7日）
   * @returns 削除した件数
   */
  async cleanupOld(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.bumpReminder.deleteMany({
        where: {
          status: {
            in: [BUMP_REMINDER_STATUS.SENT, BUMP_REMINDER_STATUS.CANCELLED],
          },
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(
        tDefault("system:database.bump_reminder_cleanup_completed", {
          count: result.count,
          days: daysOld,
        }),
      );

      return result.count;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_cleanup_failed"),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_cleanup_failed"),
      );
    }
  }
}

// シングルトンインスタンス
let bumpReminderRepository: BumpReminderRepository | null = null;
let _cachedPrisma: PrismaClient | undefined;

/**
 * BumpReminderRepository のシングルトンインスタンスを取得
 * Prismaクライアントが変わった場合（テスト時のモック差し替えなど）は自動的に再生成する
 */
export function getBumpReminderRepository(
  prisma: PrismaClient,
): BumpReminderRepository {
  if (!bumpReminderRepository || _cachedPrisma !== prisma) {
    bumpReminderRepository = new BumpReminderRepository(prisma);
    _cachedPrisma = prisma;
  }
  return bumpReminderRepository;
}
