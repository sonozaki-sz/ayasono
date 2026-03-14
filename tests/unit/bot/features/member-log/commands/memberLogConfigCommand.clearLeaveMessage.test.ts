// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.clearLeaveMessage.test.ts
import { handleMemberLogConfigClearLeaveMessage } from "@/bot/features/member-log/commands/memberLogConfigCommand.clearLeaveMessage";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----
const ensurePermissionMock = vi.fn();
const clearLeaveMessageMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);
const tDefaultMock = vi.fn(
  (key: string, _opts?: Record<string, unknown>) => key,
);
const loggerInfoMock = vi.fn();
const createSuccessEmbedMock = vi.fn(
  (desc: string, opts?: { title?: string }) => ({
    description: desc,
    title: opts?.title,
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.guard",
  () => ({
    ensureMemberLogManageGuildPermission: (...args: unknown[]) =>
      ensurePermissionMock(...args),
  }),
);

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotMemberLogConfigService: () => ({
    clearLeaveMessage: (...args: unknown[]) => clearLeaveMessageMock(...args),
  }),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (guildId: string, key: string) => tGuildMock(guildId, key),
  tDefault: (key: string, opts?: Record<string, unknown>) =>
    tDefaultMock(key, opts),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: (...args: unknown[]) => loggerInfoMock(...args) },
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (desc: string, opts?: { title?: string }) =>
    createSuccessEmbedMock(desc, opts),
}));

// ---- ヘルパー ----

/** テスト用 interaction モックを生成する */
function makeInteraction() {
  return {
    options: {},
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

// handleMemberLogConfigClearLeaveMessage の権限チェック・削除・応答フローを検証
describe("bot/features/member-log/commands/memberLogConfigCommand.clearLeaveMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLeaveMessageMock.mockResolvedValue(undefined);
  });

  // ガードが ValidationError を投げた場合にそれが伝播することを確認
  it("propagates error when guard throws", async () => {
    ensurePermissionMock.mockRejectedValue(new ValidationError("no-perm"));

    await expect(
      handleMemberLogConfigClearLeaveMessage(
        makeInteraction() as never,
        "guild-1",
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // service.clearLeaveMessage が正しい引数で呼ばれることを確認
  it("calls service.clearLeaveMessage with correct guildId", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);

    await handleMemberLogConfigClearLeaveMessage(
      makeInteraction() as never,
      "guild-1",
    );

    expect(clearLeaveMessageMock).toHaveBeenCalledWith("guild-1");
  });

  // 成功時に success embed で reply が呼ばれることを確認
  it("replies with success embed on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigClearLeaveMessage(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
    expect(createSuccessEmbedMock).toHaveBeenCalled();
  });

  // 成功時に logger.info が呼ばれることを確認
  it("logs info on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);

    await handleMemberLogConfigClearLeaveMessage(
      makeInteraction() as never,
      "guild-1",
    );

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "system:member-log.config_leave_message_cleared",
    );
  });
});
