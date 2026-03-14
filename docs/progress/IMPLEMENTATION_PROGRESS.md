# 実装進捗

> 機能実装の詳細な進捗状況

最終更新: 2026年3月14日（メンバーログ機能拡張：招待追跡・カスタムメッセージモーダル・clear コマンド追加）

---

## 📊 実装状況サマリー

### 全体進捗

| カテゴリ | 実装済み | 未実装 | 進捗率 |
| -------- | -------- | ------ | ------ |
| コア機能 | 13       | 0      | 100%   |
| コマンド | 10       | 4      | 71%    |
| イベント | 8        | 0      | 100%   |
| サービス | 8        | 0      | 100%   |
| 主要機能 | 7        | 0      | 100%   |

### 機能別実装状況

| 機能                 | 状態 | 実装率 | 備考                               |
| -------------------- | ---- | ------ | ---------------------------------- |
| Bumpリマインダー     | ✅   | 100%   | 完全実装                           |
| AFK                  | ✅   | 100%   | 完全実装                           |
| 多言語対応           | ✅   | 100%   | i18next + コマンドローカライズ     |
| メッセージレスポンス | ✅   | 100%   | 完全実装                           |
| VAC                  | ✅   | 100%   | 自動作成・操作パネルまで実装完了   |
| メッセージ固定       | ✅   | 100%   | 完全実装（set/remove/update/view） |
| 参加・脱退ログ       | ✅   | 100%   | 完全実装                           |
| メッセージ削除       | ✅   | 100%   | 完全実装（V2: 2段階確認フロー）    |
| VC募集               | ✅   | 100%   | 完全実装・テスト済み               |
| ギルド設定           | 📋   | 0%     | 仕様書のみ（データ層は実装済み）   |
| 基本コマンド         | 🚧   | 25%    | `/ping` のみ実装済み               |
| Web UI               | 🚧   | 10%    | 基盤のみ                           |

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

- ✅ Vitestセットアップ
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
  - Discord設定（TOKEN、APP_ID、GUILD_ID、ERROR_WEBHOOK_URL）
  - データベース設定（DATABASE_URL）
  - Web設定（WEB_PORT、WEB_HOST）
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
- ✅ GuildConfigRepository実装（ロケール管理）
  - findByGuildId / upsert / update
  - トランザクション対応
- ✅ BumpReminderRepository実装（`src/bot/features/bump-reminder/repositories/bumpReminderRepository.ts`）
  - findPendingByGuild / findAllPending / create / findById / delete
  - cancelByGuild / cleanupOld
- ✅ 機能別 ConfigRepository 実装（`src/shared/database/repositories/`）
  - `afkConfigRepository.ts` — GuildAfkConfig テーブル
  - `bumpReminderConfigRepository.ts` — GuildBumpReminderConfig テーブル
  - `memberLogConfigRepository.ts` — GuildMemberLogConfig テーブル
  - `vacConfigRepository.ts` — GuildVacConfig テーブル
  - `vcRecruitConfigRepository.ts` — GuildVcRecruitConfig テーブル
- ✅ 型定義分割（`src/shared/database/types/`）
  - `entities.ts` — ドメインエンティティ型
  - `repositories.ts` — リポジトリインターフェース
  - `bumpReminderTypes.ts` / `vcRecruitTypes.ts` / `stickyMessageTypes.ts` — 機能別型
  - `index.ts` — 再エクスポート

#### スケジューラー

- ✅ JobScheduler基盤（node-cron）
  - ジョブ登録・削除
  - Cron式サポート
  - エラーハンドリング
- ✅ BumpReminderService（`src/bot/features/bump-reminder/services/bumpReminderService.ts`）
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
  - formatTimestamp / sleep / isProduction
- ✅ Interactionヘルパー（interaction.ts）
  - safeReply / safeFollowUp / safeUpdate / safeDeferReply
- ✅ Prismaヘルパー（prisma.ts）
  - getPrismaClient / requirePrismaClient / setPrismaClient()
- ✅ メッセージレスポンス（messageResponse.ts）
  - createSuccessEmbed / createInfoEmbed / createWarningEmbed / createErrorEmbed
- ✅ jsonUtils（`src/shared/utils/jsonUtils.ts`）
  - JSON シリアライズ・デシリアライズヘルパー
- ✅ serviceFactory（`src/shared/utils/serviceFactory.ts`）
  - サービスインスタンス生成ファクトリ
