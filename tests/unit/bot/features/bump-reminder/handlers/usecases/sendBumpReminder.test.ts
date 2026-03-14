// tests/unit/bot/features/bump-reminder/handlers/usecases/sendBumpReminder.test.ts
// チャンネル状態・設定状態・サービス種別(Disboard/Dissoku)・パネルメッセージの有無など
// 多様な条件下でリマインダー送信ユースケースが正しく動作することを検証するテスト群
describe("bot/features/bump-reminder/handlers/usecases/sendBumpReminder", () => {
  const tDefaultMock = vi.fn((key: string) => key);
  const loggerMock = {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
  const getGuildTranslatorMock = vi.fn();
  const tGuildMock = vi.fn((key: string) => key);

  // vi.doMock を使う都合上、各テストでモジュールキャッシュをリセットして
  // 新しいモック定義が確実に適用された状態でインポートできるようにする
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getGuildTranslatorMock.mockResolvedValue(tGuildMock);

    vi.doMock("@/shared/utils/logger", () => ({ logger: loggerMock }));
    vi.doMock("@/shared/locale/localeManager", () => ({
      tDefault: tDefaultMock,
    }));
    vi.doMock("@/shared/locale/helpers", () => ({
      getGuildTranslator: getGuildTranslatorMock,
    }));
  });

  function makeChannel({
    isTextBased = true,
    isSendable = true,
    sendResult = undefined as unknown,
    messagesFetch = vi.fn().mockResolvedValue({ delete: vi.fn() }),
  } = {}) {
    return {
      isTextBased: vi.fn(() => isTextBased),
      isSendable: vi.fn(() => isSendable),
      send: vi.fn().mockResolvedValue(sendResult),
      messages: { fetch: messagesFetch },
    };
  }

  function makeClient(channel: ReturnType<typeof makeChannel> | null = null) {
    return {
      channels: {
        fetch: vi.fn().mockResolvedValue(channel),
      },
    };
  }

  function makeConfigService(config: unknown = { enabled: true }) {
    return {
      getBumpReminderConfigOrDefault: vi.fn().mockResolvedValue(config),
    };
  }

  it("sendBumpReminder 関数がエクスポートされていることを確認する", async () => {
    const module =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");

    expect(typeof module.sendBumpReminder).toBe("function");
  });

  it("チャンネルがテキストベースでない場合は警告ログを出して返す", async () => {
    const channel = makeChannel({ isTextBased: false });
    const client = makeClient(channel);
    const service = makeConfigService();

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      undefined,
      service as never,
    );

    expect(loggerMock.warn).toHaveBeenCalled();
    expect(service.getBumpReminderConfigOrDefault).not.toHaveBeenCalled();
  });

  it("設定が無効の場合はデバッグログを出して返す", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({ enabled: false });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      undefined,
      service as never,
    );

    expect(loggerMock.debug).toHaveBeenCalled();
    expect(channel.send).not.toHaveBeenCalled();
  });

  it("Disboard は bump 元メッセージへのリプライ形式で通知するため messageId が提供された場合に reply フィールドが含まれることを確認", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      "Disboard",
      service as never,
    );

    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({ reply: { messageReference: "msg-1" } }),
    );
    expect(loggerMock.info).toHaveBeenCalled();
  });

  it("Dissoku は messageId なしでリプライなしのプレーンメッセージを送信する", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Dissoku",
      service as never,
    );

    expect(channel.send).toHaveBeenCalledWith(expect.any(String));
    expect(loggerMock.info).toHaveBeenCalled();
  });

  it("serviceName が undefined の場合は汎用リマインダーメッセージを送信する", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      undefined,
      service as never,
    );

    expect(channel.send).toHaveBeenCalled();
  });

  it("ロールメンションと複数ユーザーメンションが Discord の書式（<@&...>, <@...>）で本文に含まれることを確認", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1", "user-2"],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Disboard",
      service as never,
    );

    const sentContent = channel.send.mock.calls[0][0] as string;
    expect(sentContent).toContain("<@&role-1>");
    expect(sentContent).toContain("<@user-1>");
    expect(sentContent).toContain("<@user-2>");
  });

  it("チャンネルがテキストベースの場合に finally で panelMessageId をクリーンアップする", async () => {
    const panelMsgDeleteMock = vi.fn().mockResolvedValue(undefined);
    const fetchMsgMock = vi
      .fn()
      .mockResolvedValue({ delete: panelMsgDeleteMock });
    const channel = makeChannel({ messagesFetch: fetchMsgMock });
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Disboard",
      service as never,
      "panel-msg-1",
    );

    expect(fetchMsgMock).toHaveBeenCalledWith("panel-msg-1");
    expect(panelMsgDeleteMock).toHaveBeenCalled();
    expect(loggerMock.debug).toHaveBeenCalled();
  });

  it("最初の fetch でテキストベース外チャンネルが返った場合でも finally でパネル削除用に再 fetch されることを検証", async () => {
    const panelMsgDeleteMock = vi.fn().mockResolvedValue(undefined);
    const textChannelForPanel = makeChannel({
      messagesFetch: vi.fn().mockResolvedValue({ delete: panelMsgDeleteMock }),
    });
    // First fetch returns non-text channel, second returns text channel
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeChannel({ isTextBased: false }))
      .mockResolvedValueOnce(textChannelForPanel);
    const client = { channels: { fetch: fetchMock } };
    const service = makeConfigService({ enabled: false });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Disboard",
      service as never,
      "panel-msg-1",
    );

    // Second fetch should be called for panel cleanup
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("パネルメッセージの削除に失敗した場合はデバッグログを記録する", async () => {
    const fetchMsgMock = vi.fn().mockRejectedValue(new Error("Not found"));
    const channel = makeChannel({ messagesFetch: fetchMsgMock });
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await expect(
      sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        "Disboard",
        service as never,
        "panel-msg-1",
      ),
    ).resolves.not.toThrow();

    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Error),
    );
  });

  it("finally での再フェッチが null を返した場合はパネルクリーンアップをスキップする", async () => {
    // 1回目フェッチ: テキスト以外 → try ブロックで warn して return
    // 2回目フェッチ: null（取得失敗） → ch?.isTextBased() が falsy → クリーンアップスキップ
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeChannel({ isTextBased: false }))
      .mockResolvedValueOnce(null);
    const client = { channels: { fetch: fetchMock } };
    const service = makeConfigService({ enabled: false });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Disboard",
      service as never,
      "panel-msg-1",
    );

    // 2回フェッチされ、かつ panel_deleted ログは記録されないことを確認
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(loggerMock.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("panel_deleted"),
    );
  });
});
