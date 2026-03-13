// src/shared/locale/locales/ja/events.ts
// イベント関連の翻訳リソース

export const events = {
  // Bumpリマインダー機能のリメインドメッセージ
  // サービス別（Disboard / Dissoku）と共通フォールバックを持つ
  "bump-reminder.reminder_message.disboard":
    "⏰ `/bump` が出来るようになったよ！",
  "bump-reminder.reminder_message.dissoku":
    "⏰ `/up` が出来るようになったよ！",
  "bump-reminder.reminder_message":
    "⏰ **Bump出来るようになったよ！**",

  // Bumpリマインダー機能のBump検知時パネル
  // パネル本体（タイトル/予定時刻表示）
  "bump-reminder.panel.title":
    "Bumpリマインダー機能",
  "bump-reminder.panel.scheduled_at":
    "<t:{{timestamp}}:R>にリマインドが通知されます。",
  // パネルボタンラベル（通知受け取り ON/OFF）
  "bump-reminder.panel.button_mention_on":
    "通知を受け取る",
  "bump-reminder.panel.button_mention_off":
    "通知を受け取らない",
  // パネル操作結果（追加/削除/状態通知）
  "bump-reminder.panel.mention_added":
    "{{user}} をBump通知リストに登録しました。",
  "bump-reminder.panel.mention_removed":
    "{{user}} をBump通知リストから解除しました。",
  "bump-reminder.panel.already_added":
    "既にBump通知リストに登録されています。",
  "bump-reminder.panel.not_in_list":
    "Bump通知リストに登録されていません。",
  "bump-reminder.panel.success_title":
    "設定完了",
  "bump-reminder.panel.error":
    "Bump通知リストの更新に失敗しました。",

  // メンバーログ機能のEmbed
  // 参加通知Embedのフィールドラベル・フッター
  "member-log.join.title":
    "👋 新しいメンバーが参加しました！",
  "member-log.join.fields.username":
    "ユーザー",
  "member-log.join.fields.accountCreated":
    "アカウント作成日時",
  "member-log.join.fields.serverJoined":
    "サーバー参加日時",
  "member-log.join.fields.memberCount":
    "メンバー数",
  "member-log.join.footer":
    "ようこそ！",
  // 退出通知Embedのフィールドラベル・フッター
  "member-log.leave.title":
    "👋 メンバーが退出しました。",
  "member-log.leave.fields.username":
    "ユーザー",
  "member-log.leave.fields.accountCreated":
    "アカウント作成日時",
  "member-log.leave.fields.serverJoined":
    "サーバー参加日時",
  "member-log.leave.fields.serverLeft":
    "サーバー退出日時",
  "member-log.leave.fields.stayDuration":
    "滞在期間",
  "member-log.leave.fields.memberCount":
    "メンバー数",
  "member-log.leave.footer":
    "またね！",
  "member-log.leave.footer_with_number":
    "またね！ • Member #{{number}}",
  // 日・単位ラベル
  "member-log.days":
    "{{count}}日",
  "member-log.member_count":
    "{{count}}名",
  "member-log.unknown":
    "不明",
  // 経過期間フォーマット
  "member-log.age.years":
    "{{count}}年",
  "member-log.age.months":
    "{{count}}ヶ月",
  "member-log.age.days":
    "{{count}}日",
  "member-log.age.separator":
    "",
  // チャンネル削除時の再設定案内（システムチャンネルへ送信）
  "member-log.channel_deleted_notice":
    "⚠️ メンバーログの通知チャンネルが削除されました。\n設定をリセットしたので、`/member-log-config set-channel` で再設定してください。",
} as const;

export type EventsTranslations = typeof events;