- ✅ bot/shared（`src/bot/shared/`）
  - `i18nKeys.ts` — ローカライズキー定数
  - `permissionGuards.ts` — 権限チェック共通ガード

#### 定数管理

- ✅ BUMP_CONSTANTS（`src/bot/features/bump-reminder/constants/bumpReminderConstants.ts`）
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
  - BumpReminderServiceによるスケジュール管理
  - メンション付き通知（ロール/ユーザー）
- ✅ Bot再起動時のスケジュール復元
  - データベースから未完了タスク取得・スケジュール再登録
- ✅ データベース保存
  - BumpReminderテーブル
  - guildId、channelId、serviceName など保存
  - status（pending/sent/cancelled）管理
- ✅ `/bump-reminder-config` コマンド（Embed形式対応済）
  - サブコマンド: enable, disable, set-mention, remove-mention, view
  - インタラクティブUI（Button、Select Menu）
  - 権限チェック（サーバー管理権限のみ）・多言語対応

**関連ファイル**:

- `src/bot/events/messageCreate.ts`
- `src/bot/commands/bump-reminder-config.ts`
- `src/shared/features/bump-reminder/bumpReminderConfigService.ts`
- `prisma/schema.prisma` (BumpReminder、GuildConfig)

**テスト**:

- ✅ BumpReminderRepositoryインテグレーションテスト
- ✅ BumpReminderServiceインテグレーションテスト

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
  - サブコマンド: set-channel, view
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
- `src/shared/database/repositories/afkConfigRepository.ts`

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
  - `src/shared/locale/locales/ja/resources.ts`
  - `src/shared/locale/locales/en/resources.ts`
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
- `src/shared/locale/localeManager.ts`
- `src/shared/locale/commandLocalizations.ts`
- `src/shared/locale/locales/resources.ts`
- `src/shared/locale/locales/ja/resources.ts`
- `src/shared/locale/locales/en/resources.ts`

**テスト**:

- ✅ LocaleManager、commandLocalizationsのテスト実装済み

**ガイド**: [docs/guides/I18N_GUIDE.md](../guides/I18N_GUIDE.md)

---

### 🎤 VC自動作成機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/VAC_SPEC.md](../specs/VAC_SPEC.md)

**実装内容**:

- `voiceStateUpdate` でトリガー参加時に専用VCを自動作成
- 作成済みVCの空室検知による自動削除
- `channelDelete`/`clientReady` で設定と実体の同期クリーンアップ
- `/vac-config`（`create-trigger-vc` / `remove-trigger-vc` / `view`）
- `/vac`（`vc-rename` / `vc-limit`）
- 操作パネル（button/modal/user select）
- パネルUIを縦一列化し、全ボタン `ButtonStyle.Primary` に統一
- 応答APIを `flags: MessageFlags.Ephemeral` へ統一

---

### 📌 メッセージ固定機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/STICKY_MESSAGE_SPEC.md](../specs/STICKY_MESSAGE_SPEC.md)

**実装内容**:

- `/sticky-message set` — チャンネルへスティッキーメッセージ設定（プレーン/Embed両対応）
- `/sticky-message remove` — スティッキーメッセージ削除（Discord上のメッセージも削除）
- `/sticky-message update` — 内容上書き更新と即時再送信
- `/sticky-message view` — ギルド内設定一覧を StringSelectMenu で提示、詳細を Embed 表示
- `messageCreate` イベントでデバウンス（5秒）再送信（`StickyMessageResendService`）
- `StickyMessage` テーブル追加（`channelId UNIQUE`、`embedData` JSON、`lastMessageId`）
- 各応答はギルド別言語設定（`tGuild`）に対応
- StringSelectMenu ルーティング基盤（`StringSelectHandler` / `handleStringSelectMenu`）新設

**テスト**:

- ✅ ユニットテスト・インテグレーションテスト実装済み（1361 tests / 189 suites）

---

### 📢 VC募集機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md)

**実装内容**:

