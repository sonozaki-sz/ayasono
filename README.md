# ayasono

> サーバーに彩りを加える、使いやすさ重視の多機能 Discord Bot

**開発開始**: 2026年2月 | **最終更新**: 2026年3月20日 | **AI利用**: コードおよびドキュメントの作成に生成AIを使用しています。

## 概要

ayasono は、Discord サーバーの管理に必要な機能を充実した形で搭載した多機能 Bot です。
シンプルな操作性と豊富な機能で、あなたのコミュニティ彩りを加え、管理しやすくします。

### コンセプト

- 🎨 **サーバーに彩りを加える** — さまざまな機能でコミュニティを豊かに
- ⚙️ **充実した機能** — サーバー管理に必要なツールを一通り搭載
- 👆 **使いやすさ重視** — 直感的な操作と分かりやすい設定

## 主要機能

> **凡例**: ✅ 実装済み | 🚧 一部実装 | 📋 仕様書のみ

| 機能             | 概要                                        | 状態 | 仕様書                                    | マニュアル                                                |
| ---------------- | ------------------------------------------- | :--: | ----------------------------------------- | --------------------------------------------------------- |
| 基本コマンド     | `/ping` `/help`                             |  🚧  | [spec](docs/specs/BASIC_COMMANDS_SPEC.md) | —                                                         |
| Bumpリマインダー | Bump検知と2時間後の自動リマインド           |  ✅  | [spec](docs/specs/BUMP_REMINDER_SPEC.md)  | [manual](docs/guides/USER_MANUAL.md#bumpリマインダー機能) |
| メッセージ削除   | モデレーター向けメッセージ一括削除          |  ✅  | [spec](docs/specs/MESSAGE_DELETE_SPEC.md) | [manual](docs/guides/USER_MANUAL.md#メッセージ削除機能)   |
| AFK              | VC非アクティブメンバーをAFKチャンネルへ移動 |  ✅  | [spec](docs/specs/AFK_SPEC.md)            | [manual](docs/guides/USER_MANUAL.md#afk機能)              |
| VC自動作成       | トリガーVC参加で専用VCを自動作成・削除      |  ✅  | [spec](docs/specs/VAC_SPEC.md)            | [manual](docs/guides/USER_MANUAL.md#vc自動作成機能)       |
| メッセージ固定   | 重要メッセージをチャンネル最下部に固定表示  |  ✅  | [spec](docs/specs/STICKY_MESSAGE_SPEC.md) | [manual](docs/guides/USER_MANUAL.md#メッセージ固定機能)   |
| メンバーログ     | 参加・脱退を指定チャンネルに自動記録        |  ✅  | [spec](docs/specs/MEMBER_LOG_SPEC.md)     | [manual](docs/guides/USER_MANUAL.md#メンバーログ機能)     |
| VC募集           | ボタン＆モーダルでVC参加者を募集            |  ✅  | [spec](docs/specs/VC_RECRUIT_SPEC.md)     | [manual](docs/guides/USER_MANUAL.md#vc募集機能)           |
| ギルド設定       | ロケール設定・機能設定一覧・全リセット      |  🚧  | [spec](docs/specs/GUILD_CONFIG_SPEC.md)   | —                                                         |
| Web UI           | ブラウザからBot設定を管理するダッシュボード |  🚧  | —                                         | —                                                         |

---

**📌 コマンド一覧:** 全スラッシュコマンドの詳細は [コマンドリファレンス](docs/guides/COMMANDS.md) を参照してください。

**🧭 実装方針:** 実装時の責務分離・コメント規約は [実装ガイド](docs/guides/IMPLEMENTATION_GUIDELINES.md) を参照してください。

**📋 実装状況:** 開発タスクと進捗は [TODO.md](TODO.md) を参照してください。

## 技術スタック

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

## クイックスタート

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

## ドキュメント

### ガイド

- [TODO](TODO.md) - タスク管理・残件リスト
- [アーキテクチャガイド](docs/guides/ARCHITECTURE.md) - 全体設計方針・依存方向・責務境界
- [コマンドリファレンス](docs/guides/COMMANDS.md) - 全スラッシュコマンドの詳細
- [Discord Bot セットアップ](docs/guides/DISCORD_BOT_SETUP.md) - Discord Developer Portal でのアプリ作成・サーバー招待手順
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
- [基本コマンド](docs/specs/BASIC_COMMANDS_SPEC.md) - ping / help

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照
