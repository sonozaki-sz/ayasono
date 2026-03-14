// tests/unit/bot/features/message-delete/commands/usecases/runDeleteExecution.test.ts

import type { Mock } from "vitest";

const deleteScannedMessagesMock = vi.fn();
const buildCompletionEmbedMock = vi.fn(() => ({ _type: "completion" }));
const createErrorEmbedMock = vi.fn((d: string) => ({
  _type: "error",
  description: d,
}));
const createWarningEmbedMock = vi.fn((d: string) => ({
  _type: "warning",
  description: d,
}));

vi.mock("@/bot/features/message-delete/services/messageDeleteService", () => ({
  deleteScannedMessages: (...args: unknown[]) => deleteScannedMessagesMock(...args),
}));

vi.mock(
  "@/bot/features/message-delete/commands/messageDeleteEmbedBuilder",
  () => ({
    buildCompletionEmbed: (...args: any[]) =>
      (buildCompletionEmbedMock as (...a: any[]) => unknown)(...args),
  }),
);

vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: (d: string) => createErrorEmbedMock(d),
  createWarningEmbed: (d: string) => createWarningEmbedMock(d),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  ),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockOptions: import("@/bot/features/message-delete/commands/usecases/dialogUtils").ParsedOptions =
  {
    count: 10,
    countSpecified: false,
    afterTs: 0,
    beforeTs: Infinity,
  };

function makeInteraction() {
  return {
    user: { id: "user-1" },
    editReply: vi.fn().mockResolvedValue(undefined) as Mock,
  };
}

describe("bot/features/message-delete/commands/usecases/runDeleteExecution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadModule() {
    return import(
      "@/bot/features/message-delete/commands/usecases/runDeleteExecution"
    );
  }

  it("削除を実行して成功時に完了 embed を表示する", async () => {
    const { executeDelete } = await loadModule();

    deleteScannedMessagesMock.mockResolvedValue({
      totalDeleted: 5,
      channelBreakdown: { "ch-1": { name: "general", count: 5 } },
    });

    const interaction = makeInteraction();
    await executeDelete(interaction as never, [] as never, mockOptions);

    expect(deleteScannedMessagesMock).toHaveBeenCalled();
    expect(buildCompletionEmbedMock).toHaveBeenCalledWith(5, {
      "ch-1": { name: "general", count: 5 },
    });
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: [{ _type: "completion" }],
        content: "",
        components: [],
      }),
    );
  });

  it("countSpecified=true の場合にログ出力する", async () => {
    const { executeDelete } = await loadModule();

    deleteScannedMessagesMock.mockResolvedValue({
      totalDeleted: 3,
      channelBreakdown: {},
    });

    const interaction = makeInteraction();
    await executeDelete(interaction as never, [] as never, {
      ...mockOptions,
      countSpecified: true,
      targetUserId: "user-2",
      keyword: "hello",
      daysOption: 7,
    });

    expect(interaction.editReply).toHaveBeenCalled();
  });

  it("daysOption なしで afterStr/beforeStr がある場合にログ出力する", async () => {
    const { executeDelete } = await loadModule();

    deleteScannedMessagesMock.mockResolvedValue({
      totalDeleted: 3,
      channelBreakdown: {},
    });

    const interaction = makeInteraction();
    await executeDelete(interaction as never, [] as never, {
      ...mockOptions,
      afterStr: "2024-01-01",
      beforeStr: "2024-01-31",
    });

    expect(interaction.editReply).toHaveBeenCalled();
  });

  it("deleteScannedMessages が例外をスローした場合はエラー embed を表示する", async () => {
    const { executeDelete } = await loadModule();

    deleteScannedMessagesMock.mockRejectedValue(new Error("delete failed"));

    const interaction = makeInteraction();
    await executeDelete(interaction as never, [] as never, mockOptions);

    expect(createErrorEmbedMock).toHaveBeenCalled();
  });

  it("削除中に onProgress コールバックを呼び出す", async () => {
    const { executeDelete } = await loadModule();

    deleteScannedMessagesMock.mockImplementation(
      async (
        _msgs: never,
        onProgress?: (data: object) => Promise<void>,
        _signal?: AbortSignal,
      ) => {
        if (onProgress) {
          await onProgress({
            totalDeleted: 2,
            total: 5,
            channelStatuses: [
              { channelId: "ch-1", name: "general", deleted: 2, total: 5 },
            ],
          });
        }
        return { totalDeleted: 5, channelBreakdown: {} };
      },
    );

    const interaction = makeInteraction();
    await executeDelete(interaction as never, [] as never, mockOptions);

    // Should have been called with progress content
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: [], components: [] }),
    );
  });
});
