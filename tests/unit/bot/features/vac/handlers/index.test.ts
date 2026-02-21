describe("bot/features/vac/handlers/index", () => {
  it("re-exports vac handlers", async () => {
    const indexModule = await import("@/bot/features/vac/handlers");
    const uiPanel =
      await import("@/bot/features/vac/handlers/ui/vacControlPanel");
    const uiButton =
      await import("@/bot/features/vac/handlers/ui/vacPanelButton");
    const uiModal =
      await import("@/bot/features/vac/handlers/ui/vacPanelModal");
    const uiUserSelect =
      await import("@/bot/features/vac/handlers/ui/vacPanelUserSelect");
    const channelDelete =
      await import("@/bot/features/vac/handlers/vacChannelDelete");
    const startup =
      await import("@/bot/features/vac/handlers/vacStartupCleanup");
    const voiceState =
      await import("@/bot/features/vac/handlers/vacVoiceStateUpdate");

    expect(indexModule.VAC_PANEL_CUSTOM_ID).toBe(uiPanel.VAC_PANEL_CUSTOM_ID);
    expect(indexModule.getVacPanelChannelId).toBe(uiPanel.getVacPanelChannelId);
    expect(indexModule.sendVacControlPanel).toBe(uiPanel.sendVacControlPanel);
    expect(indexModule.vacPanelButtonHandler).toBe(
      uiButton.vacPanelButtonHandler,
    );
    expect(indexModule.vacPanelModalHandler).toBe(uiModal.vacPanelModalHandler);
    expect(indexModule.vacPanelUserSelectHandler).toBe(
      uiUserSelect.vacPanelUserSelectHandler,
    );
    expect(indexModule.handleVacChannelDelete).toBe(
      channelDelete.handleVacChannelDelete,
    );
    expect(indexModule.cleanupVacOnStartup).toBe(startup.cleanupVacOnStartup);
    expect(indexModule.handleVacVoiceStateUpdate).toBe(
      voiceState.handleVacVoiceStateUpdate,
    );
  });
});
