// tests/unit/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler.test.ts

import { handleStickyMessageChannelDelete } from "@/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler";
import { ChannelType } from "discord.js";

const { cancelTimerMock, deleteByChannelMock, debugMock } = vi.hoisted(() => ({
  cancelTimerMock: vi.fn(),
  deleteByChannelMock: vi.fn(),
  debugMock: vi.fn(),
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotStickyMessageResendService: vi.fn(() => ({
    cancelTimer: cancelTimerMock,
  })),
  getBotStickyMessageConfigService: vi.fn(() => ({
    deleteByChannel: deleteByChannelMock,
  })),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { debug: debugMock, error: vi.fn() },
}));

describe("bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels timer and deletes DB record for GuildText channel", async () => {
    deleteByChannelMock.mockResolvedValue(0);
    const channel = { id: "ch-1", type: ChannelType.GuildText };

    await handleStickyMessageChannelDelete(channel as never);

    expect(cancelTimerMock).toHaveBeenCalledWith("ch-1");
    expect(deleteByChannelMock).toHaveBeenCalledWith("ch-1");
  });

  it("logs debug when a record was actually deleted", async () => {
    deleteByChannelMock.mockResolvedValue(1);
    const channel = { id: "ch-1", type: ChannelType.GuildText };

    await handleStickyMessageChannelDelete(channel as never);

    expect(debugMock).toHaveBeenCalledTimes(1);
  });

  it("does not log when no record was deleted", async () => {
    deleteByChannelMock.mockResolvedValue(0);
    const channel = { id: "ch-1", type: ChannelType.GuildText };

    await handleStickyMessageChannelDelete(channel as never);

    expect(debugMock).not.toHaveBeenCalled();
  });

  it("skips non-text channels (e.g. GuildVoice)", async () => {
    const channel = { id: "vc-1", type: ChannelType.GuildVoice };

    await handleStickyMessageChannelDelete(channel as never);

    expect(cancelTimerMock).not.toHaveBeenCalled();
    expect(deleteByChannelMock).not.toHaveBeenCalled();
  });

  it("swallows DB errors without rethrowing", async () => {
    deleteByChannelMock.mockRejectedValueOnce(new Error("db error"));
    const channel = { id: "ch-2", type: ChannelType.GuildText };

    // エラーが外に伝播しないこと
    await expect(
      handleStickyMessageChannelDelete(channel as never),
    ).resolves.toBeUndefined();

    expect(cancelTimerMock).toHaveBeenCalledWith("ch-2");
  });
});
