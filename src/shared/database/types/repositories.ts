// src/shared/database/types/repositories.ts
// 機能別リポジトリインターフェース（必要な範囲だけ依存できる）

import type {
  GuildConfig,
  AfkConfig,
  MemberLogConfig,
  VacConfig,
  BumpReminderConfig,
} from "./entities";
import type {
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
} from "./bumpReminderTypes";
import type { VcRecruitConfig } from "./vcRecruitTypes";
import type { StickyMessage } from "./stickyMessageTypes";

export interface IBaseGuildRepository {
  getConfig(guildId: string): Promise<GuildConfig | null>;
  saveConfig(config: GuildConfig): Promise<void>;
  updateConfig(guildId: string, updates: Partial<GuildConfig>): Promise<void>;
  deleteConfig(guildId: string): Promise<void>;
  exists(guildId: string): Promise<boolean>;
  getLocale(guildId: string): Promise<string>;
  updateLocale(guildId: string, locale: string): Promise<void>;
}

export interface IAfkConfigRepository {
  getAfkConfig(guildId: string): Promise<AfkConfig | null>;
  setAfkChannel(guildId: string, channelId: string): Promise<void>;
  updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void>;
}

export interface IBumpReminderConfigRepository {
  getBumpReminderConfig(guildId: string): Promise<BumpReminderConfig | null>;
  setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void>;
  updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void>;
  setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult>;
  addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult>;
  removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult>;
  clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult>;
  clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult>;
}

export interface IVacConfigRepository {
  getVacConfig(guildId: string): Promise<VacConfig | null>;
  updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void>;
}

export interface IMemberLogConfigRepository {
  getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null>;
  updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void>;
}

export interface IVcRecruitConfigRepository {
  getVcRecruitConfig(guildId: string): Promise<VcRecruitConfig | null>;
  updateVcRecruitConfig(
    guildId: string,
    vcRecruitConfig: VcRecruitConfig,
  ): Promise<void>;
}

export interface IStickyMessageRepository {
  findByChannel(channelId: string): Promise<StickyMessage | null>;
  findAllByGuild(guildId: string): Promise<StickyMessage[]>;
  create(
    guildId: string,
    channelId: string,
    content: string,
    embedData?: string,
    updatedBy?: string,
  ): Promise<StickyMessage>;
  updateLastMessageId(id: string, lastMessageId: string): Promise<void>;
  updateContent(
    id: string,
    content: string,
    embedData: string | null,
    updatedBy?: string,
  ): Promise<StickyMessage>;
  delete(id: string): Promise<void>;
  deleteByChannel(channelId: string): Promise<number>;
}

/**
 * 全機能を束ねた統合インターフェース
 */
export interface IGuildConfigRepository
  extends
    IBaseGuildRepository,
    IAfkConfigRepository,
    IBumpReminderConfigRepository,
    IVacConfigRepository,
    IMemberLogConfigRepository,
    IVcRecruitConfigRepository {}

// 後方互換のためのエイリアス（既存コードを壊さないため）
/** @deprecated IAfkConfigRepository を使用してください */
export type IAfkRepository = IAfkConfigRepository;
/** @deprecated IVacConfigRepository を使用してください */
export type IVacRepository = IVacConfigRepository;
/** @deprecated IMemberLogConfigRepository を使用してください */
export type IMemberLogRepository = IMemberLogConfigRepository;
