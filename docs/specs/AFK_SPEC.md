# AFK機能 - 仕様書

> ボイスチャンネルの非アクティブユーザーを手動でAFKチャンネルに移動する機能

最終更新: 2026年3月21日

---

## 概要

### 機能一覧

| 機能 | 概要 |
| --- | --- |
| `/afk` | ユーザーをAFKチャンネルに移動 |
| `/afk-config set-channel` | AFKチャンネルを設定 |
| `/afk-config view` | 現在のAFK設定を表示 |
| `/afk-config reset` | AFK設定をリセット |

### 権限モデル

| 対象 | 権限 | 用途 |
| --- | --- | --- |
| 実行者（`/afk`） | なし | 全メンバー実行可能 |
| 実行者（`/afk-config`） | ManageGuild | AFK設定の管理 |
| Bot | MoveMembers | ユーザーのVC移動 |

---

## /afk

### コマンド定義

**コマンド**: `/afk [user]`

**実行権限**: 全メンバー

**コマンドオプション:**

| オプション名 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `user` | User | ❌ | 移動対象のユーザー（省略時は実行者自身） |

### 動作フロー

1. AFK機能が有効か確認
2. 対象ユーザーがボイスチャンネルに参加しているか確認
3. 設定されたAFKチャンネルに移動
4. 移動完了をチャンネルに通知

**ビジネスルール:**

- AFK機能が無効（`enabled=false`）または未設定（`channelId=null`）の場合はエラー
- 対象ユーザーがVCに参加していない場合はエラー
- AFKチャンネルが削除済み・存在しない場合はエラー

### UI

**成功メッセージ（`createSuccessEmbed` 使用）:**

| 項目 | 内容 |
| --- | --- |
| 説明 | {{user}} を {{channel}} に移動しました。 |

---

## /afk-config set-channel

### コマンド定義

**コマンド**: `/afk-config set-channel`

**実行権限**: ManageGuild

**コマンドオプション:**

| オプション名 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `channel` | VoiceChannel | ✅ | AFKチャンネルとして使用するボイスチャンネル |

### 動作フロー

1. ManageGuild 権限チェック
2. 指定されたチャンネルがボイスチャンネルか確認
3. AFK設定を更新（`enabled: true`、`channelId` を保存）
4. 設定完了を ephemeral で通知

**ビジネスルール:**

- ボイスチャンネル以外が指定された場合はエラー
- 既存設定がある場合は上書き

### UI

**成功メッセージ:**

`createSuccessEmbed` 使用 / ephemeral

| 項目 | 内容 |
| --- | --- |
| タイトル | 設定完了 |
| 説明 | AFKチャンネルを {{channel}} に設定しました。 |

---

## /afk-config view

### コマンド定義

**コマンド**: `/afk-config view`

**実行権限**: ManageGuild

**コマンドオプション:** なし

### 動作フロー

1. ManageGuild 権限チェック
2. 現在のAFK設定を取得
3. 設定状態（有効/無効、チャンネル）を表示
4. ephemeral で応答

### UI

**Embed:**

`createInfoEmbed` 使用 / ephemeral

| 項目 | 内容 |
| --- | --- |
| タイトル | AFK機能 |
| フィールド: 状態 | 有効 / 無効 |
| フィールド: AFKチャンネル | `<#channelId>` / 未設定 |

---

## /afk-config reset

### コマンド定義

**コマンド**: `/afk-config reset`

**実行権限**: ManageGuild

**コマンドオプション:** なし

### 動作フロー

1. ManageGuild 権限チェック
2. 確認ダイアログ Embed + ボタンを ephemeral で送信
3. 「リセットする」ボタン押下 → AFK設定をクリア（`enabled: false`, `channelId: null`）→ 完了メッセージに `update()`
4. 「キャンセル」ボタン押下 / 60秒タイムアウト → キャンセルメッセージに `update()`

**ビジネスルール:**

- 設定が存在しない場合でもリセット操作は成功扱い（冪等）

### UI

**Embed（確認ダイアログ / `createWarningEmbed` 使用）:**

| 項目 | 内容 |
| --- | --- |
| タイトル | AFK設定リセット |
| 説明 | AFK設定をリセットしますか？\n以下の設定が削除されます。この操作は元に戻せません。 |
| フィールド | 削除対象: AFKチャンネル設定 |

**ボタン:**

| コンポーネント | emoji | ラベル | スタイル | 動作 |
| --- | --- | --- | --- | --- |
| `afk-config:reset:confirm` | 🗑️ | リセットする | Danger | 設定をクリアして完了メッセージに更新 |
| `afk-config:reset:cancel` | ❌ | キャンセル | Secondary | キャンセルメッセージに更新 |

---

## データモデル

### GuildAfkConfig

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `guildId` | String | ギルドID（主キー） |
| `enabled` | Boolean | 機能の有効/無効（デフォルト: false） |
| `channelId` | String? | AFKチャンネルID（未設定時は null） |

