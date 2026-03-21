# ギルド設定機能 - 仕様書

> Guild Config - ギルド全体の共通設定の管理・バックアップ機能

最終更新: 2026年3月21日

---

## 概要

サーバー（ギルド）全体に適用される共通設定を管理するコマンドです。言語設定の切り替え、エラー通知チャンネルの設定、全設定の一覧確認、設定リセット、および設定のエクスポート/インポートによるバックアップ・リストアを提供します。

### 機能一覧

| 機能 | 概要 |
| --- | --- |
| set-locale | Bot の応答言語をギルド単位で設定（ja / en） |
| set-error-channel | エラー通知チャンネルを設定 |
| view | 現在のギルド設定をページ形式で表示 |
| reset | ギルド設定（言語・エラー通知チャンネル）をリセット |
| reset-all | 全機能の設定を一括リセット |
| export | 現在のギルド設定をJSON形式でエクスポート |
| import | JSONファイルからギルド設定をインポート |

### 権限モデル

| 対象 | 権限 | 用途 |
| --- | --- | --- |
| 実行者 | ManageGuild | 全サブコマンドの実行（コマンドレベルで制御） |
| Bot | なし | 追加権限不要 |

---

## set-locale

### コマンド定義

**コマンド**: `/guild-config set-locale`

**コマンドオプション:**

| オプション名 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `locale` | choices | ✅ | 設定する言語を選択（`ja`: 日本語 / `en`: English） |

### 動作フロー

1. `repository.updateLocale(guildId, locale)` で DB 更新
2. `localeManager.invalidateLocaleCache(guildId)` でキャッシュを即時無効化
3. 完了メッセージを返信（ephemeral）

**ビジネスルール:**

- `set-locale` 実行後は `localeManager.invalidateLocaleCache(guildId)` を必ず呼ぶ。呼ばない場合、TTL（5分）が切れるまで古いロケールが使われ続ける

### UI

**レスポンス（成功）:** `createSuccessEmbed` で言語設定完了を通知

---

## set-error-channel

### コマンド定義

**コマンド**: `/guild-config set-error-channel`

**コマンドオプション:**

| オプション名 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `channel` | Channel（テキストチャンネル） | ✅ | エラー通知先チャンネル |

### 動作フロー

1. チャンネルの型をバリデーション（テキストチャンネルのみ）
2. `repository.updateErrorChannel(guildId, channelId)` で DB 更新
3. 完了メッセージを返信（ephemeral）

**ビジネスルール:**

- エラー通知チャンネルは、イベント駆動の機能（Bumpリマインダー、メッセージ固定、メンバーログ）でインタラクション起点でないエラーが発生した場合のフォールバック送信先として使用される
- エラー通知チャンネルが未設定の場合、フォールバック先がないエラーはログ出力のみで通知されない

### UI

**レスポンス（成功）:** `createSuccessEmbed` でチャンネル設定完了を通知

---

## view

### コマンド定義

**コマンド**: `/guild-config view`

**コマンドオプション:** なし

### 動作フロー

1. `repository.getConfig(guildId)` でギルド設定全体を取得（レコードが存在しない場合はデフォルト設定として表示）
2. 各機能フィールドをパースして各ページ用データを生成
3. ページ 1 の Embed + ボタン + セレクトメニューを ephemeral で返信
4. ボタン / セレクトメニューのインタラクション受信
5. 対応ページの Embed に `interaction.update()` で書き換え
6. 5分タイムアウト後にコンポーネントを `disabled` 化

**ビジネスルール:**

- 各ページの内容は `buildPage(pageIndex, config)` のような純粋関数で生成し、インタラクション受信時に再生成する（メモリ保持不要）
- ページ番号は `custom_id` のサフィックスや `interaction.message` の既存 Embed footer から復元する
- ページ 2 以降は各機能の `*-config view` が使っている Embed 生成ロジック（`buildViewEmbed` 相当の関数）をそのまま呼び出して再利用する（設定を持たない機能はページに含めない）
- `guild-config view` 側では Embed のフッターにページ番号を追記するだけにとどめる
- インタラクション発火元は `/guild-config view` を実行したユーザーのみ応答する（他ユーザーには ephemeral でエラー返却）

### UI

**Embed（ページ 1: ギルド設定）:**

| 項目 | 内容 |
| --- | --- |
| タイトル | ギルド設定 |
| フィールド | 言語: 日本語 (ja) |
| フィールド | エラー通知チャンネル: #channel / 未設定 |

**ページ一覧:**

