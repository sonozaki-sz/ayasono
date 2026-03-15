# メッセージ固定機能 - 仕様書

> Sticky Message - 常に最下部に表示されるメッセージ固定機能

最終更新: 2026年2月22日

---

## 📋 概要

### 目的

指定したチャンネルに「スティッキーメッセージ（固定メッセージ）」を設定し、新しいメッセージが投稿されるたびに自動的に最下部に再送信する機能を提供します。Discordの「ピン留め」機能は上部に固定されるため見逃されやすいですが、スティッキーメッセージは常に最下部に表示されるため、重要な情報を確実に目に留めることができます。

### 主な用途

1. **サーバールールの告知**: チャンネルごとのルールを常に表示
2. **注意事項の表示**: 禁止事項や推奨事項を見逃されないように固定
3. **アナウンスの継続表示**: イベント告知や重要なお知らせを常に表示
4. **チャンネルの使い方**: 特定チャンネルの使用方法を明示
5. **テンプレートメッセージの表示**: テンプレートメッセージを常に表示

### 特徴

- **自動再送信**: 新しいメッセージが投稿されるたびに最下部に再送信
- **Embed対応**: テキストメッセージだけでなく、視認性の高いEmbed形式も対応
- **チャンネルごとの設定**: 各チャンネルで独立して1つのスティッキーメッセージを設定可能
- **簡単な管理**: コマンドで設定・更新・削除が可能

---

## 🎯 主要機能

### 1. スティッキーメッセージ設定

**設定対象**: チャンネルごとに1つのスティッキーメッセージを設定可能

**メッセージ形式:**

- テキストメッセージ（最大2000文字）
- Embed形式も対応（タイトル、説明、カラー）
- 画像・リンク対応

**処理フロー:**

```
1. `/sticky-message set` コマンドを実行
   ↓
2. オプションでメッセージ内容を入力
   - style: 表示スタイルの選択 (String スラッシュオプション: text / embed)
   - message / embed-title / embed-description / embed-color: モーダル入力
   ↓
3. 指定チャンネルにメッセージを送信
   ↓
4. データベースに保存
   - guild_id
   - channel_id
   - content
   - embed_data (JSON)
   - last_message_id
   ↓
5. 今後、このチャンネルで新しいメッセージが投稿されるたびに再送信
```

---

## 🎛️ コマンド仕様

### コマンド体系

メッセージ固定機能はすべて `/sticky-message` コマンド1本で完結します。有効/無効のトグルや機能スコープの切り替えがないため、別途 `-config` コマンドを用意しません。

| サブコマンド | 役割                                                              | 必要権限          |
| ------------ | ----------------------------------------------------------------- | ----------------- |
| `set`        | チャンネルにスティッキーメッセージを設定                          | `MANAGE_CHANNELS` |
| `remove`     | セレクトメニューでチャンネルを選んで一括削除                      | `MANAGE_CHANNELS` |
| `update`     | 既存スティッキーメッセージの内容を更新                            | `MANAGE_CHANNELS` |
| `view`       | セレクトメニューで設定チャンネルを選んで 詳細確認（一覧も兼ねる） | `MANAGE_CHANNELS` |

---

## `/sticky-message` コマンド

スティッキーメッセージの設定・削除・更新・確認をすべて扱う単一コマンドです。サブコマンドは `set` / `remove` / `update` / `view` の4つです。

### `/sticky-message set`

**説明**: 指定チャンネルにスティッキーメッセージを設定

**オプション:**

| オプション名 | 型             | 必須 | 説明                                                                                              |
| ------------ | -------------- | ---- | ------------------------------------------------------------------------------------------------- |
| `channel`    | Channel (TEXT) | ❌   | スティッキーメッセージを設定するチャンネル （省略時はコマンド実行チャンネル）                     |
| `style`      | String         | ❌   | 表示スタイル（`text`: テキストモーダルを表示 / `embed`: Embedモーダルを表示、デフォルト: `text`） |

> メッセージ内容（`message` / `embed-title` / `embed-description` / `embed-color`）はスラッシュオプションではなく、コマンド実行後に表示される**モーダル**で入力します。

**権限**: `MANAGE_CHANNELS`

**実行例:**

