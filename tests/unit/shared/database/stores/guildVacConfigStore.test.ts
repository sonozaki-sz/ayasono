describe("shared/database/stores/guildVacConfigStore", () => {
  it("loads module", async () => {
    const module = await import("@/shared/database/stores/guildVacConfigStore");
    expect(module).toBeDefined();
  });
});
