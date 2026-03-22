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