```
# テキスト形式（channel のみ、style 未指定または style:text）
/sticky-message set channel:#rules
# → モーダルでメッセージ内容を入力

# Embed形式
/sticky-message set channel:#rules style:embed
# → Embed用モーダル（タイトル・説明・カラー）が表示される
```

**モーダルイメージ:**

_テキストモーダル（`style` 未指定または `style:text`）:_

<table border="1" cellpadding="8" width="420">
<tr><th align="left">メッセージ内容</th></tr>
<tr><td><i>改行して複数行のメッセージを入力できます（最大2000文字）</i><br><br><br><br></td></tr>
<tr><td align="center"><kbd>　送信する　</kbd></td></tr>
</table>

_Embed モーダル（`style:embed`）:_

<table border="1" cellpadding="8" width="420">
<tr><th align="left">タイトル</th></tr>
<tr><td><i>Embed のタイトルを入力（最大256文字）</i></td></tr>
<tr><th align="left">カラーコード（任意）</th></tr>
<tr><td><i>#008969 または 0x008969 形式で入力（省略時: #008969）</i></td></tr>
<tr><th align="left">内容</th></tr>
<tr><td><i>Embed の内容を入力（最大4096文字）</i><br><br><br></td></tr>
<tr><td align="center"><kbd>　送信する　</kbd></td></tr>
</table>

**処理:**

1. 権限チェック（`MANAGE_CHANNELS` または `ADMINISTRATOR`）
2. チャンネルがテキストチャンネルか確認
3. チャンネルに既存のスティッキーメッセージがある場合は警告
4. メッセージをチャンネルに送信
5. データベースに保存（`last_message_id` を更新）
6. 設定完了メッセージを Ephemeral で返信

**エラーケース:**

| 状況                   | メッセージ                                                                        |
| ---------------------- | --------------------------------------------------------------------------------- |
| 権限不足               | この操作を実行する権限がありません。 チャンネル管理権限が必要です。               |
| テキストチャンネル以外 | テキストチャンネルにのみ設定できます。                                            |
| 既に設定済み           | 既にスティッキーメッセージが設定されています。 削除してから再度設定してください。 |
| メッセージが空         | メッセージ内容を入力してください。                                                |

---

### `/sticky-message remove`

**説明**: 設定済みチャンネルをセレクトメニューから選択してスティッキーメッセージを一括削除

**オプション**: なし

**権限**: `MANAGE_CHANNELS`

**実行例:**

```
/sticky-message remove
# → 設定済みチャンネルのセレクトメニュー（複数選択可）が表示される
```

**UXフロー:**

```
1. /sticky-message remove を実行
   ↓
2. 設定済みチャンネルの一覧をセレクトメニュー（複数選択可）で表示（Ephemeral）
   ↓
3. 削除したいチャンネルを1つ以上選択し「削除する」ボタンを押下
   ↓
4. 選択されたチャンネルのスティッキーメッセージを一括削除
   ↓
5. 削除結果を Ephemeral で返信
```

**セレクトメニューイメージ:**

<table border="1" cellpadding="6" width="420">
<tr><th align="left">🗑️ 削除するチャンネルを選択（複数選択可）</th></tr>
<tr><td>☐ #rules<br>☐ #announcements<br>☐ #general</td></tr>
<tr><td align="center"><kbd>　削除する　</kbd></td></tr>
</table>

**処理:**

1. 権限チェック（`MANAGE_CHANNELS` または `ADMINISTRATOR`）
2. データベースから現在のギルドのすべてのスティッキーメッセージを取得
3. チャンネル名と ID のセレクトメニュー（`min_values: 1`, `max_values`: 設定数）を生成して Ephemeral で返信
4. 「削除する」ボタン押下時
   - 選択された各チャンネルについて:
     - チャンネル内の最後のスティッキーメッセージを削除（`last_message_id` で対象を特定、失敗は無視）
     - データベースレコードを削除
   - 削除完了メッセージを Ephemeral で返信（削除したチャンネル一覧を表示）

**エラーケース:**

| 状況     | メッセージ                                                         |
| -------- | ------------------------------------------------------------------ |
| 権限不足 | この操作を実行する権限がありません。チャンネル管理権限が必要です。 |
| 設定なし | スティッキーメッセージは設定されていません。                       |

---

### `/sticky-message update`

**説明**: 既存のスティッキーメッセージの内容を上書き更新する

