// tests/unit/bot/features/vc-recruit/handlers/ui/vcRecruitButton.teardown.test.ts
// teardown 確認ボタン（撤去する）の処理を検証
// 特に「DB 削除 → メッセージ削除 → チャンネル削除」の順序を重点的に確認する

import { vcRecruitButtonHandler } from "@/bot/features/vc-recruit/handlers/ui/vcRecruitButton";
import { DiscordAPIError, MessageFlags, RESTJSONErrorCodes } from "discord.js";

// ---- モック定義 ----

const getTeardownConfirmSessionMock = vi.fn();
const deleteTeardownConfirmSessionMock = vi.fn();
const findSetupByPanelChannelIdMock = vi.fn();
const removeSetupMock = vi.fn();
const tGuildMock = vi.fn(
  async (_guildId: string, key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key,
);

vi.mock("@/bot/features/vc-recruit/handlers/ui/vcRecruitTeardownState", () => ({
  getTeardownConfirmSession: (...args: unknown[]) =>
    getTeardownConfirmSessionMock(...args),
  deleteTeardownConfirmSession: (...args: unknown[]) =>
    deleteTeardownConfirmSessionMock(...args),
  setTeardownConfirmSession: vi.fn(),
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotVcRecruitRepository: () => ({
    findSetupByPanelChannelId: (...args: unknown[]) =>
      findSetupByPanelChannelIdMock(...args),
    removeSetup: (...args: unknown[]) => removeSetupMock(...args),
    getVcRecruitConfigOrDefault: vi
      .fn()
      .mockResolvedValue({ setups: [], mentionRoleIds: [] }),
  }),
  getBotVacConfigService: () => ({
    getVacConfigOrDefault: vi.fn().mockResolvedValue({ triggerChannelIds: [] }),
  }),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (...args: unknown[]) =>
    tGuildMock(...(args as Parameters<typeof tGuildMock>)),
  tDefault: vi.fn((key: string) => key),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((msg: string) => ({ error: msg })),
  createSuccessEmbed: vi.fn((msg: string) => ({ success: msg })),
  createInfoEmbed: vi.fn((msg: string) => ({ info: msg })),
  createWarningEmbed: vi.fn((msg: string) => ({ warning: msg })),
}));

vi.mock("@/bot/utils/interaction", () => ({
  safeReply: vi.fn(),
}));

vi.mock("@/bot/features/vc-recruit/handlers/ui/vcRecruitPanelState", () => ({
  getVcRecruitSession: vi.fn().mockReturnValue(null),
  setVcRecruitSession: vi.fn(),
  deleteVcRecruitSession: vi.fn(),
  NEW_VC_VALUE: "__new__",
  NO_MENTION_VALUE: "__none__",
}));

vi.mock(
  "@/bot/features/vc-recruit/commands/usecases/vcRecruitConfigTeardown",
  () => ({
    buildTeardownSelectOptions: vi.fn().mockResolvedValue([]),
  }),
);

// ---- ヘルパー ----

const GUILD_ID = "guild-1";
const PANEL_CHANNEL_ID = "panel-ch-1";
const POST_CHANNEL_ID = "post-ch-1";
const PANEL_MSG_ID = "panel-msg-1";
const SELECT_INTERACTION_ID = "select-001";
const CONFIRM_PREFIX = "vc-recruit-teardown-confirm:";

/** 実際の DiscordAPIError インスタンスをアプローチした UnknownChannel エラーモックを作成する */
function makeUnknownChannelError(): DiscordAPIError {
  const err = Object.assign(new Error("Unknown Channel"), {
    code: RESTJSONErrorCodes.UnknownChannel,
    status: 404,
    method: "DELETE",
    url: "https://discord.com/api/channels/123",
    rawError: {
      message: "Unknown Channel",
      code: RESTJSONErrorCodes.UnknownChannel,
    },
    requestBody: { files: [], json: undefined },
  });
  Object.setPrototypeOf(err, DiscordAPIError.prototype);
  return err as unknown as DiscordAPIError;
}

function makeSetup(
  overrides?: Partial<{
    panelChannelId: string;
    postChannelId: string;
    panelMessageId: string;
  }>,
) {
  return {
    panelChannelId: PANEL_CHANNEL_ID,
    postChannelId: POST_CHANNEL_ID,
    panelMessageId: PANEL_MSG_ID,
    ...overrides,
  };
}

function makeGuildChannel(deleteMock = vi.fn().mockResolvedValue(undefined)) {
  return {
    id: "ch",
    isTextBased: () => true,
    delete: deleteMock,
    messages: {
      fetch: vi
        .fn()
        .mockResolvedValue({ delete: vi.fn().mockResolvedValue(undefined) }),
    },
  };
}

function makeInteraction(
  customId = `${CONFIRM_PREFIX}${SELECT_INTERACTION_ID}`,
) {
  const panelCh = makeGuildChannel();
  const postCh = makeGuildChannel();
  return {
    customId,
    guild: {
      id: GUILD_ID,
      channels: {
        fetch: vi.fn(async (id: string) => {
          if (id === PANEL_CHANNEL_ID) return panelCh;
          if (id === POST_CHANNEL_ID) return postCh;
          return null;
        }),
        cache: {
          get: vi.fn().mockReturnValue(panelCh),
        },
      },
      roles: { everyone: { id: "everyone" } },
    },
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

// ---- テスト ----

describe("vcRecruitButtonHandler / teardown confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findSetupByPanelChannelIdMock.mockResolvedValue(null);
    removeSetupMock.mockResolvedValue(undefined);
  });

  // セッションが失効していた場合はエフェメラルエラーを返す
  it("replies with error when session is expired", async () => {
    const { safeReply } = await import("@/bot/utils/interaction");
    getTeardownConfirmSessionMock.mockReturnValue(null);

    const interaction = makeInteraction();
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(removeSetupMock).not.toHaveBeenCalled();
  });

  // DB にレコードがない場合はそのエントリをスキップする
  it("skips entry when setup is not found in DB", async () => {
    getTeardownConfirmSessionMock.mockReturnValue({
      guildId: GUILD_ID,
      selectedSetups: [
        { panelChannelId: PANEL_CHANNEL_ID, categoryLabel: "TOP" },
      ],
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(null);

    const interaction = makeInteraction();
    await vcRecruitButtonHandler.execute(interaction as never);

    expect(removeSetupMock).not.toHaveBeenCalled();
  });

  // removeSetup が channel.delete より先に呼ばれる（DB 削除が最初）
  it("calls removeSetup BEFORE channel.delete (DB-first ordering)", async () => {
    getTeardownConfirmSessionMock.mockReturnValue({
      guildId: GUILD_ID,
      selectedSetups: [
        { panelChannelId: PANEL_CHANNEL_ID, categoryLabel: "TOP" },
      ],
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    // 呼び出し順序を記録する
    const callOrder: string[] = [];
    removeSetupMock.mockImplementation(async () => {
      callOrder.push("removeSetup");
    });

    const panelChDelete = vi.fn().mockImplementation(async () => {
      callOrder.push("panelChannel.delete");
    });
    const postChDelete = vi.fn().mockImplementation(async () => {
      callOrder.push("postChannel.delete");
    });

    const interaction = {
      ...makeInteraction(),
      guild: {
        id: GUILD_ID,
        channels: {
          fetch: vi.fn(async (id: string) => {
            if (id === PANEL_CHANNEL_ID)
              return { id: PANEL_CHANNEL_ID, delete: panelChDelete };
            if (id === POST_CHANNEL_ID)
              return { id: POST_CHANNEL_ID, delete: postChDelete };
            return null;
          }),
          cache: {
            get: vi.fn().mockReturnValue(null), // メッセージ削除はスキップ
          },
        },
      },
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
    };

    await vcRecruitButtonHandler.execute(interaction as never);

    expect(callOrder[0]).toBe("removeSetup");
    expect(callOrder).toContain("panelChannel.delete");
    expect(callOrder).toContain("postChannel.delete");
    expect(callOrder.indexOf("removeSetup")).toBeLessThan(
      callOrder.indexOf("panelChannel.delete"),
    );
    expect(callOrder.indexOf("removeSetup")).toBeLessThan(
      callOrder.indexOf("postChannel.delete"),
    );
  });

  // チャンネルが既に削除されている場合もエラーにならず成功する
  it("succeeds gracefully when channels are already deleted", async () => {
    getTeardownConfirmSessionMock.mockReturnValue({
      guildId: GUILD_ID,
      selectedSetups: [
        { panelChannelId: PANEL_CHANNEL_ID, categoryLabel: "TOP" },
      ],
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    const interaction = {
      ...makeInteraction(),
      guild: {
        id: GUILD_ID,
        channels: {
          fetch: vi.fn().mockResolvedValue(null), // 全チャンネルが見つからない
          cache: { get: vi.fn().mockReturnValue(null) },
        },
      },
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
    };

    await vcRecruitButtonHandler.execute(interaction as never);

    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, PANEL_CHANNEL_ID);
    expect(interaction.editReply).toHaveBeenCalled();
  });

  // UnknownChannel DiscordAPIError は吸収されて成功扱いになる（冪等性）
  it("absorbs UnknownChannel DiscordAPIError and treats as success", async () => {
    getTeardownConfirmSessionMock.mockReturnValue({
      guildId: GUILD_ID,
      selectedSetups: [
        { panelChannelId: PANEL_CHANNEL_ID, categoryLabel: "TOP" },
      ],
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    // fetch は成功するが delete() が UnknownChannel エラー
    const throwingDelete = vi.fn().mockRejectedValue(makeUnknownChannelError());

    const interaction = {
      ...makeInteraction(),
      guild: {
        id: GUILD_ID,
        channels: {
          fetch: vi
            .fn()
            .mockResolvedValue({ id: "ch", delete: throwingDelete }),
          cache: { get: vi.fn().mockReturnValue(null) },
        },
      },
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      vcRecruitButtonHandler.execute(interaction as never),
    ).resolves.toBeUndefined();

    expect(throwingDelete).toHaveBeenCalled();
    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, PANEL_CHANNEL_ID);
    // エラーが吸収されたので errorLines はなく、メインが successLines に入る
    const editArg = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { embeds: Array<{ success: string }> };
    expect(editArg.embeds[0].success).not.toContain("teardown_partial_error");
  });

  // UnknownChannel 以外のエラー（Missing Permissions 等）は再 throw され errorLines に入る
  it("reports to errorLines when non-UnknownChannel error thrown from delete()", async () => {
    getTeardownConfirmSessionMock.mockReturnValue({
      guildId: GUILD_ID,
      selectedSetups: [
        { panelChannelId: PANEL_CHANNEL_ID, categoryLabel: "TOP" },
      ],
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    // fetch は成功するが delete() が Missing Permissions エラー（普通の Error）
    const throwingDelete = vi
      .fn()
      .mockRejectedValue(new Error("Missing Permissions"));

    const interaction = {
      ...makeInteraction(),
      guild: {
        id: GUILD_ID,
        channels: {
          fetch: vi
            .fn()
            .mockResolvedValue({ id: "ch", delete: throwingDelete }),
          cache: { get: vi.fn().mockReturnValue(null) },
        },
      },
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      vcRecruitButtonHandler.execute(interaction as never),
    ).resolves.toBeUndefined();

    expect(throwingDelete).toHaveBeenCalled();
    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, PANEL_CHANNEL_ID);
    // エラーが errorLines に入ったので partial_error ヘッダーが含まれる
    const editArg = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { embeds: Array<{ success: string }> };
    expect(editArg.embeds[0].success).toContain("teardown_partial_error");
    expect(editArg.embeds[0].success).toContain("Missing Permissions");
  });

  // 複数セットアップの一部が失敗しても残りは処理されエラー報告される
  it("processes all entries even when one fails, and reports partial errors", async () => {
    getTeardownConfirmSessionMock.mockReturnValue({
      guildId: GUILD_ID,
      selectedSetups: [
        { panelChannelId: "panel-a", categoryLabel: "カテゴリーA" },
        { panelChannelId: "panel-b", categoryLabel: "カテゴリーB" },
      ],
    });

    findSetupByPanelChannelIdMock
      .mockResolvedValueOnce(
        makeSetup({ panelChannelId: "panel-a", postChannelId: "post-a" }),
      )
      .mockResolvedValueOnce(
        makeSetup({ panelChannelId: "panel-b", postChannelId: "post-b" }),
      );

    // 最初のエントリは removeSetup でエラー
    removeSetupMock
      .mockRejectedValueOnce(new Error("DB error"))
      .mockResolvedValueOnce(undefined);

    const interaction = {
      ...makeInteraction(),
      guild: {
        id: GUILD_ID,
        channels: {
          fetch: vi.fn().mockResolvedValue(null),
          cache: { get: vi.fn().mockReturnValue(null) },
        },
      },
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
    };

    await vcRecruitButtonHandler.execute(interaction as never);

    // 両エントリが処理された（2回 findSetupByPanelChannelId が呼ばれた）
    expect(findSetupByPanelChannelIdMock).toHaveBeenCalledTimes(2);
    expect(interaction.editReply).toHaveBeenCalled();
  });

  // postChannel 削除時に UnknownChannel 以外のエラーが throw され errorLines に入る
  it("reports to errorLines when non-UnknownChannel error thrown from postChannel delete()", async () => {
    getTeardownConfirmSessionMock.mockReturnValue({
      guildId: GUILD_ID,
      selectedSetups: [
        { panelChannelId: PANEL_CHANNEL_ID, categoryLabel: "TOP" },
      ],
    });
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());

    // postChannel の delete のみ Missing Permissions で失敗させる
    const throwingDelete = vi
      .fn()
      .mockRejectedValue(new Error("Missing Permissions"));
    const panelCh = makeGuildChannel(); // 正常に削除
    const postCh = makeGuildChannel(throwingDelete); // 削除失敗

    const interaction = {
      ...makeInteraction(),
      guild: {
        id: GUILD_ID,
        channels: {
          fetch: vi.fn(async (id: string) => {
            if (id === PANEL_CHANNEL_ID) return panelCh;
            if (id === POST_CHANNEL_ID) return postCh;
            return null;
          }),
          cache: { get: vi.fn().mockReturnValue(null) },
        },
      },
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      vcRecruitButtonHandler.execute(interaction as never),
    ).resolves.toBeUndefined();

    expect(throwingDelete).toHaveBeenCalled();
    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, PANEL_CHANNEL_ID);
    // postChannel のエラーが errorLines に入り partial_error ヘッダーが含まれる
    const editArg = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { embeds: Array<{ success: string }> };
    expect(editArg.embeds[0].success).toContain("teardown_partial_error");
    expect(editArg.embeds[0].success).toContain("Missing Permissions");
  });
});

describe("vcRecruitButtonHandler / teardown cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CANCEL ボタン → セッション削除してキャンセル成功 embed を表示する
  it("deletes session and updates with success embed", async () => {
    const interaction = {
      customId: `vc-recruit-teardown-cancel:${SELECT_INTERACTION_ID}`,
      guild: { id: GUILD_ID },
      update: vi.fn().mockResolvedValue(undefined),
      deferUpdate: vi.fn(),
      editReply: vi.fn(),
    };

    await vcRecruitButtonHandler.execute(interaction as never);

    expect(deleteTeardownConfirmSessionMock).toHaveBeenCalledWith(
      SELECT_INTERACTION_ID,
    );
    expect(interaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ components: [] }),
    );
  });

  // guild が null の場合は早期リターン
  it("does nothing when guild is null", async () => {
    const interaction = {
      customId: `vc-recruit-teardown-cancel:${SELECT_INTERACTION_ID}`,
      guild: null,
      update: vi.fn(),
    };

    await vcRecruitButtonHandler.execute(interaction as never);

    expect(interaction.update).not.toHaveBeenCalled();
  });
});

describe("vcRecruitButtonHandler / teardown redo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // REDO ボタン → セッション削除して teardown セレクトメニューを再表示する
  it("deletes session and re-shows teardown select menu", async () => {
    const interaction = {
      customId: `vc-recruit-teardown-redo:${SELECT_INTERACTION_ID}`,
      guild: { id: GUILD_ID },
      id: "new-interaction-1",
      update: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      deferUpdate: vi.fn(),
    };

    await vcRecruitButtonHandler.execute(interaction as never);

    expect(deleteTeardownConfirmSessionMock).toHaveBeenCalledWith(
      SELECT_INTERACTION_ID,
    );
    expect(interaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ components: expect.any(Array) }),
    );
  });

  // REDO 60秒後にセレクトメニューが無効化される（setTimeout + editReply）
  it("disables select menu after 60 seconds", async () => {
    vi.useFakeTimers();
    const interaction = {
      customId: `vc-recruit-teardown-redo:${SELECT_INTERACTION_ID}`,
      guild: { id: GUILD_ID },
      id: "new-interaction-2",
      update: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      deferUpdate: vi.fn(),
    };

    await vcRecruitButtonHandler.execute(interaction as never);
    await vi.runAllTimersAsync();

    expect(interaction.editReply).toHaveBeenCalled();
    vi.useRealTimers();
  });

  // editReply が throw しても（トークン失効）エラーにならない
  it("does not throw when editReply fails after timeout", async () => {
    vi.useFakeTimers();
    const interaction = {
      customId: `vc-recruit-teardown-redo:${SELECT_INTERACTION_ID}`,
      guild: { id: GUILD_ID },
      id: "new-interaction-3",
      update: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockRejectedValue(new Error("InteractionExpired")),
      deferUpdate: vi.fn(),
    };

    await vcRecruitButtonHandler.execute(interaction as never);
    // setTimeout のコールバックを実行。editReply が失敗しても .catch(() => null) で吸収される
    await vi.runAllTimersAsync();

    expect(interaction.editReply).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
