describe("shared/database/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/database");
    expect(module).toBeDefined();
  });
});
