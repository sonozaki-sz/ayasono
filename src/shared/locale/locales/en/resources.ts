// src/shared/locale/locales/en/resources.ts
// English translation resources export

import { commands } from "./commands";
import { common } from "./common";
import { errors } from "./errors";
import { events } from "./events";
import { system } from "./system";

export const en: {
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

export type EnglishTranslations = typeof en;
