// src/shared/database/types/reactionRoleTypes.ts
// リアクションロール機能のエンティティ型定義

export interface GuildReactionRolePanel {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  mode: string; // "toggle" | "one-action" | "exclusive"
  title: string;
  description: string;
  color: string;
  buttons: string; // JSON: ReactionRoleButton[]
  buttonCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReactionRoleButton {
  buttonId: number;
  label: string;
  emoji: string;
  style: string; // "Primary" | "Secondary" | "Success" | "Danger"
  roleIds: string[];
}
