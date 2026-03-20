# ayasono - TODO

> タスク管理・進捗状況・残件リスト

最終更新: 2026年3月21日

---

## コードベース規模

| 対象 | ファイル数 | 行数 |
| --- | ---: | ---: |
| src | 243 | 26,840 |
| tests | 196 | 38,318 |
| **合計** | **439** | **65,158** |

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
| ギルド設定                    | ✅           | 🚧   | ⬜     | データ層は実装済み、コマンド層が未実装                     |
| 基本コマンド                  | ✅           | 🚧   | 🚧     | `/ping` のみ。`/help` は未実装                             |
| Web UI                        | ⬜           | 🚧   | 🚧     | Fastify + ヘルスチェックのみ                               |

**凡例**: ✅ 完了 | 🚧 進行中 | ⬜ 未着手

**次のマイルストーン**: 各機能リセットコマンド

---

## 残タスク

### 1. 主要機能実装

#### 1.1 ロケール対応（interaction.locale 導入） - ✅完了

コマンド応答のロケールを `tGuild`（ギルド設定）から `interaction.locale`（ユーザーのDiscordクライアント言語）に切り替え済み。

**実装内容**:

- `tInteraction`（sync）ヘルパー関数を `localeManager.ts` に追加（`"ja"` → 日本語、それ以外 → 英語）
- `getInteractionTranslator` を `helpers.ts` に追加
- 全コマンドハンドラ・UIハンドラのユーザー応答を `tGuild` → `tInteraction` に置き換え
- ハードコードログ（info/warn/error）を `tDefault` + i18n キーに移行
- テスト更新（モックに `tInteraction` 追加、`locale: "ja"` 追加、アサーション修正）

**対象外（tGuild を維持）**: Bumpリマインダー通知 / Bump検知パネル / メンバーログ / スティッキーメッセージ再送信 / VC募集投稿・パネル / VACパネルラベル

#### 1.2 ギルド設定機能 - 残5件

- [ ] `/guild-config set-locale` コマンド実装（ja / en 切り替え）
- [ ] `/guild-config view` コマンド実装（概要 + 各機能詳細のページネーション）
- [ ] `/guild-config reset` コマンド実装（確認ダイアログ付き）
- [ ] `/guild-config export` / `/guild-config import` コマンド実装（JSON形式の設定バックアップ/リストア、同一サーバー向け）
- [ ] テスト実装

仕様書: [GUILD_CONFIG_SPEC.md](docs/specs/GUILD_CONFIG_SPEC.md)

### 2. 基本コマンド追加 - 残1件

- [ ] `/help` — コマンド一覧＋ユーザーマニュアルリンク表示

仕様書: [BASIC_COMMANDS_SPEC.md](docs/specs/BASIC_COMMANDS_SPEC.md)

### 3. メッセージフォーマット改善 - ✅完了

- [x] エラー・警告Embedのタイトルを原因名詞に統一（`common:title_*` キー24種を `common.ts` に定義、全Embed呼び出しに適用、`interactionErrorHandler` のエラークラス別タイトルも日本語化）
- [x] ログフォーマット統一（`logPrefixed()` / `logCommand()` ヘルパーを導入、`log_prefix.*` キーで機能名をi18n管理、イベント名は Discord.js 準拠、サブプレフィックス `[interactionCreate:command]` 形式対応）
- [x] ユーザーレスポンスの warning / error レベル整理（基準: ユーザーが修正可能 → warning、システム的に不可 → error。`interactionErrorHandler` で `ValidationError`/`NotFoundError`/`TimeoutError`/`ConfigurationError` を warning に変更、vc-panel・vc-recruit・bump-reminder の直接 Embed 生成も統一、`permissionGuards` の権限不足を `PermissionError`（error レベル）に修正）

### 4. 翻訳ファイルを機能単位に再編成

現状の名前空間はトリガー元（`commands` / `errors` / `events` / `system`）基準だが、以下の問題がある。

- パネルUIやボタン操作レスポンスなど、コマンドとイベントの両方から使われるメッセージの置き場所が曖昧
- 同種のメッセージ（入力バリデーションエラー等）が `errors:` と `commands:` に分散
- `errors:` 名前空間のメッセージの大半が warning レベルで表示されるため名前と実態が乖離
- `commands.ts`（836行）が肥大化しており、機能追加のたびに膨らみ続ける

#### 4.1 新しいファイル構成

```
locales/ja/
├── common.ts              ← 共通タイトル・ラベル + 機能横断エラー
├── system.ts              ← 機能横断の内部ログのみ（Bot起動/シャットダウン/Web/DB共通等）
├── features/
│   ├── index.ts           ← 全機能の re-export
│   ├── ping.ts
│   ├── afk.ts
│   ├── bumpReminder.ts
│   ├── vac.ts
│   ├── vc.ts
│   ├── messageDelete.ts
│   ├── memberLog.ts
│   ├── stickyMessage.ts
│   └── vcRecruit.ts
```

