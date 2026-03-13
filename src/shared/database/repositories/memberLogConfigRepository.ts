// src/shared/database/repositories/memberLogConfigRepository.ts
// メンバーログ設定リポジトリ（guild_member_log_configs テーブル）

import type { PrismaClient } from "@prisma/client";
import type { IMemberLogConfigRepository, MemberLogConfig } from "../types";

/**
 * guild_member_log_configs テーブルを使用したメンバーログ設定リポジトリ
 */
export class MemberLogConfigRepository implements IMemberLogConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null> {
    const record = await this.prisma.guildMemberLogConfig.findUnique({
      where: { guildId },
    });
    if (!record) return null;
    return {
      enabled: record.enabled,
      channelId: record.channelId ?? undefined,
      joinMessage: record.joinMessage ?? undefined,
      leaveMessage: record.leaveMessage ?? undefined,
    };
  }

  async updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void> {
    await this.prisma.guildMemberLogConfig.upsert({
      where: { guildId },
      create: {
        guildId,
        enabled: memberLogConfig.enabled,
        channelId: memberLogConfig.channelId ?? null,
        joinMessage: memberLogConfig.joinMessage ?? null,
        leaveMessage: memberLogConfig.leaveMessage ?? null,
      },
      update: {
        enabled: memberLogConfig.enabled,
        channelId: memberLogConfig.channelId ?? null,
        joinMessage: memberLogConfig.joinMessage ?? null,
        leaveMessage: memberLogConfig.leaveMessage ?? null,
      },
    });
  }
}
