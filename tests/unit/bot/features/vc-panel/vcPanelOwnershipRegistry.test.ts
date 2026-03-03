// tests/unit/bot/features/vc-panel/vcPanelOwnershipRegistry.test.ts

// vcPanelOwnershipRegistry はモジュールレベルの配列を持つため、
// テスト間の状態分離のために resetModules + 動的インポートを使用する

describe("bot/features/vc-panel/vcPanelOwnershipRegistry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // チェッカーが未登録の場合は false を返す
  it("returns false when no checkers are registered", async () => {
    const { isVcPanelManagedChannel } =
      await import("@/bot/features/vc-panel/vcPanelOwnershipRegistry");
    await expect(isVcPanelManagedChannel("guild-1", "ch-1")).resolves.toBe(
      false,
    );
  });

  // 登録済みチェッカーが true を返す場合は true を返す
  it("returns true when a registered checker returns true", async () => {
    const { registerVcPanelOwnershipChecker, isVcPanelManagedChannel } =
      await import("@/bot/features/vc-panel/vcPanelOwnershipRegistry");

    registerVcPanelOwnershipChecker({
      isManagedVcPanelChannel: async () => true,
    });

    await expect(isVcPanelManagedChannel("guild-1", "ch-1")).resolves.toBe(
      true,
    );
  });

  // 登録済みチェッカーが全て false を返す場合は false を返す
  it("returns false when all registered checkers return false", async () => {
    const { registerVcPanelOwnershipChecker, isVcPanelManagedChannel } =
      await import("@/bot/features/vc-panel/vcPanelOwnershipRegistry");

    registerVcPanelOwnershipChecker({
      isManagedVcPanelChannel: async () => false,
    });
    registerVcPanelOwnershipChecker({
      isManagedVcPanelChannel: async () => false,
    });

    await expect(isVcPanelManagedChannel("guild-1", "ch-1")).resolves.toBe(
      false,
    );
  });

  // 複数チェッカーのうち1つでも true を返したら即 true（短絡評価）
  it("returns true as soon as the first checker returns true", async () => {
    const { registerVcPanelOwnershipChecker, isVcPanelManagedChannel } =
      await import("@/bot/features/vc-panel/vcPanelOwnershipRegistry");

    const secondChecker = {
      isManagedVcPanelChannel: vi.fn().mockResolvedValue(false),
    };

    registerVcPanelOwnershipChecker({
      isManagedVcPanelChannel: async () => true,
    });
    registerVcPanelOwnershipChecker(secondChecker);

    await expect(isVcPanelManagedChannel("guild-1", "ch-1")).resolves.toBe(
      true,
    );

    // 最初のチェッカーが true を返したので、2番目は呼ばれない
    expect(secondChecker.isManagedVcPanelChannel).not.toHaveBeenCalled();
  });

  // guildId と channelId が正しくチェッカーに渡される
  it("passes guildId and channelId to checkers", async () => {
    const { registerVcPanelOwnershipChecker, isVcPanelManagedChannel } =
      await import("@/bot/features/vc-panel/vcPanelOwnershipRegistry");

    const checker = {
      isManagedVcPanelChannel: vi.fn().mockResolvedValue(false),
    };
    registerVcPanelOwnershipChecker(checker);

    await isVcPanelManagedChannel("guild-42", "ch-999");

    expect(checker.isManagedVcPanelChannel).toHaveBeenCalledWith(
      "guild-42",
      "ch-999",
    );
  });
});
