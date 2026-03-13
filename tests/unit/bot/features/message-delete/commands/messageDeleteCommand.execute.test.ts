// tests/unit/bot/features/message-delete/commands/messageDeleteCommand.execute.test.ts
// executeMessageDeleteCommand の単体テスト
// - エラー系: 全分岐カバー（権限・バリデーション・ロック）
// - 正常系: スキャン → プレビュー確認 → 最終確認 → 削除完了 の1本道

import { executeMessageDeleteCommand } from "@/bot/features/message-delete/commands/messageDeleteCommand.execute";
import { MSG_DEL_CUSTOM_ID } from "@/bot/features/message-delete/constants/messageDeleteConstants";
import type { ScannedMessageWithChannel } from "@/bot/features/message-delete/constants/messageDeleteConstants";

// ── モック関数 ──────────────────────────────────────────────────────────────

const scanMessagesMock = vi.fn();
const deleteScannedMessagesMock = vi.fn();
const parseDateStrMock = vi.fn();

const createErrorEmbedMock = vi.fn((d: string) => ({ _type: "error", description: d }));
const createWarningEmbedMock = vi.fn((d: string) => ({ _type: "warning", description: d }));
const createInfoEmbedMock = vi.fn((d: string) => ({ _type: "info", description: d }));

vi.mock("@/bot/features/message-delete/services/messageDeleteService", () => ({
  scanMessages: (...args: unknown[]) => scanMessagesMock(...args),
  deleteScannedMessages: (...args: unknown[]) => deleteScannedMessagesMock(...args),
  parseDateStr: (...args: unknown[]) => parseDateStrMock(...args),
}));

vi.mock("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder", () => ({
  buildCommandConditionsEmbed: vi.fn(() => ({ _type: "conditions" })),
  buildPreviewEmbed: vi.fn(() => ({ _type: "preview" })),
  buildPreviewComponents: vi.fn(() => []),
  buildFinalConfirmEmbed: vi.fn(() => ({ _type: "final" })),
  buildFinalConfirmComponents: vi.fn(() => []),
  buildCompletionEmbed: vi.fn(() => ({ _type: "completion" })),
  buildFilteredMessages: vi.fn((msgs: unknown[]) => msgs),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: (d: string) => createErrorEmbedMock(d),
  createWarningEmbed: (d: string) => createWarningEmbedMock(d),
  createInfoEmbed: (d: string) => createInfoEmbedMock(d),
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `t:${key}`),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/locale/helpers", () => ({
  getTimezoneOffsetForLocale: vi.fn(() => "+00:00"),
}));

// ── テスト用コレクターヘルパー ───────────────────────────────────────────────

function makeMockCollector() {
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      (handlers[event] ??= []).push(handler);
    }),
    /** stop() を呼ぶと "end" ハンドラーを "user" 理由で発火 */
    stop: vi.fn(() => {
      handlers["end"]?.forEach((h) => h(new Map(), "user"));
    }),
    _trigger(event: string, ...args: unknown[]) {
      handlers[event]?.forEach((h) => h(...args));
    },
  };
}

// ── コンポーネントインタラクションヘルパー ────────────────────────────────────

