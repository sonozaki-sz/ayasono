// tests/unit/bot/commands/afk-config.test.ts
import type { ChatInputCommandInteraction } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import type { Mock } from "vitest";

const setAfkChannelMock = vi.fn();
const getAfkConfigMock = vi.fn();
const tGuildMock = vi.hoisted(() => vi.fn());
const tDefaultMock = vi.hoisted(() => vi.fn((key: string) => `default:${key}`));
const createSuccessEmbedMock = vi.fn(
  (description: string, _options?: unknown) => ({
    kind: "success",
    description,
  }),
);
const createInfoEmbedMock = vi.fn(
  (description: string, _options?: unknown) => ({
    kind: "info",
    description,
  }),
);

// afkConfigService が使う DB レイヤーのみモック
vi.mock("@/shared/database/guildConfigRepositoryProvider", () => ({
  getGuildConfigRepository: () => ({
    setAfkChannel: (...args: unknown[]) => setAfkChannelMock(...args),
    getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
  }),
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

// i18n を固定値化して期待値を安定させる
vi.mock("@/shared/locale/commandLocalizations", () => ({
  getCommandLocalizations: () => ({
    ja: "desc",
    localizations: { "en-US": "desc" },
  }),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: tDefaultMock,
  tGuild: tGuildMock,
  tInteraction: (...args: unknown[]) => args[1],
}));

// メッセージ生成ユーティリティは生成結果を簡易オブジェクトに置換する
vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string, options?: unknown) =>
    createSuccessEmbedMock(description, options),
  createInfoEmbed: (description: string, options?: unknown) =>
    createInfoEmbedMock(description, options),
}));

import { afkConfigCommand } from "@/bot/commands/afk-config";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";

type AfkConfigInteraction = {
  guildId: string | null;
  channelId: string;
  locale: string;
  memberPermissions: { has: Mock };
  options: {
    getSubcommand: Mock<() => string>;
    getChannel: Mock;
  };
  reply: Mock;
};

// afk-config 検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<AfkConfigInteraction>,
): AfkConfigInteraction {
  return {
    guildId: "guild-1",
    channelId: "channel-1",
    locale: "ja",
    memberPermissions: {
      has: vi.fn(() => true),
    },
    options: {
      getSubcommand: vi.fn(() => "set-channel"),
      getChannel: vi.fn(() => ({
        id: "afk-channel",
        type: ChannelType.GuildVoice,
      })),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/afk-config", () => {
  // ケースごとにモック状態を初期化する
  beforeEach(() => {
    vi.clearAllMocks();
    // tInteraction mock returns key as-is (no setup needed)
    getAfkConfigMock.mockResolvedValue({ enabled: false, channelId: null });
  });

  it("set-channel サブコマンドで AFK チャンネルが保存されて Ephemeral で返信することを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-channel"),
        getChannel: vi.fn(() => ({
          id: "afk-channel",
          type: ChannelType.GuildVoice,
        })),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
    expect(setAfkChannelMock).toHaveBeenCalledWith("guild-1", "afk-channel");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ kind: "success", description: "commands:afk-config.embed.set_ch_success" }],
      flags: 64,
    });
  });

  it("set-channel でチャンネル種別が無効の場合は AFK チャンネルが設定されないことを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-channel"),
        getChannel: vi.fn(() => ({
          id: "text-1",
          type: ChannelType.GuildText,
        })),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(setAfkChannelMock).not.toHaveBeenCalled();
  });

  it("view サブコマンドで未設定の場合は情報 Embed が返されることを確認", async () => {
    getAfkConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getChannel: vi.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(getAfkConfigMock).toHaveBeenCalledWith("guild-1");
    expect(createInfoEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ kind: "info", description: "commands:afk-config.embed.not_configured" }],
      flags: 64,
    });
  });

  // view で未設定判定の分岐（enabled=false / channelId=null）を網羅する
  it.each([
    { enabled: false, channelId: "afk-channel" },
    { enabled: true, channelId: null },
  ])("設定が不正な場合は未設定状態を表示することを確認: %j", async (config) => {
    getAfkConfigMock.mockResolvedValueOnce(config);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getChannel: vi.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(createInfoEmbedMock).toHaveBeenCalledWith("commands:afk-config.embed.not_configured", {
      title: "commands:afk-config.embed.title",
    });
  });

  it("view サブコマンドで設定済みの場合は AFK チャンネル情報が表示されることを確認", async () => {
    getAfkConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "afk-channel",
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getChannel: vi.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(createInfoEmbedMock).toHaveBeenCalledWith("", {
      title: "commands:afk-config.embed.title",
      fields: [{ name: "commands:afk-config.embed.field.channel", value: "<#afk-channel>", inline: true }],
    });
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ kind: "info", description: "" }],
      flags: 64,
    });
  });
});
