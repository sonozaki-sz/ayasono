// src/shared/database/repositories/guildConfigRepository.ts
// Repositoryパターン実装（Prisma版）

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors/customErrors";
import { DEFAULT_LOCALE } from "../../locale/i18n";
import type {
  AfkConfig,
  BumpReminderConfig,
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
  FullGuildConfig,
  GuildConfig,
  IGuildConfigRepository,
  MemberLogConfig,
  VacConfig,
  VcRecruitConfig,
} from "../types";
import { AfkConfigRepository } from "./afkConfigRepository";
import { BumpReminderConfigRepository } from "./bumpReminderConfigRepository";
import { MemberLogConfigRepository } from "./memberLogConfigRepository";
import { VacConfigRepository } from "./vacConfigRepository";
import { VcRecruitConfigRepository } from "./vcRecruitConfigRepository";
import {
  deleteGuildConfigUsecase,
  existsGuildConfigUsecase,
  getGuildConfigUsecase,
  getGuildLocaleUsecase,
  saveGuildConfigUsecase,
  updateGuildConfigUsecase,
  updateGuildLocaleUsecase,
} from "./usecases/guildConfigCoreUsecases";

const DB_ERROR = {
  UNKNOWN: "unknown error",
} as const;

/**
 * Prisma実装のRepository
 */
