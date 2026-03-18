# 基本コマンド - 仕様書

> Basic Commands - ユーティリティ系のシンプルなコマンド群

最終更新: 2026年3月1日

---

## 概要

単体では小さくまとめるほどの仕様がないコマンドをまとめた仕様書です。
疎通確認・ヘルプ・サーバー情報・ユーザー情報の4コマンドを管理します。

### コマンド一覧

| コマンド       | 権限 | 説明                                         | 状態     |
| -------------- | ---- | -------------------------------------------- | -------- |
| `/ping`        | なし | Bot の応答速度（レイテンシー）を確認         | ✅実装済 |
| `/help`        | なし | コマンド一覧とユーザーマニュアルリンクを表示 | 未実装   |
| `/server-info` | なし | サーバー（ギルド）情報を表示                 | 未実装   |
| `/user-info`   | なし | ユーザー情報を表示                           | 未実装   |

---

## コマンド仕様

### `/ping` - 疎通確認（実装済み）

```
/ping
```

**処理内容:**

1. `🏓 計測中...` を即時返信
2. `fetchReply()` で送信タイムスタンプを取得して API レイテンシーを算出
3. `interaction.client.ws.ping` で WebSocket ping を取得
4. Embed 形式で更新返信

**レスポンス例:**

```
📡 API レイテンシー: 130ms
💓 WebSocket Ping: 42ms
```

**クールダウン**: 5秒

---

### `/help` - ヘルプ

```
/help
```

**処理内容:**

- 実装済みコマンドの一覧を Embed で表示
- ユーザーマニュアルへのリンクを末尾に掲載

**表示形式（Embed）:**

<table border="1" cellpadding="8" width="480">
<tr><th align="left">📖 ayasono コマンド一覧</th></tr>
<tr><td>
<b>🔧 基本</b><br>
<code>/ping</code> &emsp; Bot の応答速度を確認<br>
<code>/help</code> &emsp; このヘルプを表示<br>
<code>/user-info</code> &emsp; ユーザー情報を表示<br>
<code>/server-info</code> &emsp; サーバー情報を表示
</td></tr>
<tr><td>
<b>⚙️ 設定（管理者）</b><br>
<code>/guild-config</code> &emsp; ギルド全体の設定<br>
<code>/afk-config</code> &emsp; AFK の設定<br>
<code>/vac-config</code> &emsp; VC自動作成の設定<br>
<code>/vc-recruit-config</code> &emsp; VC募集の設定<br>
<code>/sticky-message</code> &emsp; メッセージ固定の設定<br>
<code>/member-log-config</code> &emsp; メンバーログの設定<br>
<code>/message-delete-config</code> &emsp; メッセージ削除の設定<br>
<code>/bump-reminder-config</code> &emsp; Bumpリマインダーの設定
</td></tr>
<tr><td>
<b>🛠️ 操作</b><br>
<code>/afk</code> &emsp; AFK チャンネルへ移動<br>
<code>/vac</code> &emsp; VC名・人数制限を変更<br>
<code>/message-delete</code> &emsp; メッセージを一括削除
</td></tr>
<tr><td>📚 詳しい使い方: <a href="../guides/USER_MANUAL.md">ユーザーマニュアル</a></td></tr>
</table>

**ユーザーマニュアルリンク**: `docs/guides/USER_MANUAL.md` の URL または GitHub Pages 等のホスト先 URL

> リンクは設定値（環境変数または定数）として管理し、未設定の場合はリンク行を省略する。

**レスポンス**: ephemeral（実行者のみに表示）

---

### `/server-info` - サーバー情報

```
/server-info
```

**処理内容:**

- `interaction.guild` からサーバー情報を取得して Embed で表示

**表示フィールド:**

| フィールド     | 内容                                           |
| -------------- | ---------------------------------------------- |
| サーバー名     | `guild.name`                                   |
| サーバーID     | `guild.id`                                     |
| オーナー       | `<@ownerId>`                                   |
| メンバー数     | `guild.memberCount`                            |
| 作成日時       | Discord の `:f` フォーマット                   |
| 認証レベル     | `guild.verificationLevel`（数値→テキスト変換） |
| ブースト数     | `guild.premiumSubscriptionCount`               |
| ブーストレベル | `guild.premiumTier`                            |

