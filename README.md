# ayasono

> サーバーに彩りを加える、使いやすさ重視の多機能 Discord Bot

**開発開始**: 2026年2月 | **最終更新**: 2026年3月16日 | **AI利用**: コードおよびドキュメントの作成に生成AIを使用しています。

## 📋 概要

ayasono は、Discord サーバーの管理に必要な機能を充実した形で搭載した多機能 Bot です。
シンプルな操作性と豊富な機能で、あなたのコミュニティ彩りを加え、管理しやすくします。

### コンセプト

- 🎨 **サーバーに彩りを加える** — さまざまな機能でコミュニティを豊かに
- ⚙️ **充実した機能** — サーバー管理に必要なツールを一通り搭載
- 👆 **使いやすさ重視** — 直感的な操作と分かりやすい設定

## ✨ 主要機能

> **凡例**: ✅ 実装済み | 🚧 一部実装 | 📋 仕様書のみ

| 機能                | 概要                                        | 状態 | 仕様書                                    | マニュアル                                                |
| ------------------- | ------------------------------------------- | :--: | ----------------------------------------- | --------------------------------------------------------- |
| 基本コマンド     | `/ping` `/help` `/server-info` `/user-info` |  🚧  | [spec](docs/specs/BASIC_COMMANDS_SPEC.md) | —                                                         |
| Bumpリマインダー | Bump検知と2時間後の自動リマインド           |  ✅  | [spec](docs/specs/BUMP_REMINDER_SPEC.md)  | [manual](docs/guides/USER_MANUAL.md#bumpリマインダー機能) |
| メッセージ削除   | モデレーター向けメッセージ一括削除          |  ✅  | [spec](docs/specs/MESSAGE_DELETE_SPEC.md) | [manual](docs/guides/USER_MANUAL.md#メッセージ削除機能)   |
| AFK              | VC非アクティブメンバーをAFKチャンネルへ移動 |  ✅  | [spec](docs/specs/AFK_SPEC.md)            | [manual](docs/guides/USER_MANUAL.md#afk機能)              |
| VC自動作成       | トリガーVC参加で専用VCを自動作成・削除      |  ✅  | [spec](docs/specs/VAC_SPEC.md)            | [manual](docs/guides/USER_MANUAL.md#vc自動作成機能)       |
| メッセージ固定   | 重要メッセージをチャンネル最下部に固定表示  |  ✅  | [spec](docs/specs/STICKY_MESSAGE_SPEC.md) | [manual](docs/guides/USER_MANUAL.md#メッセージ固定機能)   |
| メンバーログ     | 参加・脱退を指定チャンネルに自動記録        |  ✅  | [spec](docs/specs/MEMBER_LOG_SPEC.md)     | [manual](docs/guides/USER_MANUAL.md#メンバーログ機能)     |
| VC募集           | ボタン＆モーダルでVC参加者を募集            |  ✅  | [spec](docs/specs/VC_RECRUIT_SPEC.md)     | [manual](docs/guides/USER_MANUAL.md#vc募集機能)           |
| ギルド設定       | ロケール設定・機能設定一覧・全リセット      |  📋  | [spec](docs/specs/GUILD_CONFIG_SPEC.md)   | —                                                         |
| Web UI           | ブラウザからBot設定を管理するダッシュボード |  🚧  | —                                         | —                                                         |

---

**📌 コマンド一覧:** 全スラッシュコマンドの詳細は [コマンドリファレンス](docs/guides/COMMANDS.md) を参照してください。

**🧭 実装方針:** 実装時の責務分離・コメント規約は [実装ガイド](docs/guides/IMPLEMENTATION_GUIDELINES.md) を参照してください。

**📋 実装状況:** 開発タスクと進捗は [TODO.md](TODO.md) を参照してください。

## 🛠 技術スタック

### コア技術

- **Runtime**: Node.js 24以上
- **Language**: TypeScript 5.x - 厳格な型チェックで品質向上
- **Framework**: Discord.js 14.x - Discord Bot開発フレームワーク
- **Package Manager**: pnpm - 高速で効率的なパッケージ管理

### データベース

- **Prisma** - タイプセーフなORMとスキーマ管理
- **libSQL** - SQLite互換のデータベース（ローカル/リモート対応）

### Web・API

- **Fastify** - 高速Webフレームワーク
- **Zod** - 実行時バリデーションとスキーマ定義

### ロガー・ユーティリティ

- **Winston** - ログ管理（ローテーション、レベル制御）
- **i18next** - 多言語対応システム
- **node-cron** - タイマー・スケジューリング処理

### 開発ツール

- **Vitest** - テストフレームワーク（ユニット・インテグレーション・E2E）
- **ESLint + Prettier** - コード品質とフォーマット
- **tsx** - TypeScript高速実行
- **tsc-watch** - ファイル監視ビルド

## 🎯 開発原則

### アーキテクチャ

- **レイヤー分離**: Bot / Web / Shared の明確な責務分離
- **依存性注入**: テスト可能な設計
- **型安全性**: TypeScript厳格モード + Zodバリデーション
- **エラーハンドリング**: 統一されたエラー処理機構

### コード品質

- **自動フォーマット**: ESLint + Prettierによる一貫性
- **テストカバレッジ**: 重要ロジックは必ずテスト
- **ドキュメント**: コード内コメント + Markdownドキュメント
- **レビュー**: 重要な変更はセルフレビュー必須

### 開発フロー

- **ブランチ戦略**: main（本番安定版）/ develop（開発統合）/ feature/xxx（機能開発）
- **コミット規約**: Conventional Commits（feat/fix/chore など）
- **バージョニング**: セマンティックバージョニング

## 🚀 クイックスタート

### 必要環境

- Node.js 24以上
- pnpm 10以上

### セットアップ

```bash
# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env
# .envを編集してDiscordトークンなどを設定

# 開発モード起動
pnpm dev:bot
```

### スクリプト

```bash
# 開発
pnpm dev:bot          # Bot開発サーバー起動
pnpm dev:web          # Webサーバー起動
pnpm dev              # Bot + Web同時起動

# ビルド
pnpm build            # TypeScriptビルド
pnpm tsc-watch        # ビルド監視モード
pnpm typecheck        # 型チェックのみ

# テスト
pnpm test             # テスト実行
pnpm test:watch       # テスト監視モード
pnpm test:coverage    # カバレッジレポート

# データベース
pnpm db:migrate       # Prisma マイグレーション実行
pnpm db:generate      # Prisma Client生成
pnpm db:studio        # Prisma Studio起動
pnpm db:push          # スキーマをDBに反映（開発用）

# コード品質
pnpm lint             # ESLintチェック
pnpm lint:fix         # ESLint自動修正
pnpm format           # Prettier実行
pnpm format:check     # Prettierチェックのみ
```

## 📁 プロジェクト構造

```
ayasono/
├── src/
│   ├── bot/                  # Discord Bot
│   │   ├── main.ts
│   │   ├── client.ts
│   │   ├── commands/         # スラッシュコマンド定義
│   │   ├── events/           # イベントハンドラ
│   │   ├── features/         # 機能モジュール（機能ごとのユースケース・ハンドラ・リポジトリ）
│   │   ├── handlers/         # インタラクション処理フロー
│   │   ├── services/         # Bot起動・依存解決・クールダウン管理
│   │   ├── shared/           # Bot内共有（i18nキー・権限ガード）
│   │   ├── errors/           # エラーハンドラ
│   │   ├── types/            # discord.js 型拡張
│   │   └── utils/            # Bot共通ユーティリティ
│   ├── web/                  # Web UI（凍結中）
│   │   ├── server.ts
│   │   ├── webAppBuilder.ts
│   │   ├── routes/
│   │   └── middleware/
│   └── shared/               # 共有コード
│       ├── config/           # 環境変数定義
│       ├── database/         # リポジトリ・型定義
│       │   ├── repositories/ # 機能別リポジトリ（persistence / serializers / usecases）
│       │   └── types/        # エンティティ・リポジトリ型定義
│       ├── features/         # 機能モジュール（機能ごとの configService・configDefaults）
│       ├── locale/           # i18n（i18next）
│       ├── scheduler/        # ジョブスケジューラ
│       ├── errors/           # カスタムエラー・エラーハンドラ
│       └── utils/            # 共通ユーティリティ
├── tests/                    # テスト（unit / integration / e2e）
├── prisma/                   # スキーマ・マイグレーション
├── docs/                     # ドキュメント
├── storage/                  # データ保存（SQLite）
└── logs/                     # ログファイル
```

## 📖 ドキュメント

### ガイド

- [TODO](TODO.md) - タスク管理・残件リスト
- [実装進捗](docs/progress/IMPLEMENTATION_PROGRESS.md) - 機能実装の詳細進捗
- [テスト進捗](docs/progress/TEST_PROGRESS.md) - テスト実装の詳細進捗
- [アーキテクチャガイド](docs/guides/ARCHITECTURE.md) - 全体設計方針・依存方向・責務境界
- [コマンドリファレンス](docs/guides/COMMANDS.md) - 全スラッシュコマンドの詳細
- [Discord Bot セットアップ](docs/guides/DISCORD_BOT_SETUP.md) - Discord Developer Portal でのアプリ作成・サーバー招待手順
- [VPS セットアップ](docs/guides/XSERVER_VPS_SETUP.md) - XServer VPS・Portainer 初回セットアップ手順
- [デプロイガイド](docs/guides/DEPLOYMENT.md) - GitHub Actions による自動デプロイフロー詳細
- [Git ワークフロー](docs/guides/GIT_WORKFLOW.md) - ブランチ戦略・コミット規約・PR運用ルール
- [テストガイド](docs/guides/TESTING_GUIDELINES.md) - テスト方針・コメント規約・安定化ガイドライン
- [実装ガイド](docs/guides/IMPLEMENTATION_GUIDELINES.md) - 実装細則・分割手順・直接import運用
- [国際化ガイド](docs/guides/I18N_GUIDE.md) - 多言語対応ガイド
- [取扱説明書](docs/guides/USER_MANUAL.md) - サーバーメンバー・管理者向け操作ガイド

### 機能仕様書

各機能の詳細設計と実装仕様を記載したドキュメントです。

- [AFK機能](docs/specs/AFK_SPEC.md) - VCの非アクティブユーザーを手動でAFKチャンネルに移動
- [Bumpリマインダー機能](docs/specs/BUMP_REMINDER_SPEC.md) - Disboard/ディス速Bump後、次回Bump時刻に自動通知
- [VC自動作成機能](docs/specs/VAC_SPEC.md) - トリガーチャンネル参加時に専用VCを作成・管理
- [メッセージ固定機能](docs/specs/STICKY_MESSAGE_SPEC.md) - 指定メッセージをチャンネル最下部に固定表示
- [メッセージレスポンス](docs/specs/MESSAGE_RESPONSE_SPEC.md) - Embed形式の統一メッセージシステム
- [メンバーログ機能](docs/specs/MEMBER_LOG_SPEC.md) - メンバーの参加・脱退を指定チャンネルに記録
- [メッセージ削除](docs/specs/MESSAGE_DELETE_SPEC.md) - モデレーター向けメッセージ一括削除コマンド
- [VC募集機能](docs/specs/VC_RECRUIT_SPEC.md) - 専用チャンネルでVC参加者を募る投稿を作成
- [ギルド設定機能](docs/specs/GUILD_CONFIG_SPEC.md) - ロケール設定・機能設定一覧表示・設定リセット
- [基本コマンド](docs/specs/BASIC_COMMANDS_SPEC.md) - ping / help / server-info / user-info

## 🔧 開発環境

### VSCode設定

プロジェクトには充実したVSCode開発環境が設定済みです。

#### 推奨拡張機能

プロジェクトを開くと、以下の拡張機能のインストールが推奨されます：

**必須**

- **ESLint** - コード品質チェック
- **Prettier** - 自動フォーマット
- **TypeScript拡張** - 型補完・エラー表示
- **Error Lens** - リアルタイムエラー表示

**推奨**

- **GitLens** - Git履歴可視化
- **Git Graph** - ブランチグラフ表示
- **REST Client** - API テスト
- **Todo Tree** - TODOコメント管理
- **Path IntelliSense** - パス自動補完
- **Docker** - コンテナ管理

詳細は [.vscode/README.md](.vscode/README.md) を参照してください。

#### コードスニペット

プロジェクト専用スニペットが利用可能です：

```typescript
// "discord-command" と入力してTab
discord - command; // Discordコマンドテンプレート
fastify - route; // APIルートテンプレート
logger; // ロガーインスタンス
```

#### デバッグ設定

VSCodeデバッグ機能が設定済み：

- **F5** でBot/Webサーバーをデバッグモード起動
- ブレークポイント、変数監視、ステップ実行が利用可能
- 複数の起動設定（Bot単体、Web単体、同時起動）

#### タスク

便利なタスクが利用可能：

- **Ctrl+Shift+B** - TypeScriptビルド
- `Tasks: Run Task` から選択:
  - Build: Watch - ビルド監視モード
  - Dev: Start Bot/Web - 開発サーバー起動
  - Lint: Check/Fix - ESLint実行
  - Format: Check/Write - Prettier実行

### REST Client

`api-tests.http` ファイルでAPIテストが可能です：

```http
### Health Check
GET http://localhost:3000/health

### Get Guild Config
GET http://localhost:3000/api/guilds/{{guildId}}/config
```

REST Client拡張機能で「Send Request」をクリックするだけでテストできます。

## コミット規約

Conventional Commits を使用：

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: コードスタイル変更（動作に影響なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・補助ツール変更
```

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照
