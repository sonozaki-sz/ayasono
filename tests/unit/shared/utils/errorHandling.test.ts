describe("shared/utils/errorHandling", () => {
  it("loads module", async () => {
    const module = await import("@/shared/utils/errorHandling");
    expect(module).toBeDefined();
  });
});
