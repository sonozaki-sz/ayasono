// tests/unit/bot/features/vc-recruit/commands/vcRecruitConfigCommand.execute.test.ts
import { executeVcRecruitConfigCommand } from "@/bot/features/vc-recruit/commands/vcRecruitConfigCommand.execute";
import { ValidationError } from "@/shared/errors/customErrors";
import { PermissionFlagsBits } from "discord.js";

// ---- モック定義 ----

const handleVcRecruitConfigSetupMock = vi.fn().mockResolvedValue(undefined);
const handleVcRecruitConfigTeardownMock = vi.fn().mockResolvedValue(undefined);
const handleVcRecruitConfigAddRoleMock = vi.fn().mockResolvedValue(undefined);
const handleVcRecruitConfigRemoveRoleMock = vi
  .fn()
  .mockResolvedValue(undefined);
const handleVcRecruitConfigViewMock = vi.fn().mockResolvedValue(undefined);
const handleCommandErrorMock = vi.fn().mockResolvedValue(undefined);
const tDefaultMock = vi.fn((key: string) => key);

vi.mock(
  "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigSetup",
  () => ({
    handleVcRecruitConfigSetup: (...args: unknown[]) =>
      handleVcRecruitConfigSetupMock(...args),
  }),
);
vi.mock(
  "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigTeardown",
  () => ({
    handleVcRecruitConfigTeardown: (...args: unknown[]) =>
      handleVcRecruitConfigTeardownMock(...args),
  }),
);
vi.mock(
  "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigAddRole",
  () => ({
    handleVcRecruitConfigAddRole: (...args: unknown[]) =>
      handleVcRecruitConfigAddRoleMock(...args),
  }),
);
vi.mock(
  "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigRemoveRole",
  () => ({
    handleVcRecruitConfigRemoveRole: (...args: unknown[]) =>
      handleVcRecruitConfigRemoveRoleMock(...args),
  }),
);
vi.mock(
  "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigView",
  () => ({
    handleVcRecruitConfigView: (...args: unknown[]) =>
      handleVcRecruitConfigViewMock(...args),
  }),
);
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: (...args: unknown[]) => handleCommandErrorMock(...args),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (...args: unknown[]) =>
    tDefaultMock(...(args as Parameters<typeof tDefaultMock>)),
}));

// ---- ヘルパー ----

const GUILD_ID = "guild-1";

/** ManageGuild 権限を持つインタラクションモックを作成 */
function makeInteraction(
  opts: {
    guildId?: string | null;
    hasManageGuild?: boolean;
    subcommand?: string;
  } = {},
) {
  const {
    guildId = GUILD_ID,
    hasManageGuild = true,
    subcommand = "view",
  } = opts;

  return {
    guildId,
    guild: guildId ? { id: guildId } : null,
    memberPermissions: {
      has: (perm: bigint) =>
        hasManageGuild && perm === PermissionFlagsBits.ManageGuild,
    },
    options: {
      getSubcommand: () => subcommand,
    },
    reply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
  };
}

describe("bot/features/vc-recruit/commands/vcRecruitConfigCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // guildId が null の場合は ValidationError が handleCommandError に渡される
  it("calls handleCommandError with ValidationError when not in guild", async () => {
    const interaction = makeInteraction({ guildId: null });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleCommandErrorMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(ValidationError),
    );
  });

  // ManageGuild 権限がない場合は ValidationError が handleCommandError に渡される
  it("calls handleCommandError with ValidationError when missing ManageGuild permission", async () => {
    const interaction = makeInteraction({ hasManageGuild: false });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleCommandErrorMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(ValidationError),
    );
  });

  // setup サブコマンドが handleVcRecruitConfigSetup にルーティングされる
  it("routes setup subcommand to handleVcRecruitConfigSetup", async () => {
    const interaction = makeInteraction({ subcommand: "setup" });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleVcRecruitConfigSetupMock).toHaveBeenCalledWith(
      interaction,
      GUILD_ID,
    );
    expect(handleCommandErrorMock).not.toHaveBeenCalled();
  });

  // teardown サブコマンドが handleVcRecruitConfigTeardown にルーティングされる
  it("routes teardown subcommand to handleVcRecruitConfigTeardown", async () => {
    const interaction = makeInteraction({ subcommand: "teardown" });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleVcRecruitConfigTeardownMock).toHaveBeenCalledWith(
      interaction,
      GUILD_ID,
    );
    expect(handleCommandErrorMock).not.toHaveBeenCalled();
  });

  // add-role サブコマンドが handleVcRecruitConfigAddRole にルーティングされる
  it("routes add-role subcommand to handleVcRecruitConfigAddRole", async () => {
    const interaction = makeInteraction({ subcommand: "add-role" });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleVcRecruitConfigAddRoleMock).toHaveBeenCalledWith(
      interaction,
      GUILD_ID,
    );
    expect(handleCommandErrorMock).not.toHaveBeenCalled();
  });

  // remove-role サブコマンドが handleVcRecruitConfigRemoveRole にルーティングされる
  it("routes remove-role subcommand to handleVcRecruitConfigRemoveRole", async () => {
    const interaction = makeInteraction({ subcommand: "remove-role" });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleVcRecruitConfigRemoveRoleMock).toHaveBeenCalledWith(
      interaction,
      GUILD_ID,
    );
    expect(handleCommandErrorMock).not.toHaveBeenCalled();
  });

  // view サブコマンドが handleVcRecruitConfigView にルーティングされる
  it("routes view subcommand to handleVcRecruitConfigView", async () => {
    const interaction = makeInteraction({ subcommand: "view" });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleVcRecruitConfigViewMock).toHaveBeenCalledWith(
      interaction,
      GUILD_ID,
    );
    expect(handleCommandErrorMock).not.toHaveBeenCalled();
  });

  // 不明なサブコマンドは ValidationError が handleCommandError に渡される
  it("calls handleCommandError with ValidationError for unknown subcommand", async () => {
    const interaction = makeInteraction({ subcommand: "unknown" });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleCommandErrorMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(ValidationError),
    );
  });

  // ユースケースがエラーを throw した場合は handleCommandError に委譲する
  it("delegates thrown errors to handleCommandError", async () => {
    const error = new Error("ユースケースエラー");
    handleVcRecruitConfigViewMock.mockRejectedValueOnce(error);

    const interaction = makeInteraction({ subcommand: "view" });
    await executeVcRecruitConfigCommand(interaction as never);

    expect(handleCommandErrorMock).toHaveBeenCalledWith(
      expect.anything(),
      error,
    );
  });
});
