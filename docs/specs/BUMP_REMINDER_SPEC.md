# Bumpリマインダー機能 - 仕様書

> Disboard・ディス速のBumpリマインダー機能の詳細仕様

最終更新: 2026年3月14日

---

## 📋 概要

DiscordサーバーのBump（宣伝）コマンドを検知し、2時間後にリマインダーを送信する機能です。

### 対応サービス

| サービス名             | コマンド | Bot ID               | URL                   |
| ---------------------- | -------- | -------------------- | --------------------- |
| **Disboard**           | `/bump`  | `302050872383242240` | https://disboard.org/ |
| **ディス速 (Dissoku)** | `/up`    | `761562078095867916` | https://dissoku.net/  |

### デフォルト動作

**Bumpリマインダー機能はデフォルトで有効です。**

- 新規サーバーでは初期状態で機能が有効化されています
- `/bump` または `/up` コマンドを検知すると自動でリマインダーが設定されます
- 無効化するには `/bump-reminder-config disable` を実行してください

---

## 🎯 主要機能

### 1. Bump検知

**messageCreateイベント**で以下を監視：

**検知条件:**

- メッセージの送信者がBumpBot（Disboard ID: `302050872383242240` or ディス速 ID: `761562078095867916`）
- `message.interaction?.commandName` が Disboard では `bump`、ディス速では `up` である
- Bumpリマインダー機能が有効化されている（デフォルトで有効）
- `channelId` が設定済みの場合は、設定チャンネル内での検知のみ有効
- `serviceName` として "Disboard" または "Dissoku" を記録

### 2. タイマー管理

**実装: JobScheduler（1回実行は setTimeout）+ DB永続化**

**JobSchedulerの動作:**

1. **データベースに保存**: BumpReminderテーブルに `pending` ステータスで保存

- guildId, channelId, messageId, panelMessageId, serviceName, scheduledAt, status

2. **1回実行ジョブを登録**: `setTimeout` ベースで指定時刻にタスクを実行
3. **実行後にステータス更新**: `sent` または `cancelled` に変更

**Bot再起動時の復元:**

- クライアント起動時（clientReady）に `pending` ステータスのリマインダーを取得
- 各リマインダーのタイマーを再設定
- 既に時刻を過ぎている場合は即座に実行

### 3. 通知登録UI

**パネルメッセージ:**

<table border="1" cellpadding="8" width="420">
<tr><th align="left">ℹ️ Bumpリマインダー機能</th></tr>
<tr><td>
54分後にリマインドが通知されます。<br>
（Discordの相対タイムスタンプ形式で表示）
</td></tr>
<tr><td><kbd>🔔 ユーザー通知をONにする</kbd> <kbd>🔕 ユーザー通知をOFFにする</kbd></td></tr>
</table>

**機能:**

**ボタンのカスタムID:**

| 操作 | customId プレフィックス |
| --- | --- |
| ユーザー通知をONにする | `bump-reminder:mention-on:<guildId>` |
| ユーザー通知をOFFにする | `bump-reminder:mention-off:<guildId>` |

- `🔔 ユーザー通知をONにする`: ユーザーのBump通知を有効化（冪等）
  - 未登録 → 登録（エフェメラル返答:「通知をONにしました。」）
  - 登録済み → 何もせず成功扱い（エフェメラル返答:「通知をONにしました。」）
- `🔕 ユーザー通知をOFFにする`: ユーザーのBump通知を無効化（冪等）
  - 登録済み → 解除（エフェメラル返答:「通知をOFFにしました。」）
  - 未登録 → 何もせず成功扱い（エフェメラル返答:「通知をOFFにしました。」）

**パネルのライフサイクル:**

- パネルメッセージは**常設**（リマインダー送信後も削除しない）
- 新しいBump検知時に前のパネルを削除し、新しいパネルを送信（常に1つだけ存在）
- ユーザーはいつでもボタンから通知ON/OFFを切り替え可能

### 4. リマインダー送信

**通知対象:**

1. 設定されたメンションロール（`mentionRoleId`）
2. 設定されたメンションユーザー（`mentionUserIds`）

**通知メッセージの特徴:**

- **サービス別メッセージ**: DisboardとDissokuで異なるメッセージ
- **設定の動的取得**: リマインダー送信時に最新の設定を取得（Bump検知後の設定変更も反映）

**メッセージ例:**

```
# メンションなしの場合
⏰ `/bump`が出来るようになったよ！

# メンションありの場合
@BumpRole @User1 @User2
⏰ `/bump`が出来るようになったよ！

# ディス速の場合
@BumpRole
⏰ `/up`が出来るようになったよ！
```

**ローカライゼーション:**

