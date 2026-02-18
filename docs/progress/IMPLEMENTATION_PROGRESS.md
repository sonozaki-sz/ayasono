# 実装進捗

> 機能実装の詳細な進捗状況

最終更新: 2026年2月19日

---

## 📊 実装状況サマリー

### 全体進捗

| カテゴリ             | 実装済み | 未実装 | 進捗率 |
| -------------------- | -------- | ------ | ------ |
| コア機能             | 13       | 0      | 100%   |
| コマンド             | 4        | 8      | 33%    |
| イベント             | 3        | 4      | 43%    |
| サービス             | 2        | 5      | 29%    |
| 主要機能             | 2        | 5      | 29%    |
| データベーステーブル | 3        | 5      | 38%    |

### 機能別実装状況

| 機能                 | 状態 | 実装率 | 備考                           |
| -------------------- | ---- | ------ | ------------------------------ |
| Bumpリマインダー     | ✅   | 100%   | 完全実装                       |
| AFK                  | ✅   | 100%   | 完全実装                       |
| 多言語対応           | ✅   | 100%   | i18next + コマンドローカライズ |
| メッセージレスポンス | ✅   | 100%   | 完全実装                       |
| VAC                  | 📋   | 0%     | 仕様書のみ                     |
| メッセージ固定       | 📋   | 0%     | 仕様書のみ                     |
| 参加・脱退ログ       | 📋   | 0%     | 仕様書のみ                     |
| メッセージ削除       | 📋   | 0%     | 仕様書のみ                     |
| Web UI               | 🚧   | 10%    | 基盤のみ                       |

**凡例**: ✅ 完了 | 🚧 実装中 | 📋 仕様書作成済み

---

## ✅ 実装完了項目

### 🏗️ 環境構築・インフラ

#### 開発環境

- ✅ プロジェクトセットアップ（pnpm、TypeScript、ESLint、Prettier）
- ✅ VSCode開発環境設定（settings.json、launch.json、tasks.json）
- ✅ Git設定（.gitignore、.gitattributes）

#### データベース

- ✅ Prismaセットアップとスキーマ定義
- ✅ libSQL（SQLite）構成
- ✅ マイグレーションシステム

#### テスト環境

- ✅ Jestセットアップ
- ✅ ユニット/インテグレーションテスト構造
- ✅ カバレッジ設定（lcov、html）
- ✅ テストヘルパー（testHelpers.ts）

#### 多言語対応

- ✅ i18nextセットアップ
- ✅ 言語リソース（ja/en）
- ✅ コマンドローカライゼーション自動生成機能（LocaleManager）
- ✅ commandLocalizations.tsによる自動生成

---

### ⚙️ コア機能

#### Bot基盤

- ✅ Discord Bot基盤（client.ts）
  - Client初期化
  - イベントローダー
  - コマンドローダー
  - グレースフルシャットダウン（SIGTERM / SIGINT + Prisma切断）
- ✅ 環境変数管理（env.ts + Zod validation）
  - Discord設定（TOKEN、CLIENT_ID、GUILD_ID）
  - データベース設定（DATABASE_URL）
  - Web設定（PORT、HOST）
  - ログ設定（LOG_LEVEL）

#### エラーハンドリング

- ✅ CustomErrorsクラス群
  - BaseError
  - ValidationError
  - DatabaseError
  - DiscordAPIError
  - ConfigurationError
  - NotFoundError
- ✅ ErrorHandlerサービス
  - エラーログ出力
  - ユーザー向けメッセージ生成
  - コマンドエラーハンドリング（`unknown` 型対応）
  - インタラクションエラーハンドリング（`unknown` 型対応）
  - `toError()` ヘルパー（`unknown` → `Error | BaseError` 変換）
  - `setupGlobalErrorHandlers()`（unhandledRejection / uncaughtException / warning）
  - `setupGracefulShutdown()`（SIGTERM / SIGINT + クリーンアップ処理）
  - i18n統合

