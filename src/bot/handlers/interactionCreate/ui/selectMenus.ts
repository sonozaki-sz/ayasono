// src/bot/handlers/interactionCreate/ui/selectMenus.ts
// セレクトメニューハンドラのレジストリ

import { stickyMessageRemoveSelectHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageRemoveSelectHandler";
import { stickyMessageViewSelectHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageViewSelectHandler";
import { vcPanelUserSelectHandler } from "../../../features/vc-panel/handlers/ui/vcPanelUserSelect";
import { vcRecruitAddRoleSelectHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitAddRoleSelectHandler";
import { vcRecruitRemoveRoleSelectHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitRemoveRoleSelectHandler";
import { vcRecruitStringSelectHandler } from "../../../features/vc-recruit/handlers/ui/vcRecruitStringSelect";
import type {
  RoleSelectHandler,
  StringSelectHandler,
  UserSelectHandler,
} from "./types";

export const userSelectHandlers: UserSelectHandler[] = [];

export const roleSelectHandlers: RoleSelectHandler[] = [
  // VC募集 add-role のロール選択を処理
  vcRecruitAddRoleSelectHandler,
];

export const stringSelectHandlers: StringSelectHandler[] = [
  // sticky-message remove コマンドのチャンネル選択を処理
  stickyMessageRemoveSelectHandler,
  // sticky-message view コマンドのチャンネル選択を処理
  stickyMessageViewSelectHandler,
  // VC操作パネルの AFK 移動ユーザー選択を処理（VAC・VC募集など共用）
  vcPanelUserSelectHandler,
  // VC募集のメンション/VC選択を処理
  vcRecruitStringSelectHandler,
  // VC募集 remove-role のロール選択を処理
  vcRecruitRemoveRoleSelectHandler,
];
