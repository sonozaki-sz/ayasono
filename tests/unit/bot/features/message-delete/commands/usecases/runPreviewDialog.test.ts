// tests/unit/bot/features/message-delete/commands/usecases/runPreviewDialog.test.ts

import type { Mock } from "vitest";
import type { AllParseKeys } from "@/shared/locale/i18n";

const buildCommandConditionsEmbedMock = vi.fn(() => ({ _type: "conditions" }));
const buildPreviewEmbedMock = vi.fn(() => ({ _type: "preview" }));
const buildPreviewComponentsMock = vi.fn(() => []);
const buildFilteredMessagesMock = vi.fn((msgs: unknown[]) => msgs);
const createWarningEmbedMock = vi.fn((d: string) => ({
  _type: "warning",
  description: d,
}));
const showFilterModalMock = vi.fn();
const showJumpModalMock = vi.fn();
const applyModalFilterValueMock = vi.fn(
  (
    ..._args: any[]
  ): { filter: Record<string, unknown>; errorKey?: AllParseKeys } => ({
    filter: {},
    errorKey: undefined,
  }),
);
const getTimezoneOffsetForLocaleMock = vi.fn((..._args: any[]): string => "+00:00");

vi.mock(
  "@/bot/features/message-delete/commands/messageDeleteEmbedBuilder",
  () => ({
    buildCommandConditionsEmbed: (...args: any[]) =>
      (buildCommandConditionsEmbedMock as (...a: any[]) => unknown)(...args),
    buildPreviewEmbed: (...args: any[]) =>
      (buildPreviewEmbedMock as (...a: any[]) => unknown)(...args),
    buildPreviewComponents: (...args: any[]) =>
      (buildPreviewComponentsMock as (...a: any[]) => unknown)(...args),
    buildFilteredMessages: (...args: any[]) =>
      (buildFilteredMessagesMock as (...a: any[]) => unknown)(...args),
  }),
);

vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: (d: string) => createWarningEmbedMock(d),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  ),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/locale/helpers", () => ({
  getTimezoneOffsetForLocale: (...args: any[]) =>
    getTimezoneOffsetForLocaleMock(...args),
}));

vi.mock(
  "@/bot/features/message-delete/commands/usecases/dialogUtils",
  async (importOriginal) => {
    const orig =
      await importOriginal<
        typeof import("@/bot/features/message-delete/commands/usecases/dialogUtils")
      >();
    return {
      ...orig,
      showFilterModal: (...args: any[]) => showFilterModalMock(...args),
      showJumpModal: (...args: any[]) => showJumpModalMock(...args),
      applyModalFilterValue: (...args: any[]) =>
        applyModalFilterValueMock(...args),
    };
  },
);

/** Flush all pending microtasks so async handlers after `await editReply` are registered */
async function flushMicrotasks() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

function makeMockCollector() {
  const handlers: Record<
    string,
    ((...args: any[]) => Promise<void> | void)[]
  > = {};
  return {
    on: vi.fn(
      (event: string, handler: (...args: any[]) => Promise<void> | void) => {
        (handlers[event] ??= []).push(handler);
      },
    ),
    stop: vi.fn(),
    async _trigger(event: string, ...args: unknown[]) {
      const hs = handlers[event] ?? [];
      for (const h of hs) {
        await h(...args);
      }
    },
  };
}

function makeComponentInteraction(
  customId: string,
  userId = "user-1",
  extra: Partial<{
    isStringSelectMenu: boolean;
    values: string[];
  }> = {},
) {
  return {
    user: { id: userId },
    customId,
    locale: "en-US",
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined) as Mock,
    isStringSelectMenu: vi.fn(() => extra.isStringSelectMenu ?? false),
    values: extra.values ?? [],
  };
}