| 言語   | Disboard                            | Dissoku                           |
| ------ | ----------------------------------- | --------------------------------- |
| 日本語 | `⏰ /bump が出来るようになったよ！` | `⏰ /up が出来るようになったよ！` |
| 英語   | `⏰ /bump is ready!`                | `⏰ /up is ready!`                |

---

## ⚙️ 設定コマンド

### `/bump-reminder-config`

**必要権限**: `MANAGE_GUILD`（サーバー管理）

#### サブコマンド

**1. `enable` - 機能有効化**

```
/bump-reminder-config enable
```

- Bumpリマインダー機能を有効化（またはdisable後の再有効化）
- 既存のメンション設定は維持
- **注意**: デフォルトで有効なため、通常は実行不要です

**2. `disable` - 機能無効化**

```
/bump-reminder-config disable
```

- Bumpリマインダー機能を無効化
- 進行中のリマインダーもキャンセル（ステータスを `cancelled` に変更）

**3. `set-mention` - メンションロール設定**

```
# メンションロールを設定
/bump-reminder-config set-mention role:@BumpRole
```

- リマインダー送信時にメンションするロールを設定
- 指定したロールに設定（上書き）
- **注意**: ユーザー単位の通知登録はBump検知時のパネルUIボタンから行います

**4. `remove-mention` - メンションロール削除**

```
/bump-reminder-config remove-mention
```

- メンションロール設定を削除します

**5. `view` - 設定状態表示**

```
/bump-reminder-config view
```

**表示内容:**

_メンション対象が設定されている場合:_

<table border="1" cellpadding="8" width="420">
<tr><th align="left" colspan="2">Bumpリマインダー機能</th></tr>
<tr><td>状態</td><td>有効</td></tr>
<tr><td>メンションロール</td><td>@BumpRole</td></tr>
<tr><td>メンションユーザー</td><td>@User1, @User2, @User3</td></tr>
</table>

_メンション対象が設定されていない場合:_

<table border="1" cellpadding="8" width="420">
<tr><th align="left" colspan="2">Bumpリマインダー機能</th></tr>
<tr><td>状態</td><td>有効</td></tr>
<tr><td>メンションロール</td><td>なし</td></tr>
<tr><td>メンションユーザー</td><td>なし</td></tr>
</table>

**注意:**

- ユーザー個別のBump通知ON/OFFはパネルUIのボタンからのみ管理可能
- Bump検知時にパネルUIが表示され、ユーザーが自分でBump通知の受信を管理できます

---

## 💾 データベーススキーマ

### BumpReminder テーブル

リマインダーの永続化に独立したテーブルを使用：

| フィールド      | 型       | 説明                                              |
| --------------- | -------- | ------------------------------------------------- |
| `id`            | String   | レコードID（主キー）                              |
| `guildId`       | String   | ギルドID                                          |
| `channelId`     | String   | 通知先チャンネルID                                |
| `messageId`     | String?  | 元のBumpメッセージID（返信用）                    |
| `panelMessageId`| String?  | パネルメッセージID（新Bump検知時に旧パネル削除用） |
| `serviceName`   | String?  | サービス名（`Disboard` または `Dissoku`）          |
| `scheduledAt`   | DateTime | 通知予定時刻                                      |
| `status`        | String   | 状態（`pending` / `sent` / `cancelled`）          |

**ステータス管理:**

- `pending`: リマインダー待機中（Bot再起動時に復元対象）
- `sent`: リマインダー送信完了
- `cancelled`: キャンセル済み（disable コマンド実行時など）

### GuildBumpReminderConfig テーブル

Bumpリマインダーの設定情報：

| フィールド      | 型       | 説明                                              |
| --------------- | -------- | ------------------------------------------------- |
| `guildId`       | String   | ギルドID（主キー）                                |
| `enabled`       | Boolean  | 機能有効/無効（DBデフォルト: false、アプリデフォルト: true） |
| `channelId`     | String?  | Bump検知対象チャンネルID（未設定時は全チャンネルで検知） |
| `mentionRoleId` | String?  | メンションロールID                                |
| `mentionUserIds`| String[] | メンションユーザーIDリスト（JSON配列保存）        |

**重要な設計判断:**

- **BumpReminderテーブル**: リマインダーの実行状態を管理（1ギルド複数リマインダー可能、ただし実際は最後の1件のみ有効）
- **GuildBumpReminderConfigテーブル**: ギルド全体の設定（メンション対象など）
- リマインダー送信時に GuildBumpReminderConfig から最新の設定を取得することで、Bump検知後の設定変更も反映

---

## 🔄 処理フロー

### Bump検知から通知まで

