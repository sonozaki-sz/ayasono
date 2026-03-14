// tests/unit/bot/commands/bump-reminder-config.test.ts
import type { ChatInputCommandInteraction } from "discord.js";
import { DiscordAPIError, MessageFlags, PermissionFlagsBits } from "discord.js";
import type { Mock } from "vitest";

const setBumpReminderEnabledMock = vi.fn();
const getBumpReminderConfigMock = vi.fn();
const setBumpReminderMentionRoleMock = vi.fn();
const addBumpReminderMentionUserMock = vi.fn();
const clearBumpReminderMentionUsersMock = vi.fn();
const clearBumpReminderMentionsMock = vi.fn();
const removeBumpReminderMentionUserMock = vi.fn();
const cancelReminderMock = vi.fn();
const tDefaultMock = vi.hoisted(() => vi.fn((key: string) => `default:${key}`));
const tGuildMock = vi.hoisted(() => vi.fn());
const createSuccessEmbedMock = vi.fn((description: string) => ({
  description,
}));

// Bump設定サービス依存を置き換えてコマンド分岐を直接検証する
vi.mock("@/shared/features/bump-reminder/bumpReminderConfigService", () => ({
  BUMP_REMINDER_MENTION_CLEAR_RESULT: {
    CLEARED: "cleared",
    NOT_CONFIGURED: "not_configured",
  },
  BUMP_REMINDER_MENTION_ROLE_RESULT: {
    UPDATED: "updated",
    CLEARED: "cleared",
    NOT_CONFIGURED: "not_configured",
  },
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
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT: {
    CLEARED: "cleared",
    EMPTY: "empty",
    NOT_CONFIGURED: "not_configured",
  },
  getBumpReminderConfigService: vi.fn(() => ({
    setBumpReminderEnabled: (...args: unknown[]) =>
      setBumpReminderEnabledMock(...args),
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
    setBumpReminderMentionRole: (...args: unknown[]) =>
      setBumpReminderMentionRoleMock(...args),
    addBumpReminderMentionUser: (...args: unknown[]) =>
      addBumpReminderMentionUserMock(...args),
    clearBumpReminderMentionUsers: (...args: unknown[]) =>
      clearBumpReminderMentionUsersMock(...args),
    clearBumpReminderMentions: (...args: unknown[]) =>
      clearBumpReminderMentionsMock(...args),
    removeBumpReminderMentionUser: (...args: unknown[]) =>
      removeBumpReminderMentionUserMock(...args),
  })),
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotBumpReminderConfigService: vi.fn(() => ({
    setBumpReminderEnabled: (...args: unknown[]) =>
      setBumpReminderEnabledMock(...args),
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
    setBumpReminderMentionRole: (...args: unknown[]) =>
      setBumpReminderMentionRoleMock(...args),
    addBumpReminderMentionUser: (...args: unknown[]) =>
      addBumpReminderMentionUserMock(...args),
    clearBumpReminderMentionUsers: (...args: unknown[]) =>
      clearBumpReminderMentionUsersMock(...args),
    clearBumpReminderMentions: (...args: unknown[]) =>
      clearBumpReminderMentionsMock(...args),
    removeBumpReminderMentionUser: (...args: unknown[]) =>
      removeBumpReminderMentionUserMock(...args),
  })),
  getBotBumpReminderManager: vi.fn(() => ({
    cancelReminder: (...args: unknown[]) => cancelReminderMock(...args),
  })),
}));

// 共通エラーハンドラの委譲を確認
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

// i18n を固定値化して期待値を安定させる
vi.mock("@/shared/locale/commandLocalizations", () => ({
  getCommandLocalizations: () => ({
    ja: "desc",
    localizations: { "en-US": "desc" },
  }),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: tDefaultMock,
  tGuild: tGuildMock,
}));

// メッセージ生成は簡易オブジェクト化
vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((message: string) => ({ message })),
  createInfoEmbed: vi.fn((message: string) => ({ message })),
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

// ログ出力の副作用を抑止
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { bumpReminderConfigCommand } from "@/bot/commands/bump-reminder-config";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";

type InteractionLike = {
  guildId: string | null;
  channelId: string;
  user: { id: string };
  guild?: {
    members: {
      fetch: Mock;
    };
  };
  memberPermissions: { has: Mock };
  options: {
    getSubcommand: Mock;
    getRole: Mock;
    getUser: Mock;
    getString: Mock;
  };
  reply: Mock;
  editReply: Mock;
};

