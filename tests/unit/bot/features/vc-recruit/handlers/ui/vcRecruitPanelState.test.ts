// tests/unit/bot/features/vc-recruit/handlers/ui/vcRecruitPanelState.test.ts
import {
  deleteVcRecruitSession,
  getVcRecruitSession,
  setVcRecruitSession,
  updateVcRecruitSession,
  type VcRecruitSession,
} from "@/bot/features/vc-recruit/handlers/ui/vcRecruitPanelState";

const makeSession = (
  overrides?: Partial<VcRecruitSession>,
): VcRecruitSession => ({
  panelChannelId: "panel-ch-1",
  mentionRoleId: null,
  selectedVcId: "__new__",
  createdAt: Date.now(),
  ...overrides,
});

describe("bot/features/vc-recruit/handlers/ui/vcRecruitPanelState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // セッションを保存して取得できることを確認
  it("stores and retrieves a session", () => {
    const session = makeSession();
    setVcRecruitSession("interaction-1", session);
    expect(getVcRecruitSession("interaction-1")).toEqual(session);
  });

  // 存在しないキーを取得すると null を返す
  it("returns null for unknown key", () => {
    expect(getVcRecruitSession("nonexistent")).toBeNull();
  });

  // deleteVcRecruitSession でセッションを削除できる
  it("deletes a session", () => {
    setVcRecruitSession("interaction-2", makeSession());
    deleteVcRecruitSession("interaction-2");
    expect(getVcRecruitSession("interaction-2")).toBeNull();
  });

  // updateVcRecruitSession でセッションを部分更新できる
  it("updates session fields partially", () => {
    setVcRecruitSession("interaction-3", makeSession());
    updateVcRecruitSession("interaction-3", { mentionRoleId: "role-1" });
    const updated = getVcRecruitSession("interaction-3");
    expect(updated?.mentionRoleId).toBe("role-1");
    expect(updated?.panelChannelId).toBe("panel-ch-1");
    expect(updated?.selectedVcId).toBe("__new__");
  });

  // 存在しないキーを更新しても何も起こらない
  it("does nothing when updating nonexistent session", () => {
    updateVcRecruitSession("nonexistent", { mentionRoleId: "role-1" });
    expect(getVcRecruitSession("nonexistent")).toBeNull();
  });

  // selectedVcId を更新できる
  it("updates selectedVcId in session", () => {
    setVcRecruitSession("interaction-5", makeSession());
    updateVcRecruitSession("interaction-5", { selectedVcId: "vc-123" });
    const updated = getVcRecruitSession("interaction-5");
    expect(updated?.selectedVcId).toBe("vc-123");
    expect(updated?.mentionRoleId).toBeNull();
  });

  // 15分後にセッションが自動的に削除される
  it("auto-expires session after 15 minutes", () => {
    setVcRecruitSession("interaction-6", makeSession());
    expect(getVcRecruitSession("interaction-6")).not.toBeNull();

    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(getVcRecruitSession("interaction-6")).toBeNull();
  });
});