```
1. ユーザーが /bump または /up を実行
   ↓
2. Disboard/ディス速がBump成功メッセージを送信
   ↓
3. messageCreateイベントで検知
  - Bot ID（302050872383242240 or 761562078095867916）を確認
  - `interaction.commandName` が Disboard なら `bump`、ディス速なら `up` か確認
   - serviceName を特定（"Disboard" or "Dissoku"）
   - GuildConfig の enabled を確認（デフォルト true）
  - channelId が設定されている場合は一致チャンネルのみ処理
   ↓
4. BumpReminderManager.setReminder() 実行
   - BumpReminderテーブルに保存（status: "pending"）
  - guildId, channelId, messageId, panelMessageId, serviceName, scheduledAt を記録
  - JobScheduler（setTimeoutベース）でタイマー設定
   ↓
5. 2時間経過
   - タイマー発火
   - taskFactory 実行:
     a. GuildConfig から最新の設定を取得（enabled, mentionRoleId, mentionUserIds）
     b. enabled が false なら送信せずに終了
     c. メンション文字列を構築
     d. serviceName に応じたメッセージを選択
     e. チャンネルにメッセージ送信（元メッセージに返信）
   - BumpReminderテーブルの status を "sent" に更新
```

**データベース更新タイミング:**

- **Bump検知時**: BumpReminder レコード作成（status: "pending"）
- **リマインダー送信後**: status を "sent" に更新
- **disable コマンド実行時**: 該当ギルドの pending レコードを "cancelled" に更新

**設定変更の即時反映:**

リマインダー送信時に最新の設定を取得するため、Bump検知後に設定変更しても送信内容に反映されます。

### Bot再起動時の復元

**実装場所**: `src/bot/events/clientReady.ts`

起動時に `pending` ステータスのリマインダーを全て取得し、以下を行います：

- 同一ギルドの重複pendingを最新1件へ整理
- 期限超過分を即時実行
- 未来分を再スケジュール

**復元の特徴:**

- **DB駆動**: メモリ上のタイマーは消失するが、DBの `pending` レコードから完全復元
- **過去時刻の処理**: Bot停止中に通知時刻を過ぎた場合でも即座に通知
- **serviceName保持**: Disboard/Dissoku のどちらか正しいメッセージを送信

---

## 🛡️ エラーハンドリング

### 実装済みのエラー処理

**1. チャンネルが削除された / 見つからない**

チャンネルが存在しない、またはテキスト送信不可の場合はリマインダー送信をスキップします。

**2. 機能が無効化されている**

送信直前に設定を再取得し、無効化されていた場合は送信せずに終了します。

**3. Bot再起動時の復元エラー**

- pending レコードのチャンネルが存在しない → スキップ
- 設定が無効 → スキップ
- ギルドから退出済み → 自然にスキップ（guilds.cache に存在しない）

### 想定される追加対応（未実装）

- **ロールが削除された**: ロールメンションをスキップし、ユーザーメンションのみ送信
- **ユーザーがサーバーを退出**: そのユーザーのメンションをスキップ
- **Bot権限不足**: 送信エラーをキャッチしてログ記録
- **データベース接続エラー**: リトライロジック

---

## 🧪 テストケース

### ユニットテスト（実装済み）

最新の件数とカバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照。

**BumpReminderRepository**:

- [x] create(): リマインダー作成（serviceName含む）
- [x] findById(): ID検索
- [x] findPendingByGuild(): ギルド別の pending 検索
- [x] findAllPending(): pending ステータスのみ取得
- [x] updateStatus(): ステータス更新
- [x] cancelByGuild(): ギルド単位キャンセル
- [x] cleanupOldReminders(): 7日以上前のレコード削除

**BumpReminderManager (JobScheduler)**:

- [x] setReminder(): DB保存 + タイマー設定
- [x] serviceName パラメータの保存
- [x] restorePendingReminders(): 起動時復元
- [x] 過去時刻の即時実行
- [x] 未来時刻のタイマー再設定

**既存機能への影響** (実装済み):

- [x] GuildConfigRepository
- [x] LocaleManager
- [x] ErrorHandler

### インテグレーションテスト

実装済み:

- [x] messageCreateイベントフロー全体
- [x] Disboard/Dissoku の検知
- [x] serviceName の保存と取得
- [x] タイマー発火とリマインダー送信
- [x] Bot再起動時の復元
  - [x] pending レコードの取得
  - [x] 通知時刻前の復元（タイマー再設定）
  - [x] 通知時刻後の復元（即時送信）
- [x] データベース永続化の確認
- [x] パネルUIのボタンクリック処理
- [x] mentionUserIds の動的更新（ボタン経由）

---

## 📝 実装メモ

### ディス速のBot ID確認方法

