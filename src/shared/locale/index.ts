// src/shared/locale/index.ts
// ロケール関連のエクスポート

export { getCommandLocalizations } from "./commandLocalizations";
export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./i18n";
export {
  LocaleManager,
  localeManager,
  tDefault,
  tGuild,
} from "./LocaleManager";
export { resources } from "./locales";
