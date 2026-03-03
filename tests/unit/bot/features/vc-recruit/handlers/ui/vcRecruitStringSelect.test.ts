// tests/unit/bot/features/vc-recruit/handlers/ui/vcRecruitStringSelect.test.ts
import { vcRecruitStringSelectHandler } from "@/bot/features/vc-recruit/handlers/ui/vcRecruitStringSelect";

// ---- モック定義 ----

const updateVcRecruitSessionMock = vi.fn();
const setTeardownConfirmSessionMock = vi.fn();
const findSetupByPanelChannelIdMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);

vi.mock("@/bot/features/vc-recruit/handlers/ui/vcRecruitPanelState", () => ({
  updateVcRecruitSession: (...args: unknown[]) =>
    updateVcRecruitSessionMock(...args),
  NEW_VC_VALUE: "__new__",
  NO_MENTION_VALUE: "__none__",
}));
vi.mock("@/bot/features/vc-recruit/handlers/ui/vcRecruitTeardownState", () => ({
  setTeardownConfirmSession: (...args: unknown[]) =>
    setTeardownConfirmSessionMock(...args),
  getTeardownConfirmSession: vi.fn().mockReturnValue(null),
}));
vi.mock("@/bot/services/botVcRecruitDependencyResolver", () => ({
  getBotVcRecruitRepository: () => ({
    findSetupByPanelChannelId: (...args: unknown[]) =>
      findSetupByPanelChannelIdMock(...args),
  }),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (...args: unknown[]) =>
    tGuildMock(...(args as Parameters<typeof tGuildMock>)),
}));

// ---- ヘルパー定数 ----

const GUILD_ID = "guild-1";
const MENTION_PREFIX = "vc-recruit:select-mention:";
const VC_PREFIX = "vc-recruit:select-vc:";
const TEARDOWN_PREFIX = "vc-recruit-teardown-select:";

