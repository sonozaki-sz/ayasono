// src/bot/handlers/interactionCreate/ui/buttons.ts
// ボタンハンドラのレジストリ

import { bumpPanelButtonHandler } from "../../../features/bump-reminder/handlers/ui/bumpPanelButtonHandler";
import { guildConfigViewButtonHandler } from "../../../features/guild-config/handlers/ui/guildConfigViewButtonHandler";
import { stickyMessageRemoveButtonHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageRemoveButtonHandler";
import { ticketButtonHandler } from "../../../features/ticket/handlers/ui/ticketButtonHandler";
import { ticketCreateButtonHandler } from "../../../features/ticket/handlers/ui/ticketCreateButtonHandler";
import { ticketTeardownButtonHandler } from "../../../features/ticket/handlers/ui/ticketTeardownButtonHandler";
import { ticketViewButtonHandler } from "../../../features/ticket/handlers/ui/ticketViewButtonHandler";
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
  // チケット操作ボタン（クローズ・再オープン・削除）を処理
  ticketButtonHandler,
  // チケットパネルの「チケットを作成」ボタンを処理
  ticketCreateButtonHandler,
  // チケット撤去の確認・キャンセル・全選択ボタンを処理
  ticketTeardownButtonHandler,
  // チケット設定表示のページネーションボタンを処理
  ticketViewButtonHandler,
  // VC操作パネルのボタン入力を処理（VAC・VC募集など共用）
  vcPanelButtonHandler,
  // VC募集パネルのボタン入力を処理
  vcRecruitButtonHandler,
  // VC募集メッセージのボタン入力を処理（削除・終了・VC名変更）
  vcRecruitPostButtonHandler,
  // VC募集 add-role / remove-role の確認・キャンセルボタンを処理
  vcRecruitRoleButtonHandler,
];
