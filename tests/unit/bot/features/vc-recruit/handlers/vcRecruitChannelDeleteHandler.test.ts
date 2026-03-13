// tests/unit/bot/features/vc-recruit/handlers/vcRecruitChannelDeleteHandler.test.ts
import { handleVcRecruitChannelDelete } from "@/bot/features/vc-recruit/handlers/vcRecruitChannelDeleteHandler";
import { logger } from "@/shared/utils/logger";
import { ChannelType } from "discord.js";

// ---- モック定義 ----

const findSetupByPanelChannelIdMock = vi.fn();
const findSetupByPostChannelIdMock = vi.fn();
const removeSetupMock = vi.fn();

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotVcRecruitRepository: () => ({
    findSetupByPanelChannelId: (...args: unknown[]) =>
      findSetupByPanelChannelIdMock(...args),
    findSetupByPostChannelId: (...args: unknown[]) =>
      findSetupByPostChannelIdMock(...args),
    removeSetup: (...args: unknown[]) => removeSetupMock(...args),
  }),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---- ヘルパー ----

const GUILD_ID = "guild-1";

/** テキストチャンネルのモックを作成 */
function makeGuildChannel(
  id: string,
  opts: {
    fetchResult?: { delete?: ReturnType<typeof vi.fn> } | null;
  } = {},
) {
  const fetchResult =
    opts.fetchResult === undefined
      ? { delete: vi.fn().mockResolvedValue(undefined) }
      : opts.fetchResult;

  return {
    id,
    guildId: GUILD_ID,
    type: ChannelType.GuildText,
    isDMBased: () => false,
    guild: {
      channels: {
        fetch: vi.fn().mockResolvedValue(fetchResult),
      },
    },
  };
}

/** DM チャンネルのモックを作成 */
function makeDMChannel() {
  return {
    id: "dm-1",
    type: ChannelType.DM,
    isDMBased: () => true,
  };
}