**サムネイル**: `guild.iconURL()`（設定されている場合）

---

### `/user-info` - ユーザー情報

```
/user-info
/user-info user:@TargetUser
```

**オプション:**

| オプション名 | 型   | 必須 | 説明                             |
| ------------ | ---- | ---- | -------------------------------- |
| `user`       | User | ❌   | 対象ユーザー（省略時は自分自身） |

**表示フィールド:**

| フィールド       | 内容                                              |
| ---------------- | ------------------------------------------------- |
| ユーザー名       | `user.username`（`user.globalName` があれば優先） |
| ユーザーID       | `user.id`                                         |
| アカウント作成日 | Discord の `:f` フォーマット                      |
| サーバー参加日   | `member.joinedAt`（取得可能な場合のみ）           |
| ロール           | 所持ロール一覧（`@everyone` 除く）                |
| Bot フラグ       | Bot の場合 `🤖 Bot` を表示                        |

**サムネイル**: `user.displayAvatarURL()`

---

## 多言語対応（i18next）

### ローカライゼーションキー（`commands` ネームスペース）

```ts
// /ping（実装済み）
"ping.description";
"ping.embed.measuring";
"ping.embed.response"; // {{apiLatency}}, {{wsLatency}}

// /help
"help.description";
"help.embed.title"; // ayasono コマンド一覧
"help.embed.section.basic"; // 🔧 基本
"help.embed.section.config"; // ⚙️ 設定（管理者）
"help.embed.section.action"; // 🛠️ 操作
"help.embed.manual_link"; // 📚 詳しい使い方: {{url}}

// /server-info
"server-info.description";
"server-info.embed.title"; // サーバー情報
"server-info.embed.field.owner"; // オーナー
"server-info.embed.field.members"; // メンバー数
"server-info.embed.field.created"; // 作成日時
"server-info.embed.field.verification"; // 認証レベル
"server-info.embed.field.boosts"; // ブースト数
"server-info.embed.field.tier"; // ブーストレベル

// /user-info
"user-info.description";
"user-info.user.description"; // 対象ユーザー（省略で自分）
"user-info.embed.title"; // ユーザー情報
"user-info.embed.field.id"; // ユーザーID
"user-info.embed.field.created"; // アカウント作成日
"user-info.embed.field.joined"; // サーバー参加日
"user-info.embed.field.roles"; // ロール
"user-info.embed.bot_label"; // 🤖 Bot
```

---

## 実装チェックリスト

### `/ping`（実装済み）

- [x] `src/bot/commands/ping.ts`
- [x] `src/bot/features/ping/commands/pingCommand.execute.ts`
- [x] テスト実装

### `/help`

- [ ] `src/bot/commands/help.ts`
- [ ] `src/bot/features/help/commands/helpCommand.execute.ts`
- [ ] ロケールリソース更新（ja / en）
- [ ] テスト実装

### `/server-info`

- [ ] `src/bot/commands/server-info.ts`
- [ ] `src/bot/features/server-info/commands/serverInfoCommand.execute.ts`
- [ ] ロケールリソース更新（ja / en）
- [ ] テスト実装

### `/user-info`

- [ ] `src/bot/commands/user-info.ts`
- [ ] `src/bot/features/user-info/commands/userInfoCommand.execute.ts`
- [ ] ロケールリソース更新（ja / en）
- [ ] テスト実装

---

## 設計メモ

### `/help` のコマンド一覧管理

コマンド一覧は `commandLoader.ts`（ディレクトリ自動スキャン）で動的に収集されるが、ヘルプ用の表示順・カテゴリ分けを柔軟に制御するためにはヘルプ専用の定義テーブルを別途持つ方が適切。実装時に判断する。

### ユーザーマニュアルリンク

外部公開 URL が未定のため、環境変数 `USER_MANUAL_URL` で制御し、未設定時はリンク行を省略する。
