// tests/unit/bot/features/vac/commands/helpers/vacVoiceChannelResolver.test.ts
import { resolveVacVoiceChannelForEdit } from "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver";
import { ValidationError } from "@/shared/errors/customErrors";
import { tInteraction } from "@/shared/locale/localeManager";
import { ChannelType } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tInteraction: vi.fn((_locale: string, key: string) => key),
}));

describe("bot/features/vac/commands/helpers/vacVoiceChannelResolver", () => {
  // 編集対象VCの解決条件とエラー分岐を検証する
  it("対象チャンネルが有効なギルドボイスチャンネルの場合にそれを返す", async () => {
    const voiceChannel = {
      id: "voice-1",
      type: ChannelType.GuildVoice,
    };
    const interaction = {
      locale: "ja",
      guild: {
        channels: {
          fetch: vi.fn().mockResolvedValue(voiceChannel),
        },
      },
    };

    const result = await resolveVacVoiceChannelForEdit(
      interaction as never,
      "guild-1",
      "voice-1",
    );

    expect(result).toBe(voiceChannel);
  });

  it("チャンネルが存在しない場合にValidationErrorをスローする", async () => {
    const interaction = {
      locale: "ja",
      guild: {
        channels: {
          fetch: vi.fn().mockResolvedValue(null),
        },
      },
    };

    await expect(
      resolveVacVoiceChannelForEdit(interaction as never, "guild-1", "x"),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(tInteraction).toHaveBeenCalledWith(
      "ja",
      "errors:vac.not_vac_channel",
    );
  });

  it("チャンネルがボイスチャンネルでない場合にValidationErrorをスローする", async () => {
    const interaction = {
      locale: "ja",
      guild: {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "text-1",
            type: ChannelType.GuildText,
          }),
        },
      },
    };

    await expect(
      resolveVacVoiceChannelForEdit(interaction as never, "guild-1", "text-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