---

## 制約・制限事項

- reset の確認ダイアログタイムアウト: 60秒

---

## ローカライズ

**翻訳ファイル:** `src/shared/locale/locales/{ja,en}/features/afk.ts`

### 実装済みキー（新規約に移行予定）

| キー | ja | en |
| --- | --- | --- |
| `afk.description` | AFKチャンネルにユーザーを移動 | Move user to AFK channel |
| `afk.user.description` | 移動するユーザー（省略で自分） | User to move (default: yourself) |
| `afk-config.description` | AFK機能の設定（サーバー管理権限が必要） | Configure AFK feature (requires Manage Server) |
| `afk-config.set-channel.description` | AFKチャンネルを設定 | Configure AFK channel |
| `afk-config.set-channel.channel.description` | AFKチャンネル（ボイスチャンネル） | AFK channel (voice channel) |
| `afk-config.view.description` | 現在の設定を表示 | Show current settings |
| `user-response.moved` | {{user}} を {{channel}} に移動しました。 | Moved {{user}} to {{channel}} |
| `user-response.set_channel_success` | AFKチャンネルを {{channel}} に設定しました。 | AFK channel configured: {{channel}} |
| `user-response.not_configured` | AFKチャンネルが設定されていません。\n`/afk-config set-channel` でチャンネルを設定してください。（管理者用） | AFK channel is not configured.\nPlease configure a channel with `/afk-config set-channel` (administrator only). |
| `user-response.member_not_found` | ユーザーが見つかりませんでした。 | User not found. |
| `user-response.user_not_in_voice` | 指定されたユーザーはボイスチャンネルにいません。 | The specified user is not in a voice channel. |
| `user-response.channel_not_found` | AFKチャンネルが見つかりませんでした。\nチャンネルが削除されている可能性があります。 | AFK channel not found.\nThe channel may have been deleted. |
| `user-response.invalid_channel_type` | ボイスチャンネルを指定してください。 | Please specify a voice channel. |
| `embed.title.success` | 設定完了 | Settings Updated |
| `embed.title.config_view` | AFK機能 | AFK |
| `embed.field.name.channel` | AFKチャンネル | AFK Channel |
| `embed.field.value.not_configured` | AFKチャンネルが設定されていません。 | AFK channel is not configured |
| `log.moved` | ユーザーをAFKチャンネルに移動 GuildId: {{guildId}} UserId: {{userId}} ChannelId: {{channelId}} | moved user to AFK channel GuildId: {{guildId}} UserId: {{userId}} ChannelId: {{channelId}} |
| `log.configured` | AFKチャンネル設定 GuildId: {{guildId}} ChannelId: {{channelId}} | channel configured GuildId: {{guildId}} ChannelId: {{channelId}} |
| `log.database_channel_set` | AFKチャンネルを設定 GuildId: {{guildId}} ChannelId: {{channelId}} | AFK channel set GuildId: {{guildId}} ChannelId: {{channelId}} |
| `log.database_channel_set_failed` | AFKチャンネル設定に失敗 GuildId: {{guildId}} ChannelId: {{channelId}} | Failed to set AFK channel GuildId: {{guildId}} ChannelId: {{channelId}} |
| `log.database_config_saved` | AFK設定を保存 GuildId: {{guildId}} | AFK config saved GuildId: {{guildId}} |
| `log.database_config_save_failed` | AFK設定保存に失敗 GuildId: {{guildId}} | Failed to save AFK config GuildId: {{guildId}} |

### reset 新規追加分

| キー | 用途 | ja | en |
| --- | --- | --- | --- |
| `afk-config.reset.description` | サブコマンド説明 | AFK設定をリセット | Reset AFK settings |
| `user-response.reset_success` | リセット成功レスポンス | AFK設定をリセットしました。 | AFK settings have been reset. |
| `user-response.reset_cancelled` | キャンセルレスポンス | リセットをキャンセルしました。 | Reset has been cancelled. |
| `embed.title.reset_confirm` | 確認ダイアログタイトル | AFK設定リセット確認 | AFK Settings Reset |
| `embed.description.reset_confirm` | 確認ダイアログ説明 | AFK設定をリセットしますか？\n以下の設定が削除されます。この操作は元に戻せません。 | Reset AFK settings?\nThe following settings will be deleted. This action cannot be undone. |
| `embed.field.name.reset_target` | 削除対象フィールド名 | 削除対象 | Targets |
| `embed.field.value.reset_target` | 削除対象フィールド値 | AFKチャンネル設定 | AFK channel setting |
| `ui.button.reset_confirm` | 確認ボタン | リセットする | Reset |
| `ui.button.reset_cancel` | キャンセルボタン | キャンセル | Cancel |

---

## 依存関係

| 依存先 | 内容 |
| --- | --- |
| GuildConfigRepository | AFK設定の取得・更新 |
