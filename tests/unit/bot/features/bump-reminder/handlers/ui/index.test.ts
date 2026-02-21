describe("bot/features/bump-reminder/handlers/ui/index", () => {
  it("re-exports bump panel button handler", async () => {
    const indexModule =
      await import("@/bot/features/bump-reminder/handlers/ui");
    const handlerModule =
      await import("@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler");

    expect(indexModule.bumpPanelButtonHandler).toBe(
      handlerModule.bumpPanelButtonHandler,
    );
  });
});
