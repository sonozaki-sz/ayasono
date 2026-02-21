describe("shared/database/stores/helpers/afkConfigCas", () => {
  it("loads module", async () => {
    const module =
      await import("@/shared/database/stores/helpers/afkConfigCas");
    expect(module).toBeDefined();
  });
});
