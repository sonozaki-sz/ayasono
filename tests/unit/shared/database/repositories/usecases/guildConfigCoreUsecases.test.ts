describe("shared/database/repositories/usecases/guildConfigCoreUsecases", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/repositories/usecases/guildConfigCoreUsecases");
    expect(module).toBeDefined();
  });
});
