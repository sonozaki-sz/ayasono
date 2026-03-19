// tests/unit/bot/features/vac/commands/vacCommand.execute.test.ts
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import { executeVacLimit } from "@/bot/features/vac/commands/usecases/vacLimit";
import { executeVacRename } from "@/bot/features/vac/commands/usecases/vacRename";
import { getManagedVacVoiceChannel } from "@/bot/features/vac/commands/usecases/vacVoiceChannelGuard";
import { VAC_COMMAND } from "@/bot/features/vac/commands/vacCommand.constants";
import { executeVacCommand } from "@/bot/features/vac/commands/vacCommand.execute";
import type { Mock } from "vitest";

vi.mock("@/bot/features/vac/commands/usecases/vacLimit", () => ({
  executeVacLimit: vi.fn(),
}));

vi.mock("@/bot/features/vac/commands/usecases/vacRename", () => ({
  executeVacRename: vi.fn(),
}));

vi.mock("@/bot/features/vac/commands/usecases/vacVoiceChannelGuard", () => ({
  getManagedVacVoiceChannel: vi.fn(),
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
  tInteraction: (...args: unknown[]) => args[1],
}));

function createInteraction(overrides?: {
  guildId?: string | null;
  subcommand?: string;
}) {
  return {
    guildId:
      overrides && "guildId" in overrides ? overrides.guildId : "guild-1",
    options: {
      getSubcommand: vi.fn(
        () => overrides?.subcommand ?? VAC_COMMAND.SUBCOMMAND.VC_RENAME,
      ),
    },
  };
}

// サブコマンドのルーティング・ガード失敗・guildId未設定など境界条件ごとのエラー委譲を検証する
describe("bot/features/vac/commands/vacCommand.execute", () => {
  // 各テストが独立したモック状態で動くようリセットし、ガード成功のデフォルト値をセット
  beforeEach(() => {
    vi.clearAllMocks();
    (getManagedVacVoiceChannel as Mock).mockResolvedValue({
      id: "voice-1",
    });
  });

  it("guildIdがnull（DM等）の場合はガード・サブコマンド処理を一切呼ばずエラーハンドラへ委譲することを確認", async () => {
    const interaction = createInteraction({ guildId: null });

    await executeVacCommand(interaction as never);

    expect(getManagedVacVoiceChannel).not.toHaveBeenCalled();
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("vc-renameサブコマンドをexecuteVacRenameへ委譲する", async () => {
    const interaction = createInteraction({
      subcommand: VAC_COMMAND.SUBCOMMAND.VC_RENAME,
    });

    await executeVacCommand(interaction as never);

    expect(getManagedVacVoiceChannel).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(executeVacRename).toHaveBeenCalledWith(
      interaction,
      "guild-1",
      "voice-1",
    );
    expect(executeVacLimit).not.toHaveBeenCalled();
  });

  it("vc-limitサブコマンドをexecuteVacLimitへ委譲する", async () => {
    const interaction = createInteraction({
      subcommand: VAC_COMMAND.SUBCOMMAND.VC_LIMIT,
    });

    await executeVacCommand(interaction as never);

    expect(getManagedVacVoiceChannel).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(executeVacLimit).toHaveBeenCalledWith(
      interaction,
      "guild-1",
      "voice-1",
    );
    expect(executeVacRename).not.toHaveBeenCalled();
  });

  it("定義外のサブコマンド名が渡された場合はフォールスルーしてエラーハンドラへ委譲することを確認", async () => {
    const interaction = createInteraction({ subcommand: "invalid-subcommand" });

    await executeVacCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(executeVacLimit).not.toHaveBeenCalled();
    expect(executeVacRename).not.toHaveBeenCalled();
  });

  it("ボイスチャンネルガードが例外を投げた場合、サブコマンド処理を呼ばずエラーハンドラへ委譲することを確認", async () => {
    (getManagedVacVoiceChannel as Mock).mockRejectedValueOnce(
      new Error("not managed"),
    );
    const interaction = createInteraction();

    await executeVacCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(executeVacLimit).not.toHaveBeenCalled();
    expect(executeVacRename).not.toHaveBeenCalled();
  });
});
