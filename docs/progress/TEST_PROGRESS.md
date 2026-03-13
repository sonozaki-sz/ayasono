# テスト実装進捗

> テストの実装状況と今後の計画

最終更新: 2026年3月14日

**関連**: [TODO.md](../../TODO.md) - タスク管理 | [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) - 実装進捗

---

## 📊 現在のテスト状況

### 最新テスト実行結果（2026年3月14日）

- ✅ **全テスト PASSED**: 1361/1361
- ✅ **全スイート PASSED**: 189/189
- ⏱️ **実行時間**: ~4秒
- 📦 **カバレッジ（global）**: statements 98.92% / branches 97.89% / functions 95.63% / lines 99.07%
- ✅ **カバレッジしきい値**: `{ branches: 94, functions: 88, lines: 95, statements: 95 }`（`vitest.config.ts` 設定済み / 全クリア）

### カバレッジ除外対象（vitest.config.ts）

除外の正確なリストは `vitest.config.ts` の `coverage.exclude` が唯一の情報源。現在の主な除外対象:

| 除外ファイル / パターン | 理由 |
| --- | --- |
| `src/**/*.d.ts` | 型宣言ファイル（実行コードなし） |
| `src/**/main.ts` / `src/**/server.ts` | エントリーポイント（プロセス起動のみ） |
| `src/bot/handlers/interactionCreate/ui/types.ts` | 型定義のみ（実行コードなし） |
| `src/shared/errors/errorHandler.ts` | 再エクスポートのみ（実行文なし） |
| `src/bot/features/**/repositories/*.ts` | Prisma 委譲のみ、独自ロジックなし |
| `src/shared/database/repositories/guildConfigRepository.ts` | 集約リポジトリ、委譲のみ |
| `src/bot/features/bump-reminder/repositories/usecases/*.ts` | 単一 Prisma 呼び出しのみ |
| `src/bot/services/botCompositionRoot.ts` | DI 配線のみ、ロジックなし |
| `src/bot/handlers/index.ts` / `ui/buttons.ts` 等 | 配列エクスポートのみ |

---

## 📋 主な追加テストファイル

### DBアーキテクチャ刷新対応（2026-03-13）

GuildConfig JSON カラム廃止・機能別専用テーブル化に伴うリポジトリテスト追加:

| ファイル | 対象 |
| --- | --- |
| `tests/unit/shared/database/repositories/afkConfigRepository.test.ts` | AfkConfig リポジトリ |
| `tests/unit/shared/database/repositories/bumpReminderConfigRepository.test.ts` | BumpReminderConfig リポジトリ |
| `tests/unit/shared/database/repositories/memberLogConfigRepository.test.ts` | MemberLogConfig リポジトリ |
| `tests/unit/shared/database/repositories/vacConfigRepository.test.ts` | VacConfig リポジトリ |
| `tests/unit/shared/database/repositories/vcRecruitConfigRepository.test.ts` | VcRecruitConfig リポジトリ |

### VC募集機能（2026-03-13）

| ファイル | 対象 |
| --- | --- |
| `vcRecruitConfigCommand.execute.test.ts` | コマンド実行ルーター |
| `vcRecruitConfigAddRole.test.ts` | add-role ユースケース |
| `vcRecruitConfigRemoveRole.test.ts` | remove-role ユースケース |
| `vcRecruitConfigSetup.test.ts` | setup ユースケース |
| `vcRecruitConfigTeardown.test.ts` | teardown ユースケース |
| `vcRecruitConfigView.test.ts` | view ユースケース |
| `vcRecruitButton.panel.test.ts` / `teardown.test.ts` | ボタンハンドラ |
| `vcRecruitModal.test.ts` | モーダルハンドラ |
| `vcRecruitStringSelect.test.ts` | セレクトメニューハンドラ |
| `vcRecruitVoiceStateUpdate.test.ts` | 音声状態ハンドラ |
| `vcRecruitChannelDeleteHandler.test.ts` | チャンネル削除ハンドラ |
| `vcRecruitMessageDeleteHandler.test.ts` | メッセージ削除ハンドラ |
| `vcRecruitConfigService.test.ts` (shared) | 設定サービス |

