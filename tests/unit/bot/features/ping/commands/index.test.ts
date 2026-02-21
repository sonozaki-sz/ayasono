describe("bot/features/ping/commands/index", () => {
  it("re-exports executePingCommand", async () => {
    const indexModule = await import("@/bot/features/ping/commands");
    const commandModule =
      await import("@/bot/features/ping/commands/pingCommand.execute");

    expect(indexModule.executePingCommand).toBe(
      commandModule.executePingCommand,
    );
  });
});
