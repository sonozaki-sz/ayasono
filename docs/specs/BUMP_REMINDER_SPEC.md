# Bumpリマインダー機能 - 仕様書

> Disboard・ディス速のBumpリマインダー機能の詳細仕様

最終更新: 2026年2月18日

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
- 無効化したい場合は `/bump-reminder-config disable` を実行してください

---

## 🎯 主要機能

### 1. Bump検知

**messageCreateイベント**で以下を監視：

```typescript
// Disboardの場合
if (
  message.author.id === "302050872383242240" &&
  message.interaction?.commandName === "bump"
) {
  await handleBumpDetected(client, guildId, channelId, message.id, "Disboard");
}

// ディス速の場合
if (
  message.author.id === "761562078095867916" &&
  message.interaction?.commandName === "up"
) {
  await handleBumpDetected(client, guildId, channelId, message.id, "Dissoku");
}
```

**検知条件:**

- メッセージの送信者がBumpBot（Disboard ID: `302050872383242240` or ディス速 ID: `761562078095867916`）
- `message.interaction?.commandName` が Disboard では `bump`、ディス速では `up` である
- Bumpリマインダー機能が有効化されている（デフォルトで有効）
- `channelId` が設定済みの場合は、設定チャンネル内での検知のみ有効
- `serviceName` として "Disboard" または "Dissoku" を記録

### 2. タイマー管理

**実装: JobScheduler（1回実行は setTimeout）+ DB永続化**

```typescript
// 2時間後のリマインダーを設定
const delayMinutes = 120; // 2時間

await bumpReminderManager.setReminder(
  guildId,
  channelId,
  messageId,
  panelMessageId,
  delayMinutes,
  taskFactory, // リマインダー送信処理
  serviceName, // "Disboard" または "Dissoku"
);
```

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

**ボタンコンポーネント:**

<table border="1" cellpadding="8" width="420">
<tr><th align="left">ℹ️ Bumpリマインダー機能</th></tr>
<tr><td>
54分後にリマインドが通知されます。<br>
（Discordの相対タイムスタンプ形式で表示）
</td></tr>
<tr><td><kbd>🔔 メンション登録</kbd> &nbsp; <kbd>🔕 メンション解除</kbd></td></tr>
</table>

**機能:**

- `🔔 メンション登録`: ユーザーをメンションリストに追加
- `🔕 メンション解除`: ユーザーをメンションリストから削除
- パネルメッセージはリマインダー送信後に自動削除されます

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

**3. `set-mention` - メンション設定**

```
# メンションロールを設定
/bump-reminder-config set-mention role:@BumpRole

# メンションユーザーを追加/削除（トグル動作）
/bump-reminder-config set-mention user:@ユーザー

# ロールとユーザーを同時設定
/bump-reminder-config set-mention role:@BumpRole user:@ユーザー
```

- リマインダー送信時にメンションするロールまたはユーザーを設定
- **ロール**: 指定したロールに設定（上書き）
- **ユーザー**: リストに存在する場合は削除、存在しない場合は追加（トグル動作）
- **注意**: ロールまたはユーザーのどちらかは必須（オプションなしでの実行は不可）

**4. `remove-mention` - メンション設定削除**

```
# ロール設定を削除
/bump-reminder-config remove-mention target:role

# ユーザーを選択して削除（複数選択可能なUI表示）
/bump-reminder-config remove-mention target:user

# 全ユーザー登録を削除
/bump-reminder-config remove-mention target:users

# ロール＋全ユーザーを削除
/bump-reminder-config remove-mention target:all
```

- **role**: ロール設定のみ削除
- **user**: 登録済みユーザー一覧から選択削除（StringSelectMenu UI）
- **users**: 全ユーザー登録を一括削除
- **all**: ロールと全ユーザーを完全削除

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

- ユーザー個別のメンション登録ON/OFFボタン（パネルUI）実装済み
- Bump検知時にパネルUIが表示され、ユーザーが自分でメンション登録を管理可能
- サーバー管理権限がある人も `/bump-reminder-config set-mention user:@ユーザー` で追加/削除可能（トグル動作）

