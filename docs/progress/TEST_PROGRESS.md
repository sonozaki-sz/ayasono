# テスト実装進捗

> テストの実装状況と今後の計画

最終更新: 2026年3月2日

**関連**: [TODO.md](../../TODO.md) - タスク管理 | [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) - 実装進捗

---

## 📊 現在のテスト状況

### 最新テスト実行結果（2026年3月2日）

- ✅ **全テスト PASSED**: 1276/1276
- ✅ **全スイート PASSED**: 232/232
- ⏱️ **実行時間**: ~4秒
- 📦 **カバレッジ（global）**: statements 100% / functions 100% / lines 100% / branches 99.16%
- 🎯 **ブランチ残差0.84%**: v8が async/await を Generator 変換する際に生成する内部追跡ブランチのアーティファクトに加え、意味上到達不能な防御的分岐（`stickyMessage{Set,Update}EmbedModalHandler` 内の空文字列フォールバック等）は `/* c8 ignore */` で除外済み
- ✅ **カバレッジしきい値**: `branches: 99, functions: 100, lines: 100, statements: 100`（`vitest.config.ts` 設定済み / 全クリア）

### ✅ カバレッジ100% 作業ステータス（完了）

- **最終達成日**: 2026年3月2日（branches 閾値厳格化対応含む）
- **結果**: statements 100% / functions 100% / lines 100% / branches 99.16%
- **`vitest.config.ts` thresholds**: `{ branches: 99, functions: 100, lines: 100, statements: 100 }` 設定済み
- **除外ファイル（型専用/再エクスポートのみ）**:
  - `src/shared/database/stores/usecases/bumpReminderStoreContext.ts`
  - `src/bot/features/bump-reminder/repositories/types.ts`
  - `src/bot/features/sticky-message/repositories/types.ts`
  - `src/bot/handlers/interactionCreate/ui/types.ts`
  - `src/shared/errors/errorHandler.ts`

**カバレッジ閾値修正対応（2026-03-02）**

`vitest.config.ts` の `branches: 99, statements: 100` 閾値を達成するため以下を実施:

| 対象ファイル | 対応内容 |
| --- | --- |
| `src/shared/errors/processErrorHandler.ts` | `IGNORED_DEPRECATION_CODES` が空 Set のため到達不能な if ブロックを `/* c8 ignore start/stop */` で除外 |
| `src/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler.ts` | 入力ガードにより到達不能な `??　""` フォールバックを `/* c8 ignore next */` で除外 |
| `src/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler.ts` | 同上 |
| `src/bot/utils/eventLoader.ts` | `if (key === "default") continue` をリファクタして `if (key !== "default" && isBotEvent(...))` に一本化し uncovered statement を解消 |
| `tests/unit/bot/commands/index.test.ts` | ENOENT / ENOTDIR ケースのテスト追加 |
| `tests/unit/bot/events/index.test.ts` | ENOENT / ENOTDIR ケースのテスト追加 |
| `tests/unit/bot/features/member-log/handlers/guildMemberRemoveHandler.test.ts` | `joinedTimestamp: undefined` ケースのテスト追加（`?? 0` ブランチ到達） |
| `tests/unit/bot/features/message-delete/commands/messageDeleteCommand.execute.test.ts` | `allChannels` に `null` チャンネルを含むケースのテスト追加 |
| `tests/unit/bot/features/bump-reminder/handlers/usecases/sendBumpReminder.test.ts` | finally 内で再 fetch したチャンネルが `null` のケースのテスト追加 |

---

**主な追加テストファイル（2026-02-25）**

| ファイル                                       | 対象                     |
| ---------------------------------------------- | ------------------------ |
| `stickyMessagePayloadBuilder.test.ts`          | ペイロードビルダー       |
| `stickyMessageResendService.test.ts`           | 再送サービス             |
| `stickyMessageRepository.test.ts`              | リポジトリ               |
| `stickyMessageConfigService.test.ts` (shared)  | 設定サービス             |
| `botStickyMessageDependencyResolver.test.ts`   | DI解決                   |
| `stickyMessageCreateHandler.test.ts`           | 作成ハンドラ             |
| `sticky-message.test.ts` (commands)            | コマンドファイル         |
| `stickyMessageCommand.execute.test.ts`         | コマンド実行             |
| `stickyMessageRemove.test.ts`                  | 削除ユースケース         |
| `stickyMessageSet.test.ts`                     | 設定ユースケース         |
| `stickyMessageUpdate.test.ts`                  | 更新ユースケース         |
| `stickyMessageView.test.ts`                    | 閲覧ユースケース         |
| `stickyMessageSetModalHandler.test.ts`         | SetModalハンドラ         |
| `stickyMessageSetEmbedModalHandler.test.ts`    | SetEmbedModalハンドラ    |
| `stickyMessageUpdateModalHandler.test.ts`      | UpdateModalハンドラ      |
| `stickyMessageUpdateEmbedModalHandler.test.ts` | UpdateEmbedModalハンドラ |
| `stickyMessageViewSelectHandler.test.ts`       | ViewSelectハンドラ       |

