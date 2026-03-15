// tests/unit/bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole.test.ts
import { handleVcRecruitConfigAddRole } from "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole";
import { VC_RECRUIT_ROLE_CUSTOM_ID } from "@/bot/features/vc-recruit/commands/vcRecruitConfigCommand.constants";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----

const tGuildMock = vi.fn(
  async (_guildId: string, key: string, _opts?: Record<string, unknown>) =>
    key,
);
const tDefaultMock = vi.fn((key: string) => key);

vi.mock("@/bot/shared/disableComponentsAfterTimeout", () => ({
  disableComponentsAfterTimeout: vi.fn(),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (...args: unknown[]) =>
    tGuildMock(...(args as Parameters<typeof tGuildMock>)),
  tDefault: (...args: unknown[]) =>
    tDefaultMock(...(args as Parameters<typeof tDefaultMock>)),
}));

// ---- ヘルパー ----

const GUILD_ID = "guild-1";

function makeInteraction(opts: { hasGuild?: boolean } = {}) {
  const { hasGuild = true } = opts;
  return {
    id: "interaction-123",
    guild: hasGuild ? { id: GUILD_ID } : null,
    reply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

// handleVcRecruitConfigAddRole のギルドチェック・RoleSelectMenu 返信・customId 構造を検証
describe("bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole", () => {
  // 各テストケースでモック状態をリセットする
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guild が null の場合は ValidationError を投げる", async () => {
    const interaction = makeInteraction({ hasGuild: false });
    await expect(
      handleVcRecruitConfigAddRole(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("RoleSelectMenu とボタンをエフェメラルで返信する", async () => {
    const interaction = makeInteraction();
    await handleVcRecruitConfigAddRole(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const call = interaction.reply.mock.calls[0][0];
    // コンポーネントが2行（セレクト + ボタン）
    expect(call.components).toHaveLength(2);
    // エフェメラル
    expect(call.flags).toBeDefined();
  });

  it("セレクトメニューの customId にセッション ID が含まれる", async () => {
    const interaction = makeInteraction();
    await handleVcRecruitConfigAddRole(interaction as never, GUILD_ID);

    const call = interaction.reply.mock.calls[0][0];
    const selectRow = call.components[0];
    const selectJson = selectRow.toJSON();
    expect(selectJson.components[0].custom_id).toBe(
      `${VC_RECRUIT_ROLE_CUSTOM_ID.ADD_ROLE_SELECT_PREFIX}${interaction.id}`,
    );
  });
});