const MSG_DEL_CUSTOM_ID = {
  CONFIRM_YES: "msgdel_confirm_yes",
  CONFIRM_NO: "msgdel_confirm_no",
  CONFIRM_EXCLUDE: "msgdel_confirm_exclude",
  FIRST: "msgdel_first",
  PREV: "msgdel_prev",
  NEXT: "msgdel_next",
  LAST: "msgdel_last",
  JUMP: "msgdel_jump",
  FILTER_AUTHOR: "msgdel_filter_author",
  FILTER_RESET: "msgdel_filter_reset",
  FILTER_DAYS: "msgdel_filter_days",
  FILTER_AFTER: "msgdel_filter_after",
  FILTER_BEFORE: "msgdel_filter_before",
  FILTER_KEYWORD: "msgdel_filter_keyword",
};

const DUMMY_OPTIONS = {
  count: 1000,
  targetUserId: undefined,
  keyword: undefined,
  daysOption: undefined,
  afterStr: undefined,
  beforeStr: undefined,
  channelId: undefined,
  afterTs: 0,
  beforeTs: Infinity,
};

describe("bot/features/message-delete/commands/usecases/runPreviewDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildFilteredMessagesMock.mockImplementation((msgs: unknown[]) => msgs);
  });

  async function loadModule() {
    return import(
      "@/bot/features/message-delete/commands/usecases/runPreviewDialog"
    );
  }

  function makeBaseInteraction(
    collectorToReturn?: ReturnType<typeof makeMockCollector>,
  ) {
    const collector = collectorToReturn ?? makeMockCollector();
    const response = {
      createMessageComponentCollector: vi.fn(() => collector),
    };
    return {
      user: { id: "user-1" },
      locale: "en-US",
      editReply: vi.fn().mockResolvedValue(response) as Mock,
      followUp: vi.fn().mockResolvedValue(undefined) as Mock,
      _collector: collector,
    };
  }

  // ─── 終端アクション ───────────────────────────────────────────────────────

  it("resolves with Confirm when CONFIRM_YES is clicked", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );

    const result = await promise;
    expect(result.type).toBe("confirm");
  });

  it("resolves with Cancel when CONFIRM_NO is clicked", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_NO),
    );

    const result = await promise;
    expect(result.type).toBe("cancel");
  });

  // ─── タイムアウト・ロック解放 ──────────────────────────────────────────────

  it("resolves with Timeout on time end", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger("end", new Map(), "time");

    const result = await promise;
    expect(result.type).toBe("timeout");
    expect(baseInteraction.editReply).toHaveBeenCalledTimes(2); // initial + timeout message
  });

  it("non-time end reason resolves as timeout when no terminal button was clicked", async () => {
    // Bug fix: messageDelete / channelDelete 等で collector が終了した場合も
    // ロックを確実に解放するため Timeout として解決する
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger("end", new Map(), "messageDelete");

    const result = await promise;
    expect(result.type).toBe("timeout");
    expect(baseInteraction.editReply).toHaveBeenCalledTimes(2); // initial + timeout message
  });

  it("idle end reason resolves as timeout (ephemeral dismissed)", async () => {
    // Bug fix: エフェメラルメッセージを非表示にしても MESSAGE_DELETE は発火しないため
    // idle タイムアウトでロックを解放する
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger("end", new Map(), "idle");

    const result = await promise;
    expect(result.type).toBe("timeout");
    expect(baseInteraction.editReply).toHaveBeenCalledTimes(2); // initial + timeout message
  });

  it("end event after terminal button click does not override the result", async () => {
    // handledByCollect フラグにより、ボタン押下後の end イベントはスキップされること
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    // stop() 後に end が発火しても上書きされないこと
    await collector._trigger("end", new Map(), "user");

    const result = await promise;
    expect(result.type).toBe("confirm");
  });

  // ─── 権限チェック ─────────────────────────────────────────────────────────

  it("replies ephemeral warning when wrong user clicks", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const wrongUser = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.CONFIRM_YES,
      "wrong-user",
    );
    await collector._trigger("collect", wrongUser);
    expect(wrongUser.reply).toHaveBeenCalled();

    // 正規ユーザーで終了
    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  // ─── ページネーション ─────────────────────────────────────────────────────

  it("handles FIRST page navigation", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const firstInteraction = makeComponentInteraction(MSG_DEL_CUSTOM_ID.FIRST);
    await collector._trigger("collect", firstInteraction);
    expect(firstInteraction.update).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  it("handles PREV page navigation", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const prevInteraction = makeComponentInteraction(MSG_DEL_CUSTOM_ID.PREV);
    await collector._trigger("collect", prevInteraction);
    expect(prevInteraction.update).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  it("handles NEXT page navigation", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const nextInteraction = makeComponentInteraction(MSG_DEL_CUSTOM_ID.NEXT);
    await collector._trigger("collect", nextInteraction);
    expect(nextInteraction.update).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  it("handles LAST page navigation", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const lastInteraction = makeComponentInteraction(MSG_DEL_CUSTOM_ID.LAST);
    await collector._trigger("collect", lastInteraction);
    expect(lastInteraction.update).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  // ─── ページジャンプ ───────────────────────────────────────────────────────

  it("handles JUMP with valid page number", async () => {
    const { showPreviewDialog } = await loadModule();
    showJumpModalMock.mockResolvedValue("2");

    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);
    // MSG_DEL_PAGE_SIZE=5 なので6件で2ページ
    const msgs = Array.from({ length: 6 }, (_, i) => ({
      messageId: `msg-${i}`,
      createdAt: new Date(),
    }));

    const promise = showPreviewDialog(
      baseInteraction as never,
      msgs as never,
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.JUMP),
    );
    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  it("handles JUMP with null (modal closed)", async () => {
    const { showPreviewDialog } = await loadModule();
    showJumpModalMock.mockResolvedValue(null);

    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.JUMP),
    );
    // null 時は editReply で現在ページを再表示
    expect(baseInteraction.editReply).toHaveBeenCalledTimes(2); // initial + re-render

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  it("handles JUMP with invalid page number", async () => {
    const { showPreviewDialog } = await loadModule();
    showJumpModalMock.mockResolvedValue("not-a-number");

    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.JUMP),
    );
    expect(baseInteraction.followUp).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );
    await promise;
  });

  // ─── 除外セレクト ─────────────────────────────────────────────────────────

  it("adds message to excludedIds when exclude select is used", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);
    const msgs = [
      { messageId: "msg-1", createdAt: new Date() },
      { messageId: "msg-2", createdAt: new Date() },
    ];

    const promise = showPreviewDialog(
      baseInteraction as never,
      msgs as never,
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const excludeInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.CONFIRM_EXCLUDE,
      "user-1",
      { isStringSelectMenu: true, values: ["msg-1"] },
    );
    await collector._trigger("collect", excludeInteraction);
    expect(excludeInteraction.update).toHaveBeenCalled();

    // confirm 時に excludedIds が引き継がれることを確認
    const confirmInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.CONFIRM_YES,
    );
    await collector._trigger("collect", confirmInteraction);

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      expect(result.excludedIds.has("msg-1")).toBe(true);
      expect(result.excludedIds.has("msg-2")).toBe(false);
    }
  });

  it("removes message from excludedIds when deselected in exclude select", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);
    const msgs = [
      { messageId: "msg-1", createdAt: new Date() },
      { messageId: "msg-2", createdAt: new Date() },
    ];

    // msg-1 を事前に除外済みとして渡す
    const promise = showPreviewDialog(
      baseInteraction as never,
      msgs as never,
      {},
      new Set(["msg-1"]),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    // 除外セレクトで何も選択しない（msg-1 の除外を解除）
    const excludeInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.CONFIRM_EXCLUDE,
      "user-1",
      { isStringSelectMenu: true, values: [] },
    );
    await collector._trigger("collect", excludeInteraction);

    const confirmInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.CONFIRM_YES,
    );
    await collector._trigger("collect", confirmInteraction);

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      expect(result.excludedIds.has("msg-1")).toBe(false);
    }
  });

  // ─── 投稿者フィルター ─────────────────────────────────────────────────────

  it("applies author filter when specific author is selected", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const authorInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.FILTER_AUTHOR,
      "user-1",
      { isStringSelectMenu: true, values: ["author-123"] },
    );
    await collector._trigger("collect", authorInteraction);
    expect(authorInteraction.update).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      expect(result.filter.authorId).toBe("author-123");
    }
  });

  it("clears author filter when __all__ is selected", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    // 事前にフィルターが適用された状態で開始
    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      { authorId: "author-123" },
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const authorInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.FILTER_AUTHOR,
      "user-1",
      { isStringSelectMenu: true, values: ["__all__"] },
    );
    await collector._trigger("collect", authorInteraction);

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      expect(result.filter.authorId).toBeUndefined();
    }
  });

  // ─── フィルターリセット ───────────────────────────────────────────────────

  it("resets filter when FILTER_RESET is clicked", async () => {
    const { showPreviewDialog } = await loadModule();
    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      { authorId: "author-123", keyword: "spam" },
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const resetInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.FILTER_RESET,
    );
    await collector._trigger("collect", resetInteraction);
    expect(resetInteraction.update).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      expect(result.filter).toEqual({});
    }
  });

  // ─── モーダルフィルター ───────────────────────────────────────────────────

  it("applies modal filter when value is entered successfully", async () => {
    const { showPreviewDialog } = await loadModule();
    showFilterModalMock.mockResolvedValue("7");
    applyModalFilterValueMock.mockReturnValue({
      filter: { days: 7 },
      errorKey: undefined,
    });

    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const filterDaysInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.FILTER_DAYS,
    );
    await collector._trigger("collect", filterDaysInteraction);

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      expect(result.filter.days).toBe(7);
    }
  });

  it("does not apply modal filter when modal is closed (null)", async () => {
    const { showPreviewDialog } = await loadModule();
    showFilterModalMock.mockResolvedValue(null);

    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      {},
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const filterDaysInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.FILTER_DAYS,
    );
    await collector._trigger("collect", filterDaysInteraction);
    // null の場合は現在ページを再表示
    expect(baseInteraction.editReply).toHaveBeenCalledTimes(2); // initial + re-render

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      // フィルターは変化しないこと
      expect(result.filter).toEqual({});
    }
  });

  it("shows error and does not update filter when modal filter value has errorKey", async () => {
    const { showPreviewDialog } = await loadModule();
    showFilterModalMock.mockResolvedValue("invalid-value");
    applyModalFilterValueMock.mockReturnValue({
      filter: {},
      errorKey: "commands:message-delete.errors.after_invalid_format" as const,
    });

    const collector = makeMockCollector();
    const baseInteraction = makeBaseInteraction(collector);

    const promise = showPreviewDialog(
      baseInteraction as never,
      [],
      { keyword: "existing" },
      new Set(),
      DUMMY_OPTIONS as never,
      60000,
    );
    await flushMicrotasks();

    const filterAfterInteraction = makeComponentInteraction(
      MSG_DEL_CUSTOM_ID.FILTER_AFTER,
    );
    await collector._trigger("collect", filterAfterInteraction);
    // エラー時は followUp でエラーを表示
    expect(baseInteraction.followUp).toHaveBeenCalled();

    await collector._trigger(
      "collect",
      makeComponentInteraction(MSG_DEL_CUSTOM_ID.CONFIRM_YES),
    );

    const result = await promise;
    expect(result.type).toBe("confirm");
    if (result.type === "confirm") {
      // エラーがあった場合はフィルターが変化しないこと
      expect(result.filter.keyword).toBe("existing");
    }
  });
});
