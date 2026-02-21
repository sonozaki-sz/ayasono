describe("shared/features/bump-reminder/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/features/bump-reminder");
    expect(module).toBeDefined();
  });
});