#### データベース

- ✅ Prisma Client接続管理
- ✅ GuildConfigRepositoryパターン実装
  - findByGuildId
  - upsert
  - update
  - トランザクション対応
- ✅ BumpReminderRepositoryパターン実装（`src/shared/features/bump-reminder/repository.ts`）
  - findPendingByGuild
  - findAllPending
  - create / findById / delete
  - cancelByGuild / cleanupOld
- ✅ GuildBumpReminderConfigStore実装（`src/shared/database/repositories/GuildBumpReminderConfigStore.ts`）
  - getBumpReminderConfig / setBumpReminderConfig
  - mentionRoleの設定・解除
  - mentionUserの追加・削除・全削除
- ✅ 型定義集約（`src/shared/database/types.ts`）
  - GuildConfig, AfkConfig, BumpReminderConfig, VacConfig など
  - IGuildConfigRepository インターフェース

#### スケジューラー

- ✅ JobScheduler基盤（node-cron）
  - ジョブ登録・削除
  - Cron式サポート
  - エラーハンドリング
- ✅ BumpReminderManager（`src/shared/features/bump-reminder/manager.ts`）
  - Bumpリマインダースケジュール管理
  - 2時間後自動通知
  - Bot再起動時のスケジュール復元
  - データベース連携

#### サービス

- ✅ CooldownManager
  - コマンドクールダウン管理
  - ユーザー別・コマンド別管理
  - 自動クリーンアップ
  - メモリリーク防止

#### ユーティリティ

- ✅ 共有ヘルパー（helpers.ts）
  - formatTimestamp
  - sleep
  - isProduction
- ✅ Interactionヘルパー（interaction.ts）
  - safeReply
  - safeFollowUp
  - safeUpdate
  - safeDeferReply
- ✅ Prismaヘルパー（prisma.ts）
  - getPrismaClient / requirePrismaClient
  - `setPrismaClient()`（モジュールレベルでPrisma Clientを登録。global変数不使用）
- ✅ メッセージレスポンス（messageResponse.ts）
  - createSuccessEmbed / createInfoEmbed / createWarningEmbed / createErrorEmbed
  - カラーコード・絵文字の自動付与
  - タイムスタンプ・フィールド対応

#### 定数管理

- ✅ BUMP_CONSTANTS（`src/shared/features/bump-reminder/constants.ts`）
  - サービス名（DISBOARD、ディス速）
  - BotID、カスタムID接頭辞、ジョブID接頭辞
  - `getReminderDelayMinutes()`（通常120分・TESTモード1分）
  - `toScheduledAt()`（実行予定時刻生成）
  - `BUMP_DETECTION_RULES`（Bot ID + コマンド名の検知ルール）

#### ロガー

- ✅ Winston設定
  - コンソール出力（開発環境）
  - ファイル出力（logs/）
  - ログレベル管理
  - タイムスタンプ、色付け

---

### 🎯 実装済み機能

#### ⏰ Bumpリマインダー機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**実装済みコンポーネント**:

- ✅ messageCreateイベントでのBump検知とパネル送信
  - Disboard/ディス速のBotメッセージ検知
  - Embed検証・サービス名判定
  - Bump検知時のロール/ユーザー登録パネル送信
- ✅ 2時間後の自動リマインダー通知
  - BumpReminderManagerによるスケジュール管理
  - メンション付き通知（ロール/ユーザー）
- ✅ Bot再起動時のスケジュール復元
  - データベースから未完了タスク取得・スケジュール再登録
- ✅ データベース保存
  - BumpReminderテーブル
  - guildId、channelId、serviceName など保存
  - status（pending/sent/cancelled）管理
- ✅ `/bump-reminder-config` コマンド（Embed形式対応済）
  - サブコマンド: enable, disable, set-mention, remove-mention, show
  - インタラクティブUI（Button、Select Menu）
  - 権限チェック（管理者のみ）・多言語対応

