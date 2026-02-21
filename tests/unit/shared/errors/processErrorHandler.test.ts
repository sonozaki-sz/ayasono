describe("shared/errors/processErrorHandler", () => {
  it("loads module", async () => {
    const module = await import("@/shared/errors/processErrorHandler");
    expect(module).toBeDefined();
  });
});
