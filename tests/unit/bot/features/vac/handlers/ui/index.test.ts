describe("bot/features/vac/handlers/ui/index", () => {
  it("re-exports vac ui handlers", async () => {
    const indexModule = await import("@/bot/features/vac/handlers/ui");
    const panel =
      await import("@/bot/features/vac/handlers/ui/vacControlPanel");
    const button =
      await import("@/bot/features/vac/handlers/ui/vacPanelButton");
    const modal = await import("@/bot/features/vac/handlers/ui/vacPanelModal");
    const userSelect =
      await import("@/bot/features/vac/handlers/ui/vacPanelUserSelect");

    expect(indexModule.VAC_PANEL_CUSTOM_ID).toBe(panel.VAC_PANEL_CUSTOM_ID);
    expect(indexModule.getVacPanelChannelId).toBe(panel.getVacPanelChannelId);
    expect(indexModule.sendVacControlPanel).toBe(panel.sendVacControlPanel);
    expect(indexModule.vacPanelButtonHandler).toBe(
      button.vacPanelButtonHandler,
    );
    expect(indexModule.vacPanelModalHandler).toBe(modal.vacPanelModalHandler);
    expect(indexModule.vacPanelUserSelectHandler).toBe(
      userSelect.vacPanelUserSelectHandler,
    );
  });
});
