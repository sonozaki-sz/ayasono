describe("shared/database/stores/guildAfkConfigStore", () => {
  it("loads module", async () => {
    const module = await import("@/shared/database/stores/guildAfkConfigStore");
    expect(module).toBeDefined();
  });
});
