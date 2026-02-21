describe("web/routes/api/index", () => {
  it("loads module", async () => {
    const module = await import("@/web/routes/api");
    expect(module).toBeDefined();
  });
});
