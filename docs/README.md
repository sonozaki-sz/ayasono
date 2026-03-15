# ドキュメント構成

> ayasono のドキュメント一覧

最終更新: 2026年3月16日

---

## 📂 ディレクトリ構成

```
docs/
├── guides/          # 開発者向けガイド
├── specs/           # 機能仕様書
├── progress/        # 進捗管理
└── README.md        # このファイル
```

---

## 📖 ガイド (guides/)

開発者向けの実用的なガイドです。

| ファイル | 概要 |
| --- | --- |
| [ARCHITECTURE.md](guides/ARCHITECTURE.md) | システム全体の設計方針とアーキテクチャ概要 |
| [IMPLEMENTATION_GUIDELINES.md](guides/IMPLEMENTATION_GUIDELINES.md) | 実装方針・命名規則・コメント規約・コーディングルール |
| [TESTING_GUIDELINES.md](guides/TESTING_GUIDELINES.md) | テスト設計方針・命名規則・カバレッジ目標 |
| [GIT_WORKFLOW.md](guides/GIT_WORKFLOW.md) | Git ブランチ戦略・コミット規約 |
| [I18N_GUIDE.md](guides/I18N_GUIDE.md) | 多言語対応（i18next）の実装ガイド |
| [COMMANDS.md](guides/COMMANDS.md) | 全スラッシュコマンドのリファレンス |
| [USER_MANUAL.md](guides/USER_MANUAL.md) | ユーザー・管理者向け取扱説明書 |
| [DISCORD_BOT_SETUP.md](guides/DISCORD_BOT_SETUP.md) | Discord アプリ作成からサーバー招待までの手順 |
| [XSERVER_VPS_SETUP.md](guides/XSERVER_VPS_SETUP.md) | VPS 初期設定から bot コンテナ起動までの手順 |
| [DEPLOYMENT.md](guides/DEPLOYMENT.md) | GitHub Actions による自動デプロイフロー |

---

## 📋 機能仕様書 (specs/)

各機能の詳細設計と実装仕様を記載したドキュメントです。

---

#### [MESSAGE_RESPONSE_SPEC.md](specs/MESSAGE_RESPONSE_SPEC.md)

Embed形式の統一メッセージレスポンスシステム。

---

#### [BUMP_REMINDER_SPEC.md](specs/BUMP_REMINDER_SPEC.md)

Bumpリマインダー機能 - Disboard/ディス速のBump検知と自動リマインダー。

---

#### [AFK_SPEC.md](specs/AFK_SPEC.md)

AFK機能 - VCの非アクティブユーザーを手動でAFKチャンネルに移動。

---

#### [VAC_SPEC.md](specs/VAC_SPEC.md)

VC自動作成機能 - トリガーチャンネル参加時に専用VCを自動作成・管理。

---

#### [STICKY_MESSAGE_SPEC.md](specs/STICKY_MESSAGE_SPEC.md)

メッセージ固定機能 - 指定メッセージをチャンネル最下部に自動再送信。

---

#### [MEMBER_LOG_SPEC.md](specs/MEMBER_LOG_SPEC.md)

メンバーログ機能 - メンバーの参加・脱退を指定チャンネルに自動記録。

---

#### [MESSAGE_DELETE_SPEC.md](specs/MESSAGE_DELETE_SPEC.md)

メッセージ削除機能 - モデレーター向けメッセージ一括削除。

---

#### [VC_RECRUIT_SPEC.md](specs/VC_RECRUIT_SPEC.md)

VC募集機能 - 専用チャンネルでVC参加者を募る投稿を作成。

---

#### [GUILD_CONFIG_SPEC.md](specs/GUILD_CONFIG_SPEC.md)

ギルド設定機能 - サーバー全体のロケール設定・機能設定一覧・全リセット。

---

#### [BASIC_COMMANDS_SPEC.md](specs/BASIC_COMMANDS_SPEC.md)

基本コマンド - `/ping` `/help` `/server-info` `/user-info` 等の汎用ユーティリティ。

---

## 📊 進捗管理 (progress/)

プロジェクトの実装とテストの進捗状況を管理します。

| ファイル | 概要 |
| --- | --- |
| [IMPLEMENTATION_PROGRESS.md](progress/IMPLEMENTATION_PROGRESS.md) | 機能実装の進捗状況 |
| [TEST_PROGRESS.md](progress/TEST_PROGRESS.md) | テスト実装の進捗状況・カバレッジ |

---

## 🔗 関連ドキュメント

### プロジェクトルート

- [README.md](../README.md) - プロジェクト概要とクイックスタート
- [TODO.md](../TODO.md) - タスク管理・残件リスト

---

## 📝 ドキュメント作成・更新ガイドライン

### ガイド (guides/)

- **目的**: 実用的な手順、ベストプラクティス、How-to
- **対象読者**: 開発者、新規参加者
- **形式**: ステップバイステップ、コード例、スクリーンショット
- **更新頻度**: 機能追加時、開発フロー変更時

### 仕様書 (specs/)

- **目的**: 機能の詳細設計、実装仕様
- **対象読者**: 開発者
- **形式**（必要なセクションのみ記載、機能に応じて取捨選択）:
  - 📋 概要
  - 🎯 主要機能
  - ⚙️ コマンド仕様
  - 💾 データベース設計
  - 🔄 処理フロー
  - ⚠️ エラーハンドリング
  - 🌐 多言語対応
  - 🧪 テストケース
- **更新頻度**: 機能実装前（仕様策定）、実装完了時

### 進捗管理 (progress/)

- **目的**: プロジェクトの現状把握、マイルストーン管理
- **対象読者**: プロジェクトマネージャー、チームメンバー
- **形式**: サマリーテーブル、詳細リスト、統計情報
- **更新頻度**: 週次、マイルストーン達成時

---

## 🎯 ドキュメント命名規則

- **ガイド**: `大文字_GUIDE.md` または `大文字.md` （例: `I18N_GUIDE.md`, `COMMANDS.md`）
- **仕様書**: `機能名_SPEC.md` （例: `VAC_SPEC.md`, `BUMP_REMINDER_SPEC.md`）
- **進捗管理**: `内容_PROGRESS.md` （例: `IMPLEMENTATION_PROGRESS.md`, `TEST_PROGRESS.md`）
