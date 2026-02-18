# Guild Management Bot v2 - TODO

> 開発タスク一覧

最終更新: 2026年2月18日

---

## 📊 現在の進捗状況

### ✅ 完了項目

#### 環境構築・インフラ

- [x] プロジェクトセットアップ（pnpm、TypeScript、ESLint、Prettier）
- [x] VSCode開発環境設定（settings、launch、tasks）
- [x] Prismaセットアップとスキーマ定義
- [x] テストインフラ整備（Jest、ユニット/インテグレーションテスト構造）
- [x] i18next多言語対応システム実装
- [x] コマンドローカライゼーション自動生成機能（LocaleManager、commandLocalizations）

#### コア機能

- [x] Discord Bot基盤（client.ts、イベントシステム）
- [x] 環境変数管理（Zod validation）
- [x] エラーハンドリング基盤（CustomErrors、ErrorHandler）
- [x] データベース接続（Prisma Client）
- [x] GuildConfigRepository実装
- [x] JobScheduler + BumpReminderManager実装（スケジューラー機能）
- [x] Webサーバー基本構造（Fastify）
- [x] ヘルスチェックAPI
- [x] Web API基盤（/api/index.ts）

#### 実装済みコマンド

- [x] `/ping` - 疎通確認
- [x] `/afk` - AFKチャンネルへのメンバー移動
- [x] `/afk-config` - AFK機能設定

#### 実装済みイベント

- [x] `clientReady` - Bot起動処理
- [x] `interactionCreate` - インタラクション処理

#### 実装済みサービス

- [x] CooldownManager - コマンドクールダウン管理

#### テスト

- [x] ユニットテスト基盤整備
- [x] 各種サービス・ユーティリティのテスト（87テストケース）
- [x] CooldownManagerテスト（30テストケース）
- [x] CustomErrorsテスト（20テストケース）
- [x] ErrorHandlerテスト（15テストケース）
- [x] loggerテスト（12テストケース）
- [x] env.tsテスト（10テストケース）
- [x] GuildConfigRepositoryインテグレーションテスト（12テストケース）

#### ドキュメント

- [x] DEVELOPMENT_ROADMAP.md - 開発ロードマップ
- [x] TESTING.md - テスト方針
- [x] TEST_SUMMARY.md - テスト結果サマリー
- [x] I18N_GUIDE.md - 多言語対応ガイド
- [x] BUMP_REMINDER_SPEC.md - Bump通知機能仕様
- [x] VAC_SPEC.md - VAC機能仕様
- [x] JOIN_LEAVE_LOG_SPEC.md - 入退出ログ仕様
- [x] MSG_DEL_COMMAND_SPEC.md - メッセージ削除コマンド仕様

---

## 🚧 進行中・未実装項目

### Phase 1: コア機能の完成

#### 1.1 基本コマンド追加

- [ ] `/help` - ヘルプコマンド（全コマンド一覧）
- [ ] `/server-info` - サーバー情報表示
- [ ] `/user-info` - ユーザー情報表示
- [ ] 各コマンドのテスト

#### 1.2 設定コマンド

- [ ] `/config-locale` - ギルド言語設定
- [ ] `/config-view` - 現在の設定表示
- [ ] `/config-reset` - 設定リセット

---

### Phase 2: 主要機能実装

#### 2.1 Bump通知機能

**状況**: スケジューラー基盤（JobScheduler + BumpReminderManager）は実装済み。Bot側の機能実装が必要。

**Bump検知対応サービス:**

- [ ] **Disboard** (`/bump`) - Bot ID: `302050872383242240`
- [ ] **ディス速 (Dissoku)** (`/up`) - Bot ID要確認

**機能実装:**

- [ ] messageCreateイベントハンドラ作成
  - [ ] Disboard `/bump` コマンド検知
  - [ ] ディス速 `/up` コマンド検知
  - [ ] interactionCommandNameベースの判定
  - [ ] BumpReminderManagerとの連携
- [ ] データベース連携
  - [ ] チャンネルID保存
  - [ ] リマインド日時保存
  - [ ] メンション設定保存
  - [ ] Prisma SchemaへのBumpReminder追加
- [ ] Bot再起動時のタイマー復元（重要！）
  - [ ] clientReadyイベントで全ギルドの状態をチェック
  - [ ] 通知時刻を過ぎている場合は即時送信
  - [ ] 未来の場合は残り時間でBumpReminderManagerを再設定
