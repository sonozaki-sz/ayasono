// src/shared/locale/locales/ja/commands.ts
// コマンド関連の翻訳リソース

export const commands = {
  // Ping コマンド
  "ping.description":
    "ボットの応答速度を確認",
  "ping.embed.measuring":
    "🏓 計測中...",
  "ping.embed.response":
    "📡 API レイテンシー: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // クールダウン
  "cooldown.wait":
    "⏱️ このコマンドは **{{seconds}}秒後** に使用できます。",

  // AFKコマンド
  "afk.description":
    "AFKチャンネルにユーザーを移動",
  "afk.user.description":
    "移動するユーザー（省略で自分）",
  "afk.embed.moved":
    "{{user}} を {{channel}} に移動しました。",

  // AFK設定コマンド
  "afk-config.description":
    "AFK機能の設定（管理者専用）",
  "afk-config.set-channel.description":
    "AFKチャンネルを設定",
  "afk-config.set-channel.channel.description":
    "AFKチャンネル（ボイスチャンネル）",
  "afk-config.view.description":
    "現在の設定を表示",
  "afk-config.embed.title":
    "AFK機能",
  "afk-config.embed.success_title":
    "設定完了",
  "afk-config.embed.set_ch_success":
    "AFKチャンネルを {{channel}} に設定しました。",
  "afk-config.embed.not_configured":
    "AFKチャンネルが設定されていません。",
  "afk-config.embed.field.channel":
    "AFKチャンネル",

  // Bumpリマインダー設定コマンド（Discord UIラベル）
  // スラッシュコマンド本体とサブコマンド説明
  "bump-reminder-config.description":
    "Bumpリマインダーの設定（管理者専用）",
  "bump-reminder-config.enable.description":
    "Bumpリマインダー機能を有効化",
  "bump-reminder-config.disable.description":
    "Bumpリマインダー機能を無効化",
  "bump-reminder-config.set-mention.description":
    "メンションロールを設定",
  "bump-reminder-config.set-mention.role.description":
    "リマインダーでメンションするロール",
  "bump-reminder-config.remove-mention.description":
    "メンションロール設定を削除",
  "bump-reminder-config.view.description":
    "現在の設定を表示",

  // Bumpリマインダー設定コマンド レスポンス
  // 共通状態メッセージ
  // embed.* はコマンド側の成功/失敗ハンドリング順に並べる
  "bump-reminder-config.embed.success_title":
    "設定完了",
  "bump-reminder-config.embed.not_configured":
    "Bumpリマインダーが設定されていません。",
  "bump-reminder-config.embed.enable_success":
    "Bumpリマインダー機能を有効化しました。",
  "bump-reminder-config.embed.disable_success":
    "Bumpリマインダー機能を無効化しました。",
  // メンション設定（ロール設定/削除/入力不備）
  "bump-reminder-config.embed.set_mention_role_success":
    "メンションロールを {{role}} に設定しました。",
  "bump-reminder-config.embed.set_mention_error":
    "メンションロールの設定に失敗しました。",
  "bump-reminder-config.embed.remove_mention_role":
    "メンションロールの登録を削除しました。",
  // view サブコマンド表示用
  "bump-reminder-config.embed.title":
    "Bumpリマインダー機能",
  "bump-reminder-config.embed.status":
    "現在の設定状態",
  "bump-reminder-config.embed.field.status":
    "状態",
  "bump-reminder-config.embed.field.mention_role":
    "メンションロール",
  "bump-reminder-config.embed.field.mention_users":
    "メンションユーザー",

  // VAC設定コマンド
  // トリガーVC管理（作成/削除）
  "vac-config.description":
    "VC自動作成機能の設定（サーバー管理者向け）",
  "vac-config.create-trigger-vc.description":
    "トリガーチャンネルを作成",
  "vac-config.create-trigger-vc.category.description":
    "作成先カテゴリ（TOP またはカテゴリ。未指定時は実行カテゴリ）",
  "vac-config.remove-trigger-vc.description":
    "トリガーチャンネルを削除",
  "vac-config.remove-trigger-vc.category.description":
    "削除対象（TOP またはカテゴリ。未指定時は実行カテゴリ）",
  "vac-config.remove-trigger-vc.category.top":
    "TOP（カテゴリなし）",
  "vac-config.view.description":
    "現在の設定を表示",
  // view サブコマンド表示用
  "vac-config.embed.title":
    "VC自動作成機能",
  "vac-config.embed.success_title":
    "設定完了",
  "vac-config.embed.not_configured":
    "未設定",
  "vac-config.embed.no_created_vcs":
    "なし",
  "vac-config.embed.top":
    "TOP",
  "vac-config.embed.field.trigger_channels":
    "トリガーチャンネル",
  "vac-config.embed.field.created_vcs":
    "作成されたVC数",
  "vac-config.embed.field.created_vc_details":
    "作成されたVC",
  "vac-config.embed.trigger_created":
    "トリガーチャンネル {{channel}} を作成しました。",
  "vac-config.embed.trigger_removed":
    "トリガーチャンネル {{channel}} を削除しました。",
  "vac-config.embed.remove_error_title":
    "削除エラー",

  // VAC操作コマンド
  // VC操作（リネーム/人数上限）
  // `vac.panel.*` はボタン customId の表示順に合わせる
  "vac.description":
    "自動作成VCの設定を変更",
  "vac.vc-rename.description":
    "参加中のVC名を変更",
  "vac.vc-rename.name.description":
    "新しいVC名",
  "vac.vc-limit.description":
    "参加中VCの人数制限を変更",
  "vac.vc-limit.limit.description":
    "人数制限（0=無制限、0~99）",
  "vac.embed.renamed":
    "VC名を {{name}} に変更しました。",
  "vac.embed.limit_changed":
    "人数制限を {{limit}} に設定しました。",
  // パネル内の AFK 一括移動結果メッセージ
  "vac.embed.members_moved":
    "{{channel}} へ移動しました。",
  // パネル再送時（最下部移動）の成功メッセージ
  "vac.embed.panel_refreshed":
    "パネルを最下部に移動しました。",
  // 0人制限を表示する際の共通ラベル
  "vac.embed.unlimited":
    "無制限",
  // 操作パネル UI 文言
  "vac.panel.title":
    "ボイスチャンネル操作パネル",
  // パネル導入説明（Embed本文）
  "vac.panel.description":
    "このパネルからVCの設定を変更できます。",
  // ボタンは command handler の customId と対応づく
  "vac.panel.rename_button":
    "VC名を変更",
  "vac.panel.limit_button":
    "人数制限を変更",
  "vac.panel.limit_input_placeholder":
    "0〜99（0: 無制限）",
  "vac.panel.afk_button":
    "メンバーをAFKに移動",
  "vac.panel.refresh_button":
    "パネルを最下部に移動",

  // メッセージ削除コマンド
  "message-delete.description":
    "メッセージを一括削除します（デフォルト: サーバー全チャンネル）",
  "message-delete.count.description":
    "削除するメッセージ数（1〜1000、未指定時は最新1000件を上限に削除）",
  "message-delete.user.description":
    "削除対象のユーザーID またはメンション（Webhookの場合はIDを直接入力）",
  "message-delete.errors.user_invalid_format":
    "`user` の形式が不正です。ユーザーIDまたはメンション（例: `<@123456789>`）を入力してください。",
  "message-delete.keyword.description":
    "本文に指定キーワードを含むメッセージのみ削除（部分一致）",
  "message-delete.days.description":
    "過去N日以内のメッセージのみ削除（1〜366、after/beforeとの同時指定不可）",
  "message-delete.after.description":
    "この日時以降のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
  "message-delete.before.description":
    "この日時以前のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
  "message-delete.channel.description":
    "削除対象を絞り込むチャンネル（未指定でサーバー全体）",

  // message-delete バリデーションエラー
  "message-delete.errors.no_filter":
    "フィルタ条件が指定されていないため実行できません。\n`count`・`user`・`keyword`・`days`・`after`・`before` のいずれか1つを指定してください。",
  "message-delete.errors.days_and_date_conflict":
    "`days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。",
  "message-delete.errors.after_invalid_format":
    "`after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
  "message-delete.errors.before_invalid_format":
    "`before` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
  "message-delete.errors.date_range_invalid":
    "`after` は `before` より前の日時を指定してください。",
  "message-delete.errors.no_permission":
    "この操作を実行する権限がありません。\n必要な権限: メッセージ管理",
  "message-delete.errors.bot_no_permission":
    "Botにメッセージ削除権限がありません。\n必要な権限: メッセージ管理・メッセージ履歴の閲覧・チャンネルの閲覧",
  "message-delete.errors.text_channel_only":
    "テキストチャンネルを指定してください。",
  "message-delete.errors.no_messages_found":
    "削除可能なメッセージが見つかりませんでした。",
  "message-delete.errors.delete_failed":
    "メッセージの削除中にエラーが発生しました。",
  "message-delete.errors.scan_failed":
    "メッセージの収集中にエラーが発生しました",
  "message-delete.errors.not_authorized":
    "操作権限がありません。",
  "message-delete.errors.jump_invalid_page":
    "ページ番号は 1〜{{total}} の整数で入力してください",
  "message-delete.errors.days_invalid_value":
    "日数は1以上の整数で入力してください。",
  "message-delete.errors.after_future":
    "`after` には現在より前の日時を指定してください。（当日の指定は有効です）",
  "message-delete.errors.before_future":
    "`before` には現在より前の日時を指定してください。（当日の指定は有効です）",
  "message-delete.errors.locked":
    "現在このサーバーでメッセージ削除コマンドを実行中です。完了後に再度お試しください。",
  "message-delete.errors.channel_no_access":
    "指定したチャンネルにアクセスできません。BotにReadMessageHistoryおよびManageMessages権限が必要です。",
  // スキャン
  "message-delete.confirm.btn_scan_cancel":
    "収集分を確認",
  "message-delete.confirm.scan_progress":
    "スキャン中... {{totalScanned}}件\n対象メッセージを検索中... {{collected}} / {{limit}}件",
  "message-delete.confirm.delete_progress":
    "削除中... {{totalDeleted}} / {{total}}件",
  "message-delete.confirm.delete_progress_channel":
    "<#{{channelId}}>: {{deleted}} / {{total}}件",
  // 確認ダイアログ（Stage 1 プレビュー）
  "message-delete.confirm.embed_title":
    "📋 削除対象メッセージ（{{page}} / {{total}} ページ）",
  "message-delete.confirm.btn_delete":
    "削除する（{{count}}件）",
  "message-delete.confirm.btn_no":
    "キャンセル",
  "message-delete.confirm.exclude_placeholder":
    "このページから除外するメッセージを選択",
  "message-delete.confirm.exclude_no_messages":
    "(メッセージなし)",
  "message-delete.confirm.zero_targets":
    "削除対象がありません",
  "message-delete.confirm.cancelled":
    "削除をキャンセルしました。",
  "message-delete.confirm.timed_out":
    "タイムアウトしました。再度コマンドを実行してください。",
  "message-delete.confirm.scan_timed_out":
    "スキャンがタイムアウトしました。収集済みのメッセージでプレビューを表示します。",
  "message-delete.confirm.scan_timed_out_empty":
    "スキャンがタイムアウトしました。削除可能なメッセージが見つかりませんでした。",
  "message-delete.confirm.delete_timed_out":
    "削除処理がタイムアウトしました。削除済み: {{count}}件",
  // 最終確認ダイアログ（Stage 2）
  "message-delete.final.embed_title":
    "🗑️ 本当に削除しますか？（{{page}} / {{total}} ページ）",
  "message-delete.final.embed_warning":
    "⚠️ **この操作は取り消せません**",
  "message-delete.final.embed_desc":
    "以下のメッセージを削除します（合計 {{count}}件）",
  "message-delete.final.btn_yes":
    "削除する（{{count}}件）",
  "message-delete.final.btn_back":
    "設定し直す",
  "message-delete.final.btn_no":
    "キャンセル",
  // 結果表示
  "message-delete.result.empty_content":
    "*(本文なし)*",
  "message-delete.result.attachments":
    "📎 {{count}}件",
  "message-delete.result.embed_no_title":
    "🔗 埋め込みコンテンツ",
  "message-delete.result.jump_to_message":
    "↗ メッセージへ",
  // 削除完了 Embed
  "message-delete.embed.summary_title":
    "✅ 削除完了",
  "message-delete.embed.total_deleted":
    "合計削除件数",
  "message-delete.embed.total_deleted_value":
    "{{count}}件",
  "message-delete.embed.channel_breakdown":
    "チャンネル別内訳",
  "message-delete.embed.channel_breakdown_item":
    "<#{{channelId}}>: {{count}}件",
  "message-delete.embed.breakdown_empty":
    "—",
  // フィルターボタン（Stage 1 プレビューダイアログ）
  "message-delete.pagination.btn_first":
    "先頭",
  "message-delete.pagination.btn_prev":
    "前へ",
  "message-delete.pagination.btn_next":
    "次へ",
  "message-delete.pagination.btn_last":
    "末尾",
  "message-delete.pagination.btn_jump":
    "{{page}}/{{total}}ページ",
  "message-delete.pagination.btn_days_set":
    "過去{{days}}日間",
  "message-delete.pagination.btn_days_empty":
    "過去N日間を入力",
  "message-delete.pagination.btn_after_set":
    "after: {{date}}",
  "message-delete.pagination.btn_after_empty":
    "after（開始日時）を入力",
  "message-delete.pagination.btn_before_set":
    "before: {{date}}",
  "message-delete.pagination.btn_before_empty":
    "before（終了日時）を入力",
  "message-delete.pagination.btn_keyword":
    "内容で検索",
  "message-delete.pagination.btn_keyword_set":
    "{{keyword}}",
  "message-delete.pagination.btn_reset":
    "リセット",
  "message-delete.pagination.author_select_placeholder":
    "投稿者でフィルター",
  "message-delete.pagination.author_all":
    "（全投稿者）",
  // モーダル
  "message-delete.modal.keyword.title":
    "内容でフィルター",
  "message-delete.modal.keyword.label":
    "キーワード",
  "message-delete.modal.keyword.placeholder":
    "フィルターするキーワードを入力",
  "message-delete.modal.days.title":
    "過去N日間でフィルター",
  "message-delete.modal.days.label":
    "日数（1以上の整数）",
  "message-delete.modal.days.placeholder":
    "例: 7",
  "message-delete.modal.after.title":
    "after（開始日時）でフィルター",
  "message-delete.modal.after.label":
    "開始日時",
  "message-delete.modal.after.placeholder":
    "例: 2026-01-01 または 2026-01-01T00:00:00",
  "message-delete.modal.before.title":
    "before（終了日時）でフィルター",
  "message-delete.modal.before.label":
    "終了日時",
  "message-delete.modal.before.placeholder":
    "例: 2026-02-28 または 2026-02-28T23:59:59",
  "message-delete.modal.jump.title":
    "ページ指定",
  "message-delete.modal.jump.label":
    "ページ番号",
  "message-delete.modal.jump.placeholder":
    "1〜{{total}}の整数",
  // コマンド条件 Embed
  "message-delete.conditions.title":
    "📋 コマンド条件",
  "message-delete.conditions.count_limited":
    "{{count}}件",
  "message-delete.conditions.count_unlimited":
    "(上限なし: {{count}}件)",
  "message-delete.conditions.user_all":
    "(全員対象)",
  "message-delete.conditions.none":
    "(なし)",
  "message-delete.conditions.channel_all":
    "(サーバー全体)",
  "message-delete.conditions.days_value":
    "過去{{days}}日間",
  "message-delete.conditions.after_value":
    "{{date}} 以降",
  "message-delete.conditions.before_value":
    "{{date}} 以前",
  // 条件設定ステップ
  "message-delete.condition-step.title":
    "対象ユーザー・チャンネルを選択してください（任意）",
  "message-delete.condition-step.user_placeholder":
    "ユーザーを選択",
  "message-delete.condition-step.channel_placeholder":
    "チャンネルを選択",
  "message-delete.condition-step.btn_start_scan":
    "スキャン開始",
  "message-delete.condition-step.btn_webhook_input":
    "Webhook ID を入力",
  "message-delete.condition-step.btn_cancel":
    "キャンセル",
  "message-delete.condition-step.timeout":
    "条件設定がタイムアウトしました。再度コマンドを実行してください。",
  "message-delete.condition-step.no_filter":
    "フィルタ条件が指定されていないため実行できません。\n`count`・`keyword`・`days`・`after`・`before` のいずれかのコマンドオプション、または対象ユーザーを選択してください。",
  "message-delete.modal.webhook.title":
    "Webhook ID を入力",
  "message-delete.modal.webhook.label":
    "Webhook ID（17〜20桁の数字）",
  "message-delete.modal.webhook.placeholder":
    "123456789012345678",
  "message-delete.errors.webhook_invalid_format":
    "Webhook ID の形式が不正です。17〜20桁の数字を入力してください。",
  "message-delete.errors.channel_partial_skip":
    "以下のチャンネルはBotの権限不足のためスキップしました: {{channels}}",
  "message-delete.errors.channel_all_no_access":
    "指定したチャンネルにアクセスできません。BotにReadMessageHistoryおよびManageMessages権限が必要です。",

  // メンバーログ設定コマンド
  // スラッシュコマンド本体とサブコマンド説明
  "member-log-config.description":
    "メンバーログ機能の設定（管理者専用）",
  "member-log-config.set-channel.description":
    "通知チャンネルを設定",
  "member-log-config.set-channel.channel.description":
    "通知を送信するテキストチャンネル",
  "member-log-config.enable.description":
    "メンバーログ機能を有効化",
  "member-log-config.disable.description":
    "メンバーログ機能を無効化",
  "member-log-config.set-join-message.description":
    "カスタム参加メッセージを設定",
  "member-log-config.set-leave-message.description":
    "カスタム退出メッセージを設定",
  "member-log-config.clear-join-message.description":
    "カスタム参加メッセージを削除",
  "member-log-config.clear-leave-message.description":
    "カスタム退出メッセージを削除",
  "member-log-config.view.description":
    "現在の設定を表示",
  // メンバーログ設定コマンド レスポンス
  "member-log-config.embed.success_title":
    "設定完了",
  "member-log-config.embed.title":
    "メンバーログ機能",
  "member-log-config.embed.not_configured":
    "メンバーログが設定されていません。",
  "member-log-config.embed.set_channel_success":
    "通知チャンネルを {{channel}} に設定しました。",
  "member-log-config.embed.enable_success":
    "メンバーログ機能を有効化しました。",
  "member-log-config.embed.enable_error_no_channel":
    "通知チャンネルが設定されていません。先に /member-log-config set-channel を実行してください。",
  "member-log-config.embed.disable_success":
    "メンバーログ機能を無効化しました。",
  "member-log-config.embed.set_join_message_success":
    "参加メッセージを設定しました。",
  "member-log-config.embed.set_leave_message_success":
    "退出メッセージを設定しました。",
  "member-log-config.embed.clear_join_message_success":
    "参加メッセージを削除しました。",
  "member-log-config.embed.clear_leave_message_success":
    "退出メッセージを削除しました。",
  "member-log-config.embed.field.status":
    "状態",
  "member-log-config.embed.field.channel":
    "通知チャンネル",
  "member-log-config.embed.field.join_message":
    "参加メッセージ",
  "member-log-config.embed.field.leave_message":
    "退出メッセージ",
  // モーダル
  "member-log-config.modal.set_join_message.title":
    "参加メッセージを設定",
  "member-log-config.modal.set_join_message.label":
    "参加メッセージ",
  "member-log-config.modal.set_join_message.placeholder":
    "{userMention}, {userName}, {count} を使用可（最大500文字）",
  "member-log-config.modal.set_leave_message.title":
    "退出メッセージを設定",
  "member-log-config.modal.set_leave_message.label":
    "退出メッセージ",
  "member-log-config.modal.set_leave_message.placeholder":
    "{userMention}, {userName}, {count} を使用可（最大500文字）",
  // エラー
  "member-log-config.errors.text_channel_only":
    "テキストチャンネルを指定してください。",

  // スティッキーメッセージコマンド
  "sticky-message.description":
    "スティッキーメッセージ（チャンネル最下部固定）の管理（チャンネル管理者専用）",
  // set サブコマンド（プレーンテキスト or Embed モーダル入力）
  "sticky-message.set.description":
    "スティッキーメッセージを設定（モーダル入力）",
  "sticky-message.set.channel.description":
    "設定するテキストチャンネル（省略時はこのチャンネル）",
  "sticky-message.set.style.description":
    "表示スタイル（text: テキスト / embed: Embed、省略時: text）",
  // set プレーンテキストモーダル
  "sticky-message.set.modal.title":
    "スティッキーメッセージの内容を入力",
  "sticky-message.set.modal.message.label":
    "メッセージ内容",
  "sticky-message.set.modal.message.placeholder":
    "改行して複数行のメッセージを入力できます（最大2000文字）",
  // set Embed モーダル
  "sticky-message.set.embed-modal.title":
    "Embed スティッキーメッセージを設定",
  "sticky-message.set.embed-modal.embed-title.label":
    "タイトル",
  "sticky-message.set.embed-modal.embed-title.placeholder":
    "Embed のタイトルを入力（最大256文字）",
  "sticky-message.set.embed-modal.embed-description.label":
    "内容",
  "sticky-message.set.embed-modal.embed-description.placeholder":
    "Embed の内容を入力（最大4096文字）",
  "sticky-message.set.embed-modal.embed-color.label":
    "カラーコード(任意)",
  "sticky-message.set.embed-modal.embed-color.placeholder":
    "#008969 または 0x008969 形式で入力（省略時: #008969）",
  "sticky-message.set.success.title":
    "設定完了",
  "sticky-message.set.success.description":
    "スティッキーメッセージを設定しました。",
  "sticky-message.set.alreadyExists.title":
    "警告",
  "sticky-message.set.alreadyExists.description":
    "既にスティッキーメッセージが設定されています。削除してから再度設定してください。",
  // remove サブコマンド
  "sticky-message.remove.description":
    "スティッキーメッセージを削除",
  "sticky-message.remove.select.placeholder":
    "削除するチャンネルを選択（複数選択可）",
  "sticky-message.remove.button.label":
    "削除する",
  "sticky-message.remove.noSelection.description":
    "削除するチャンネルを選択してください。",
  "sticky-message.remove.success.title":
    "削除完了",
  "sticky-message.remove.success.description":
    "{{count}}件のスティッキーメッセージを削除しました。",
  "sticky-message.remove.success.channels":
    "削除したチャンネル",
  "sticky-message.remove.notFound.title":
    "未設定",
  "sticky-message.remove.notFound.description":
    "スティッキーメッセージは設定されていません。",

  // エラー
  "sticky-message.errors.permissionDenied":
    "この操作を実行する権限がありません。チャンネル管理権限が必要です。",
  "sticky-message.errors.emptyMessage":
    "メッセージ内容を入力してください。",
  "sticky-message.errors.text_channel_only":
    "テキストチャンネルにのみ設定できます。",
  "sticky-message.errors.failed":
    "スティッキーメッセージの操作中にエラーが発生しました。",
  // view サブコマンド
  "sticky-message.view.description":
    "スティッキーメッセージ設定を確認（チャンネル選択UI）",
  "sticky-message.view.title":
    "スティッキーメッセージ設定",
  "sticky-message.view.select.placeholder":
    "チャンネルを選択してください。",
  "sticky-message.view.notFound.title":
    "未設定",
  "sticky-message.view.empty":
    "スティッキーメッセージが設定されているチャンネルがありません。",
  "sticky-message.view.field.channel":
    "チャンネル",
  "sticky-message.view.field.format":
    "形式",
  "sticky-message.view.field.format_plain":
    "プレーンテキスト",
  "sticky-message.view.field.format_embed":
    "Embed",
  "sticky-message.view.field.updated_at":
    "最終更新",
  "sticky-message.view.field.updated_by":
    "設定者",
  "sticky-message.view.field.content":
    "メッセージ内容",
  "sticky-message.view.field.embed_title":
    "Embedタイトル",
  "sticky-message.view.field.embed_color":
    "Embedカラー",
  // update サブコマンド
  "sticky-message.update.description":
    "スティッキーメッセージの内容を更新（モーダル入力）",
  "sticky-message.update.channel.description":
    "更新対象のチャンネル（省略時はこのチャンネル）",
  "sticky-message.update.style.description":
    "表示スタイル（text: テキスト / embed: Embed、省略時: text）",
  // update プレーンテキストモーダル
  "sticky-message.update.modal.title":
    "スティッキーメッセージを更新",
  "sticky-message.update.modal.message.label":
    "メッセージ内容",
  "sticky-message.update.modal.message.placeholder":
    "改行して複数行入力できます（最大2000文字）",
  // update Embed モーダル
  "sticky-message.update.embed-modal.title":
    "Embed スティッキーメッセージを更新",
  "sticky-message.update.success.title":
    "更新完了",
  "sticky-message.update.success.description":
    "スティッキーメッセージを更新しました。",
  "sticky-message.update.notFound.title":
    "未設定",

  // VC募集設定コマンド
  "vc-recruit-config.description":
    "VC募集機能の設定（サーバー管理者向け）",
  "vc-recruit-config.setup.description":
    "VC募集チャンネルをセットアップ",
  "vc-recruit-config.setup.category.description":
    "作成先カテゴリー（TOP またはカテゴリー名。未指定時は実行チャンネルのカテゴリー）",
  "vc-recruit-config.setup.category.top": "TOP（カテゴリーなし）",
  "vc-recruit-config.setup.thread-archive.description":
    "招募スレッドの自動アーカイブ時間（1h/24h/3d/1w、未指定: 24h）",
  "vc-recruit-config.teardown.description":
    "VC募集チャンネルを削除（選択UI経由）",
  // teardown セレクトメニュー UI
  "vc-recruit-config.teardown.select.placeholder":
    "撤去するカテゴリーを選択してください",
  "vc-recruit-config.teardown.select.top":
    "TOP（カテゴリーなし）",
  "vc-recruit-config.teardown.select.unknown_category":
    "不明なカテゴリー（ID: {{id}}）",
  // teardown 確認パネル
  "vc-recruit-config.teardown.confirm.title":
    "VC募集チャンネルを撤去しますか？",
  "vc-recruit-config.teardown.confirm.field_categories":
    "対象カテゴリー",
  "vc-recruit-config.teardown.confirm.warning":
    "選択したカテゴリーの募集作成チャンネル・募集一覧チャンネルが削除されます。この操作は取り消せません。",
  "vc-recruit-config.teardown.confirm.button_confirm":
    "🗑️ 撤去する",
  "vc-recruit-config.teardown.confirm.button_cancel":
    "キャンセル",
  "vc-recruit-config.teardown.confirm.button_redo":
    "選び直す",
  "vc-recruit-config.add-role.description":
    "メンション候補ロールを追加",
  "vc-recruit-config.add-role.select.placeholder":
    "追加するロールを選択（複数選択可）",
  "vc-recruit-config.add-role.select.title":
    "追加するロールを選択してください",
  "vc-recruit-config.add-role.button.confirm":
    "追加する",
  "vc-recruit-config.add-role.button.cancel":
    "キャンセル",
  "vc-recruit-config.add-role.noSelection":
    "追加するロールを選択してください。",
  "vc-recruit-config.remove-role.description":
    "メンション候補ロールを削除",
  "vc-recruit-config.remove-role.select.placeholder":
    "削除するロールを選択（複数選択可）",
  "vc-recruit-config.remove-role.select.title":
    "削除するロールを選択してください",
  "vc-recruit-config.remove-role.button.confirm":
    "削除する",
  "vc-recruit-config.remove-role.button.cancel":
    "キャンセル",
  "vc-recruit-config.remove-role.noSelection":
    "削除するロールを選択してください。",
  "vc-recruit-config.view.description":
    "現在のVC募集設定を表示",
  // setup 成功
  "vc-recruit-config.embed.setup_success":
    "VC募集チャンネルを作成しました",
  "vc-recruit-config.embed.setup_panel_channel":
    "募集作成: {{channel}}",
  "vc-recruit-config.embed.setup_post_channel":
    "募集投稿: {{channel}}",
  // teardown
  "vc-recruit-config.embed.teardown_success":
    "VC募集チャンネルを撤去しました",
  "vc-recruit-config.embed.teardown_category_item":
    "🗑️ {{category}}",
  "vc-recruit-config.embed.teardown_partial_error":
    "以下のカテゴリーで一部エラーが発生しました：",
  "vc-recruit-config.embed.teardown_cancelled":
    "キャンセルしました",
  // add-role/remove-role 成功
  "vc-recruit-config.embed.add_role_success":
    "{{role}} をメンション候補に追加しました",
  "vc-recruit-config.embed.remove_role_success":
    "{{role}} をメンション候補から削除しました",
  // view
  "vc-recruit-config.embed.view_title":
    "VC募集設定",
  "vc-recruit-config.embed.field_setups":
    "セットアップ済みカテゴリー",
  "vc-recruit-config.embed.field_roles":
    "メンション候補ロール",
  "vc-recruit-config.embed.no_setups":
    "未設定",
  "vc-recruit-config.embed.no_roles":
    "なし",
  "vc-recruit-config.embed.top":
    "TOP",
  "vc-recruit-config.embed.setup_item":
    "• {{category}}\n　募集作成: {{panel}}\n　募集投稿: {{post}}",
  "vc-recruit-config.embed.add_role_success_title":
    "ロールの登録に成功",
  "vc-recruit-config.embed.add_role_success_field":
    "登録したロール",
  "vc-recruit-config.embed.add_role_limit_title":
    "上限超過でロールの登録に失敗",
  "vc-recruit-config.embed.add_role_limit_desc":
    "メンション候補ロールの登録上限({{limit}}件)に達したため、以下のロールは登録できませんでした。",
  "vc-recruit-config.embed.add_role_limit_field":
    "登録できなかったロール",
  "vc-recruit-config.embed.remove_role_success_title":
    "ロールの削除に成功",
  "vc-recruit-config.embed.remove_role_success_field":
    "削除したロール",
  "vc-recruit-config.embed.success_title":
    "設定完了",

  // 共通
  "common.cancelled":
    "キャンセルしました",

  // VC募集機能 チャンネル名
  "vcRecruit.channelName.panel":
    "募集作成",
  "vcRecruit.channelName.post":
    "募集一覧",

  // VC募集パネル
  "vcRecruit.panel.title":
    "📝 VC募集",
  "vcRecruit.panel.description":
    "ボタンからVC参加者の募集を作成できます。\n\n**作成手順**\n1. 下のボタンを押して募集作成を開始します\n2. メンションするロールと参加するVCを選択します\n3. 募集内容を入力して送信すると、募集一覧チャンネルに投稿されます",
  "vcRecruit.panel.create_button":
    "VC募集を作成",

  // VC募集モーダル（ステップ2）
  "vcRecruit.modal.title":
    "VC募集を作成（2/2）",
  "vcRecruit.modal.content_label":
    "募集内容",
  "vcRecruit.modal.content_placeholder":
    "招待メッセージを入力してください（最大200文字）",
  "vcRecruit.modal.vc_name_label":
    "新規VC名（任意）",
  "vcRecruit.modal.vc_name_placeholder":
    "「新規VC作成」選択時のみ使用（未入力: 表示名's Room）",

  // VC募集セレクトメニュー（ステップ1）
  "vcRecruit.select.title": "📋 ステップ 1/2",
  "vcRecruit.select.description": "メンション・VCを選択してください",
  "vcRecruit.select.mention_placeholder":
    "メンション（なし）",
  "vcRecruit.select.vc_placeholder":
    "VCを選択",
  "vcRecruit.select.open_modal_button":
    "📝 内容を入力する",
  "vcRecruit.select.no_mention":
    "なし（メンションしない）",
  "vcRecruit.select.new_vc_label":
    "🆕 新規VC作成",

  // 募集メッセージ
  "vcRecruit.embed.title":
    "📢 VC募集",
  "vcRecruit.embed.title_ended":
    "📢 VC募集【募集終了】",
  "vcRecruit.embed.field_content":
    "募集内容",
  "vcRecruit.embed.field_vc":
    "VC",
  "vcRecruit.embed.field_recruiter":
    "募集者",

  // スレッド名
  "vcRecruit.thread_name":
    "{{recruiter}}の募集",

  // 投稿完了通知
  "vcRecruit.embed.post_success":
    "募集を投稿しました",
  "vcRecruit.embed.post_success_link":
    "投稿を確認する",

  // 募集メッセージボタン
  "vcRecruit.button.join_vc":
    "🎤 VCに参加",
  "vcRecruit.button.rename_vc":
    "✏️ VC名を変更",
  "vcRecruit.button.end_vc":
    "🔇 募集終了",
  "vcRecruit.button.delete_post":
    "🗑️ 募集を削除",
  "vcRecruit.button.vc_ended":
    "🔇 募集終了済み",

  // 募集終了 確認
  "vcRecruit.confirm.end_vc_created":
    "募集を終了しますか？\nVCが削除され、募集投稿が終了済みに更新されます。投稿とスレッドは残ります。",
  "vcRecruit.confirm.end_vc_existing":
    "募集を終了しますか？\n募集投稿が終了済みに更新されます。VCは削除されません。",
  "vcRecruit.confirm.end_vc_button":
    "終了する",
  "vcRecruit.confirm.cancel_button":
    "キャンセル",
  "vcRecruit.confirm.end_vc_success":
    "募集を終了しました",
  "vcRecruit.confirm.cancelled":
    "キャンセルしました",

  // 募集を削除 確認
  "vcRecruit.confirm.delete_created":
    "この募集を削除しますか？\n投稿・スレッド・新規作成VCがすべて削除されます。",
  "vcRecruit.confirm.delete_existing":
    "この募集を削除しますか？\n投稿・スレッドが削除されます。VCは削除されません。",
  "vcRecruit.confirm.delete_button":
    "削除する",
  "vcRecruit.confirm.delete_success":
    "募集を削除しました",

  // VC名変更
  "vcRecruit.rename.modal_title":
    "VC名を変更",
  "vcRecruit.rename.vc_name_label":
    "VC名",
  "vcRecruit.rename.vc_name_placeholder":
    "新しいVC名を入力してください（最大100文字）",
  "vcRecruit.rename.success":
    "VC名を変更しました",
} as const;

export type CommandsTranslations = typeof commands;
