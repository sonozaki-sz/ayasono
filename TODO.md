# ayasono - TODO

> プロジェクト全体のタスク管理と残件リスト

最終更新: 2026年3月4日

---

## 📊 全体進捗サマリー

### 残タスク統計

- 残タスク合計: **43件**
- bot優先対象（1～3）: **19件**
- デプロイ・運用（4）: **12件**
- Web UI実装（5 / 凍結中）: **12件**

### 優先カテゴリ別進捗

| No. | 内容               | 残件 | 状態 |
| --- | ------------------ | ---- | ---- |
| 1   | 主要機能実装       | 10   | 🛠️   |
| 2   | 基本コマンド追加   | 3    | 📋   |
| 3   | テスト・品質向上   | 6    | 🚧   |
| 4   | デプロイ・運用     | 12   | 🚧   |
| 5   | Web UI実装（凍結） | 12   | ⏸️   |

**凡例**: 🛠️ 着手中 | 🚧 進行中 | 📋 未着手 | ⏸️ 凍結中

---

## 📋 残タスク一覧

> 運用方針（2026-02-21）: Web系（5系統）は一旦凍結し、bot層（1〜3）を優先。bot層が安定したら4（デプロイ・運用）へ進み、5（Web UI実装）を再開する。

### 1. 主要機能実装 - 残10件

#### 1.1 VC自動作成機能（VAC） - ✅ 完了

- [x] テスト実装（コマンド/イベント/パネル操作）
- [x] VAC挙動のE2E検証（複数カテゴリ・再起動クリーンアップ）※ bot実装完了後にまとめて作成予定。単体テスト完了をもって完了扱い

**仕様書**: [docs/specs/VAC_SPEC.md](docs/specs/VAC_SPEC.md)

#### 1.2 メッセージ固定機能 - ✅ 完了

- [x] `/sticky-message` コマンド実装（set、remove、update、view）
- [x] messageCreateイベントでの自動再送信ロジック（`StickyMessageResendService`）
- [x] Prisma Schema更新（StickyMessage テーブル、`updatedBy` フィールド含む）
- [x] `updatedBy` フィールド: 設定・更新時の操作ユーザー ID を保存し view で `<@userId>` 表示
- [x] DB アクセスを shared/features ・ configService 経由に統一（commit `1c197d4`）
- [x] テスト実装

**仕様書**: [docs/specs/STICKY_MESSAGE_SPEC.md](docs/specs/STICKY_MESSAGE_SPEC.md)

#### 1.3 メンバーログ機能 - ✅ 完了

- [x] guildMemberAdd、guildMemberRemoveイベントハンドラ作成
- [x] Embed形式の通知メッセージ実装
- [x] `/member-log-config` コマンド実装（set-channel、enable、disable、set-join-message、set-leave-message、show）
- [x] Prisma Schema更新（memberLogConfig JSONフィールド）
- [x] テスト実装

**仕様書**: [docs/specs/MEMBER_LOG_SPEC.md](docs/specs/MEMBER_LOG_SPEC.md)

#### 1.4 メッセージ削除機能 - ✅ 完了（新仕様移行中）

- [x] `/message-delete` コマンド実装（user / bot / keyword / count / days / after / before / channel オプション）
- [x] 容認範囲内チャンネル削除（channel 未指定時は現在チャンネル）
- [x] 実行確認ダイアログ（`/message-delete-config confirm` でスキップ設定）
- [x] ユーザー設定の永続化（`skipConfirm` をメモリ保持・ DB 東洋小子経由保存）
- [x] 削除結果表示（Embed形式）
- [x] 権限チェック（MANAGE_MESSAGES）
- [x] テスト実装
- [ ] 🔄 **新仕様移行**: 確認ダイアログを2段階構成（プレビュー + 最終確認）に刷新
  - [ ] 削除前プレスキャン（事前スキャン → プレビューダイアログ表示）
  - [ ] プレビューダイアログ（フィルター・除外機能・5件/ページページネーション）
  - [ ] 最終確認ダイアログ（除外後の対象一覧・`⚠️ この操作は取り消せません`）
  - [ ] `/message-delete-config confirm` スキップ設定の廃止
  - [ ] 削除後の詳細表示（ページネーション付き）の廃止 → 完了メッセージのみに変更

