// src/shared/locale/locales/ja/resources.ts
// 日本語翻訳リソースのエクスポート

import { common } from "./common";
import {
  afk,
  bumpReminder,
  guildConfig,
  help,
  memberLog,
  messageDelete,
  ping,
  stickyMessage,
  ticket,
  vac,
  vc,
  vcRecruit,
} from "./features";
import { system } from "./system";

export const ja: {
  common: typeof common;
  system: typeof system;
  ping: typeof ping;
  help: typeof help;
  afk: typeof afk;
  bumpReminder: typeof bumpReminder;
  vac: typeof vac;
  vc: typeof vc;
  messageDelete: typeof messageDelete;
  memberLog: typeof memberLog;
  stickyMessage: typeof stickyMessage;
  ticket: typeof ticket;
  vcRecruit: typeof vcRecruit;
  guildConfig: typeof guildConfig;
} = {
  common,
  system,
  ping,
  help,
  afk,
  bumpReminder,
  vac,
  vc,
  messageDelete,
  memberLog,
  stickyMessage,
  ticket,
  vcRecruit,
  guildConfig,
};

export type JapaneseTranslations = typeof ja;
