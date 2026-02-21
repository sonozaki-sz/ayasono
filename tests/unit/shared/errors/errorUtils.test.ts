describe("shared/errors/errorUtils", () => {
  it("loads module", async () => {
    const module = await import("@/shared/errors/errorUtils");
    expect(module).toBeDefined();
  });
});
