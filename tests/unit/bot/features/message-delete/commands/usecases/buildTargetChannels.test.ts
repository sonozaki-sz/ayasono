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

  it("returns null when guild is null", async () => {
    const { buildTargetChannels } = await loadModule();
    const interaction = makeInteraction({ guildId: null });
    const result = await buildTargetChannels(interaction as never);
    expect(result).toBeNull();
  });

  it("returns null and sends warning for non-text channel option", async () => {
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

  it("returns null and sends error when bot has no access to specified channel", async () => {
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

  it("returns single channel array when valid text channel is specified", async () => {
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

  it("returns single channel when type is GuildVoice", async () => {
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

  it("returns single channel when type is PublicThread", async () => {
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

  it("returns accessible channels from guild when no channel option", async () => {
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

  it("filters out channels without bot permissions when me is set", async () => {
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

  it("returns all text channels when me is null", async () => {
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

  it("handles null channels in collection", async () => {
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

  it("returns channel when me is null and bot access is allowed", async () => {
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