**仕様書（旧）**: [docs/specs/MESSAGE_DELETE_SPEC.md](docs/specs/MESSAGE_DELETE_SPEC.md)
**仕様書（新）**: [docs/specs/MESSAGE_DELETE_SPEC_V2.md](docs/specs/MESSAGE_DELETE_SPEC_V2.md)

#### 1.5 VC募集機能 - 残6件

- [ ] `/vc-recruit-config` コマンド実装（setup / teardown / add-role / remove-role / view）
  - [ ] `teardown` サブコマンド: `category` オプションを廃止し、StringSelectMenu → 確認パネル → 撤去処理の新UIフローに変更
- [ ] パネルチャンネル・投稿チャンネルの自動作成・権限設定
- [ ] ボタン→モーダル→セレクトメニューの2ステップ募集フロー
- [ ] 新規VC作成・設定パネル送信・全員退出時の自動削除
- [ ] Prisma Schema 更新（`GuildConfig.vcRecruitConfig`）
- [ ] テスト実装

**仕様書**: [docs/specs/VC_RECRUIT_SPEC.md](docs/specs/VC_RECRUIT_SPEC.md)

#### 1.6 ギルド設定機能 - 残4件

- [ ] `/guild-config set-locale` コマンド実装（ja / en 切り替え）
- [ ] `/guild-config view` コマンド実装（概要 + 各機能詳細のページネーション・セレクトメニュー）
- [ ] `/guild-config reset` コマンド実装（確認ダイアログ付き）
- [ ] テスト実装

**仕様書**: [docs/specs/GUILD_CONFIG_SPEC.md](docs/specs/GUILD_CONFIG_SPEC.md)

### 2. 基本コマンド追加 - 残3件

- [x] `/ping` - 疎通確認（実装済み）
- [ ] `/help` - コマンド一覧＋ユーザーマニュアルリンク表示
- [ ] `/server-info` - サーバー情報表示
- [ ] `/user-info` - ユーザー情報表示

**仕様書**: [docs/specs/BASIC_COMMANDS_SPEC.md](docs/specs/BASIC_COMMANDS_SPEC.md)

---

### 3. テスト・品質向上 - 残6件

**状況**: ユニットテスト＋インテグレーションテストで1276テスト実装済み（232 suites, 全件PASS）。単体テストは statements/functions/lines 100%、branches 99.16%（v8 async内部ブランチ＋意味上到達不能な防御的分岐のみ未到達）を達成。

#### 3.1 テストカバレッジ向上 - 残1件

- [x] カバレッジ目標100%達成（statements/functions/lines: 100%, branches: 99.16%）
- [x] sticky-message 全機能のユニットテスト追加（17ファイル新規作成）
- [x] エッジケーステスト（null合体演算子・エラーハンドラ・タイムアウトcallback等）
- [x] 到達不能ブランチへの `/* c8 ignore */` 適用 + テスト追加による branches 閾値維持（2026-03-02）
- [ ] E2Eテスト追加（Discordモック利用）

#### 3.2 ドキュメント整備 - 残1件

- [ ] API仕様書（OpenAPI/Swagger）
- [x] デプロイガイド（[XSERVER_VPS_SETUP.md](docs/guides/XSERVER_VPS_SETUP.md)追加済み）

#### 3.3 ソースコメント整備 - ✅ 完了

- [x] `src/` 全ファイル: コメント規約通りのコメントが記載されているか確認・補完（JSDoc / インラインコメントの欠落がないか）
- [x] `tests/` 全ファイル: テスト観点（何を・なぜ・どの条件で検証するか）がコメントに記載されているか確認・補完

#### 3.4 パフォーマンス最適化 - 残4件

- [ ] データベースクエリ最適化
- [ ] メモリ使用量プロファイリング
- [ ] ログローテーション設定
- [ ] 機能ログのメッセージフォーマット統一（`機能名: xxx機能 メッセージ GuildId: xxx 変数名: 値...` 形式に統一）

---

---

### 4. デプロイ・運用 - 残3件

#### 4.1 Docker化 - 全完了

