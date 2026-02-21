describe("shared/database/repositories/serializers/guildConfigSerializer", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/repositories/serializers/guildConfigSerializer");
    expect(module).toBeDefined();
  });
});
