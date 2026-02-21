describe("shared/errors/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/errors");
    expect(module).toBeDefined();
  });
});
