// tests/unit/bot/features/vc-recruit/commands/usecases/vcRecruitConfigView.test.ts
import { handleVcRecruitConfigView } from "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigView";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----

const getVcRecruitConfigOrDefaultMock = vi.fn();
const tGuildMock = vi.fn(
  async (_guildId: string, key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key,
);
const tDefaultMock = vi.fn((key: string) => key);

vi.mock("@/bot/services/botVcRecruitDependencyResolver", () => ({
  getBotVcRecruitRepository: () => ({
    getVcRecruitConfigOrDefault: (...args: unknown[]) =>
      getVcRecruitConfigOrDefaultMock(...args),
  }),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (...args: unknown[]) =>
    tGuildMock(...(args as Parameters<typeof tGuildMock>)),
  tDefault: (...args: unknown[]) =>
    tDefaultMock(...(args as Parameters<typeof tDefaultMock>)),
}));

// ---- ヘルパー ----

const GUILD_ID = "guild-1";

function makeInteraction(
  opts: {
    hasGuild?: boolean;
    guildChannels?: Record<string, { name: string }>;
  } = {},
) {
  const { hasGuild = true, guildChannels = {} } = opts;
  return {
    guild: hasGuild
      ? {
          id: GUILD_ID,
          channels: {
            cache: {
              get: (id: string) => guildChannels[id] ?? undefined,
            },
          },
        }
      : null,
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

describe("bot/features/vc-recruit/commands/usecases/vcRecruitConfigView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // guild が null の場合は ValidationError を投げる
  it("throws ValidationError when interaction has no guild", async () => {
    const interaction = makeInteraction({ hasGuild: false });
    await expect(
      handleVcRecruitConfigView(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // セットアップ・ロールが空の場合もエラーなく返信する
  it("replies with info embed when config is empty", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [],
      mentionRoleIds: [],
    });
    const interaction = makeInteraction();
    await handleVcRecruitConfigView(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        flags: expect.anything(),
      }),
    );
  });

  // セットアップがある場合はカテゴリー名を表示する（カテゴリーあり）
  it("shows category name in reply when setups exist with known category", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [
        {
          categoryId: "cat-1",
          panelChannelId: "panel-ch-1",
          postChannelId: "post-ch-1",
        },
      ],
      mentionRoleIds: [],
    });
    const interaction = makeInteraction({
      guildChannels: { "cat-1": { name: "ゲームカテゴリー" } },
    });
    await handleVcRecruitConfigView(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalled();
    expect(getVcRecruitConfigOrDefaultMock).toHaveBeenCalledWith(GUILD_ID);
  });

  // categoryId が null のセットアップは "TOP" キーで表示する
  it("uses TOP key for setup with null categoryId", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [
        {
          categoryId: null,
          panelChannelId: "panel-ch-1",
          postChannelId: "post-ch-1",
        },
      ],
      mentionRoleIds: [],
    });
    const interaction = makeInteraction();
    await handleVcRecruitConfigView(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalled();
    expect(tGuildMock).toHaveBeenCalledWith(
      GUILD_ID,
      "commands:vc-recruit-config.embed.top",
    );
  });

  // categoryId があるがキャッシュに存在しないセットアップは categoryId をフォールバックラベルとして使用する
  it("falls back to categoryId string when category channel is not in guild cache", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [
        {
          categoryId: "cat-missing",
          panelChannelId: "panel-ch-1",
          postChannelId: "post-ch-1",
        },
      ],
      mentionRoleIds: [],
    });
    // cat-missing はキャッシュに存在しない
    const interaction = makeInteraction({ guildChannels: {} });
    await handleVcRecruitConfigView(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalled();
    // setup_item の category 引数に categoryId そのものが渡される
    expect(tGuildMock).toHaveBeenCalledWith(
      GUILD_ID,
      "commands:vc-recruit-config.embed.setup_item",
      expect.objectContaining({ category: "cat-missing" }),
    );
  });

  // ロールがある場合はロール一覧を含む embed で返信する
  it("replies with role mentions when mentionRoleIds exist", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [],
      mentionRoleIds: ["role-1", "role-2"],
    });
    const interaction = makeInteraction();
    await handleVcRecruitConfigView(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        flags: expect.anything(),
      }),
    );
  });
});