function makeInteraction(
  opts: {
    customId: string;
    values?: string[];
    guildChannels?: Record<string, { name: string }>;
  } = { customId: "" },
) {
  const { customId, values = [], guildChannels = {} } = opts;
  return {
    customId,
    values,
    guild: {
      id: GUILD_ID,
      channels: {
        cache: {
          get: (id: string) => guildChannels[id] ?? undefined,
        },
      },
    },
    id: "interaction-1",
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

// ---- テスト ----

describe("vcRecruitStringSelectHandler / matches()", () => {
  it("matches mention select prefix", () => {
    expect(
      vcRecruitStringSelectHandler.matches(`${MENTION_PREFIX}session-1`),
    ).toBe(true);
  });

  it("matches VC select prefix", () => {
    expect(vcRecruitStringSelectHandler.matches(`${VC_PREFIX}session-1`)).toBe(
      true,
    );
  });

  it("matches teardown select prefix", () => {
    expect(
      vcRecruitStringSelectHandler.matches(`${TEARDOWN_PREFIX}session-1`),
    ).toBe(true);
  });

  it("does not match unrelated customId", () => {
    expect(vcRecruitStringSelectHandler.matches("vac:select:session-1")).toBe(
      false,
    );
  });
});

describe("vcRecruitStringSelectHandler / mention select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // メンション選択 → session を更新 + deferUpdate を呼ぶ
  it("updates mentionRoleId in session and defers update", async () => {
    const interaction = makeInteraction({
      customId: `${MENTION_PREFIX}session-1`,
      values: ["role-42"],
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(updateVcRecruitSessionMock).toHaveBeenCalledWith("session-1", {
      mentionRoleId: "role-42",
    });
    expect(interaction.deferUpdate).toHaveBeenCalled();
  });

  // __none__ 選択でも session を更新できる
  it("updates session with __none__ value", async () => {
    const interaction = makeInteraction({
      customId: `${MENTION_PREFIX}session-2`,
      values: ["__none__"],
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(updateVcRecruitSessionMock).toHaveBeenCalledWith("session-2", {
      mentionRoleId: "__none__",
    });
  });
});

describe("vcRecruitStringSelectHandler / VC select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // VC選択 → session を更新 + deferUpdate を呼ぶ
  it("updates selectedVcId in session and defers update", async () => {
    const interaction = makeInteraction({
      customId: `${VC_PREFIX}session-3`,
      values: ["existing-vc-1"],
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(updateVcRecruitSessionMock).toHaveBeenCalledWith("session-3", {
      selectedVcId: "existing-vc-1",
    });
    expect(interaction.deferUpdate).toHaveBeenCalled();
  });

  // __new__ 選択でも session を更新できる
  it("updates session with __new__ value", async () => {
    const interaction = makeInteraction({
      customId: `${VC_PREFIX}session-4`,
      values: ["__new__"],
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(updateVcRecruitSessionMock).toHaveBeenCalledWith("session-4", {
      selectedVcId: "__new__",
    });
  });
});

describe("vcRecruitStringSelectHandler / teardown select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // セットアップが見つからないパネルIDはスキップする
  it("skips panel channel IDs not found in repo", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue(null);

    const interaction = makeInteraction({
      customId: `${TEARDOWN_PREFIX}session-5`,
      values: ["panel-not-found"],
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(setTeardownConfirmSessionMock).toHaveBeenCalledWith(
      "interaction-1",
      expect.objectContaining({ selectedSetups: [] }),
    );
    expect(interaction.update).toHaveBeenCalled();
  });

  // 有効なセットアップが存在する場合は確認パネルを表示する
  it("shows teardown confirm panel when valid setups are selected", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue({
      panelChannelId: "panel-ch-1",
      categoryId: null,
    });

    const interaction = makeInteraction({
      customId: `${TEARDOWN_PREFIX}session-6`,
      values: ["panel-ch-1"],
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(setTeardownConfirmSessionMock).toHaveBeenCalledWith(
      "interaction-1",
      expect.objectContaining({
        guildId: GUILD_ID,
        selectedSetups: expect.arrayContaining([
          expect.objectContaining({ panelChannelId: "panel-ch-1" }),
        ]),
      }),
    );
    expect(interaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        components: expect.any(Array),
      }),
    );
  });

  // categoryId が既知のチャンネルの場合はチャンネル名をラベルに使用する
  it("uses channel name as label when category channel is known", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue({
      panelChannelId: "panel-ch-1",
      categoryId: "cat-1",
    });

    const interaction = makeInteraction({
      customId: `${TEARDOWN_PREFIX}session-7`,
      values: ["panel-ch-1"],
      guildChannels: { "cat-1": { name: "ゲームカテゴリー" } },
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(setTeardownConfirmSessionMock).toHaveBeenCalledWith(
      "interaction-1",
      expect.objectContaining({
        selectedSetups: expect.arrayContaining([
          expect.objectContaining({
            categoryLabel: "ゲームカテゴリー",
          }),
        ]),
      }),
    );
  });

  // categoryId がキャッシュに存在しない場合は unknown_category ラベルを使用する
  it("uses unknown_category label when setup categoryId is not in guild cache", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue({
      panelChannelId: "panel-ch-1",
      categoryId: "cat-unknown",
    });

    // cat-unknown がキャッシュにないインタラクション
    const interaction = makeInteraction({
      customId: `${TEARDOWN_PREFIX}session-unknown`,
      values: ["panel-ch-1"],
      guildChannels: {}, // キャッシュに何もない
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(setTeardownConfirmSessionMock).toHaveBeenCalledWith(
      "interaction-1",
      expect.objectContaining({
        selectedSetups: expect.arrayContaining([
          expect.objectContaining({ panelChannelId: "panel-ch-1" }),
        ]),
      }),
    );
    // tGuild が unknown_category キーで呼ばれる
    expect(tGuildMock).toHaveBeenCalledWith(
      GUILD_ID,
      "commands:vc-recruit-config.teardown.select.unknown_category",
      expect.objectContaining({ id: "cat-unknown" }),
    );
  });

  // 60秒後に確認ボタンが無効化される
  it("disables confirm buttons after 60 seconds", async () => {
    vi.useFakeTimers();
    findSetupByPanelChannelIdMock.mockResolvedValue({
      panelChannelId: "panel-ch-1",
      categoryId: null,
    });

    const interaction = makeInteraction({
      customId: `${TEARDOWN_PREFIX}session-8`,
      values: ["panel-ch-1"],
    });

    await vcRecruitStringSelectHandler.execute(interaction as never);

    expect(interaction.editReply).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    await vi.runAllTimersAsync();

    expect(interaction.editReply).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
