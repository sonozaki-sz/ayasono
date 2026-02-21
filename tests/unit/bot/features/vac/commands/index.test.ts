describe("bot/features/vac/commands/index", () => {
  it("re-exports vac command modules", async () => {
    const indexModule = await import("@/bot/features/vac/commands");
    const vacConstants =
      await import("@/bot/features/vac/commands/vacCommand.constants");
    const vacExecute =
      await import("@/bot/features/vac/commands/vacCommand.execute");
    const vacConfigAutocomplete =
      await import("@/bot/features/vac/commands/vacConfigCommand.autocomplete");
    const vacConfigConstants =
      await import("@/bot/features/vac/commands/vacConfigCommand.constants");
    const vacConfigExecute =
      await import("@/bot/features/vac/commands/vacConfigCommand.execute");

    expect(indexModule.VAC_COMMAND).toBe(vacConstants.VAC_COMMAND);
    expect(indexModule.executeVacCommand).toBe(vacExecute.executeVacCommand);
    expect(indexModule.autocompleteVacConfigCommand).toBe(
      vacConfigAutocomplete.autocompleteVacConfigCommand,
    );
    expect(indexModule.VAC_CONFIG_COMMAND).toBe(
      vacConfigConstants.VAC_CONFIG_COMMAND,
    );
    expect(indexModule.executeVacConfigCommand).toBe(
      vacConfigExecute.executeVacConfigCommand,
    );
  });
});