### 主要追加テストファイル（2026-03-01）

**メンバーログ機能（+13ファイル）**

| ファイル                                         | 対象                      |
| ------------------------------------------------ | ------------------------- |
| `member-log-config.test.ts` (commands)           | コマンドファイル          |
| `memberLogConfigCommand.execute.test.ts`         | コマンド実行ルーター      |
| `memberLogConfigCommand.enable.test.ts`          | enableハンドラ            |
| `memberLogConfigCommand.disable.test.ts`         | disableハンドラ           |
| `memberLogConfigCommand.setChannel.test.ts`      | set-channelハンドラ       |
| `memberLogConfigCommand.setJoinMessage.test.ts`  | set-join-messageハンドラ  |
| `memberLogConfigCommand.setLeaveMessage.test.ts` | set-leave-messageハンドラ |
| `memberLogConfigCommand.view.test.ts`            | viewハンドラ              |
| `memberLogConfigCommand.guard.test.ts`           | 権限ガード                |
| `guildMemberAddHandler.test.ts`                  | 参加イベントハンドラ      |
| `guildMemberRemoveHandler.test.ts`               | 退出イベントハンドラ      |
| `accountAge.test.ts`                             | 年齢計算ユーティリティ    |
| `memberLogConfigService.test.ts` (shared)        | 設定サービス              |

**メッセージ削除機能（+9ファイル）**

| ファイル                                           | 対象                 |
| -------------------------------------------------- | -------------------- |
| `message-delete.test.ts` (commands)                | コマンドファイル     |
| `message-delete-config.test.ts` (commands)         | 設定コマンドファイル |
| `messageDeleteCommand.execute.test.ts`             | コマンド実行ルーター |
| `messageDeleteConfigCommand.execute.test.ts`       | 設定コマンド実行     |
| `messageDeleteEmbedBuilder.test.ts`                | Embedビルダー        |
| `messageDeleteConstants.test.ts`                   | 定数定義             |
| `messageDeleteUserSettingRepository.test.ts`       | リポジトリ           |
| `messageDeleteService.test.ts`                     | 削除サービス         |
| `messageDeleteUserSettingService.test.ts` (shared) | 設定サービス         |

### src↔tests マッピング監査クローズ（2026年2月21日）

- `src` 対称マッピング監査の残件は **0件としてクローズ**
- `src/**/*.d.ts`（例: `src/shared/locale/i18next.d.ts`）は監査対象外に統一
- 根拠: 宣言ファイルは Vitest 実行対象ではなく、`*.test.ts` との1:1対応を要求しない

### モジュール別カバレッジ

| モジュール             | カバレッジ | 状態 | テスト数 |
| ---------------------- | ---------- | ---- | -------- |
| メッセージレスポンス   | 100%       | ✅   | 17       |
| CustomErrors           | 100%       | ✅   | 19       |
| CooldownManager        | 100%       | ✅   | 22       |
| GuildConfigRepository  | 100%       | ✅   | 30       |
| Logger                 | 100%       | ✅   | 15       |
| Environment Config     | 100%       | ✅   | 11       |
| ErrorHandler           | 100%       | ✅   | 14       |
| BumpReminderRepository | 100%       | ✅   | 26       |
| BumpReminderService    | 100%       | ✅   | 21       |
| StickyMessage (all)    | 100%       | ✅   | 100+     |
| MemberLog (all)        | 100%       | ✅   | 100+     |
| MessageDelete (all)    | 100%       | ✅   | 60+      |

**注**: 全実装済みモジュールのカバレッジは 100%（statements/functions/lines）達成済み。残差 branches 0.72% は v8 async 内部ブランチのアーティファクトのみです。

---

## 🎯 今後のテスト拡張

### 後続フェーズ（1-2ヶ月）🟡

