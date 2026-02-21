describe("shared/database/stores/guildBumpReminderConfigStore", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/guildBumpReminderConfigStore");
    expect(module).toBeDefined();
  });
});
