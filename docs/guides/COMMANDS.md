# コマンドリファレンス

> Bot Commands Reference - スラッシュコマンドの完全リファレンス

最終更新: 2026年3月15日（VC募集 add-role/remove-role 複数選択対応、sticky-message remove 複数選択対応）

---

## 📋 概要

### 目的

ayasonoで使用可能なすべてのスラッシュコマンドの詳細リファレンスです。各コマンドの構文、オプション、使用例、必要な権限を記載しています。

### コマンド一覧

| コマンド                | 説明                                         | 権限           | 状態        |
| ----------------------- | -------------------------------------------- | -------------- | ----------- |
| `/ping`                 | Bot疎通確認                                  | なし           | ✅ 実装済み |
| `/afk`                  | ユーザーをAFKチャンネルに移動                | なし           | ✅ 実装済み |
| `/afk-config`           | AFK機能の設定管理                            | サーバー管理   | ✅ 実装済み |
| `/bump-reminder-config` | Bumpリマインダー機能の設定管理               | サーバー管理   | ✅ 実装済み |
| `/vac-config`           | VC自動作成機能の設定管理                     | サーバー管理   | ✅ 実装済み |
| `/vac`                  | 作成済みVCの名前・人数制限を変更             | なし           | ✅ 実装済み |
| `/sticky-message`       | メッセージ固定機能の管理                     | チャンネル管理 | ✅ 実装済み |
| `/member-log-config`    | メンバーログ設定                             | サーバー管理   | ✅ 実装済み |
| `/message-delete`       | メッセージ一括削除（スキャン + 2段階確認）   | メッセージ管理 | ✅ 実装済み |
| `/vc-recruit-config`    | VC募集機能の設定管理                         | サーバー管理   | ✅ 実装済み |

---

## 🔧 基本コマンド

### `/ping`

Bot疎通確認コマンド。BotのレイテンシとAPIレスポンス時間を表示します。

**構文:**

```
/ping
```

**権限:** なし（全員使用可能）

**使用例:**

```
/ping
```

**レスポンス:**

```
🏓 Pong!
Botレイテンシ: 45ms
APIレイテンシ: 120ms
```

**関連ドキュメント:** なし

---

## 🎤 AFK機能

### `/afk`

指定したユーザー（または自分自身）をAFKチャンネルに移動します。

**構文:**

```
/afk [user]
```

**オプション:**

- `user` (オプション): 移動対象のユーザー
  - 未指定の場合は自分自身を移動

**権限:** なし（全員使用可能、AFK設定が有効な場合）

**使用例:**

```
# 自分をAFKチャンネルに移動
/afk

# 他のユーザーをAFKチャンネルに移動
/afk user:@Username
```

**エラーケース:**

- AFK機能が無効化されている
- AFKチャンネルが設定されていない
- 対象ユーザーがVCに参加していない
- AFKチャンネルが削除されている

**関連ドキュメント:** [AFK_SPEC.md](../specs/AFK_SPEC.md)

---

### `/afk-config`

AFK機能の設定を管理します。

**構文:**

```
/afk-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `set-channel`

AFKチャンネルを設定します。

```
/afk-config set-channel channel:<チャンネル>
```

**オプション:**

- `channel` (必須): AFKチャンネルとして設定するボイスチャンネル

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/afk-config set-channel channel:#AFK
```

---

#### `view`

現在のAFK設定を表示します。

```
/afk-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**表示内容:**

- 機能の有効/無効状態
- 設定されているAFKチャンネル

**関連ドキュメント:** [AFK_SPEC.md](../specs/AFK_SPEC.md)

---

## ⏰ Bumpリマインダー機能

### `/bump-reminder-config`

Disboard/ディス速のBump後の自動リマインダー機能を管理します。

**構文:**

```
/bump-reminder-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `enable`

Bumpリマインダー機能を有効化します。

```
/bump-reminder-config enable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**注意:** デフォルトで有効なため、通常は実行不要です。

---

#### `disable`

Bumpリマインダー機能を無効化します。

```
/bump-reminder-config disable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `set-mention`

Bumpリマインダー時にメンションするロールを設定します。