| ページ番号 | emoji | タイトル | 内容 |
| --- | --- | --- | --- |
| 1 | 🔧 | ギルド設定 | 言語 + エラー通知チャンネル + 全機能の有効/無効一覧 |
| 2 | 😴 | AFK | AFK の詳細設定 |
| 3 | ⚙️ | VAC | VAC の詳細設定 |
| 4 | 🎤 | VC募集 | VC募集の詳細設定 |
| 5 | 📌 | メッセージ固定 | スティッキーメッセージの詳細設定 |
| 6 | 👋 | メンバーログ | メンバーログの詳細設定 |
| 7 | 🔔 | Bumpリマインダー | Bumpリマインダーの詳細設定 |

> ページ数は設定を持つ機能数に応じて増減する。
> ページ 2 以降は対応する `*-config view` コマンドが生成する Embed をそのまま再利用する。
> 機能が未設定の場合は各機能の view と同様「未設定」表示を返す。

**Row 1 - ページネーション（共通コンポーネント）:**

単ページ時はこの行ごと非表示。

| コンポーネント | emoji | ラベル | スタイル | 動作 |
| --- | --- | --- | --- | --- |
| `guild-config:view:first` | ⏮ | ― | Secondary | 最初のページ（1ページ目は `disabled`） |
| `guild-config:view:prev` | ◀ | ― | Secondary | 前のページ（1ページ目は `disabled`） |
| `guild-config:view:jump` | ― | {{page}}/{{total}}ページ | Secondary | 押下でモーダル表示、番号入力でページジャンプ |
| `guild-config:view:next` | ▶ | ― | Secondary | 次のページ（最終ページは `disabled`） |
| `guild-config:view:last` | ⏭ | ― | Secondary | 最後のページ（最終ページは `disabled`） |

**Row 2 - 機能セレクトメニュー:**

| コンポーネント | プレースホルダー | 種別 | 動作 |
| --- | --- | --- | --- |
| `guild-config:view:select` | ページを選択... | StringSelect | 選択したページへ直接移動 |

**セレクトメニュー選択肢:**

| emoji | ラベル | value |
| --- | --- | --- |
| 🔧 | 1. ギルド設定 | `guild_config` |
| 😴 | 2. AFK | `afk` |
| ⚙️ | 3. VAC | `vac` |
| 🎤 | 4. VC募集 | `vc_recruit` |
| 📌 | 5. メッセージ固定 | `sticky` |
| 👋 | 6. メンバーログ | `member_log` |
| 🔔 | 7. Bumpリマインダー | `bump` |

---

## reset

ギルド設定（言語・エラー通知チャンネル）のみをリセットする。各機能の設定は保持される。

### コマンド定義

**コマンド**: `/guild-config reset`

**コマンドオプション:** なし

### 動作フロー

1. `createWarningEmbed` で確認ダイアログ Embed + ボタンを ephemeral で送信
2. 「リセットする」ボタン押下 → `repository.resetGuildSettings(guildId)` で言語・エラー通知チャンネルをデフォルトに戻す → `localeManager.invalidateLocaleCache(guildId)` → 完了メッセージに `update()`
3. 「キャンセル」ボタン押下 / 60秒タイムアウト → キャンセルメッセージに `update()`

**ビジネスルール:**

- リセット後は `localeManager.invalidateLocaleCache(guildId)` を呼び出してキャッシュを即時クリアする
- リセット対象は `locale`・`errorChannelId` のみ。各機能の設定（AFK、Bumpリマインダー等）は影響を受けない

### UI

**Embed（確認ダイアログ）:** `createWarningEmbed` を使用

| 項目 | 内容 |
| --- | --- |
| タイトル | ギルド設定リセット確認 |
| 説明 | ギルド設定（言語・エラー通知チャンネル）をリセットしますか？\nこの操作は元に戻せません。 |

**ボタン:**

| コンポーネント | ラベル | emoji | スタイル | 動作 |
| --- | --- | --- | --- | --- |
| `guild_config_reset_confirm` | リセットする | 🗑️ | Danger | 設定をリセットして完了メッセージに更新 |
| `guild_config_reset_cancel` | キャンセル | ❌ | Secondary | キャンセルメッセージに更新 |

---

## reset-all

全機能の設定を一括リセットする。ギルド設定（言語・エラー通知チャンネル）も含めてすべて削除される。

### コマンド定義

**コマンド**: `/guild-config reset-all`

**コマンドオプション:** なし

### 動作フロー

1. `createWarningEmbed` で確認ダイアログ Embed + ボタンを ephemeral で送信
2. 「リセットする」ボタン押下 → `repository.deleteConfig(guildId)` で全設定を削除 → `localeManager.invalidateLocaleCache(guildId)` → 完了メッセージに `update()`
3. 「キャンセル」ボタン押下 / 60秒タイムアウト → キャンセルメッセージに `update()`

