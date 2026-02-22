// src/bot/features/sticky-message/repositories/types.ts
// スティッキーメッセージ repository の型定義

/**
 * StickyMessage エンティティ
 */
export interface StickyMessage {
  id: string;
  guildId: string;
  channelId: string;
  content: string;
  embedData: string | null; // JSON 文字列
  updatedBy: string | null; // 最終設定・更新者の Discord ユーザーID
  lastMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * スティッキーメッセージ Repository インターフェース
 */
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
  deleteByChannel(channelId: string): Promise<void>;
}
