describe("shared/database/stores/usecases/updateBumpReminderConfig", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/usecases/updateBumpReminderConfig");
    expect(module).toBeDefined();
  });
});