function makeComponentInteraction(customId: string, userId: string) {
  return {
    user: { id: userId },
    customId,
    locale: "en-US",
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined) as ReturnType<typeof vi.fn>,
    followUp: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

// ── メインインタラクションファクトリ ────────────────────────────────────────

interface InteractionOverrides {
  guildId?: string | null;
  userId?: string;
  hasPermission?: boolean;
  count?: number | null;
  userInput?: string | null;
  keyword?: string | null;
  daysOption?: number | null;
  afterStr?: string | null;
  beforeStr?: string | null;
  channelOption?: object | null;
  editReplies?: ReturnType<typeof vi.fn>;
}

function createInteraction(overrides: InteractionOverrides = {}) {
  const {
    guildId = "guild-1",
    userId = "user-1",
    hasPermission = true,
    count = null,
    userInput = null,
    keyword = null,
    daysOption = 7,
    afterStr = null,
    beforeStr = null,
    channelOption = null,
    editReplies,
  } = overrides;

  const me = {
    displayName: "Bot",
    permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
  };

  const mockChannel = {
    id: "channel-1",
    name: "general",
    isTextBased: () => true,
    permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    guildId: guildId ?? "guild-1",
    guild: { members: { me } },
    messages: { fetch: vi.fn().mockResolvedValue(new Map()) },
  };

  // デフォルト: どの editReply 呼び出しにもコレクター付きメッセージを返す
  const defaultEditReply = vi
    .fn()
    .mockResolvedValue({
      createMessageComponentCollector: vi.fn(() => makeMockCollector()),
    });

  return {
    guildId,
    guild: guildId
      ? {
          id: guildId,
          members: { me },
          channels: {
            fetch: vi.fn().mockResolvedValue({ size: 1, values: () => [mockChannel] }),
          },
        }
      : null,
    user: { id: userId },
    locale: "en-US",
    memberPermissions: { has: vi.fn(() => hasPermission) },
    options: {
      getInteger: vi.fn((name: string) => {
        if (name === "count") return count;
        if (name === "days") return daysOption;
        return null;
      }),
      getString: vi.fn((name: string) => {
        if (name === "user") return userInput;
        if (name === "keyword") return keyword;
        if (name === "after") return afterStr;
        if (name === "before") return beforeStr;
        return null;
      }),
      getChannel: vi.fn((name: string) => {
        if (name === "channel") return channelOption;
        return null;
      }),
    },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: editReplies ?? defaultEditReply,
    followUp: vi.fn().mockResolvedValue(undefined),
  };
}

// ── テストデータ ──────────────────────────────────────────────────────────────

const mockScannedMessages: ScannedMessageWithChannel[] = [
  {
    messageId: "msg-1",
    guildId: "guild-1",
    authorId: "user-1",
    authorDisplayName: "User One",
    channelId: "channel-1",
    channelName: "general",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    content: "Hello",
    _channel: {} as never,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// テストスイート
// ════════════════════════════════════════════════════════════════════════════

describe("executeMessageDeleteCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルト: scanMessages は即座に解決
    scanMessagesMock.mockResolvedValue(mockScannedMessages);
    deleteScannedMessagesMock.mockResolvedValue({
      totalDeleted: 1,
      channelBreakdown: { "channel-1": { name: "general", count: 1 } },
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // エラー系
  // ══════════════════════════════════════════════════════════════════════════

  describe("エラー系", () => {
    it("guildId が null の場合はエラー Embed を返して終了する", async () => {
      const interaction = createInteraction({ guildId: null });

      await executeMessageDeleteCommand(interaction as never);

      expect(createErrorEmbedMock).toHaveBeenCalledOnce();
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({ embeds: [expect.objectContaining({ _type: "error" })] }),
      );
    });

    it("フィルター指定が何もない場合は警告 Embed を返して終了する", async () => {
      // count / user / keyword / days / after / before がすべて未指定
      const interaction = createInteraction({ daysOption: null });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({ embeds: [expect.objectContaining({ _type: "warning" })] }),
      );
    });

    it("user オプションのフォーマットが不正な場合は警告 Embed を返して終了する", async () => {
      const interaction = createInteraction({ userInput: "not-a-valid-id" });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
    });

    it("days と after/before が同時指定された場合は警告 Embed を返して終了する", async () => {
      const interaction = createInteraction({ daysOption: 7, afterStr: "2024-01-01" });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
    });

    it("after の日付フォーマットが不正な場合は警告 Embed を返して終了する", async () => {
      parseDateStrMock.mockReturnValue(null);
      const interaction = createInteraction({ daysOption: null, afterStr: "not-a-date" });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
    });

    it("after が未来日時の場合は警告 Embed を返して終了する", async () => {
      parseDateStrMock.mockReturnValue(new Date(Date.now() + 86_400_000));
      const interaction = createInteraction({ daysOption: null, afterStr: "2030-01-01" });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
    });

    it("before の日付フォーマットが不正な場合は警告 Embed を返して終了する", async () => {
      parseDateStrMock.mockReturnValue(null);
      const interaction = createInteraction({ daysOption: null, beforeStr: "not-a-date" });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
    });

    it("before が未来日時の場合は警告 Embed を返して終了する", async () => {
      // YYYY-MM-DD 形式の場合: parseDateStr が2回呼ばれる（endOfDay=true / false）
      parseDateStrMock.mockReturnValue(new Date("2030-01-01T00:00:00Z"));
      const interaction = createInteraction({ daysOption: null, beforeStr: "2030-01-01" });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
    });

    it("after >= before の場合は警告 Embed を返して終了する", async () => {
      // after=Jan 10、before=Jan 1（逆転）
      parseDateStrMock
        .mockReturnValueOnce(new Date("2024-01-10T00:00:00Z")) // afterStr parse
        .mockReturnValueOnce(new Date("2024-01-01T23:59:59Z")) // beforeStr parse (endOfDay=true)
        .mockReturnValueOnce(new Date("2024-01-01T00:00:00Z")); // beforeStr check (endOfDay=false)
      const interaction = createInteraction({
        daysOption: null,
        afterStr: "2024-01-10",
        beforeStr: "2024-01-01",
      });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).toHaveBeenCalledOnce();
    });

    it("ManageMessages 権限がない場合はエラー Embed を返して終了する", async () => {
      const interaction = createInteraction({ hasPermission: false });

      await executeMessageDeleteCommand(interaction as never);

      expect(createErrorEmbedMock).toHaveBeenCalledOnce();
    });

    it("同一ギルドで既に処理中の場合は警告 Embed を返して終了する（ロック）", async () => {
      const LOCK_GUILD = "guild-locked";

      // 1回目: scanMessages を永遠にブロックしてロックを保持
      scanMessagesMock.mockReturnValueOnce(new Promise<ScannedMessageWithChannel[]>(() => {}));

      const interaction1 = createInteraction({ guildId: LOCK_GUILD });
      const interaction2 = createInteraction({ guildId: LOCK_GUILD });

      // 1回目を開始（await しない）
      void executeMessageDeleteCommand(interaction1 as never);

      // deferReply + parseAndValidateOptions の2非同期境界を越えてロック取得を待機
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // 2回目: ロック済みのはずなので警告が返る
      await executeMessageDeleteCommand(interaction2 as never);

      expect(createWarningEmbedMock).toHaveBeenCalledWith(
        expect.stringContaining("t:commands:message-delete.errors.locked"),
      );
    });

    it("スキャン結果が 0 件の場合は情報 Embed を返して終了する", async () => {
      scanMessagesMock.mockResolvedValue([]);
      const interaction = createInteraction();

      await executeMessageDeleteCommand(interaction as never);

      expect(createInfoEmbedMock).toHaveBeenCalledOnce();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 正常系: スキャン → プレビュー確認 → 最終確認 → 削除完了
  // ══════════════════════════════════════════════════════════════════════════

  describe("正常系", () => {
    it("スキャン → プレビュー確認 → 最終確認 → 削除完了 の一連のフローが正常に動作する", async () => {
      // ── 各フェーズのクリックインタラクションを準備 ──

      // Phase 3: FINAL_YES クリック（deleteScannedMessages の interaction になる）
      const finalClickInteraction = makeComponentInteraction(
        MSG_DEL_CUSTOM_ID.FINAL_YES,
        "user-1",
      );

      // Phase 2: 最終確認ダイアログ（Stage 2）のコレクター
      // createMessageComponentCollector が呼ばれたら次のマイクロタスクで FINAL_YES を発火
      const finalConfirmCollector = makeMockCollector();
      const finalReplyMsg = {
        createMessageComponentCollector: vi.fn(() => {
          queueMicrotask(() => finalConfirmCollector._trigger("collect", finalClickInteraction));
          return finalConfirmCollector;
        }),
      };
      finalClickInteraction.editReply = vi.fn().mockResolvedValue(undefined);

      // Stage 2 の baseInteraction は CONFIRM_YES クリックの interaction になる
      const confirmClickInteraction = makeComponentInteraction(
        MSG_DEL_CUSTOM_ID.CONFIRM_YES,
        "user-1",
      );
      confirmClickInteraction.editReply = vi
        .fn()
        .mockResolvedValue(finalReplyMsg) as ReturnType<typeof vi.fn>;

      // Phase 2: プレビューダイアログ（Stage 1）のコレクター
      // createMessageComponentCollector が呼ばれたら次のマイクロタスクで CONFIRM_YES を発火
      const previewCollector = makeMockCollector();
      const previewReplyMsg = {
        createMessageComponentCollector: vi.fn(() => {
          queueMicrotask(() => previewCollector._trigger("collect", confirmClickInteraction));
          return previewCollector;
        }),
      };

      // Phase 1: スキャン進捗メッセージ（キャンセルボタン付き）
      const cancelCollector = makeMockCollector();
      const scanReplyMsg = {
        createMessageComponentCollector: vi.fn(() => cancelCollector),
      };

      // editReply の呼び出し順:
      //   1回目 → スキャン進捗 (scanReplyMsg)
      //   2回目 → プレビュー  (previewReplyMsg)
      //   以降  → undefined（不使用）
      const editReply = vi
        .fn()
        .mockResolvedValueOnce(scanReplyMsg)
        .mockResolvedValueOnce(previewReplyMsg)
        .mockResolvedValue(undefined);

      const interaction = createInteraction({ editReplies: editReply });

      // ── 実行 ──
      await executeMessageDeleteCommand(interaction as never);

      // ── アサーション ──

      // scanMessages が呼ばれた
      expect(scanMessagesMock).toHaveBeenCalledOnce();

      // deleteScannedMessages が呼ばれた
      expect(deleteScannedMessagesMock).toHaveBeenCalledOnce();
      expect(deleteScannedMessagesMock).toHaveBeenCalledWith(
        mockScannedMessages,
        expect.any(Function), // onProgress コールバック
        expect.any(AbortSignal),
      );

      // 削除完了 Embed が返された（finalClickInteraction.editReply で呼ばれる）
      expect(finalClickInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: [expect.objectContaining({ _type: "completion" })],
          content: "",
          components: [],
        }),
      );
    });
  });
});