- [ ] リマインダー通知実装
  - [ ] メンションロール設定
  - [ ] 個別ユーザーメンション（ボタンで通知登録）
  - [ ] 通知メッセージ送信
- [ ] UI/UX
  - [ ] Bumpボタン（通知する/通知しない）
  - [ ] 通知登録・解除機能
  - [ ] ステータス表示
- [ ] 設定コマンド `/bump-reminder-config`
  - [ ] `start` - 機能有効化
  - [ ] `stop` - 機能無効化
  - [ ] `set-mention` - メンションロール設定
  - [ ] `show` - 現在の設定表示
- [ ] 重複防止機構（同時複数Bump対策）
- [ ] テスト実装

#### 2.2 スティッキーメッセージ

- [ ] メッセージ固定コマンド `/sticky-message`
- [ ] 自動再送信ロジック（messageCreateイベント）
- [ ] 管理コマンド（追加/削除/一覧）
- [ ] データベース保存（Prisma Schema更新）
- [ ] テスト実装

#### 2.3 VAC（ボイスチャンネル自動作成）

**状況**: 仕様書（VAC_SPEC.md）作成済み。実装が必要。

**基本機能:**

- [ ] voiceStateUpdateイベントハンドラ作成
- [ ] トリガーチャンネル（CreateVC）監視
- [ ] 入室時に専用VCを動的作成
- [ ] 作成者に`ManageChannels`権限付与（Discord標準UIで設定変更可能）
- [ ] 空チャンネル自動削除
- [ ] デフォルト設定（`{ユーザー名}'s Room`）

**操作パネル機能:**

- [ ] 作成されたVCのテキストチャンネルに操作パネル設置
- [ ] パネルからのAFKチャンネル移動（User Select Menu）
- [ ] ボタンUI実装

**コマンド機能:**

- [ ] `/vac-config create-trigger` - トリガーチャンネル作成
- [ ] `/vac-config remove-trigger` - トリガーチャンネル削除
- [ ] `/vac-config show` - 設定表示

**データベース:**

- [ ] Prisma SchemaへのVAC関連テーブル追加
- [ ] VACトリガーチャンネルID保存
- [ ] 作成されたVCリスト管理
- [ ] テスト実装

#### 2.4 メンバー加入・脱退通知

**状況**: 仕様書（JOIN_LEAVE_LOG_SPEC.md）作成済み。実装が必要。

**基本機能:**

- [ ] guildMemberAddイベントハンドラ作成
- [ ] guildMemberRemoveイベントハンドラ作成

**通知機能:**

- [ ] 通知メッセージ送信
- [ ] メンバー情報パネル表示
  - [ ] ユーザー名・ID
  - [ ] アカウント作成日
  - [ ] サーバー参加日
  - [ ] アバター表示
- [ ] Embedフォーマット

**設定機能:**

- [ ] `/join-leave-log-config` - 設定コマンド
  - [ ] `set-channel` - 通知チャンネル設定
  - [ ] `enable` - 機能有効化
  - [ ] `disable` - 機能無効化
  - [ ] `show` - 現在の設定表示

**データベース:**

- [ ] Prisma Schema更新
- [ ] 通知チャンネルID保存
- [ ] 有効/無効フラグ
- [ ] テスト実装

#### 2.5 プロフィールチャンネル

- [ ] messageCreateイベントでプロフィールメッセージ検知
- [ ] メッセージフォーマット検証
- [ ] 設定コマンド `/prof-channel-config`
- [ ] データベース保存
- [ ] テスト実装

#### 2.6 モデレーション機能

**状況**: 仕様書（MSG_DEL_COMMAND_SPEC.md）作成済み。実装が必要。

**メッセージ削除コマンド:**

- [ ] `/msg-del` コマンド実装
  - [ ] `user` オプション - 特定ユーザーのメッセージ削除
  - [ ] `count` オプション - 削除件数指定（1-100）
  - [ ] `channel` オプション - 対象チャンネル指定（省略時は実行チャンネル）
- [ ] 権限チェック（MANAGE_MESSAGES権限必須）
- [ ] 削除実行ログ
- [ ] 削除完了通知（一時メッセージ）
- [ ] エラーハンドリング
- [ ] テスト実装

