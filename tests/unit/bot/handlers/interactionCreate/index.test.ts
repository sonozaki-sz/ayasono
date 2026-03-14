// tests/unit/bot/handlers/interactionCreate/index.test.ts
import type { Mock } from "vitest";

const handleAutocompleteMock: Mock = vi.fn();
const handleButtonMock: Mock = vi.fn();
const handleChatInputCommandMock: Mock = vi.fn();
const handleModalSubmitMock: Mock = vi.fn();
const handleUserSelectMenuMock: Mock = vi.fn();
const handleStringSelectMenuMock: Mock = vi.fn();

vi.mock("@/bot/handlers/interactionCreate/flow/command", () => ({
  handleAutocomplete: (...args: unknown[]) => handleAutocompleteMock(...args),
  handleChatInputCommand: (...args: unknown[]) =>
    handleChatInputCommandMock(...args),
}));

vi.mock("@/bot/handlers/interactionCreate/flow/modal", () => ({
  handleModalSubmit: (...args: unknown[]) => handleModalSubmitMock(...args),
}));

vi.mock("@/bot/handlers/interactionCreate/flow/components", () => ({
  handleButton: (...args: unknown[]) => handleButtonMock(...args),
  handleUserSelectMenu: (...args: unknown[]) =>
    handleUserSelectMenuMock(...args),
  handleStringSelectMenu: (...args: unknown[]) =>
    handleStringSelectMenuMock(...args),
}));

describe("bot/handlers/interactionCreate/index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("チャットインプットコマンドが handleChatInputCommand へルーティングされることを確認", async () => {
    const { handleInteractionCreate } =
      await import("@/bot/handlers/interactionCreate/handleInteractionCreate");

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

  it("ユーザーセレクトメニューが handleUserSelectMenu へルーティングされることを確認", async () => {
    const { handleInteractionCreate } =
      await import("@/bot/handlers/interactionCreate/handleInteractionCreate");

    const interaction = {
      client: {},
      isChatInputCommand: () => false,
      isAutocomplete: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      isUserSelectMenu: () => true,
      isStringSelectMenu: () => false,
    };

    await handleInteractionCreate(interaction as never);

    expect(handleUserSelectMenuMock).toHaveBeenCalledTimes(1);
    expect(handleButtonMock).not.toHaveBeenCalled();
  });

  it("ストリングセレクトメニューが handleStringSelectMenu へルーティングされることを確認", async () => {
    const { handleInteractionCreate } =
      await import("@/bot/handlers/interactionCreate/handleInteractionCreate");

    const interaction = {
      client: {},
      isChatInputCommand: () => false,
      isAutocomplete: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      isUserSelectMenu: () => false,
      isStringSelectMenu: () => true,
    };

    await handleInteractionCreate(interaction as never);

    expect(handleStringSelectMenuMock).toHaveBeenCalledTimes(1);
    expect(handleUserSelectMenuMock).not.toHaveBeenCalled();
  });
});
