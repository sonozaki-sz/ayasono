// tests/unit/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler.test.ts
import { bumpPanelButtonHandler } from "@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler";
import { getBotBumpReminderConfigService } from "@/bot/services/botCompositionRoot";
import {
  createErrorEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "@/bot/utils/messageResponse";
import { getGuildTranslator } from "@/shared/locale/helpers";
import { tDefault } from "@/shared/locale/localeManager";
import { logger } from "@/shared/utils/logger";
import { MessageFlags } from "discord.js";

const safeReplyMock = vi.fn();
const addMentionUserMock = vi.fn();
const removeMentionUserMock = vi.fn();

// Bump設定サービス依存を切り離し、ハンドラ分岐に集中する
vi.mock("@/shared/features/bump-reminder/bumpReminderConfigService", () => ({
  BUMP_REMINDER_MENTION_USER_ADD_RESULT: {
    ADDED: "added",
    ALREADY_EXISTS: "already_exists",
    NOT_CONFIGURED: "not_configured",
  },
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT: {
    REMOVED: "removed",
    NOT_FOUND: "not_found",
    NOT_CONFIGURED: "not_configured",
  },
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotBumpReminderConfigService: vi.fn(() => ({
    addBumpReminderMentionUser: (...args: unknown[]) =>
      addMentionUserMock(...args),
    removeBumpReminderMentionUser: (...args: unknown[]) =>
      removeMentionUserMock(...args),
  })),
}));

// 定数と翻訳を固定化してカスタムID判定と応答内容の検証を安定させる
vi.mock(
  "@/bot/features/bump-reminder/constants/bumpReminderConstants",
  () => ({
    BUMP_CONSTANTS: {
      CUSTOM_ID_PREFIX: {
        MENTION_ON: "bump:on:",
        MENTION_OFF: "bump:off:",
      },
    },
  }),
);
vi.mock("@/shared/locale/helpers", () => ({
  getGuildTranslator: vi.fn(async () => (key: string) => key),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
}));

// interaction 応答は safeReply 経由のみ検証する
vi.mock("@/bot/utils/interaction", () => ({
  safeReply: (...args: unknown[]) => safeReplyMock(...args),
}));

// ログ・Embed 生成は副作用排除のためダミーにする
vi.mock("@/shared/utils/logger", () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}));
vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((message: string) => ({ message })),
  createSuccessEmbed: vi.fn((message: string) => ({ message })),
  createWarningEmbed: vi.fn((message: string) => ({ message })),
}));

type ButtonInteractionLike = {
  customId: string;
  guild: { id: string } | null;
  user: { id: string };
};

// bumpPanel ハンドラ検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<ButtonInteractionLike>,
): ButtonInteractionLike {
  return {
    customId: "bump:on:guild-1",
    guild: { id: "guild-1" },
    user: { id: "user-1" },
    ...overrides,
  };
}

describe("bot/features/bump-reminder/ui/bumpPanelButtonHandler", () => {
  // モック履歴をケースごとに初期化
  beforeEach(() => {
    vi.clearAllMocks();
    safeReplyMock.mockResolvedValue(undefined);
    addMentionUserMock.mockResolvedValue("added");
    removeMentionUserMock.mockResolvedValue("removed");
  });

  it("customId prefix 判定が有効であることを検証", () => {
    expect(bumpPanelButtonHandler.matches("bump:on:guild-1")).toBe(true);
    expect(bumpPanelButtonHandler.matches("bump:off:guild-1")).toBe(true);
    expect(bumpPanelButtonHandler.matches("other:guild-1")).toBe(false);
  });

  it("ギルド不一致時にエラー応答して終了することを検証", async () => {
    const interaction = createInteraction({
      customId: "bump:on:guild-1",
      guild: { id: "guild-x" },
    });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("guild が存在しない場合はエラー応答する", async () => {
    const interaction = createInteraction({ guild: null });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("追加パスで NOT_CONFIGURED エラーが返った場合はエラー応答する", async () => {
    addMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(addMentionUserMock).toHaveBeenCalledWith("guild-1", "user-1");
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("追加対象がすでに存在する場合は警告応答を返す", async () => {
    addMentionUserMock.mockResolvedValueOnce("already_exists");
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(createWarningEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.already_added",
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.already_added" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("メンション追加成功時に成功応答を返してデバッグログを記録する", async () => {
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(getBotBumpReminderConfigService).toHaveBeenCalledTimes(1);
    expect(getGuildTranslator).toHaveBeenCalledWith("guild-1");
    expect(createSuccessEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.mention_added",
      { title: "events:bump-reminder.panel.success_title" },
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.mention_added" }],
      flags: MessageFlags.Ephemeral,
    });
    expect(logger.debug).toHaveBeenCalled();
  });

  it("削除パスで NOT_CONFIGURED エラーが返った場合はエラー応答する", async () => {
    removeMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({ customId: "bump:off:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(removeMentionUserMock).toHaveBeenCalledWith("guild-1", "user-1");
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("削除対象が見つからない場合は警告応答を返す", async () => {
    removeMentionUserMock.mockResolvedValueOnce("not_found");
    const interaction = createInteraction({ customId: "bump:off:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(createWarningEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.not_in_list",
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.not_in_list" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("メンション削除成功時に成功応答を返してデバッグログを記録する", async () => {
    const interaction = createInteraction({ customId: "bump:off:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(createSuccessEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.mention_removed",
      { title: "events:bump-reminder.panel.success_title" },
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.mention_removed" }],
      flags: MessageFlags.Ephemeral,
    });
    expect(logger.debug).toHaveBeenCalled();
  });

  it("実行エラー発生時にフォールバックのエラー embed を送信する", async () => {
    addMentionUserMock.mockRejectedValueOnce(new Error("db failed"));
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(logger.error).toHaveBeenCalledWith(
      "system:bump-reminder.panel_handle_failed",
      expect.any(Error),
    );
    expect(tDefault).toHaveBeenCalledWith("errors:general.error_title");
    expect(createErrorEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.error",
      { title: "errors:general.error_title" },
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.error" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("フォールバック返答も失敗した場合は二次エラーをログに記録する", async () => {
    addMentionUserMock.mockRejectedValueOnce(new Error("db failed"));
    safeReplyMock.mockRejectedValueOnce(new Error("reply failed"));
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(logger.error).toHaveBeenCalledWith(
      "system:bump-reminder.panel_handle_failed",
      expect.any(Error),
    );
    expect(logger.error).toHaveBeenCalledWith(
      "system:bump-reminder.panel_reply_failed",
      expect.any(Error),
    );
  });
});