```
/bump-reminder-config set-mention role:<ロール>
```

**オプション:**

- `role` (必須): メンションするロール

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/bump-reminder-config set-mention role:@BumpRole
```

> **📝 注:** ユーザー個別の通知設定はBump検知時のパネルUIボタンから各自が行います。管理コマンドではロールのみ設定できます。

---

#### `remove-mention`

設定されているメンションロールを削除します。

```
/bump-reminder-config remove-mention
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `view`

現在のBumpリマインダー設定を表示します。

```
/bump-reminder-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**表示内容:**

- 機能の有効/無効状態
- 設定されているメンション（ロール/ユーザー）

**関連ドキュメント:** [BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md)

---

## 🎤 VC自動作成機能

### `/vac-config`

VC自動作成機能の設定を管理します。トリガーVCの追加・削除と現在の設定表示が可能です。

**構文:**

```
/vac-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `create-trigger-vc`

トリガーチャンネル（CreateVC）を新規作成します。このチャンネルに参加すると専用VCが自動作成されます。

```
/vac-config create-trigger-vc [category:<カテゴリ名>]
```

**オプション:**

- `category` (省略可): 作成先カテゴリ名（オートコンプリート対応）。省略時はカテゴリなしで作成

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
# カテゴリを指定して作成
/vac-config create-trigger-vc category:TOP
/vac-config create-trigger-vc category:カテゴリA

# カテゴリなしで作成
/vac-config create-trigger-vc
```

---

#### `remove-trigger-vc`

既存のトリガーチャンネルを削除します。

```
/vac-config remove-trigger-vc [category:<カテゴリ名>]
```

**オプション:**

- `category` (省略可): 削除対象のカテゴリ名（オートコンプリート対応）。省略時はトップレベルのトリガーVCを削除

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/vac-config remove-trigger-vc category:TOP
/vac-config remove-trigger-vc category:カテゴリA
/vac-config remove-trigger-vc
```

---

#### `view`

現在のVC自動作成機能の設定（有効化状態・トリガーチャンネル一覧）を表示します。

```
/vac-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**関連ドキュメント:** [VAC_SPEC.md](../specs/VAC_SPEC.md)

---

### `/vac`

自分が参加している自動作成VCの設定を変更します。

**構文:**

```
/vac <サブコマンド> [オプション]
```

**権限:** なし（VC参加中のユーザーのみ実行可能）

**サブコマンド:**

#### `vc-rename`

自分のVCの名前を変更します。

```
/vac vc-rename name:<新しい名前>
```

**オプション:**

- `name` (必須): 新しいVC名（最大100文字）

**使用例:**

```
/vac vc-rename name:みんなのたまり場
```

---

#### `vc-limit`

自分のVCの人数制限を変更します。

```
/vac vc-limit limit:<人数>
```

**オプション:**

- `limit` (必須): 人数制限（0=無制限、1〜99）

**使用例:**

```
# 5人制限に設定
/vac vc-limit limit:5

# 無制限に設定
/vac vc-limit limit:0
```

**関連ドキュメント:** [VAC_SPEC.md](../specs/VAC_SPEC.md)

---

## 📌 メッセージ固定機能

### `/sticky-message`

チャンネル最下部に常に表示されるメッセージを設定・削除・更新・確認するコマンドです。プレーンテキスト・ Embed 両形式対応。

**構文:**

```
/sticky-message <サブコマンド> [オプション]
```

**サブコマンド:**

#### `set`

スティッキーメッセージを設定します。コマンド実行後にモーダルポップアップで内容を入力します。

```
/sticky-message set [channel:<チャンネル>] [style:<text|embed>]
```

**オプション:**

- `channel` (任意): スティッキーメッセージを設定するテキストチャンネル（省略時はコマンド実行チャンネル）
- `style` (任意): 表示スタイル— `text`（デフォルト）または `embed`

> メッセージ内容（テキスト / Embed タイトル・説明・カラー）はコマンド実行後に表示される**モーダル**で入力します。

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

**使用例:**

```
# プレーンテキスト（style 未指定）
/sticky-message set channel:#rules

