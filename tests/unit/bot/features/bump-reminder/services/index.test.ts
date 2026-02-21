describe("bot/features/bump-reminder/services/index", () => {
  it("re-exports config resolver and manager", async () => {
    const indexModule = await import("@/bot/features/bump-reminder/services");
    const resolverModule =
      await import("@/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver");
    const managerModule =
      await import("@/bot/features/bump-reminder/services/bumpReminderService");

    expect(indexModule.createBumpReminderFeatureConfigService).toBe(
      resolverModule.createBumpReminderFeatureConfigService,
    );
    expect(indexModule.getBumpReminderFeatureConfigService).toBe(
      resolverModule.getBumpReminderFeatureConfigService,
    );
    expect(indexModule.BumpReminderManager).toBe(
      managerModule.BumpReminderManager,
    );
    expect(indexModule.getBumpReminderManager).toBe(
      managerModule.getBumpReminderManager,
    );
  });
});
