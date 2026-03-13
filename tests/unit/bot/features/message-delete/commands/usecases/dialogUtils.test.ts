// tests/unit/bot/features/message-delete/commands/usecases/dialogUtils.test.ts
// dialogUtils の単体テスト（applyModalFilterValue・MODAL_FILTER_CONFIG）

import type { Mock } from "vitest";

const parseDateStrMock: Mock = vi.fn();

vi.mock("@/bot/features/message-delete/services/messageDeleteService", () => ({
  parseDateStr: (...args: any[]) =>
    (parseDateStrMock as (...a: any[]) => unknown)(...args),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  ),
}));

// Mock discord.js builders to avoid needing a real Discord environment
vi.mock("discord.js", async (importOriginal) => {
  const orig = await importOriginal<typeof import("discord.js")>();
  return {
    ...orig,
    ModalBuilder: vi.fn().mockReturnValue({
      setCustomId: vi.fn().mockReturnThis(),
      setTitle: vi.fn().mockReturnThis(),
      addComponents: vi.fn().mockReturnThis(),
    }),
    ActionRowBuilder: vi.fn().mockReturnValue({
      addComponents: vi.fn().mockReturnThis(),
    }),
    TextInputBuilder: vi.fn().mockReturnValue({
      setCustomId: vi.fn().mockReturnThis(),
      setLabel: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      setRequired: vi.fn().mockReturnThis(),
      setPlaceholder: vi.fn().mockReturnThis(),
    }),
  };
});

describe("bot/features/message-delete/commands/usecases/dialogUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadModule() {
    return import(
      "@/bot/features/message-delete/commands/usecases/dialogUtils"
    );
  }

  // ─────────────────────────────────────────────────────────────
  // applyModalFilterValue
  // ─────────────────────────────────────────────────────────────

  describe("applyModalFilterValue", () => {
    it("returns current filter unchanged for unknown customId", async () => {
      const { applyModalFilterValue } = await loadModule();
      const currentFilter = { keyword: "existing" };
      const result = applyModalFilterValue(
        "unknown-id",
        "value",
        currentFilter,
        "+00:00",
      );
      expect(result.filter).toBe(currentFilter);
      expect(result.errorKey).toBeUndefined();
    });

    it("applies FILTER_KEYWORD to set keyword", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
        "search-term",
        {},
        "+00:00",
      );
      expect(result.filter.keyword).toBe("search-term");
    });

    it("applies FILTER_KEYWORD with empty value clears keyword", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
        "",
        { keyword: "old" },
        "+00:00",
      );
      expect(result.filter.keyword).toBeUndefined();
    });

    it("applies FILTER_DAYS with valid number", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        "7",
        {},
        "+00:00",
      );
      expect(result.filter.days).toBe(7);
      expect(result.filter.after).toBeUndefined();
      expect(result.filter.before).toBeUndefined();
    });

    it("applies FILTER_DAYS with empty value clears days", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        "",
        { days: 7 },
        "+00:00",
      );
      expect(result.filter.days).toBeUndefined();
    });

    it("returns error key for invalid FILTER_DAYS value", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        "not-a-number",
        {},
        "+00:00",
      );
      expect(result.errorKey).toBe(
        "commands:message-delete.errors.days_invalid_value",
      );
    });

    it("returns error key for FILTER_DAYS with zero or negative", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        "0",
        {},
        "+00:00",
      );
      expect(result.errorKey).toBeDefined();
    });

    it("applies FILTER_AFTER with valid date", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const afterDate = new Date("2024-01-01T00:00:00Z");
      parseDateStrMock.mockReturnValue(afterDate);

      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        "2024-01-01",
        {},
        "+00:00",
      );
      expect(result.filter.after).toBe(afterDate);
      expect((result.filter as { afterRaw?: string }).afterRaw).toBe("2024-01-01");
      expect(result.filter.days).toBeUndefined();
    });

    it("applies FILTER_AFTER with empty value clears after", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        "",
        { after: new Date() },
        "+00:00",
      );
      expect(result.filter.after).toBeUndefined();
    });

    it("returns error key for FILTER_AFTER with invalid date", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      parseDateStrMock.mockReturnValue(null);

      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        "invalid",
        {},
        "+00:00",
      );
      expect(result.errorKey).toBe(
        "commands:message-delete.errors.after_invalid_format",
      );
    });

    it("returns error key for FILTER_AFTER when after >= before", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const afterDate = new Date("2024-01-20T00:00:00Z");
      const beforeDate = new Date("2024-01-10T00:00:00Z");
      parseDateStrMock.mockReturnValue(afterDate);

      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        "2024-01-20",
        { before: beforeDate },
        "+00:00",
      );
      expect(result.errorKey).toBe(
        "commands:message-delete.errors.date_range_invalid",
      );
    });

    it("applies FILTER_BEFORE with valid date", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const beforeDate = new Date("2024-01-31T23:59:59Z");
      parseDateStrMock.mockReturnValue(beforeDate);

      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        "2024-01-31",
        {},
        "+00:00",
      );
      expect(result.filter.before).toBe(beforeDate);
      expect((result.filter as { beforeRaw?: string }).beforeRaw).toBe("2024-01-31");
      expect(result.filter.days).toBeUndefined();
    });

    it("applies FILTER_BEFORE with empty value clears before", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        "",
        { before: new Date() },
        "+00:00",
      );
      expect(result.filter.before).toBeUndefined();
    });

    it("returns error key for FILTER_BEFORE with invalid date", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      parseDateStrMock.mockReturnValue(null);

      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        "invalid",
        {},
        "+00:00",
      );
      expect(result.errorKey).toBe(
        "commands:message-delete.errors.before_invalid_format",
      );
    });

    it("returns error key for FILTER_BEFORE when after >= before", async () => {
      const { applyModalFilterValue } = await loadModule();
      const { MSG_DEL_CUSTOM_ID } = await import(
        "@/bot/features/message-delete/constants/messageDeleteConstants"
      );
      const afterDate = new Date("2024-01-20T00:00:00Z");
      const beforeDate = new Date("2024-01-10T00:00:00Z");
      parseDateStrMock.mockReturnValue(beforeDate);

      const result = applyModalFilterValue(
        MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        "2024-01-10",
        { after: afterDate },
        "+00:00",
      );
      expect(result.errorKey).toBe(
        "commands:message-delete.errors.date_range_invalid",
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // DIALOG_TYPE constant
  // ─────────────────────────────────────────────────────────────

  describe("DIALOG_TYPE", () => {
    it("has expected values", async () => {
      const { DIALOG_TYPE } = await loadModule();
      expect(DIALOG_TYPE.Confirm).toBe("confirm");
      expect(DIALOG_TYPE.Cancel).toBe("cancel");
      expect(DIALOG_TYPE.Timeout).toBe("timeout");
      expect(DIALOG_TYPE.Back).toBe("back");
    });
  });
});
