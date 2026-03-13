// src/shared/database/repositories/serializers/guildConfigSerializer.ts
// GuildConfig の serializer / deserializer

import type { GuildConfig } from "../../types";

type GuildConfigRecord = {
  id: string;
  guildId: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * DBレコードをドメインの GuildConfig へ変換する
 */
export function toGuildConfig(record: GuildConfigRecord): GuildConfig {
  return {
    guildId: record.guildId,
    locale: record.locale,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * GuildConfig から create 用DBデータを生成する
 */
export function toGuildConfigCreateData(
  config: GuildConfig,
  defaultLocale: string,
): {
  guildId: string;
  locale: string;
} {
  return {
    guildId: config.guildId,
    locale: config.locale || defaultLocale,
  };
}

/**
 * GuildConfig の部分更新データを DB update 形式へ変換する
 */
export function toGuildConfigUpdateData(
  updates: Partial<GuildConfig>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (updates.locale !== undefined) data.locale = updates.locale;

  return data;
}