- `/vc-recruit-config` コマンド（`setup` / `teardown` / `add-role` / `remove-role` / `view`）
- `setup`: 指定カテゴリにパネルチャンネル・投稿チャンネルを自動作成・権限設定
- `teardown`: StringSelectMenu → 確認パネル → 撤去処理の UI フロー
- ボタン → 2ステップモーダル → StringSelectMenu で募集内容・VC・メンションを設定
- 「🆕 新規VC作成」選択時に専用VCを作成、全員退出で自動削除
- 募集投稿後にパネル送信・募集者を対象VCへ自動移動・スレッド作成
- vac との共通 UI モジュールを `vc-panel/` として分離
- `vcRecruitVoiceStateUpdate`: 参加者0人の募集VCを自動削除
- `vcRecruitChannelDeleteHandler`: チャンネル削除時のペアチャンネル連携削除
- `vcRecruitMessageDeleteHandler`: パネルメッセージ削除時の整合性保全
- `messageDelete` イベントハンドラ追加
- Prismaスキーマ追加（`GuildVcRecruitConfig` テーブル）
- 日英両方のロケール追加
- `categoryAutocomplete` 共通 autocomplete ユーティリティを追加（VAC・VC募集で共用）

**関連ファイル**:

- `src/bot/commands/vc-recruit-config.ts`
- `src/bot/features/vc-recruit/` （コマンド・ハンドラ・リポジトリ）
- `src/bot/features/vc-panel/` （vc-panel 共通モジュール）
- `src/bot/events/messageDelete.ts`
- `src/shared/features/vc-recruit/vcRecruitConfigService.ts`
- `src/shared/database/repositories/vcRecruitConfigRepository.ts`
- `src/bot/utils/categoryAutocomplete.ts`

**テスト**:

- ✅ 40件以上のテストファイル

---

### 👥 メンバーログ機能（100%完了）

**状態**: ✅ 完全実装・テスト済み

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](../specs/MEMBER_LOG_SPEC.md)

**実装内容**:

- `guildMemberAdd` / `guildMemberRemove` イベントハンドラ
- Embed形式の参加・退出通知（ビリジアン・茜色カラー）
- アカウント年齢計算（`date-fns` `intervalToDuration` 利用 / `accountAge.ts`）
- カスタムメッセージ（`{userMention}` / `{userName}` / `{count}` プレースホルダー対応、モーダル入力・最大500文字）
- `/member-log-config` コマンド（set-channel / enable / disable / set-join-message / set-leave-message / clear-join-message / clear-leave-message / view）
- 招待リンク追跡（`inviteTracker.ts`：インメモリキャッシュによる差分検出方式）
- モーダルUIハンドラ（`memberLogSetJoinMessageModalHandler.ts` / `memberLogSetLeaveMessageModalHandler.ts`）
- カスタムメッセージ共通処理（`memberLogUtils.ts`：`formatCustomMessage()`）
- `GuildMemberLogConfig` テーブルへの設定永続化（機能別専用テーブル）

**関連ファイル**:

- `src/bot/events/guildMemberAdd.ts`
- `src/bot/events/guildMemberRemove.ts`
- `src/bot/commands/member-log-config.ts`
- `src/bot/features/member-log/handlers/guildMemberAddHandler.ts`
- `src/bot/features/member-log/handlers/guildMemberRemoveHandler.ts`
- `src/bot/features/member-log/handlers/accountAge.ts`
- `src/bot/features/member-log/handlers/inviteTracker.ts`
- `src/bot/features/member-log/handlers/memberLogUtils.ts`
- `src/bot/features/member-log/handlers/ui/memberLogSetJoinMessageModalHandler.ts`
- `src/bot/features/member-log/handlers/ui/memberLogSetLeaveMessageModalHandler.ts`
- `src/bot/features/member-log/commands/memberLogConfigCommand.execute.ts`
- `src/bot/features/member-log/commands/memberLogConfigCommand.clearJoinMessage.ts`
- `src/bot/features/member-log/commands/memberLogConfigCommand.clearLeaveMessage.ts`
- `src/shared/features/member-log/memberLogConfigService.ts`

**テスト**:

- ✅ 17テストファイル ・ statements/functions/lines 100% ・ branches 100%

---

### 🗑️ メッセージ削除機能（100%完了 / V2新仕様）

**状態**: ✅ 完全実装・テスト済み（2026-03-13 新仕様移行完了）

**仕様書**: [docs/specs/MESSAGE_DELETE_SPEC.md](../specs/MESSAGE_DELETE_SPEC.md)

**実装内容**:

- `/message-delete [count] [user] [bot] [keyword] [days] [after] [before] [channel]` コマンド
  - `count`: 削除件数（全チャンネル合計の上限）
  - `user`: 特定ユーザー/Bot/Webhookのメッセージのみ対象
  - `bot`: Botメッセージのみ対象
  - `keyword`: キーワードを含むメッセージのみ対象（大文字小文字不問）
  - `days`/`after`/`before`: 相対・絶対日時による絞り込み（排他）
  - `channel`: 指定チャンネルのみ対象（省略時は全チャンネル横断）
