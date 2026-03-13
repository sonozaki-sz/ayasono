// tests/unit/shared/database/repositories/serializers/guildConfigSerializer.test.ts
import {
  toGuildConfig,
  toGuildConfigCreateData,
  toGuildConfigUpdateData,
} from "@/shared/database/repositories/serializers/guildConfigSerializer";

// DBレコード ↔ ドメインオブジェクト間の変換ロジックを検証する
describe("shared/database/repositories/serializers/guildConfigSerializer", () => {
  const baseRecord = {
    id: "id-1",
    guildId: "guild-1",
    locale: "ja",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  it("toGuildConfig maps record to GuildConfig domain object", () => {
    expect(toGuildConfig(baseRecord)).toEqual({
      guildId: "guild-1",
      locale: "ja",
      createdAt: baseRecord.createdAt,
      updatedAt: baseRecord.updatedAt,
    });
  });

  // localeが空の場合はデフォルト値で補完されることを確認
  it("toGuildConfigCreateData serializes values and applies default locale", () => {
    const data = toGuildConfigCreateData(
      {
        guildId: "guild-3",
        locale: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      "ja",
    );

    expect(data).toEqual({
      guildId: "guild-3",
      locale: "ja",
    });
  });

  it("toGuildConfigCreateData preserves provided locale", () => {
    const data = toGuildConfigCreateData(
      {
        guildId: "guild-4",
        locale: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      "ja",
    );

    expect(data).toEqual({ guildId: "guild-4", locale: "en" });
  });

  it("toGuildConfigUpdateData includes only locale when provided", () => {
    expect(toGuildConfigUpdateData({ locale: "en" })).toEqual({ locale: "en" });
  });

  // フィールドを一切渡さない場合は空オブジェクトが返ることを確認
  it("toGuildConfigUpdateData returns empty object when no fields are provided", () => {
    expect(toGuildConfigUpdateData({})).toEqual({});
  });
});
