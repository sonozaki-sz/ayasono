// src/bot/handlers/interactionCreate/ui/modals.ts
// モーダルハンドラーレジストリ

import { stickyMessageSetModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageSetModalHandler";
import { vacPanelModalHandler } from "../../../features/vac/handlers/ui/vacPanelModal";
import type { ModalHandler } from "./types";

export const modalHandlers: ModalHandler[] = [
  // VAC 操作パネルのモーダル送信を処理
  vacPanelModalHandler,
  // sticky-message set モーダル（プレーンテキスト入力）を処理
  stickyMessageSetModalHandler,
];