**関連ファイル**:

- `src/bot/events/messageCreate.ts`
- `src/bot/commands/bump-reminder-config.ts`
- `src/shared/features/bump-reminder/` (constants.ts, repository.ts, manager.ts, handler.ts, index.ts)
- `prisma/schema.prisma` (BumpReminder、GuildConfig)

**テスト**:

- ✅ BumpReminderRepositoryインテグレーションテスト
- ✅ BumpReminderManagerインテグレーションテスト

**仕様書**: [docs/specs/BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md)

---

#### 🎤 AFK機能（100%完了）

**状態**: ✅ 完全実装

**実装済みコンポーネント**:

- ✅ `/afk` コマンド
  - ユーザーをAFKチャンネルへ移動
  - user オプション（対象ユーザー指定）
  - 権限チェック（MOVE_MEMBERS）
  - エラーハンドリング
  - 多言語対応
- ✅ `/afk-config` コマンド
  - サブコマンド: set-ch, show
  - AFKチャンネル設定
  - 現在の設定表示
  - Select Menuによるチャンネル選択UI
  - 権限チェック（管理者のみ）
  - 多言語対応
- ✅ データベース保存
  - GuildConfigテーブルのafkConfigフィールド（JSON形式）

**関連ファイル**:

- `src/bot/commands/afk.ts`
- `src/bot/commands/afk-config.ts`
- `src/shared/database/repositories/GuildConfigRepository.ts`

**テスト**:

- ✅ GuildConfigRepositoryインテグレーションテスト

**仕様書**: [docs/specs/AFK_SPEC.md](../specs/AFK_SPEC.md)

---

#### 🌐 多言語対応（100%完了）

**状態**: ✅ 完全実装

**実装済みコンポーネント**:

- ✅ i18nextセットアップ
  - バックエンド: i18next-fs-backend
  - 言語: ja（日本語）、en（英語）
  - フォールバック: ja
- ✅ 言語リソース
  - `src/shared/locale/locales/ja/translation.json`
  - `src/shared/locale/locales/en/translation.json`
  - コマンド、エラー、メッセージの翻訳
- ✅ LocaleManager
  - getGuildLocale: ギルドの言語取得
  - t: 翻訳関数（ギルドIDベース）
  - コマンドローカライゼーション自動生成
- ✅ commandLocalizations.ts
  - buildLocalizedCommands: 全コマンドの多言語データ生成
  - name、descriptionの自動翻訳
  - optionsの多言語対応
- ✅ コマンド統合
  - 全コマンドで多言語対応済み
  - エラーメッセージの多言語対応

**関連ファイル**:

- `src/shared/locale/i18n.ts`
- `src/shared/locale/LocaleManager.ts`
- `src/shared/locale/commandLocalizations.ts`
- `src/shared/locale/locales/ja/translation.json`
- `src/shared/locale/locales/en/translation.json`

**テスト**:

- ⚠️ LocaleManager、commandLocalizationsのテストは未実装

**ガイド**: [docs/guides/I18N_GUIDE.md](../guides/I18N_GUIDE.md)

---

### 💻 Web UI基盤（10%完了）

**状態**: 🚧 基盤のみ実装

**実装済みコンポーネント**:

- ✅ Fastifyサーバー基本構造
  - server.ts
  - Fastify初期化
  - グレースフルシャットダウン
- ✅ ヘルスチェックAPI
  - `GET /health`
  - サーバー稼働状態確認
- ✅ Web API基盤
  - `/api/index.ts`
  - APIルーティング基盤
- ✅ 静的ファイル配信
  - `src/web/public/` ディレクトリ

**未実装**:

- ❌ 認証システム（Discord OAuth2、JWT）
- ❌ 管理API（/api/guilds/\*）
- ❌ フロントエンドUI
- ❌ ダッシュボード

