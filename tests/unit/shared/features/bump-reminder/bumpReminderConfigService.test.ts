describe("shared/features/bump-reminder/bumpReminderConfigService", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/features/bump-reminder/bumpReminderConfigService");
    expect(module).toBeDefined();
  });
});
