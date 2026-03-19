// tests/unit/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler.test.ts
import { bumpPanelButtonHandler } from "@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler";
import { getBotBumpReminderConfigService } from "@/bot/services/botCompositionRoot";
import {
  createErrorEmbed,
  createSuccessEmbed,
} from "@/bot/utils/messageResponse";
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
        MENTION_ON: "bump-reminder:mention-on:",
        MENTION_OFF: "bump-reminder:mention-off:",
      },
    },
  }),
);
vi.mock("@/shared/locale/helpers", () => ({
  getGuildTranslator: vi.fn(async () => (key: string) => key),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
  tInteraction: (...args: unknown[]) => args[1],
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
}));

type ButtonInteractionLike = {
  customId: string;
  guild: { id: string } | null;
  user: { id: string };
};

// bumpPanel ハンドラ検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<ButtonInteractionLike>,
): ButtonInteractionLike & { locale: string } {
  return {
    customId: "bump-reminder:mention-on:guild-1",
    guild: { id: "guild-1" },
    user: { id: "user-1" },
    locale: "ja",
    ...overrides,
  };
}

// bumpPanelButtonHandler の ON/OFF ボタン判定・冪等動作・エラーハンドリングを検証
describe("bot/features/bump-reminder/ui/bumpPanelButtonHandler", () => {
  // モック履歴をケースごとに初期化
  beforeEach(() => {
    vi.clearAllMocks();
    safeReplyMock.mockResolvedValue(undefined);
    addMentionUserMock.mockResolvedValue("added");
    removeMentionUserMock.mockResolvedValue("removed");
  });

  it("ON/OFF ボタンの customId prefix 判定が有効であることを検証", () => {
    expect(bumpPanelButtonHandler.matches("bump-reminder:mention-on:guild-1")).toBe(
      true,
    );
    expect(bumpPanelButtonHandler.matches("bump-reminder:mention-off:guild-1")).toBe(
      true,
    );
    expect(bumpPanelButtonHandler.matches("other:guild-1")).toBe(false);
  });

  it("ギルド不一致時にエラー応答して終了することを検証", async () => {
    const interaction = createInteraction({
      customId: "bump-reminder:mention-on:guild-1",
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

  // ON ボタンの追加成功・冪等動作・NOT_CONFIGURED エラーを検証
  describe("ONボタン", () => {
    it("未登録ユーザーを追加して成功応答を返す", async () => {
      const interaction = createInteraction();

      await bumpPanelButtonHandler.execute(interaction as never);

      expect(getBotBumpReminderConfigService).toHaveBeenCalledTimes(1);
      expect(addMentionUserMock).toHaveBeenCalledWith("guild-1", "user-1");
      expect(createSuccessEmbed).toHaveBeenCalledWith(
        "events:bump-reminder.panel.mention_toggled_on",
        { title: "events:bump-reminder.panel.success_title" },
      );
      expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
        embeds: [
          { message: "events:bump-reminder.panel.mention_toggled_on" },
        ],
        flags: MessageFlags.Ephemeral,
      });
      expect(logger.debug).toHaveBeenCalled();
    });

    it("既に登録済みのユーザーでも冪等に成功応答を返す", async () => {
      addMentionUserMock.mockResolvedValueOnce("already_exists");
      const interaction = createInteraction();

      await bumpPanelButtonHandler.execute(interaction as never);

      // 削除は呼ばれない（冪等動作）
      expect(removeMentionUserMock).not.toHaveBeenCalled();
      expect(createSuccessEmbed).toHaveBeenCalledWith(
        "events:bump-reminder.panel.mention_toggled_on",
        { title: "events:bump-reminder.panel.success_title" },
      );
    });

    it("NOT_CONFIGURED の場合はエラー応答する", async () => {
      addMentionUserMock.mockResolvedValueOnce("not_configured");
      const interaction = createInteraction();

      await bumpPanelButtonHandler.execute(interaction as never);

      expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
        content: "events:bump-reminder.panel.error",
        flags: MessageFlags.Ephemeral,
      });
    });
  });

  // OFF ボタンの削除成功・冪等動作・NOT_CONFIGURED エラーを検証
  describe("OFFボタン", () => {
    it("登録済みユーザーを削除して成功応答を返す", async () => {
      const interaction = createInteraction({
        customId: "bump-reminder:mention-off:guild-1",
      });

      await bumpPanelButtonHandler.execute(interaction as never);

      expect(removeMentionUserMock).toHaveBeenCalledWith("guild-1", "user-1");
      expect(createSuccessEmbed).toHaveBeenCalledWith(
        "events:bump-reminder.panel.mention_toggled_off",
        { title: "events:bump-reminder.panel.success_title" },
      );
      expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
        embeds: [
          { message: "events:bump-reminder.panel.mention_toggled_off" },
        ],
        flags: MessageFlags.Ephemeral,
      });
      expect(logger.debug).toHaveBeenCalled();
    });

    it("未登録ユーザーでも冪等に成功応答を返す", async () => {
      removeMentionUserMock.mockResolvedValueOnce("not_found");
      const interaction = createInteraction({
        customId: "bump-reminder:mention-off:guild-1",
      });

      await bumpPanelButtonHandler.execute(interaction as never);

      // 追加は呼ばれない（冪等動作）
      expect(addMentionUserMock).not.toHaveBeenCalled();
      expect(createSuccessEmbed).toHaveBeenCalledWith(
        "events:bump-reminder.panel.mention_toggled_off",
        { title: "events:bump-reminder.panel.success_title" },
      );
    });

    it("NOT_CONFIGURED の場合はエラー応答する", async () => {
      removeMentionUserMock.mockResolvedValueOnce("not_configured");
      const interaction = createInteraction({
        customId: "bump-reminder:mention-off:guild-1",
      });

      await bumpPanelButtonHandler.execute(interaction as never);

      expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
        content: "events:bump-reminder.panel.error",
        flags: MessageFlags.Ephemeral,
      });
    });
  });

  // 想定外エラー発生時のフォールバック応答・二次エラーログを検証
  describe("エラーハンドリング", () => {
    it("実行エラー発生時にフォールバックのエラー embed を送信する", async () => {
      addMentionUserMock.mockRejectedValueOnce(new Error("db failed"));
      const interaction = createInteraction();

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
      const interaction = createInteraction();

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
});
