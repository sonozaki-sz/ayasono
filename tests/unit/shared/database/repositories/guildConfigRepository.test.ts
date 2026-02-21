describe("shared/database/repositories/guildConfigRepository", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/repositories/guildConfigRepository");
    expect(module).toBeDefined();
  });
});
