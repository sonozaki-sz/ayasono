describe("shared/locale/locales/ja/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/ja");
    expect(module).toBeDefined();
  });
});