- [x] 本番用Dockerfile最適化（node:24-slim、gosu権限降格、COREPACK_HOME最適化）
- [x] docker-compose.yml改善（docker-compose.prod.yml 本番水準で完成）
- [x] マルチステージビルド（base / deps / builder / runner の4ステージ構成）
- [x] ヘルスチェック設定（docker-compose.prod.yml に `healthcheck` セクション追加済み）
- [x] Prismaマイグレーション自動実行（`command` に `prisma migrate deploy` を含む）

#### 4.2 CI/CD - 全完了

- [x] GitHub Actions ワークフロー（テスト・型チェック）（`.github/workflows/deploy.yml` の `test` ジョブ）
- [x] GitHub Actions ワークフロー（リント）（`pnpm lint` を CI に追加済み）
- [x] Dockerイメージビルド・プッシュ（GHCR への自動プッシュ実装済み）
- [x] 自動デプロイ設定（SSH 経由で VPS へ自動デプロイ実装済み）

#### 4.3 監視・ログ - 残3件

- [x] **Botエラー時の Discord 通知**: Winston にカスタムトランスポートを追加し、`logger.error()` 呼び出し時に Discord Webhook へ自動通知（`processErrorHandler.ts` が既存のため、プロセスエラーも含め追加実装不要）
- [ ] **ギルド管理者向けエラー通知チャンネル（複数サーバー公開時）**: `GuildConfig` に `errorNotifyChannelId` フィールドを追加し、チャンネル削除失敗（`Missing Permissions` 等）などのバックグラウンドエラーをギルド内の指定チャンネルへ通知する仕組みを実装する。現状は `logger.error` のみでサーバー管理者（コマンド操作者）には届かない。単一サーバー運用では不要だが、複数サーバーへの公開時には必須。実装時は `/guild-config set-error-channel` サブコマンドとして追加し、`/guild-config view` でも表示する（`set-log-channel` は member-log 等と混同するため不採用）。
- [ ] メトリクス収集
- [ ] アラート設定

#### 4.4 バックアップ - 残1件

- [ ] データベース自動バックアップ・復旧手順

---

### 5. Web UI実装（凍結中） - 残12件

**状況**: Fastifyサーバー基盤、ヘルスチェックAPI、/api/index.tsは実装済み。
**運用**: 新規実装は凍結。緊急バグ修正のみ対応。

#### 5.1 認証システム - 残4件

- [ ] Discord OAuth2統合
- [ ] JWT認証実装
- [ ] セッション管理
- [ ] 権限チェックミドルウェア

#### 5.2 管理API - 残5件

- [ ] `/api/guilds` - ギルド一覧取得
- [ ] `/api/guilds/:id` - ギルド詳細取得
- [ ] `/api/guilds/:id/config` - 設定取得・更新
- [ ] `/api/guilds/:id/stats` - 統計情報取得
- [ ] バリデーション・エラーハンドリング

#### 5.3 フロントエンド - 残3件

- [ ] ダッシュボードUI
- [ ] ギルド設定画面
- [ ] 統計表示画面

---

## 🎯 優先度別タスク

1. **主要機能実装** - 10件
2. **基本コマンド追加** - 3件
3. **テスト・品質向上** - 6件
4. **デプロイ・運用** - 3件
5. **Web UI実装（凍結中）** - 12件

---

## 🔧 技術的改善タスク

### コード品質

- [ ] ESLintルール厳格化
- [x] コードコメント充実
- [ ] 未使用コード・デッドコード削除
- [ ] 一貫性のあるエラーメッセージ

### 設計見直し

- [ ] `/message-delete-config confirm` のスキップ設定を廃止する（メッセージ削除は不可逆操作のため、確認ダイアログは必須とすべき）→ **新仕様（V2）で対応予定**（[MESSAGE_DELETE_SPEC_V2.md](docs/specs/MESSAGE_DELETE_SPEC_V2.md) 参照）
- [ ] `teardown` サブコマンドの UI を StringSelectMenu + 確認パネルに変更 → **新仕様で対応予定**（[VC_RECRUIT_SPEC.md](docs/specs/VC_RECRUIT_SPEC.md) 参照）

### アーキテクチャ

- [ ] リポジトリパターン完全実装
- [ ] 依存性注入の導入検討（現状はモジュールレベルのDI + ガード関数）
- [ ] サービス層の整理

### セキュリティ

- [ ] 依存関係の脆弱性スキャン
- [ ] 入力バリデーション強化
- [ ] レート制限実装
- [ ] セキュリティヘッダー設定

