describe("bot/features/bump-reminder/index", () => {
  it("re-exports constants/services/repositories", async () => {
    const indexModule = await import("@/bot/features/bump-reminder");
    const constantsModule =
      await import("@/bot/features/bump-reminder/constants");
    const servicesModule =
      await import("@/bot/features/bump-reminder/services");
    const repositoriesModule =
      await import("@/bot/features/bump-reminder/repositories");

    expect(indexModule.BUMP_SERVICES).toBe(constantsModule.BUMP_SERVICES);
    expect(indexModule.getBumpReminderManager).toBe(
      servicesModule.getBumpReminderManager,
    );
    expect(indexModule.getBumpReminderRepository).toBe(
      repositoriesModule.getBumpReminderRepository,
    );
  });
});
