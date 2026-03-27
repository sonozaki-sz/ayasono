// src/shared/features/ticket/ticketConfigService.ts
// チケット設定サービス（Repositoryパターン準拠）

import type {
  GuildTicketConfig,
  IGuildTicketConfigRepository,
} from "../../database/types";

/**
 * チケット設定の永続化アクセスを担当するサービス
 */
export class TicketConfigService {
  private readonly repository: IGuildTicketConfigRepository;
  constructor(repository: IGuildTicketConfigRepository) {
    this.repository = repository;
  }

  /**
   * ギルドとカテゴリで設定を取得する
   */
  async findByGuildAndCategory(
    guildId: string,
    categoryId: string,
  ): Promise<GuildTicketConfig | null> {
    return this.repository.findByGuildAndCategory(guildId, categoryId);
  }

  /**
   * ギルド内の全設定を取得する
   */
  async findAllByGuild(guildId: string): Promise<GuildTicketConfig[]> {
    return this.repository.findAllByGuild(guildId);
  }

  /**
   * 設定を新規作成する
   */
  async create(config: GuildTicketConfig): Promise<GuildTicketConfig> {
    return this.repository.create(config);
  }

  /**
   * 設定を更新する
   */
  async update(
    guildId: string,
    categoryId: string,
    data: Partial<GuildTicketConfig>,
  ): Promise<GuildTicketConfig> {
    return this.repository.update(guildId, categoryId, data);
  }

  /**
   * 設定を削除する
   */
  async delete(guildId: string, categoryId: string): Promise<void> {
    return this.repository.delete(guildId, categoryId);
  }

  /**
   * ギルドの全設定を削除する
   */
  async deleteAllByGuild(guildId: string): Promise<number> {
    return this.repository.deleteAllByGuild(guildId);
  }

  /**
   * チケットカウンターをインクリメントして新しい値を返す
   */
  async incrementCounter(guildId: string, categoryId: string): Promise<number> {
    return this.repository.incrementCounter(guildId, categoryId);
  }
}

/**
 * IGuildTicketConfigRepository からサービスを生成する
 */
export function createTicketConfigService(
  repository: IGuildTicketConfigRepository,
): TicketConfigService {
  return new TicketConfigService(repository);
}
