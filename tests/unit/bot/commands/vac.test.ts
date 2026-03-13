// tests/unit/bot/commands/vac.test.ts
import { ChannelType, MessageFlags } from "discord.js";

const isManagedVacChannelMock = vi.fn();
const tGuildMock = vi.hoisted(() => vi.fn());
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
  tGuild: tGuildMock,
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
    tGuildMock.mockResolvedValue("translated");
    isManagedVacChannelMock.mockResolvedValue(true);
  });

  // vc-rename 正常系の応答を検証
  it("renames managed voice channel and replies success embed", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guildId: "guild-1",
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
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // vc-limit 正常系（制限あり）を検証
  it("sets user limit on managed voice channel and replies success", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guildId: "guild-1",
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
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // vc-limit 0 は unlimited 表示で成功することを検証
  it("uses unlimited label when vc-limit is zero", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guildId: "guild-1",
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
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });
});
