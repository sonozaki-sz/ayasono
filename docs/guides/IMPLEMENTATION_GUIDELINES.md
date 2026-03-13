# 実装ガイドライン

> Implementation Guidelines - 実装方針とコーディング規約

最終更新: 2026年3月14日

---

## 📋 概要

### 目的

このドキュメントは、ayasono における実装時の設計方針、責務分離ルール、コメント規約、リファクタリング手順を定義します。機能追加・改修時に「どこへ何を書くか」を明確化し、レビューコストと将来の保守コストを下げることを目的とします。

### 対象読者

- プロジェクトの開発者
- コードレビュー担当者
- 新規参加者

### このドキュメントのスコープ

- 扱う内容: 実装時の分割方針、ファイル配置、命名/コメント規約、実装手順
- 扱わない内容: システム全体図、プロセス間関係、レイヤ境界の背景説明
- 全体設計は [ARCHITECTURE.md](ARCHITECTURE.md) を参照

### ドキュメント整合ルール

- `ARCHITECTURE.md` は「構成と責務境界」を記述する
- 本ガイドは「実装手順と実装規約」を記述する
- 同じテーマが重なる場合は、方針は `ARCHITECTURE.md`、実装詳細は本ガイドに寄せる

---

## 🎯 実装方針

### 基本方針

1. **責務分離を優先する**
   - `commands` はコマンド定義と入口処理に限定
   - 業務ロジックは `features` に配置
   - 共通ロジックは `shared` に配置

2. **既存仕様を壊さない**
   - 権限仕様、翻訳キー、レスポンス仕様は原則維持
   - リファクタでは挙動変更を含めない

3. **小さく安全に変更する**
   - 1PR 1目的を原則とする
   - 巨大ファイルは段階分割（定数→ルーター→サブ機能）で進める

4. **型安全を維持する**
   - `any` の導入は避ける
   - `pnpm run typecheck` を必ず通す

5. **ユーザー向けの応答文字列をすべて i18n 化する**
   - `editReply` / `followUp` / `reply` の `content`、ボタンラベル、セレクトメニューラベル・プレースホルダー、モーダルのラベル・プレースホルダー、Embedタイトル・説明文など、Discordユーザーの目に触れる文字列はすべて `tDefault("commands:...")` 経由にする
   - キーは `src/shared/locale/locales/ja/commands.ts` / `en/commands.ts` に定義し、両言語同時に追加する
   - 生文字列をハードコードすることを **禁止** する（英語圏ユーザー対応・将来の文言変更を容易にするため）

6. **ログメッセージを i18n 化する**
   - `logger.*()` の引数には生文字列を渡さず、`tDefault("system:...")` を使う
   - キーは `src/shared/locale/locales/ja/system.ts` / `en/system.ts` に定義する
   - DB操作は `executeWithDatabaseError` でラップし、成功時は `logger.debug`、失敗時はキー付きエラーメッセージを渡す

---

## 🏗️ レイヤ構成ルール

### `src/bot/commands`

- 許可:
  - SlashCommandBuilder の定義
  - options の受け取り
  - feature 層への委譲
  - 最終的な `execute` 入口
- 非推奨:
  - DB更新
  - 複雑な分岐ロジック
  - コンポーネント collector 制御
  - 長い業務処理

### `src/bot/features`

- 許可:
  - ユースケース実装
  - ルール判定
  - 状態更新
  - UI操作（必要な場合）
- 推奨構成:
  - `commands/`（コマンド別の実行処理）
  - `handlers/`（イベント境界）
  - `handlers/ui/`（Button/Select/Modal などUI境界）
  - `services/`（機能サービス）
  - `repositories/`（永続化アクセス）
  - `constants/`（定数・型ガード・変換ヘルパー）

### `src/bot/shared`

- Bot 層内の複数機能で共用するユーティリティを配置する
- 例: `i18nKeys.ts`（共通 i18n キー定数）、`permissionGuards.ts`（共通権限チェック関数）
- `bot/features` 固有のロジックは置かない（feature 固有なら feature ディレクトリへ）

### `src/shared`

- Bot/Web 両方で再利用する実装のみ配置
- `shared` から `bot` / `web` へ逆依存しない
- **`src/shared/database/repositories/`**: ギルド設定リポジトリの実装（`xxxConfigRepository.ts`）を配置する
- **`src/shared/database/types/`**: エンティティインターフェース（`entities.ts`）とリポジトリインターフェース（`repositories.ts`）の唯一の定義場所
- **`src/shared/features/xxx/`**: `xxxConfigService.ts`・`xxxConfigDefaults.ts` を配置する
- **`src/shared/utils/`**: `serviceFactory.ts`（`createBotServiceAccessor` / `createServiceGetter`）・`jsonUtils.ts` 等の汎用ユーティリティ

