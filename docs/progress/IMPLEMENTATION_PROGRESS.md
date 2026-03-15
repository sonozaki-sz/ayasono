# 実装進捗

> 機能実装の進捗状況

最終更新: 2026年3月16日

---

## 📊 機能別実装状況

| 機能 | 状態 | 備考 |
| --- | --- | --- |
| Bumpリマインダー | ✅ 完了 | Bump検知・自動リマインダー・パネルUI |
| AFK | ✅ 完了 | VCへの手動移動 |
| VAC（VC自動作成） | ✅ 完了 | トリガー参加時に専用VC作成・自動削除 |
| メッセージ固定 | ✅ 完了 | set/remove/update/view |
| メンバーログ | ✅ 完了 | 参加・退出通知・招待追跡・カスタムメッセージ |
| メッセージ削除 | ✅ 完了 | 2段階確認フロー・複数チャンネル横断 |
| VC募集 | ✅ 完了 | パネル・モーダル・ロール複数選択 |
| 多言語対応 | ✅ 完了 | i18next + コマンドローカライズ（ja/en） |
| メッセージレスポンス | ✅ 完了 | Embed ユーティリティ |
| ギルド設定 | 📋 仕様書のみ | データ層は実装済み、コマンド層が未実装 |
| 基本コマンド | 🚧 一部 | `/ping` のみ。`/help` `/server-info` `/user-info` は未実装 |
| Web UI | 🚧 基盤のみ | Fastify + ヘルスチェックのみ |

**凡例**: ✅ 完了 | 🚧 実装中 | 📋 仕様書作成済み

---

## 📋 未実装機能

### ギルド設定機能

- 仕様書: [GUILD_CONFIG_SPEC.md](../specs/GUILD_CONFIG_SPEC.md)
- `/guild-config set-locale` — ロケール設定（ja/en）
- `/guild-config view` — 8ページパネル（概要＋各機能設定）
- `/guild-config reset` — 全設定リセット（確認ダイアログ付き）

### 基本コマンド

- 仕様書: [BASIC_COMMANDS_SPEC.md](../specs/BASIC_COMMANDS_SPEC.md)
- `/help` — カテゴリ別コマンド一覧
- `/server-info` — サーバー情報
- `/user-info` — ユーザー情報

### Web UI

- 認証システム（Discord OAuth2）
- 管理API（`/api/guilds/*`）
- ダッシュボード

---

## 🔗 関連ドキュメント

- [TEST_PROGRESS.md](TEST_PROGRESS.md) — テスト進捗
- [ARCHITECTURE.md](../guides/ARCHITECTURE.md) — アーキテクチャ
- [COMMANDS.md](../guides/COMMANDS.md) — コマンドリファレンス