- **Phase 1 スキャン**: リアルタイム進捗表示（スキャン済み件数・一致件数）
- **Phase 2 プレビューダイアログ**: 5件/ページページネーション付き一覧
- **Phase 3 最終確認ダイアログ**: `⚠️ この操作は取り消せません` 表示
- **Phase 4 削除実行**: リアルタイム削除進捗表示（チャンネルごとの件数）
- 完了メッセージのみ表示（詳細ページネーション廃止）
- 処理中ロック（サーバー単位で重複実行防止）
- 権限チェック（MANAGE_MESSAGES）
- フィルター条件未指定時は実行拒否（安全性確保）

**関連ファイル**:

- `src/bot/commands/message-delete.ts`
- `src/bot/features/message-delete/commands/messageDeleteCommand.execute.ts`
- `src/bot/features/message-delete/commands/messageDeleteEmbedBuilder.ts`
- `src/bot/features/message-delete/commands/usecases/validateOptions.ts`
- `src/bot/features/message-delete/commands/usecases/buildTargetChannels.ts`
- `src/bot/features/message-delete/commands/usecases/runScanPhase.ts`
- `src/bot/features/message-delete/commands/usecases/runPreviewDialog.ts`
- `src/bot/features/message-delete/commands/usecases/runFinalConfirmDialog.ts`
- `src/bot/features/message-delete/commands/usecases/runDeleteExecution.ts`
- `src/bot/features/message-delete/commands/usecases/dialogUtils.ts`
- `src/bot/features/message-delete/services/messageDeleteService.ts`

**テスト**:

- ✅ usecases 7ファイル含む複数テストファイル ・ statements/functions/lines 100% ・ branches 100%

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
  - `/api/apiRoutes.ts`
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
- `src/web/routes/api/apiRoutes.ts`
- `src/web/routes/health.ts`

---

> ドキュメント一覧は [docs/README.md](../README.md) を参照

---

### 🎮 実装済みコマンド

| コマンド                 | 説明                                                       | 状態 | 備考     |
| ------------------------ | ---------------------------------------------------------- | ---- | -------- |
| `/ping`                  | 疎通確認                                                   | ✅   | 完全実装 |
| `/afk`                   | AFKチャンネルへ移動                                        | ✅   | 完全実装 |
| `/afk-config`            | AFK機能設定                                                | ✅   | 完全実装 |
| `/bump-reminder-config`  | Bumpリマインダー機能設定                                   | ✅   | 完全実装 |
| `/vac-config`            | VAC設定（作成/削除/表示）                                  | ✅   | 完全実装 |
| `/vac`                   | VAC VC操作（名前/人数）                                    | ✅   | 完全実装 |
| `/sticky-message set`    | スティッキーメッセージ設定                                 | ✅   | 完全実装 |
| `/sticky-message remove` | スティッキーメッセージ削除                                 | ✅   | 完全実装 |
| `/sticky-message update` | スティッキーメッセージ更新                                 | ✅   | 完全実装 |
| `/sticky-message view`   | スティッキーメッセージ一覧表示（SelectMenu）               | ✅   | 完全実装 |
| `/member-log-config`     | メンバーログ機能設定                                       | ✅   | 完全実装 |
| `/message-delete`        | メッセージ一括削除（V2: 2段階確認フロー）                  | ✅   | 完全実装 |
| `/vc-recruit-config`     | VC募集機能設定（setup/teardown/view/add-role/remove-role） | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/commands/ping.ts`
- `src/bot/commands/afk.ts`
- `src/bot/commands/afk-config.ts`
- `src/bot/commands/bump-reminder-config.ts`
- `src/bot/commands/vac-config.ts`
- `src/bot/commands/vac.ts`
- `src/bot/commands/sticky-message.ts`
- `src/bot/commands/member-log-config.ts`
- `src/bot/commands/message-delete.ts`
- `src/bot/commands/vc-recruit-config.ts`
- `src/bot/utils/commandLoader.ts` ← `commands/` ディレクトリを自動スキャンして動的ロード
- `src/shared/utils/messageResponse.ts`

---

### 🎪 実装済みイベント

| イベント            | 説明                                     | 状態 | 備考     |
| ------------------- | ---------------------------------------- | ---- | -------- |
| `clientReady`       | Bot起動処理                              | ✅   | 完全実装 |
| `interactionCreate` | インタラクション処理                     | ✅   | 完全実装 |
| `messageCreate`     | メッセージ作成（Bump検知・sticky再送信） | ✅   | 完全実装 |
| `voiceStateUpdate`  | VAC自動作成・自動削除 / VC募集空き検知   | ✅   | 完全実装 |
| `channelDelete`     | VAC設定同期 / VC募集ペアチャンネル削除   | ✅   | 完全実装 |
| `messageDelete`     | VC募集パネルメッセージ削除時の整合性保全 | ✅   | 完全実装 |
| `guildMemberAdd`    | メンバー参加通知（メンバーログ）         | ✅   | 完全実装 |
| `guildMemberRemove` | メンバー退出通知（メンバーログ）         | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/events/clientReady.ts`
- `src/bot/events/interactionCreate.ts`
- `src/bot/events/messageCreate.ts`
- `src/bot/events/voiceStateUpdate.ts`
- `src/bot/events/channelDelete.ts`
- `src/bot/events/messageDelete.ts`
- `src/bot/events/guildMemberAdd.ts`
- `src/bot/events/guildMemberRemove.ts`
- `src/bot/utils/eventLoader.ts` ← `events/` ディレクトリを自動スキャンして動的ロード
- `src/bot/handlers/interactionCreate/ui/buttons.ts`
- `src/bot/handlers/interactionCreate/ui/modals.ts`
- `src/bot/handlers/interactionCreate/ui/selectMenus.ts`