**関連ファイル**:

- `src/web/server.ts`
- `src/web/routes/api/index.ts`
- `src/web/routes/health.ts`

---

### 📚 ドキュメント（90%完了）

**状態**: ✅ ほぼ完了

#### プロジェクト管理

- ✅ README.md - プロジェクト概要とクイックスタート
- ✅ TODO.md - タスク管理・残件リスト
- ✅ docs/README.md - ドキュメント構成説明
- ✅ docs/progress/IMPLEMENTATION_PROGRESS.md - 実装進捗の詳細
- ✅ docs/progress/TEST_PROGRESS.md - テスト進捗の詳細

#### 開発ガイド (docs/guides/)

- ✅ ARCHITECTURE.md - アーキテクチャ・設計概要
- ✅ COMMANDS.md - コマンドリファレンス（全コマンドの詳細）
- ✅ DEVELOPMENT_SETUP.md - 環境構築ガイド
- ✅ TESTING_GUIDELINES.md - テスト方針とガイドライン
- ✅ I18N_GUIDE.md - 多言語対応ガイド

#### 機能仕様書 (docs/specs/)

**実装済み機能:**

- ✅ AFK_SPEC.md - AFK機能仕様
  - **検証完了**: 仕様書と実装が100%一致
  - コマンド、データ構造、エラーハンドリング、多言語対応
- ✅ BUMP_REMINDER_SPEC.md - Bumpリマインダー機能仕様 - **検証完了**: 仕様書と実装が100%一致
  - Bump検知、タイマー管理、データベース設計、コマンド実装

**未実装機能（仕様書のみ）:**

- ✅ VAC_SPEC.md - VC自動作成機能仕様
- ✅ STICKY_MESSAGE_SPEC.md - メッセージ固定機能仕様
- ✅ MEMBER_LOG_SPEC.md - メンバーログ仕様
- ✅ MESSAGE_DELETE_SPEC.md - メッセージ削除仕様
- ✅ MESSAGE_RESPONSE_SPEC.md - メッセージレスポンス仕様

#### ドキュメント整理（2026年2月19日完了）

- ✅ docs配下のディレクトリ構造整理
  - guides/ (開発者向けガイド: 5ファイル)
  - specs/ (機能仕様書: 7ファイル)
  - progress/ (進捗管理: 2ファイル)
- ✅ 全ドキュメントのリンク更新
  - README.md、TODO.md、IMPLEMENTATION_PROGRESS.md、TEST_PROGRESS.md
- ✅ 仕様書と実装の整合性検証
  - AFK機能: 完全一致 (コマンド、データ構造、エラーハンドリング、多言語対応)
  - Bumpリマインダー機能: 完全一致 (Bump検知、タイマー管理、DB設計、コマンド、設定管理)
  - 全120テストパス確認

---

### 🎮 実装済みコマンド

| コマンド                | 説明                     | 状態 | 備考     |
| ----------------------- | ------------------------ | ---- | -------- |
| `/ping`                 | 疎通確認                 | ✅   | 完全実装 |
| `/afk`                  | AFKチャンネルへ移動      | ✅   | 完全実装 |
| `/afk-config`           | AFK機能設定              | ✅   | 完全実装 |
| `/bump-reminder-config` | Bumpリマインダー機能設定 | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/commands/ping.ts`
- `src/bot/commands/afk.ts`
- `src/bot/commands/afk-config.ts`
- `src/bot/commands/bump-reminder-config.ts`
- `src/bot/commands/index.ts`
- `src/shared/utils/messageResponse.ts`

---

### 🎪 実装済みイベント

| イベント            | 説明                       | 状態 | 備考     |
| ------------------- | -------------------------- | ---- | -------- |
| `clientReady`       | Bot起動処理                | ✅   | 完全実装 |
| `interactionCreate` | インタラクション処理       | ✅   | 完全実装 |
| `messageCreate`     | メッセージ作成（Bump検知） | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/events/clientReady.ts`
- `src/bot/events/interactionCreate.ts`
- `src/bot/events/messageCreate.ts`
- `src/bot/events/index.ts`
- `src/bot/handlers/buttons/` (bumpPanel.ts ボタンハンドラー)
- `src/bot/handlers/modals/` (モーダルハンドラー)

