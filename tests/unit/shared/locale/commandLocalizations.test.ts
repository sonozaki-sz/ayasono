// tests/unit/shared/locale/commandLocalizations.test.ts
import {
  getCommandLocalizations,
  withLocalization,
} from "@/shared/locale/commandLocalizations";
import { resources } from "@/shared/locale/locales/resources";

describe("shared/locale/commandLocalizations", () => {
  it("日本語のデフォルトと英語のローカライゼーションマップを返すこと", () => {
    const key = "ping.description";
    const localizations = getCommandLocalizations(key);

    expect(localizations.ja).toBe(resources.ja.commands[key]);
    expect(localizations.localizations).toEqual({
      "en-US": resources.en.commands[key],
      "en-GB": resources.en.commands[key],
    });
  });

  it("ヘルパーオブジェクトを生成してビルダーチェーンにローカライゼーションを適用すること", () => {
    const key = "afk.description";
    const calls: Array<{ method: string; value: unknown }> = [];

    const builder = {
      setDescription(description: string) {
        calls.push({ method: "setDescription", value: description });
        return this;
      },
      setDescriptionLocalizations(localizations: Record<string, string>) {
        calls.push({
          method: "setDescriptionLocalizations",
          value: localizations,
        });
        return this;
      },
    };

    const localized = withLocalization(key);
    const result = localized.apply(builder);

    expect(localized.description).toBe(resources.ja.commands[key]);
    expect(localized.descriptionLocalizations).toEqual({
      "en-US": resources.en.commands[key],
      "en-GB": resources.en.commands[key],
    });
    expect(result).toBe(builder);
    expect(calls).toEqual([
      { method: "setDescription", value: resources.ja.commands[key] },
      {
        method: "setDescriptionLocalizations",
        value: {
          "en-US": resources.en.commands[key],
          "en-GB": resources.en.commands[key],
        },
      },
    ]);
  });
});
