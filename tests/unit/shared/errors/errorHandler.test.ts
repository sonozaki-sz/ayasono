describe("shared/errors/errorHandler", () => {
  it("loads module", async () => {
    const module = await import("@/shared/errors/errorHandler");
    expect(module).toBeDefined();
  });
});