---

### 🔧 実装済みサービス

| サービス                   | 説明                                        | 状態 | 備考     |
| -------------------------- | ------------------------------------------- | ---- | -------- |
| CooldownManager            | コマンドクールダウン管理                    | ✅   | 完全実装 |
| BumpReminderService        | Bumpリマインダースケジューラー管理          | ✅   | 完全実装 |
| messageResponse            | Embedメッセージユーティリティ               | ✅   | 完全実装 |
| VacControlPanel            | VAC操作パネル送信ユーティリティ             | ✅   | 完全実装 |
| StickyMessageResendService | スティッキーメッセージ再送信（デバウンス）  | ✅   | 完全実装 |
| MemberLogConfigService     | メンバーログ設定管理                        | ✅   | 完全実装 |
| MessageDeleteService       | メッセージ削除実行ロジック                  | ✅   | 完全実装 |
| VcRecruitConfigService     | VC募集設定管理（setup/teardown/ロール管理） | ✅   | 完全実装 |

**関連ファイル**:

- `src/bot/services/cooldownManager.ts`
- `src/bot/services/botEventRegistration.ts`
- `src/bot/services/botCompositionRoot.ts`
- `src/bot/features/vac/handlers/ui/vacControlPanel.ts`
- `src/shared/features/bump-reminder/bumpReminderConfigService.ts`
- `src/shared/features/member-log/memberLogConfigService.ts`
- `src/bot/features/message-delete/services/messageDeleteService.ts`
- `src/shared/utils/messageResponse.ts`

---

### 🗄️ データベーススキーマ

#### 実装済みテーブル（2026-03-13 機能別テーブルに再設計）

> `GuildConfig` の JSON カラム（`afkConfig` / `vacConfig` / `bumpReminderConfig` / `memberLogConfig`）は廃止済み。機能別専用テーブルに分割。

**GuildConfig**（ロケールのみ保持）

```prisma
model GuildConfig {
  id        String   @id @default(cuid())
  guildId   String   @unique
  locale    String   @default("ja")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("guild_configs")
}
```

**GuildAfkConfig**（新規）

```prisma
model GuildAfkConfig {
  guildId   String  @id @map("guild_id")
  enabled   Boolean @default(false)
  channelId String? @map("channel_id")

  @@map("guild_afk_configs")
}
```

**GuildBumpReminderConfig**（新規）

```prisma
model GuildBumpReminderConfig {
  guildId        String  @id @map("guild_id")
  enabled        Boolean @default(false)
  channelId      String? @map("channel_id")
  mentionRoleId  String? @map("mention_role_id")
  mentionUserIds String  @default("[]") @map("mention_user_ids") // JSON: string[]

  @@map("guild_bump_reminder_configs")
}
```

**GuildVacConfig**（新規）

```prisma
model GuildVacConfig {
  guildId           String  @id @map("guild_id")
  enabled           Boolean @default(false)
  triggerChannelIds String  @default("[]") @map("trigger_channel_ids") // JSON: string[]
  createdChannels   String  @default("[]") @map("created_channels")    // JSON: VacChannelPair[]

  @@map("guild_vac_configs")
}
```

