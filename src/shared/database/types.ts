// src/shared/database/types.ts
// Database 関連の型定義

// ============================================================
// エンティティ型
// ============================================================

export interface GuildConfig {
  guildId: string;
  locale: string;
  afkConfig?: AfkConfig;
  vacConfig?: VacConfig;
  bumpReminderConfig?: BumpReminderConfig;
  stickMessages?: StickMessage[];
  memberLogConfig?: MemberLogConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AfkConfig {
  enabled: boolean;
  channelId?: string;
}

export interface VacConfig {
  enabled: boolean;
  triggerChannelIds: string[];
  createdChannels: VacChannelPair[];
}

export interface VacChannelPair {
  voiceChannelId: string;
  ownerId: string;
  createdAt: number;
}

export interface BumpReminderConfig {
  enabled: boolean;
  channelId?: string;
  mentionRoleId?: string;
  mentionUserIds: string[];
}

export const BUMP_REMINDER_MENTION_USER_MODE = {
  ADD: "add",
  REMOVE: "remove",
} as const;

export type BumpReminderMentionUserMode =
  (typeof BUMP_REMINDER_MENTION_USER_MODE)[keyof typeof BUMP_REMINDER_MENTION_USER_MODE];

export const BUMP_REMINDER_MENTION_ROLE_RESULT = {
  UPDATED: "updated",
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionRoleResult =
  (typeof BUMP_REMINDER_MENTION_ROLE_RESULT)[keyof typeof BUMP_REMINDER_MENTION_ROLE_RESULT];

export const BUMP_REMINDER_MENTION_USER_ADD_RESULT = {
  ADDED: "added",
  ALREADY_EXISTS: "already-exists",
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionUserAddResult =
  (typeof BUMP_REMINDER_MENTION_USER_ADD_RESULT)[keyof typeof BUMP_REMINDER_MENTION_USER_ADD_RESULT];

export const BUMP_REMINDER_MENTION_USER_REMOVE_RESULT = {
  REMOVED: "removed",
  NOT_FOUND: "not-found",
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionUserRemoveResult =
  (typeof BUMP_REMINDER_MENTION_USER_REMOVE_RESULT)[keyof typeof BUMP_REMINDER_MENTION_USER_REMOVE_RESULT];

export const BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT = {
  CLEARED: "cleared",
  ALREADY_EMPTY: "already-empty",
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionUsersClearResult =
  (typeof BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT)[keyof typeof BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT];

export const BUMP_REMINDER_MENTION_CLEAR_RESULT = {
  CLEARED: "cleared",
  ALREADY_CLEARED: "already-cleared",
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionClearResult =
  (typeof BUMP_REMINDER_MENTION_CLEAR_RESULT)[keyof typeof BUMP_REMINDER_MENTION_CLEAR_RESULT];

export interface StickMessage {
  channelId: string;
  messageId: string;
}

export interface MemberLogConfig {
  channelId?: string;
}

// ============================================================
// 機能別リポジトリインターフェース（必要な範囲だけ依存できる）
// ============================================================

export interface IBaseGuildRepository {
  getConfig(guildId: string): Promise<GuildConfig | null>;
  saveConfig(config: GuildConfig): Promise<void>;
  updateConfig(guildId: string, updates: Partial<GuildConfig>): Promise<void>;
  deleteConfig(guildId: string): Promise<void>;
  exists(guildId: string): Promise<boolean>;
  getLocale(guildId: string): Promise<string>;
  updateLocale(guildId: string, locale: string): Promise<void>;
}

export interface IAfkRepository {
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

export interface IVacRepository {
  getVacConfig(guildId: string): Promise<VacConfig | null>;
  updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void>;
}

export interface IStickMessageRepository {
  getStickMessages(guildId: string): Promise<StickMessage[]>;
  updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void>;
}

export interface IMemberLogRepository {
  getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null>;
  updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void>;
}

/**
 * 全機能を束ねた統合インターフェース（後方互換のため維持）
 */
export interface IGuildConfigRepository
  extends
    IBaseGuildRepository,
    IAfkRepository,
    IBumpReminderConfigRepository,
    IVacRepository,
    IStickMessageRepository,
    IMemberLogRepository {}
