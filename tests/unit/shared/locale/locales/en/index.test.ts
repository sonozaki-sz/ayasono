describe("shared/locale/locales/en/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en");
    expect(module).toBeDefined();
  });
});
