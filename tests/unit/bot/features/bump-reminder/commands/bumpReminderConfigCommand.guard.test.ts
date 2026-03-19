// tests/unit/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard.test.ts
import { ensureManageGuildPermission } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard";
import { ValidationError } from "@/shared/errors/customErrors";
import { PermissionFlagsBits } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tInteraction: (_locale: string, key: string) => key,
}));

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ManageGuild 権限がある場合は正常に通過する", () => {
    const interaction = {
      locale: "ja",
      memberPermissions: {
        has: vi.fn(() => true),
      },
    };

    expect(() =>
      ensureManageGuildPermission(interaction as never, "guild-1"),
    ).not.toThrow();
    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
  });

  it("権限がない場合は ValidationError をスローする", () => {
    const interaction = {
      locale: "ja",
      memberPermissions: {
        has: vi.fn(() => false),
      },
    };

    expect(() =>
      ensureManageGuildPermission(interaction as never, "guild-1"),
    ).toThrow(ValidationError);
  });
});
