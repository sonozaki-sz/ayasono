describe("shared/database/stores/usecases/mutateBumpReminderConfig", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/usecases/mutateBumpReminderConfig");
    expect(module).toBeDefined();
  });
});
