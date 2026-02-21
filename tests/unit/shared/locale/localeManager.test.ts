describe("shared/locale/localeManager", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/localeManager");
    expect(module).toBeDefined();
  });
});
