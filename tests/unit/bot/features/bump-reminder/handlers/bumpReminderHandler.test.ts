// tests/unit/bot/features/bump-reminder/handlers/bumpReminderHandler.test.ts
import { handleBumpDetected } from "@/bot/features/bump-reminder/handlers/bumpReminderHandler";
import { sendBumpPanel } from "@/bot/features/bump-reminder/handlers/usecases/sendBumpPanel";
import { sendBumpReminder } from "@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder";

const getBotBumpReminderConfigServiceMock = vi.fn();
const scheduleBumpReminderMock = vi.fn();
const getGuildTranslatorMock = vi.fn();
const tDefaultMock = vi.fn(
  (key: string, _options?: Record<string, unknown>) => key,
);
const createInfoEmbedMock = vi.fn(
  (description: string, opts?: { title?: string }) => ({
    description,
    title: opts?.title,
  }),
);

const loggerMock = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const getReminderDelayMinutesMock = vi.fn(() => 120);
const toScheduledAtMock = vi.fn(
  (_delayMinutes: number) => new Date("2026-02-20T01:00:00.000Z"),
);

const getBotBumpReminderRepositoryMock = vi.fn(() => ({
  findPendingByGuild: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  getBotBumpReminderConfigService: () => getBotBumpReminderConfigServiceMock(),
  getBotBumpReminderRepository: () => getBotBumpReminderRepositoryMock(),
}));

vi.mock(
  "@/bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder",
  () => ({
    scheduleBumpReminder: (...args: unknown[]) =>
      scheduleBumpReminderMock(...args),
  }),
);

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, options?: Record<string, unknown>) =>
    tDefaultMock(key, options),
}));

vi.mock("@/shared/locale/helpers", () => ({
  getGuildTranslator: (guildId: string) => getGuildTranslatorMock(guildId),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerMock.info(...args),
    debug: (...args: unknown[]) => loggerMock.debug(...args),
    warn: (...args: unknown[]) => loggerMock.warn(...args),
    error: (...args: unknown[]) => loggerMock.error(...args),
  },
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: (description: string, options?: { title?: string }) =>
    createInfoEmbedMock(description, options),
}));

vi.mock(
  "@/bot/features/bump-reminder/constants/bumpReminderConstants",
  async () => {
    const actual = await vi.importActual(
      "@/bot/features/bump-reminder/constants/bumpReminderConstants",
    );
    return {
      ...(actual as object),
      getReminderDelayMinutes: () => getReminderDelayMinutesMock(),
      toScheduledAt: (delayMinutes: number) => toScheduledAtMock(delayMinutes),
    };
  },
);

