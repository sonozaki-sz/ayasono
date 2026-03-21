# Botメッセージレスポンス - 仕様書

> Botが送信するメッセージの統一フォーマット仕様

最終更新: 2026年3月21日

---

## 概要

Botが送信するすべてのメッセージ（コマンド応答、エラー通知など）を**Embed形式**で統一し、視認性と一貫性を向上させる仕様です。

### ステータスの種類

| ステータス | 説明 | カラーコード | 絵文字 | 用途 |
| --- | --- | --- | --- | --- |
| Success（成功） | 操作が正常に完了 | `0x57F287`（Green） | ✅ | 設定完了、機能有効化、登録成功など |
| Info（情報） | 一般的な情報表示 | `0x3498DB`（Blue） | ℹ️ | 設定状態表示、ヘルプメッセージなど |
| Warning（注意） | 注意が必要な状態 | `0xFEE75C`（Yellow） | ⚠️ | 既に設定済み、制限事項の通知など |
| Error（エラー） | エラーが発生 | `0xED4245`（Red） | ❌ | コマンド失敗、権限不足、バリデーションエラーなど |

---

## Embedメッセージの構造

### タイトル形式

ステータス絵文字がタイトルの先頭に自動付与される。

```
[絵文字] [タイトル]
```

**例:**

- `✅ 設定完了`
- `ℹ️ Bumpリマインダー機能`
- `⚠️ 既に設定されています`
- `❌ エラーが発生しました`

### ヘルパー関数

| 関数名 | ステータス | デフォルトタイトル | 用途 |
| --- | --- | --- | --- |
| `createSuccessEmbed(description, options?)` | Success | `common:title_success` | 成功メッセージ |
| `createInfoEmbed(description, options?)` | Info | `common:title_info` | 情報メッセージ |
| `createWarningEmbed(description, options?)` | Warning | `common:title_warning` | 警告メッセージ |
| `createErrorEmbed(description, options?)` | Error | `common:title_error` | エラーメッセージ |

**オプション:**

| プロパティ | 型 | 説明 |
| --- | --- | --- |
| `title` | string | カスタムタイトル（デフォルトタイトルを上書き） |
| `timestamp` | boolean | タイムスタンプを表示 |
| `fields` | Array | Embedフィールドを追加 |

---

## 適用範囲

### Embed形式を使用するもの

- すべてのコマンドレスポンス（成功・エラー・情報表示）
- 設定表示パネル（`-config view`）
- 確認ダイアログ（リセット・削除・インポート）

### Embed形式を使用しないもの（例外）

| 対象 | 形式 | 理由 |
| --- | --- | --- |
| Bumpリマインダー通知 | プレーンテキスト + メンション | メンションとリマインダーを簡潔に表示するため |
| Bumpパネル | カスタムEmbed + ボタン | 既にEmbed形式でボタンUIと組み合わせて機能的 |
| メンバーログ通知 | カスタムEmbed | 独自のカラー（ビリジアン/茜色）とフィールド構成を使用 |
| スティッキーメッセージ | プレーンテキスト or カスタムEmbed | ユーザーが設定した内容をそのまま表示 |

---

## 制約・制限事項

- Embedタイトル: 最大256文字（超過時は自動切り詰め）
- Embed説明: 最大4096文字
- タイトルが256文字を超える場合は `...` で切り詰め
- Bot権限不足でEmbed送信に失敗した場合はエラーログを記録

---

## 依存関係

| 依存先 | 内容 |
| --- | --- |
| common.ts | デフォルトタイトル（`title_success`, `title_info`, `title_warning`, `title_error`） |

---

## 参考リソース

- [Discord.js - EmbedBuilder](https://discord.js.org/#/docs/discord.js/main/class/EmbedBuilder)
- [Discord - Embed Colors](https://discord.com/developers/docs/resources/channel#embed-object)
