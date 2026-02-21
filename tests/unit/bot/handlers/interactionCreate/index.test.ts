const handleAutocompleteMock = jest.fn();
const handleButtonMock = jest.fn();
const handleChatInputCommandMock = jest.fn();
const handleModalSubmitMock = jest.fn();
const handleUserSelectMenuMock = jest.fn();

jest.mock("@/bot/handlers/interactionCreate/flow", () => ({
  handleAutocomplete: (...args: unknown[]) => handleAutocompleteMock(...args),
  handleButton: (...args: unknown[]) => handleButtonMock(...args),
  handleChatInputCommand: (...args: unknown[]) =>
    handleChatInputCommandMock(...args),
  handleModalSubmit: (...args: unknown[]) => handleModalSubmitMock(...args),
  handleUserSelectMenu: (...args: unknown[]) =>
    handleUserSelectMenuMock(...args),
}));

describe("bot/handlers/interactionCreate/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes chat input command to chat handler", async () => {
    const { handleInteractionCreate } =
      await import("@/bot/handlers/interactionCreate");

    const interaction = {
      client: {},
      isChatInputCommand: () => true,
      isAutocomplete: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      isUserSelectMenu: () => false,
    };

    await handleInteractionCreate(interaction as never);

    expect(handleChatInputCommandMock).toHaveBeenCalledTimes(1);
    expect(handleAutocompleteMock).not.toHaveBeenCalled();
  });

  it("routes user select menu to user select handler", async () => {
    const { handleInteractionCreate } =
      await import("@/bot/handlers/interactionCreate");

    const interaction = {
      client: {},
      isChatInputCommand: () => false,
      isAutocomplete: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      isUserSelectMenu: () => true,
    };

    await handleInteractionCreate(interaction as never);

    expect(handleUserSelectMenuMock).toHaveBeenCalledTimes(1);
    expect(handleButtonMock).not.toHaveBeenCalled();
  });
});
