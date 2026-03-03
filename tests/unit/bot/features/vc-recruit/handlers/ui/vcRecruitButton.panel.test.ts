// tests/unit/bot/features/vc-recruit/handlers/ui/vcRecruitButton.panel.test.ts
// 「VC募集を作成」ボタン（CREATE）と「次へ（詳細入力）」ボタン（MODAL_OPEN）の動作を検証

import { vcRecruitButtonHandler } from "@/bot/features/vc-recruit/handlers/ui/vcRecruitButton";
import { MessageFlags } from "discord.js";

// ---- モック定義 ----

const findSetupByPanelChannelIdMock = vi.fn();
const getVcRecruitConfigOrDefaultMock = vi.fn();
const getVacConfigOrDefaultMock = vi.fn();
const getVcRecruitSessionMock = vi.fn();
const setVcRecruitSessionMock = vi.fn();
const safeReplyMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);

vi.mock("@/bot/services/botVcRecruitDependencyResolver", () => ({
  getBotVcRecruitRepository: () => ({
    findSetupByPanelChannelId: (...args: unknown[]) =>
      findSetupByPanelChannelIdMock(...args),
    getVcRecruitConfigOrDefault: (...args: unknown[]) =>
      getVcRecruitConfigOrDefaultMock(...args),
  }),
}));
vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: () => ({
    getVacConfigOrDefault: (...args: unknown[]) =>
      getVacConfigOrDefaultMock(...args),
  }),
}));
vi.mock("@/bot/features/vc-recruit/handlers/ui/vcRecruitPanelState", () => ({
  getVcRecruitSession: (...args: unknown[]) => getVcRecruitSessionMock(...args),
  setVcRecruitSession: (...args: unknown[]) => setVcRecruitSessionMock(...args),
  deleteVcRecruitSession: vi.fn(),
  updateVcRecruitSession: vi.fn(),
  NEW_VC_VALUE: "__new__",
  NO_MENTION_VALUE: "__none__",
}));
vi.mock("@/bot/features/vc-recruit/handlers/ui/vcRecruitTeardownState", () => ({
  getTeardownConfirmSession: vi.fn().mockReturnValue(null),
  deleteTeardownConfirmSession: vi.fn(),
  setTeardownConfirmSession: vi.fn(),
}));
vi.mock(
  "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigTeardown",
  () => ({
    buildTeardownSelectOptions: vi.fn().mockResolvedValue([]),
  }),
);
vi.mock("@/bot/utils/interaction", () => ({
  safeReply: (...args: unknown[]) => safeReplyMock(...args),
}));
vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((msg: string) => ({ error: msg })),
  createSuccessEmbed: vi.fn((msg: string) => ({ success: msg })),
  createInfoEmbed: vi.fn((msg: string) => ({ info: msg })),
  createWarningEmbed: vi.fn((msg: string) => ({ warning: msg })),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (...args: unknown[]) =>
    tGuildMock(...(args as Parameters<typeof tGuildMock>)),
  tDefault: vi.fn((key: string) => key),
}));

// ---- ヘルパー定数 ----

const GUILD_ID = "guild-1";
const PANEL_CH_ID = "panel-ch-1";
const CREATE_PREFIX = "vc-recruit:create:";
const MODAL_OPEN_PREFIX = "vc-recruit:open-modal:";

function makeGuild(
  opts: {
    panelChannel?: unknown;
    guildVcs?: {
      id: string;
      position: number;
      type: number;
      parentId: string | null;
    }[];
  } = {},
) {
  const { panelChannel = null, guildVcs = [] } = opts;

  const cacheMap = new Map(guildVcs.map((vc) => [vc.id, vc]));

  return {
    id: GUILD_ID,
    roles: {
      cache: new Map(),
    },
    channels: {
      fetch: vi.fn().mockResolvedValue(panelChannel),
      cache: {
        filter: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toJSON: vi.fn().mockReturnValue(guildVcs),
          }),
        }),
        get: (id: string) => cacheMap.get(id),
      },
    },
    members: {
      me: { id: "bot-me" },
    },
  };
}

