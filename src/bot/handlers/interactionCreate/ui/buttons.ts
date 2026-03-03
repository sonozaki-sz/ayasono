// src/bot/handlers/interactionCreate/ui/buttons.ts
// ボタンハンドラのレジストリ

import { bumpPanelButtonHandler } from "../../../features/bump-reminder/handlers/ui/bumpPanelButtonHandler";
import { vcPanelButtonHandler } from "../../../features/vc-panel/handlers/ui/vcPanelButton";
import { vcRecruitButtonHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitButton";
import type { ButtonHandler } from "./types";

export const buttonHandlers: ButtonHandler[] = [
  // customId プレフィックスで bump パネル操作を処理
  bumpPanelButtonHandler,
  // VC操作パネルのボタン入力を処理（VAC・VC募集など共用）
  vcPanelButtonHandler,
  // VC募集パネルのボタン入力を処理
  vcRecruitButtonHandler,
];