基盤テストの整備後に拡張する領域。

#### Locale（多言語対応テスト）

- [ ] **LocaleManager**
  - 言語切り替え
  - フォールバック処理
  - コマンドローカライゼーション自動生成

- [ ] **翻訳の完全性テスト**
  - すべてのキーが定義されているか
  - プレースホルダーの一貫性
  - 複数形対応

#### Web Routes（Web APIテスト）

- [ ] **ギルド管理API**
  - 認証とアクセス制御
  - CRUD操作
  - バリデーション
  - エラーレスポンス

※ `health` / `ready` ルートは実装済み（`tests/unit/web/routes/health.test.ts`）。

#### Repositories（リポジトリテスト）

- [x] **StickyMessage リポジトリ**（`stickyMessageRepository.test.ts`）
- [ ] **将来のリポジトリ**
  - VAC関連
  - その他機能拡張に伴うリポジトリ

---

### 長期フェーズ（機能安定後）🟢

運用最適化・品質保証を強化する領域。

#### E2E テスト

- [ ] **主要ユーザーフローの検証**
  - コマンド実行からDB保存までの完全フロー
  - イベント処理の完全フロー
  - エラーリカバリーフロー

- [ ] **実際のDiscord環境での動作確認**
  - テストサーバーでの自動テスト
  - 主要機能の動作検証

#### パフォーマンステスト

- [ ] **負荷テスト**
  - 大量コマンド実行
  - 大量データ処理
  - メモリリーク検証

- [ ] **ベンチマーク**
  - 応答時間の測定
  - スループットの測定
  - リソース使用量の測定

---

## 📈 カバレッジ目標

### 短期目標（1-2ヶ月）

- **全体カバレッジ**: ✅ **100%達成**（statements/functions/lines）、branches 99.28%
- **コアモジュール**: ✅ 全モジュール 100%
- **新機能**: 実装と同時にテスト作成（方針継続）

### 中期目標（3-6ヶ月）

- **統合テスト**: 主要フローをカバー
- **E2Eテスト**: 基本的なユーザーフローを実装

### 長期目標

- **E2Eテスト**: 包括的なカバレッジ
- **パフォーマンステスト**: 継続的な監視

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
- [x] イベントのテスト（clientReady, interactionCreate, messageCreate, voiceStateUpdate, channelDelete）
- [x] スケジューラーのテスト（JobScheduler, VACハンドラ, Bumpハンドラ）
- [x] sticky-message 全機能のユニットテスト（17ファイル新規作成）
- [x] メンバーログ機能のユニットテスト（13ファイル新規作成）
- [x] メッセージ削除機能のユニットテスト（9ファイル新規作成）
- **目標**: 2026年3月末 → **完了**: 2026年3月1日

### Phase 2.5: カバレッジ100%達成 ✅

- [x] 全モジュールの statements/functions/lines 100%
- [x] v8 thresholds 設定 `{ branches: 99, functions: 100, lines: 100, statements: 100 }`
- [x] 型専用ファイル5件を coverage.exclude に追加
- [x] 到達不能ブランチへの `/* c8 ignore */` 適用 + テスト追加による branches 閾値維持（2026-03-02）
- **完了**: 2026年3月2日（継続的維持）

### Phase 3: Web UIと統合テスト

- [ ] Web APIのテスト
- [ ] 統合テストの拡充
- [ ] E2Eテストの基盤構築
- **目標**: 2026年5月末

### Phase 4: 完全なテストカバレッジ ✅（単体テスト達成）

- [x] 全機能の**単体テスト**完了（statements/functions/lines 100%）
- [ ] パフォーマンステスト実装
- [ ] CI/CDでの継続的なテスト実行
- **目標**: 2026年7月末（E2E / パフォーマンス等の残タスク）

---

## 📝 メモ

### テスト実装時の注意点

1. **テストファーストを心がける**
   - 新機能は可能な限りTDDで開発
   - バグ修正時は再現テストを先に書く

2. **メンテナンス性を重視**
   - ヘルパー関数を積極的に活用
   - テストコードも品質を保つ

3. **実行速度に注意**
   - 遅いテストは並列化を検討
   - 統合テストは必要最小限に

4. **継続的な改善**
   - カバレッジレポートを定期的に確認
   - 低カバレッジのモジュールを優先的にテスト

---

## 🔗 関連ドキュメント

- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md) - テスト方針・ガイドライン
- [TODO.md](../TODO.md) - 開発タスク一覧
