// src/shared/database/repositories/vacConfigRepository.ts
// VAC設定リポジトリ（guild_vac_configs テーブル）

import type { PrismaClient } from "@prisma/client";
import type { IVacConfigRepository, VacChannelPair, VacConfig } from "../types";
import { parseJsonArray } from "../../utils/jsonUtils";

/**
 * guild_vac_configs テーブルを使用した VAC設定リポジトリ
 */
export class VacConfigRepository implements IVacConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getVacConfig(guildId: string): Promise<VacConfig | null> {
    const record = await this.prisma.guildVacConfig.findUnique({
      where: { guildId },
    });
    if (!record) return null;
    return {
      enabled: record.enabled,
      triggerChannelIds: parseJsonArray<string>(record.triggerChannelIds),
      createdChannels: parseJsonArray<VacChannelPair>(record.createdChannels),
    };
  }

  async updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void> {
    await this.prisma.guildVacConfig.upsert({
      where: { guildId },
      create: {
        guildId,
        enabled: vacConfig.enabled,
        triggerChannelIds: JSON.stringify(vacConfig.triggerChannelIds),
        createdChannels: JSON.stringify(vacConfig.createdChannels),
      },
      update: {
        enabled: vacConfig.enabled,
        triggerChannelIds: JSON.stringify(vacConfig.triggerChannelIds),
        createdChannels: JSON.stringify(vacConfig.createdChannels),
      },
    });
  }
}
