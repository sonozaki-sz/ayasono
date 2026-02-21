describe("bot/features/afk/index", () => {
  it("re-exports afk feature executors", async () => {
    const indexModule = await import("@/bot/features/afk");
    const afkModule =
      await import("@/bot/features/afk/commands/afkCommand.execute");
    const configModule =
      await import("@/bot/features/afk/commands/afkConfigCommand.execute");

    expect(indexModule.executeAfkCommand).toBe(afkModule.executeAfkCommand);
    expect(indexModule.executeAfkConfigCommand).toBe(
      configModule.executeAfkConfigCommand,
    );
  });
});