---

### 🔧 実装済みサービス

| サービス            | 説明                               | 状態 | 備考     |
| ------------------- | ---------------------------------- | ---- | -------- |
| CooldownManager     | コマンドクールダウン管理           | ✅   | 完全実装 |
| BumpReminderManager | Bumpリマインダースケジューラー管理 | ✅   | 完全実装 |
| messageResponse     | Embedメッセージユーティリティ      | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/services/CooldownManager.ts`
- `src/bot/services/index.ts`
- `src/shared/features/bump-reminder/manager.ts`
- `src/shared/utils/messageResponse.ts`

---

### 🗄️ データベーススキーマ

#### 実装済みテーブル

**GuildConfig**

```prisma
model GuildConfig {
  id        String   @id @default(cuid())
  guildId   String   @unique
  locale    String   @default("ja")

  // 詳細設定（JSON形式で保存）
  afkConfig              String? // JSON: AfkConfig
  vacConfig              String? // JSON: VacConfig
  bumpReminderConfig     String? // JSON: BumpReminderConfig
  stickMessages          String? // JSON: StickMessage[]
  memberLogConfig        String? // JSON: MemberLogConfig

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("guild_configs")
}
```

**BumpReminder**

```prisma
model BumpReminder {
  id             String    @id @default(cuid())
  guildId        String
  channelId      String    // 通知を送信するチャンネル
  messageId      String?   // 元のBumpメッセージID (返信用)
  panelMessageId String?   // Bumpパネルメッセージ ID (リマインダー送信後に削除)
  serviceName    String?   // サービス名 (Disboard, Dissoku)
  scheduledAt    DateTime  // 通知予定時刻
  status         String    @default("pending") // pending, sent, cancelled

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([guildId])
  @@index([status, scheduledAt])
  @@map("bump_reminders")
}
```

---

## 📋 未実装機能

以下は仕様書が作成済みで、実装待ちの機能です。

### 🎤 VC自動作成機能（VAC）（仕様書のみ）

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/VAC_SPEC.md](../specs/VAC_SPEC.md)

**実装予定内容**:

- voiceStateUpdateイベントハンドラ
- トリガーチャンネル監視と専用VC自動作成
- 空チャンネル自動削除
- 操作パネル（AFKチャンネル移動、VC設定変更）
- `/vac-config` コマンド
- データベーススキーマ追加

---

### 📌 メッセージ固定機能（仕様書のみ）

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md)

**実装予定内容**:

- `/sticky-message` コマンド（set、remove、list）
- messageCreateイベントでの自動再送信
- データベーススキーマ追加

---

### 👥 メンバーログ機能（仕様書のみ）

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md)

**実装予定内容**:

- guildMemberAdd、guildMemberRemoveイベントハンドラ
- Embed形式の通知メッセージ
- `/member-log-config` コマンド
- データベーススキーマ追加

---

### 🗑️ メッセージ削除機能（仕様書のみ）

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md)

**実装予定内容**:

- `/message-delete` コマンド
- ユーザー指定、件数指定、チャンネル指定オプション
- 権限チェック（MANAGE_MESSAGES）
- 削除ログ

---

## 📊 実装統計

### コードベース統計

- **総ファイル数**: ~100+
- **TypeScriptファイル**: ~80+
- **テストファイル**: ~15+
- **総行数**: ~8000+ 行

### コンポーネント統計

| コンポーネント | 実装済み | 未実装 | 合計 |
| -------------- | -------- | ------ | ---- |
| コマンド       | 4        | 8      | 12   |
| イベント       | 3        | 4      | 7    |
| サービス       | 3        | 4      | 7    |
| リポジトリ     | 2        | 5      | 7    |
| ユーティリティ | 9        | 1      | 10   |

---

## 🔗 関連ドキュメント

- [README.md](../../README.md) - プロジェクト概要
- [TODO.md](../../TODO.md) - タスク管理・残件リスト
- [TEST_PROGRESS.md](TEST_PROGRESS.md) - テスト実装進捗
- [TESTING_GUIDELINES.md](../guides/TESTING_GUIDELINES.md) - テスト方針
- [ARCHITECTURE.md](../guides/ARCHITECTURE.md) - アーキテクチャ・設計概要
- [DEVELOPMENT_SETUP.md](../guides/DEVELOPMENT_SETUP.md) - 環境構築
- [I18N_GUIDE.md](../guides/I18N_GUIDE.md) - 多言語対応ガイド
- [COMMANDS.md](../guides/COMMANDS.md) - コマンドリファレンス

### 機能仕様書

- [BUMP_REMINDER_SPEC.md](../specs/BUMP_REMINDER_SPEC.md) - Bumpリマインダー機能
- [AFK_SPEC.md](../specs/AFK_SPEC.md) - AFK機能
- [VAC_SPEC.md](../specs/VAC_SPEC.md) - VC自動作成機能
- [STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md) - メッセージ固定機能
- [MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md) - メンバーログ
- [MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md) - メッセージ削除
- [MESSAGE_RESPONSE_SPEC.md](../specs/MESSAGE_RESPONSE_SPEC.md) - メッセージレスポンス

---

**最終更新**: 2026年2月19日

---

## ✅ 最近の完了項目 (2026年2月19日 追記分)

### Phase 1: メッセージシステム統一

- ✅ `src/shared/utils/messageResponse.ts` 実装（4種類Embedヘルパー）
- ✅ 全コマンドレスポンスのEmbed化（/ping, /afk, /afk-config, /bump-reminder-config）
- ✅ ErrorHandlerのEmbed形式対応
- ✅ ローカライゼーション拡充（日英各 60+項目、Embed UI向キー團設計）
- ✅ ユニットテスト 14ケース追加（全134テストパス）

### Bumpリマインダー機能のモジュール分離

- ✅ `src/shared/features/bump-reminder/` へ集約
- ✅ buttonHandlers/modalHandlers レジストリ方式に移行
- ✅ `src/shared/database/types.ts` 型定義集約
- ✅ `getGuildConfigRepository()` 工場関数追加

### i18n 型安全化

- ✅ `AllParseKeys` 型で `tGuild()` / `tDefault()` 引数を型安全化
- ✅ `keySeparator: false` でフラットキー形式に統一
- ✅ ログキーを `events:` から `system:` ネームスペースへ移動
- ✅ `GuildTFunction` 型導入

### ドキュメントとソースコードの整合修正

- ✅ docs/guides/ARCHITECTURE.md 新規作成（アーキテクチャ・設計概要）
- ✅ bump-reminder-config サブコマンド名修正: `start/stop` → `enable/disable`
- ✅ afk-config サブコマンド名修正: `set-channel` → `set-ch`
- ✅ AFK データベース保存フィールド修正: `afkChannelId` → `afkConfig (JSON)`
- ✅ `GuildBumpReminderConfigStore.ts` をデータベースセクションへ追記
- ✅ Bumpリマインダー定数の説明更新（`getReminderDelayMinutes()` / `toScheduledAt()` 等）
- ✅ データベーススキーマの記述を実際のスキーマ（cuid, JSON統合, @@map）に更新
- ✅ TEST_PROGRESS.md のテスト数・スイート数・カバレッジを実績値に更新（152テスト / 9スイート / 約46%）
- ✅ BumpReminderRepository / BumpReminderManager テストを「実装済み」に移動
