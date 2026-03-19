# 基本コマンド - 仕様書

> 疎通確認・ヘルプ表示などユーティリティ系のシンプルなコマンド群

最終更新: 2026年3月19日

---

## 概要

### 機能一覧

| 機能    | 概要                                         |
| ------- | -------------------------------------------- |
| `/ping` | Bot の応答速度（APIレイテンシー・WS Ping）を確認 |
| `/help` | コマンド一覧とユーザーマニュアルリンクを表示 |

### 権限モデル

| 対象   | 権限 | 用途                     |
| ------ | ---- | ------------------------ |
| 実行者 | なし | 全メンバーが実行可能     |
| Bot    | なし | 追加権限不要（応答のみ） |

---

## `/ping`（実装済み）

### コマンド定義

**コマンド**: `/ping`

**実行権限**: なし

**コマンドオプション**: なし

### 動作フロー

1. `🏓 計測中...` を即時返信（`fetchReply: true`）
2. 返信メッセージのタイムスタンプから API レイテンシーを算出
3. `interaction.client.ws.ping` で WebSocket Ping を取得
4. Embed 形式で返信を更新

### UI

**Embed:**

| 項目     | 内容                                         |
| -------- | -------------------------------------------- |
| タイトル | なし                                         |
| 説明     | `📡 API レイテンシー: {{apiLatency}}ms`（改行）`💓 WebSocket Ping: {{wsLatency}}ms` |

---

## `/help`

### コマンド定義

**コマンド**: `/help`

**実行権限**: なし

**コマンドオプション**: なし

### 動作フロー

1. コマンド一覧を3カテゴリに分けて Embed を構築
2. ユーザーマニュアルリンクが設定されていれば末尾に掲載
3. ephemeral（実行者のみに表示）で返信

**ビジネスルール:**

- ユーザーマニュアルリンクは環境変数 `USER_MANUAL_URL` で管理し、未設定時はリンク行を省略する
- コマンド一覧はヘルプ専用の定義テーブルで管理する（`commandLoader.ts` の自動スキャンとは別に、表示順・カテゴリ分けを制御）

### UI

**Embed:**

| 項目   | 内容                                                                         |
| ------ | ---------------------------------------------------------------------------- |
| タイトル | `📖 ayasono コマンド一覧`                                                  |
| 説明   | `📚 詳しい使い方: {{url}}`（`USER_MANUAL_URL` 設定時のみ表示） |
| カラー | デフォルト                                                                   |

**Embed フィールド:**

各カテゴリを Embed のフィールドとして表示する。

| フィールド名         | 内容                                              |
| -------------------- | ------------------------------------------------- |
| `🔧 基本`           | `/ping` — Bot の応答速度を確認                    |
|                      | `/help` — このヘルプを表示                        |
| `⚙️ 設定（管理者）` | `/guild-config` — ギルド全体の設定                |
|                      | `/afk-config` — AFK の設定                        |
|                      | `/vac-config` — VC自動作成の設定                  |
|                      | `/vc-recruit-config` — VC募集の設定               |
|                      | `/sticky-message` — メッセージ固定の設定          |
|                      | `/member-log-config` — メンバーログの設定         |
|                      | `/message-delete-config` — メッセージ削除の設定   |
|                      | `/bump-reminder-config` — Bumpリマインダーの設定  |
| `🛠️ 操作`          | `/afk` — AFK チャンネルへ移動                     |
|                      | `/vc` — VC名・人数制限を変更                      |
|                      | `/message-delete` — メッセージを一括削除          |

---

## 制約・制限事項

- `/ping` のクールダウン: 5秒

---

## ローカライズ

### ja

| キー                          | 用途           | メッセージ                                                   |
| ----------------------------- | -------------- | ------------------------------------------------------------ |
| `commands:ping.description`   | コマンド説明   | Botの応答速度を確認                                          |
| `commands:ping.embed.measuring` | レスポンス   | 🏓 計測中...                                                |
| `commands:ping.embed.response`  | レスポンス   | 📡 API レイテンシー: {{apiLatency}}ms / 💓 WebSocket Ping: {{wsLatency}}ms |
| `commands:help.description`   | コマンド説明   | コマンド一覧を表示                                           |
| `commands:help.embed.title`   | Embed タイトル | 📖 ayasono コマンド一覧                                     |
| `commands:help.embed.section.basic`  | Embed フィールド名 | 🔧 基本                                              |
| `commands:help.embed.section.config` | Embed フィールド名 | ⚙️ 設定（管理者）                                   |
| `commands:help.embed.section.action` | Embed フィールド名 | 🛠️ 操作                                            |
| `commands:help.embed.description`    | Embed 説明         | 📚 詳しい使い方: {{url}}                            |
| `commands:help.embed.section.basic.content`  | Embed フィールド値 | `/ping` — Bot の応答速度を確認（改行）`/help` — このヘルプを表示 |
| `commands:help.embed.section.config.content` | Embed フィールド値 | `/guild-config` — ギルド全体の設定（改行）...       |
| `commands:help.embed.section.action.content` | Embed フィールド値 | `/afk` — AFK チャンネルへ移動（改行）...            |

### en

| キー                          | 用途           | メッセージ                                                   |
| ----------------------------- | -------------- | ------------------------------------------------------------ |
| `commands:ping.description`   | コマンド説明   | Check bot response speed                                     |
| `commands:ping.embed.measuring` | レスポンス   | 🏓 Measuring...                                             |
| `commands:ping.embed.response`  | レスポンス   | 📡 API Latency: {{apiLatency}}ms / 💓 WebSocket Ping: {{wsLatency}}ms |
| `commands:help.description`   | コマンド説明   | Show command list                                            |
| `commands:help.embed.title`   | Embed タイトル | 📖 ayasono Commands                                         |
| `commands:help.embed.section.basic`  | Embed フィールド名 | 🔧 Basic                                             |
| `commands:help.embed.section.config` | Embed フィールド名 | ⚙️ Settings (Admin)                                 |
| `commands:help.embed.section.action` | Embed フィールド名 | 🛠️ Actions                                         |
| `commands:help.embed.description`    | Embed 説明         | 📚 Learn more: {{url}}                              |
| `commands:help.embed.section.basic.content`  | Embed フィールド値 | `/ping` — Check bot response speed（改行）`/help` — Show this help |
| `commands:help.embed.section.config.content` | Embed フィールド値 | `/guild-config` — Guild settings（改行）...          |
| `commands:help.embed.section.action.content` | Embed フィールド値 | `/afk` — Move to AFK channel（改行）...              |

---

## 依存関係

| 依存先               | 内容                                                         |
| -------------------- | ------------------------------------------------------------ |
| `USER_MANUAL_URL`    | `/help` のユーザーマニュアルリンク表示に使用（環境変数、未設定時は省略） |
