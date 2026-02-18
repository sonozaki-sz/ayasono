// src/shared/locale/locales/ja/commands.ts
// コマンド関連の翻訳リソース

export const commands = {
  // Ping コマンド
  "ping.description": "ボットの応答速度を確認。",
  "ping.embed.measuring": "🏓 計測中...",
  "ping.embed.response":
    "📡 API レイテンシー: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // クールダウン
  "cooldown.wait": "⏱️ このコマンドは **{{seconds}}秒後** に使用できます。",

  // AFKコマンド
  "afk.description": "AFKチャンネルにユーザーを移動。",
  "afk.user.description": "移動するユーザー（省略で自分）",
  "afk.embed.moved": "{{user}} を {{channel}} に移動しました",

  // AFK設定コマンド
  "afk-config.description": "AFK機能の設定（管理者専用）",
  "afk-config.set-ch.description": "AFKチャンネルを設定。",
  "afk-config.set-ch.channel.description": "AFKチャンネル（ボイスチャンネル）",
  "afk-config.show.description": "現在の設定を表示。",
  "afk-config.embed.title": "AFK機能",
  "afk-config.embed.set_ch_success":
    "AFKチャンネルを {{channel}} に設定しました",
  "afk-config.embed.not_configured": "AFKチャンネルが設定されていません",
  "afk-config.embed.field.channel": "AFKチャンネル",

  // Bumpリマインダー設定コマンド（Discord UIラベル）
  "bump-reminder-config.description": "Bumpリマインダーの設定（管理者専用）",
  "bump-reminder-config.enable.description": "Bumpリマインダー機能を有効化",
  "bump-reminder-config.disable.description": "Bumpリマインダー機能を無効化",
  "bump-reminder-config.set-mention.description":
    "メンションロール・ユーザーを設定",
  "bump-reminder-config.set-mention.role.description":
    "リマインダーでメンションするロール",
  "bump-reminder-config.set-mention.user.description":
    "リマインダーでメンションするユーザー（追加・削除切替）",
  "bump-reminder-config.remove-mention.description": "メンション設定を削除",
  "bump-reminder-config.remove-mention.target.description": "削除対象",
  "bump-reminder-config.remove-mention.target.role": "ロール設定",
  "bump-reminder-config.remove-mention.target.user": "ユーザー（選択UI）",
  "bump-reminder-config.remove-mention.target.users": "全ユーザー",
  "bump-reminder-config.remove-mention.target.all": "ロール＋全ユーザー",
  "bump-reminder-config.show.description": "現在の設定を表示",

  // Bumpリマインダー設定コマンド レスポンス
  "bump-reminder-config.embed.success_title": "設定完了",
  "bump-reminder-config.embed.not_configured":
    "Bumpリマインダーが設定されていません。",
  "bump-reminder-config.embed.select_users_to_remove":
    "削除するユーザーを選択してください：",
  "bump-reminder-config.embed.enable_success":
    "Bumpリマインダー機能を有効化しました",
  "bump-reminder-config.embed.disable_success":
    "Bumpリマインダー機能を無効化しました",
  "bump-reminder-config.embed.set_mention_role_success":
    "メンションロールを {{role}} に設定しました",
  "bump-reminder-config.embed.set_mention_user_added":
    "{{user}} をメンションリストに追加しました",
  "bump-reminder-config.embed.set_mention_user_removed":
    "{{user}} をメンションリストから削除しました",
  "bump-reminder-config.embed.set_mention_error_title": "入力エラー",
  "bump-reminder-config.embed.set_mention_error":
    "ロールまたはユーザーを指定してください",
  "bump-reminder-config.embed.remove_mention_role":
    "メンションロールの登録を削除しました",
  "bump-reminder-config.embed.remove_mention_users":
    "全てのメンションユーザーを削除しました",
  "bump-reminder-config.embed.remove_mention_all":
    "全てのメンション設定を削除しました",
  "bump-reminder-config.embed.remove_mention_select":
    "以下のユーザーをメンションリストから削除しました：\n{{users}}",
  "bump-reminder-config.embed.remove_mention_error_title": "削除エラー",
  "bump-reminder-config.embed.remove_mention_error_no_users":
    "削除するユーザーが登録されていません",
  "bump-reminder-config.embed.title": "Bumpリマインダー機能",
  "bump-reminder-config.embed.status": "現在の設定状態",
  "bump-reminder-config.embed.field.status": "状態",
  "bump-reminder-config.embed.field.mention_role": "メンションロール",
  "bump-reminder-config.embed.field.mention_users": "メンションユーザー",
} as const;

export type CommandsTranslations = typeof commands;
