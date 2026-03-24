// src/bot/handlers/interactionCreate/ui/buttons.ts
// ボタンハンドラのレジストリ

import { bumpPanelButtonHandler } from "../../../features/bump-reminder/handlers/ui/bumpPanelButtonHandler";
import { guildConfigViewButtonHandler } from "../../../features/guild-config/handlers/ui/guildConfigViewButtonHandler";
import { stickyMessageRemoveButtonHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageRemoveButtonHandler";
import { vcPanelButtonHandler } from "../../../features/vc-panel/handlers/ui/vcPanelButton";
import { vcRecruitButtonHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitButton";
import { vcRecruitPostButtonHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitPostButton";
import { vcRecruitRoleButtonHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitRoleButtonHandler";
import type { ButtonHandler } from "./types";

export const buttonHandlers: ButtonHandler[] = [
  // guild-config view ページネーションボタンを処理
  guildConfigViewButtonHandler,
  // customId プレフィックスで bump パネル操作を処理
  bumpPanelButtonHandler,
  // sticky-message remove の「削除する」ボタンを処理
  stickyMessageRemoveButtonHandler,
  // VC操作パネルのボタン入力を処理（VAC・VC募集など共用）
  vcPanelButtonHandler,
  // VC募集パネルのボタン入力を処理
  vcRecruitButtonHandler,
  // VC募集メッセージのボタン入力を処理（削除・終了・VC名変更）
  vcRecruitPostButtonHandler,
  // VC募集 add-role / remove-role の確認・キャンセルボタンを処理
  vcRecruitRoleButtonHandler,
];