### メッセージ削除機能 V2（2026-03-13）

`/message-delete-config` コマンドおよびユーザー設定機能を廃止し、2段階確認フローに刷新:

| ファイル | 対象 |
| --- | --- |
| `messageDeleteCommand.execute.test.ts` | コマンド実行ルーター（V2） |
| `messageDeleteEmbedBuilder.test.ts` | Embed ビルダー |
| `validateOptions.test.ts` | オプションバリデーション |
| `buildTargetChannels.test.ts` | 対象チャンネル生成 |
| `runScanPhase.test.ts` | Phase 1 スキャン |
| `runPreviewDialog.test.ts` | Phase 2 プレビューダイアログ |
| `runFinalConfirmDialog.test.ts` | Phase 3 最終確認ダイアログ |
| `runDeleteExecution.test.ts` | Phase 4 削除実行 |
| `dialogUtils.test.ts` | ダイアログユーティリティ |

### メンバーログ機能（2026-03-01）

| ファイル | 対象 |
| --- | --- |
| `member-log-config.test.ts` (commands) | コマンドファイル |
| `memberLogConfigCommand.execute.test.ts` | コマンド実行ルーター |
| `memberLogConfigCommand.enable.test.ts` | enable ハンドラ |
| `memberLogConfigCommand.disable.test.ts` | disable ハンドラ |
| `memberLogConfigCommand.setChannel.test.ts` | set-channel ハンドラ |
| `memberLogConfigCommand.setJoinMessage.test.ts` | set-join-message ハンドラ |
| `memberLogConfigCommand.setLeaveMessage.test.ts` | set-leave-message ハンドラ |
| `memberLogConfigCommand.view.test.ts` | view ハンドラ |
| `memberLogConfigCommand.guard.test.ts` | 権限ガード |
| `guildMemberAddHandler.test.ts` | 参加イベントハンドラ |
| `guildMemberRemoveHandler.test.ts` | 退出イベントハンドラ |
| `accountAge.test.ts` | 年齢計算ユーティリティ |
| `memberLogConfigService.test.ts` (shared) | 設定サービス |

### メッセージ固定機能（2026-02-25）

| ファイル | 対象 |
| --- | --- |
| `stickyMessageRemove.test.ts` | 削除ユースケース |
| `stickyMessageSet.test.ts` | 設定ユースケース |
| `stickyMessageUpdate.test.ts` | 更新ユースケース |
| `stickyMessageView.test.ts` | 閲覧ユースケース |
| `stickyMessageCreateHandler.test.ts` | 作成ハンドラ |
| `sticky-message.test.ts` (commands) | コマンドファイル |
| `stickyMessageCommand.execute.test.ts` | コマンド実行 |
| `stickyMessageSetModalHandler.test.ts` | Set モーダルハンドラ |
| `stickyMessageSetEmbedModalHandler.test.ts` | Set Embed モーダルハンドラ |
| `stickyMessageUpdateModalHandler.test.ts` | Update モーダルハンドラ |
| `stickyMessageUpdateEmbedModalHandler.test.ts` | Update Embed モーダルハンドラ |
| `stickyMessageViewSelectHandler.test.ts` | View セレクトハンドラ |
| `stickyMessageConfigService.test.ts` (shared) | 設定サービス |
| `stickyMessageChannelDeleteHandler.test.ts` | チャンネル削除ハンドラ |

### src↔tests マッピング監査クローズ（2026年2月21日）

- `src` 対称マッピング監査の残件は **0件としてクローズ**
- `src/**/*.d.ts`（例: `src/shared/locale/i18next.d.ts`）は監査対象外に統一
- 根拠: 宣言ファイルは Vitest 実行対象ではなく、`*.test.ts` との1:1対応を要求しない

### モジュール別カバレッジ

