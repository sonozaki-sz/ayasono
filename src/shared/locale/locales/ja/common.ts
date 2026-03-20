// src/shared/locale/locales/ja/common.ts
// 共通の翻訳リソース

export const common = {
  // 状態ラベル
  // メッセージEmbedのタイトル・フィールドで共通利用
  success: "成功",
  info: "情報",
  warning: "警告",
  error: "エラー",
  // 機能設定の ON/OFF 表示
  enabled: "有効",
  disabled: "無効",
  // 未設定/空状態のプレースホルダ
  none: "なし",

  // Embed タイトル（体言止め）
  // ステータス通知 Embed の options.title で使用する標準タイトル
  title_permission_denied: "権限不足",
  title_bot_permission_denied: "Bot権限不足",
  title_input_error: "入力エラー",
  title_option_conflict: "オプション競合",
  title_filter_required: "フィルタ不足",
  title_channel_error: "チャンネルエラー",
  title_channel_not_found: "チャンネル不在",
  title_not_in_vc: "VC未参加",
  title_config_required: "設定不足",
  title_resource_not_found: "リソース不在",
  title_limit_exceeded: "上限超過",
  title_role_limit_exceeded: "ロール上限超過",
  title_timeout: "タイムアウト",
  title_already_running: "実行中",
  title_already_registered: "登録済み",
  title_not_configured: "未設定",
  title_server_only: "サーバー専用",
  title_operation_error: "操作エラー",
  title_scan_error: "収集エラー",
  title_delete_error: "削除エラー",
  title_move_failed: "移動失敗",
  title_rate_limited: "レート制限",
  title_config_error: "設定エラー",
} as const;

export type CommonTranslations = typeof common;
