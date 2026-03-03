// tests/unit/bot/features/vc-recruit/handlers/ui/vcRecruitTeardownState.test.ts
import {
  deleteTeardownConfirmSession,
  getTeardownConfirmSession,
  setTeardownConfirmSession,
  type TeardownConfirmSession,
} from "@/bot/features/vc-recruit/handlers/ui/vcRecruitTeardownState";

const GUILD_ID = "guild-1";

const makeSession = (): TeardownConfirmSession => ({
  guildId: GUILD_ID,
  selectedSetups: [
    { panelChannelId: "panel-ch-1", categoryLabel: "ゲームカテゴリー" },
    { panelChannelId: "panel-ch-2", categoryLabel: "TOP（カテゴリーなし）" },
  ],
});

describe("bot/features/vc-recruit/handlers/ui/vcRecruitTeardownState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // セッションを保存して取得できることを確認
  it("stores and retrieves a session", () => {
    const session = makeSession();
    setTeardownConfirmSession("sel-id-1", session);
    expect(getTeardownConfirmSession("sel-id-1")).toEqual(session);
  });

  // 存在しないキーを取得すると null を返す
  it("returns null for unknown key", () => {
    expect(getTeardownConfirmSession("nonexistent")).toBeNull();
  });

  // deleteTeardownConfirmSession でセッションを削除できる
  it("deletes a session", () => {
    setTeardownConfirmSession("sel-id-2", makeSession());
    deleteTeardownConfirmSession("sel-id-2");
    expect(getTeardownConfirmSession("sel-id-2")).toBeNull();
  });

  // 60秒後にセッションが自動的に削除される
  it("auto-expires session after 60 seconds", () => {
    setTeardownConfirmSession("sel-id-3", makeSession());
    expect(getTeardownConfirmSession("sel-id-3")).not.toBeNull();

    vi.advanceTimersByTime(60_000);
    expect(getTeardownConfirmSession("sel-id-3")).toBeNull();
  });
});