削除・再設定の手間なく内容を変更できます。チャンネルのスティッキーメッセージは更新後にただちに差し替えられます（旧メッセージを削除し、新しい内容で再送信）。

**オプション:**

| オプション名 | 型             | 必須 | 説明                                                                                              |
| ------------ | -------------- | ---- | ------------------------------------------------------------------------------------------------- |
| `channel`    | Channel (TEXT) | ❌   | 更新するスティッキーメッセージのチャンネル （省略時はコマンド実行チャンネル）                     |
| `style`      | String         | ❌   | 表示スタイル（`text`: テキストモーダルを表示 / `embed`: Embedモーダルを表示、デフォルト: `text`） |

> 更新内容（`message` / `embed-title` / `embed-description` / `embed-color`）はコマンド実行後に表示される**モーダル**で入力します。

**権限**: `MANAGE_CHANNELS`

**実行例:**

```
# テキスト内容を変更
/sticky-message update channel:#rules
# → モーダルで新しいメッセージ内容を入力

# Embed形式に切り替えてタイトル・カラーを変更
/sticky-message update channel:#rules style:embed
# → Embed用モーダル（タイトル・説明・カラー）が表示される
```

**モーダルイメージ:**

_テキストモーダル（`style` 未指定または `style:text`）:_

<table border="1" cellpadding="8" width="420">
<tr><th align="left">メッセージ内容</th></tr>
<tr><td><i>改行して複数行入力できます（最大2000文字）</i><br><br><br><br></td></tr>
<tr><td align="center"><kbd>　送信する　</kbd></td></tr>
</table>

_Embed モーダル（`style:embed`）:_

<table border="1" cellpadding="8" width="420">
<tr><th align="left">タイトル</th></tr>
<tr><td><i>Embed のタイトルを入力（最大256文字）</i></td></tr>
<tr><th align="left">カラーコード（任意）</th></tr>
<tr><td><i>#008969 または 0x008969 形式で入力（省略時: #008969）</i></td></tr>
<tr><th align="left">内容</th></tr>
<tr><td><i>Embed の内容を入力（最大4096文字）</i><br><br><br></td></tr>
<tr><td align="center"><kbd>　送信する　</kbd></td></tr>
</table>

**処理:**

1. 権限チェック（`MANAGE_CHANNELS` または `ADMINISTRATOR`）
2. データベースから該当チャンネルのスティッキーメッセージを取得
3. 指定されたオプションで内容を更新（未指定は既存値を引き継ぎ）
4. チャンネルの旧スティッキーメッセージを削除
5. 新しい内容でメッセージをチャンネルに送信
6. データベースの `last_message_id` を更新
7. 更新完了メッセージを Ephemeral で返信

**エラーケース:**

| 状況             | メッセージ                                                         |
| ---------------- | ------------------------------------------------------------------ |
| 権限不足         | この操作を実行する権限がありません。チャンネル管理権限が必要です。 |
| 設定なし         | このチャンネルにはスティッキーメッセージが設定されていません。     |
| オプション未指定 | メッセージ内容を入力してください。                                 |

---

### `/sticky-message view`

**説明**: このサーバーで設定中のスティッキーメッセージをセレクトメニューで確認

一覧表示と詳細確認を兼ねます。オプションなしで実行すると、設定済みのすべてのチャンネルがセレクトメニューに表示されます。チャンネルを選択するとその設定詳細が Embed で表示されます。

**オプション**: なし

**権限**: `MANAGE_CHANNELS`

**実行例:**

```
/sticky-message view
```

**UXフロー:**

```
1. /sticky-message view を実行
   ↓
2. 設定済みチャンネルの一覧をセレクトメニューで表示（Ephemeral）
```

例:

<table border="1" cellpadding="6" width="320">
<tr><th align="left">📋 確認するチャンネルを選択</th></tr>
<tr><td>▶ #rules<br>&nbsp;&nbsp;#announcements<br>&nbsp;&nbsp;#general</td></tr>
</table>

```
   ↓
3. チャンネルを選択すると、そのチャンネルの設定内容を Embed で表示
   （同じメッセージを上書き編集）
```

**表示例（チャンネル選択後）:**

