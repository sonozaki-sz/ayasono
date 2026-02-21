describe("shared/database/repositories/persistence/guildConfigWritePersistence", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/repositories/persistence/guildConfigWritePersistence");
    expect(module).toBeDefined();
  });
});
