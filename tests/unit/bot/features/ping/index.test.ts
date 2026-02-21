describe("bot/features/ping/index", () => {
  it("re-exports ping feature executor", async () => {
    const indexModule = await import("@/bot/features/ping");
    const commandModule =
      await import("@/bot/features/ping/commands/pingCommand.execute");

    expect(indexModule.executePingCommand).toBe(
      commandModule.executePingCommand,
    );
  });
});