```
スティッキーメッセージ設定

チャンネル    : #rules
形式          : Embed
設定日時      : 2026年2月22日 10:30
最終更新者    : @username

メッセージ内容
───────────────────────────
このチャンネルではルールを守ってください
───────────────────────────

Embedタイトル : サーバールール
Embedカラー   : #008969
```

> `最終更新者` は `<@userId>` メンション形式で表示（設定者が不明な場合は表示しない）。

**処理:**

1. 権限チェック（`MANAGE_CHANNELS` または `ADMINISTRATOR`）
2. データベースから現在のギルドのすべてのスティッキーメッセージを取得
3. チャンネル名と ID のセレクトメニューを生成して Ephemeral で返信
4. チャンネル選択時（`interactionCreate` の `StringSelectMenu` イベント）
   - 選択されたチャンネルの設定をデータベースから取得
   - Embed で設定詳細を組み立て、同じメッセージを `update()` で上書き

**エラーケース:**

| 状況     | メッセージ                                                         |
| -------- | ------------------------------------------------------------------ |
| 権限不足 | この操作を実行する権限がありません。チャンネル管理権限が必要です。 |
| 設定なし | スティッキーメッセージは設定されていません。                       |

---

## 🔄 自動再送信ロジック

### messageCreate イベントでの処理

**トリガー**: ユーザーがメッセージを送信

**処理フロー:**

```
1. メッセージ送信イベント検知
   ↓
2. Bot自身のメッセージは無視
   ↓
3. ギルド外・テキストチャンネル以外は無視
   ↓
4. データベースから該当チャンネルのスティッキーメッセージ設定を取得
   ↓
5. スティッキーメッセージが設定されていない場合は終了
   ↓
6. チャンネルIDごとのデバウンスタイマーをリセット（5秒）
   ↓
7. 5秒後に再送信を実行
   ├─ 前回のスティッキーメッセージを削除（last_message_id を使用）
   ├─ 新しいスティッキーメッセージを送信
   └─ データベースの last_message_id を更新
```

**最適化:**

- **デバウンス再送信**: チャンネルへの投稿が連続した場合は最後の投稿から5秒後に1回だけ再送信（タイマーをリセットしながら待機）
- **削除失敗時の対応**: 前回のメッセージが既に削除されている場合はエラーを無視して新しいメッセージを送信
- **権限不足時の対応**: メッセージ送信権限がない場合はエラーログを記録し処理を終了

**疑似コード:**

```typescript
async function handleMessageCreate(message: Message) {
  // Bot自身・ギルド外・テキストチャンネル以外は無視
  if (message.author.bot) return;
  if (!message.guildId) return;
  if (message.channel.type !== ChannelType.GuildText) return;

  // チャンネルごとのデバウンスタイマー
  const existing = resendTimers.get(message.channelId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    resendTimers.delete(message.channelId);

    const sticky = await repository.findByChannel(message.channelId);
    if (!sticky) return;

    // 前回のメッセージを削除（失敗は無視）
    if (sticky.lastMessageId) {
      try {
        await message.channel.messages.delete(sticky.lastMessageId);
      } catch {
        logger.warn("Previous sticky message already deleted");
      }
    }

    // 新しいメッセージを送信
    try {
      const sent = await message.channel.send(buildPayload(sticky));
      await repository.updateLastMessageId(sticky.id, sent.id);
    } catch (err) {
      logger.error("Failed to send sticky message", err);
    }
  }, 5000);

  resendTimers.set(message.channelId, timer);
}
```

---

## 📊 データベース設計

### StickyMessage テーブル

| カラム名          | 型       | 説明                               | 制約             |
| ----------------- | -------- | ---------------------------------- | ---------------- |
| `id`              | String   | プライマリキー（cuid）             | PRIMARY KEY      |
| `guild_id`        | String   | ギルドID                           | NOT NULL, INDEX  |
| `channel_id`      | String   | チャンネルID                       | NOT NULL, UNIQUE |
| `content`         | String   | メッセージ内容（プレーンテキスト） | NOT NULL         |
| `embed_data`      | String?  | Embedデータ（JSON 文字列）         | NULLABLE         |
| `updated_by`      | String?  | 最後に更新したユーザーID           | NULLABLE         |
| `last_message_id` | String?  | 最後に送信したメッセージID         | NULLABLE         |
| `created_at`      | DateTime | 作成日時                           | DEFAULT NOW()    |
| `updated_at`      | DateTime | 更新日時                           | AUTO UPDATE      |

