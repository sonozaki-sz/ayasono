describe("shared/locale/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale");
    expect(module).toBeDefined();
  });
});
