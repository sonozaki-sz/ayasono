describe("shared/database/stores/usecases/getBumpReminderConfig", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/usecases/getBumpReminderConfig");
    expect(module).toBeDefined();
  });
});