# Embed形式
/sticky-message set channel:#rules style:embed
```

---

#### `remove`

スティッキーメッセージを削除します。コマンド実行後に設定済みチャンネルのセレクトメニュー（複数選択可）と削除ボタンがエフェメラルで表示されます。Discord 上のメッセージも同時に削除されます。

```
/sticky-message remove
```

**操作手順:**

1. コマンドを実行すると、設定済みチャンネルのセレクトメニュー + 「🗑️ 削除する」ボタンが表示される
2. 削除したいチャンネルを1つ以上選択する
3. 「🗑️ 削除する」ボタンを押して確定

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

---

#### `update`

既存のスティッキーメッセージの内容を上書き更新します。旧メッセージを削除し新しい内容で即時再送信します。

```
/sticky-message update [channel:<チャンネル>] [style:<text|embed>]
```

**オプション:**

- `channel` (任意): 更新対象のチャンネル（省略時はコマンド実行チャンネル）
- `style` (任意): 表示スタイル— `text`（デフォルト）または `embed`

> 更新内容はコマンド実行後に表示される**モーダル**で入力します。`style` を切り替えることでテキスト↔Embed間の変更も可能です。

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

**使用例:**

```
# テキスト内容を変更する
/sticky-message update channel:#rules

# Embed形式に切り替えてタイトル・内容を変更する
/sticky-message update channel:#rules style:embed
```

---

#### `view`

このサーバーで設定中のスティッキーメッセージを確認します。セレクトメニューでチャンネルを選ぶとその設定詳細が Embed で表示されます。

```
/sticky-message view
```

**権限:** チャンネル管理（`MANAGE_CHANNELS`）

**関連ドキュメント:** [STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md)

---

## 👥 メンバーログ機能

### `/member-log-config`

メンバーの参加・脱退を指定チャンネルに記録する機能を管理します。

**構文:**

```
/member-log-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `enable`

メンバーログ機能を有効化します。

```
/member-log-config enable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `disable`

メンバーログ機能を無効化します。

```
/member-log-config disable
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `set-channel`

ログを送信するチャンネルを設定します。

```
/member-log-config set-channel channel:<チャンネル>
```

**オプション:**

- `channel` (必須): ログを送信するテキストチャンネル

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/member-log-config set-channel channel:#welcome-log
```

---

#### `set-join-message`

メンバー参加時に Embed の上に表示するカスタムテキストメッセージを設定します。コマンド実行後にモーダルが表示され、**複数行のテキスト**を入力できます。

```
/member-log-config set-join-message
```

**プレースホルダー:**

| プレースホルダー | 内容               |
| ---------------- | ------------------ |
| `{userMention}`  | ユーザーメンション |
| `{userName}`     | ユーザー名         |
| `{count}`        | 現在のメンバー数   |

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `set-leave-message`

メンバー退出時に Embed の上に表示するカスタムテキストメッセージを設定します。コマンド実行後にモーダルが表示され、**複数行のテキスト**を入力できます。

```
/member-log-config set-leave-message
```

プレースホルダーは `set-join-message` と同じものが使用可能です。

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `clear-join-message`

設定済みのカスタム参加メッセージを削除します。

```
/member-log-config clear-join-message
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `clear-leave-message`

設定済みのカスタム退出メッセージを削除します。

```
/member-log-config clear-leave-message
```

**権限:** サーバー管理（`MANAGE_GUILD`）

---

#### `view`

現在の設定を表示します。

```
/member-log-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**関連ドキュメント:** [MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md)

---

## 🗑️ メッセージ削除機能

### `/message-delete`

サーバー内のメッセージを一括削除します。条件設定 → スキャン → プレビュー → 最終確認 → 削除の流れで安全に実行できます。

**構文:**

```
/message-delete [count] [keyword] [days] [after] [before]
```

**コマンドオプション:**

- `count` (オプション): 削除件数の上限（1〜1000）。未指定時は最新1000件を上限として削除
- `keyword` (オプション): 指定キーワードを本文に含むメッセージのみ対象（大文字小文字を区別しない）
- `days` (オプション): 過去N日以内（1〜366）。`after` / `before` との同時指定不可
- `after` (オプション): この日時以降のメッセージのみ対象（形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`）
- `before` (オプション): この日時以前のメッセージのみ対象（形式: `YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS`）

