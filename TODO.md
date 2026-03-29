# ayasono - TODO

> タスク管理・進捗状況・残件リスト

最終更新: 2026年3月29日

---

## コードベース規模

| 対象 | ファイル数 | 行数 |
| --- | ---: | ---: |
| src | 362 | 41,624 |
| tests | 285 | 63,967 |
| **合計** | **647** | **105,591** |

---

## 機能別ステータス

| 機能                          | ドキュメント | 実装 | テスト | 備考                                                       |
| ----------------------------- | ------------ | ---- | ------ | ---------------------------------------------------------- |
| Bumpリマインダー              | ✅           | ✅   | ✅     | Bump検知・自動リマインダー・パネルUI                       |
| AFK                           | ✅           | ✅   | ✅     | VCへの手動移動                                             |
| VAC（VC自動作成）             | ✅           | ✅   | ✅     | トリガー参加時に専用VC作成・自動削除                       |
| メッセージ固定                | ✅           | ✅   | ✅     | set/remove/update/view                                     |
| メンバーログ                  | ✅           | ✅   | ✅     | 参加・退出通知・招待追跡・カスタムメッセージ               |
| メッセージ削除                | ✅           | ✅   | ✅     | 2段階確認フロー・複数チャンネル横断                        |
| VC募集                        | ✅           | ✅   | ✅     | パネル・モーダル・ロール複数選択                           |
| VC操作コマンド                | ✅           | ✅   | ✅     | `/vc rename` `/vc limit`                                   |
| 多言語対応                    | ✅           | ✅   | ✅     | i18next + コマンドローカライズ（ja/en）                    |
| メッセージレスポンス          | ✅           | ✅   | ✅     | Embed ユーティリティ + タイトル命名規約                    |
| ログフォーマット              | ✅           | ✅   | ✅     | `logPrefixed()` / `logCommand()` によるプレフィックス統一  |
| コア（エラー/DB/ロガー/設定） | ✅           | ✅   | ✅     |                                                            |
| ギルド設定                    | ✅           | ✅   | ✅     | view/set/reset/export/import + エラーチャンネル通知        |
| チケット              | ✅           | ✅   | ✅     | パネルUI・チケット作成/クローズ/再オープン/削除・自動削除  |
| リアクションロール            | ✅           | ✅   | ✅     | パネルUI・ロール付与/解除・パネル自動クリーンアップ        |
| 基本コマンド                  | ✅           | ✅   | ✅     | `/ping` `/help`                                            |
| Web UI                        | ✅           | 🚧   | 🚧     | Fastify + ヘルスチェックのみ                               |

**凡例**: ✅ 完了 | 🚧 進行中 | ⬜ 未着手

---

## 完了済みタスク

- ✅ 1.1 ロケール対応（interaction.locale 導入）
- ✅ 3. メッセージフォーマット改善
- ✅ 4. 翻訳ファイルを機能単位に再編成（カスタムID統一・翻訳キー命名規則・管理者表記統一を含む）
- ✅ 5. ユーザー向け翻訳の `tDefault` → `tGuild` / `tInteraction` 置換
- ✅ 6. インテグレーションテスト拡充（全7機能・98テスト追加、既存含め171テスト）
- ✅ 7. 各機能リセットコマンド実装（共通基盤・AFK・Bump・メンバーログ・VAC）
- ✅ 8. ギルド設定管理機能（view/set-locale/set-error-channel/reset/reset-all/export/import + テスト）
- ✅ 9. エラーチャンネル通知機能（共通ユーティリティ + error 15箇所 + warn 4箇所の組込み + テスト）
- ✅ 10. `/help` コマンド実装（コマンド一覧Embed + USER_MANUAL_URL対応 + テスト）
- ✅ 11. Bot権限不足エラーハンドリング統一（全機能の MissingPermissions を共通フォーマットで応答 + 仕様書更新 + テスト）
- ✅ 12. チケット機能（パネルUI・チケット作成/クローズ/再オープン/削除・自動削除 + テスト）
- ✅ 13. リアクションロール機能（パネルUI・ロール付与/解除・パネル自動クリーンアップ + テスト）
- ✅ 14. コードベース改善（choice name ローカライズ・翻訳キー冗長性修正・リポジトリファクトリ統一・権限チェック統一・DBクエリ最適化）

