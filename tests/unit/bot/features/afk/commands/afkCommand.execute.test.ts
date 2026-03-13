// tests/unit/bot/features/afk/commands/afkCommand.execute.test.ts
import { executeAfkCommand } from "@/bot/features/afk/commands/afkCommand.execute";
import { ValidationError } from "@/shared/errors/customErrors";

const getAfkConfigMock = vi.fn();
const tGuildMock = vi.fn();
const tDefaultMock = vi.fn((key: string) => `default:${key}`);
const createSuccessEmbedMock = vi.fn((description: string) => ({
  description,
}));
const loggerInfoMock = vi.fn();

vi.mock("@/shared/features/afk/afkConfigService", () => ({
  getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => tDefaultMock(key),
  tGuild: (guildId: string, key: string, params?: Record<string, unknown>) =>
    tGuildMock(guildId, key, params),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

function createInteraction() {
  const setChannelMock = vi.fn().mockResolvedValue(undefined);
  return {
    guildId: "guild-1",
    user: { id: "user-1" },
    options: {
      getUser: vi.fn(() => null),
    },
    guild: {
      members: {
        fetch: vi.fn().mockResolvedValue({
          voice: {
            channel: { id: "voice-1" },
            setChannel: setChannelMock,
          },
        }),
      },
      channels: {
        fetch: vi.fn().mockResolvedValue({
          id: "afk-channel",
          type: 2,
        }),
      },
    },
    reply: vi.fn().mockResolvedValue(undefined),
    setChannelMock,
  };
}

// afkCommand の実行ロジックが
// ギルドコンテキストの検証・対象ユーザーの AFK チャンネルへの移動・
// 成功 Embed の返信を正しく行うかを検証する
describe("bot/features/afk/commands/afkCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAfkConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "afk-channel",
    });
    tGuildMock.mockResolvedValue("translated");
  });

  // guildId が null（DM などギルド外）の場合はコマンド実行前に弾かれることを確認
  it("throws ValidationError when guildId is missing", async () => {
    const interaction = createInteraction();
    interaction.guildId = null as never;

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("moves target user and replies success embed", async () => {
    const interaction = createInteraction();

    await executeAfkCommand(interaction as never);

    expect(interaction.setChannelMock).toHaveBeenCalledWith({
      id: "afk-channel",
      type: 2,
    });
    expect(createSuccessEmbedMock).toHaveBeenCalledWith("translated");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
    });
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
  });

  it("throws ValidationError when config is null", async () => {
    getAfkConfigMock.mockResolvedValue(null);
    const interaction = createInteraction();

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when config.enabled is false", async () => {
    getAfkConfigMock.mockResolvedValue({ enabled: false, channelId: "afk-channel" });
    const interaction = createInteraction();

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when config.channelId is missing", async () => {
    getAfkConfigMock.mockResolvedValue({ enabled: true, channelId: undefined });
    const interaction = createInteraction();

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when member is not found", async () => {
    const interaction = createInteraction();
    interaction.guild.members.fetch = vi.fn().mockResolvedValue(null);

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when member is not in a voice channel", async () => {
    const interaction = createInteraction();
    interaction.guild.members.fetch = vi.fn().mockResolvedValue({
      voice: { channel: null },
    });

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when afk channel is not found", async () => {
    const interaction = createInteraction();
    interaction.guild.channels.fetch = vi.fn().mockResolvedValue(null);

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when afk channel is not a GuildVoice channel", async () => {
    const interaction = createInteraction();
    // ChannelType.GuildText = 0
    interaction.guild.channels.fetch = vi.fn().mockResolvedValue({
      id: "afk-channel",
      type: 0, // GuildText, not GuildVoice (2)
    });

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("uses explicit user option if provided", async () => {
    const interaction = createInteraction();
    const explicitUser = { id: "user-2" };
    interaction.options.getUser = vi.fn().mockReturnValue(explicitUser);

    await executeAfkCommand(interaction as never);

    expect(interaction.guild.members.fetch).toHaveBeenCalledWith("user-2");
  });
});
