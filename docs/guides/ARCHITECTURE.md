# アーキテクチャガイド

> Architecture Guide - コード設計・モジュール構成・設計パターンの解説

最終更新: 2026年3月16日

---

## 📋 概要

ayasono は **Bot プロセス**と **Web プロセス**の2プロセス構成で動作します。
それぞれ独立して起動・停止でき、共有コード（`src/shared/`）を通じてロジックを再利用します。

### このドキュメントのスコープ

- 扱う内容: システム全体の構成、依存方向、レイヤ境界、モジュール責務
- 扱わない内容: 関数分割手順、命名/コメント細則、実装時のチェックリスト
- 実装細則は [IMPLEMENTATION_GUIDELINES.md](IMPLEMENTATION_GUIDELINES.md) を参照

---

## 🏗️ プロセス構成

```mermaid
graph TD
    subgraph ayasono["ayasono"]
        Bot["Bot プロセス<br>src/bot/main.ts<br>─────────────<br>Discord Bot<br>Gateway 接続"]
        Web["Web プロセス<br>src/web/server.ts<br>─────────────<br>Fastify HTTP Server<br>REST API + 静的配信"]
        Shared["src/shared/<br>共有ロジック<br>DB / i18n / etc"]
        DB["SQLite (libSQL)<br>storage/db.sqlite"]
    end
    Bot --> Shared
    Web --> Shared
    Shared --> DB
```

**起動コマンド**:

```bash
# 両方同時起動（開発）
pnpm dev

# 個別起動
pnpm dev:bot   # Bot のみ
pnpm dev:web   # Web のみ

# 本番
pnpm start     # 両方
```

---

## 📁 ディレクトリ構成