### shared/features 経由の DB アクセス（2026-02-22 追加）

Bot 層のハンドラー・ユースケースが DB へアクセスする際は、必ず `src/shared/features/<feature>/` の `configService` 経由で行う。
リポジトリ実装を Bot 層のハンドラーから直接取得・呼び出すことを **禁止** する。

**正しいアクセス経路（ギルド設定データ）:**

```
src/bot/features/<feature>/handlers/**
  └─ getBotXxxConfigService()            ← botCompositionRoot（サービスアクセサ）
       └─ XxxConfigService               ← src/shared/features/xxx/xxxConfigService.ts
            └─ IXxxRepository            ← src/shared/database/types/（インターフェース定義）
                 └─ XxxConfigRepository  ← src/shared/database/repositories/xxxConfigRepository.ts（実装）
                      └─ guildConfigRepository を経由して PrismaGuildConfigRepository に集約
```

> 設定データ以外の **機能固有のランタイムデータ**（bump reminder 記録・sticky message 記録等）は
> `src/bot/features/xxx/repositories/xxxRepository.ts` に置き、botCompositionRoot でサービスと別途組み合わせる。

**新機能（ギルド設定付き）追加時の必須手順:**

1. `prisma/schema.prisma` に `GuildXxxConfig` モデルを追加し、マイグレーションを作成する
2. `src/shared/database/types/entities.ts` に `XxxConfig` インターフェースを追記し、`src/shared/database/types/repositories.ts` に `IXxxConfigRepository` インターフェースを追記して `IGuildConfigRepository` に組み込む
3. `src/shared/database/repositories/xxxConfigRepository.ts` で `IXxxConfigRepository` を実装し、`src/shared/database/repositories/guildConfigRepository.ts` の `PrismaGuildConfigRepository` に追加する
4. `src/shared/features/xxx/xxxConfigDefaults.ts` を新規作成し、デフォルト設定オブジェクトと正規化関数（配列の防御コピー等）を定義する
5. `src/shared/features/xxx/xxxConfigService.ts` を新規作成し `XxxConfigService` クラスと `createXxxConfigService` / `getXxxConfigService` をエクスポートする
6. `src/bot/services/botCompositionRoot.ts` に `createBotServiceAccessor<XxxConfigService>()` でアクセサを追加し、`initializeBotCompositionRoot` 内で初期化・登録する
7. ハンドラーは `getBotXxxConfigService()` 経由のみでサービスを取得する

**違反例（禁止）:**

```typescript
// ❌ リポジトリを直接取得して操作
import { getBotXxxRepository } from "@/bot/features/xxx/repositories/xxxRepository";
const repo = getBotXxxRepository();
await repo.findByChannel(channelId);
```

**正例:**

```typescript
// ✅ configService 経由でアクセス
import { getBotXxxConfigService } from "@/bot/services/botCompositionRoot";
const service = getBotXxxConfigService();
await service.findByChannel(channelId);
```

> **背景**: sticky-message 機能の初期実装でハンドラーがリポジトリを直接参照していたため、後からリファクタリングが必要になった事例（2026-02-22 修正: commit `1c197d4`）。再発防止のためルール化した。

### feature ディレクトリ標準テンプレート

**Bot 層（機能実装）:**

```text
src/bot/features/<feature-name>/
├── commands/       # 例: `*.execute.ts`, `*.constants.ts`, `*.autocomplete.ts`
├── handlers/
│   └── ui/
├── services/       # 機能固有のビジネスロジック（BumpReminderManager 等）
├── repositories/   # 機能固有のランタイムデータ（設定以外）のリポジトリ
└── constants/
```

**Shared 層（設定管理）:**

```text
src/shared/features/<feature-name>/
├── xxxConfigService.ts      # 設定の取得・更新ロジック（ConfigService クラス）
└── xxxConfigDefaults.ts     # デフォルト設定・正規化関数（normalizeFoo / createDefaultFoo）

src/shared/database/repositories/
└── xxxConfigRepository.ts   # ギルド設定テーブルの CRUD 実装（IXxxConfigRepository 実装）
```

> `repositories/` が bot 層にある場合はランタイムデータ（bump reminder 記録・sticky message 本文等）を扱う。
> ギルド設定データ（有効/無効、チャンネル ID 等）のリポジトリは必ず `src/shared/database/repositories/` に置く。

