// tests/unit/bot/features/message-delete/commands/usecases/validateOptions.test.ts
// hasManageMessagesPermission・parseAndValidateOptions の単体テスト
// - ユーザーIDパース（メンション・生ID・無効形式）
// - フィルター必須チェック・days×日付範囲排他バリデーション
// - 日付パース・未来日チェック（YYYY-MM-DD 当日許容の特例を含む）
// - 正常系: ParsedOptions 構造検証

import {
  hasManageMessagesPermission,
  parseAndValidateOptions,
} from "@/bot/features/message-delete/commands/usecases/validateOptions";
import {
  MSG_DEL_DEFAULT_COUNT,
  MS_PER_DAY,
} from "@/bot/features/message-delete/constants/messageDeleteConstants";

// ── モック ────────────────────────────────────────────────────────────────

const parseDateStrMock = vi.fn();
const createWarningEmbedMock = vi.fn((d: string) => ({
  _type: "warning",
  description: d,
}));
const tDefaultMock = vi.fn((key: string) => `t:${key}`);
const getTimezoneOffsetForLocaleMock = vi.fn(() => "+00:00");

vi.mock("@/bot/features/message-delete/services/messageDeleteService", () => ({
  parseDateStr: (...args: any[]) => parseDateStrMock(...args),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: (d: string) => createWarningEmbedMock(d),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => tDefaultMock(key),
}));

vi.mock("@/shared/locale/helpers", () => ({
  getTimezoneOffsetForLocale: (...args: any[]) =>
    (getTimezoneOffsetForLocaleMock as (...a: any[]) => unknown)(...args),
}));

// ── インタラクションファクトリー ─────────────────────────────────────────

type OptionValues = {
  count?: number | null;
  user?: string | null;
  keyword?: string | null;
  days?: number | null;
  after?: string | null;
  before?: string | null;
  channel?: { id: string } | null;
  hasPermission?: boolean;
};

function createInteraction(opts: OptionValues = {}) {
  const editReply = vi.fn().mockResolvedValue(undefined);
  const hasMock = vi.fn().mockReturnValue(opts.hasPermission ?? false);
  return {
    locale: "ja",
    memberPermissions: { has: hasMock },
    options: {
      getInteger: vi.fn((key: string) => {
        if (key === "count") return opts.count ?? null;
        if (key === "days") return opts.days ?? null;
        return null;
      }),
      getString: vi.fn((key: string) => {
        if (key === "user") return opts.user ?? null;
        if (key === "keyword") return opts.keyword ?? null;
        if (key === "after") return opts.after ?? null;
        if (key === "before") return opts.before ?? null;
        return null;
      }),
      getChannel: vi.fn().mockReturnValue(opts.channel ?? null),
    },
    editReply,
    _hasMock: hasMock,
  };
}

// ── テスト ────────────────────────────────────────────────────────────────