```
src/
├── bot/                   # Bot プロセス専用
│   ├── main.ts            # エントリーポイント
│   ├── client.ts          # BotClient クラス（discord.js Client 拡張）
│   ├── types/
│   │   └── discord.ts     # Bot専用のdiscord.js型拡張
│   ├── commands/          # スラッシュコマンド定義（commandLoader が自動スキャン）
│   ├── events/            # Discord イベントハンドラ（eventLoader が自動スキャン）
│   ├── features/          # Bot専用機能（bump-reminder, vac, sticky-message 等）
│   │   └── <feature>/
│   │       ├── commands/   # コマンド実行ロジック（*.execute.ts, *.guard.ts 等）
│   │       ├── handlers/   # イベント境界・起動処理
│   │       │   └── ui/    # Button/Select/Modal などUI境界
│   │       ├── services/   # 機能固有のビジネスロジック
│   │       ├── repositories/ # 機能固有のランタイムデータのリポジトリ（設定以外）
│   │       └── constants/  # 共通定数・CustomID 定義
│   ├── handlers/interactionCreate/
│   │   ├── flow/          # command/components/modal のフロー制御
│   │   │   └── components.ts # customIdベースの汎用ハンドラディスパッチ
│   │   ├── handleInteractionCreate.ts
│   │   └── ui/            # UIインタラクションハンドラレジストリ
│   │       └── types.ts   # InteractionHandler<T> 汎用ハンドラ型定義
│   ├── shared/            # Bot 層内の複数機能で共用するユーティリティ
│   │   ├── i18nKeys.ts    # 共通 i18n キー定数
│   │   ├── permissionGuards.ts # 共通権限チェック関数
│   │   └── disableComponentsAfterTimeout.ts # コンポーネント一括無効化
│   ├── errors/
│   │   └── interactionErrorHandler.ts
│   ├── utils/
│   │   ├── interaction.ts
│   │   └── messageResponse.ts
│   └── services/
│       └── botCompositionRoot.ts  # Composition Root（全サービスの初期化・DI）
│
├── shared/                # Bot・Web 両プロセスで使用する共有コード
│   ├── config/
│   │   └── env.ts         # 環境変数定義（Zod バリデーション）
│   ├── database/
│   │   ├── types/         # ドメイン型・リポジトリインターフェース定義
│   │   │   ├── index.ts   # 型バレル（import type 専用）
│   │   │   ├── entities.ts        # エンティティインターフェース
│   │   │   ├── repositories.ts    # リポジトリインターフェース（IGuildConfigRepository 等）
│   │   │   ├── bumpReminderTypes.ts
│   │   │   ├── vcRecruitTypes.ts
│   │   │   └── stickyMessageTypes.ts
│   │   ├── repositories/  # リポジトリ実装
│   │   │   ├── guildConfigRepository.ts          # 複合リポジトリ（PrismaGuildConfigRepository）
│   │   │   ├── afkConfigRepository.ts
│   │   │   ├── bumpReminderConfigRepository.ts
│   │   │   ├── memberLogConfigRepository.ts
│   │   │   ├── vacConfigRepository.ts
│   │   │   ├── vcRecruitConfigRepository.ts
│   │   │   ├── persistence/       # 読み書き永続化ヘルパー
│   │   │   └── serializers/       # データ変換（Prisma ↔ ドメイン型）
│   │   └── guildConfigRepositoryProvider.ts # リポジトリ singleton キャッシュ
│   ├── errors/
│   │   ├── customErrors.ts
│   │   ├── errorUtils.ts
│   │   └── processErrorHandler.ts
│   ├── features/          # ギルド設定サービス（全機能）
│   │   ├── afk/
│   │   │   ├── afkConfigService.ts
│   │   │   └── afkConfigDefaults.ts
│   │   ├── bump-reminder/
│   │   │   ├── bumpReminderConfigService.ts
│   │   │   └── bumpReminderConfigDefaults.ts
│   │   ├── member-log/
│   │   │   ├── memberLogConfigService.ts
│   │   │   └── memberLogConfigDefaults.ts
│   │   ├── vac/
│   │   │   ├── vacConfigService.ts
│   │   │   └── vacConfigDefaults.ts
│   │   ├── vc-recruit/
│   │   │   ├── vcRecruitConfigService.ts
│   │   │   └── vcRecruitConfigDefaults.ts
│   │   └── sticky-message/
│   │       └── stickyMessageConfigService.ts
│   ├── locale/            # i18n（i18next）
│   ├── scheduler/
│   │   └── jobScheduler.ts
│   └── utils/
│       ├── logger.ts
│       ├── prisma.ts
│       ├── serviceFactory.ts  # createBotServiceAccessor / createServiceGetter
│       ├── jsonUtils.ts       # parseJsonArray 等
│       └── ttlMap.ts          # TTL付きインメモリMap（UIセッション状態管理）
│
└── web/                   # Web プロセス専用
    ├── server.ts          # Fastify サーバー起動
    ├── webAppBuilder.ts   # Webアプリ組み立て
    ├── middleware/
    │   └── auth.ts        # Bearer トークン認証
    ├── routes/
    │   ├── health.ts      # GET /health, GET /ready
    │   └── api/           # GET /api/*
    ├── schemas/           # リクエスト/レスポンス型
    └── public/            # 静的ファイル配信
```

### 設計原則

| ルール                                                          | 理由                                 |
| --------------------------------------------------------------- | ------------------------------------ |
| `src/bot/` → `src/shared/` への依存のみ許可                     | Bot と Web の疎結合を維持            |
| `src/web/` → `src/shared/` への依存のみ許可                     | 同上                                 |
| `src/shared/` は Bot・Web どちらにも依存しない                  | 共有コードの独立性を保証             |
| 共有可能な機能ロジックは `src/shared/features/<機能名>/` に配置 | Bot/Web での再利用性を維持           |
| Bot専用機能は `src/bot/features/<機能名>/` に配置               | Discord依存・Bot専用責務の混在を防止 |

命名規則・ディレクトリテンプレート・import 規約の詳細は [IMPLEMENTATION_GUIDELINES.md](IMPLEMENTATION_GUIDELINES.md) を参照してください。

---

## 🤖 Discord Bot 設計

### Gateway Intents

