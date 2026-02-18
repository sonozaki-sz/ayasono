// src/bot/handlers/modals/index.ts
// モーダルハンドラーレジストリ（カスタムIDプレフィックスベースのルーティング）

import type { ModalSubmitInteraction } from "discord.js";

/**
 * モーダルハンドラーのインターフェース
 * ButtonHandler と同じパターンで、customId のプレフィックスマッチングをサポートする
 */
export interface ModalHandler {
  /** このハンドラーが指定された customId を処理するかどうかを判定 */
  matches: (customId: string) => boolean;
  /** モーダル送信時の実行ロジック */
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

/**
 * 登録済みモーダルハンドラーの一覧
 * 新しいモーダルを追加する場合はここに push すること
 */
export const modalHandlers: ModalHandler[] = [];