// bump-reminder-config 検証用 interaction モック
function createInteraction(
  overrides?: Partial<InteractionLike>,
): InteractionLike {
  return {
    guildId: "guild-1",
    channelId: "channel-1",
    user: { id: "operator-1" },
    guild: {
      members: {
        fetch: vi.fn().mockResolvedValue(null),
      },
    },
    memberPermissions: { has: vi.fn(() => true) },
    options: {
      getSubcommand: vi.fn(() => "enable"),
      getRole: vi.fn(() => null),
      getUser: vi.fn(() => null),
      getString: vi.fn(() => null),
    },
    reply: vi.fn().mockResolvedValue({
      awaitMessageComponent: vi.fn(),
    }),
    editReply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/bump-reminder-config", () => {
  // ケースごとにモックを初期化する
  beforeEach(() => {
    vi.clearAllMocks();
    tGuildMock.mockResolvedValue("translated");
    cancelReminderMock.mockResolvedValue(undefined);
    setBumpReminderEnabledMock.mockResolvedValue(undefined);
    getBumpReminderConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: "role-1",
      mentionUserIds: ["user-2"],
    });
    setBumpReminderMentionRoleMock.mockResolvedValue("updated");
    addBumpReminderMentionUserMock.mockResolvedValue("added");
    clearBumpReminderMentionUsersMock.mockResolvedValue("cleared");
    clearBumpReminderMentionsMock.mockResolvedValue("cleared");
    removeBumpReminderMentionUserMock.mockResolvedValue("removed");
  });

  it("enable でバンプリマインダーが有効化されて success 応答が返されることを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "enable"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
    expect(setBumpReminderEnabledMock).toHaveBeenCalledWith(
      "guild-1",
      true,
      "channel-1",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("disable でアクティブなリマインダーが停止されてバンプリマインダーが無効化されることを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "disable"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(cancelReminderMock).toHaveBeenCalledWith("guild-1");
    expect(setBumpReminderEnabledMock).toHaveBeenCalledWith("guild-1", false);
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // 各サブコマンドの権限不足時にエラーハンドラへ委譲されることを検証
  it.each(["enable", "disable", "set-mention", "remove-mention", "view"])(
    "%s サブコマンドで権限不足の場合は handleCommandError へ委譲されることを確認",
    async (subcommand) => {
      const interaction = createInteraction({
        memberPermissions: { has: vi.fn(() => false) },
        options: {
          getSubcommand: vi.fn(() => subcommand),
          getRole: vi.fn(() => null),
          getUser: vi.fn(() => null),
          getString: vi.fn(() => "role"),
        },
      });

      await bumpReminderConfigCommand.execute(
        interaction as unknown as ChatInputCommandInteraction,
      );

      expect(handleCommandError).toHaveBeenCalledTimes(1);
    },
  );

  it("set-mention で role/user が未指定の場合はバリデーションエラーが委譲されることを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("set-mention でユーザーメンションが追加されることを確認", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("added");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: [],
      })
      .mockResolvedValueOnce(null);

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(addBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-9",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("set-mention で role のみ指定した場合に成功することを確認", async () => {
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("updated");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: ["user-1"],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: "role-7",
        mentionUserIds: ["user-1"],
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => ({ id: "role-7" })),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("set-mention で既に登録済みのユーザーを指定した場合はトグルで削除されることを確認", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("already_exists");
    removeBumpReminderMentionUserMock.mockResolvedValueOnce("removed");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: ["user-9"],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: [],
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(removeBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-9",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("set-mention でユーザー追加結果が not_configured の場合はエラーが委譲されることを確認", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("既存ユーザーのトグル削除結果が not_configured の場合はエラーが委譲されることを確認", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("already_exists");
    removeBumpReminderMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("set-mention で role 設定結果が not_configured の場合はエラーが委譲されることを確認", async () => {
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => ({ id: "role-7" })),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("set-mention で role と user を同時指定した場合に両方が設定されることを確認", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("added");
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("updated");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: [],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: ["user-9"],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: "role-7",
        mentionUserIds: ["user-9"],
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => ({ id: "role-7" })),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(addBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-9",
    );
    expect(setBumpReminderMentionRoleMock).toHaveBeenCalledWith(
      "guild-1",
      "role-7",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated\ntranslated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("view で設定が未登録の場合は info 応答が返されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ message: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("view で role と users が設定済みの場合に info 応答が返されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: false,
      channelId: "channel-1",
      mentionRoleId: "role-2",
      mentionUserIds: ["user-a", "user-b"],
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [
        {
          message: "",
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("view で role/users が未設定かつ enabled=true の場合に info 応答が返されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: [],
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [
        {
          message: "",
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("remove-mention target=role でロールメンションが解除されることを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "role"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(setBumpReminderMentionRoleMock).toHaveBeenCalledWith(
      "guild-1",
      undefined,
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("remove-mention target=role が未設定の場合は not_configured エラーが委譲されることを確認", async () => {
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "role"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(setBumpReminderMentionRoleMock).toHaveBeenCalledWith(
      "guild-1",
      undefined,
    );
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("remove-mention target=users で全ユーザーメンションが解除されることを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "users"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionUsersMock).toHaveBeenCalledWith("guild-1");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("remove-mention target=users が未設定の場合は not_configured エラーが委譲されることを確認", async () => {
    clearBumpReminderMentionUsersMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "users"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionUsersMock).toHaveBeenCalledWith("guild-1");
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("remove-mention target=all でロールとユーザーのメンションがまとめて解除されることを確認", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "all"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionsMock).toHaveBeenCalledWith("guild-1");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("remove-mention target=all が未設定の場合は not_configured エラーが委譲されることを確認", async () => {
    clearBumpReminderMentionsMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "all"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionsMock).toHaveBeenCalledWith("guild-1");
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("remove-mention target=user で登録ユーザーが空の場合はエラー応答が返されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: [],
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ message: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("remove-mention target=user で config が null の場合も空扱いでエラー応答が返されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ message: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("remove-mention target=user でコレクターがタイムアウトした場合は editReply でタイムアウトメッセージが表示されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a"],
    });

    const awaitMessageComponent = vi
      .fn()
      .mockRejectedValue(new Error("collector ended with reason: time"));
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(awaitMessageComponent).toHaveBeenCalledTimes(1);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "translated",
      components: [],
    });
  });

  it("remove-mention target=user で選択したユーザーが削除されて interaction が update されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a", "user-b"],
    });
    removeBumpReminderMentionUserMock
      .mockResolvedValueOnce("removed")
      .mockResolvedValueOnce("not_found");

    const updateMock = vi.fn().mockResolvedValue(undefined);
    const awaitMessageComponent = vi
      .fn()
      .mockImplementation(async (options: { filter: (i: any) => boolean }) => {
        expect(
          options.filter({
            customId: "bump-remove-users-guild-1",
            user: { id: "operator-1" },
          }),
        ).toBe(true);
        expect(
          options.filter({
            customId: "bump-remove-users-guild-1",
            user: { id: "other-user" },
          }),
        ).toBe(false);

        return {
          values: ["user-a", "user-b"],
          update: updateMock,
          user: { id: "operator-1" },
          customId: "bump-remove-users-guild-1",
        };
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      guild: {
        members: {
          fetch: vi.fn((id: string) => {
            if (id === "user-b") {
              return Promise.reject(new Error("member fetch failed"));
            }
            return Promise.resolve({
              displayName: `member-${id}`,
              user: { username: `user-${id}` },
            });
          }),
        },
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(awaitMessageComponent).toHaveBeenCalledTimes(1);
    expect(removeBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-a",
    );
    expect(removeBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-b",
    );
    expect(updateMock).toHaveBeenCalledWith({
      content: "",
      embeds: [{ description: "translated" }],
      components: [],
    });
  });

  it("remove-mention target=user でコレクターから DiscordAPIError が発生した場合は handleCommandError へ委譲されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a"],
    });

    const apiError = Object.create(
      DiscordAPIError.prototype,
    ) as DiscordAPIError;
    const awaitMessageComponent = vi.fn().mockRejectedValue(apiError);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("remove-mention target=user で予期しないコレクターエラーが発生した場合は handleCommandError へ委譲されることを確認", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a"],
    });

    const awaitMessageComponent = vi
      .fn()
      .mockRejectedValue(new Error("collector crashed"));
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });
});
