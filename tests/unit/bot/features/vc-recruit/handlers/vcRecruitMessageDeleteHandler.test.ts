// tests/unit/bot/features/vc-recruit/handlers/vcRecruitMessageDeleteHandler.test.ts
import { handleVcRecruitMessageDelete } from "@/bot/features/vc-recruit/handlers/vcRecruitMessageDeleteHandler";

// ---- モック定義 ----

const findSetupByPanelChannelIdMock = vi.fn();
const updatePanelMessageIdMock = vi.fn();

vi.mock("@/bot/services/botVcRecruitDependencyResolver", () => ({
  getBotVcRecruitRepository: () => ({
    findSetupByPanelChannelId: (...args: unknown[]) =>
      findSetupByPanelChannelIdMock(...args),
    updatePanelMessageId: (...args: unknown[]) =>
      updatePanelMessageIdMock(...args),
  }),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(async (_guildId: string, key: string) => key),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: vi.fn(() => ({ title: "panel" })),
}));

// ---- ヘルパー ----

const GUILD_ID = "guild-1";
const PANEL_CHANNEL_ID = "panel-ch-1";
const OLD_MSG_ID = "old-msg-1";
const NEW_MSG_ID = "new-msg-2";

function makeSetup() {
  return {
    panelChannelId: PANEL_CHANNEL_ID,
    postChannelId: "post-ch-1",
    panelMessageId: OLD_MSG_ID,
  };
}

function makeSendablePanelChannel() {
  return {
    id: PANEL_CHANNEL_ID,
    isSendable: () => true,
    send: vi.fn().mockResolvedValue({ id: NEW_MSG_ID }),
  };
}

function makeMessage(
  overrides?: Partial<{
    guildId: string | null;
    channelId: string | null;
    id: string;
    guild: unknown;
  }>,
) {
  return {
    id: OLD_MSG_ID,
    guildId: GUILD_ID,
    channelId: PANEL_CHANNEL_ID,
    guild: {
      channels: {
        fetch: vi.fn().mockResolvedValue(makeSendablePanelChannel()),
      },
    },
    ...overrides,
  };
}

// VC募集 messageDelete ハンドラーの動作を検証
describe("bot/features/vc-recruit/handlers/vcRecruitMessageDeleteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findSetupByPanelChannelIdMock.mockResolvedValue(null);
    updatePanelMessageIdMock.mockResolvedValue(undefined);
  });

  // guildId がない（DM）はスキップ
  it("skips messages without guildId", async () => {
    const msg = makeMessage({ guildId: null });
    await handleVcRecruitMessageDelete(msg as never);

    expect(findSetupByPanelChannelIdMock).not.toHaveBeenCalled();
  });

  // channelId がない場合はスキップ
  it("skips messages without channelId", async () => {
    const msg = makeMessage({ channelId: null });
    await handleVcRecruitMessageDelete(msg as never);

    expect(findSetupByPanelChannelIdMock).not.toHaveBeenCalled();
  });

  // guild が null の PartialMessage はスキップ（キャッシュなし）
  it("skips when guild is null (partial message not in cache)", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());
    const msg = makeMessage({ guild: null });

    await handleVcRecruitMessageDelete(msg as never);

    expect(updatePanelMessageIdMock).not.toHaveBeenCalled();
  });

  // パネルチャンネル登録外のチャンネルのメッセージは何もしない
  it("does nothing when channel is not a panel channel", async () => {
    const msg = makeMessage();
    // findSetupByPanelChannelId が null を返す（デフォルト）

    await handleVcRecruitMessageDelete(msg as never);

    expect(updatePanelMessageIdMock).not.toHaveBeenCalled();
  });

  // パネルチャンネルのメッセージだが panelMessageId と一致しない（別メッセージ削除）
  it("does nothing when deleted message is not the stored panelMessageId", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());
    const msg = makeMessage({ id: "other-msg-99" });

    await handleVcRecruitMessageDelete(msg as never);

    expect(updatePanelMessageIdMock).not.toHaveBeenCalled();
  });

  // パネルメッセージが削除された → 再送信して DB 更新
  it("resends panel message and updates DB when panelMessageId is deleted", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());
    const panelChannel = makeSendablePanelChannel();
    const msg = makeMessage({
      guild: {
        channels: {
          fetch: vi.fn().mockResolvedValue(panelChannel),
        },
      },
    });

    await handleVcRecruitMessageDelete(msg as never);

    expect(panelChannel.send).toHaveBeenCalled();
    expect(updatePanelMessageIdMock).toHaveBeenCalledWith(
      GUILD_ID,
      PANEL_CHANNEL_ID,
      NEW_MSG_ID,
    );
  });

  // チャンネル fetch 失敗（削除済みなど）でもエラーにならない
  it("gracefully handles fetch failure for panel channel", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());
    const msg = makeMessage({
      guild: {
        channels: {
          fetch: vi.fn().mockResolvedValue(null),
        },
      },
    });

    await expect(
      handleVcRecruitMessageDelete(msg as never),
    ).resolves.toBeUndefined();

    expect(updatePanelMessageIdMock).not.toHaveBeenCalled();
  });

  // send 失敗でもエラーにならない
  it("gracefully handles send failure", async () => {
    findSetupByPanelChannelIdMock.mockResolvedValue(makeSetup());
    const panelChannel = {
      ...makeSendablePanelChannel(),
      send: vi.fn().mockResolvedValue(null),
    };
    const msg = makeMessage({
      guild: {
        channels: {
          fetch: vi.fn().mockResolvedValue(panelChannel),
        },
      },
    });

    await expect(
      handleVcRecruitMessageDelete(msg as never),
    ).resolves.toBeUndefined();

    expect(updatePanelMessageIdMock).not.toHaveBeenCalled();
  });
});