### `index.ts`（バレル）禁止ルール

- `src` 配下では `index.ts` を作成しない
- import は常に実体モジュールを直接参照する
  - 例: `../locale/localeManager`, `../utils/logger`
- 入口ファイルは `index.ts` ではなく役割名ファイルを使う
  - 例: `apiRoutes.ts`, `handleInteractionCreate.ts`, `resources.ts`
  - `src/bot/commands/` と `src/bot/events/` は **バレル不要**。`commandLoader.ts` / `eventLoader.ts` がディレクトリを自動スキャンするため、ファイルを追加するだけで自動登録される
- 参照先を変更した場合は、関連テストの `vi.mock()` / `import()` パスも実解決先へ追従する
- **例外: `src/shared/database/types/index.ts`** は型定義の集約ポイントとして唯一の例外とする。実行可能コードを持たない `import type` 専用バレルであり、`IGuildConfigRepository` 等を `../../shared/database/types` 経由でインポートする用途に限り許可する

---

## 💬 Discord レスポンスパターン

### 必須ルール: ステータス通知は必ず Embed で返す

コマンドの実行結果として**エラー・警告・情報・成功**をユーザーに通知する際は、`editReply(string)` や `followUp({ content: string })` のようなプレーンテキスト返しを **禁止** し、必ず `src/bot/utils/messageResponse.ts` の Embed ユーティリティを使う。

```typescript
// ❌ 禁止: プレーンテキストでステータスを返す
await interaction.editReply(tDefault("commands:foo.errors.bar"));
await interaction.followUp({ content: tDefault("commands:foo.errors.bar") });

// ✅ 正しい: Embed ユーティリティを使う
await interaction.editReply({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
});
await interaction.followUp({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
  ephemeral: true,
});
```

> **背景**: message-delete 機能の初期実装でエラー返答にプレーンテキストを使用しており、後から Embed 化が必要になった（2026-02-28 修正）。再発防止のためルール化した。

### Embed ユーティリティ（messageResponse.ts）

ステータス通知（エラー・警告・情報・成功）には、`src/bot/utils/messageResponse.ts` のユーティリティ関数を使う。

| 関数                                            | ステータス | タイトル自動付与                   | カラー     |
| ----------------------------------------------- | ---------- | ---------------------------------- | ---------- |
| `createSuccessEmbed(description)`               | success    | `✅ 成功`                          | 緑         |
| `createInfoEmbed(description)`                  | info       | `ℹ️ 情報`                          | 青         |
| `createWarningEmbed(description)`               | warning    | `⚠️ 警告`                          | 黄         |
| `createErrorEmbed(description)`                 | error      | `❌ エラー`                        | 赤         |
| `createStatusEmbed(status, title, description)` | 任意       | 任意（絵文字は自動プレフィックス） | status依存 |

#### ⚠️ 絵文字の二重付加に注意

`create*Embed` 系は内部で `${emoji} ${title}` としてタイトルに絵文字を自動プレフィックスする。
そのため **description（本文）に渡すロケール文字列には絵文字を含めてはならない。**

```typescript
// ❌ NG: ロケール文字列に絵文字が含まれている → タイトルと二重になる
// ja/commands.ts: "foo.errors.bar": "⚠️ 条件が不正です"
await interaction.editReply({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
  // 結果: タイトル "⚠️ 警告"  + description "⚠️ 条件が不正です"  ← 二重
});

// ✅ OK: ロケール文字列に絵文字を含めない
// ja/commands.ts: "foo.errors.bar": "条件が不正です"
await interaction.editReply({
  embeds: [createWarningEmbed(tDefault("commands:foo.errors.bar"))],
  // 結果: タイトル "⚠️ 警告"  + description "条件が不正です"  ← 正常
});
```

#### 使い分け

| 用途                                                          | 手段                            | 必須/任意 |
| ------------------------------------------------------------- | ------------------------------- | --------- |
| バリデーションエラー・権限エラー等のフィードバック            | `create*Embed` ユーティリティ   | **必須**  |
| 情報・成功通知                                                | `create*Embed` ユーティリティ   | **必須**  |
| カスタムレイアウトが必要なドメイン固有Embed（削除サマリー等） | `new EmbedBuilder()` を直接使用 | 任意      |
| ダイアログ本文・確認メッセージ等（Embed でなくてよい）        | `content:` に文字列             | 任意      |

`new EmbedBuilder().setTitle(tDefault("..."))` の場合はユーティリティを経由しないため、ロケール文字列中に絵文字を含めても二重にはならない。

