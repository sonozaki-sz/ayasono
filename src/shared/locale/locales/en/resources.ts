// src/shared/locale/locales/en/resources.ts
// English translation resources export

import { common } from "./common";
import {
  afk,
  bumpReminder,
  guildConfig,
  memberLog,
  messageDelete,
  ping,
  stickyMessage,
  vac,
  vc,
  vcRecruit,
} from "./features";
import { system } from "./system";

export const en: {
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
  guildConfig: typeof guildConfig;
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
  guildConfig,
};

export type EnglishTranslations = typeof en;
