describe("bot/handlers/interactionCreate/ui/index", () => {
  it("re-exports ui handler registries", async () => {
    const indexModule = await import("@/bot/handlers/interactionCreate/ui");
    const buttonsModule =
      await import("@/bot/handlers/interactionCreate/ui/buttons");
    const modalsModule =
      await import("@/bot/handlers/interactionCreate/ui/modals");
    const selectMenusModule =
      await import("@/bot/handlers/interactionCreate/ui/selectMenus");

    expect(indexModule.buttonHandlers).toBe(buttonsModule.buttonHandlers);
    expect(indexModule.modalHandlers).toBe(modalsModule.modalHandlers);
    expect(indexModule.userSelectHandlers).toBe(
      selectMenusModule.userSelectHandlers,
    );
  });
});