export class PrismaGuildConfigRepository implements IGuildConfigRepository {
  private prisma: PrismaClient;
  private readonly afkConfigRepository: AfkConfigRepository;
  private readonly bumpReminderConfigRepository: BumpReminderConfigRepository;
  private readonly vacConfigRepository: VacConfigRepository;
  private readonly memberLogConfigRepository: MemberLogConfigRepository;
  private readonly vcRecruitConfigRepository: VcRecruitConfigRepository;
  private readonly toDatabaseError = (
    prefix: string,
    error: unknown,
  ): DatabaseError =>
    new DatabaseError(
      `${prefix}: ${error instanceof Error ? error.message : DB_ERROR.UNKNOWN}`,
    );

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.afkConfigRepository = new AfkConfigRepository(prisma);
    this.bumpReminderConfigRepository = new BumpReminderConfigRepository(
      prisma,
    );
    this.vacConfigRepository = new VacConfigRepository(prisma);
    this.memberLogConfigRepository = new MemberLogConfigRepository(prisma);
    this.vcRecruitConfigRepository = new VcRecruitConfigRepository(prisma);
  }

  async getConfig(guildId: string): Promise<GuildConfig | null> {
    return getGuildConfigUsecase(this.getCoreDeps(), guildId);
  }

  async saveConfig(config: GuildConfig): Promise<void> {
    await saveGuildConfigUsecase(this.getCoreDeps(), config);
  }

  async updateConfig(
    guildId: string,
    updates: Partial<GuildConfig>,
  ): Promise<void> {
    await updateGuildConfigUsecase(this.getCoreDeps(), guildId, updates);
  }

  async deleteConfig(guildId: string): Promise<void> {
    await deleteGuildConfigUsecase(this.getCoreDeps(), guildId);
  }

  async exists(guildId: string): Promise<boolean> {
    return existsGuildConfigUsecase(this.getCoreDeps(), guildId);
  }

  async getLocale(guildId: string): Promise<string> {
    return getGuildLocaleUsecase(this.getCoreDeps(), guildId);
  }

  async updateLocale(guildId: string, locale: string): Promise<void> {
    await updateGuildLocaleUsecase(this.getCoreDeps(), guildId, locale);
  }

  /**
   * エラー通知チャンネルを設定する
   * @param guildId 対象ギルドID
   * @param channelId エラー通知先チャンネルID
   */
  async updateErrorChannel(guildId: string, channelId: string): Promise<void> {
    await updateGuildConfigUsecase(this.getCoreDeps(), guildId, {
      errorChannelId: channelId,
    });
  }

  /**
   * ギルド設定（locale・errorChannelId）をデフォルトにリセットする
   * 各機能の設定は保持される
   * @param guildId 対象ギルドID
   */
  async resetGuildSettings(guildId: string): Promise<void> {
    await updateGuildConfigUsecase(this.getCoreDeps(), guildId, {
      locale: DEFAULT_LOCALE,
      errorChannelId: undefined,
    });
  }

  /**
   * エクスポート用に全機能の設定を一括取得する
   * @param guildId 対象ギルドID
   * @returns 全設定データ（レコード未存在時は null）
   */
  async getFullConfig(guildId: string): Promise<FullGuildConfig | null> {
    const config = await this.getConfig(guildId);
    if (!config) return null;

    // 各機能の設定を並行取得
    const [afk, bumpReminder, vac, memberLog, vcRecruit] = await Promise.all([
      this.getAfkConfig(guildId),
      this.getBumpReminderConfig(guildId),
      this.getVacConfig(guildId),
      this.getMemberLogConfig(guildId),
      this.getVcRecruitConfig(guildId),
    ]);

    const result: FullGuildConfig = {
      locale: config.locale,
      errorChannelId: config.errorChannelId,
    };

    if (afk) result.afk = afk;
    if (bumpReminder) result.bumpReminder = bumpReminder;
    // VAC は triggerChannelIds のみエクスポート（createdChannels はランタイムデータ）
    if (vac)
      result.vac = {
        enabled: vac.enabled,
        triggerChannelIds: vac.triggerChannelIds,
      };
    if (memberLog) result.memberLog = memberLog;
    if (vcRecruit) result.vcRecruit = vcRecruit;

    return result;
  }

  /**
   * インポートデータから全機能の設定を一括上書き保存する
   * @param guildId 対象ギルドID
   * @param data インポートする全設定データ
   */
  async importFullConfig(
    guildId: string,
    data: FullGuildConfig,
  ): Promise<void> {
    // ギルド設定を更新
    await updateGuildConfigUsecase(this.getCoreDeps(), guildId, {
      locale: data.locale,
      errorChannelId: data.errorChannelId,
    });

    // 各機能の設定を並行保存
    const operations: Promise<void>[] = [];

    if (data.afk) {
      operations.push(
        this.afkConfigRepository.updateAfkConfig(guildId, data.afk),
      );
    }
    if (data.bumpReminder) {
      operations.push(
        this.bumpReminderConfigRepository.updateBumpReminderConfig(
          guildId,
          data.bumpReminder,
        ),
      );
    }
    if (data.vac) {
      operations.push(
        this.vacConfigRepository.updateVacConfig(guildId, {
          enabled: data.vac.enabled,
          triggerChannelIds: data.vac.triggerChannelIds,
          createdChannels: [],
        }),
      );
    }
    if (data.memberLog) {
      operations.push(
        this.memberLogConfigRepository.updateMemberLogConfig(
          guildId,
          data.memberLog,
        ),
      );
    }
    if (data.vcRecruit) {
      operations.push(
        this.vcRecruitConfigRepository.updateVcRecruitConfig(
          guildId,
          data.vcRecruit,
        ),
      );
    }

    await Promise.all(operations);
  }

  /**
   * ギルド設定と全機能設定を一括削除する（reset-all 用）
   * レコードが存在しないテーブルはスキップする
   * @param guildId 対象ギルドID
   */
  async deleteAllConfigs(guildId: string): Promise<void> {
    // 各テーブルを並行削除（存在しない場合は無視）
    const deleteIfExists = async (
      fn: () => Promise<unknown>,
    ): Promise<void> => {
      try {
        await fn();
      } catch {
        // レコードが存在しない場合のエラーを無視
      }
    };

    await Promise.all([
      deleteIfExists(() =>
        this.prisma.guildConfig.delete({ where: { guildId } }),
      ),
      deleteIfExists(() =>
        this.prisma.guildAfkConfig.delete({ where: { guildId } }),
      ),
      deleteIfExists(() =>
        this.prisma.guildBumpReminderConfig.delete({ where: { guildId } }),
      ),
      deleteIfExists(() =>
        this.prisma.guildVacConfig.delete({ where: { guildId } }),
      ),
      deleteIfExists(() =>
        this.prisma.guildMemberLogConfig.delete({ where: { guildId } }),
      ),
      deleteIfExists(() =>
        this.prisma.guildVcRecruitConfig.delete({ where: { guildId } }),
      ),
      deleteIfExists(() =>
        this.prisma.stickyMessage.deleteMany({ where: { guildId } }),
      ),
    ]);
  }

  private getCoreDeps() {
    return {
      prisma: this.prisma,
      defaultLocale: DEFAULT_LOCALE,
      toDatabaseError: (prefix: string, error: unknown) =>
        this.toDatabaseError(prefix, error),
    };
  }

  async getAfkConfig(guildId: string): Promise<AfkConfig | null> {
    return this.afkConfigRepository.getAfkConfig(guildId);
  }

  async setAfkChannel(guildId: string, channelId: string): Promise<void> {
    await this.afkConfigRepository.setAfkChannel(guildId, channelId);
  }

  async updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void> {
    await this.afkConfigRepository.updateAfkConfig(guildId, afkConfig);
  }

  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    return this.bumpReminderConfigRepository.getBumpReminderConfig(guildId);
  }

  async setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void> {
    await this.bumpReminderConfigRepository.setBumpReminderEnabled(
      guildId,
      enabled,
      channelId,
    );
  }

  async updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void> {
    await this.bumpReminderConfigRepository.updateBumpReminderConfig(
      guildId,
      bumpReminderConfig,
    );
  }

  async setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult> {
    return this.bumpReminderConfigRepository.setBumpReminderMentionRole(
      guildId,
      roleId,
    );
  }

  async addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult> {
    return this.bumpReminderConfigRepository.addBumpReminderMentionUser(
      guildId,
      userId,
    );
  }

  async removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult> {
    return this.bumpReminderConfigRepository.removeBumpReminderMentionUser(
      guildId,
      userId,
    );
  }

  async clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult> {
    return this.bumpReminderConfigRepository.clearBumpReminderMentionUsers(
      guildId,
    );
  }

  async clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult> {
    return this.bumpReminderConfigRepository.clearBumpReminderMentions(guildId);
  }

  async getVacConfig(guildId: string): Promise<VacConfig | null> {
    return this.vacConfigRepository.getVacConfig(guildId);
  }

  async updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void> {
    await this.vacConfigRepository.updateVacConfig(guildId, vacConfig);
  }

  async getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null> {
    return this.memberLogConfigRepository.getMemberLogConfig(guildId);
  }

  async updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void> {
    await this.memberLogConfigRepository.updateMemberLogConfig(
      guildId,
      memberLogConfig,
    );
  }

  async getVcRecruitConfig(guildId: string): Promise<VcRecruitConfig | null> {
    return this.vcRecruitConfigRepository.getVcRecruitConfig(guildId);
  }

  async updateVcRecruitConfig(
    guildId: string,
    vcRecruitConfig: VcRecruitConfig,
  ): Promise<void> {
    await this.vcRecruitConfigRepository.updateVcRecruitConfig(
      guildId,
      vcRecruitConfig,
    );
  }
}

/**
 * Repositoryインスタンス作成
 */
export const createGuildConfigRepository = (
  prisma: PrismaClient,
): IGuildConfigRepository => {
  return new PrismaGuildConfigRepository(prisma);
};
