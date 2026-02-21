describe("bot/features/vac/services/index", () => {
  it("re-exports vac service APIs", async () => {
    const indexModule = await import("@/bot/features/vac/services");
    const serviceModule =
      await import("@/bot/features/vac/services/vacService");

    expect(indexModule.createVacService).toBe(serviceModule.createVacService);
    expect(indexModule.getVacService).toBe(serviceModule.getVacService);
    expect(indexModule.VacService).toBe(serviceModule.VacService);
  });
});