// bump-reminder handler の検知・パネル送信・通知送信の主要分岐を検証
describe("bot/features/bump-reminder/bumpReminderHandler", () => {
  // 各ケースのモック履歴を初期化し、前ケースの副作用を遮断する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // sendBumpPanel の送信条件分岐（text/sendable/例外）と payload 生成を検証
  describe("sendBumpPanel", () => {
    it("対象チャンネルがテキストベースでない場合は undefined を返す", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => false,
          }),
        },
      };

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBeUndefined();
    });

    it("チャンネルに送信不可の場合は undefined を返す", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => true,
            isSendable: () => false,
          }),
        },
      };

      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBeUndefined();
    });

    it("ローカライズされた embed を含むパネルメッセージを送信してメッセージ ID を返す", async () => {
      const sendMock = vi.fn().mockResolvedValue({ id: "panel-1" });
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => true,
            isSendable: () => true,
            send: sendMock,
          }),
        },
      };

      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBe("panel-1");
      expect(createInfoEmbedMock).toHaveBeenCalledWith(
        "events:bump-reminder.panel.scheduled_at",
        {
          title: "events:bump-reminder.panel.title",
        },
      );
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.any(Array),
          reply: { messageReference: "msg-1" },
        }),
      );
    });

    it("チャンネルフェッチが例外を投げた場合は undefined を返してログに記録する", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockRejectedValue(new Error("fetch failed")),
        },
      };

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBeUndefined();
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_panel_send_failed",
        expect.any(Error),
      );
    });
  });

  // sendBumpReminder の通知文生成・送信分岐・finally削除を検証
  describe("sendBumpReminder", () => {
    it("チャンネルがテキストベースでない場合は警告ログを出して返す", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => false,
          }),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn(),
      };

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(loggerMock.warn).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_channel_not_found",
      );
    });

    it("リマインダー設定が無効の場合は送信せず返す", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => true,
            isSendable: () => true,
            send: vi.fn(),
          }),
        },
      };
      const repository = {
        getBumpReminderConfigOrDefault: vi
          .fn()
          .mockResolvedValue({ enabled: false, mentionUserIds: [] }),
      };

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_disabled",
      );
    });

    it("ロール ID とユーザー ID からメンション文字列が構築され、サービス対応のフォーマットで送信されることを検証", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfigOrDefault: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: "role-1",
          mentionUserIds: ["u-1", "u-2"],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(sendMock).toHaveBeenCalledWith({
        content:
          "<@&role-1> <@u-1> <@u-2>\nevents:bump-reminder.reminder_message.disboard",
        reply: { messageReference: "msg-1" },
      });
    });

    it("未知のサービスの場合はリプライ参照なしでプレーンメッセージを送信する", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfigOrDefault: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        undefined,
        repository as never,
      );

      expect(sendMock).toHaveBeenCalledWith(
        "events:bump-reminder.reminder_message",
      );
    });

    it("サービスが DISSOKU の場合は Dissoku 用リマインダーメッセージを送信する", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfigOrDefault: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        "Dissoku",
        repository as never,
      );

      expect(sendMock).toHaveBeenCalledWith(
        "events:bump-reminder.reminder_message.dissoku",
      );
    });

    it("チャンネルに送信不可の場合はメッセージを送信しない", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => false,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfigOrDefault: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(sendMock).not.toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_sent",
      );
    });
  });

  // handleBumpDetected の検知有効性判定・リマインダー登録・失敗時補償を検証
  describe("handleBumpDetected", () => {
    it("バンプリマインダーが無効の場合は早期リターンする", async () => {
      getBotBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfigOrDefault: vi
          .fn()
          .mockResolvedValue({ enabled: false, mentionUserIds: [] }),
      });

      await handleBumpDetected(
        { channels: { fetch: vi.fn() } } as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_disabled",
      );
      expect(scheduleBumpReminderMock).not.toHaveBeenCalled();
    });

    it("設定されたチャンネルと一致しない場合は早期リターンする", async () => {
      getBotBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfigOrDefault: vi.fn().mockResolvedValue({
          enabled: true,
          channelId: "expected-ch",
          mentionUserIds: [],
        }),
      });

      await handleBumpDetected(
        { channels: { fetch: vi.fn() } } as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_unregistered_channel",
      );
      expect(scheduleBumpReminderMock).not.toHaveBeenCalled();
    });

    it("リマインダーをスケジュールし、成功時に検出ログを記録する", async () => {
      const configService = {
        getBumpReminderConfigOrDefault: vi
          .fn()
          .mockResolvedValue({ enabled: true, mentionUserIds: [] }),
      };
      getBotBumpReminderConfigServiceMock.mockReturnValue(configService);
      scheduleBumpReminderMock.mockResolvedValue(undefined);

      const sendMock = vi.fn().mockResolvedValue({ id: "panel-1" });
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await handleBumpDetected(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(scheduleBumpReminderMock).toHaveBeenCalledWith(
        client,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        configService,
        "panel-1",
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        "system:bump-reminder.detected",
      );
    });

    it("パネルが送信不可の場合は panelMessageId に undefined を渡す", async () => {
      const configService = {
        getBumpReminderConfigOrDefault: vi
          .fn()
          .mockResolvedValue({ enabled: true, mentionUserIds: [] }),
      };
      getBotBumpReminderConfigServiceMock.mockReturnValue(configService);
      scheduleBumpReminderMock.mockResolvedValue(undefined);

      const channel = {
        isTextBased: () => true,
        isSendable: () => false,
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await handleBumpDetected(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(scheduleBumpReminderMock).toHaveBeenCalledWith(
        client,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        configService,
        undefined,
      );
    });

    it("scheduleBumpReminder が例外を投げた場合にエラーをそのまま上に出さず、ログだけ残す補償処理を検証", async () => {
      getBotBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfigOrDefault: vi
          .fn()
          .mockResolvedValue({ enabled: true, mentionUserIds: [] }),
      });
      scheduleBumpReminderMock.mockRejectedValue(new Error("set failed"));

      const sendMock = vi.fn().mockResolvedValue({ id: "panel-1" });
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await handleBumpDetected(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:bump-reminder.detection_failed",
        expect.any(Error),
      );
    });
  });
});
