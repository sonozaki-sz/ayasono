# 実装ガイドライン

> Implementation Guidelines - 実装方針とコーディング規約

最終更新: 2026年3月16日

---

## 📋 概要

このドキュメントは、ayasono における実装時の設計方針、責務分離ルール、コメント規約を定義します。
全体設計は [ARCHITECTURE.md](ARCHITECTURE.md) を参照。

---

## 🎯 実装方針

### 基本方針

- `commands` はコマンド定義と入口処理に限定し、業務ロジックは `features` に、共通ロジックは `shared` に配置する
- `any` の導入は避け、`pnpm typecheck` を必ず通す
- 生文字列のハードコードを **禁止** する（ユーザー向け応答・ログメッセージともに i18n 経由）
- マジックナンバーの直接使用を **禁止** する（名前付き定数を定義）

### レイヤ構成ルール

#### `src/bot/commands`

- 許可: SlashCommandBuilder 定義、options 受け取り、feature 層への委譲
- 禁止: DB更新、複雑な分岐ロジック、コンポーネント collector 制御

#### `src/bot/features`

- ユースケース実装、ルール判定、状態更新、UI操作を配置する
- 推奨構成: `commands/` / `handlers/` / `handlers/ui/` / `services/` / `repositories/` / `constants/`

#### `src/bot/shared`

- Bot 層内の複数機能で共用するユーティリティを配置する
- 例: `i18nKeys.ts`、`permissionGuards.ts`、`disableComponentsAfterTimeout.ts`
- feature 固有のロジックは置かない

#### `src/shared`

- Bot/Web 両方で再利用する実装のみ配置し、`bot` / `web` へ逆依存しない
- **`database/repositories/`**: ギルド設定リポジトリの実装
- **`database/types/`**: エンティティ・リポジトリインターフェースの唯一の定義場所
- **`features/xxx/`**: `xxxConfigService.ts`・`xxxConfigDefaults.ts`
- **`utils/`**: `serviceFactory.ts`・`jsonUtils.ts`・`ttlMap.ts` 等

#### shared/features 経由の DB アクセス

Bot 層のハンドラー・ユースケースが DB へアクセスする際は、原則として `configService` 経由で行う。
リポジトリを直接取得・呼び出すことは **原則禁止** とする。

```
src/bot/features/<feature>/handlers/**
  └─ getBotXxxConfigService()            ← botCompositionRoot
       └─ XxxConfigService               ← src/shared/features/xxx/
            └─ IXxxRepository            ← src/shared/database/types/
                 └─ XxxConfigRepository  ← src/shared/database/repositories/
```

設定データ以外の **機能固有のランタイムデータ**（bump reminder 記録・sticky message 記録等）は
`src/bot/features/xxx/repositories/xxxRepository.ts` に置き、botCompositionRoot でサービスと別途組み合わせる。

**機能追加時の必須手順:**

1. `prisma/schema.prisma` に `GuildXxxConfig` モデルを追加し、マイグレーションを作成する
2. `src/shared/database/types/entities.ts` に `XxxConfig` インターフェースを、`repositories.ts` に `IXxxConfigRepository` を追記して `IGuildConfigRepository` に組み込む
3. `src/shared/database/repositories/xxxConfigRepository.ts` で実装し、`PrismaGuildConfigRepository` に追加する
4. `src/shared/features/xxx/xxxConfigDefaults.ts` にデフォルト設定と正規化関数を定義する
5. `src/shared/features/xxx/xxxConfigService.ts` に `XxxConfigService` クラスをエクスポートする
6. `src/bot/services/botCompositionRoot.ts` にアクセサを追加し、初期化・登録する
7. ハンドラーは `getBotXxxConfigService()` 経由のみでサービスを取得する

**例外**: configService が 1:1 委譲ラッパーであり、経由することで不必要な複雑性が増す場合は、リポジトリを直接使用してもよい。ただしコード内コメントで理由を明記すること。