**ビジネスルール:**

- `deleteConfig` 後は `localeManager.invalidateLocaleCache(guildId)` を呼び出してキャッシュを即時クリアする
- ギルド設定 + 全機能の設定（AFK、Bumpリマインダー、VAC、VC募集、メッセージ固定、メンバーログ）がすべて削除される

### UI

**Embed（確認ダイアログ）:** `createWarningEmbed` を使用

| 項目 | 内容 |
| --- | --- |
| タイトル | 全設定リセット確認 |
| 説明 | 全機能の設定をリセットしますか？\n以下の設定がすべて削除されます。この操作は元に戻せません。 |
| フィールド | 削除対象: 言語設定 / エラー通知チャンネル / AFK / VAC / VC募集 / メッセージ固定 / メンバーログ / Bumpリマインダー |

**ボタン:**

| コンポーネント | ラベル | emoji | スタイル | 動作 |
| --- | --- | --- | --- | --- |
| `guild_config_reset_all_confirm` | リセットする | 🗑️ | Danger | 全設定を削除して完了メッセージに更新 |
| `guild_config_reset_all_cancel` | キャンセル | ❌ | Secondary | キャンセルメッセージに更新 |

---

## export

### コマンド定義

**コマンド**: `/guild-config export`

**コマンドオプション:** なし

### 動作フロー

1. repository から全設定を取得（GuildConfig + 各機能設定）
2. JSON形式にシリアライズ（`version`, `exportedAt`, `guildId`, `config`）
3. JSONファイルを添付した ephemeral メッセージで返信

**ビジネスルール:**

- 添付ファイル名: `guild-config-{guildId}-{timestamp}.json`
- 設定が存在しない場合はエラーメッセージを返す

### UI

**レスポンス（成功）:** `createSuccessEmbed` でエクスポート完了を通知

**エクスポートJSON構造:**

```json
{
  "version": 1,
  "exportedAt": "2026-03-19T12:00:00.000Z",
  "guildId": "123456789012345678",
  "config": {
    "locale": "ja",
    "errorChannelId": "666666666666666666",
    "afk": {
      "channelId": "111111111111111111"
    },
    "bumpReminder": {
      "enabled": true,
      "mentionRoleIds": ["222222222222222222"],
      "mentionUserIds": []
    },
    "vac": {
      "triggerChannelId": "333333333333333333"
    },
    "memberLog": {
      "channelId": "444444444444444444",
      "joinMessage": null,
      "leaveMessage": null
    },
    "vcRecruit": {
      "channelId": "555555555555555555"
    }
  }
}
```

---

## import

### コマンド定義

**コマンド**: `/guild-config import`

**コマンドオプション:**

| オプション名 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `file` | Attachment | ✅ | エクスポートしたJSONファイルを添付 |

### 動作フロー

1. 添付ファイルのバリデーション（JSON形式・`version` フィールド・構造チェック）
2. `guildId` が実行サーバーと一致するか検証（不一致の場合はエラー）
3. チャンネル/ロールIDの存在チェック（不在は警告表示）
4. `createWarningEmbed` で確認ダイアログ Embed + ボタンを ephemeral で送信
5. 「インポートする」ボタン押下 → 既存設定を上書き保存 → `localeManager.invalidateLocaleCache(guildId)` → 完了メッセージに `update()`
6. 「キャンセル」ボタン押下 / 60秒タイムアウト → キャンセルメッセージに `update()`

**ビジネスルール:**

- 同一サーバーのバックアップ/リストアのみ対応（`guildId` 一致が必須）
- チャンネル/ロールIDが見つからない場合は警告表示のみでインポート自体は続行可能

### UI

**Embed（確認ダイアログ）:** `createWarningEmbed` を使用

| 項目 | 内容 |
| --- | --- |
| タイトル | ギルド設定インポート確認 |
| 説明 | 現在の設定が上書きされます。この操作は元に戻せません。 |
| フィールド | インポート内容（各機能の設定有無サマリー） |

**ボタン:**

| コンポーネント | ラベル | emoji | スタイル | 動作 |
| --- | --- | --- | --- | --- |
| `guild_config_import_confirm` | インポートする | ✅ | Danger | 設定を上書きインポートして完了メッセージに更新 |
| `guild_config_import_cancel` | キャンセル | ❌ | Secondary | キャンセルメッセージに更新 |

**バリデーションエラー:**

