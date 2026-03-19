# ギルド設定機能 - 仕様書

> Guild Config - ギルド全体の共通設定の管理・バックアップ機能

最終更新: 2026年3月19日

---

## 概要

サーバー（ギルド）全体に適用される共通設定を管理するコマンドです。言語設定の切り替え、全設定の一覧確認、設定リセット、および設定のエクスポート/インポートによるバックアップ・リストアを提供します。

### 機能一覧

| 機能 | 概要 |
| --- | --- |
| set-locale | Bot の応答言語をギルド単位で設定（ja / en） |
| view | 現在のギルド設定をページ形式で表示 |
| reset | 確認ダイアログ付きでギルド設定をリセット |
| export | 現在のギルド設定をJSON形式でエクスポート |
| import | JSONファイルからギルド設定をインポート |

### 権限モデル

| 対象 | 権限 | 用途 |
| --- | --- | --- |
| 実行者 | ManageGuild | 全サブコマンドの実行 |
| Bot | なし | 追加権限不要 |

---

## set-locale

### コマンド定義

**コマンド**: `/guild-config set-locale`

**実行権限**: ManageGuild

**コマンドオプション:**

| オプション名 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `locale` | choices | ✅ | 設定する言語を選択（`ja`: 日本語 / `en`: English） |

### 動作フロー

1. ManageGuild 権限チェック
2. `repository.updateLocale(guildId, locale)` で DB 更新
3. `localeManager.invalidateLocaleCache(guildId)` でキャッシュを即時無効化
4. 完了メッセージを返信（ephemeral）

**ビジネスルール:**

- `set-locale` 実行後は `localeManager.invalidateLocaleCache(guildId)` を必ず呼ぶ。呼ばない場合、TTL（5分）が切れるまで古いロケールが使われ続ける

### UI

**成功メッセージ:**

```
✅ サーバーの言語を「日本語」に設定しました。
```

---

## view

### コマンド定義

**コマンド**: `/guild-config view`

**実行権限**: ManageGuild

**コマンドオプション:** なし

### 動作フロー

1. ManageGuild 権限チェック
2. `repository.getConfig(guildId)` でギルド設定全体を取得（レコードが存在しない場合はデフォルト設定として表示）
3. 各機能フィールドをパースして各ページ用データを生成
4. ページ 1（概要）の Embed + ボタン + セレクトメニューを ephemeral で返信
5. ボタン / セレクトメニューのインタラクション受信
6. 対応ページの Embed に `interaction.update()` で書き換え
7. 5分タイムアウト後にコンポーネントを `disabled` 化

**ビジネスルール:**

- 各ページの内容は `buildPage(pageIndex, config)` のような純粋関数で生成し、インタラクション受信時に再生成する（メモリ保持不要）
- ページ番号は `custom_id` のサフィックスや `interaction.message` の既存 Embed footer から復元する
- ページ 2 以降は各機能の `*-config view` が使っている Embed 生成ロジック（`buildViewEmbed` 相当の関数）をそのまま呼び出して再利用する
- `guild-config view` 側では Embed のフッターにページ番号を追記するだけにとどめる
- インタラクション発火元は `/guild-config view` を実行したユーザーのみ応答する（他ユーザーには ephemeral でエラー返却）

### UI

**Embed（ページ 1: 概要）:**

| 項目 | 内容 |
| --- | --- |
| タイトル | 🔧 ギルド設定 概要 |
| フィールド | 言語: 日本語 (ja) |
| フィールド | 機能状態（各機能の有効/無効一覧） |
| フッター | 🔧 ギルド設定 概要 • 1 / 8 |

**ページ一覧:**

| ページ番号 | タイトル | 内容 |
| --- | --- | --- |
| 1 | 🔧 ギルド設定 概要 | 言語 + 全機能の有効/無効一覧 |
| 2 | 😴 AFK | AFK の詳細設定 |
| 3 | ⚙️ VAC | VAC の詳細設定 |
| 4 | 🎤 VC募集 | VC募集の詳細設定 |
| 5 | 📌 メッセージ固定 | スティッキーメッセージの詳細設定 |
| 6 | 👋 メンバーログ | メンバーログの詳細設定 |
| 7 | 🗑️ メッセージ削除 | メッセージ削除の詳細設定 |
| 8 | 🔔 Bumpリマインダー | Bumpリマインダーの詳細設定 |

