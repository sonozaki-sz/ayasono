// tests/unit/bot/features/message-delete/commands/usecases/buildTargetChannels.test.ts

import { ChannelType } from "discord.js";
import type { Mock } from "vitest";

const createWarningEmbedMock = vi.fn((d: string) => ({
  _type: "warning",
  description: d,
}));
const createErrorEmbedMock = vi.fn((d: string) => ({
  _type: "error",
  description: d,
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: (d: string) => createWarningEmbedMock(d),
  createErrorEmbed: (d: string) => createErrorEmbedMock(d),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
  },
}));

function makeInteraction(opts: {
  guildId?: string | null;
  channelOption?: object | null;
  meNull?: boolean;
  channels?: (object | null)[];
}) {
  const {
    guildId = "guild-1",
    channelOption = null,
    meNull = false,
    channels = [],
  } = opts;

  const me = meNull
    ? null
    : {
        displayName: "Bot",
      };

  const guild = guildId
    ? {
        id: guildId,
        members: { me },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            size: channels.length,
            values: () => channels,
          }) as Mock,
        },
      }
    : null;

  return {
    guild,
    guildId,
    options: {
      getChannel: vi.fn((name: string) => {
        if (name === "channel") return channelOption;
        return null;
      }),
    },
    editReply: vi.fn().mockResolvedValue(undefined) as Mock,
  };
}

describe("bot/features/message-delete/commands/usecases/buildTargetChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadModule() {
    return import(
      "@/bot/features/message-delete/commands/usecases/buildTargetChannels"
    );
  }

  it("guild が null の場合は null を返す", async () => {
    const { buildTargetChannels } = await loadModule();
    const interaction = makeInteraction({ guildId: null });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toBeNull();
  });

  it("テキスト以外のチャンネルオプションの場合は null を返して警告を送信する", async () => {
    const { buildTargetChannels } = await loadModule();
    const channelOption = {
      id: "ch-1",
      type: ChannelType.GuildCategory, // not a text-based channel
    };
    const interaction = makeInteraction({ channelOption });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toBeNull();
    expect(createWarningEmbedMock).toHaveBeenCalled();
  });

  it("Bot が指定チャンネルにアクセスできない場合は null を返してエラーを送信する", async () => {
    const { buildTargetChannels } = await loadModule();
    const channelOption = {
      id: "ch-1",
      type: ChannelType.GuildText,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => false) })),
    };
    const interaction = makeInteraction({ channelOption });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toBeNull();
    expect(createErrorEmbedMock).toHaveBeenCalled();
  });

  it("有効なテキストチャンネルが指定された場合は単一チャンネルの配列を返す", async () => {
    const { buildTargetChannels } = await loadModule();
    const channelOption = {
      id: "ch-1",
      type: ChannelType.GuildText,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    };
    const interaction = makeInteraction({ channelOption });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toHaveLength(1);
    expect(result?.[0]).toBe(channelOption);
  });

  it("GuildVoice タイプのチャンネルが指定された場合は単一チャンネルを返す", async () => {
    const { buildTargetChannels } = await loadModule();
    const channelOption = {
      id: "ch-1",
      type: ChannelType.GuildVoice,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    };
    const interaction = makeInteraction({ channelOption });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toHaveLength(1);
  });

  it("PublicThread タイプのチャンネルが指定された場合は単一チャンネルを返す", async () => {
    const { buildTargetChannels } = await loadModule();
    const channelOption = {
      id: "ch-1",
      type: ChannelType.PublicThread,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    };
    const interaction = makeInteraction({ channelOption });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toHaveLength(1);
  });

  it("チャンネルオプションなしの場合はギルドからアクセス可能なチャンネルを返す", async () => {
    const { buildTargetChannels } = await loadModule();
    const textChannel = {
      id: "ch-1",
      isTextBased: () => true,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    };
    const voiceChannel = {
      id: "ch-2",
      isTextBased: () => false,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    };
    const interaction = makeInteraction({
      channels: [textChannel, voiceChannel],
    });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toHaveLength(1);
    expect(result?.[0]).toBe(textChannel);
  });

  it("me が設定されている場合に Bot の権限がないチャンネルを除外する", async () => {
    const { buildTargetChannels } = await loadModule();
    const allowedChannel = {
      id: "ch-1",
      isTextBased: () => true,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    };
    const deniedChannel = {
      id: "ch-2",
      isTextBased: () => true,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => false) })),
    };
    const interaction = makeInteraction({
      channels: [allowedChannel, deniedChannel],
    });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toHaveLength(1);
    expect(result?.[0]).toBe(allowedChannel);
  });

  it("me が null の場合はすべてのテキストチャンネルを返す", async () => {
    const { buildTargetChannels } = await loadModule();
    const ch1 = { id: "ch-1", isTextBased: () => true };
    const ch2 = { id: "ch-2", isTextBased: () => true };
    const interaction = makeInteraction({
      channels: [ch1, ch2],
      meNull: true,
    });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toHaveLength(2);
  });

  it("コレクション内の null チャンネルを適切に処理する", async () => {
    const { buildTargetChannels } = await loadModule();
    const validChannel = {
      id: "ch-1",
      isTextBased: () => true,
      permissionsFor: vi.fn(() => ({ has: vi.fn(() => true) })),
    };
    const interaction = makeInteraction({
      channels: [null, validChannel, null],
    });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toHaveLength(1);
  });

  it("me が null でも Bot アクセスが許可されている場合はチャンネルを返す", async () => {
    const { buildTargetChannels } = await loadModule();
    const channelOption = {
      id: "ch-1",
      type: ChannelType.GuildText,
      permissionsFor: vi.fn(() => null), // permissionsFor returns null when no me
    };

    const guild = {
      id: "guild-1",
      members: { me: null },
    };

    const interaction = {
      guild,
      guildId: "guild-1",
      options: {
        getChannel: vi.fn(() => channelOption),
      },
      editReply: vi.fn().mockResolvedValue(undefined) as Mock,
    };

    const result = await buildTargetChannels(interaction as never);
    // When me is null, hasAccess is true (no restriction)
    expect(result).toHaveLength(1);
  });
});
