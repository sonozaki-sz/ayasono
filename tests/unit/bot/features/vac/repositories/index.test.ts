describe("bot/features/vac/repositories/index", () => {
  it("re-exports vac repository functions", async () => {
    const indexModule = await import("@/bot/features/vac/repositories");
    const repositoryModule =
      await import("@/bot/features/vac/repositories/vacRepository");

    expect(indexModule.createVacRepository).toBe(
      repositoryModule.createVacRepository,
    );
    expect(indexModule.getVacRepository).toBe(
      repositoryModule.getVacRepository,
    );
  });
});