**条件設定ステップ（コマンド実行後に表示）:**

コマンド実行後、対象ユーザーと対象チャンネルを選択する条件設定画面がエフェメラルで表示されます。

| UI 要素                | 説明                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| ユーザー選択メニュー   | 削除対象のユーザーを選択（最大25人、複数選択可）。未選択で全ユーザー |
| チャンネル選択メニュー | 対象チャンネルを選択（最大25個、複数選択可）。未選択でサーバー全体   |
| 📩 Webhook ID を入力   | Webhook のメッセージを削除したい場合にモーダルから ID を入力         |
| 🔍 スキャン開始        | 条件を確定してスキャンを開始                                         |
| ❌ キャンセル          | 操作を中止                                                           |

**権限:** メッセージ管理（`MANAGE_MESSAGES`）

**実行フロー:**

1. **条件設定** — ユーザー・チャンネルをセレクトメニューで選択（3分タイムアウト）
2. **Phase 1 スキャン** — 全チャンネルを横断してフィルター条件に一致するメッセージをスキャン（リアルタイム進捗表示）
3. **Phase 2 プレビュー** — 一致したメッセージを5件/ページで一覧表示（ページネーション・フィルター・除外操作付き）
4. **Phase 3 最終確認** — `⚠️ この操作は取り消せません` を確認してから実行
5. **Phase 4 削除実行** — リアルタイムで削除進捗を表示し、完了メッセージを送信

**使用例:**

```
# キーワードで絞り込み → 条件設定でチャンネルを選択
/message-delete keyword:スパム

# 最新30件を収集 → 条件設定でチャンネル・ユーザーを選択
/message-delete count:30

# 過去7日間のメッセージ → 条件設定でユーザーを選択
/message-delete days:7

# 日付範囲を指定 → 条件設定でユーザーを選択
/message-delete after:2026-01-01 before:2026-01-31
```

**注意事項:**

- コマンドオプション（`count`・`keyword`・`days`・`after`・`before`）と条件設定ステップ（ユーザー選択）を合わせて、最低1つのフィルター条件を指定する必要があります（`channel` のみの指定は不可）
- 14日以上前のメッセージは個別削除となり時間がかかります
- 同一サーバーで同時に複数の削除操作は実行できません（処理中ロック）
- 確認ダイアログはスキップできません（不可逆操作のため）

**エラーケース:**

- フィルター条件が未指定
- 権限不足（`MANAGE_MESSAGES`）
- 削除可能なメッセージが見つからない
- 別の削除操作が実行中

**関連ドキュメント:** [MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md)

---

## 🎵 VC募集機能

### `/vc-recruit-config`

VC募集機能の設定を管理します。

**構文:**

```
/vc-recruit-config <サブコマンド> [オプション]
```

**サブコマンド:**

#### `setup`

指定カテゴリー（または TOP レベル）にパネルチャンネル・投稿チャンネルの2セットを自動作成します。

```
/vc-recruit-config setup [category:<カテゴリー名>] [thread-archive:<1h|24h|3d|1w>]
```

**オプション:**

- `category` (省略可): 作成先カテゴリー名（`TOP` またはカテゴリー名、省略時は実行チャンネルのカテゴリー）
- `thread-archive` (省略可): 募集スレッドの自動アーカイブ時間。`1h` / `24h` / `3d` / `1w`（デフォルト: `24h`）

**権限:** サーバー管理（`MANAGE_GUILD`）

**使用例:**

```
/vc-recruit-config setup category:TOP
/vc-recruit-config setup category:ゲームカテゴリー
/vc-recruit-config setup
```

---

#### `teardown`

セットアップ済みのVC募集チャンネルセットを選択して削除します。オプション引数はなく、セレクトメニューで対象カテゴリーを選択します。

```
/vc-recruit-config teardown
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**操作手順:**

1. コマンドを実行すると、セットアップ済みカテゴリーのセレクトメニュー（複数選択可）が表示される
2. 撤去したいカテゴリーを選択して確定
3. 確認パネルで「🗑️ 撤去する」「選び直す」「キャンセル」から選択

---

#### `add-role`

メンション候補にロールを追加します。コマンド実行後にロールセレクトメニュー（複数選択可）と確認ボタンがエフェメラルで表示されます。

```
/vc-recruit-config add-role
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**操作手順:**

