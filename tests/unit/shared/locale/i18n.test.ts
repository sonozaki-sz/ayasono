describe("shared/locale/i18n", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/i18n");
    expect(module).toBeDefined();
  });
});
