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

  // 正常系: 文字列配列
  it("parses a valid JSON array of strings", () => {
    expect(parseJsonArray<string>('["a","b","c"]')).toEqual(["a", "b", "c"]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // 正常系: 数値配列
  it("parses a valid JSON array of numbers", () => {
    expect(parseJsonArray<number>("[1,2,3]")).toEqual([1, 2, 3]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // 正常系: 空配列
  it("parses an empty JSON array", () => {
    expect(parseJsonArray<string>("[]")).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // 正常系: オブジェクト配列
  it("parses a valid JSON array of objects", () => {
    const input = '[{"id":"1"},{"id":"2"}]';
    expect(parseJsonArray<{ id: string }>(input)).toEqual([
      { id: "1" },
      { id: "2" },
    ]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // エラー系: 不正なJSON文字列
  it("returns empty array and warns for invalid JSON", () => {
    expect(parseJsonArray<string>("invalid json")).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  // エラー系: 空文字列
  it("returns empty array and warns for empty string", () => {
    expect(parseJsonArray<string>("")).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  // 非配列ケース: JSONオブジェクト
  it("returns empty array when JSON is an object (not array)", () => {
    expect(parseJsonArray<string>('{"key":"value"}')).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // 非配列ケース: JSONプリミティブ
  it("returns empty array when JSON is a primitive", () => {
    expect(parseJsonArray<string>("42")).toEqual([]);
    expect(parseJsonArray<string>('"hello"')).toEqual([]);
    expect(parseJsonArray<string>("true")).toEqual([]);
    expect(parseJsonArray<string>("null")).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
