// tests/unit/bot/features/vac/commands/usecases/vacLimit.test.ts
import type { Mock } from "vitest";
import { resolveVacVoiceChannelForEdit } from "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver";
import { executeVacLimit } from "@/bot/features/vac/commands/usecases/vacLimit";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { ValidationError } from "@/shared/errors/customErrors";
import { MessageFlags } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(
    async (_guildId: string, key: string, params?: Record<string, unknown>) => {
      if (key === "commands:vac.embed.unlimited") {
        return "unlimited";
      }
      if (key === "commands:vac.embed.limit_changed") {
        return `limit:${String(params?.limit)}`;
      }
      return key;
    },
  ),
}));

vi.mock(
  "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver",
  () => ({
    resolveVacVoiceChannelForEdit: vi.fn(),
  }),
);

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

describe("bot/features/vac/commands/usecases/vacLimit", () => {
  // VC上限変更の範囲検証と通知内容を検証する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("許容範囲外の上限値が渡された場合にValidationErrorをスローする", async () => {
    const interaction = {
      options: { getInteger: vi.fn(() => 100) },
      reply: vi.fn(),
    };

    await expect(
      executeVacLimit(interaction as never, "guild-1", "voice-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("上限0を設定して無制限ラベルで成功応答する", async () => {
    const edit = vi.fn().mockResolvedValue(undefined);
    (resolveVacVoiceChannelForEdit as Mock).mockResolvedValue({ edit });

    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      options: { getInteger: vi.fn(() => 0) },
      reply,
    };

    await executeVacLimit(interaction as never, "guild-1", "voice-1");

    expect(edit).toHaveBeenCalledWith({ userLimit: 0 });
    expect(createSuccessEmbed).toHaveBeenCalledWith("limit:unlimited");
    expect(reply).toHaveBeenCalledWith({
      embeds: [{ description: "limit:unlimited" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("チャンネル上限を数値で設定して数値ラベルで成功応答する", async () => {
    const edit = vi.fn().mockResolvedValue(undefined);
    (resolveVacVoiceChannelForEdit as Mock).mockResolvedValue({ edit });

    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      options: { getInteger: vi.fn(() => 8) },
      reply,
    };

    await executeVacLimit(interaction as never, "guild-1", "voice-1");

    expect(edit).toHaveBeenCalledWith({ userLimit: 8 });
    expect(createSuccessEmbed).toHaveBeenCalledWith("limit:8");
    expect(reply).toHaveBeenCalledWith({
      embeds: [{ description: "limit:8" }],
      flags: MessageFlags.Ephemeral,
    });
  });
});
