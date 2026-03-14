// src/shared/locale/locales/ja/resources.ts
// 日本語翻訳リソースのエクスポート

import { commands } from "./commands";
import { common } from "./common";
import { errors } from "./errors";
import { events } from "./events";
import { system } from "./system";

export const ja: {
  common: typeof common;
  commands: typeof commands;
  errors: typeof errors;
  events: typeof events;
  system: typeof system;
} = {
  common,
  commands,
  errors,
  events,
  system,
};

export type JapaneseTranslations = typeof ja;
