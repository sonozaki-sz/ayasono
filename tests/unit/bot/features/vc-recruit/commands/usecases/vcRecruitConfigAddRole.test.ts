// tests/unit/bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole.test.ts
import { handleVcRecruitConfigAddRole } from "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole";
import { VC_RECRUIT_MENTION_ROLE_ADD_RESULT } from "@/shared/database/types";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----

const addMentionRoleIdMock = vi.fn();
const tGuildMock = vi.fn(
  async (_guildId: string, key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key,
);
const tDefaultMock = vi.fn((key: string) => key);

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotVcRecruitRepository: () => ({
    addMentionRoleId: (...args: unknown[]) => addMentionRoleIdMock(...args),
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

describe("bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guild が null の場合は ValidationError を投げる", async () => {
    const interaction = makeInteraction({ hasGuild: false });
    await expect(
      handleVcRecruitConfigAddRole(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("ロールが既に追加済みの場合は ValidationError を投げる", async () => {
    addMentionRoleIdMock.mockResolvedValue(VC_RECRUIT_MENTION_ROLE_ADD_RESULT.ALREADY_EXISTS);
    const interaction = makeInteraction();
    await expect(
      handleVcRecruitConfigAddRole(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("ロール数が上限超えの場合は ValidationError を投げる", async () => {
    addMentionRoleIdMock.mockResolvedValue(VC_RECRUIT_MENTION_ROLE_ADD_RESULT.LIMIT_EXCEEDED);
    const interaction = makeInteraction();
    await expect(
      handleVcRecruitConfigAddRole(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("ロール追加成功時は success embed でエフェメラル返信する", async () => {
    addMentionRoleIdMock.mockResolvedValue(VC_RECRUIT_MENTION_ROLE_ADD_RESULT.ADDED);
    const interaction = makeInteraction();
    await handleVcRecruitConfigAddRole(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        flags: expect.anything(),
      }),
    );
    expect(addMentionRoleIdMock).toHaveBeenCalledWith(GUILD_ID, ROLE_ID);
  });
});
