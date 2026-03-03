// src/bot/handlers/interactionCreate/ui/modals.ts
// モーダルハンドラーレジストリ

import { stickyMessageSetEmbedModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler";
import { stickyMessageSetModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageSetModalHandler";
import { stickyMessageUpdateEmbedModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler";
import { stickyMessageUpdateModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler";
import { vcPanelModalHandler } from "../../../features/vc-panel/handlers/ui/vcPanelModal";
import { vcRecruitModalHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitModal";
import type { ModalHandler } from "./types";

export const modalHandlers: ModalHandler[] = [
  // VC操作パネルのモーダル送信を処理（VAC・VC募集など共用）
  vcPanelModalHandler,
  // VC募集モーダル送信（ステップ1→2）を処理
  vcRecruitModalHandler,
  // sticky-message set プレーンテキストモーダルを処理
  stickyMessageSetModalHandler,
  // sticky-message set Embed モーダルを処理
  stickyMessageSetEmbedModalHandler,
  // sticky-message update プレーンテキストモーダルを処理
  stickyMessageUpdateModalHandler,
  // sticky-message update Embed モーダルを処理
  stickyMessageUpdateEmbedModalHandler,
];
