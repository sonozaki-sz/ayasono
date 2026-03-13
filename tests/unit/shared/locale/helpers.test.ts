// tests/unit/shared/locale/helpers.test.ts
import {
  getGuildTranslator,
  getTimezoneOffsetForLocale,
  invalidateGuildLocaleCache,
} from "@/shared/locale/helpers";

const getGuildTMock = vi.fn();
const invalidateLocaleCacheMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  localeManager: {
    getGuildT: (...args: unknown[]) => getGuildTMock(...args),
    invalidateLocaleCache: (...args: unknown[]) =>
      invalidateLocaleCacheMock(...args),
  },
}));

// locale helper の dynamic import 経路とキャッシュ無効化呼び出しを検証
describe("shared/locale/helpers", () => {
  // 各ケースでモック呼び出し履歴を独立化する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // guild translator 取得時に localeManager.getGuildT を透過利用することを検証
  it("returns guild translator from locale manager", async () => {
    const fixedT = vi.fn((key: string) => `translated:${key}`);
    getGuildTMock.mockResolvedValue(fixedT);

    const translator = await getGuildTranslator("guild-1");

    expect(getGuildTMock).toHaveBeenCalledWith("guild-1");
    expect(translator("system:bot.starting" as never)).toBe(
      "translated:system:bot.starting",
    );
  });

  // 追加パラメータなしで guild translator を解決できることを検証
  it("resolves translator without repository parameter", async () => {
    const fixedT = vi.fn((key: string) => key);
    getGuildTMock.mockResolvedValue(fixedT);

    await getGuildTranslator("guild-2");

    expect(getGuildTMock).toHaveBeenCalledWith("guild-2");
  });

  // 明示的なキャッシュ無効化が対象 guildId に対して実行されることを検証
  it("invalidates locale cache for target guild", async () => {
    await invalidateGuildLocaleCache("guild-3");

    expect(invalidateLocaleCacheMock).toHaveBeenCalledWith("guild-3");
  });

  describe("getTimezoneOffsetForLocale", () => {
    it.each([
      ["ja", "+09:00"],
      ["ko", "+09:00"],
      ["zh-CN", "+08:00"],
      ["zh-TW", "+08:00"],
      ["zh-HK", "+08:00"],
      ["ru", "+03:00"],
      ["tr", "+03:00"],
      ["vi", "+07:00"],
      ["th", "+07:00"],
      ["id", "+07:00"],
      ["en-US", "+00:00"],
      ["en-GB", "+00:00"],
    ])("returns %s -> %s", (locale, expected) => {
      expect(getTimezoneOffsetForLocale(locale)).toBe(expected);
    });

    // Discord はタイムゾーンを公開しないため言語設定から代表値を推定する。
    // 未定義ロケールは UTC+0 にフォールバックし、日付表示がずれても許容する設計。
    it("未定義ロケールは UTC+0 にフォールバックする", () => {
      expect(getTimezoneOffsetForLocale("unknown-locale")).toBe("+00:00");
    });
  });
});