---

### Phase 3: Web UI実装

**状況**: Fastifyサーバー基盤、ヘルスチェックAPI、/api/index.tsは実装済み。

#### 3.1 認証システム

- [ ] Discord OAuth2統合
- [ ] JWT認証実装
- [ ] セッション管理
- [ ] 権限チェックミドルウェア

#### 3.2 管理API

- [ ] `/api/guilds` - ギルド一覧取得
- [ ] `/api/guilds/:id` - ギルド詳細取得
- [ ] `/api/guilds/:id/config` - 設定取得・更新
- [ ] `/api/guilds/:id/stats` - 統計情報取得
- [ ] バリデーション（Zod）
- [ ] エラーハンドリング

#### 3.3 フロントエンド

- [ ] ダッシュボードUI
- [ ] ギルド設定画面
- [ ] 統計表示画面
- [ ] レスポンシブデザイン
- [ ] 多言語対応（i18next連携）

---

### Phase 4: テスト・品質向上

**状況**: ユニットテスト＋インテグレーションテストで87テストケース実装済み。カバレッジ約31%（主要共有モジュールは十分にテスト済み）。

#### 4.1 テストカバレッジ向上

- [ ] コマンドのユニットテスト追加
- [ ] イベントハンドラーのテスト追加
- [ ] E2Eテスト追加（Discordモック利用）
- [ ] カバレッジ目標70%達成
- [ ] エッジケーステスト
- [ ] JobScheduler・BumpReminderManagerのテスト

#### 4.2 ドキュメント整備

- [ ] API仕様書（OpenAPI/Swagger）
- [ ] コマンドリファレンス（ユーザー向け）
- [ ] デプロイガイド
- [ ] 開発者ガイド
- [ ] 多言語ドキュメント（英語版）

#### 4.3 パフォーマンス最適化

- [ ] データベースクエリ最適化
- [ ] メモリ使用量プロファイリング
- [ ] ログローテーション設定（Winston設定調整）
- [ ] キャッシング戦略

---

### Phase 5: デプロイ・運用

#### 5.1 Docker化

- [ ] 本番用Dockerfile最適化
- [ ] docker-compose.yml改善
- [ ] マルチステージビルド
- [ ] ヘルスチェック設定
- [ ] Prismaマイグレーション自動実行

#### 5.2 CI/CD

- [ ] GitHub Actions ワークフロー
  - [ ] リント・テスト自動実行
  - [ ] Dockerイメージビルド・プッシュ
  - [ ] 自動デプロイ設定
- [ ] デプロイスクリプト作成

#### 5.3 監視・ログ

- [ ] エラー通知（Discord Webhook）
- [ ] ログ集約システム
- [ ] メトリクス収集（プロメテウス等）
- [ ] アラート設定

#### 5.4 バックアップ

- [ ] Prismaデータベース自動バックアップ
- [ ] 復旧手順ドキュメント
- [ ] バックアップテスト

---

## 🎯 優先度別タスク

### 🔴 高優先度（次の1-2週間）

1. **Bump通知機能の完成** - スケジューラー基盤は完成、Bot側実装が必要
   - messageCreateイベントハンドラ
   - データベース連携（Prisma Schema更新）
   - `/bump-reminder-config` コマンド
   - Bot再起動時のタイマー復元
2. **基本コマンド追加** - ユーザビリティ向上（`/help`、`/server-info`、`/user-info`）
3. **テストカバレッジ向上** - コマンド・イベントのテスト、JobScheduler/BumpReminderManagerのテスト

### 🟡 中優先度（1ヶ月以内）

1. **VAC機能** - VC管理の重要機能（仕様書作成済み）
2. **メンバー加入・脱退通知** - モデレーション支援（仕様書作成済み）
3. **モデレーション機能（`/msg-del`）** - 管理者ツール（仕様書作成済み）
4. **Web API拡充** - ギルド管理API（`/api/guilds`等）
5. **スティッキーメッセージ** - アナウンス機能

### 🟢 低優先度（将来的に）

1. **Web UI フロントエンド** - ダッシュボード構築
2. **プロフィールチャンネル** - コミュニティ機能
3. **高度な統計機能** - アナリティクス
4. **カスタムコマンド** - ギルド別拡張
5. **自動モデレーション** - スパム対策
6. **レベルシステム** - ゲーミフィケーション

