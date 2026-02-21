describe("bot/handlers/interactionCreate/flow/index", () => {
  it("re-exports interaction flow handlers", async () => {
    const indexModule = await import("@/bot/handlers/interactionCreate/flow");
    const commandModule =
      await import("@/bot/handlers/interactionCreate/flow/command");
    const componentsModule =
      await import("@/bot/handlers/interactionCreate/flow/components");
    const modalModule =
      await import("@/bot/handlers/interactionCreate/flow/modal");

    expect(indexModule.handleAutocomplete).toBe(
      commandModule.handleAutocomplete,
    );
    expect(indexModule.handleChatInputCommand).toBe(
      commandModule.handleChatInputCommand,
    );
    expect(indexModule.handleButton).toBe(componentsModule.handleButton);
    expect(indexModule.handleUserSelectMenu).toBe(
      componentsModule.handleUserSelectMenu,
    );
    expect(indexModule.handleModalSubmit).toBe(modalModule.handleModalSubmit);
  });
});
