describe("bot/features/bump-reminder/repositories/index", () => {
  it("re-exports repository constructors", async () => {
    const indexModule =
      await import("@/bot/features/bump-reminder/repositories");
    const repoModule =
      await import("@/bot/features/bump-reminder/repositories/bumpReminderRepository");

    expect(indexModule.BumpReminderRepository).toBe(
      repoModule.BumpReminderRepository,
    );
    expect(indexModule.createBumpReminderRepository).toBe(
      repoModule.createBumpReminderRepository,
    );
    expect(indexModule.getBumpReminderRepository).toBe(
      repoModule.getBumpReminderRepository,
    );
  });
});
