describe("shared/database/stores/guildMemberLogConfigStore", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/guildMemberLogConfigStore");
    expect(module).toBeDefined();
  });
});