**embed_data の JSON スキーマ:**

```typescript
interface StickyEmbedData {
  title?: string; // Embed タイトル（最大256文字）
  description?: string; // Embed 説明文（最大4096文字）
  color?: number; // カラーコード（数値）
}
```

**Prisma Schema:**

```prisma
model StickyMessage {
  id            String   @id @default(cuid())
  guildId       String   @map("guild_id")
  channelId     String   @unique @map("channel_id")
  content       String
  embedData     String?  @map("embed_data")
  updatedBy     String?  @map("updated_by")
  lastMessageId String?  @map("last_message_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([guildId])
  @@map("sticky_messages")
}
```

---

## 🎨 メッセージフォーマット

### プレーンテキスト形式

```
このチャンネルではルールを守ってください
```

### Embed形式

<table border="1" cellpadding="8" width="360">
<tr><th align="left">📌 サーバールール</th></tr>
<tr><td>
1. 暴言・誹謗中傷は禁止です<br>
2. スパム行為は禁止です<br>
3. 他人のプライバシーを尊重してください<br>
<br>
違反した場合は警告・BANの対象となります。
</td></tr>
</table>

**カラー:**

- デフォルト: `0x008969`
- カスタム: ユーザーが指定可能（`#RRGGBB` または `0xRRGGBB` 形式）

---

## 🛡️ セキュリティ・権限管理

### 必要な権限

**コマンド実行者（両コマンド共通）:**

- `MANAGE_CHANNELS` または `ADMINISTRATOR`

**Bot:**

- `SEND_MESSAGES` - スティッキーメッセージ送信
- `MANAGE_MESSAGES` - 前のスティッキーメッセージ削除
- `EMBED_LINKS` - Embed 形式のメッセージ送信（Embed 使用時のみ）

### 権限チェック

```typescript
function hasPermission(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}
```

---

## 🌐 多言語対応（i18next）

### ローカライゼーションキー

```typescript
// /sticky-message コマンド（全サブコマンド共通）
"sticky-message.description": "スティッキーメッセージ（チャンネル最下部固定）の管理（チャンネル管理者専用）"

// set（スラッシュオプション）
"sticky-message.set.description": "スティッキーメッセージを設定"
"sticky-message.set.channel.description": "スティッキーメッセージを設定するテキストチャンネル"
"sticky-message.set.style.description": "表示形式（text: テキスト / embed: Embed）"
// set（プレーンテキストモーダル）
"sticky-message.set.modal.title": "スティッキーメッセージの内容を入力"
"sticky-message.set.modal.message.label": "メッセージ内容"
"sticky-message.set.modal.message.placeholder": ...
// set（Embedモーダル）
"sticky-message.set.embed-modal.title": "Embed スティッキーメッセージを設定"
"sticky-message.set.embed-modal.embed-title.label": "タイトル"
"sticky-message.set.embed-modal.embed-title.placeholder": ...
"sticky-message.set.embed-modal.embed-description.label": "説明文"
"sticky-message.set.embed-modal.embed-description.placeholder": ...
"sticky-message.set.embed-modal.embed-color.label": "カラーコード"
"sticky-message.set.embed-modal.embed-color.placeholder": ...
// set（応答メッセージ）
"sticky-message.set.success.title": "設定完了"
"sticky-message.set.success.description": "スティッキーメッセージを設定しました。"
"sticky-message.set.alreadyExists.title": "警告"
"sticky-message.set.alreadyExists.description": "既にスティッキーメッセージが設定されています。削除してから再度設定してください。"

// remove
"sticky-message.remove.description": "スティッキーメッセージを削除"
"sticky-message.remove.select.placeholder": "削除するチャンネルを選択（複数選択可）"
"sticky-message.remove.button.label": "削除する"
"sticky-message.remove.success.title": "削除完了"
"sticky-message.remove.success.description": "{{count}}件のスティッキーメッセージを削除しました。"
"sticky-message.remove.success.channels": "削除したチャンネル: {{channels}}"
"sticky-message.remove.notFound.title": "未設定"
"sticky-message.remove.notFound.description": "スティッキーメッセージは設定されていません。"

// update（スラッシュオプション）
"sticky-message.update.description": "スティッキーメッセージの内容を更新"
"sticky-message.update.channel.description": "更新対象のチャンネル"
"sticky-message.update.style.description": "表示形式（text: テキスト / embed: Embed）"
// update（プレーンテキストモーダル）
"sticky-message.update.modal.title": "スティッキーメッセージを更新"
"sticky-message.update.modal.message.label": "メッセージ内容"
"sticky-message.update.modal.message.placeholder": ...
// update（Embedモーダル）
"sticky-message.update.embed-modal.title": ...
// update（応答メッセージ）
"sticky-message.update.success.title": "更新完了"
"sticky-message.update.success.description": "スティッキーメッセージを更新しました。"
"sticky-message.update.notFound.title": "未設定"
"sticky-message.update.notFound.description": "このチャンネルにはスティッキーメッセージが設定されていません。"

// view
"sticky-message.view.description": "セレクトメニューでチャンネルを選んで設定内容を確認"
"sticky-message.view.select.placeholder": "確認するチャンネルを選択"
"sticky-message.view.title": "スティッキーメッセージ設定"
"sticky-message.view.notFound.title": "未設定"
"sticky-message.view.field.channel": "チャンネル"
"sticky-message.view.field.format": "形式"
"sticky-message.view.field.format_plain": "プレーンテキスト"
"sticky-message.view.field.format_embed": "Embed"
"sticky-message.view.field.updated_at": "設定日時"
"sticky-message.view.field.content": "メッセージ内容"
"sticky-message.view.field.embed_title": "Embedタイトル"
"sticky-message.view.field.embed_color": "Embedカラー"
"sticky-message.view.field.updated_by": "最終更新者"

// エラー共通
"sticky-message.errors.permissionDenied": "この操作を実行する権限がありません。チャンネル管理権限が必要です。"
"sticky-message.errors.emptyMessage": "メッセージ内容を入力してください。"
"sticky-message.errors.text_channel_only": "テキストチャンネルにのみ設定できます。"
"sticky-message.errors.failed": "スティッキーメッセージの操作中にエラーが発生しました。"
```