```typescript
// src/bot/client.ts
intents: [
  GatewayIntentBits.Guilds, // サーバー情報・チャンネル情報
  GatewayIntentBits.MessageContent, // メッセージ本文の読み取り（Bump検知に必須）
  GatewayIntentBits.GuildMessages, // サーバー内メッセージイベント
  GatewayIntentBits.GuildMembers, // メンバー参加・退出イベント（MemberLog 用）
  GatewayIntentBits.GuildVoiceStates, // VC 参加・退出イベント（AFK移動・VAC 用）
];
```

> **注意**: `MessageContent` と `GuildMembers` は Discord Developer Portal での **Privileged Intents 有効化**が必要です。

### BotClient クラス

`discord.js` の `Client` を拡張し、以下を追加しています：

```typescript
class BotClient extends Client {
  commands: Collection<string, Command>; // 登録済みコマンド
  modals: Collection<string, Modal>; // 登録済みモーダル
  cooldownManager: CooldownManager; // クールダウン管理
}
```

### コマンド・イベントの自動ロード

`src/bot/commands/` と `src/bot/events/` 内のファイルは、**バレルファイルなし**で自動ロードされます。

| ローダー                         | スキャン対象            | 判定条件                  |
| -------------------------------- | ----------------------- | ------------------------- |
| `src/bot/utils/commandLoader.ts` | `src/bot/commands/*.ts` | `data` + `execute` を持つ |
| `src/bot/utils/eventLoader.ts`   | `src/bot/events/*.ts`   | `name` + `execute` を持つ |

**コマンド追加手順**: `src/bot/commands/<name>.ts` に `Command` 型を満たすオブジェクトをエクスポートするだけで、配列への手動追加は不要です。

> **tsup `splitting` と `import.meta.dirname` の注意点**
>
> tsup の `splitting: true` が有効なとき、複数エントリーから参照される関数は `dist/chunk-XXXXXXXX.js` のような共有チャンクに移動する。この場合、関数内の `import.meta.dirname` はチャンクの置き場所（`dist/` 直下）を返すため、ローダー内でパスを解決すると実際のディレクトリ（`dist/bot/commands/`）とずれる。
>
> これを防ぐため、`loadCommands()` と `loadEvents()` は **ディレクトリパスを引数で受け取る**設計になっている。`bot/main.ts`（`dist/bot/main.js` にコンパイルされるため `import.meta.dirname` が確実に `dist/bot/` を返す）から正しいパスを渡す：
>
> ```typescript
> // src/bot/main.ts
> const commands = await loadCommands(resolve(import.meta.dirname, "commands")); // → dist/bot/commands/
> const events = await loadEvents(resolve(import.meta.dirname, "events")); // → dist/bot/events/
> ```
>
> ローダー関数内で `import.meta.dirname` を使ってパスを解決してはいけない。将来新しいローダーを追加する場合も同様に呼び出し元からパスを渡すこと。

```typescript
// src/bot/commands/hello.ts
export const helloCommand: Command = {
  data: new SlashCommandBuilder().setName("hello").setDescription("..."),
  async execute(interaction) { ... },
};
```

### コマンド・モーダルの型インターフェース

```typescript
interface Command {
  data: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  cooldown?: number; // 秒単位（省略時はクールダウンなし）
}

interface Modal {
  modal: ModalBuilder;
  data?: unknown;
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}
```

---

## 🗄️ データベース設計

### 接続管理

`setPrismaClient()` / `getPrismaClient()` / `requirePrismaClient()` をモジュールレベルで管理します。
`global` 変数を使わず、モジュールスコープの変数で Prisma Client を保持します。

```typescript
// 起動時に一度だけ登録
setPrismaClient(prisma);

// 利用側（必ず存在する前提）
const prisma = requirePrismaClient(); // 存在しない場合は Error をスロー

// 利用側（存在しない可能性あり）
const prisma = getPrismaClient(); // null の場合あり
```

### スキーマ構成

