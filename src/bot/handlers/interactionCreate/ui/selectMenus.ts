// src/bot/handlers/interactionCreate/ui/selectMenus.ts
// セレクトメニューハンドラのレジストリ

import { guildConfigViewSelectHandler } from "../../../features/guild-config/handlers/ui/guildConfigViewSelectHandler";
import { stickyMessageRemoveSelectHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageRemoveSelectHandler";
import { stickyMessageViewSelectHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageViewSelectHandler";
import { ticketRoleSelectHandler } from "../../../features/ticket/handlers/ui/ticketRoleSelectHandler";
import { ticketSetupRoleSelectHandler } from "../../../features/ticket/handlers/ui/ticketSetupRoleSelectHandler";
import { ticketTeardownSelectHandler } from "../../../features/ticket/handlers/ui/ticketTeardownSelectHandler";
import { ticketViewSelectHandler } from "../../../features/ticket/handlers/ui/ticketViewSelectHandler";
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
  // チケット setup のスタッフロール選択を処理
  ticketSetupRoleSelectHandler,
  // チケット set-roles / add-roles / remove-roles のロール選択を処理
  ticketRoleSelectHandler,
  // VC募集 add-role のロール選択を処理
  vcRecruitAddRoleSelectHandler,
];

export const stringSelectHandlers: StringSelectHandler[] = [
  // guild-config view ページセレクトメニューを処理
  guildConfigViewSelectHandler,
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
  // チケット teardown のカテゴリ選択を処理
  ticketTeardownSelectHandler,
  // チケット view のカテゴリ選択を処理
  ticketViewSelectHandler,
];