```typescript
// ✅ OK: setTitle に直渡し → ユーティリティの自動プレフィックスなし
// ja/commands.ts: "foo.embed.summary_title": "✅ 削除完了"
new EmbedBuilder().setTitle(tDefault("commands:foo.embed.summary_title"));
// 結果: "✅ 削除完了"（絵文字は1つ）
```

---

## 📂 命名規則

### ファイル名

| 対象                    | 規則       | 例                                      |
| ----------------------- | ---------- | --------------------------------------- |
| ソースファイル（基本）  | camelCase  | `guildConfig.ts`, `memberLogService.ts` |
| SlashCommand 系ファイル | kebab-case | `afk-config.ts`, `bump-reminder.ts`     |

- SlashCommand 系とは `src/bot/commands/` 配下のコマンドエントリファイルを指す
- それ以外の `features/`, `services/`, `handlers/`, `shared/` 等は camelCase を使う

### ディレクトリ名

- すべてのディレクトリ名は **kebab-case** を使う
  - 例: `bump-reminder/`, `member-log/`, `sticky-message/`

### discord.js 準拠の命名

Discord API および discord.js の制約に従い、以下を遵守する。

#### イベント名

- `Events` enum（discord.js 提供）を使用し、文字列リテラルを直接書かない
- イベントハンドラーのファイル名はイベント名に対応する camelCase にする

```ts
// ✅ Events enum を使う
export const guildMemberAddEvent: BotEvent<typeof Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  // ...
};

// ❌ 文字列リテラルは使わない
name: "guildMemberAdd",
```

#### スラッシュコマンド・サブコマンド・オプション名

Discord API の仕様により **すべて kebab-case（lowercase）** にする。

```ts
// ✅ kebab-case
new SlashCommandBuilder().setName("bump-reminder-config")
subcommand.setName("set-mention")
option.setName("channel")

// ❌ camelCase / snake_case は使わない
setName("bumpReminderConfig")
setName("set_mention")
```

#### Custom ID（ボタン・セレクト・モーダル）

- フォーマット: `<feature>:<action>[:<id>]`（コロン区切り、すべて lowercase・kebab-case）
- 動的パラメータは末尾に付加する
- 定数は `src/bot/features/<feature>/constants/` の `*.constants.ts` に集約する

```ts
// ✅ コロン区切り・kebab-case
"vc-recruit:create:{panelChannelId}"
"sticky-message:set-modal:{channelId}"
"sticky-message:view-select"

// ❌ camelCase や不統一なセパレータは使わない
"vcRecruit_create"
"stickyMessage-setModal"
```

---

## 📝 コメント規約

実装コードの可読性とレビュー効率を揃えるため、以下を必須とします。

### 1. ファイル先頭コメント

- 必須: ファイル先頭で「何のファイルか」を明記する
- 例:

```ts
// src/bot/features/foo/fooService.ts
// Foo機能の業務ロジックを担当するサービス
```

### 2. 関数コメント

- 必須: 関数宣言（`function` / `export function` / `async function`）の先頭に JSDoc を記載
- 必須: `export const foo = ...` のようにモジュール公開されるアロー関数にも同等の JSDoc を付与する
- **必須: クラスの public メソッドにも同等の JSDoc を付与する**（`private` は推奨）
- 内部専用のアロー関数（非エクスポート）への JSDoc 付与は推奨
- 必須: 引数がある場合は `@param` を記載する
- 必須: `void` / `Promise<void>` 以外の戻り値を持つ場合は `@returns` を記載する（`void` 系は省略可）
- **説明文だけの JSDoc ブロックは不完全とみなす。`@param`/`@returns` を必ずセットで記載すること**

```ts
// ❌ NG: 説明文のみで @param / @returns が抜けている
/**
 * ギルド設定を取得する
 */
async function getGuildConfig(guildId: string): Promise<GuildConfig | null> { ... }

// ✅ OK: @param / @returns をセットで記載
/**
 * ギルド設定を取得する
 * @param guildId 取得対象のギルドID
 * @returns ギルド設定（未設定時は null）
 */
async function getGuildConfig(guildId: string): Promise<GuildConfig | null> { ... }
```

> **背景**: message-delete 機能の実装時（2026-02-28）に、JSDoc の説明文は存在するが `@param`/`@returns` が抜けている関数が複数あり後から一括追加が必要になった事例。再発防止のためルール明示した。

### 3. 変数・定数コメント

- ローカル変数/ローカル定数: 原則コメント不要
- ファイル内/外で共用する変数・定数: 何の値かを記載
  - 例: コマンド名定数、CustomId接頭辞、制限値

