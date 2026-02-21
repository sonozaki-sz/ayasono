describe("bot/features/bump-reminder/constants/index", () => {
  it("re-exports core constants and helpers", async () => {
    const indexModule = await import("@/bot/features/bump-reminder/constants");
    const rawModule =
      await import("@/bot/features/bump-reminder/constants/bumpReminderConstants");

    expect(indexModule.BUMP_CONSTANTS).toBe(rawModule.BUMP_CONSTANTS);
    expect(indexModule.BUMP_SERVICES).toBe(rawModule.BUMP_SERVICES);
    expect(indexModule.resolveBumpService).toBe(rawModule.resolveBumpService);
    expect(indexModule.toBumpReminderJobId).toBe(rawModule.toBumpReminderJobId);
  });
});