---

## 残タスク サマリー

| セクション | タスク | 残件 |
| --- | --- | ---: |
| 1. コードベース改善 | リファクタ・最適化 | 0 |
| 2. Web UI | 設計・実装 | 7 |
| **合計** | | **7** |

> ※ コードベース改善完了 → 次は Web UI に着手予定

---

### 1. コードベース改善（完了）

- [x] Embed カラーコードを共通定数に集約（`src/shared/constants/embedColors.ts` 新設）
- [x] ロガー設定のハードコード値を定数化（`LOG_MAX_SIZE`, `LOG_RETENTION`, `ERROR_LOG_RETENTION`）
- [x] vc-recruit メンションロール上限 25 を名前付き定数に（`MAX_MENTION_ROLES`）
- [x] VAC `CATEGORY_CHANNEL_LIMIT` 重複定義を統一（constants 参照に一本化）
- [x] vc-panel モーダル入力制限を共通定数に統一（`VC_USER_LIMIT` in `src/shared/constants/discord.ts`）
- [x] `lastResendAt` Map 削除（デッドコード）
- [x] `vcRecruitRepository.ts` インターフェース重複宣言を除去
- [x] `clientReadyHandler.ts` に try-catch を追加
- [x] `errorChannelNotifier.ts` のハードコード英語ログを i18n 化
- [x] `handleVacCreate.ts` のエラー通知で英語・日本語混在を修正
- [x] web `auth.ts` のトークン比較をタイミングセーフに変更（`crypto.timingSafeEqual`）
- [x] web `health.ts` の空 catch にログ出力追加
- [x] `handleInteractionCreate.ts` の最終分岐に return を追加
- [x] reaction-role モード文字列を `REACTION_ROLE_MODE` 定数に統一
- [x] `discordWebhookTransport.ts` の unsafe キャスト修正（`String()` ラップ）
- [x] `guildConfigService.ts` のシリアライズ境界キャストにコメント追加
- [x] guild-config / sticky-message の choice name ローカライズ（`name_localizations` 対応）
- [x] 翻訳キー冗長性修正（6キーを `common.ts` に集約、`i18nKeys.ts` に共通定数追加）
- [x] リポジトリシングルトンパターンを `createRepositoryGetter` ファクトリに統一（8ファイル）
- [x] インライン権限チェックを共有ガード `ensureManageGuildPermission` に統一（afk/guild-config）
- [x] `deleteAllConfigs` を `$transaction` + `deleteMany` に変更（原子性確保）
- [x] `removeUsers` の N+1 クエリ解消（N回の個別削除 → 1回の一括保存）
- [x] `bumpReminderConfigRepository` の read-before-write クエリに `select` 句追加

---

### 2. Web UI（残: 7件）

- [x] Web UI 仕様書作成
- [x] HTMLモック作成（全12画面）
- [ ] 認証システム（Discord OAuth2 / セッション / 権限チェック）
- [ ] 管理 API（guilds CRUD / config / バリデーション）
- [ ] API 仕様書（OpenAPI/Swagger）
- [ ] フロントエンド（ダッシュボード / 設定画面）
- [ ] セキュリティ対策（入力バリデーション強化 / レート制限 / セキュリティヘッダー）
- [ ] テスト（Web API テスト / E2E テスト）
- [ ] helpコマンドにダッシュボードURLリンクを追加（Web UI実装完了後）

---

## 機能改善タスク

- [ ] VC募集: 入室中VCの自動検出（ハイブリッド方式）— 入室中なら現在のVCを自動選択、未入室なら従来のセレクトメニュー表示
- [ ] VC募集: 募集者をVCに移動する機能の削除 — 未入室時に動作しないため実用性が低い

---

## 機能拡張アイデア

- プロフィール機能（Bot embed表示ではDiscord標準検索が効かないデメリットが大きく、実装を見送り）
- 自動翻訳機能（DeepL API等）
- 投票システム（Discord標準投票との差別化: グラフ化・レポート集計）
- メトリクス収集 / アラート設定（運用規模拡大時）
