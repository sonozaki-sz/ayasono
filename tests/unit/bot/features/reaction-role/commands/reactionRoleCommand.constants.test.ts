// tests/unit/bot/features/reaction-role/commands/reactionRoleCommand.constants.test.ts
import {
  isValidButtonStyle,
  parseButtons,
} from "@/bot/features/reaction-role/commands/reactionRoleCommand.constants";

// parseButtons / isValidButtonStyle のユーティリティ関数を検証する
describe("bot/features/reaction-role/commands/reactionRoleCommand.constants", () => {
  describe("parseButtons", () => {
    it("有効なJSON配列をパースしてボタン配列を返すこと", () => {
      const buttons = [
        {
          buttonId: 1,
          label: "Role A",
          emoji: "",
          style: "Primary",
          roleIds: ["role-1"],
        },
      ];
      const json = JSON.stringify(buttons);

      const result = parseButtons(json);

      expect(result).toEqual(buttons);
    });

    it("不正なJSON文字列の場合は空配列を返すこと", () => {
      const result = parseButtons("{invalid json}");

      expect(result).toEqual([]);
    });

    it("配列でないJSONの場合は空配列を返すこと", () => {
      const result = parseButtons(JSON.stringify({ key: "value" }));

      expect(result).toEqual([]);
    });

    it("空配列のJSON文字列をパースして空配列を返すこと", () => {
      const result = parseButtons("[]");

      expect(result).toEqual([]);
    });

    it("空文字列の場合は空配列を返すこと", () => {
      const result = parseButtons("");

      expect(result).toEqual([]);
    });
  });

  describe("isValidButtonStyle", () => {
    it.each([
      "primary",
      "secondary",
      "success",
      "danger",
    ])("有効なスタイル '%s' に対して true を返すこと", (style) => {
      expect(isValidButtonStyle(style)).toBe(true);
    });

    it.each([
      "Primary",
      "SECONDARY",
      "Success",
      "DANGER",
    ])("大文字混在のスタイル '%s' でも true を返すこと（大小文字不問）", (style) => {
      expect(isValidButtonStyle(style)).toBe(true);
    });

    it("無効なスタイル文字列に対して false を返すこと", () => {
      expect(isValidButtonStyle("link")).toBe(false);
      expect(isValidButtonStyle("unknown")).toBe(false);
      expect(isValidButtonStyle("")).toBe(false);
    });
  });
});
