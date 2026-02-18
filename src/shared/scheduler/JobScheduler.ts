// src/shared/scheduler/JobScheduler.ts
// タイマー処理（node-cron + setTimeout）
// REFACTORING_PLAN.md Phase 2 準拠

import cron, { ScheduledTask } from "node-cron";
import { tDefault } from "../locale";
import { logger } from "../utils/logger";

interface ScheduledJob {
  id: string;
  schedule: string;
  task: () => Promise<void> | void;
  description?: string;
}

/**
 * ジョブスケジューラー
 */
export class JobScheduler {
  private jobs: Map<string, ScheduledTask> = new Map();
  /** 一回限り実行ジョブ（setTimeoutベース） */
  private oneTimeJobs: Map<string, NodeJS.Timeout> = new Map();

  /**
   * 繰り返しジョブを追加（cron式）
   */
  public addJob(job: ScheduledJob): void {
    if (this.jobs.has(job.id)) {
      logger.warn(tDefault("system:scheduler.job_exists", { jobId: job.id }));
      this.removeJob(job.id);
    }

    try {
      const scheduledTask = cron.schedule(job.schedule, async () => {
        try {
          logger.debug(
            tDefault("system:scheduler.executing_job", { jobId: job.id }),
          );
          await job.task();
          logger.debug(
            tDefault("system:scheduler.job_completed", { jobId: job.id }),
          );
        } catch (error) {
          logger.error(
            tDefault("system:scheduler.job_error", { jobId: job.id }),
            error,
          );
        }
      });

      this.jobs.set(job.id, scheduledTask);
      scheduledTask.start();

      logger.info(
        tDefault("system:scheduler.job_scheduled", { jobId: job.id }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:scheduler.schedule_failed", { jobId: job.id }),
        error,
      );
      throw error;
    }
  }

  /**
   * 一回限りのジョブを追加（setTimeoutベース）
   * node-cron は年フィールドをサポートしないため、特定日時への1回実行は setTimeout を使用する
   * @param id ジョブID
   * @param delayMs 実行までの遅延時間（ミリ秒）。0以下の場合は即時実行
   * @param task 実行するタスク
   */
  public addOneTimeJob(
    id: string,
    delayMs: number,
    task: () => Promise<void> | void,
  ): void {
    // 既存の同IDジョブをキャンセル
    if (this.oneTimeJobs.has(id) || this.jobs.has(id)) {
      logger.warn(tDefault("system:scheduler.job_exists", { jobId: id }));
      this.removeJob(id);
    }

    const safeDelay = Math.max(0, delayMs);

    const handle = setTimeout(async () => {
      this.oneTimeJobs.delete(id);
      try {
        logger.debug(tDefault("system:scheduler.executing_job", { jobId: id }));
        await task();
        logger.debug(tDefault("system:scheduler.job_completed", { jobId: id }));
      } catch (error) {
        logger.error(
          tDefault("system:scheduler.job_error", { jobId: id }),
          error,
        );
      }
    }, safeDelay);

    // Node.js が終了を待たないようにする
    handle.unref();

    this.oneTimeJobs.set(id, handle);
    logger.info(tDefault("system:scheduler.job_scheduled", { jobId: id }));
  }

  /**
   * ジョブを削除（cron・oneTime 両方対応）
   */
  public removeJob(id: string): boolean {
    const cronJob = this.jobs.get(id);
    if (cronJob) {
      cronJob.stop();
      this.jobs.delete(id);
      logger.info(tDefault("system:scheduler.job_removed", { jobId: id }));
      return true;
    }

    const timeoutHandle = this.oneTimeJobs.get(id);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.oneTimeJobs.delete(id);
      logger.info(tDefault("system:scheduler.job_removed", { jobId: id }));
      return true;
    }

    return false;
  }

  /**
   * すべてのジョブを停止
   */
  public stopAll(): void {
    logger.info(tDefault("system:scheduler.stopping"));
    for (const [id, job] of this.jobs.entries()) {
      job.stop();
      logger.debug(tDefault("system:scheduler.job_stopped", { jobId: id }));
    }
    this.jobs.clear();

    for (const [id, handle] of this.oneTimeJobs.entries()) {
      clearTimeout(handle);
      logger.debug(tDefault("system:scheduler.job_stopped", { jobId: id }));
    }
    this.oneTimeJobs.clear();
  }

  /**
   * ジョブの存在確認（cron・oneTime 両方）
   */
  public hasJob(id: string): boolean {
    return this.jobs.has(id) || this.oneTimeJobs.has(id);
  }

  /**
   * すべてのジョブIDを取得
   */
  public getJobIds(): string[] {
    return [
      ...Array.from(this.jobs.keys()),
      ...Array.from(this.oneTimeJobs.keys()),
    ];
  }

  /**
   * ジョブ数を取得
   */
  public getJobCount(): number {
    return this.jobs.size + this.oneTimeJobs.size;
  }
}

// シングルトンインスタンス
export const jobScheduler = new JobScheduler();
