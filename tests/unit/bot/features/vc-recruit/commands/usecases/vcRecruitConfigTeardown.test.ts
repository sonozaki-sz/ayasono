// tests/unit/bot/features/vc-recruit/commands/usecases/vcRecruitConfigTeardown.test.ts
import { handleVcRecruitConfigTeardown } from "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigTeardown";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----

const getVcRecruitConfigOrDefaultMock = vi.fn();
const tGuildMock = vi.fn(
  async (_guildId: string, key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key,
);
const tDefaultMock = vi.fn((key: string) => key);

vi.mock("@/bot/services/botCompositionRoot", () => ({
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

/** テスト用インタラクションモックを生成する */
function makeInteraction(guildChannels: Record<string, { name: string }> = {}) {
  return {
    id: "interaction-001",
    guild: {
      id: GUILD_ID,
      channels: {
        cache: {
          get: (id: string) => guildChannels[id] ?? undefined,
        },
      },
    },
    reply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

// handleVcRecruitConfigTeardown のユースケースロジックを検証
describe("bot/features/vc-recruit/commands/usecases/vcRecruitConfigTeardown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // guild が null の場合は ValidationError を投げる
  it("throws ValidationError when guild is null", async () => {
    const interaction = { guild: null };
    await expect(
      handleVcRecruitConfigTeardown(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // セットアップが0件の場合は ValidationError を投げる
  it("throws ValidationError when no setups exist", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({ setups: [] });

    const interaction = makeInteraction();
    await expect(
      handleVcRecruitConfigTeardown(interaction as never, GUILD_ID),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // セットアップが存在する場合はセレクトメニュー付きのエフェメラルメッセージで応答する
  it("replies with StringSelectMenu when setups exist", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [{ categoryId: null, panelChannelId: "panel-ch-1" }],
    });

    const interaction = makeInteraction();
    await handleVcRecruitConfigTeardown(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        components: expect.any(Array),
        flags: expect.anything(),
      }),
    );
  });

  // categoryId が null の場合は TOP ラベルを使用する
  it("uses TOP label for setup with null categoryId", async () => {
    const topLabel = "TOP（カテゴリーなし）";
    tGuildMock.mockImplementation(async (_guildId: string, key: string) => {
      if (key === "commands:vc-recruit-config.teardown.select.top")
        return topLabel;
      return key;
    });

    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [{ categoryId: null, panelChannelId: "panel-ch-1" }],
    });

    const interaction = makeInteraction();
    await handleVcRecruitConfigTeardown(interaction as never, GUILD_ID);

    // reply が呼ばれ、コンポーネントが含まれることを確認
    expect(interaction.reply).toHaveBeenCalled();
    const callArg = (interaction.reply as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as {
      components: {
        components: { options: { data: { label: string; value: string } }[] }[];
      }[];
    };
    const selectOptions = callArg.components[0].components[0].options;
    expect(selectOptions[0].data.label).toBe(topLabel);
    expect(selectOptions[0].data.value).toBe("panel-ch-1");
  });

  // categoryId のチャンネルが存在する場合はチャンネル名を使用する
  it("uses channel name for known categoryId", async () => {
    const channelName = "ゲームカテゴリー";
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [{ categoryId: "cat-1", panelChannelId: "panel-ch-1" }],
    });

    const interaction = makeInteraction({ "cat-1": { name: channelName } });
    await handleVcRecruitConfigTeardown(interaction as never, GUILD_ID);

    expect(interaction.reply).toHaveBeenCalled();
    const callArg = (interaction.reply as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as {
      components: {
        components: { options: { data: { label: string; value: string } }[] }[];
      }[];
    };
    const selectOptions = callArg.components[0].components[0].options;
    expect(selectOptions[0].data.label).toBe(channelName);
    expect(selectOptions[0].data.value).toBe("panel-ch-1");
  });

  // categoryId が存在しないチャンネルの場合は unknown_category ラベルを使用する
  it("uses unknown_category label when category channel is not found", async () => {
    const unknownLabel = "不明なカテゴリー（ID: cat-999）";
    tGuildMock.mockImplementation(
      async (_guildId: string, key: string, opts?: Record<string, unknown>) => {
        if (
          key === "commands:vc-recruit-config.teardown.select.unknown_category"
        )
          return `不明なカテゴリー（ID: ${opts?.id}）`;
        return key;
      },
    );

    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [{ categoryId: "cat-999", panelChannelId: "panel-ch-1" }],
    });

    // cat-999 は guild キャッシュに存在しない
    const interaction = makeInteraction({});
    await handleVcRecruitConfigTeardown(interaction as never, GUILD_ID);

    const callArg = (interaction.reply as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as {
      components: {
        components: { options: { data: { label: string; value: string } }[] }[];
      }[];
    };
    const selectOptions = callArg.components[0].components[0].options;
    expect(selectOptions[0].data.label).toBe(unknownLabel);
  });

  // 60秒後にセレクトメニューが無効化されることを確認
  it("disables select menu after 60 seconds", async () => {
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      setups: [{ categoryId: null, panelChannelId: "panel-ch-1" }],
    });

    const interaction = makeInteraction();
    await handleVcRecruitConfigTeardown(interaction as never, GUILD_ID);

    expect(interaction.editReply).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);

    // setTimeout は非同期コールバックなので、runAllTimersAsync で実行
    await vi.runAllTimersAsync();

    expect(interaction.editReply).toHaveBeenCalled();
  });
});