```typescript
// ❌ 禁止
import { getBotXxxRepository } from "@/bot/features/xxx/repositories/xxxRepository";
const repo = getBotXxxRepository();

// ✅ 正しい
import { getBotXxxConfigService } from "@/bot/services/botCompositionRoot";
const service = getBotXxxConfigService();
```

#### feature ディレクトリテンプレート

```text
src/bot/features/<feature-name>/
├── commands/       # *.execute.ts, *.constants.ts 等
├── handlers/
│   └── ui/
├── services/
├── repositories/   # ランタイムデータ（設定以外）のリポジトリ
└── constants/

src/shared/features/<feature-name>/
├── xxxConfigService.ts
└── xxxConfigDefaults.ts
```

#### `index.ts`（バレル）禁止ルール

- `src` 配下では `index.ts` を作成しない（import は実体モジュールを直接参照）
- 入口ファイルは `index.ts` ではなく役割名ファイルを使う（例: `handleInteractionCreate.ts`）
- `src/bot/commands/` と `src/bot/events/` はバレル不要（自動スキャン）
- 参照先を変更した場合は、テストの `vi.mock()` パスも追従する
- **例外**: `src/shared/database/types/index.ts` は `import type` 専用バレルとして唯一許可

### 命名規則

#### ファイル名・ディレクトリ名

| 対象                    | 規則       | 例                                      |
| ----------------------- | ---------- | --------------------------------------- |
| ソースファイル（基本）  | camelCase  | `guildConfig.ts`, `memberLogService.ts` |
| SlashCommand 系ファイル | kebab-case | `afk-config.ts`, `bump-reminder.ts`     |
| ディレクトリ名          | kebab-case | `bump-reminder/`, `member-log/`         |

#### 変数・関数

| 対象     | 規則      | 例                                           |
| -------- | --------- | -------------------------------------------- |
| 変数     | camelCase | `guildId`, `panelChannel`                    |
| 関数     | camelCase | `getGuildConfig()`, `handleButtonInteraction()` |
| 定数     | UPPER_SNAKE_CASE | `INTERACTION_TIMEOUT_MS`, `MAX_ROLE_COUNT` |

#### クラス・インターフェース・型

| 対象             | 規則       | 例                                              |
| ---------------- | ---------- | ----------------------------------------------- |
| クラス           | PascalCase | `BotClient`, `BumpReminderManager`              |
| インターフェース | PascalCase（リポジトリは `I` プレフィックス） | `IGuildConfigRepository`, `IVcRecruitConfigRepository` |
| 型エイリアス     | PascalCase | `MessageStatus`, `BotEvent`                     |

#### コマンド名・イベント名（Discord API 準拠）

| 対象                                 | 規則                          | 例                                          |
| ------------------------------------ | ----------------------------- | ------------------------------------------- |
| スラッシュコマンド・サブコマンド名   | kebab-case（Discord API 制約）| `bump-reminder-config`, `set-mention`        |
| オプション名                         | kebab-case                    | `channel`, `role`                           |
| イベント名                           | `Events` enum を使用          | `Events.GuildMemberAdd`（文字列リテラル禁止）|

#### Custom ID（ボタン・セレクト・モーダル）

フォーマット: `<feature>:<action>[:<id>]`（コロン区切り、lowercase・kebab-case）

- 動的パラメータは末尾に付加する
- 定数は `src/bot/features/<feature>/constants/*.constants.ts` に集約する

```ts
// ✅
"vc-recruit:create:{panelChannelId}"
"sticky-message:set-modal:{channelId}"

// ❌
"vcRecruit_create"
"stickyMessage-setModal"
```

### コメント規約

#### ファイル先頭コメント

ファイル先頭で「何のファイルか」を明記する（必須）。

```ts
// src/bot/features/foo/fooService.ts
// Foo機能の業務ロジックを担当するサービス
```

#### 関数コメント

