// tests/unit/bot/features/vc-recruit/handlers/ui/vcRecruitModal.test.ts
import { vcRecruitModalHandler } from "@/bot/features/vc-recruit/handlers/ui/vcRecruitModal";
import { ChannelType, MessageFlags } from "discord.js";

// ---- モック定義 ----

const getVcRecruitSessionMock = vi.fn();
const deleteVcRecruitSessionMock = vi.fn();
const findSetupByPanelChannelIdMock = vi.fn();
const addCreatedVoiceChannelIdMock = vi.fn();
const sendVcControlPanelMock = vi.fn();
const safeReplyMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);

vi.mock("@/bot/features/vc-recruit/handlers/ui/vcRecruitPanelState", () => ({
  getVcRecruitSession: (...args: unknown[]) => getVcRecruitSessionMock(...args),
  deleteVcRecruitSession: (...args: unknown[]) =>
    deleteVcRecruitSessionMock(...args),
  NEW_VC_VALUE: "__new__",
  NO_MENTION_VALUE: "__none__",
}));
vi.mock("@/bot/services/botVcRecruitDependencyResolver", () => ({
  getBotVcRecruitRepository: () => ({
    findSetupByPanelChannelId: (...args: unknown[]) =>
      findSetupByPanelChannelIdMock(...args),
    addCreatedVoiceChannelId: (...args: unknown[]) =>
      addCreatedVoiceChannelIdMock(...args),
  }),
}));
vi.mock("@/bot/features/vc-panel/vcControlPanel", () => ({
  sendVcControlPanel: (...args: unknown[]) => sendVcControlPanelMock(...args),
}));
vi.mock("@/bot/utils/interaction", () => ({
  safeReply: (...args: unknown[]) => safeReplyMock(...args),
}));
vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((msg: string) => ({ error: msg })),
  createWarningEmbed: vi.fn((msg: string) => ({ warning: msg })),
  createInfoEmbed: vi.fn((msg: string) => ({ info: msg })),
  createSuccessEmbed: vi.fn((msg: string) => ({ success: msg })),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (...args: unknown[]) =>
    tGuildMock(...(args as Parameters<typeof tGuildMock>)),
}));

// ---- ヘルパー ----

const GUILD_ID = "guild-1";
const PANEL_CH_ID = "panel-ch-1";
const POST_CH_ID = "post-ch-1";
const MODAL_PREFIX = "vc-recruit:modal:";
const SESSION_ID = "session-1";

function makeVoiceChannel(id = "vc-created-1") {
  return {
    id,
    type: ChannelType.GuildVoice,
    name: "テストVC",
  };
}

function makeSetup(opts: { categoryId?: string | null } = {}) {
  return {
    panelChannelId: PANEL_CH_ID,
    postChannelId: POST_CH_ID,
    categoryId: opts.categoryId ?? null,
    panelMessageId: "panel-msg-1",
    threadArchiveDuration: 1440,
  };
}

function makeGuild(
  opts: {
    createVcResult?: unknown;
    fetchChannelResult?: unknown;
    postChannel?: unknown;
    fetchMemberResult?: unknown;
    categorySize?: number;
  } = {},
) {
  const {
    createVcResult = makeVoiceChannel(),
    fetchChannelResult,
    postChannel,
    fetchMemberResult = null,
    categorySize = 0,
  } = opts;

  const sendMock = vi.fn().mockResolvedValue({
    startThread: vi.fn().mockResolvedValue(undefined),
  });

  const resolvedPostChannel = postChannel ?? {
    id: POST_CH_ID,
    isSendable: () => true,
    send: sendMock,
  };

  return {
    id: GUILD_ID,
    channels: {
      create: vi.fn().mockResolvedValue(createVcResult),
      fetch: vi.fn(async (id: string) => {
        if (id === POST_CH_ID) return resolvedPostChannel;
        if (id === PANEL_CH_ID) return null;
        if (fetchChannelResult !== undefined) return fetchChannelResult;
        // categoryId
        return {
          id,
          type: ChannelType.GuildCategory,
          children: { cache: { size: categorySize } },
        };
      }),
    },
    members: {
      fetch: vi.fn().mockResolvedValue(fetchMemberResult),
    },
    _postChannelSendMock: sendMock,
  };
}