機能ごとに独立したテーブルを持ちます。`GuildConfig` テーブルは共通設定（locale 等）のみを保持し、機能設定は専用テーブルに分離されています。

| テーブル                  | 用途                                       |
| ------------------------- | ------------------------------------------ |
| `GuildConfig`             | ギルド共通設定（locale 等）                |
| `GuildAfkConfig`          | AFK 機能設定                               |
| `GuildBumpReminderConfig` | Bump リマインダー設定                      |
| `GuildMemberLogConfig`    | メンバーログ設定                           |
| `GuildVacConfig`          | VC 自動作成設定                            |
| `GuildVcRecruitConfig`    | VC 募集設定                                |
| `BumpReminder`            | Bump リマインダー記録（スケジュールデータ） |
| `StickyMessage`           | 固定メッセージ記録                         |

JSON 配列フィールド（`mentionUserIds`, `triggerChannelIds` 等）は SQLite の制約上 `String` 型で保存し、`parseJsonArray()` で読み出し時に変換します。

### Repository パターン

データベースへのアクセスはすべて Repository クラスを経由します。
テスト時は Repository インターフェースをモック注入することで DB 依存を排除できます。

**ギルド設定リポジトリ（`src/shared/database/repositories/`）**:

```
PrismaGuildConfigRepository   ← 複合リポジトリ（全機能設定インターフェースを実装）
  ├─ AfkConfigRepository
  ├─ BumpReminderConfigRepository
  ├─ MemberLogConfigRepository
  ├─ VacConfigRepository
  └─ VcRecruitConfigRepository
```

すべての機能設定リポジトリは `IGuildConfigRepository` インターフェース（`src/shared/database/types/repositories.ts`）に集約されており、`getGuildConfigRepository(prisma)` で取得します。

**機能固有のランタイムデータリポジトリ（`src/bot/features/<feature>/repositories/`）**:

```
BumpReminderRepository   ← BumpReminder テーブルの CRUD
StickyMessageRepository  ← StickyMessage テーブルの CRUD
VcRecruitRepository      ← VcRecruit の作成済みチャンネル管理（設定サービスをラップ）
```

### Composition Root と DI

`src/bot/services/botCompositionRoot.ts` がすべてのサービス・リポジトリを初期化します。
各サービスは `createBotServiceAccessor<T>()` で生成した getter/setter ペアでモジュールレベルに保持されます。

```typescript
// 起動時に一度だけ初期化
initializeBotCompositionRoot(prisma);

// 利用側（ハンドラーから呼び出す）
const service = getBotBumpReminderConfigService();
```

未初期化状態で getter を呼ぶと即座に `Error` がスローされるため、初期化漏れを起動時に検出できます。

---

## ⏰ スケジューラー設計

`JobScheduler` は2種類のジョブをサポートします。

| 種別           | メソッド          | 仕組み                  | 用途                |
| -------------- | ----------------- | ----------------------- | ------------------- |
| 繰り返しジョブ | `addJob()`        | node-cron               | 定期実行タスク      |
| 1回限りジョブ  | `addOneTimeJob()` | setTimeout + `.unref()` | Bump リマインダー等 |

`setTimeout` に `.unref()` を呼び出しているため、**タイマーが残っていても Node.js プロセスは正常終了**できます。

`BumpReminderManager` は `JobScheduler` をラップし、リマインダーの DB 永続化と再起動時の復元を担います。

```
Bot 起動
  └─ clientReady イベント
       └─ BumpReminderManager.restorePendingReminders()
            ├─ DB から status=pending のリマインダーを取得
            ├─ scheduledAt が過去 → 即時実行
            └─ scheduledAt が未来 → setTimeout で再スケジュール
```

---

## 🌐 Web API 設計

### エンドポイント一覧

| メソッド | パス      | 認証   | 説明                              |
| -------- | --------- | ------ | --------------------------------- |
| `GET`    | `/health` | なし   | サーバー稼働確認                  |
| `GET`    | `/ready`  | なし   | DB 接続確認（起動完了チェック用） |
| `GET`    | `/api/*`  | Bearer | API ルート（未実装）              |