- 関数宣言・エクスポートされるアロー関数・クラスの public メソッドに JSDoc を記載する（必須）
- 引数がある場合は `@param`、`void` 系以外の戻り値は `@returns` を記載する（必須）
- 説明文だけの JSDoc は不完全とみなす

```ts
// ❌ NG
/** ギルド設定を取得する */
async function getGuildConfig(guildId: string): Promise<GuildConfig | null> { ... }

// ✅ OK
/**
 * ギルド設定を取得する
 * @param guildId 取得対象のギルドID
 * @returns ギルド設定（未設定時は null）
 */
async function getGuildConfig(guildId: string): Promise<GuildConfig | null> { ... }
```

#### 変数・定数コメント

- ローカル変数/定数: 原則不要
- 共用する変数・定数: 何の値かを記載する

#### 処理ブロックコメント

- 分岐・副作用・外部連携の手前に「処理の意図」を1〜2行で記載する（必須）
- 逐語的で自明な説明は禁止

### コーディングルール

#### ステータス通知は Embed ユーティリティで返す

ステータス通知（エラー・警告・情報・成功）は `src/bot/utils/messageResponse.ts` の Embed ユーティリティを使う。
プレーンテキスト返し（`editReply(string)`）を **禁止** する。

| 関数 | 絵文字（固定） | デフォルトタイトル | カラー | 引数 |
| --- | --- | --- | --- | --- |
| `createSuccessEmbed(desc, options?)` | ✅ | 成功 | 緑 | `description` 必須、`options.title` でタイトル上書き可 |
| `createInfoEmbed(desc, options?)` | ℹ️ | 情報 | 青 | 同上 |
| `createWarningEmbed(desc, options?)` | ⚠️ | 警告 | 黄 | 同上 |
| `createErrorEmbed(desc, options?)` | ❌ | エラー | 赤 | 同上 |
| `createStatusEmbed(status, title, desc, options?)` | status依存 | 任意 | status依存 | `status`, `title`, `description` 必須 |

> **注意**: `create*Embed` はタイトルに絵文字を自動プレフィックスするため、description やロケール文字列に絵文字を含めないこと。

カスタムレイアウトが必要な機能固有の Embed（パネル・サマリー等）は `new EmbedBuilder()` を直接使用してよい。
その場合のカラーは feature の `*.constants.ts` にブランドカラー定数を定義して使う（例: `VC_RECRUIT_PANEL_COLOR = 0x24b9b8`）。

**STATUS_COLORS 一覧:**

| 名前 | 用途 | 値 |
| --- | --- | --- |
| `success` | 成功通知 | `0x57f287` (Discord 緑) |
| `info` | 情報通知 | `0x3498db` (青) |
| `warning` | 警告通知 | `0xfee75c` (Discord 黄) |
| `error` | エラー通知 | `0xed4245` (Discord 赤) |
| `danger` | 破壊的操作の強調 | `0xe74c3c` (赤) |
| `muted` | 二次情報・条件表示 | `0x95a5a6` (灰) |

#### i18n（多言語対応）

ユーザー向け応答文字列・ログメッセージともに生文字列を **禁止** し、すべて `tDefault()` 経由にする。

| 対象 | 経由 | キー定義先 |
| --- | --- | --- |
| ユーザー向け応答（`editReply` / `followUp` / ボタンラベル / セレクトメニュー / モーダル / Embed） | `tDefault("commands:...")` | `ja/commands.ts`, `en/commands.ts` |
| ログメッセージ（`logger.*()` の引数） | `tDefault("system:...")` | `ja/system.ts`, `en/system.ts` |
| エラーメッセージ | `tDefault("errors:...")` | `ja/errors.ts`, `en/errors.ts` |

- ロケールキーは **ja/en 両方に同時追加** する
- DB操作は `executeWithDatabaseError` でラップし、成功時は `logger.debug`、失敗時はキー付きエラーメッセージを渡す

#### マジックナンバー禁止

