describe("shared/scheduler/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/scheduler");
    expect(module).toBeDefined();
  });
});