---

## 📝 メモ・検討事項

### 技術スタック改善検討

- **キャッシュ**: Redis導入の検討
- **ロガー**: Winston → Pino 移行検討

### 機能拡張アイデア

- 自動翻訳機能（DeepL API等）
- 投票システム（リアクション投票）
- ウェルカムメッセージ（カスタマイズ可能）
- ロール管理（自動ロール付与）
- 音楽Bot機能（検討中）

---

## 🔗 関連ドキュメント

### プロジェクト管理

- [README.md](README.md) - プロジェクト概要
- [docs/progress/IMPLEMENTATION_PROGRESS.md](docs/progress/IMPLEMENTATION_PROGRESS.md) - 実装進捗の詳細
- [docs/progress/TEST_PROGRESS.md](docs/progress/TEST_PROGRESS.md) - テスト進捗の詳細

### 開発ガイド

- [docs/guides/COMMANDS.md](docs/guides/COMMANDS.md) - コマンドリファレンス
- [docs/guides/DISCORD_BOT_SETUP.md](docs/guides/DISCORD_BOT_SETUP.md) - Discord Bot セットアップガイド
- [docs/guides/TESTING_GUIDELINES.md](docs/guides/TESTING_GUIDELINES.md) - テスト方針
- [docs/guides/I18N_GUIDE.md](docs/guides/I18N_GUIDE.md) - 多言語対応ガイド

### 機能仕様書

- [docs/specs/BUMP_REMINDER_SPEC.md](docs/specs/BUMP_REMINDER_SPEC.md) - Bumpリマインダー機能
- [docs/specs/AFK_SPEC.md](docs/specs/AFK_SPEC.md) - AFK機能
- [docs/specs/VAC_SPEC.md](docs/specs/VAC_SPEC.md) - VC自動作成機能
- [docs/specs/STICKY_MESSAGE_SPEC.md](docs/specs/STICKY_MESSAGE_SPEC.md) - メッセージ固定機能
- [docs/specs/MEMBER_LOG_SPEC.md](docs/specs/MEMBER_LOG_SPEC.md) - メンバーログ
- [docs/specs/MESSAGE_DELETE_SPEC.md](docs/specs/MESSAGE_DELETE_SPEC.md) - メッセージ削除
- [docs/specs/MESSAGE_RESPONSE_SPEC.md](docs/specs/MESSAGE_RESPONSE_SPEC.md) - メッセージレスポンス
- [docs/specs/GUILD_CONFIG_SPEC.md](docs/specs/GUILD_CONFIG_SPEC.md) - ギルド設定機能
- [docs/specs/BASIC_COMMANDS_SPEC.md](docs/specs/BASIC_COMMANDS_SPEC.md) - 基本コマンド

---

## 🚀 次のアクション

### 直近の推奨作業順序

1. ~~**ソースコメント整備**（セクション 3.3）~~ ✅ **完了**

2. ~~**Botエラー時の Discord 通知実装**（セクション 4.3）~~ ✅ **完了**

3. **主要機能実装**（セクション 1）
   - ~~メンバーログ機能（`guildMemberAdd` / `guildMemberRemove` + `/member-log-config`）~~ ✅ **完了**
   - ~~メッセージ削除機能（`/message-delete`）~~ ✅ **完了**
   - ~~VAC E2E検証~~ ✅ **完了**（bot実装完了後にまとめて作成予定）
   - **次: VC募集機能実装**（セクション 1.5）+ **ギルド設定機能**（セクション 1.6）

4. **基本コマンド追加**（セクション 2）
   - `/help` / `/server-info` / `/user-info`

5. **E2Eフェーズ実装の着手**（VC募集機能・基本コマンドの実装完了後）
   - `docs/guides/TESTING_GUIDELINES.md` の計画に沿って `tests/e2e` の初期シナリオを追加
   - VAC / Bumpリマインダー / VC募集機能の基本フローを回帰検証対象とする

6. **残課題の順次解消**
   - コード品質（未使用コード削減・エラーメッセージ統一）
   - アーキテクチャ（サービス層整理・DI運用の明文化）
   - セキュリティ（依存脆弱性・入力検証・レート制限）

---

**最終更新**: 2026年3月1日
**次のマイルストーン**: VC募集機能実装 → E2E テスト着手
