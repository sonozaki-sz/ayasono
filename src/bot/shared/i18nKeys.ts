// src/bot/shared/i18nKeys.ts
// 複数のコマンドで共通して使われる i18n キー定数

export const COMMON_I18N_KEYS = {
  GUILD_ONLY: "common:validation.guild_only",
  INVALID_SUBCOMMAND: "common:validation.invalid_subcommand",
  MANAGE_GUILD_REQUIRED: "common:permission.manage_guild_required",
} as const;
