describe("shared/database/stores/usecases/setBumpReminderEnabled", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/usecases/setBumpReminderEnabled");
    expect(module).toBeDefined();
  });
});
