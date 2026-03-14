// tests/unit/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard.test.ts
import type { Mock } from "vitest";
import { ensureManageGuildPermission } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard";
import { ValidationError } from "@/shared/errors/customErrors";
import { PermissionFlagsBits } from "discord.js";

const tGuildMock: Mock = vi.fn(async () => "permission required");

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (guildId: string, key: string) => tGuildMock(guildId, key),
}));

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ManageGuild 権限がある場合は正常に通過する", async () => {
    const interaction = {
      memberPermissions: {
        has: vi.fn(() => true),
      },
    };

    await expect(
      ensureManageGuildPermission(interaction as never, "guild-1"),
    ).resolves.toBeUndefined();
    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
  });

  it("権限がない場合は ValidationError をスローする", async () => {
    const interaction = {
      memberPermissions: {
        has: vi.fn(() => false),
      },
    };

    await expect(
      ensureManageGuildPermission(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
