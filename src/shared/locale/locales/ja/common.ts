// src/shared/locale/locales/ja/common.ts
// 共通の翻訳リソース

export const common = {
  // 状態ラベル
  success: "成功",
  info: "情報",
  warning: "警告",
  error: "エラー",
  enabled: "有効",
  disabled: "無効",
  none: "なし",
} as const;

export type CommonTranslations = typeof common;
