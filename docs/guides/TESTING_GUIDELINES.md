# テストガイドライン

> Testing Guidelines - テスト設計とベストプラクティス

最終更新: 2026年3月14日

---

## 📋 概要

このドキュメントは、ayasono におけるテスト設計方針・命名規則・実行方法を定義します。Vitest を前提に、回帰を素早く検知できるテスト運用を目的とします。

---

## 🎯 テスト方針

### 基本方針

1. **ロジックがある層だけをテストする**
   - テストの目的は「動作の保証」であり、コードの存在確認・定数の等値確認・配列の順序確認は目的を果たさない
   - サービス・ハンドラー・コマンド等、**条件分岐・変換・副作用の制御**を含む層のみテストを書く
   - 書いても意味がないテスト（後述の除外対象）は作成しない
2. **テストピラミッド**
   - ユニットテスト 70%
   - 統合テスト 25%
   - E2Eテスト 5%（次フェーズ）
3. **カバレッジ目標**
   - statements / lines: **95%以上**
   - functions: **88%以上**
   - branches: **94%以上**
   - ※ 除外対象ファイルを `coverage.exclude` に追加することで、ロジック層のみで閾値を維持する

> 最新のテスト統計・カバレッジは [TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照

### レイヤー別テスト方針

| レイヤー                                        | テストを書くか | 理由                                                     |
| ----------------------------------------------- | -------------- | -------------------------------------------------------- |
| `shared/features/*/xxxConfigService.ts`         | ✅ **必須**    | 条件分岐・上限チェック・正規化等のドメインロジックを含む |
| `bot/features/*/handlers/*.ts`                  | ✅ **必須**    | 早期リターン条件・エラー委譲・副作用制御のロジックを含む |
| `bot/features/*/commands/*.ts`                  | ✅ **必須**    | サブコマンドルーティング・権限ガードの分岐を含む         |
| `bot/commands/*.ts` / `bot/events/*.ts`         | ✅ **必須**    | コマンド名・イベント名・executeの委譲先を検証            |
| `bot/utils/commandLoader.ts` / `eventLoader.ts` | ✅             | ENOENT例外・重複検出の制御フローを検証                   |
| `bot/features/*/repositories/*.ts`              | ❌ **不要**    | Prisma への純粋な委譲のみ、分岐なし                      |
| `shared/database/repositories/*.ts`             | ⚠️ **要判断** | JSON 配列のパース・null→undefined 変換等の独自ロジックがある場合は必須。純粋な委譲のみなら不要 |
| `bot/services/botCompositionRoot.ts`            | ❌ **不要**    | サービスアクセサの配線のみ、ロジックなし                 |
| `bot/handlers/index.ts` / UI array barrels      | ❌ **不要**    | 配列エクスポートのみ、ロジックなし                       |

**「意味のないテスト」の判断基準**：

- 文字列・数値定数の等値確認のみ（`expect(FOO).toBe("foo")`）
- ファイルの存在確認（`existsSync()`）
- 配列の要素・順序確認のみ（`expect(arr).toEqual([a, b, c])`）
- 関数参照の同一性確認のみ（`expect(fn).toBe(fn)`）
- 全てモックで「呼ばれたか」だけを確認するリポジトリ委譲テスト

**リポジトリのテスト要否の判断（`shared/database/repositories/`）**：

`src/shared/database/repositories/xxxConfigRepository.ts` は以下のロジックを含む場合がある:
- JSON 文字列 → 配列の `parseJsonArray()` 変換
- `null` → `undefined` の変換（Prisma nullable → TypeScript optional）
- upsert パターンの create/update 分岐

これらは独自ロジックを含むため、ユニットテストが必要。純粋に Prisma を呼び出して戻すだけならテスト不要。

### カバレッジ除外対象

除外対象の正確なリストは `vitest.config.ts` の `coverage.exclude` が唯一の情報源とする（このドキュメントには複製しない）。

除外の判断基準：

- 実行可能コードなし（型定義・`*.d.ts`・再エクスポート専用ファイル）
- Prisma / 外部ライブラリへの純粋な委譲のみで独自ロジックなし
- DIの配線のみ（サービスアクセサの登録）
- 配列エクスポートのみ（UIハンドラーバレル）
- Discord collector パターンなど UI フロー制御に強依存してユニットテストが困難

新たに除外対象が生じた場合は `vitest.config.ts` の `coverage.exclude` **のみ**を更新する（コメントで除外理由を記載する）。

### import方針とテスト追従

- 実装方針は「`index.ts` を使わず、常に直接 import」
- そのためテストでは、**対象実装が実際に import しているパス**を `vi.mock()` する
  - 例: 実装が `@/shared/utils/logger` を参照しているなら、テストも同パスをモックする
- テストコードでも `index.ts` パスは参照せず、実体モジュールへ直接 import する
- 直接 import 化に追従していないモックは、回帰の主因になるため優先修正対象とする
- `bot/features` 内部実装のテストでは、featureローカル `..` / `index` を前提にしたモックを置かず、直接モジュールパスへ追従する

### カバレッジ運用メモ

- `index.ts` を撤廃することで、再エクスポート専用ファイル由来の `Functions` ノイズを削減できる
- 実体モジュールのテストに集約し、公開面の検証も同じ実体パスで行う
- **型専用ファイルの除外**: 実行可能なコードを持たない型定義・再エクスポートのみのファイルは `coverage.exclude` に追加する（istanbul による誤検知回避）
- **カバレッジプロバイダ**: `istanbul` を使用する（v8 から移行済み）

---

## ✅ 新機能テスト実装チェックリスト

新機能を実装した際は、`src/` の **すべてのレイヤ** に対応するテストを作成する。
特定レイヤだけでなく、薄いラッパーファイルもカバレッジ対象であることに注意する。

### 対象ファイルマップ（例: member-log 機能）

| src/ ファイル                                              | テスト必須 | 備考                                                       |
| ---------------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| `bot/commands/xxx-config.ts`                               | ✅         | コマンド名・execute委譲を検証                              |
| `bot/events/xxxEvent.ts`                                   | ✅         | イベント名・once・execute委譲を検証                        |
| `bot/features/xxx/commands/xxxCommand.execute.ts`          | ✅         | サブコマンドルーティングを検証                             |
| `bot/features/xxx/commands/xxxCommand.guard.ts`            | ✅         | 権限チェック分岐を検証                                     |
| `bot/features/xxx/commands/xxxCommand.yyyy.ts`             | ✅         | 各サブコマンドの正常・エラーを検証                         |
| `bot/features/xxx/handlers/xxxHandler.ts`                  | ✅         | 早期リターン・正常フロー・エラーを検証                     |
| `shared/features/xxx/xxxConfigService.ts`                  | ✅         | DB操作の全分岐を検証                                       |
| `shared/database/repositories/xxxConfigRepository.ts`      | ⚠️ 要判断 | JSON パース・null変換等の独自ロジックがある場合は必須      |

> `bot/services/botCompositionRoot.ts` はサービスアクセサの配線のみでロジックがないため、テスト・カバレッジ対象外。

### チェックリスト

- [ ] `bot/commands/` の定義ファイルにテストを作成した
- [ ] `bot/events/` の定義ファイルにテストを作成した
- [ ] ハンドラーの早期リターン分岐をすべて網羅した（config=null/enabled=false/channelId=null/チャンネル不在/型不一致）
- [ ] ハンドラーの条件式（`if (x > 0)` の複数条件の組み合わせ）を網羅した
- [ ] `pnpm test:coverage` で **Stmts/Lines 95%以上・Funcs 88%以上・Branches 94%以上** を確認した

### 条件式の分岐網羅について

`if (years > 0) ... if (months > 0) ... if (days > 0 || parts.length === 0)` のような複数条件が連なるハンドラーでは、**各条件が true/false になるケースを組み合わせて**テストする。

```typescript
// NG: デフォルトのモックが { years: 5, months: 3, days: 7 } のみ → years=0/months=0 の分岐が未カバー
calcDurationMock.mockReturnValue({ years: 5, months: 3, days: 7 });

// OK: 追加テストで各条件の false パスをカバー
it("years=0, months=0 の場合でも送信される", async () => {
  calcDurationMock.mockReturnValueOnce({ years: 0, months: 0, days: 5 });
  // ...
});
it("years>0, months=0, days=0 の場合でも送信される", async () => {
  calcDurationMock.mockReturnValueOnce({ years: 1, months: 0, days: 0 });
  // ...
});
```

---

## 🏗️ テスト設計

### AAA パターン

```typescript
test("should do something", () => {
  // Arrange
  const input = "test";

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toBe("expected");
});
```

### モック戦略

- 外部依存（Discord API / DB / 外部サービス）はモック化
- 時刻依存は fake timers を優先
- ログ出力はモックし、テスト出力を安定化

### tDefault のモック（systemログアサーション）

`tDefault("system:xxx")` を呼び出す実装をテストする場合、`localeManager` モックにキーをそのまま返す実装を指定する：

```typescript
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string, options?: Record<string, unknown>) =>
    options?.signal ? `${key}:${options.signal}` : key,
  ),
  tGuild: tGuildMock,
}));

// アサーション例
expect(loggerMock.error).toHaveBeenCalledWith(
  "system:bump-reminder.panel_handle_failed",
  expect.any(Error),
);
```

キーがそのまま返るため、アサーションで `"system:xxx.yyy"` 形式の文字列を期待値として指定すればよい。

### テスト命名規則

```typescript
describe("ClassName/FunctionName", () => {
  describe("methodName", () => {
    it("should [期待する動作] when [条件]", () => {
      // test
    });
  });
});
```

### 配置・ファイル名ルール（src対称化）

- テスト配置は `tests/unit` / `tests/integration` を維持する
- 各配下のディレクトリは `src` の構成に対称化する
- ファイル名は **camelCase固定にしない**。`src` 側のベース名に一致させる（`kebab-case` を含む）
- 単体テストは `*.test.ts`、統合テストは `*.integration.test.ts` を使う
- `src` 参照は原則 `@/` エイリアスを使う

### src↔tests マッピング監査ルール（2026-02-21）

- 監査対象は **実行対象の TypeScript モジュール**（`src/**/*.ts`）とする
- 次は監査対象外とする
  - 宣言ファイル: `src/**/*.d.ts`
  - ビルド生成物・補助ファイル
- 理由: `.d.ts` は型宣言専用で Vitest 実行対象ではなく、`*.test.ts` と 1:1 対応を強制しないため
- 具体例: `src/shared/locale/i18next.d.ts` はマッピング残件として扱わない

---

## ▶️ テストの実行方法

```bash
# すべてのテスト
pnpm test

# ウォッチ実行
pnpm test:watch

# カバレッジ付き実行
pnpm test:coverage
```

実装状況は [../progress/TEST_PROGRESS.md](../progress/TEST_PROGRESS.md) を参照してください。

---

## 📁 テスト構成（再編後）

```text
tests/
├── setup.ts
├── tsconfig.json
├── helpers/
│   └── testHelpers.ts
├── unit/                               # src対称（unit）
│   ├── bot/
│   │   ├── commands/
│   │   ├── events/
│   │   ├── errors/
│   │   ├── features/
│   │   ├── handlers/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── shared/
│   │   ├── config/
│   │   ├── database/
│   │   ├── errors/
│   │   ├── features/
│   │   ├── locale/
│   │   ├── scheduler/
│   │   └── utils/
│   └── web/
│       ├── middleware/
│       └── routes/
├── integration/                        # src対称（integration）
│   ├── bot/
│   │   ├── events/
│   │   │   ├── interactionCreate.command.integration.test.ts
│   │   │   └── interactionCreate.routing.integration.test.ts
│   │   └── features/
│   │       └── bump-reminder/
│   │           ├── repositories/bumpReminderRepository.integration.test.ts
│   │           └── services/bumpReminderService.integration.test.ts
│   └── shared/
│       └── database/
│           └── repositories/guildConfigRepository.integration.test.ts
└── e2e/                                # 次フェーズ
```

---

## 🧭 E2Eテスト方針

- Discord API は E2E でもモックを使う
- DB はテスト専用ストレージ（隔離済み）を使い、ケースごとに初期化する
- 時刻依存は fake timers を使い、実時間待機を避ける
- テストファイルは `tests/e2e/` に機能単位で配置する
- **E2E シナリオは各機能の仕様書（`docs/specs/`）に記載する**

---

## 🛠️ テストヘルパー

`tests/helpers/testHelpers.ts` の主要ヘルパー:

- `createMockUser()`
- `createMockGuild()`
- `createMockMember()`
- `createMockTextChannel()`
- `createMockInteraction()`
- `wait()`
- `generateSnowflake()`
- `createTestGuildConfig()`
- `expectError()`

---

## ⚙️ テスト設定

### `vitest.config.ts` の主な設定

- プロバイダ: `istanbul`（カバレッジ）
- テスト環境: `node`
- グローバル API: `globals: true`（`describe` / `it` / `expect` / `vi` が import 不要）
- セットアップファイル: `tests/setup.ts`
- タイムアウト: 10秒（デフォルト）
- モック自動リセット: `clearMocks: true`、`restoreMocks: true`
- `@/` エイリアス: `src/` に解決
- **カバレッジしきい値**: `{ branches: 94, functions: 88, lines: 95, statements: 95 }`

### モジュール解決エラー時の確認

```typescript
// vitest.config.ts
resolve: {
  alias: {
    "@": resolve(__dirname, "src"),
  },
}
```

---

## 📝 テストコメント規約

### 1. ファイル先頭コメント

**必須**: 全テストファイルの先頭 1 行目に `// tests/path/to/file.test.ts` 形式でファイルパスを記載する。

```typescript
// tests/unit/bot/features/foo/fooHandler.test.ts
```

### 2. describe ブロック前のコメント

**必須**: `describe` の直前に、そのグループが検証する内容（何を・どの観点で）を 1 行で記載する。

```typescript
// fooHandler の正常フロー・早期リターン・エラー委譲を検証
describe("bot/features/foo/fooHandler", () => {
```

ネストした `describe` には、サブグループの観点を同様に付与する。

```typescript
// 入力バリデーション系のケース
describe("validation", () => {
```

### 3. beforeEach / afterEach 前のコメント

**必須**: なぜそのセットアップ・後処理が必要かを記述する。

```typescript
// 各ケースでモック呼び出し記録をリセットし、テスト間の副作用を排除する
beforeEach(() => {
  vi.clearAllMocks();
});

// 偽タイマーを実タイマーに戻して後続テストへの影響を防ぐ
afterEach(() => {
  vi.useRealTimers();
});
```

### 4. it ブロックの記述

`it` の文字列に**日本語で検証の観点・条件・前提**を直接記載する。別途コメントは不要。

```typescript
it("embed フィールドが 1024 文字を超える場合に切り詰めることを確認", () => { ... });

it("panelMessageId が null の場合は finally での削除処理をスキップする", () => { ... });

it("DB にレコードが存在する場合はその値を返す", () => { ... });
```

### 5. 動的インポート / モジュールキャッシュ起因のセットアップ

`vi.resetModules()` + `vi.doMock()` を使う場合は、その理由を明記する。

```typescript
// シングルトンキャッシュをテスト間でリセットするため動的インポートを使用
async function loadModule() {
  vi.resetModules();
  vi.doMock("@/shared/config/env", () => ({ env: { ... } }));
  return import("@/bot/features/foo/fooService");
}
```

### コメントの書き方まとめ

| 場所                            | 必須/推奨 | 内容                                      |
| ------------------------------- | --------- | ----------------------------------------- |
| 場所                            | 必須/推奨 | 内容                                      |
| ------------------------------- | --------- | ----------------------------------------- |
| ファイル先頭                    | 必須      | `// tests/path/to/file.test.ts`           |
| `describe` 直前                 | 必須      | 検証グループの目的（1行）                 |
| `beforeEach` / `afterEach` 直前 | 必須      | セットアップ・後処理の理由（1行）         |
| `it` 文字列                     | **必須**  | 日本語で検証内容・条件・制約を直接記載    |
| 動的インポート関数              | 必須      | モジュールキャッシュリセットの理由（1行） |

---

## 🔗 関連ドキュメント

- [../progress/TEST_PROGRESS.md](../progress/TEST_PROGRESS.md): テスト実装進捗
- [../../TODO.md](../../TODO.md): 開発タスク一覧
- [../../README.md](../../README.md): プロジェクト概要
