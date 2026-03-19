// tests/unit/bot/handlers/interactionCreate/flow/modal.test.ts
import { handleInteractionError } from "@/bot/errors/interactionErrorHandler";
import { handleModalSubmit } from "@/bot/handlers/interactionCreate/flow/modal";
import type { Mock } from "vitest";

const loggerWarnMock = vi.fn();
const loggerDebugMock = vi.fn();
const loggerErrorMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
  tInteraction: (...args: unknown[]) => args[1],
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleInteractionError: vi.fn(),
}));

vi.mock("@/bot/handlers/interactionCreate/ui/modals", () => ({
  modalHandlers: [
    {
      matches: vi.fn((id: string) => id.startsWith("vac:")),
      execute: vi.fn().mockResolvedValue(undefined),
    },
  ],
}));

// モーダル送信フローが customId による登録済みハンドラーへのルーティング・
// 未マッチ時の警告ログ・エラー時の interactionErrorHandler への委譲を正しく行うかを検証する
describe("bot/handlers/interactionCreate/flow/modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登録の customId を持つモーダルが送信された場合は警告ログを出してハンドラーを呼び出さないことを確認", async () => {
    const interaction = { customId: "unknown", user: { tag: "user#0001" } };
    const uiModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      modalHandlers: Array<{ execute: Mock }>;
    };

    await handleModalSubmit(interaction as never);

    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(uiModule.modalHandlers[0].execute).not.toHaveBeenCalled();
  });

  it("customId に一致するモーダルハンドラーが実行されることを確認", async () => {
    const interaction = { customId: "vac:rename", user: { tag: "user#0001" } };
    const uiModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      modalHandlers: Array<{ execute: Mock }>;
    };

    await handleModalSubmit(interaction as never);

    expect(uiModule.modalHandlers[0].execute).toHaveBeenCalledWith(interaction);
    expect(loggerDebugMock).toHaveBeenCalledTimes(1);
  });

  it("モーダルハンドラーが例外を投げた場合は handleInteractionError に委譲してエラーログを記録することを確認", async () => {
    const error = new Error("modal failed");
    const uiModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      modalHandlers: Array<{ execute: Mock }>;
    };
    uiModule.modalHandlers[0].execute.mockRejectedValueOnce(error);
    const interaction = { customId: "vac:rename", user: { tag: "user#0001" } };

    await handleModalSubmit(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });
});
