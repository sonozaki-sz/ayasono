describe("bot/features/bump-reminder/commands/index", () => {
  it("re-exports command definitions", async () => {
    const indexModule = await import("@/bot/features/bump-reminder/commands");
    const constantsModule =
      await import("@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.constants");
    const executeModule =
      await import("@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.execute");

    expect(indexModule.BUMP_REMINDER_CONFIG_COMMAND).toBe(
      constantsModule.BUMP_REMINDER_CONFIG_COMMAND,
    );
    expect(indexModule.executeBumpReminderConfigCommand).toBe(
      executeModule.executeBumpReminderConfigCommand,
    );
  });
});