---

## 🚨 エラーハンドリング

### 想定されるエラー

1. **権限不足**

   ```
   ❌ この操作を実行する権限がありません。チャンネル管理権限が必要です。
   ```

2. **Bot 権限不足**

   ```
   ❌ Botにメッセージ送信権限がありません。
   ```

3. **メッセージが空**

   ```
   ⚠️ メッセージ内容を入力してください。
   ```

4. **スティッキーメッセージが既に設定済み**（`/sticky-message set`）

   ```
   ⚠️ 既にスティッキーメッセージが設定されています。
   削除してから再度設定してください。
   ```

5. **スティッキーメッセージが未設定**（`/sticky-message remove` / `update` / `view`のチャンネル選択後）

   ```
   ℹ️ このチャンネルにはスティッキーメッセージが設定されていません。
   ```

6. **チャンネルが削除された**
   - スティッキーメッセージの再送信をスキップ
   - エラーログを記録

---

## ✅ テストケース

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

### ユニットテスト

#### `/sticky-message` コマンド

1. **set**
   - 正常系: スティッキーメッセージ設定成功（プレーンテキスト）
   - 正常系: スティッキーメッセージ設定成功（Embed形式）
   - 異常系: 権限不足でエラー
   - 異常系: 既に設定済みで警告
   - 異常系: メッセージが空でエラー
   - 異常系: テキストチャンネル以外でエラー

2. **remove**
   - 正常系: 設定済みチャンネルのセレクトメニュー（複数選択可）が表示される
   - 正常系: 1チャンネル選択で削除成功（Discord側メッセージも削除）
   - 正常系: 複数チャンネル選択で一括削除成功
   - 正常系: Discord側メッセージが既に削除済みでも DB から削除成功
   - 異常系: 権限不足でエラー
   - 異常系: 設定が存在しない場合（セレクトメニューが表示されない）

3. **update**
   - 正常系: テキスト内容の更新（旧メッセージ削除・新送信）
   - 正常系: Embed タイトルのみ更新（他フィールドは引き継ぎ）
   - 正常系: プレーンテキストから Embed 形式へ切り替え
   - 異常系: 権限不足でエラー
   - 異常系: 設定なしの場合
   - 異常系: オプション未指定でエラー