1. コマンドを実行すると、ロールセレクトメニュー + 「✅ 追加する」「❌ キャンセル」ボタンが表示される
2. 追加したいロールを1つ以上選択する（最大25件）
3. 「✅ 追加する」ボタンを押して確定

> タイムアウト: 3分。期限切れ後はセレクトメニュー・ボタンが無効化されます。

**成功時の応答:** 登録したロールを `, ` 区切りで Embed 表示します。上限超過で追加できなかったロールがある場合は別途エラー Embed で表示されます。

---

#### `remove-role`

メンション候補からロールを削除します。コマンド実行後に登録済みロールのセレクトメニュー（複数選択可）と確認ボタンがエフェメラルで表示されます。

```
/vc-recruit-config remove-role
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**操作手順:**

1. コマンドを実行すると、登録済みロールのセレクトメニュー + 「🗑️ 削除する」「❌ キャンセル」ボタンが表示される
2. 削除したいロールを1つ以上選択する
3. 「🗑️ 削除する」ボタンを押して確定

> 登録済みロールがない場合はエラーメッセージが表示されます。

> タイムアウト: 3分。期限切れ後はセレクトメニュー・ボタンが無効化されます。

**成功時の応答:** 削除したロールを `, ` 区切りで Embed 表示します。

---

#### `view`

現在のVC募集設定を表示します。セットアップ済みカテゴリーおよびメンション候補ロール一覧が表示されます。

```
/vc-recruit-config view
```

**権限:** サーバー管理（`MANAGE_GUILD`）

**関連ドキュメント:** [VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md)

---

## 🔒 権限について

### 権限レベル

| 権限               | 説明                     | 必要なDiscord権限 |
| ------------------ | ------------------------ | ----------------- |
| **なし**           | 全メンバーが使用可能     | -                 |
| **チャンネル管理** | チャンネル管理権限が必要 | `MANAGE_CHANNELS` |
| **メッセージ管理** | メッセージ管理権限が必要 | `MANAGE_MESSAGES` |
| **サーバー管理**   | サーバー管理権限が必要   | `MANAGE_GUILD`    |

### Bot権限

Botが正常に動作するために必要な権限：

- `ViewChannel` - チャンネルの閲覧
- `SendMessages` - メッセージの送信
- `EmbedLinks` - Embedメッセージの送信
- `ManageMessages` - メッセージの削除（一括削除機能）
- `ManageChannels` - チャンネルの作成・削除（VC自動作成機能）
- `MoveMembers` - メンバーの移動（AFK機能）
- `ReadMessageHistory` - メッセージ履歴の閲覧

---

## 🌐 多言語対応

すべてのコマンドは多言語対応しており、サーバーごとに日本語または英語を設定可能です。

**ロケール設定:**

- デフォルト: 日本語（ja）
- サポート言語: 日本語（ja）、英語（en）

詳細は [I18N_GUIDE.md](I18N_GUIDE.md) を参照してください。

---

## 🔗 関連ドキュメント

### 仕様書

- [AFK_SPEC.md](../specs/AFK_SPEC.md) - AFK機能仕様
- [BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md) - Bumpリマインダー機能仕様
- [VAC_SPEC.md](../specs/VAC_SPEC.md) - VC自動作成機能仕様
- [STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md) - メッセージ固定機能仕様
- [MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md) - メンバー参加・脱退ログ機能仕様
- [MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md) - メッセージ削除コマンド仕様
- [VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md) - VC募集機能仕様
- [GUILD_CONFIG_SPEC.md](../specs/GUILD_CONFIG_SPEC.md) - ギルド設定機能仕様
- [BASIC_COMMANDS_SPEC.md](../specs/BASIC_COMMANDS_SPEC.md) - 基本コマンド仕様

### ガイド

- [README.md](../README.md) - プロジェクト概要
- [TODO.md](../TODO.md) - 開発タスク一覧
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応ガイド
