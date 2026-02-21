describe("bot/features/vac/index", () => {
  it("re-exports vac repository APIs", async () => {
    const indexModule = await import("@/bot/features/vac");
    const repositoriesModule = await import("@/bot/features/vac/repositories");

    expect(indexModule.createVacRepository).toBe(
      repositoriesModule.createVacRepository,
    );
    expect(indexModule.getVacRepository).toBe(
      repositoriesModule.getVacRepository,
    );
  });
});