4. **view**
   - 正常系: 設定済みチャンネルのセレクトメニューが表示される
   - 正常系: チャンネル選択後にプレーンテキスト設定の詳細が表示される
   - 正常系: チャンネル選択後に Embed 設定の詳細が表示される（タイトル・カラーも含む）
   - 正常系: 別チャンネルを再選択すると Embed が切り替わる
   - 異常系: 権限不足でエラー
   - 異常系: 設定なしでセレクトメニューが表示されない（空メッセージ）

#### 自動再送信

5. **messageCreate ハンドラ**
   - 正常系: メッセージ投稿後 5 秒のデバウンスで再送信
   - 正常系: 連続投稿時はタイマーがリセットされ最後の投稿から 5 秒後に1回だけ再送信
   - 正常系: 前回のスティッキーメッセージが削除される
   - 異常系: Bot 自身のメッセージは無視される
   - 異常系: 前回のメッセージが既に削除済みの場合でも再送信される
   - 異常系: スティッキーメッセージ未設定チャンネルは何もしない

### インテグレーションテスト

1. **データベース連携テスト**
   - スティッキーメッセージの保存・取得・削除
   - `updateContent()` による内容更新
   - `updateLastMessageId()` の更新

---

## ✅ 実装状況（2026-02-22 時点）

| 項目                              | 状態    | 備考                                                                                            |
| --------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `/sticky-message set` コマンド    | ✅ 完了 | プレーンテキスト／Embed 両対応、モーダル入力                                                    |
| `/sticky-message remove` コマンド | ✅ 完了 | Discord 側メッセージ削除 + DB 削除                                                              |
| `/sticky-message update` コマンド | ✅ 完了 | 差分更新（未指定フィールドは既存値引き継ぎ）                                                    |
| `/sticky-message view` コマンド   | ✅ 完了 | セレクトメニュー + Embed 詳細表示                                                               |
| 自動再送信（messageCreate）       | ✅ 完了 | デバウンス 5 秒、`StickyMessageResendService`                                                   |
| チャンネル削除時クリーンアップ    | ✅ 完了 | `channelDelete` → DB レコード削除 + タイマーキャンセル                                          |
| `updatedBy` フィールド追跡        | ✅ 完了 | 設定・更新時に操作ユーザー ID を保存し view で `<@userId>` 表示                                 |
| DB アクセス shared 層経由         | ✅ 完了 | `StickyMessageConfigService` （`shared/features/sticky-message/` 経由に統一、commit `1c197d4`） |
| 多言語対応（i18n）                | ✅ 完了 | `ja` / `en` 翻訳キー実装済み                                                                    |
| ユニットテスト                    | ✅ 完了 | 188 test suites / 821 tests 全件 PASS                                                           |
| インテグレーションテスト          | ✅ 完了 | リポジトリ DB 連携テスト実装済み                                                                |

### アーキテクチャ補足

```
src/shared/database/types.ts          ← StickyMessage エンティティ / IStickyMessageRepository
src/shared/features/sticky-message/
  └─ stickyMessageConfigService.ts    ← StickyMessageConfigService（thin wrapper）
src/bot/features/sticky-message/
  ├─ repositories/
  │   └─ stickyMessageRepository.ts  ← IStickyMessageRepository 実装
  ├─ services/
  │   └─ stickyMessageResendService.ts
  ├─ handlers/
  │   ├─ stickyMessageChannelDeleteHandler.ts
  │   └─ ui/ （set/update/view のモーダル・セレクトハンドラ）
  └─ commands/usecases/
      └─ stickyMessageSet/Remove/Update/View.ts
src/bot/services/
  ├─ botStickyMessageDependencyResolver.ts ← getBotStickyMessageConfigService()
  └─ botCompositionRoot.ts               ← DI 組み立て
```

---

## 関連ドキュメント

- [MESSAGE_RESPONSE_SPEC.md](MESSAGE_RESPONSE_SPEC.md): メッセージレスポンス統一仕様
- [VAC_SPEC.md](VAC_SPEC.md): VC自動作成機能仕様
- [AFK_SPEC.md](AFK_SPEC.md): AFK機能仕様
- [Discord.js - TextChannel](https://discord.js.org/#/docs/discord.js/main/class/TextChannel)
- [Discord.js - EmbedBuilder](https://discord.js.org/#/docs/discord.js/main/class/EmbedBuilder)