function makeCreateButtonInteraction(
  customId: string,
  guild: ReturnType<typeof makeGuild> | null = makeGuild(),
) {
  return {
    customId,
    guild,
    user: { id: "user-1" },
    id: "interaction-create-1",
    reply: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

function makeModalOpenButtonInteraction(
  sessionId: string,
  guild: ReturnType<typeof makeGuild> | null = makeGuild(),
) {
  return {
    customId: `${MODAL_OPEN_PREFIX}${sessionId}`,
    guild,
    user: { id: "user-1" },
    id: "interaction-modal-1",
    reply: vi.fn().mockResolvedValue(undefined),
    showModal: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

// ---- テスト ----

describe("vcRecruitButtonHandler / matches()", () => {
  it("matches CREATE button prefix", () => {
    expect(vcRecruitButtonHandler.matches(`${CREATE_PREFIX}panel-ch-1`)).toBe(
      true,
    );
  });

  it("matches MODAL_OPEN button prefix", () => {
    expect(
      vcRecruitButtonHandler.matches(`${MODAL_OPEN_PREFIX}session-1`),
    ).toBe(true);
  });

  it("matches teardown CONFIRM prefix", () => {
    expect(
      vcRecruitButtonHandler.matches("vc-recruit-teardown-confirm:session-1"),
    ).toBe(true);
  });

  it("matches teardown CANCEL prefix", () => {
    expect(
      vcRecruitButtonHandler.matches("vc-recruit-teardown-cancel:session-1"),
    ).toBe(true);
  });

  it("matches teardown REDO prefix", () => {
    expect(
      vcRecruitButtonHandler.matches("vc-recruit-teardown-redo:session-1"),
    ).toBe(true);
  });

  it("does not match unrelated customId", () => {
    expect(vcRecruitButtonHandler.matches("vac:some-button")).toBe(false);
    expect(vcRecruitButtonHandler.matches("")).toBe(false);
  });
});

describe("vcRecruitButtonHandler / CREATE button (「VC募集を作成」)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVcRecruitConfigOrDefaultMock.mockResolvedValue({
      mentionRoleIds: [],
    });
    getVacConfigOrDefaultMock.mockResolvedValue({ triggerChannelIds: [] });
    safeReplyMock.mockResolvedValue(undefined);
  });

  // guild が null の場合は早期リターン
  it("does nothing when guild is null", async () => {
    const interaction = makeCreateButtonInteraction(
      `${CREATE_PREFIX}${PANEL_CH_ID}`,
      null,
    );
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(safeReplyMock).not.toHaveBeenCalled();
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  // パネルチャンネルが見つからない場合はエラー返信する
  it("replies with error when panel channel not found", async () => {
    const guild = makeGuild({ panelChannel: null });
    const interaction = makeCreateButtonInteraction(
      `${CREATE_PREFIX}${PANEL_CH_ID}`,
      guild,
    );
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  // セットアップが見つからない場合はエラー返信する
  it("replies with error when setup is not found", async () => {
    const panelChannel = { id: PANEL_CH_ID, name: "panel" };
    const guild = makeGuild({ panelChannel });
    findSetupByPanelChannelIdMock.mockResolvedValue(null);

    const interaction = makeCreateButtonInteraction(
      `${CREATE_PREFIX}${PANEL_CH_ID}`,
      guild,
    );
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  // 正常なケースではセレクトメニューと「次へ」ボタンを含むエフェメラルで返信する
  it("replies with select menus and modal-open button on success", async () => {
    const panelChannel = { id: PANEL_CH_ID, name: "panel" };
    const guild = makeGuild({ panelChannel });
    findSetupByPanelChannelIdMock.mockResolvedValue({
      categoryId: null,
      panelChannelId: PANEL_CH_ID,
      postChannelId: "post-ch-1",
    });

    const interaction = makeCreateButtonInteraction(
      `${CREATE_PREFIX}${PANEL_CH_ID}`,
      guild,
    );
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        components: expect.any(Array),
        flags: MessageFlags.Ephemeral,
      }),
    );
    // セッションが保存される
    expect(setVcRecruitSessionMock).toHaveBeenCalledWith(
      interaction.id,
      expect.objectContaining({ panelChannelId: PANEL_CH_ID }),
    );
  });
});

describe("vcRecruitButtonHandler / MODAL_OPEN button (「次へ（詳細入力）」)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeReplyMock.mockResolvedValue(undefined);
  });

  // セッションが見つからない場合はタイムアウトエラーを返す
  it("replies with timeout error when session is not found", async () => {
    getVcRecruitSessionMock.mockReturnValue(null);

    const interaction = makeModalOpenButtonInteraction("session-expired");
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(interaction.showModal).not.toHaveBeenCalled();
  });

  // selectedVcId が NEW_VC_VALUE の場合はVC名フィールドを含むモーダルを表示する
  it("shows modal with VC name field when selectedVcId is __new__", async () => {
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: "__new__",
      createdAt: Date.now(),
    });

    const interaction = makeModalOpenButtonInteraction("session-1");
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(interaction.showModal).toHaveBeenCalled();
    const modalArg = (interaction.showModal as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { toJSON: () => { components: unknown[] } };
    // VC名フィールドを含む（2コンポーネント = コンテンツ + VC名）
    expect(modalArg.toJSON().components).toHaveLength(2);
  });

  // selectedVcId が既存VCのIDの場合はVC名フィールドなしのモーダルを表示する
  it("shows modal without VC name field when selectedVcId is an existing VC", async () => {
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: "existing-vc-1",
      createdAt: Date.now(),
    });

    const interaction = makeModalOpenButtonInteraction("session-2");
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(interaction.showModal).toHaveBeenCalled();
    const modalArg = (interaction.showModal as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { toJSON: () => { components: unknown[] } };
    // VC名フィールドなし（1コンポーネント = コンテンツのみ）
    expect(modalArg.toJSON().components).toHaveLength(1);
  });
});