function makeInteraction(
  opts: {
    hasGuild?: boolean;
    sessionId?: string;
    content?: string;
    vcName?: string;
    memberVoiceChannel?: unknown;
  } = {},
) {
  const {
    hasGuild = true,
    sessionId = SESSION_ID,
    content = "一緒に遊びましょう！",
    vcName = "",
    memberVoiceChannel = { id: "user-vc-1" },
  } = opts;

  const guild = hasGuild ? makeGuild() : null;

  return {
    customId: `${MODAL_PREFIX}${sessionId}`,
    guild,
    user: { id: "user-1", username: "testuser" },
    fields: {
      getTextInputValue: (key: string) => {
        if (key === "vc-recruit:content") return content;
        if (key === "vc-recruit:vc-name") return vcName;
        return "";
      },
    },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    deleteReply: vi.fn().mockResolvedValue(undefined),
    _guildObj: guild,
    _memberVoiceChannel: memberVoiceChannel,
  };
}

/** guild.members.fetch の戻り値にボイスチャンネル情報を付与 */
function makeMember(voiceChannel: unknown | null, setChannelSuccess = true) {
  return {
    id: "user-1",
    displayName: "testuser",
    voice: {
      channel: voiceChannel,
      setChannel: vi
        .fn()
        .mockImplementation(() =>
          setChannelSuccess
            ? Promise.resolve()
            : Promise.reject(new Error("移動失敗")),
        ),
    },
  };
}

// ---- テスト ----

describe("vcRecruitModalHandler / matches()", () => {
  it("matches modal prefix", () => {
    expect(vcRecruitModalHandler.matches(`${MODAL_PREFIX}session-1`)).toBe(
      true,
    );
  });

  it("does not match unrelated customId", () => {
    expect(vcRecruitModalHandler.matches("vac:modal:session-1")).toBe(false);
  });
});

