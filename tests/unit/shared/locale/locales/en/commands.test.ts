describe("shared/locale/locales/en/commands", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en/commands");
    expect(module).toBeDefined();
  });
});
