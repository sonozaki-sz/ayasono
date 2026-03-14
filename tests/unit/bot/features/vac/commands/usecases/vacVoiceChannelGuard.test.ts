// tests/unit/bot/features/vac/commands/usecases/vacVoiceChannelGuard.test.ts
import type { Mock } from "vitest";
import { getManagedVacVoiceChannel } from "@/bot/features/vac/commands/usecases/vacVoiceChannelGuard";
import { getBotVacConfigService } from "@/bot/services/botCompositionRoot";
import { ValidationError } from "@/shared/errors/customErrors";
import { ChannelType } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(async (_guildId: string, key: string) => key),
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotVacConfigService: vi.fn(),
}));

describe("bot/features/vac/commands/usecases/vacVoiceChannelGuard", () => {
  // 実行者VCの存在確認と管理対象判定の分岐を検証する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("メンバーがボイスチャンネルに在籍していない場合にValidationErrorをスローする", async () => {
    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: { channel: null },
          }),
        },
      },
    };

    await expect(
      getManagedVacVoiceChannel(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("在籍中のボイスチャンネルがVAC管理対象でない場合にValidationErrorをスローする", async () => {
    (getBotVacConfigService as Mock).mockReturnValue({
      isManagedVacChannel: vi.fn().mockResolvedValue(false),
    });

    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
      },
    };

    await expect(
      getManagedVacVoiceChannel(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("ユーザーがVAC管理チャンネルに在籍している場合にボイスチャンネルIDを返す", async () => {
    const isManagedVacChannel = vi.fn().mockResolvedValue(true);
    (getBotVacConfigService as Mock).mockReturnValue({
      isManagedVacChannel,
    });

    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
      },
    };

    const result = await getManagedVacVoiceChannel(
      interaction as never,
      "guild-1",
    );

    expect(result).toEqual({ id: "voice-1" });
    expect(isManagedVacChannel).toHaveBeenCalledWith("guild-1", "voice-1");
  });
});
