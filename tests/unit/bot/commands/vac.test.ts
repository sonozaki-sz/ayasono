// tests/unit/bot/commands/vac.test.ts
import { ChannelType, MessageFlags } from "discord.js";

const isManagedVacChannelMock = vi.fn();
const createSuccessEmbedMock = vi.fn((description: string) => ({
  description,
}));

// VAC管理判定のみモック化し、コマンド分岐を直接検証する
vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotVacConfigService: () => ({
    isManagedVacChannel: (...args: unknown[]) =>
      isManagedVacChannelMock(...args),
  }),
}));

// i18n は固定値化して期待値を安定させる
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
  tInteraction: (...args: unknown[]) => args[1],
}));

// Embed 生成結果を簡易オブジェクト化
vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

import { executeVacCommand } from "@/bot/features/vac/commands/vacCommand.execute";

describe("bot/commands/vac", () => {
  // ケースごとにモックを初期化する
  beforeEach(() => {
    vi.clearAllMocks();
    isManagedVacChannelMock.mockResolvedValue(true);
  });

  it("管理対象のボイスチャンネルをリネームして success embed で返信することを確認", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guildId: "guild-1",
      locale: "ja",
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildVoice,
            edit: editMock,
          }),
        },
      },
      options: {
        getSubcommand: vi.fn(() => "vc-rename"),
        getString: vi.fn(() => "Renamed VC"),
        getInteger: vi.fn(() => 10),
      },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await executeVacCommand(interaction as never);

    expect(isManagedVacChannelMock).toHaveBeenCalledWith("guild-1", "voice-1");
    expect(editMock).toHaveBeenCalledWith({ name: "Renamed VC" });
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: expect.any(String) }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("管理対象のボイスチャンネルにユーザー上限を設定して success embed で返信することを確認", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guildId: "guild-1",
      locale: "ja",
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildVoice,
            edit: editMock,
          }),
        },
      },
      options: {
        getSubcommand: vi.fn(() => "vc-limit"),
        getString: vi.fn(),
        getInteger: vi.fn(() => 12),
      },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await executeVacCommand(interaction as never);

    expect(editMock).toHaveBeenCalledWith({ userLimit: 12 });
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: expect.any(String) }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("vc-limit が 0 の場合は unlimited ラベルで成功することを確認", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guildId: "guild-1",
      locale: "ja",
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildVoice,
            edit: editMock,
          }),
        },
      },
      options: {
        getSubcommand: vi.fn(() => "vc-limit"),
        getString: vi.fn(),
        getInteger: vi.fn(() => 0),
      },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await executeVacCommand(interaction as never);

    expect(editMock).toHaveBeenCalledWith({ userLimit: 0 });
    expect(createSuccessEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: expect.any(String) }],
      flags: MessageFlags.Ephemeral,
    });
  });
});