各 `features/*.ts` はコメントで4セクションに分けて管理する：

```ts
// ── コマンド定義 ─────────────────────────────  ← description, option.description
// ── UIラベル ──────────────────────────────────  ← パネルタイトル, ボタンラベル, モーダルラベル等
// ── ユーザーレスポンス ────────────────────────  ← 成功/警告/エラーの Embed 本文
// ── ログ ─────────────────────────────────────  ← 機能固有の内部ログ
```

- 機能ごとに1ファイル。その機能に関する翻訳を全て含む（ログ含む）
- `errors.ts` / `events.ts` / `commands.ts` は全廃
- `system.ts` には機能横断のログのみ残す（Bot起動/シャットダウン、エラーハンドリング共通、Web サーバー、DB 共通操作、スケジューラー共通、ロケール/JSON ユーティリティ）
- 機能横断の共通メッセージ（`validation.guild_only`、`general.unexpected_*` 等）は `common.ts` に移動

#### 4.2 移行手順

- [ ] `features/` ディレクトリ作成、機能ごとのファイルを新規作成（ja/en 両方）
- [ ] `commands.ts` の各機能セクションを対応する `features/*.ts` に移動
- [ ] `errors.ts` の機能固有キーを対応する `features/*.ts` に移動
- [ ] `errors.ts` の機能横断キー（`validation.*`, `general.*`, `permission.*`, `interaction.*`, `database.*`）を `common.ts` に移動
- [ ] `events.ts` の全キーを対応する `features/*.ts` に移動
- [ ] `system.ts` の機能固有ログを対応する `features/*.ts` に移動、機能横断ログのみ `system.ts` に残す
- [ ] i18next のリソース登録（`resources.ts`）を新構成に合わせて更新
- [ ] 全ソースファイルの翻訳キー参照（名前空間プレフィックス）を更新
- [ ] テスト内のモック・アサーションを更新
- [ ] warning レベルなのに `error` を含むキー名をリネーム（以下対象）
  - `title_input_error` → 「入力不備」等に変更
  - `title_channel_error` → 「チャンネル不正」等に変更
  - `title_config_error` → `title_config_required` との統合を検討
  - `bump-reminder.panel.error` → warning 用のキー名に変更
- [ ] `commands.ts` / `errors.ts` / `events.ts` を削除

#### 4.3 現状の不整合（具体例）

| メッセージ | 現在の名前空間 | 問題 |
|-----------|---------------|------|
| `vac.limit_out_of_range` | `errors:` | warning レベルで表示される |
| `message-delete.errors.after_invalid_format` | `commands:` | 同種の入力エラーなのに `errors:` と `commands:` に分散 |
| `bump-reminder.panel.button_mention_on` | `events:` | ボタンUIラベルなのに `events:` にある |
| `vac.panel.title` | `commands:` | イベント起点でも使われるが `commands:` にある |
| `title_input_error` | `common:` | warning レベルで表示されるのにキー名が `error` |
| `title_channel_error` | `common:` | 同上 |

### 5. 新機能実装予定

#### 5.1 各機能リセットコマンド

- [ ] 機能ごとの設定リセットコマンドを各featureに追加

#### 5.2 プロフィール機能

- [ ] 仕様書作成（`/user-info` をプロフィール情報と統合して実装予定）

#### 5.3 サポートチャンネル機能（チケット型）

- [ ] 仕様書作成

#### 5.4 ボタンリアクションロール機能

- [ ] 仕様書作成

---

## Web UI（凍結中）

> bot層が安定したら再開。緊急バグ修正のみ対応。

- Web UI仕様書作成
- 認証システム（Discord OAuth2 / JWT / セッション / 権限チェック）
- 管理API（guilds CRUD / config / stats / バリデーション）
- API仕様書（OpenAPI/Swagger）
- フロントエンド（ダッシュボード / 設定画面 / 統計表示）
- E2Eテスト追加（Discordモック利用）
- Web APIテスト拡充（ギルド管理API）
- 統合テスト拡充（主要フローのカバー）

---

## 技術的改善タスク

| カテゴリ       | タスク                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| コード品質     | ESLintルール厳格化 / 未使用コード削除 / エラーメッセージ統一                        |
| パフォーマンス | データベースクエリ最適化 / メモリ使用量プロファイリング（全機能完成後）             |
| アーキテクチャ | DI導入検討 / サービス層整理                                                         |
| セキュリティ   | 依存関係脆弱性スキャン / 入力バリデーション強化 / レート制限 / セキュリティヘッダー |

---

## 機能拡張アイデア

- 自動翻訳機能（DeepL API等）
- 投票システム（Discord標準投票との差別化: グラフ化・レポート集計）
- ギルド管理者向けエラー通知チャンネル（複数サーバー公開時）
- メトリクス収集 / アラート設定（運用規模拡大時）