// VC募集 channelDelete ハンドラーの動作を検証
describe("bot/features/vc-recruit/handlers/vcRecruitChannelDeleteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findSetupByPanelChannelIdMock.mockResolvedValue(null);
    findSetupByPostChannelIdMock.mockResolvedValue(null);
    removeSetupMock.mockResolvedValue(undefined);
  });

  // DM チャンネルは対象外（リポジトリを呼ばない）
  it("skips DM-based channels", async () => {
    const channel = makeDMChannel();
    await handleVcRecruitChannelDelete(channel as never);

    expect(findSetupByPanelChannelIdMock).not.toHaveBeenCalled();
    expect(findSetupByPostChannelIdMock).not.toHaveBeenCalled();
  });

  // 登録外のチャンネル（パネルでも投稿でもない）は何もしない
  it("does nothing when channel is not a setup channel", async () => {
    const channel = makeGuildChannel("unknown-ch");
    await handleVcRecruitChannelDelete(channel as never);

    expect(removeSetupMock).not.toHaveBeenCalled();
  });

  // パネルチャンネルが削除 → 投稿チャンネルを削除して DB も消す
  it("when panel channel deleted: deletes post channel and removes setup from DB", async () => {
    const setup = {
      panelChannelId: "panel-ch-1",
      postChannelId: "post-ch-1",
    };
    findSetupByPanelChannelIdMock.mockResolvedValue(setup);

    const deleteMock = vi.fn().mockResolvedValue(undefined);
    const channel = makeGuildChannel("panel-ch-1", {
      fetchResult: { delete: deleteMock },
    });

    await handleVcRecruitChannelDelete(channel as never);

    expect(findSetupByPanelChannelIdMock).toHaveBeenCalledWith(
      GUILD_ID,
      "panel-ch-1",
    );
    expect(channel.guild.channels.fetch).toHaveBeenCalledWith("post-ch-1");
    expect(deleteMock).toHaveBeenCalled();
    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, "panel-ch-1");
    // 投稿チャンネルで findSetupByPostChannelId は呼ばれない（早期 return）
    expect(findSetupByPostChannelIdMock).not.toHaveBeenCalled();
  });

  // 投稿チャンネルが削除 → パネルチャンネルを削除して DB も消す
  it("when post channel deleted: deletes panel channel and removes setup from DB", async () => {
    const setup = {
      panelChannelId: "panel-ch-2",
      postChannelId: "post-ch-2",
    };
    findSetupByPostChannelIdMock.mockResolvedValue(setup);

    const deleteMock = vi.fn().mockResolvedValue(undefined);
    const channel = makeGuildChannel("post-ch-2", {
      fetchResult: { delete: deleteMock },
    });

    await handleVcRecruitChannelDelete(channel as never);

    expect(findSetupByPanelChannelIdMock).toHaveBeenCalledWith(
      GUILD_ID,
      "post-ch-2",
    );
    expect(findSetupByPostChannelIdMock).toHaveBeenCalledWith(
      GUILD_ID,
      "post-ch-2",
    );
    expect(channel.guild.channels.fetch).toHaveBeenCalledWith("panel-ch-2");
    expect(deleteMock).toHaveBeenCalled();
    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, "panel-ch-2");
  });

  // ペアのチャンネルが既に消えていても（fetch null）エラーにならない
  it("gracefully handles missing paired channel on panel delete", async () => {
    const setup = {
      panelChannelId: "panel-ch-3",
      postChannelId: "post-ch-3",
    };
    findSetupByPanelChannelIdMock.mockResolvedValue(setup);

    const channel = makeGuildChannel("panel-ch-3", { fetchResult: null });

    await expect(
      handleVcRecruitChannelDelete(channel as never),
    ).resolves.toBeUndefined();

    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, "panel-ch-3");
  });

  // ペアのチャンネルが既に消えていても（fetch null）エラーにならない（投稿側）
  it("gracefully handles missing paired channel on post delete", async () => {
    const setup = {
      panelChannelId: "panel-ch-4",
      postChannelId: "post-ch-4",
    };
    findSetupByPostChannelIdMock.mockResolvedValue(setup);

    const channel = makeGuildChannel("post-ch-4", { fetchResult: null });

    await expect(
      handleVcRecruitChannelDelete(channel as never),
    ).resolves.toBeUndefined();

    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, "panel-ch-4");
  });

  // ペアのチャンネルが fetch できても delete() が throw した場合に logger.error を出力する（パネル側）
  it("succeeds gracefully when post channel delete() throws on panel delete", async () => {
    const setup = {
      panelChannelId: "panel-ch-5",
      postChannelId: "post-ch-5",
    };
    findSetupByPanelChannelIdMock.mockResolvedValue(setup);

    // fetch は成功するが delete() が throw
    const throwingDelete = vi.fn().mockRejectedValue(new Error("DiscordAPIError: Missing Permissions"));
    const channel = makeGuildChannel("panel-ch-5", {
      fetchResult: { delete: throwingDelete },
    });

    await expect(
      handleVcRecruitChannelDelete(channel as never),
    ).resolves.toBeUndefined();

    expect(throwingDelete).toHaveBeenCalled();
    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, "panel-ch-5");
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("投稿チャンネル削除失敗"),
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  // ペアのチャンネルが fetch できても delete() が throw した場合に logger.error を出力する（投稿側）
  it("succeeds gracefully when panel channel delete() throws on post delete", async () => {
    const setup = {
      panelChannelId: "panel-ch-6",
      postChannelId: "post-ch-6",
    };
    findSetupByPostChannelIdMock.mockResolvedValue(setup);

    const throwingDelete = vi.fn().mockRejectedValue(new Error("DiscordAPIError: Missing Permissions"));
    const channel = makeGuildChannel("post-ch-6", {
      fetchResult: { delete: throwingDelete },
    });

    await expect(
      handleVcRecruitChannelDelete(channel as never),
    ).resolves.toBeUndefined();

    expect(throwingDelete).toHaveBeenCalled();
    expect(removeSetupMock).toHaveBeenCalledWith(GUILD_ID, "panel-ch-6");
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("パネルチャンネル削除失敗"),
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