**注**: AFK機能（`/afk`、`/afk-config`）は基本実装完了。Discord標準のAFK機能があるため、追加の自動検知・移動機能は低優先度。

---

## 🔧 技術的改善タスク

### コード品質

- [ ] 型安全性の向上（`any`型の削減）
- [ ] ESLintルール厳格化
- [ ] コードコメント充実（特に複雑なロジック）
- [ ] 未使用コード・デッドコード削除
- [ ] 一貫性のあるエラーメッセージ（i18n活用）

### アーキテクチャ

- [ ] リポジトリパターン完全実装（他のテーブルにも拡張）
- [ ] 依存性注入の導入検討（Inversify等）
- [ ] サービス層の整理（ビジネスロジック分離）
- [ ] エラーハンドリング統一（CustomErrors活用）

### パフォーマンス

- [ ] Prismaインデックス最適化
- [ ] クエリN+1問題の解消
- [ ] キャッシング戦略実装（Redis検討）
- [ ] メモリリーク調査（長時間稼働テスト）

### セキュリティ

- [ ] 依存関係の脆弱性スキャン（`pnpm audit`）
- [ ] 入力バリデーション強化（Zod活用）
- [ ] レート制限実装（コマンド・API）
- [ ] セキュリティヘッダー設定（Fastify Helmet）

---

## 📝 メモ・検討事項

### 技術スタック改善検討

- **キャッシュ**: Redis導入の検討（GuildConfig、頻繁アクセスデータ）
- **ロガー**: Winston → Pino 移行検討（パフォーマンス改善）
- **テスト**: Jest → Vitest 移行検討（実行速度改善）

### 機能拡張アイデア

- **自動翻訳**: メッセージ自動翻訳機能（DeepL API等）
- **投票システム**: リアクション投票機能
- **ウェルカムメッセージ**: カスタマイズ可能な歓迎メッセージ・画像
- **ロール管理**: 自動ロール付与システム（リアクションロール）
- **音楽Bot機能**: ボイスチャット音楽再生（検討中）

### データベース設計

- Keyv + SQLite → Prisma移行完了✅
- 今後の追加テーブル:
  - `BumpReminder` - Bump通知設定・履歴
  - `VACConfig` - VAC設定
  - `StickyMessage` - 固定メッセージ
  - `JoinLeaveLogConfig` - 入退出ログ設定
  - `MessageDeletionLog` - メッセージ削除ログ

---

## 🔗 関連ドキュメント

- [README.md](README.md) - プロジェクト概要・クイックスタート
- [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) - 開発ロードマップ詳細
- [docs/TESTING.md](docs/TESTING.md) - テスト方針・戦略
- [docs/TEST_SUMMARY.md](docs/TEST_SUMMARY.md) - テスト結果サマリー（87テストケース）
- [docs/I18N_GUIDE.md](docs/I18N_GUIDE.md) - 多言語対応ガイド
- [docs/BUMP_REMINDER_SPEC.md](docs/BUMP_REMINDER_SPEC.md) - Bump通知機能仕様
- [docs/VAC_SPEC.md](docs/VAC_SPEC.md) - VAC機能仕様
- [docs/JOIN_LEAVE_LOG_SPEC.md](docs/JOIN_LEAVE_LOG_SPEC.md) - 入退出ログ仕様
- [docs/MSG_DEL_COMMAND_SPEC.md](docs/MSG_DEL_COMMAND_SPEC.md) - メッセージ削除コマンド仕様

---

## 🚀 次のアクション

### 直近の推奨作業順序

1. **Bump通知機能の完成**
   - [ ] Prisma SchemaにBumpReminder関連テーブル追加
   - [ ] messageCreateイベントハンドラ作成
   - [ ] `/bump-reminder-config` コマンド実装
   - [ ] Bot再起動時の復元ロジック実装
   - [ ] テスト作成

2. **基本コマンド実装**
   - [ ] `/help` コマンド
   - [ ] `/server-info` コマンド
   - [ ] `/user-info` コマンド

3. **テスト拡充**
   - [ ] JobScheduler/BumpReminderManagerのユニットテスト
   - [ ] 既存コマンドのテスト拡充

---

**最終更新**: 2026年2月18日
**全体進捗**: 基盤完成、主要機能実装フェーズ