**GuildMemberLogConfig**（新規）

```prisma
model GuildMemberLogConfig {
  guildId      String  @id @map("guild_id")
  enabled      Boolean @default(false)
  channelId    String? @map("channel_id")
  joinMessage  String? @map("join_message")
  leaveMessage String? @map("leave_message")

  @@map("guild_member_log_configs")
}
```

**GuildVcRecruitConfig**（再設計）

```prisma
model GuildVcRecruitConfig {
  guildId        String  @id @map("guild_id")
  enabled        Boolean @default(false)
  mentionRoleIds String  @default("[]") @map("mention_role_ids") // JSON: string[]
  setups         String  @default("[]")                          // JSON: VcRecruitSetup[]

  @@map("guild_vc_recruit_configs")
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

**StickyMessage**

```prisma
model StickyMessage {
  id            String   @id @default(cuid())
  guildId       String   @map("guild_id")
  channelId     String   @unique @map("channel_id")
  content       String
  embedData     String?  @map("embed_data") // JSON文字列
  updatedBy     String?  @map("updated_by") // 最終設定・更新者の Discord ユーザーID
  lastMessageId String?  @map("last_message_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([guildId])
  @@map("sticky_messages")
}
```

---

## 📋 未実装機能

以下は仕様書が作成済みで、実装待ちの機能です。

### ⚙️ ギルド設定機能

**状態**: 📋 仕様書作成済み、実装待ち

**仕様書**: [docs/specs/GUILD_CONFIG_SPEC.md](../specs/GUILD_CONFIG_SPEC.md)

**注記**: データ層（`IBaseGuildRepository.updateLocale` / `getLocale` / `LocaleManager.invalidateLocaleCache`）は実装済み。コマンド層のみ未実装。

**実装予定内容**:

- `/guild-config set-locale` — サーバーのロケール設定（`ja` / `en`）
- `/guild-config view` — 8ページパネル（概要＋各機能設定）、ページネーションボタン＋セレクトメニュー
- `/guild-config reset` — 全設定をリセット（確認ダイアログ付き）
- インタラクションハンドラー（ボタン / セレクトメニュー / リセット確認）

---

### 🔧 基本コマンド

**状態**: 🚧 一部実装済み（`/ping` のみ）

**仕様書**: [docs/specs/BASIC_COMMANDS_SPEC.md](../specs/BASIC_COMMANDS_SPEC.md)

**実装済み**:

- `/ping` ✅ — APIレイテンシ・WSping表示（クールダウン 5秒）

**実装予定内容**:

- `/help` — カテゴリ別コマンド一覧 Embed ＋ユーザーマニュアルリンク（ephemeral）
- `/server-info` — サーバー情報 Embed（名前・ID・オーナー・メンバー数・作成日・認証レベル・Boostなど）
- `/user-info` — ユーザー情報 Embed（対象ユーザー省略可、username・ID・作成日・参加日・ロール一覧など）

---

## 📊 実装統計

### コードベース統計

- **総ファイル数**: ~120+
- **TypeScriptファイル**: ~100+（index.ts 撤廃によりバレルファイルを削減済み）
- **総行数**: ~10000+ 行

### コンポーネント統計

| コンポーネント | 実装済み | 未実装 | 合計 |
| -------------- | -------- | ------ | ---- |
| コマンド       | 10       | 4      | 14   |
| イベント       | 8        | 0      | 8    |
| サービス       | 8        | 0      | 8    |
| リポジトリ     | 7        | 0      | 7    |
| ユーティリティ | 12       | 1      | 13   |

---

## 🔗 関連ドキュメント

- [README.md](../../README.md) - プロジェクト概要
- [TODO.md](../../TODO.md) - タスク管理・残件リスト
- [TEST_PROGRESS.md](TEST_PROGRESS.md) - テスト実装進捗
- [TESTING_GUIDELINES.md](../guides/TESTING_GUIDELINES.md) - テスト方針
- [ARCHITECTURE.md](../guides/ARCHITECTURE.md) - アーキテクチャ・設計概要
- [XSERVER_VPS_SETUP.md](../guides/XSERVER_VPS_SETUP.md) - VPS セットアップ
- [DEPLOYMENT.md](../guides/DEPLOYMENT.md) - GitHub Actions デプロイフロー
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
- [VC_RECRUIT_SPEC.md](../specs/VC_RECRUIT_SPEC.md) - VC募集機能