| 条件 | メッセージ |
| --- | --- |
| JSONパースエラー | ファイルの形式が正しくありません。エクスポートしたJSONファイルを添付してください。 |
| `version` 非対応 | このファイルのバージョンには対応していません。 |
| `guildId` 不一致 | このファイルは別のサーバーの設定です。同じサーバーでエクスポートしたファイルを使用してください。 |
| チャンネル/ロールID無効 | 一部のチャンネルまたはロールが見つかりません。設定を確認してください。（警告として表示、インポート自体は続行可能） |

---

## データモデル

### GuildConfig（既存 + 拡張）

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `guildId` | String | ギルドID（主キー） |
| `locale` | String | Bot 応答言語（デフォルト: `"ja"`） |
| `errorChannelId` | String? | エラー通知チャンネルID（新規追加） |
| `createdAt` | DateTime | 作成日時 |
| `updatedAt` | DateTime | 更新日時 |

> `locale` フィールドは Prisma スキーマ・`IBaseGuildRepository` インターフェース・`LocaleManager` のいずれも既に実装済み。`errorChannelId` は新規追加。

### エクスポートJSON スキーマ

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `version` | number | スキーマバージョン（現在: `1`） |
| `exportedAt` | string (ISO 8601) | エクスポート日時 |
| `guildId` | string | エクスポート元のギルドID |
| `config` | object | 全設定データ（locale + errorChannelId + 各機能設定） |

---

## 制約・制限事項

- view のページ操作タイムアウト: 5分（タイムアウト後はコンポーネントを `disabled` 化）
- reset / reset-all / import の確認ダイアログタイムアウト: 60秒
- import は同一サーバーの設定ファイルのみ対応（異サーバー間のコピーは非対応）
- view のインタラクションはコマンド実行者のみ操作可能

---

## ローカライズ

**翻訳ファイル:** `src/shared/locale/locales/{ja,en}/features/guildConfig.ts`

### コマンド定義

| キー | ja | en |
| --- | --- | --- |
| `guild-config.description` | ギルド設定を管理（サーバー管理権限が必要） | Manage guild settings (requires Manage Server) |
| `guild-config.set-locale.description` | Botの応答言語を設定 | Set bot response language |
| `guild-config.set-locale.locale.description` | 設定する言語を選択 | Select a language |
| `guild-config.set-error-channel.description` | エラー通知チャンネルを設定 | Set error notification channel |
| `guild-config.set-error-channel.channel.description` | エラー通知先テキストチャンネル | Text channel for error notifications |
| `guild-config.view.description` | 現在のギルド設定を表示 | View current guild settings |
| `guild-config.reset.description` | ギルド設定をリセット | Reset guild settings |
| `guild-config.reset-all.description` | 全機能の設定を一括リセット | Reset all feature settings |
| `guild-config.export.description` | ギルド設定をエクスポート | Export guild settings |
| `guild-config.import.description` | JSONファイルからギルド設定をインポート | Import guild settings from JSON file |
| `guild-config.import.file.description` | エクスポートしたJSONファイル | Exported JSON file |

### ユーザーレスポンス

| キー | ja | en |
| --- | --- | --- |
| `user-response.set_locale_success` | サーバーの言語を「{{locale}}」に設定しました。 | Server language has been set to "{{locale}}". |
| `user-response.set_error_channel_success` | エラー通知チャンネルを {{channel}} に設定しました。 | Error notification channel has been set to {{channel}}. |
| `user-response.invalid_channel_type` | テキストチャンネルを指定してください。 | Please specify a text channel. |
| `user-response.reset_success` | ギルド設定をリセットしました。 | Guild settings have been reset. |
| `user-response.reset_cancelled` | リセットをキャンセルしました。 | Reset has been cancelled. |
| `user-response.reset_all_success` | 全機能の設定をリセットしました。 | All feature settings have been reset. |
| `user-response.reset_all_cancelled` | リセットをキャンセルしました。 | Reset has been cancelled. |
| `user-response.export_success` | ギルド設定をエクスポートしました。 | Guild settings have been exported. |
| `user-response.export_empty` | エクスポートする設定がありません。 | No settings to export. |
| `user-response.import_success` | ギルド設定をインポートしました。 | Guild settings have been imported. |
| `user-response.import_cancelled` | インポートをキャンセルしました。 | Import has been cancelled. |
| `user-response.import_invalid_json` | ファイルの形式が正しくありません。エクスポートしたJSONファイルを添付してください。 | Invalid file format. Please attach an exported JSON file. |
| `user-response.import_unsupported_version` | このファイルのバージョンには対応していません。 | This file version is not supported. |
| `user-response.import_guild_mismatch` | このファイルは別のサーバーの設定です。同じサーバーでエクスポートしたファイルを使用してください。 | This file belongs to a different server. Please use a file exported from the same server. |
| `user-response.import_missing_channels` | 一部のチャンネルまたはロールが見つかりません。設定を確認してください。 | Some channels or roles were not found. Please review the settings. |
| `user-response.other_user_error` | このパネルを操作できるのは実行者のみです。 | Only the command executor can interact with this panel. |

