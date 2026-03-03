// src/bot/handlers/interactionCreate/ui/selectMenus.ts
// セレクトメニューハンドラのレジストリ

import { stickyMessageViewSelectHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageViewSelectHandler";
import { vcPanelUserSelectHandler } from "../../../features/vc-panel/handlers/ui/vcPanelUserSelect";
import { vcRecruitStringSelectHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitStringSelect";
import type { StringSelectHandler, UserSelectHandler } from "./types";

export const userSelectHandlers: UserSelectHandler[] = [];

export const stringSelectHandlers: StringSelectHandler[] = [
  // sticky-message view コマンドのチャンネル選択を処理
  stickyMessageViewSelectHandler,
  // VC操作パネルの AFK 移動ユーザー選択を処理（VAC・VC募集など共用）
  vcPanelUserSelectHandler,
  // VC募集のメンション/VC選択を処理
  vcRecruitStringSelectHandler,
];
