describe("web/webAppBuilder", () => {
  it("loads module", async () => {
    const module = await import("@/web/webAppBuilder");
    expect(module).toBeDefined();
  });
});