| モジュール             | カバレッジ | 状態 |
| ---------------------- | ---------- | ---- |
| メッセージレスポンス   | 100%       | ✅   |
| CustomErrors           | 100%       | ✅   |
| CooldownManager        | 100%       | ✅   |
| GuildConfigRepository  | 100%       | ✅   |
| Logger                 | 100%       | ✅   |
| Environment Config     | 100%       | ✅   |
| ErrorHandler           | 100%       | ✅   |
| BumpReminderRepository | 100%       | ✅   |
| BumpReminderService    | 100%       | ✅   |
| StickyMessage (all)    | 100%       | ✅   |
| MemberLog (all)        | 100%       | ✅   |
| MessageDelete V2 (all) | 100%       | ✅   |
| VcRecruit (all)        | 100%       | ✅   |
| 機能別 ConfigRepository | 100%      | ✅   |

---

## 🎯 今後のテスト拡張

### 後続フェーズ（1-2ヶ月）🟡

#### Locale（多言語対応テスト）

- [ ] **翻訳の完全性テスト**
  - すべてのキーが定義されているか
  - プレースホルダーの一貫性

#### Web Routes（Web APIテスト）

- [ ] **ギルド管理API**（Web UI 実装解凍後）
  - 認証とアクセス制御
  - CRUD操作・バリデーション

※ `health` / `ready` ルートは実装済み（`tests/unit/web/routes/health.test.ts`）。

---

### 長期フェーズ（機能安定後）🟢

#### E2E テスト

- [ ] **主要ユーザーフローの検証**
  - コマンド実行から DB 保存までの完全フロー
  - イベント処理の完全フロー
  - エラーリカバリーフロー

---

## 📈 カバレッジ目標

### 現在の設定（vitest.config.ts）

```json
{ "branches": 94, "functions": 88, "lines": 95, "statements": 95 }
```

### 短期目標（継続中）

- **全体カバレッジ**: ✅ 全閾値クリア（statements 98.92% / branches 97.89% / functions 95.63% / lines 99.07%）
- **新機能**: 実装と同時にテスト作成（方針継続）

### 中長期目標

- **統合テスト**: 主要フローをカバー
- **E2Eテスト**: 基本的なユーザーフローを実装（VC募集・基本コマンド実装完了後）

---

## 🏆 マイルストーン

### Phase 1: コアモジュールの完全カバー ✅

- [x] エラーハンドリング
- [x] データベース基盤
- [x] ロガー
- [x] 環境設定
- [x] クールダウン管理

### Phase 2: Bot機能のテスト ✅

- [x] コマンドのテスト（/ping, /afk, /afk-config, /vac, /vac-config, /bump-reminder-config）
- [x] イベントのテスト（clientReady, interactionCreate, messageCreate, voiceStateUpdate, channelDelete, messageDelete, guildMemberAdd, guildMemberRemove）
- [x] スケジューラーのテスト（JobScheduler, VACハンドラ, Bumpハンドラ）
- [x] sticky-message 全機能のユニットテスト
- [x] メンバーログ機能のユニットテスト
- [x] メッセージ削除機能 V2 のユニットテスト
- [x] VC募集機能のユニットテスト（40件以上）
- [x] DBアーキテクチャ刷新対応（機能別 ConfigRepository テスト追加）
- **完了**: 2026年3月13日

### Phase 3: Web UIと統合テスト

- [ ] Web APIのテスト（Web UI 実装解凍後）
- [ ] 統合テストの拡充
- [ ] E2Eテストの基盤構築
- **目標**: Web UI 実装再開後

### Phase 4: E2Eテスト

- [ ] VAC / Bumpリマインダー / VC募集機能の基本フロー
- [ ] パフォーマンステスト実装
- **目標**: E2Eテスト着手マイルストーン時

---

## 🔗 関連ドキュメント

- [TESTING_GUIDELINES.md](../guides/TESTING_GUIDELINES.md) - テスト方針・ガイドライン
- [TODO.md](../../TODO.md) - 開発タスク一覧