> ページ数は実装済み機能数に応じて増減する。
> ページ 2〜8 は対応する `*-config view` コマンドが生成する Embed をそのまま再利用する。
> 機能が未設定の場合は各機能の view と同様「未設定」表示を返す。

**ボタン / セレクトメニュー:**

| コンポーネント | ラベル | スタイル | 動作 |
| --- | --- | --- | --- |
| `guild_config_view_prev` | ◀ 前へ | Secondary | 前のページへ移動（1ページ目は `disabled`） |
| `guild_config_view_next` | 次へ ▶ | Secondary | 次のページへ移動（最終ページは `disabled`） |
| `guild_config_view_select` | ページを選択... | StringSelect | 選択したページへ直接移動 |

**セレクトメニュー選択肢:**

| ラベル | value | emoji |
| --- | --- | --- |
| 1. ギルド設定 概要 | `overview` | 🔧 |
| 2. AFK | `afk` | 😴 |
| 3. VAC | `vac` | ⚙️ |
| 4. VC募集 | `vc_recruit` | 🎤 |
| 5. メッセージ固定 | `sticky` | 📌 |
| 6. メンバーログ | `member_log` | 👋 |
| 7. メッセージ削除 | `msg_delete` | 🗑️ |
| 8. Bumpリマインダー | `bump` | 🔔 |

---

## reset

### コマンド定義

**コマンド**: `/guild-config reset`

**実行権限**: ManageGuild

**コマンドオプション:** なし

### 動作フロー

1. ManageGuild 権限チェック
2. 確認ダイアログ Embed + ボタンを ephemeral で送信
3. 「リセットする」ボタン押下 → `repository.deleteConfig(guildId)` → `localeManager.invalidateLocaleCache(guildId)` → 完了メッセージに `update()`
4. 「キャンセル」ボタン押下 / 60秒タイムアウト → キャンセルメッセージに `update()`

**ビジネスルール:**

- `deleteConfig` 後は `localeManager.invalidateLocaleCache(guildId)` を呼び出してキャッシュを即時クリアする

### UI

**Embed（確認ダイアログ）:**

| 項目 | 内容 |
| --- | --- |
| タイトル | ⚠️ ギルド設定をリセットしますか？ |
| 説明 | 以下の設定がすべて削除されます。この操作は元に戻せません。 |
| フィールド | 削除対象: 言語設定 / VAC / VC募集 / メッセージ固定 / メンバーログ / Bumpリマインダー / AFK |

**ボタン:**

| コンポーネント | ラベル | スタイル | 動作 |
| --- | --- | --- | --- |
| `guild_config_reset_confirm` | ✅ リセットする | Danger | 設定を全削除して完了メッセージに更新 |
| `guild_config_reset_cancel` | ❌ キャンセル | Secondary | キャンセルメッセージに更新 |

---

## export

### コマンド定義

**コマンド**: `/guild-config export`

**実行権限**: ManageGuild

**コマンドオプション:** なし

### 動作フロー

1. ManageGuild 権限チェック
2. repository から全設定を取得（GuildConfig + 各機能設定）
3. JSON形式にシリアライズ（`version`, `exportedAt`, `guildId`, `config`）
4. JSONファイルを添付した ephemeral メッセージで返信

**ビジネスルール:**

- 添付ファイル名: `guild-config-{guildId}-{timestamp}.json`
- 設定が存在しない場合はエラーメッセージを返す

### UI

**成功メッセージ:**

```
✅ ギルド設定をエクスポートしました。
```

**エクスポートJSON構造:**

