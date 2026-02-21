describe("shared/database/repositories/persistence/guildConfigReadPersistence", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/repositories/persistence/guildConfigReadPersistence");
    expect(module).toBeDefined();
  });
});
