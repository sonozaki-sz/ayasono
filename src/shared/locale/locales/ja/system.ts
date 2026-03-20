// src/shared/locale/locales/ja/system.ts
// システムメッセージの翻訳リソース

export const system = {
  // ログプレフィックス
  // logPrefixed() ヘルパーで自動付与される機能名・イベント名
  "log_prefix.bot": "Bot",
  "log_prefix.bump_reminder": "Bumpリマインダー",
  "log_prefix.sticky_message": "スティッキーメッセージ",
  "log_prefix.member_log": "メンバーログ",
  "log_prefix.vac": "VAC",
  "log_prefix.vc_recruit": "VC募集",
  "log_prefix.msg_del": "メッセージ削除",
  "log_prefix.afk": "AFK",
  "log_prefix.database": "データベース",
  "log_prefix.cooldown": "クールダウン",
  "log_prefix.scheduler": "スケジューラー",
  "log_prefix.web": "Webサーバー",
  "log_prefix.json": "JSON",
  "log_prefix.interaction_create": "interactionCreate",
  "log_prefix.guild_member_add": "guildMemberAdd",
  "log_prefix.guild_member_remove": "guildMemberRemove",
  "log_prefix.message_create": "messageCreate",
  "log_prefix.message_delete": "messageDelete",
  "log_prefix.voice_state_update": "voiceStateUpdate",
  "log_prefix.channel_delete": "channelDelete",
  "log_prefix.ready": "ready",

  // Bot起動・シャットダウン
  "bot.starting":
    "Discord Botを起動しています...",
  "bot.commands.registering":
    "{{count}}個のコマンドを登録しています...",
  "bot.commands.registered":
    "コマンド登録完了",
  "bot.commands.command_registered":
    "  ✓ /{{name}}",
  "bot.events.registering":
    "{{count}}個のイベントを登録しています...",
  "bot.events.registered":
    "イベント登録完了",
  "bot.startup.error":
    "起動中にエラーが発生しました:",
  "bot.startup.failed":
    "起動失敗:",
  "bot.client.initialized":
    "Discord Botクライアントを初期化しました。",
  "bot.client.shutting_down":
    "Botクライアントをシャットダウンしています...",
  "bot.client.shutdown_complete":
    "Botクライアントのシャットダウンが完了しました。",
  "bot.presence_activity":
    "せいちょーちう。 | {{count}} servers | by sonozaki",

  // Bumpリマインダー検知ログ
  "bump-reminder.detected":
    "Bumpを検知 GuildId: {{guildId}} Service: {{service}}",
  "bump-reminder.detection_failed":
    "Bump検知処理に失敗 GuildId: {{guildId}}",
  // Bump パネルボタン操作ログ
  "bump-reminder.panel_mention_updated":
    "メンション {{action}} UserId: {{userId}} GuildId: {{guildId}}",
  "bump-reminder.panel_handle_failed":
    "パネルボタン処理失敗",
  "bump-reminder.panel_reply_failed":
    "パネルボタン エラー返信失敗",
  // Bumpリマインダー設定コマンド操作ログ
  // `config_*` は管理コマンド経由の操作監査で利用する
  "bump-reminder.config_enabled":
    "有効化 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "bump-reminder.config_disabled":
    "無効化 GuildId: {{guildId}}",
  "bump-reminder.config_mention_set":
    "メンションロール設定 GuildId: {{guildId}} RoleId: {{roleId}}",
  "bump-reminder.config_mention_removed":
    "メンション設定削除 GuildId: {{guildId}} Target: {{target}}",
  "bump-reminder.config_users_removed":
    "メンションユーザー削除 GuildId: {{guildId}} UserIds: {{userIds}}",

  // エラーハンドリング
  "error.reply_failed":
    "エラーメッセージの送信に失敗しました。",
  "error.unhandled_rejection":
    "未処理のPromise拒否:",
  "error.uncaught_exception":
    "未処理の例外:",
  "error.unhandled_rejection_log":
    "未処理のPromise拒否:",
  "error.uncaught_exception_log":
    "未捕捉の例外:",
  "error.node_warning":
    "Node警告:",
  "error.global_handlers_already_registered":
    "グローバルエラーハンドラーは既に登録済みです。スキップします。",
  "error.shutdown_handlers_already_registered":
    "グレースフルシャットダウンハンドラーは既に登録済みです。スキップします。",

  // ロケール
  "locale.manager_initialized":
    "LocaleManagerをi18nextで初期化しました。",

  // クールダウンマネージャー
  "cooldown.cleared_all":
    "すべてのクールダウンをクリアしました。",
  "cooldown.destroyed":
    "CooldownManager を破棄しました。",
  "cooldown.reset":
    "リセット CommandName: {{commandName}} UserId: {{userId}}",
  "cooldown.cleared_for_command":
    "コマンドの全クールダウンをクリア CommandName: {{commandName}}",
  "cooldown.cleanup":
    "{{count}}個の期限切れクールダウンを削除しました。",

  // スケジューラー
  // 汎用ジョブ実行ログ
  // リマインダー以外も含む共通ジョブ実行トレース
  "scheduler.stopping":
    "すべてのスケジュール済みジョブを停止中...",
  "scheduler.job_exists":
    "Job既存のため古いJobを削除 JobId: {{jobId}}",
  "scheduler.executing_job":
    "Job実行中 JobId: {{jobId}}",
  "scheduler.job_completed":
    "Job完了 JobId: {{jobId}}",
  "scheduler.job_error":
    "Jobエラー JobId: {{jobId}}",
  "scheduler.schedule_failed":
    "Jobスケジュール失敗 JobId: {{jobId}}",
  "scheduler.job_removed":
    "Job削除 JobId: {{jobId}}",
  "scheduler.job_stopped":
    "Job停止 JobId: {{jobId}}",
  "scheduler.job_scheduled":
    "Jobスケジュール完了 JobId: {{jobId}}",
  // Bump リマインダーのスケジューリング/復元ログ
  // スケジュール→実行→復元→重複解消の順でキーを並べ、運用時の参照順を固定する
  "scheduler.bump_reminder_task_failed":
    "タスク失敗 GuildId: {{guildId}}",
  "scheduler.bump_reminder_description":
    "GuildId: {{guildId}} ExecuteAt: {{executeAt}}",
  "scheduler.bump_reminder_scheduled":
    "{{minutes}} 分後にリマインダーをスケジュール GuildId: {{guildId}}",
  "scheduler.bump_reminder_cancelling":
    "既存リマインダーをキャンセル中 GuildId: {{guildId}}",
  "scheduler.bump_reminder_cancelled":
    "リマインダーをキャンセルしました。 GuildId: {{guildId}}",
  "scheduler.bump_reminder_executing_immediately":
    "期限切れリマインダーを即座に実行 GuildId: {{guildId}}",
  "scheduler.bump_reminders_restored":
    "保留中リマインダー {{count}} 件を復元",
  "scheduler.bump_reminders_restored_none":
    "復元対象のリマインダーなし",
  "scheduler.bump_reminder_sent":
    "リマインダーを送信 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_send_failed":
    "リマインダー送信に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_channel_not_found":
    "チャンネルが見つかりません。 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_disabled":
    "無効化されています。 GuildId: {{guildId}}",
  "scheduler.bump_reminder_restore_failed":
    "復元に失敗:",
  "scheduler.bump_reminder_duplicates_cancelled":
    "重複リマインダー {{count}} 件をキャンセル",
  "scheduler.bump_reminder_duplicates_none":
    "重複リマインダーなし",
  // パネル同期・チャンネル整合性チェック関連ログ
  // パネル関連キーは近接配置して grep 時の追跡コストを下げる
  "scheduler.bump_reminder_unregistered_channel":
    "未登録チャンネルのためスキップ GuildId: {{guildId}} ChannelId: {{channelId}} ExpectedChannelId: {{expectedChannelId}}",
  "scheduler.bump_reminder_orphaned_panel_delete_failed":
    "孤立パネルメッセージ削除失敗 PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_deleted":
    "パネルメッセージを削除 GuildId: {{guildId}} PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_delete_failed":
    "パネルメッセージ削除失敗 PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_send_failed":
    "パネルの送信に失敗",

  // シャットダウン
  "shutdown.signal_received":
    "{{signal}} を受信、適切にシャットダウンしています...",
  "shutdown.already_in_progress":
    "{{signal}} を受信しましたが、シャットダウンは既に進行中です。",
  "shutdown.cleanup_complete":
    "クリーンアップ完了",
  "shutdown.cleanup_failed":
    "クリーンアップ中のエラー:",
  "shutdown.gracefully":
    "適切にシャットダウンしています...",
  "shutdown.sigterm":
    "SIGTERMを受信、シャットダウンしています...",

  // データベース操作ログ
  // Prisma クライアント
  "database.prisma_not_available":
    "Prismaクライアントが利用できません。",
  // GuildConfig 操作ログ
  "database.get_config_log":
    "設定取得に失敗 GuildId: {{guildId}}",
  "database.save_config_log":
    "設定保存に失敗 GuildId: {{guildId}}",
  "database.saved_config":
    "設定を保存 GuildId: {{guildId}}",
  "database.update_config_log":
    "設定更新に失敗 GuildId: {{guildId}}",
  "database.updated_config":
    "設定を更新 GuildId: {{guildId}}",
  "database.delete_config_log":
    "設定削除に失敗 GuildId: {{guildId}}",
  "database.deleted_config":
    "設定を削除 GuildId: {{guildId}}",
  "database.check_existence_log":
    "存在確認に失敗 GuildId: {{guildId}}",

  // Bumpリマインダーデータベース操作
  // BumpReminder テーブル操作ログ
  // リマインダー永続化レコードのライフサイクルログ
  "database.bump_reminder_created":
    "Bumpリマインダーを作成 Id: {{id}} GuildId: {{guildId}}",
  "database.bump_reminder_create_failed":
    "Bumpリマインダー作成に失敗 GuildId: {{guildId}}",
  "database.bump_reminder_find_failed":
    "Bumpリマインダー取得に失敗 Id: {{id}}",
  "database.bump_reminder_find_all_failed":
    "保留中Bumpリマインダーの取得に失敗",
  "database.bump_reminder_status_updated":
    "Bumpリマインダーのステータスを更新 Id: {{id}} Status: {{status}}",
  "database.bump_reminder_update_failed":
    "Bumpリマインダー更新に失敗 Id: {{id}}",
  "database.bump_reminder_deleted":
    "Bumpリマインダーを削除 Id: {{id}}",
  "database.bump_reminder_delete_failed":
    "Bumpリマインダー削除に失敗 Id: {{id}}",
  "database.bump_reminder_cancelled_by_guild":
    "保留中Bumpリマインダーをキャンセル GuildId: {{guildId}}",
  "database.bump_reminder_cancelled_by_channel":
    "保留中Bumpリマインダーをキャンセル GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.bump_reminder_cancel_failed":
    "Bumpリマインダーキャンセルに失敗 GuildId: {{guildId}}",
  "database.bump_reminder_cleanup_completed":
    "古いBumpリマインダー {{count}} 件をクリーンアップ ({{days}} 日以前)",
  "database.bump_reminder_cleanup_failed":
    "古いBumpリマインダーのクリーンアップに失敗",

  // スティッキーメッセージデータベース操作
  // StickyMessage テーブル操作ログ
  "database.sticky_message_find_by_channel_failed":
    "スティッキーメッセージ取得に失敗 ChannelId: {{channelId}}",
  "database.sticky_message_find_all_by_guild_failed":
    "スティッキーメッセージ全件取得に失敗 GuildId: {{guildId}}",
  "database.sticky_message_create_failed":
    "スティッキーメッセージ作成に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.sticky_message_update_last_message_id_failed":
    "スティッキーメッセージ lastMessageId 更新に失敗 Id: {{id}}",
  "database.sticky_message_update_content_failed":
    "スティッキーメッセージ内容更新に失敗 Id: {{id}}",
  "database.sticky_message_delete_failed":
    "スティッキーメッセージ削除に失敗 Id: {{id}}",
  "database.sticky_message_delete_by_channel_failed":
    "スティッキーメッセージ削除に失敗 ChannelId: {{channelId}}",

  // UserSetting DB操作ログ
  // user_settings テーブル操作ログ
  "database.user_setting_find_failed":
    "ユーザー設定取得に失敗 UserId: {{userId}} GuildId: {{guildId}}",
  "database.user_setting_upsert_failed":
    "ユーザー設定保存に失敗 UserId: {{userId}} GuildId: {{guildId}}",

  // VAC DB操作ログ
  "database.vac_trigger_added":
    "VACトリガーチャンネルを追加 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_add_failed":
    "VACトリガーチャンネル追加に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_removed":
    "VACトリガーチャンネルを削除 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_remove_failed":
    "VACトリガーチャンネル削除に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_channel_registered":
    "VAC管理チャンネルを登録 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_register_failed":
    "VAC管理チャンネル登録に失敗 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_unregistered":
    "VAC管理チャンネルを削除 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_unregister_failed":
    "VAC管理チャンネル削除に失敗 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",

  // AFK DB操作ログ
  "database.afk_channel_set":
    "AFKチャンネルを設定 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.afk_channel_set_failed":
    "AFKチャンネル設定に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.afk_config_saved":
    "AFK設定を保存 GuildId: {{guildId}}",
  "database.afk_config_save_failed":
    "AFK設定保存に失敗 GuildId: {{guildId}}",

  // Bot起動イベントログ
  // 起動完了時のサマリーログ
  "ready.bot_ready":
    "✅ Botの準備が完了しました！ {{tag}} としてログイン",
  "ready.servers":
    "📊 サーバー数: {{count}}",
  "ready.users":
    "👥 ユーザー数: {{count}}",
  "ready.commands":
    "💬 コマンド数: {{count}}",
  "ready.event_registered":
    "  ✓ {{name}}",

  // インタラクションイベントログ
  // command / modal / button / select 実行トレース
  // 実行成功/失敗を横断的に追跡するためのキー群
  // interaction.* は flow 層のログキーと1:1対応を維持する
  "interaction.unknown_command":
    "不明なコマンド CommandName: {{commandName}}",
  "interaction.command_executed":
    "コマンド実行 CommandName: {{commandName}} UserId: {{userId}}",
  "interaction.command_error":
    "コマンド実行エラー CommandName: {{commandName}}",
  "interaction.autocomplete_error":
    "自動補完エラー CommandName: {{commandName}}",
  "interaction.unknown_modal":
    "不明なモーダル CustomId: {{customId}}",
  "interaction.modal_submitted":
    "モーダル送信 CustomId: {{customId}} UserId: {{userId}}",
  "interaction.modal_error":
    "モーダル実行エラー CustomId: {{customId}}",
  "interaction.button_error":
    "ボタン実行エラー CustomId: {{customId}}",
  "interaction.select_menu_error":
    "セレクトメニュー実行エラー CustomId: {{customId}}",

  // スティッキーメッセージ機能ログ
  // handler / service 層のランタイムログ
  "sticky-message.channel_delete_cleanup":
    "channelDelete時クリーンアップ完了 ChannelId: {{channelId}}",
  "sticky-message.channel_delete_cleanup_failed":
    "channelDelete時レコード削除失敗 ChannelId: {{channelId}}",
  "sticky-message.create_handler_error":
    "messageCreate処理エラー ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.resend_scheduled_error":
    "再送スケジュールエラー",
  "sticky-message.send_failed":
    "メッセージ送信失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.previous_deleted_or_not_found":
    "前回メッセージ削除済みまたは未存在 ChannelId: {{channelId}}",
  "sticky-message.set_failed":
    "モーダルからの設定失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.set_embed_failed":
    "Embedモーダルからの設定失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.update_failed":
    "モーダルからの更新失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.update_embed_failed":
    "Embedモーダルからの更新失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.resend_after_update_failed":
    "更新後の再送信失敗 ChannelId: {{channelId}}",
  "sticky-message.resend_after_embed_update_failed":
    "Embed更新後の再送信失敗 ChannelId: {{channelId}}",

  // AFKコマンドログ
  "afk.moved":
    "ユーザーをAFKチャンネルに移動 GuildId: {{guildId}} UserId: {{userId}} ChannelId: {{channelId}}",
  "afk.configured":
    "AFKチャンネル設定 GuildId: {{guildId}} ChannelId: {{channelId}}",

  // VACログ
  // voiceState / channel lifecycle / panel 操作ログ
  // VAC 実行時ログは運用確認のため近接配置を維持する
  // VAC 起動時クリーンアップログ
  "vac.startup_cleanup_stale_trigger_removed":
    "起動クリーンアップ: 不正トリガーチャンネルを除去 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.startup_cleanup_orphaned_channel_removed":
    "起動クリーンアップ: 存在しないVACチャンネルをDB削除 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.startup_cleanup_empty_channel_deleted":
    "起動クリーンアップ: 空VACチャンネルを削除 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.startup_cleanup_done":
    "起動クリーンアップ完了 トリガー {{removedTriggers}} 件・チャンネル {{removedChannels}} 件を削除",
  "vac.startup_cleanup_done_none":
    "起動クリーンアップ完了 不整合なし",
  "vac.voice_state_update_failed":
    "voiceStateUpdate処理失敗",
  "vac.channel_created":
    "VCチャンネル作成 GuildId: {{guildId}} ChannelId: {{channelId}} OwnerId: {{ownerId}}",
  "vac.channel_deleted":
    "VCチャンネル削除 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.category_full":
    "カテゴリがチャンネル上限に達しました。 GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vac.trigger_removed_by_delete":
    "削除されたトリガーチャンネルを設定から除外 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.channel_delete_sync_failed":
    "channelDelete同期処理失敗",
  "vac.panel_send_failed":
    "操作パネル送信失敗",
  "vac.startup_cleanup_failed":
    "起動時クリーンアップ失敗",

  // Webサーバー
  // 起動/例外処理
  // web.auth_* は API ミドルウェアの認証分岐と対応付ける
  "web.server_started":
    "起動 URL: {{url}}",
  "web.startup_error":
    "起動エラー:",
  "web.unhandled_rejection":
    "未処理のPromise拒否:",
  "web.uncaught_exception":
    "未処理の例外:",
  "web.startup_failed":
    "起動失敗:",
  "web.api_error":
    "APIエラー:",
  "web.internal_server_error":
    "内部サーバーエラー",
  // API認証（Bearer API Key）
  // 認証結果ログとAPI応答文言
  "web.auth_unauthorized":
    "[Auth] 未認証リクエスト Method: {{method}} URL: {{url}}",
  "web.auth_invalid_token":
    "[Auth] 無効なトークン Method: {{method}} URL: {{url}}",
  "web.auth_unauthorized_error":
    "Unauthorized",
  "web.auth_forbidden_error":
    "Forbidden",
  // Authorization ヘッダー不足/不正時の利用者向けガイダンス
  "web.auth_header_required":
    "Authorization: Bearer <api-key> ヘッダーが必要です。",
  "web.auth_invalid_token_message":
    "無効なトークンです。",

  // Discord エラー通知
  "discord.error_notification_title":
    "🚨 {{appName}} エラー通知",

  // メンバーログ機能ログ
  // guildMemberAdd/Remove イベント処理結果ログ
  "member-log.join_notification_sent":
    "参加通知を送信 GuildId: {{guildId}} UserId: {{userId}}",
  "member-log.leave_notification_sent":
    "退出通知を送信 GuildId: {{guildId}} UserId: {{userId}}",
  "member-log.notification_failed":
    "通知送信失敗 GuildId: {{guildId}}",
  "member-log.channel_not_found":
    "チャンネルが見つかりません。 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "member-log.channel_deleted_config_cleared":
    "チャンネルが削除されたため設定をリセットしました。 GuildId: {{guildId}} ChannelId: {{channelId}}",
  // 設定コマンド操作ログ
  "member-log.config_set_channel":
    "チャンネル設定 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "member-log.config_enabled":
    "有効化 GuildId: {{guildId}}",
  "member-log.config_disabled":
    "無効化 GuildId: {{guildId}}",
  "member-log.config_join_message_set":
    "参加メッセージ設定 GuildId: {{guildId}}",
  "member-log.config_leave_message_set":
    "退出メッセージ設定 GuildId: {{guildId}}",
  "member-log.config_join_message_cleared":
    "参加メッセージ削除 GuildId: {{guildId}}",
  "member-log.config_leave_message_cleared":
    "退出メッセージ削除 GuildId: {{guildId}}",

  // 翻訳システム
  "locale.translation_failed":
    "翻訳に失敗しました Key: {{key}}",

  // エラーユーティリティ
  "error.base_error_log":
    "[{{errorName}}] {{message}}",
  "error.unhandled_error_log":
    "[UnhandledError] {{message}}",

  // JSONユーティリティ
  "json.parse_array_failed":
    "parseJsonArray: パースに失敗しました。空配列を返します。 value=\"{{value}}\" error=\"{{error}}\"",

  // VC募集機能ログ
  "vc-recruit.voice_state_update_failed":
    "voiceStateUpdate処理失敗",
  "vc-recruit.empty_vc_deleted":
    "空VCを削除 GuildId: {{guildId}} ChannelId: {{channelId}} ChannelName: {{channelName}}",
  "vc-recruit.voice_state_update_error":
    "voiceStateUpdate処理エラー",
  "vc-recruit.panel_channel_delete_detected":
    "パネルチャンネル削除を検知、投稿チャンネルとセットアップを削除 GuildId: {{guildId}} PanelChannelId: {{panelChannelId}}",
  "vc-recruit.post_channel_delete_failed":
    "投稿チャンネル削除失敗 GuildId: {{guildId}} PostChannelId: {{postChannelId}}",
  "vc-recruit.post_channel_delete_detected":
    "投稿チャンネル削除を検知、パネルチャンネルとセットアップを削除 GuildId: {{guildId}} PostChannelId: {{postChannelId}}",
  "vc-recruit.panel_channel_cleanup_failed":
    "パネルチャンネル削除失敗 GuildId: {{guildId}} PanelChannelId: {{panelChannelId}}",
  "vc-recruit.created_vc_manual_delete_detected":
    "作成VC手動削除を検知、DBを更新し投稿ボタンをVC終了済みに変更 GuildId: {{guildId}} VcId: {{vcId}}",
  "vc-recruit.channel_created":
    "新規VC作成 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vc-recruit.channel_deleted":
    "VC削除 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vc-recruit.recruit_posted":
    "募集メッセージ投稿 GuildId: {{guildId}} UserId: {{userId}}",
  "vc-recruit.setup_created":
    "セットアップ作成 GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vc-recruit.setup_removed":
    "セットアップ削除 GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vc-recruit.panel_delete_detected":
    "パネルメッセージ削除を検知、パネルを再送信します GuildId: {{guildId}} PanelChannelId: {{panelChannelId}} MessageId: {{messageId}}",
  "vc-recruit.panel_resent":
    "パネルメッセージを再送信しました GuildId: {{guildId}} PanelChannelId: {{panelChannelId}} NewMessageId: {{newMessageId}}",

  // メッセージ削除機能ログ
  "message-delete.cmd_all_channels_start":
    "全チャンネル取得開始",
  "message-delete.cmd_channel_count":
    "取得チャンネル数={{count}}",
  "message-delete.svc_scan_start":
    "スキャン開始 channels={{channelCount}} count={{count}} targetUserIds={{targetUserIds}}",
  "message-delete.svc_initial_fetch":
    "初期フェッチ ch={{channelId}}",
  "message-delete.svc_refill":
    "リフィル ch={{channelId}} before={{lastId}}",
  "message-delete.svc_scan_complete":
    "スキャン完了 total={{count}}",
  "message-delete.svc_channel_no_access":
    "チャンネル {{channelId}} はアクセス権なし、スキップ",
  "message-delete.svc_bulk_delete_chunk":
    "bulkDelete チャンク size={{size}}",
  "message-delete.svc_message_delete_failed":
    "メッセージ削除失敗 messageId={{messageId}}: {{error}}",
  "message-delete.scan_error":
    "スキャンエラー: {{error}}",
  "message-delete.delete_error":
    "削除処理エラー: {{error}}",
  "message-delete.deleted":
    "{{userId}} deleted {{count}} messages{{countPart}}{{targetPart}}{{keywordPart}}{{periodPart}} channels=[{{channels}}]",
  "message-delete.lock_acquired":
    "ロック取得: guild={{guildId}}",
  "message-delete.lock_released":
    "ロック解放: guild={{guildId}}",
  "message-delete.cancel_collector_ended":
    "Scan cancelCollector ended: reason={{reason}}",
  "message-delete.aborting_non_user_end":
    "Aborting scan due to non-user end",
} as const;

export type SystemTranslations = typeof system;