---

## 💾 データベーススキーマ

### BumpReminder テーブル

リマインダーの永続化に独立したテーブルを使用：

```prisma
model BumpReminder {
  id          String   @id @default(cuid())
  guildId     String
  channelId   String
  messageId   String?
  panelMessageId String?
  serviceName String?   // "Disboard" または "Dissoku"
  scheduledAt DateTime
  status      String    // "pending" | "sent" | "cancelled"
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([guildId])
  @@index([status, scheduledAt])
  @@map("bump_reminders")
}
```

**ステータス管理:**

- `pending`: リマインダー待機中（Bot再起動時に復元対象）
- `sent`: リマインダー送信完了
- `cancelled`: キャンセル済み（disable コマンド実行時など）

### GuildConfig

Bumpリマインダーの設定情報：

```prisma
model GuildConfig {
  // ...
  bumpReminderConfig String? // JSON: BumpReminderConfig
}
```

**GuildConfig から取得する設定:**

```typescript
interface BumpReminderConfig {
  enabled: boolean; // 機能有効/無効（デフォルト: true）  channelId?: string; // Bump検知対象チャンネルID（未設定時は全チャンネルで検知）  mentionRoleId?: string; // メンションロールID
  mentionUserIds: string[]; // メンションユーザーIDリスト
}
```

**重要な設計判断:**

- **BumpReminderテーブル**: リマインダーの実行状態を管理（1ギルド複数リマインダー可能、ただし実際は最後の1件のみ有効）
- **GuildConfig**: ギルド全体の設定（メンション対象など）
- リマインダー送信時に GuildConfig から最新の設定を取得することで、Bump検知後の設定変更も反映

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

```typescript
// taskFactory内で最新の設定を取得
const taskFactory = (...) => {
  return async () => {
    // リマインダー送信時に最新の設定を取得
    const currentConfig = await guildConfigRepository.getBumpReminderConfig(guildId);

    // 最新の mentionRoleId, mentionUserIds を使用
    // → Bump検知後に設定変更しても反映される
  };
};
```

### Bot再起動時の復元

**実装場所**: `src/bot/events/clientReady.ts`

```typescript
// 1. pending ステータスのリマインダーを全て取得
const restoredCount =
  await bumpReminderManager.restorePendingReminders(taskFactory);

// 2. 各リマインダーをループ
// restorePendingReminders() 内部で
// - 同一ギルドの重複pendingを最新1件へ整理
// - 期限超過分を即時実行
// - 未来分を再スケジュール
```

**復元の特徴:**

- **DB駆動**: メモリ上のタイマーは消失するが、DBの `pending` レコードから完全復元
- **過去時刻の処理**: Bot停止中に通知時刻を過ぎた場合でも即座に通知
- **serviceName保持**: Disboard/Dissoku のどちらか正しいメッセージを送信

---

## 🛡️ エラーハンドリング

### 実装済みのエラー処理

**1. チャンネルが削除された / 見つからない**

```typescript
const channel = await client.channels.fetch(channelId);
if (!channel?.isTextBased()) {
  logger.warn("Bump reminder channel not found", { channelId, guildId });
  return; // リマインダー送信をスキップ
}
```

**2. 機能が無効化されている**

```typescript
const config = await getBumpReminderConfig(guildId);
if (!config?.enabled) {
  logger.debug("Bump reminder disabled", { guildId });
  return; // 送信せずに終了
}
```

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
4. 確認したIDを定数に設定:

```typescript
// src/bot/events/messageCreate.ts
const DISBOARD_BOT_ID = "302050872383242240";
const DISSOKU_BOT_ID = "761562078095867916"; // 確認済み
```

### JobScheduler による実装

**JobScheduler を使用した理由:**

1. **一貫性**: スケジューリング処理を共通化
2. **再利用性**: 繰り返しジョブと一回実行ジョブを同一APIで管理
3. **保守性**: ジョブ登録・削除・監視を集約

**実装の核心:**