### Embed

| キー | ja | en |
| --- | --- | --- |
| `embed.title.view` | ギルド設定 | Guild Settings |
| `embed.field.name.locale` | 言語 | Language |
| `embed.field.name.error_channel` | エラー通知チャンネル | Error Notification Channel |
| `embed.field.value.not_configured` | 未設定 | Not configured |
| `embed.title.reset_confirm` | ギルド設定リセット確認 | Guild Settings Reset |
| `embed.description.reset_confirm` | ギルド設定（言語・エラー通知チャンネル）をリセットしますか？\nこの操作は元に戻せません。 | Reset guild settings (language, error channel)?\nThis action cannot be undone. |
| `embed.title.reset_all_confirm` | 全設定リセット確認 | Reset All Settings |
| `embed.description.reset_all_confirm` | 全機能の設定をリセットしますか？\n以下の設定がすべて削除されます。この操作は元に戻せません。 | Reset all feature settings?\nAll settings below will be deleted. This action cannot be undone. |
| `embed.field.name.reset_all_target` | 削除対象 | Targets |
| `embed.field.value.reset_all_target` | 言語設定 / エラー通知チャンネル / AFK / VAC / VC募集 / メッセージ固定 / メンバーログ / Bumpリマインダー | Language / Error Channel / AFK / VAC / VC Recruit / Sticky Message / Member Log / Bump Reminder |
| `embed.title.import_confirm` | ギルド設定インポート確認 | Import Guild Settings |
| `embed.description.import_confirm` | 現在の設定が上書きされます。この操作は元に戻せません。 | Current settings will be overwritten. This action cannot be undone. |

### UIラベル

| キー | ja | en |
| --- | --- | --- |
| `ui.select.view_placeholder` | ページを選択... | Select a page... |
| `ui.select.guild_config` | ギルド設定 | Guild Settings |
| `ui.select.afk` | AFK | AFK |
| `ui.select.vac` | VAC | VAC |
| `ui.select.vc_recruit` | VC募集 | VC Recruit |
| `ui.select.sticky` | メッセージ固定 | Sticky Message |
| `ui.select.member_log` | メンバーログ | Member Log |
| `ui.select.bump` | Bumpリマインダー | Bump Reminder |
| `ui.button.reset_confirm` | リセットする | Reset |
| `ui.button.reset_cancel` | キャンセル | Cancel |
| `ui.button.reset_all_confirm` | リセットする | Reset |
| `ui.button.reset_all_cancel` | キャンセル | Cancel |
| `ui.button.import_confirm` | インポートする | Import |
| `ui.button.import_cancel` | キャンセル | Cancel |

### ログ

| キー | ja | en |
| --- | --- | --- |
| `log.locale_set` | 言語設定 GuildId: {{guildId}} Locale: {{locale}} | Language set GuildId: {{guildId}} Locale: {{locale}} |
| `log.error_channel_set` | エラー通知チャンネル設定 GuildId: {{guildId}} ChannelId: {{channelId}} | Error channel set GuildId: {{guildId}} ChannelId: {{channelId}} |
| `log.reset` | ギルド設定リセット GuildId: {{guildId}} | Guild settings reset GuildId: {{guildId}} |
| `log.reset_all` | 全設定リセット GuildId: {{guildId}} | All settings reset GuildId: {{guildId}} |
| `log.exported` | ギルド設定エクスポート GuildId: {{guildId}} | Guild settings exported GuildId: {{guildId}} |
| `log.imported` | ギルド設定インポート GuildId: {{guildId}} | Guild settings imported GuildId: {{guildId}} |

※ ページネーション関連キー（`page_jump.label`, `page_jump_modal.title`, `page_jump_modal.input.label`）は `common.ts` で共通定義

---

## 依存関係

| 依存先 | 内容 |
| --- | --- |
| LocaleManager | `invalidateLocaleCache()` による言語キャッシュの即時無効化（set-locale / reset / reset-all / import 後に必須） |
| 各機能 config view | view のページ 2〜8 で各機能の `buildViewEmbed` 相当の関数を再利用 |
| GuildConfigRepository | 全設定の取得・更新・削除（データ層は実装済み） |