describe("bot/features/message-delete/commands/usecases/validateOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  describe("hasManageMessagesPermission", () => {
    it("memberPermissions.has() が true を返す場合は true を返す", () => {
      const interaction = createInteraction({ hasPermission: true });
      expect(hasManageMessagesPermission(interaction as never)).toBe(true);
    });

    it("memberPermissions.has() が false を返す場合は false を返す", () => {
      const interaction = createInteraction({ hasPermission: false });
      expect(hasManageMessagesPermission(interaction as never)).toBe(false);
    });

    // memberPermissions が null の場合は ?? false でフォールバックする
    it("memberPermissions が null の場合は false を返す", () => {
      const interaction = { ...createInteraction(), memberPermissions: null };
      expect(hasManageMessagesPermission(interaction as never)).toBe(false);
    });
  });

  // =========================================================================
  describe("parseAndValidateOptions", () => {
    // ── user オプションのパース ──────────────────────────────────────────
    describe("user オプションのパース", () => {
      // <@id> 形式: Discord のメンション（通常形式）
      it("メンション形式 <@id> から userId を正しく抽出する", async () => {
        const interaction = createInteraction({
          user: "<@123456789012345678>",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.targetUserId).toBe("123456789012345678");
      });

      // <@!id> 形式: ニックネームメンション（旧 Discord 仕様、現在も入力される）
      it("メンション形式 <@!id> から userId を正しく抽出する", async () => {
        const interaction = createInteraction({
          user: "<@!987654321098765432>",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.targetUserId).toBe("987654321098765432");
      });

      // 生 ID: 17〜20桁の数字文字列（スノーフレーク形式）
      it("生 ID（17〜20桁の数字）を正しくパースする", async () => {
        const interaction = createInteraction({
          user: "123456789012345678",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.targetUserId).toBe("123456789012345678");
      });

      it("無効な形式はエラー embed を返し null を返す", async () => {
        const interaction = createInteraction({
          user: "invalid-user-format",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(interaction.editReply).toHaveBeenCalledWith({
          embeds: [expect.objectContaining({ _type: "warning" })],
        });
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.user_invalid_format",
        );
      });

      it("user 未指定時は targetUserId が undefined になる", async () => {
        const interaction = createInteraction({ keyword: "test" });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.targetUserId).toBeUndefined();
      });
    });

    // ── フィルター必須チェック ───────────────────────────────────────────
    describe("フィルター必須チェック", () => {
      it("全フィルター未指定はエラー embed を返し null を返す", async () => {
        const interaction = createInteraction();
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.no_filter",
        );
      });

      it("count のみ指定で通過する", async () => {
        const interaction = createInteraction({ count: 100 });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).not.toBeNull();
      });

      it("keyword のみ指定で通過する", async () => {
        const interaction = createInteraction({ keyword: "test" });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).not.toBeNull();
      });
    });

    // ── days と日付範囲の排他バリデーション ─────────────────────────────
    describe("days と日付範囲の排他バリデーション", () => {
      // days と after/before の同時指定はコマンド仕様として禁止
      it("days と afterStr の同時指定はエラー embed を返し null を返す", async () => {
        const interaction = createInteraction({ days: 7, after: "2026-01-01" });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.days_and_date_conflict",
        );
      });

      it("days と beforeStr の同時指定はエラー embed を返し null を返す", async () => {
        const interaction = createInteraction({
          days: 7,
          before: "2026-01-01",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.days_and_date_conflict",
        );
      });
    });

    // ── afterStr のバリデーション ────────────────────────────────────────
    describe("afterStr のバリデーション", () => {
      it("日付パースが失敗した場合はエラー embed を返し null を返す", async () => {
        parseDateStrMock.mockReturnValue(null);
        const interaction = createInteraction({
          after: "not-a-date",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.after_invalid_format",
        );
      });

      it("未来の日付はエラー embed を返し null を返す", async () => {
        parseDateStrMock.mockReturnValue(new Date(Date.now() + 86400000));
        const interaction = createInteraction({
          after: "2099-01-01",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.after_future",
        );
      });

      it("有効な過去日付は afterTs に変換される", async () => {
        const pastDate = new Date("2025-01-01T00:00:00Z");
        parseDateStrMock.mockReturnValue(pastDate);
        const interaction = createInteraction({
          after: "2025-01-01",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.afterTs).toBe(pastDate.getTime());
      });
    });

    // ── beforeStr のバリデーション ───────────────────────────────────────
    describe("beforeStr のバリデーション", () => {
      it("日付パースが失敗した場合はエラー embed を返し null を返す", async () => {
        parseDateStrMock.mockReturnValue(null);
        const interaction = createInteraction({
          before: "not-a-date",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.before_invalid_format",
        );
      });

      it("ISO 形式の未来日時はエラー embed を返し null を返す", async () => {
        parseDateStrMock.mockReturnValue(new Date(Date.now() + 86400000));
        const interaction = createInteraction({
          before: "2099-01-01T00:00:00Z", // ISO 形式: YYYY-MM-DD 特例チェックは適用されない
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.before_future",
        );
      });

      // YYYY-MM-DD 形式の当日指定は仕様上許可
      // endOfDay=true の返値（23:59:59）が未来でも、startOfDay=false の返値（00:00:00）が
      // 過去であれば通過する。これにより「今日を含む範囲削除」が可能になる。
      it("YYYY-MM-DD 形式は startOfDay で未来判定するため当日でも許容される", async () => {
        const endOfDayDate = new Date(Date.now() + 43200000); // endOfDay=true → 12時間後（未来）
        const startOfDayDate = new Date(Date.now() - 43200000); // endOfDay=false → 12時間前（過去）
        parseDateStrMock
          .mockReturnValueOnce(endOfDayDate) // parseDateStr(beforeStr, true, tz)
          .mockReturnValueOnce(startOfDayDate); // parseDateStr(beforeStr, false, tz) → checkDate
        const interaction = createInteraction({
          before: "2026-03-13",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).not.toBeNull();
        expect(interaction.editReply).not.toHaveBeenCalled();
      });

      it("有効な過去日付は beforeTs に変換される", async () => {
        const pastDate = new Date("2025-01-01T23:59:59Z");
        parseDateStrMock.mockReturnValue(pastDate);
        const interaction = createInteraction({
          before: "2025-01-01",
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.beforeTs).toBe(pastDate.getTime());
      });
    });

    // ── 日付範囲チェック（afterTs >= beforeTs）───────────────────────────
    describe("日付範囲チェック", () => {
      // after が before 以降の場合は範囲として成立しない
      it("afterTs が beforeTs 以上の場合はエラー embed を返し null を返す", async () => {
        const afterDate = new Date("2000-01-02T00:00:00Z");
        const beforeDate = new Date("2000-01-01T00:00:00Z");
        parseDateStrMock
          .mockReturnValueOnce(afterDate) // parseDateStr(afterStr, false, tz)
          .mockReturnValueOnce(beforeDate); // parseDateStr(beforeStr, true, tz)
        const interaction = createInteraction({
          after: "2000-01-02",
          before: "2000-01-01T00:00:00Z", // ISO 形式: YYYY-MM-DD 特例を避ける
          keyword: "test",
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result).toBeNull();
        expect(tDefaultMock).toHaveBeenCalledWith(
          "commands:message-delete.errors.date_range_invalid",
        );
      });
    });

    // ── 正常系: ParsedOptions 構造検証 ──────────────────────────────────
    describe("正常系", () => {
      it("count 未指定時は MSG_DEL_DEFAULT_COUNT が設定され countSpecified が false になる", async () => {
        const interaction = createInteraction({ keyword: "test" });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.count).toBe(MSG_DEL_DEFAULT_COUNT);
        expect(result?.countSpecified).toBe(false);
      });

      it("count 指定時は指定値が設定され countSpecified が true になる", async () => {
        const interaction = createInteraction({ count: 50, keyword: "test" });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.count).toBe(50);
        expect(result?.countSpecified).toBe(true);
      });

      it("channelId を正しく設定する", async () => {
        const interaction = createInteraction({
          keyword: "test",
          channel: { id: "channel-123" },
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.channelId).toBe("channel-123");
      });

      // days 指定時は afterTs = Date.now() - days * MS_PER_DAY で設定される
      it("days 指定時は afterTs が現在時刻から days 日前になり beforeTs が Infinity になる", async () => {
        const before = Date.now();
        const interaction = createInteraction({ days: 7, keyword: "test" });
        const result = await parseAndValidateOptions(interaction as never);
        const after = Date.now();
        expect(result?.afterTs).toBeGreaterThanOrEqual(before - 7 * MS_PER_DAY);
        expect(result?.afterTs).toBeLessThanOrEqual(after - 7 * MS_PER_DAY + 100);
        expect(result?.daysOption).toBe(7);
        expect(result?.beforeTs).toBe(Infinity);
      });

      it("keyword・targetUserId・channelId が正しく ParsedOptions に設定される", async () => {
        const interaction = createInteraction({
          keyword: "hello",
          user: "<@123456789012345678>",
          channel: { id: "ch-1" },
        });
        const result = await parseAndValidateOptions(interaction as never);
        expect(result?.keyword).toBe("hello");
        expect(result?.targetUserId).toBe("123456789012345678");
        expect(result?.channelId).toBe("ch-1");
      });
    });
  });
});
