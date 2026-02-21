describe("shared/locale/commandLocalizations", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/commandLocalizations");
    expect(module).toBeDefined();
  });
});