```typescript
// src/shared/scheduler/jobScheduler.ts
export class BumpReminderManager {
  async setReminder(
    guildId: string,
    channelId: string,
    messageId: string | undefined,
    panelMessageId: string | undefined,
    delayMinutes: number,
    task: () => Promise<void>,
    serviceName?: string,
  ): Promise<void> {
    // 1. DBに保存（永続化）
    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    await this.repository.create(
      guildId,
      channelId,
      scheduledAt,
      messageId,
      panelMessageId,
      serviceName,
    );

    // 2. setTimeoutベースで1回実行ジョブを設定（メモリ管理）
    this.scheduleTask(jobId, scheduledAt, async () => {
      await task();
      await this.repository.updateStatus(reminderId, "sent");
    });
  }
}
```

### Bot再起動時の復元戦略

**ハイブリッドアプローチ:**

- **DB**: 永続的な真実の記録（pending レコード）
- **メモリ**: 実行中のタイマー（1回実行ジョブ）

**復元フロー:**

```typescript
// src/bot/events/clientReady.ts
await bumpReminderManager.restorePendingReminders(taskFactory);

for (const reminder of pendingReminders) {
  const taskFactory = (...) => async () => {
    // ⚠️ 重要: 送信時に最新の GuildConfig を取得
    const config = await getBumpReminderConfig(guildId);
    // → Bump検知後の設定変更も反映される
  };

  await bumpReminderManager.setReminder(...);
}
```

### メンション構築ロジック

**空行を避ける実装:**

```typescript
// メンションがない場合は空行を入れない
const content = mentionText
  ? `${mentionText}\n${reminderMessage}` // 改行1つのみ
  : reminderMessage; // メッセージだけ
```

**結果:**

```
# メンションあり
@BumpRole @User1
⏰ `/bump`が出来るようになったよ！

# メンションなし
⏰ `/bump`が出来るようになったよ！
```

### 重複防止機構

新しいBump検知時に、同じギルドの既存pendingリマインダーを自動的にキャンセルします。

**仕組み:**

```typescript
// BumpReminderRepository.create() 内で実行
async create(guildId, channelId, scheduledAt, messageId, serviceName) {
  // 1. 同じギルドの既存pendingリマインダーをキャンセル
  await this.cancelByGuild(guildId);

  // 2. 新しいリマインダーを作成
  const reminder = await this.prisma.bumpReminder.create({...});
  return reminder;
}
```

**対象:**

- 同じギルドIDの `pending` ステータスのリマインダー

**ユースケース:**

- 通常運用では Disboard/Dissoku の2時間制限により重複は発生しない
- Bot再起動時のエッジケースで pending レコードが残っている場合に有効

### serviceName の活用

**目的**: DisboardとDissokuを区別し、適切なメッセージを表示

**データフロー:**

```
messageCreate.ts (検知)
  → serviceName = "Disboard" or "Dissoku"
    → BumpReminderRepository (DB保存)
      → BumpReminderManager (タイマー設定)
        → taskFactory (送信時に serviceName を使用)
          → メッセージ選択: "bump.reminder_message.disboard" or "dissoku"
```

**メッセージ選択ロジック:**

```typescript
let reminderMessage: string;
if (serviceName === "Disboard") {
  reminderMessage = await tGuild(
    guildId,
    "events:bump.reminder_message.disboard",
  );
} else if (serviceName === "Dissoku") {
  reminderMessage = await tGuild(
    guildId,
    "events:bump.reminder_message.dissoku",
  );
} else {
  reminderMessage = await tGuild(guildId, "events:bump.reminder_message"); // フォールバック
}
```

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
4. パネルUIが表示される（ボタンでメンション登録可能）
5. 1分後にリマインダーメッセージが送信され、パネルが削除される

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
  - [x] 個別ユーザーのメンション登録ON/OFF切り替え
  - [x] リマインダー送信後のパネルメッセージ削除
- [x] 重複Bump時の古いリマインダー自動キャンセル

### 未実装

- なし

### 今後の改善案

1. **統計機能**: Bump回数の記録と表示
2. **通知カスタマイズ**: リマインダーメッセージのカスタマイズ機能