### `/health` レスポンス例

```json
{
  "status": "ok",
  "timestamp": "2026-02-19T10:00:00.000Z",
  "uptime": 3600.5
}
```

### `/ready` レスポンス例

```json
// DB 接続OK (200)
{ "ready": true }

// DB 未接続 (503)
{ "ready": false, "reason": "Database not initialized" }
```

`/ready` は Kubernetes の readiness probe やデプロイ後の起動待ち確認に使えます。

### 認証

`Authorization: Bearer <JWT_SECRET>` ヘッダーで認証します。

- `JWT_SECRET` 環境変数が**未設定の場合は認証スキップ**（開発環境向け）
- 設定されている場合はヘッダーの値と `JWT_SECRET` を文字列比較
- 本格的な JWT 署名検証が必要な場合は `src/web/middleware/auth.ts` の検証ロジックを差し替えてください

### CORS

| 環境                           | 許可オリジン                               |
| ------------------------------ | ------------------------------------------ |
| 開発（`NODE_ENV=development`） | すべて許可                                 |
| 本番（`NODE_ENV=production`）  | `CORS_ORIGIN` 環境変数をカンマ区切りで指定 |

---

## 🚨 エラーハンドリング設計

### カスタムエラークラス一覧

すべて `BaseError` を継承しています。

| クラス               | statusCode | 用途                     |
| -------------------- | ---------- | ------------------------ |
| `ValidationError`    | 400        | 入力値バリデーション失敗 |
| `PermissionError`    | 403        | 権限不足                 |
| `NotFoundError`      | 404        | リソースが見つからない   |
| `TimeoutError`       | 408        | タイムアウト             |
| `RateLimitError`     | 429        | レート制限               |
| `ConfigurationError` | 500        | 設定ミス（環境変数等）   |
| `DatabaseError`      | 500        | DB 操作失敗              |
| `DiscordApiError`    | 500        | Discord API エラー       |

### `isOperational` フラグ

`BaseError` は `isOperational: boolean` を持ちます。

| 値                  | 意味                                       | ログレベル |
| ------------------- | ------------------------------------------ | ---------- |
| `true` (デフォルト) | 想定済みの運用エラー（ユーザー操作ミス等） | `warn`     |
| `false`             | プログラミングエラー・バグ                 | `error`    |

`isOperational: false` のエラーはバグの可能性があるため、本番環境ではユーザーに詳細を返しません。

### グローバルエラーハンドラ

`setupGlobalErrorHandlers()` を起動時に呼び出すと、以下がキャッチされます。

```
process.on('unhandledRejection') → ログ出力
process.on('uncaughtException')  → ログ出力 + process.exit(1)
process.on('warning')            → ログ出力
```

`setupGracefulShutdown()` で `SIGTERM` / `SIGINT` 時に Prisma 切断 + Botログアウトを行います。

---

## 🧪 TEST_MODE フラグ

`TEST_MODE=true` を設定すると、Bump リマインダーの待機時間が **120分 → 1分** に短縮されます。
本番環境での動作確認や E2E テストに使用します。

```bash
# .env
TEST_MODE=true
```

```typescript
// src/bot/features/bump-reminder/constants/bumpReminderConstants.ts
export function getReminderDelayMinutes(): number {
  return env.TEST_MODE ? 1 : 120;
}
```

> **注意**: `TEST_MODE=true` は本番環境では使用しないでください。

---

## 🔗 関連ドキュメント

- [XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md) - VPS セットアップ手順
- [DEPLOYMENT.md](DEPLOYMENT.md) - GitHub Actions デプロイフロー
- [I18N_GUIDE.md](I18N_GUIDE.md) - 多言語対応
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針
- [COMMANDS.md](COMMANDS.md) - コマンドリファレンス
- [../progress/IMPLEMENTATION_PROGRESS.md](../progress/IMPLEMENTATION_PROGRESS.md) - 実装進捗