✅ **確認済み**: `761562078095867916`

1. ディス速をサーバーに招待
2. `/up` コマンドを実行
3. レスポンスメッセージの送信者IDを確認
4. 確認したIDを定数として設定

### JobScheduler による実装

**JobScheduler を使用した理由:**

1. **一貫性**: スケジューリング処理を共通化
2. **再利用性**: 繰り返しジョブと一回実行ジョブを同一APIで管理
3. **保守性**: ジョブ登録・削除・監視を集約

**動作概要:**

1. リマインダー登録時にDBへ保存（永続化）
2. `setTimeout` ベースの1回実行ジョブをメモリ上に設定
3. 実行後にDBのステータスを `sent` に更新

### Bot再起動時の復元戦略

**ハイブリッドアプローチ:**

- **DB**: 永続的な真実の記録（pending レコード）
- **メモリ**: 実行中のタイマー（1回実行ジョブ）

**復元フロー:**

起動時にpendingリマインダーを全件取得し、タイマーを再設定します。送信時に最新の設定を取得するため、Bump検知後の設定変更も反映されます。

### メンション構築ロジック

メンションがある場合は `{メンション文字列}\n{リマインダーメッセージ}` の形式で連結し、メンションがない場合はリマインダーメッセージのみを送信します（空行を入れない）。

### 重複防止機構

新しいBump検知時に、同じギルドの既存pendingリマインダーを自動的にキャンセルします。通常運用では Disboard/Dissoku の2時間制限により重複は発生しないため、Bot再起動時のエッジケース対策として機能します。

### serviceName の活用

Bump検知時に `Disboard` または `Dissoku` を記録し、DBに保存します。リマインダー送信時にこの値を参照してサービス別のメッセージを選択します（どちらでもない場合は汎用メッセージにフォールバック）。

### Bumpリマインダー機能のテスト方法

**テストモードの有効化:**

`.env`ファイルで`TEST_MODE`を有効化すると、実際のBumpBotなしでテストできます。

```bash
# .env
TEST_MODE="true"
```

**テストモードの動作:**

- `test bump` というメッセージを送信すると、Disboardの`/bump`検知として動作
- `test up` というメッセージを送信すると、Dissokuの`/up`検知として動作
- リマインダーの遅延時間が **2時間から1分に短縮**

**テスト手順:**

1. `.env`で`TEST_MODE="true"`を設定
2. Botを再起動
3. Discordチャンネルで`test bump`または`test up`を送信
4. パネルUIが表示される（ボタンでBump通知を設定可能）
5. 1分後にリマインダーメッセージが送信される（パネルは常設のため削除されない）

**注意:**

- 本番環境では必ず`TEST_MODE`をコメントアウトまたは削除してください
- テストモードではユーザーメッセージを検知するため、通常のBot検知は無効化されません

---

## 🔗 参考リソース

- [Disboard公式サイト](https://disboard.org/)
- [ディス速公式サイト](https://dissoku.net/)
- [Discord.js - MessageCreateEvent](https://discord.js.org/#/docs/discord.js/main/class/Client?scrollTo=e-messageCreate)
- [Discord.js - ButtonBuilder](https://discord.js.org/#/docs/discord.js/main/class/ButtonBuilder)

---

## ✅ 実装ステータス

### 完了済み

- [x] Disboard/ディス速の Bump検知（serviceName対応）
- [x] BumpReminderテーブルによるDB永続化
- [x] JobScheduler（1回実行ジョブ）によるタイマー管理
- [x] Bot再起動時の復元（pending レコードから）
- [x] `/bump-reminder-config` コマンド（enable/disable/set-mention/view）
- [x] サービス別メッセージ（Disboard用とDissoku用）
- [x] メンション設定の動的反映（送信時に最新設定を取得）
- [x] デフォルト有効化
- [x] 包括的なテスト（件数は継続的に更新）
- [x] 日本語/英語ローカライゼーション
- [x] パネルUI（ボタンコンポーネント）
  - [x] Bump検知時のEmbedメッセージ + ボタン表示
  - [x] Button Interaction処理
  - [x] 個別ユーザーのBump通知ON/OFF（冪等な2ボタン方式）
  - [x] パネル常設化（リマインダー送信後も削除しない、新Bump検知時に旧パネルを削除）
- [x] 重複Bump時の古いリマインダー自動キャンセル

### 未実装

- なし

### 今後の改善案

1. **統計機能**: Bump回数の記録と表示
2. **通知カスタマイズ**: リマインダーメッセージのカスタマイズ機能
3. **ユーザー通知一括削除**: `clear-mention-users` サブコマンドで全ユーザーのBump通知登録を一括削除（ロール設定には影響しない）
