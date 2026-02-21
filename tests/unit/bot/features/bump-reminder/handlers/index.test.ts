describe("bot/features/bump-reminder/handlers/index", () => {
  it("re-exports handler functions", async () => {
    const indexModule = await import("@/bot/features/bump-reminder/handlers");
    const messageCreateModule =
      await import("@/bot/features/bump-reminder/handlers/bumpMessageCreateHandler");
    const reminderModule =
      await import("@/bot/features/bump-reminder/handlers/bumpReminderHandler");
    const startupModule =
      await import("@/bot/features/bump-reminder/handlers/bumpReminderStartup");

    expect(indexModule.handleBumpMessageCreate).toBe(
      messageCreateModule.handleBumpMessageCreate,
    );
    expect(indexModule.handleBumpDetected).toBe(
      reminderModule.handleBumpDetected,
    );
    expect(indexModule.sendBumpPanel).toBe(reminderModule.sendBumpPanel);
    expect(indexModule.sendBumpReminder).toBe(reminderModule.sendBumpReminder);
    expect(indexModule.restoreBumpRemindersOnStartup).toBe(
      startupModule.restoreBumpRemindersOnStartup,
    );
  });
});
