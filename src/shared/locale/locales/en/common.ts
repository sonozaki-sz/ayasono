// src/shared/locale/locales/en/common.ts
// Common translations (English)

export const common = {
  // State labels
  success: "Success",
  info: "Information",
  warning: "Warning",
  error: "Error",
  enabled: "Enabled",
  disabled: "Disabled",
  none: "None",
} as const;

export type CommonTranslations = typeof common;
