describe("shared/locale/locales/ja/errors", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/ja/errors");
    expect(module).toBeDefined();
  });
});
