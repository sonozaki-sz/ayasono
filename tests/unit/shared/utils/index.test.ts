describe("shared/utils/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/utils");
    expect(module).toBeDefined();
  });
});
