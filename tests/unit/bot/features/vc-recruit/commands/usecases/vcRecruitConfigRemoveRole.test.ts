// tests/unit/bot/features/vc-recruit/commands/usecases/vcRecruitConfigRemoveRole.test.ts
import { handleVcRecruitConfigRemoveRole } from "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigRemoveRole";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----

const removeMentionRoleIdMock = vi.fn();
const tGuildMock = vi.fn(
  async (_guildId: string, key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key,
);
const tDefaultMock = vi.fn((key: string) => key);

vi.mock("@/bot/services/botVcRecruitDependencyResolver", () => ({
  getBotVcRecruitRepository: () => ({
    removeMentionRoleId: (...args: unknown[]) =>
      removeMentionRoleIdMock(...args),
  }),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (...args: unknown[]) =>
    tGuildMock(...(args as Parameters<typeof tGuildMock>)),
  tDefault: (...args: unknown[]) =>
    tDefaultMock(...(args as Parameters<typeof tDefaultMock>)),
}));

// ---- ヘルパー ----

const GUILD_ID = "guild-1";
const ROLE_ID = "role-42";

function makeInteraction(opts: { hasGuild?: boolean; roleId?: string } = {}) {
  const { hasGuild = true, roleId = ROLE_ID } = opts;
  return {
    guild: hasGuild ? { id: GUILD_ID } : null,
    options: {
      getRole: vi.fn().mockReturnValue({ id: roleId }),
    },
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

describe("bot/features/vc-recruit/commands/usecases/vcRecruitConfigRemoveRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // guild が null の場合は ValidationError を投げる
  it("throws ValidationError when interaction has no guild", async () => {
    const interaction = makeInteraction({ hasGuild: false });
    await expect(
      handleVcRecruitConfigRemoveRole(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // ロールが見つからない場合は ValidationError を投げる
  it("throws ValidationError when role is not found", async () => {
    removeMentionRoleIdMock.mockResolvedValue("not_found");
    const interaction = makeInteraction();
    await expect(
      handleVcRecruitConfigRemoveRole(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // 正常時は success embed でエフェメラル返信する
  it("replies with success embed on successful role removal", async () => {
    removeMentionRoleIdMock.mockResolvedValue("removed");
    const interaction = makeInteraction();
    await handleVcRecruitConfigRemoveRole(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        flags: expect.anything(),
      }),
    );
    expect(removeMentionRoleIdMock).toHaveBeenCalledWith(GUILD_ID, ROLE_ID);
  });
});
