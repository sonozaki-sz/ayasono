// src/bot/handlers/interactionCreate/ui/modals.ts
// モーダルハンドラーレジストリ

import { vacPanelModalHandler } from "../../../features/vac/handlers/ui";
import type { ModalHandler } from "./types";

export const modalHandlers: ModalHandler[] = [
  // VAC 操作パネルのモーダル送信を処理
  vacPanelModalHandler,
];
