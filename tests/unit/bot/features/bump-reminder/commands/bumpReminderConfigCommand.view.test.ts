// tests/unit/bot/features/bump-reminder/commands/bumpReminderConfigCommand.view.test.ts
import { handleBumpReminderConfigView } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.view";

const ensureManageGuildPermissionMock = vi.fn();
const getBumpReminderConfigMock = vi.fn();
const createInfoEmbedMock = vi.fn((description: string) => ({
  description,
  kind: "info",
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(async () => "translated"),
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotBumpReminderConfigService: () => ({
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
  }),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: (description: string) => createInfoEmbedMock(description),
}));

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
  });

  it("設定が null の場合は未設定状態を示す embed を返す", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce(null);
    const interaction = { reply: vi.fn().mockResolvedValue(undefined) };

    await handleBumpReminderConfigView(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated", kind: "info" }],
      flags: 64,
    });
  });

  it("設定が存在する場合は設定済み内容を示す embed を返す", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1"],
    });
    const interaction = { reply: vi.fn().mockResolvedValue(undefined) };

    await handleBumpReminderConfigView(interaction as never, "guild-1");

    expect(createInfoEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "", kind: "info" }],
      flags: 64,
    });
  });
});
