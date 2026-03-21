// src/shared/locale/locales/ja/resources.ts
// 日本語翻訳リソースのエクスポート

import { common } from "./common";
import {
  afk,
  bumpReminder,
  memberLog,
  messageDelete,
  ping,
  stickyMessage,
  vac,
  vc,
  vcRecruit,
} from "./features";
import { system } from "./system";

export const ja: {
  common: typeof common;
  system: typeof system;
  ping: typeof ping;
  afk: typeof afk;
  bumpReminder: typeof bumpReminder;
  vac: typeof vac;
  vc: typeof vc;
  messageDelete: typeof messageDelete;
  memberLog: typeof memberLog;
  stickyMessage: typeof stickyMessage;
  vcRecruit: typeof vcRecruit;
} = {
  common,
  system,
  ping,
  afk,
  bumpReminder,
  vac,
  vc,
  messageDelete,
  memberLog,
  stickyMessage,
  vcRecruit,
};

export type JapaneseTranslations = typeof ja;
