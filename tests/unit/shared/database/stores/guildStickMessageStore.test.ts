describe("shared/database/stores/guildStickMessageStore", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/guildStickMessageStore");
    expect(module).toBeDefined();
  });
});