```json
{
  "version": 1,
  "exportedAt": "2026-03-19T12:00:00.000Z",
  "guildId": "123456789012345678",
  "config": {
    "locale": "ja",
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

**実行権限**: ManageGuild

**コマンドオプション:**

| オプション名 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `file` | Attachment | ✅ | エクスポートしたJSONファイルを添付 |

### 動作フロー

1. ManageGuild 権限チェック
2. 添付ファイルのバリデーション（JSON形式・`version` フィールド・構造チェック）
3. `guildId` が実行サーバーと一致するか検証（不一致の場合はエラー）
4. チャンネル/ロールIDの存在チェック（不在は警告表示）
5. 確認ダイアログ Embed + ボタンを ephemeral で送信
6. 「インポートする」ボタン押下 → 既存設定を上書き保存 → `localeManager.invalidateLocaleCache(guildId)` → 完了メッセージに `update()`
7. 「キャンセル」ボタン押下 / 60秒タイムアウト → キャンセルメッセージに `update()`

**ビジネスルール:**

- 同一サーバーのバックアップ/リストアのみ対応（`guildId` 一致が必須）
- チャンネル/ロールIDが見つからない場合は警告表示のみでインポート自体は続行可能

### UI

**Embed（確認ダイアログ）:**

| 項目 | 内容 |
| --- | --- |
| タイトル | ⚠️ ギルド設定をインポートしますか？ |
| 説明 | 現在の設定が上書きされます。この操作は元に戻せません。 |
| フィールド | インポート内容（各機能の設定有無サマリー） |

**ボタン:**

| コンポーネント | ラベル | スタイル | 動作 |
| --- | --- | --- | --- |
| `guild_config_import_confirm` | ✅ インポートする | Danger | 設定を上書きインポートして完了メッセージに更新 |
| `guild_config_import_cancel` | ❌ キャンセル | Secondary | キャンセルメッセージに更新 |

**バリデーションエラー:**

| 条件 | エラーメッセージ |
| --- | --- |
| JSONパースエラー | ファイルの形式が正しくありません。エクスポートしたJSONファイルを添付してください。 |
| `version` 非対応 | このファイルのバージョンには対応していません。 |
| `guildId` 不一致 | このファイルは別のサーバーの設定です。同じサーバーでエクスポートしたファイルを使用してください。 |
| チャンネル/ロールID無効 | 一部のチャンネルまたはロールが見つかりません。設定を確認してください。（警告として表示、インポート自体は続行可能） |

---

## データモデル

### GuildConfig（既存）

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `guildId` | String | ギルドID（主キー） |
| `locale` | String | Bot 応答言語（デフォルト: `"ja"`） |
| `createdAt` | DateTime | 作成日時 |
| `updatedAt` | DateTime | 更新日時 |

> `locale` フィールドは Prisma スキーマ・`IBaseGuildRepository` インターフェース・`LocaleManager` のいずれも既に実装済み。本機能は**コマンド層のみ新規実装**となる。

### エクスポートJSON スキーマ

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `version` | number | スキーマバージョン（現在: `1`） |
| `exportedAt` | string (ISO 8601) | エクスポート日時 |
| `guildId` | string | エクスポート元のギルドID |
| `config` | object | 全設定データ（locale + 各機能設定） |

---

## 制約・制限事項

- view のページ操作タイムアウト: 5分（タイムアウト後はコンポーネントを `disabled` 化）
- reset / import の確認ダイアログタイムアウト: 60秒
- import は同一サーバーの設定ファイルのみ対応（異サーバー間のコピーは非対応）
- view のインタラクションはコマンド実行者のみ操作可能

---

## ローカライズ

### ja

| キー | 用途 | メッセージ |
| --- | --- | --- |
| `commands:guild-config.description` | コマンド説明 | ギルド設定を管理します |
| `commands:guild-config.set-locale.description` | コマンド説明 | Bot の応答言語を設定 |
| `commands:guild-config.set-locale.locale.description` | オプション説明 | 設定する言語を選択 |
| `commands:guild-config.set-locale.success` | レスポンス(success) | サーバーの言語を「{{locale}}」に設定しました。 |
| `commands:guild-config.view.description` | コマンド説明 | 現在のギルド設定を表示 |
| `commands:guild-config.view.title` | パネル | ギルド設定 概要 |
| `commands:guild-config.view.field.locale` | パネル | 言語 |
| `commands:guild-config.view.field.features` | パネル | 機能状態 |
| `commands:guild-config.view.footer` | パネル | {{current}} / {{total}} |
| `commands:guild-config.view.button.prev` | ボタン | ◀ 前へ |
| `commands:guild-config.view.button.next` | ボタン | 次へ ▶ |
| `commands:guild-config.view.select.placeholder` | セレクト | ページを選択... |
| `commands:guild-config.view.page.member_log` | セレクト | メンバーログ |
| `commands:guild-config.view.page.bump` | セレクト | Bumpリマインダー |
| `commands:guild-config.view.page.sticky` | セレクト | メッセージ固定 |
| `commands:guild-config.view.page.vac` | セレクト | VAC（VC自動作成） |
| `commands:guild-config.view.page.vc_recruit` | セレクト | VC募集 |
| `commands:guild-config.view.page.afk` | セレクト | AFK |
| `commands:guild-config.view.page.msg_delete` | セレクト | メッセージ削除 |
| `commands:guild-config.view.other_user_error` | レスポンス(error) | このパネルを操作できるのは実行者のみです。 |
| `commands:guild-config.reset.description` | コマンド説明 | ギルド設定をリセット |
| `commands:guild-config.reset.confirm.title` | パネル | ギルド設定をリセットしますか？ |
| `commands:guild-config.reset.confirm.description` | パネル | 以下の設定がすべて削除されます。この操作は元に戻せません。 |
| `commands:guild-config.reset.button.confirm` | ボタン | ✅ リセットする |
| `commands:guild-config.reset.button.cancel` | ボタン | ❌ キャンセル |
| `commands:guild-config.reset.success` | レスポンス(success) | ギルド設定をリセットしました。 |
| `commands:guild-config.reset.cancelled` | レスポンス(info) | リセットをキャンセルしました。 |
| `commands:guild-config.export.description` | コマンド説明 | ギルド設定をエクスポート |
| `commands:guild-config.export.success` | レスポンス(success) | ギルド設定をエクスポートしました。 |
| `commands:guild-config.export.empty` | レスポンス(error) | エクスポートする設定がありません。 |
| `commands:guild-config.import.description` | コマンド説明 | JSONファイルからギルド設定をインポート |
| `commands:guild-config.import.file.description` | オプション説明 | エクスポートしたJSONファイル |
| `commands:guild-config.import.confirm.title` | パネル | ギルド設定をインポートしますか？ |
| `commands:guild-config.import.confirm.description` | パネル | 現在の設定が上書きされます。この操作は元に戻せません。 |
| `commands:guild-config.import.button.confirm` | ボタン | ✅ インポートする |
| `commands:guild-config.import.button.cancel` | ボタン | ❌ キャンセル |
| `commands:guild-config.import.success` | レスポンス(success) | ギルド設定をインポートしました。 |
| `commands:guild-config.import.cancelled` | レスポンス(info) | インポートをキャンセルしました。 |
| `commands:guild-config.import.error.invalid_json` | レスポンス(error) | ファイルの形式が正しくありません。エクスポートしたJSONファイルを添付してください。 |
| `commands:guild-config.import.error.unsupported_version` | レスポンス(error) | このファイルのバージョンには対応していません。 |
| `commands:guild-config.import.error.guild_mismatch` | レスポンス(error) | このファイルは別のサーバーの設定です。同じサーバーでエクスポートしたファイルを使用してください。 |
| `commands:guild-config.import.warning.missing_channels` | レスポンス(warning) | 一部のチャンネルまたはロールが見つかりません。設定を確認してください。 |

### en

| キー | 用途 | メッセージ |
| --- | --- | --- |
| `commands:guild-config.description` | コマンド説明 | Manage guild settings |
| `commands:guild-config.set-locale.description` | コマンド説明 | Set the bot response language |
| `commands:guild-config.set-locale.locale.description` | オプション説明 | Select the language |
| `commands:guild-config.set-locale.success` | レスポンス(success) | Server language has been set to "{{locale}}". |
| `commands:guild-config.view.description` | コマンド説明 | View current guild settings |
| `commands:guild-config.view.title` | パネル | Guild Settings Overview |
| `commands:guild-config.view.field.locale` | パネル | Language |
| `commands:guild-config.view.field.features` | パネル | Feature Status |
| `commands:guild-config.view.footer` | パネル | {{current}} / {{total}} |
| `commands:guild-config.view.button.prev` | ボタン | ◀ Previous |
| `commands:guild-config.view.button.next` | ボタン | Next ▶ |
| `commands:guild-config.view.select.placeholder` | セレクト | Select a page... |
| `commands:guild-config.view.page.member_log` | セレクト | Member Log |
| `commands:guild-config.view.page.bump` | セレクト | Bump Reminder |
| `commands:guild-config.view.page.sticky` | セレクト | Sticky Message |
| `commands:guild-config.view.page.vac` | セレクト | VAC (Auto VC) |
| `commands:guild-config.view.page.vc_recruit` | セレクト | VC Recruit |
| `commands:guild-config.view.page.afk` | セレクト | AFK |
| `commands:guild-config.view.page.msg_delete` | セレクト | Message Delete |
| `commands:guild-config.view.other_user_error` | レスポンス(error) | Only the command executor can interact with this panel. |
| `commands:guild-config.reset.description` | コマンド説明 | Reset guild settings |
| `commands:guild-config.reset.confirm.title` | パネル | Reset guild settings? |
| `commands:guild-config.reset.confirm.description` | パネル | All settings below will be deleted. This action cannot be undone. |
| `commands:guild-config.reset.button.confirm` | ボタン | ✅ Reset |
| `commands:guild-config.reset.button.cancel` | ボタン | ❌ Cancel |
| `commands:guild-config.reset.success` | レスポンス(success) | Guild settings have been reset. |
| `commands:guild-config.reset.cancelled` | レスポンス(info) | Reset has been cancelled. |
| `commands:guild-config.export.description` | コマンド説明 | Export guild settings |
| `commands:guild-config.export.success` | レスポンス(success) | Guild settings have been exported. |
| `commands:guild-config.export.empty` | レスポンス(error) | No settings to export. |
| `commands:guild-config.import.description` | コマンド説明 | Import guild settings from a JSON file |
| `commands:guild-config.import.file.description` | オプション説明 | Exported JSON file |
| `commands:guild-config.import.confirm.title` | パネル | Import guild settings? |
| `commands:guild-config.import.confirm.description` | パネル | Current settings will be overwritten. This action cannot be undone. |
| `commands:guild-config.import.button.confirm` | ボタン | ✅ Import |
| `commands:guild-config.import.button.cancel` | ボタン | ❌ Cancel |
| `commands:guild-config.import.success` | レスポンス(success) | Guild settings have been imported. |
| `commands:guild-config.import.cancelled` | レスポンス(info) | Import has been cancelled. |
| `commands:guild-config.import.error.invalid_json` | レスポンス(error) | Invalid file format. Please attach an exported JSON file. |
| `commands:guild-config.import.error.unsupported_version` | レスポンス(error) | This file version is not supported. |
| `commands:guild-config.import.error.guild_mismatch` | レスポンス(error) | This file belongs to a different server. Please use a file exported from the same server. |
| `commands:guild-config.import.warning.missing_channels` | レスポンス(warning) | Some channels or roles were not found. Please review the settings. |

---

## 依存関係

| 依存先 | 内容 |
| --- | --- |
| LocaleManager | `invalidateLocaleCache()` による言語キャッシュの即時無効化（set-locale / reset / import 後に必須） |
| 各機能 config view | view のページ 2〜8 で各機能の `buildViewEmbed` 相当の関数を再利用 |
| GuildConfigRepository | 全設定の取得・更新・削除（データ層は実装済み） |
