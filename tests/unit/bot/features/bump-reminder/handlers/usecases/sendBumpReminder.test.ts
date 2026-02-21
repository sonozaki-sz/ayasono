describe("bot/features/bump-reminder/handlers/usecases/sendBumpReminder", () => {
  it("exports sendBumpReminder function", async () => {
    const module =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");

    expect(typeof module.sendBumpReminder).toBe("function");
  });
});
