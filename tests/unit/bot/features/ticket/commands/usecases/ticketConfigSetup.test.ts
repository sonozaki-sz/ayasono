// tests/unit/bot/features/ticket/commands/usecases/ticketConfigSetup.test.ts

import { MessageFlags } from "discord.js";

const findByGuildAndCategoryMock = vi.fn();
const sessionSetMock = vi.fn();

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotTicketConfigService: vi.fn(() => ({
    findByGuildAndCategory: findByGuildAndCategoryMock,
  })),
}));

vi.mock("@/bot/features/ticket/handlers/ui/ticketSetupState", () => ({
  ticketSetupSessions: {
    set: sessionSetMock,
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/locale/localeManager", () => ({
  logPrefixed: (
    prefixKey: string,
    messageKey: string,
    params?: Record<string, unknown>,
    sub?: string,
  ) => {
    const p = `${prefixKey}`;
    const m = params ? `${messageKey}:${JSON.stringify(params)}` : messageKey;
    return sub ? `[${p}:${sub}] ${m}` : `[${p}] ${m}`;
  },
  logCommand: (
    commandName: string,
    messageKey: string,
    params?: Record<string, unknown>,
  ) => {
    const m = params ? `${messageKey}:${JSON.stringify(params)}` : messageKey;
    return `[${commandName}] ${m}`;
  },
  tDefault: vi.fn((key: string) => key),
  tInteraction: (_locale: string, key: string) => key,
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((msg: string) => ({
    type: "error",
    description: msg,
  })),
}));

function createInteractionMock(overrides = {}) {
  return {
    channelId: "channel-1",
    locale: "ja",
    guild: { id: "guild-1" },
    options: {
      getChannel: vi.fn(() => ({ id: "category-1", name: "test-category" })),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/features/ticket/commands/usecases/ticketConfigSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("既にカテゴリに設定がある場合はエラー応答", async () => {
    const { handleTicketConfigSetup } = await import(
      "@/bot/features/ticket/commands/usecases/ticketConfigSetup"
    );

    findByGuildAndCategoryMock.mockResolvedValue({
      guildId: "guild-1",
      categoryId: "category-1",
    });
    const interaction = createInteractionMock();

    await handleTicketConfigSetup(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(sessionSetMock).not.toHaveBeenCalled();
  });

  it("設定がない場合は RoleSelectMenu が表示される", async () => {
    const { handleTicketConfigSetup } = await import(
      "@/bot/features/ticket/commands/usecases/ticketConfigSetup"
    );

    findByGuildAndCategoryMock.mockResolvedValue(null);
    const interaction = createInteractionMock();

    await handleTicketConfigSetup(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        flags: MessageFlags.Ephemeral,
        components: expect.arrayContaining([
          expect.objectContaining({ components: expect.any(Array) }),
        ]),
      }),
    );
  });

  it("セッションが保存されること", async () => {
    const { handleTicketConfigSetup } = await import(
      "@/bot/features/ticket/commands/usecases/ticketConfigSetup"
    );

    findByGuildAndCategoryMock.mockResolvedValue(null);
    const interaction = createInteractionMock();

    await handleTicketConfigSetup(interaction as never, "guild-1");

    expect(sessionSetMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        categoryId: "category-1",
        staffRoleIds: [],
      }),
    );
  });
});