describe("vcRecruitModalHandler / execute()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeReplyMock.mockResolvedValue(undefined);
    sendVcControlPanelMock.mockResolvedValue(undefined);
    addCreatedVoiceChannelIdMock.mockResolvedValue(undefined);
  });

  // guild が null の場合は早期リターン
  it("does nothing when guild is null", async () => {
    const interaction = makeInteraction({ hasGuild: false });
    await vcRecruitModalHandler.execute(interaction as never);

    expect(getVcRecruitSessionMock).not.toHaveBeenCalled();
  });

  // セッションが見つからない場合はタイムアウトエラーを返す
  it("replies with timeout error when session is not found", async () => {
    getVcRecruitSessionMock.mockReturnValue(null);

    const interaction = makeInteraction();
    await vcRecruitModalHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  // セットアップが見つからない場合はエラーを返す
  it("replies with error when setup is not found", async () => {
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: "__new__",
      createdAt: Date.now(),
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(null);

    const interaction = makeInteraction();
    await vcRecruitModalHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  // 新規VC作成 + メンバーがVCにいる → 成功ケース（deleteReply）
  it("creates new VC and deletes reply when member is in a voice channel", async () => {
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: "__new__",
      createdAt: Date.now(),
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    const newVc = makeVoiceChannel("new-vc-1");
    const guild = makeGuild({ createVcResult: newVc });
    const member = makeMember({ id: "user-vc-1" }, true);
    guild.members.fetch = vi.fn().mockResolvedValue(member);

    const interaction = makeInteraction();
    interaction._guildObj = guild;
    // guild を差し替え
    (interaction as Record<string, unknown>).guild = guild;

    await vcRecruitModalHandler.execute(interaction as never);

    expect(guild.channels.create).toHaveBeenCalled();
    expect(addCreatedVoiceChannelIdMock).toHaveBeenCalledWith(
      GUILD_ID,
      PANEL_CH_ID,
      "new-vc-1",
    );
    expect(sendVcControlPanelMock).toHaveBeenCalledWith(newVc);
    expect(interaction.deleteReply).toHaveBeenCalled();
  });

  // 新規VC作成 + メンバーがVCにいない → warning 返信
  it("shows warning reply when member is not in a voice channel", async () => {
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: "__new__",
      createdAt: Date.now(),
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    const newVc = makeVoiceChannel("new-vc-1");
    const guild = makeGuild({ createVcResult: newVc });
    // VC にいないメンバー
    const member = makeMember(null);
    guild.members.fetch = vi.fn().mockResolvedValue(member);

    const interaction = makeInteraction();
    (interaction as Record<string, unknown>).guild = guild;

    await vcRecruitModalHandler.execute(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  // 既存VC選択 + VC が削除済み → エラー返信
  it("replies with error when selected existing VC is no longer available", async () => {
    const EXISTING_VC_ID = "existing-vc-deleted";
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: EXISTING_VC_ID,
      createdAt: Date.now(),
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    const guild = makeGuild({ fetchChannelResult: null });
    const interaction = makeInteraction();
    (interaction as Record<string, unknown>).guild = guild;

    await vcRecruitModalHandler.execute(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  // 既存VC選択 + 正常 → VC作成スキップ・deleteReply
  it("uses existing VC and deletes reply on success", async () => {
    const EXISTING_VC_ID = "existing-vc-1";
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: EXISTING_VC_ID,
      createdAt: Date.now(),
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    const existingVc = { id: EXISTING_VC_ID, type: ChannelType.GuildVoice };
    const guild = makeGuild({ fetchChannelResult: existingVc });
    const member = makeMember({ id: "user-vc-1" }, true);
    guild.members.fetch = vi.fn().mockResolvedValue(member);

    const interaction = makeInteraction();
    (interaction as Record<string, unknown>).guild = guild;

    await vcRecruitModalHandler.execute(interaction as never);

    expect(guild.channels.create).not.toHaveBeenCalled();
    expect(interaction.deleteReply).toHaveBeenCalled();
    expect(deleteVcRecruitSessionMock).toHaveBeenCalledWith(SESSION_ID);
  });

  // カテゴリーチャンネル数が上限に達している場合 → category_full エラーを返してVC作成しない
  it("replies with category_full error when category channel limit is reached", async () => {
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: "__new__",
      createdAt: Date.now(),
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup({ categoryId: "cat-1" }));

    // CATEGORY_CHANNEL_LIMIT = 50 なので size=50 で上限到達
    const guild = makeGuild({ categorySize: 50 });
    const interaction = makeInteraction();
    (interaction as Record<string, unknown>).guild = guild;

    await vcRecruitModalHandler.execute(interaction as never);

    expect(guild.channels.create).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
    expect(deleteVcRecruitSessionMock).toHaveBeenCalledWith(SESSION_ID);
  });

  // setChannel が throw した場合 → vcMoveFailed=true → warning 返信（deleteReply は呼ばれない）
  it("shows warning reply when setChannel throws", async () => {
    getVcRecruitSessionMock.mockReturnValue({
      panelChannelId: PANEL_CH_ID,
      mentionRoleId: null,
      selectedVcId: "__new__",
      createdAt: Date.now(),
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    const newVc = makeVoiceChannel("new-vc-setfail");
    const guild = makeGuild({ createVcResult: newVc });
    // setChannelSuccess=false → setChannel が throw する
    const member = makeMember({ id: "user-vc-1" }, false);
    guild.members.fetch = vi.fn().mockResolvedValue(member);

    const interaction = makeInteraction();
    (interaction as Record<string, unknown>).guild = guild;

    await vcRecruitModalHandler.execute(interaction as never);

    expect(member.voice.setChannel).toHaveBeenCalledWith(newVc);
    // warning embed で editReply が呼ばれる
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
    // deleteReply は呼ばれない
    expect(interaction.deleteReply).not.toHaveBeenCalled();
  });
});
