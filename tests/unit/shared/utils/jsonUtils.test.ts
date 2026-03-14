// tests/unit/shared/utils/jsonUtils.test.ts
import { vi, beforeEach } from "vitest";
import { parseJsonArray } from "@/shared/utils/jsonUtils";

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

import { logger } from "@/shared/utils/logger";

describe("shared/utils/jsonUtils - parseJsonArray", () => {
  const warnSpy = vi.mocked(logger.warn);

  beforeEach(() => {
    warnSpy.mockClear();
  });

  it("正常系: 文字列配列の JSON 配列をパースできること", () => {
    expect(parseJsonArray<string>('["a","b","c"]')).toEqual(["a", "b", "c"]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("正常系: 数値配列の JSON 配列をパースできること", () => {
    expect(parseJsonArray<number>("[1,2,3]")).toEqual([1, 2, 3]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("正常系: 空の JSON 配列をパースできること", () => {
    expect(parseJsonArray<string>("[]")).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("正常系: オブジェクト配列の JSON 配列をパースできること", () => {
    const input = '[{"id":"1"},{"id":"2"}]';
    expect(parseJsonArray<{ id: string }>(input)).toEqual([
      { id: "1" },
      { id: "2" },
    ]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("エラー系: 不正な JSON 文字列の場合は空配列を返して警告ログを出力すること", () => {
    expect(parseJsonArray<string>("invalid json")).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("エラー系: 空文字列の場合は空配列を返して警告ログを出力すること", () => {
    expect(parseJsonArray<string>("")).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("非配列ケース: JSON がオブジェクトの場合は空配列を返すこと", () => {
    expect(parseJsonArray<string>('{"key":"value"}')).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("非配列ケース: JSON がプリミティブの場合は空配列を返すこと", () => {
    expect(parseJsonArray<string>("42")).toEqual([]);
    expect(parseJsonArray<string>('"hello"')).toEqual([]);
    expect(parseJsonArray<string>("true")).toEqual([]);
    expect(parseJsonArray<string>("null")).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