タイムアウト値・制限値・閾値は名前付き定数として `*.constants.ts` に定義する。数値リテラルの直接使用を **禁止** する。

```ts
// ❌
setTimeout(() => disableComponents(), 14 * 60 * 1000);

// ✅
export const INTERACTION_TIMEOUT_MS = 14 * 60 * 1000;
setTimeout(() => disableComponents(), INTERACTION_TIMEOUT_MS);
```

#### 処理の共通化

同一・類似のロジックが2箇所以上に存在する場合、共通関数に抽出する（必須）。
配置先は同一 feature 内なら feature 直下、feature をまたぐ場合は `src/bot/shared/`。

#### UIセッション状態管理

短命な UI セッション状態は `TtlMap`（`src/shared/utils/ttlMap.ts`）を使用する。生 Map の直接エクスポートを **禁止** する。

```typescript
// ❌
export const sessions = new Map<string, SessionData>();

// ✅
import { TtlMap } from "@/shared/utils/ttlMap";
export const sessions: TtlMap<SessionData> = new TtlMap<SessionData>(TTL_MS);
```

#### タイムアウト後のコンポーネント無効化

`disableComponentsAfterTimeout`（`src/bot/shared/disableComponentsAfterTimeout.ts`）を使用する。
各 feature で `setTimeout` + `editReply` を個別に実装することを **禁止** する。

```typescript
import { disableComponentsAfterTimeout } from "@/bot/shared/disableComponentsAfterTimeout";

await interaction.reply({ components: [selectRow, buttonRow], ... });
disableComponentsAfterTimeout(interaction, [selectRow, buttonRow], TIMEOUT_MS);
```

---

## ✅ チェックリスト

### レイヤ構成

- [ ] 変更責務は適切なレイヤに配置されている（`commands` に業務ロジックがない）
- [ ] DB アクセスは `getBotXxxConfigService()` 経由になっている
- [ ] 機能追加時は Prisma スキーマ → 型定義 → リポジトリ → ConfigService → CompositionRoot の手順を踏んでいる

### コメント

- [ ] ファイル先頭コメントがある
- [ ] 関数・public メソッドに JSDoc（`@param` / `@returns` 含む）がある
- [ ] 分岐・副作用の手前に処理意図コメントがある

### 命名

- [ ] ファイル名（camelCase / SlashCommand は kebab-case）・ディレクトリ名（kebab-case）が規則に従っている
- [ ] Custom ID は `<feature>:<action>[:<id>]` フォーマットになっている

### コーディング

- [ ] ステータス通知は `create*Embed` ユーティリティで返している（プレーンテキスト返しがない）
- [ ] `create*Embed` に渡すロケール文字列に絵文字を含めていない
- [ ] ユーザー向け文字列は `tDefault()` 経由で i18n 化されている（ロケールキーは ja/en 両方に追加）
- [ ] ログメッセージは `tDefault("system:...")` 経由になっている
- [ ] マジックナンバーを使わず名前付き定数を `*.constants.ts` に定義している
- [ ] 同一・類似ロジックの重複がない（共通関数に抽出済み）
- [ ] UI セッション状態に `TtlMap` を使用している（生 Map を使っていない）
- [ ] コンポーネント無効化に `disableComponentsAfterTimeout` を使用している

### 検証

- [ ] `pnpm typecheck` が通る
- [ ] `pnpm lint` が通る
- [ ] `pnpm test` で全テストが通る
- [ ] Docker 関連ファイル変更時は `docker build --target runner .` でビルド確認している
- [ ] `import.meta.dirname` を使う関数は引数でパスを受け取る設計になっている（[詳細](ARCHITECTURE.md#コマンドイベントの自動ロード)）

---

## 🔗 関連ドキュメント

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [XSERVER_VPS_SETUP.md](XSERVER_VPS_SETUP.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [TESTING_GUIDELINES.md](TESTING_GUIDELINES.md)