### 4. 処理ブロックコメント

- 必須: 分岐・副作用・外部連携の手前に「処理の意図」を記載
- 推奨: 1〜2行で簡潔に書く
- 禁止: 逐語的で自明な説明

---

## 🔁 リファクタリング手順（推奨）

1. **定数切り出し**
   - コマンド名・選択値・共用IDを `*.constants.ts` に集約

2. **ルーター化**
   - `*.execute.ts` を入口専用にし、サブコマンドで分岐のみ行う

3. **処理分割**
   - サブコマンドごとに `*.enable.ts` / `*.disable.ts` のように分割

4. **共通ガード抽出**
   - 権限チェック等を `*.guard.ts` に集約

5. **検証**
   - `pnpm run typecheck`
   - 必要に応じて `pnpm test`

---

## ✅ 実装チェックリスト

- [ ] 変更責務は適切なレイヤに配置されている
- [ ] `commands` に業務ロジックが残っていない
- [ ] DB アクセスは `getBotXxxConfigService()` 経由（ハンドラーからリポジトリを直接呼ぶな）
- [ ] 新機能の `ConfigService` が `src/shared/features/xxx/` に、`IXxxConfigRepository` が `src/shared/database/types/repositories.ts` に、リポジトリ実装が `src/shared/database/repositories/xxxConfigRepository.ts` に定義されている
- [ ] 新機能のデフォルト設定・正規化関数が `src/shared/features/xxx/xxxConfigDefaults.ts` に定義されている
- [ ] Prisma スキーマに `GuildXxxConfig` モデルを追加し、マイグレーションを作成している（新機能の場合）
- [ ] ファイル名は命名規則に従っている（基本 camelCase / SlashCommand 系は kebab-case）
- [ ] ディレクトリ名は kebab-case になっている
- [ ] ファイル先頭コメントがある
- [ ] 関数宣言・エクスポートされるアロー関数に JSDoc がある（説明文のみは不可。`@param` / `@returns` をセットで記載。`@returns` は `void`/`Promise<void>` の場合は省略可）
- [ ] クラスの public メソッドにも JSDoc（`@param` / `@returns` 含む）がある
- [ ] 共用定数に説明コメントがある
- [ ] 処理ブロックの意図コメントがある
- [ ] テストの `it()` 文字列に日本語で検証の観点・条件・前提を記載している
- [ ] 新機能実装時は `bot/commands/`・`bot/events/` のテストも作成している（[テストチェックリスト参照](TESTING_GUIDELINES.md#-新機能テスト実装チェックリスト)）
  - `bot/commands/<name>.ts` と `bot/events/<name>.ts` は **バレルへの手動追加不要**。ファイルを置くだけで `commandLoader.ts` / `eventLoader.ts` が自動ロードする
- [ ] `pnpm test:coverage` で **Stmts/Lines 95%以上・Funcs 88%以上・Branches 94%以上** を確認した
- [ ] `typecheck` が通る
- [ ] ユーザー向け応答文字列（`editReply` / `followUp` / `reply` の `content`・ボタンラベル・Embedタイトル/説明文等）に生文字列をハードコードしていない
- [ ] エラー・警告・情報・成功のステータス通知を `create*Embed` ユーティリティ（`createErrorEmbed` 等）で返しており、`editReply(string)` のようなプレーンテキスト返しを使っていない
- [ ] ロケールキーを ja/commands.ts と en/commands.ts の両方に追加している
- [ ] ログメッセージは `tDefault("system:...")` 経由になっている（生文字列を logger に渡していない）
- [ ] `create*Embed` ユーティリティに渡すロケール文字列に絵文字を含めていない（絵文字はタイトルに自動付与されるため二重になる）
- [ ] （src整備時）再分析 → コメント反映 → ドキュメント同期 → TODO同期の順序を守っている
- [ ] **Dockerfile / docker-compose / deploy.yml を変更した場合は `docker build --target runner .` でローカルビルドが通ることを確認している**（[詳細](DEPLOYMENT.md#️⃣-6-dockerデプロイ関連ファイルの変更ルール)）
- [ ] **ファイルシステムのパスに `import.meta.dirname` を使う関数を新たに追加する場合、tsup の `splitting: true` でチャンクに移動される可能性があるため、パスは引数で受け取り呼び出し元（`main.ts` 等）から渡す**（[詳細](ARCHITECTURE.md#コマンドイベントの自動ロード)）

---

## 🔗 関連ドキュメント

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md)
