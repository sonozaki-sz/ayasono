// src/bot/handlers/buttons/index.ts
// ボタンハンドラのレジストリ

import type { ButtonInteraction } from "discord.js";
import { bumpPanelButtonHandler } from "./bumpPanel";

/**
 * ボタンハンドラのインターフェース
 * 新機能のボタンを追加する場合は実装して buttonHandlers に追加する
 */
export interface ButtonHandler {
  /** このハンドラが処理すべき customId か判定 */
  matches: (customId: string) => boolean;
  /** ボタンの処理を実行 */
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

/** 登録済みボタンハンドラ一覧 */
export const buttonHandlers: ButtonHandler[] = [bumpPanelButtonHandler];
