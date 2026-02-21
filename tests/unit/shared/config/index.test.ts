describe("shared/config/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/config");
    expect(module).toBeDefined();
  });
});
