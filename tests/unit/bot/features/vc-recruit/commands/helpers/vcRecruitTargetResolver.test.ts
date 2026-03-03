// tests/unit/bot/features/vc-recruit/commands/helpers/vcRecruitTargetResolver.test.ts
import { resolveTargetCategory } from "@/bot/features/vc-recruit/commands/helpers/vcRecruitTargetResolver";
import { ChannelType } from "discord.js";

// ChannelType の数値をモック用に使用
const GUILD_CATEGORY = ChannelType.GuildCategory;
const GUILD_TEXT = ChannelType.GuildText;

/**
 * テスト用カテゴリーチャンネルモックを作成
 */
function makeCategoryChannel(id: string, name: string) {
  return { id, name, type: GUILD_CATEGORY };
}

/**
 * テスト用 Guild モックを作成
 */
function makeGuild(opts: {
  fetchChannelResult?: unknown;
  cacheChannels?: { id: string; name: string; type: number }[];
}) {
  return {
    channels: {
      fetch: vi.fn().mockResolvedValue(opts.fetchChannelResult ?? null),
      cache: {
        find: (predicate: (ch: { type: number; name: string }) => boolean) => {
          return (opts.cacheChannels ?? []).find(predicate) ?? undefined;
        },
      },
    },
  };
}

describe("bot/features/vc-recruit/commands/helpers/vcRecruitTargetResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // categoryOption が null のとき → 現在チャンネルの親カテゴリーを返す
  it("returns parent category of current channel when categoryOption is null", async () => {
    const parentCategory = makeCategoryChannel("cat-1", "ゲームカテゴリー");
    const currentChannel = {
      id: "text-ch-1",
      type: GUILD_TEXT,
      parent: parentCategory,
    };
    const guild = makeGuild({ fetchChannelResult: currentChannel });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      null,
    );
    expect(result).toEqual(parentCategory);
  });

  // categoryOption が null で現在チャンネルに親カテゴリーがない → null を返す
  it("returns null when current channel has no parent category", async () => {
    const currentChannel = {
      id: "text-ch-1",
      type: GUILD_TEXT,
      parent: null,
    };
    const guild = makeGuild({ fetchChannelResult: currentChannel });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      null,
    );
    expect(result).toBeNull();
  });

  // categoryOption が null で fetch に失敗した場合 → null を返す
  it("returns null when channel fetch fails for null option", async () => {
    const guild = makeGuild({ fetchChannelResult: null });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      null,
    );
    expect(result).toBeNull();
  });

  // categoryOption が "TOP"（大文字）→ null を返す（トップカテゴリー指定）
  it("returns null when categoryOption is TOP", async () => {
    const guild = makeGuild({});
    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      "TOP",
    );
    expect(result).toBeNull();
  });

  // categoryOption が "top"（小文字）→ null を返す（大文字小文字無視）
  it("returns null when categoryOption is top (lowercase)", async () => {
    const guild = makeGuild({});
    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      "top",
    );
    expect(result).toBeNull();
  });

  // categoryOption がカテゴリーID → ID で fetch した結果を返す
  it("returns category fetched by ID", async () => {
    const category = makeCategoryChannel("cat-42", "ゲームカテゴリー");
    const guild = makeGuild({ fetchChannelResult: category });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      "cat-42",
    );
    expect(result).toEqual(category);
  });

  // categoryOption がチャンネルIDだが GuildCategory ではない → 名前検索にフォールバック
  it("returns null when fetched channel is not a GuildCategory and not found by name", async () => {
    const textChannel = { id: "text-ch-99", type: GUILD_TEXT };
    const guild = makeGuild({
      fetchChannelResult: textChannel,
      cacheChannels: [],
    });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      "text-ch-99",
    );
    expect(result).toBeNull();
  });

  // categoryOption がカテゴリー名 → 名前検索で返す（大文字小文字無視）
  it("returns category found by name (case-insensitive)", async () => {
    const category = makeCategoryChannel("cat-1", "ゲームカテゴリー");
    const guild = makeGuild({
      fetchChannelResult: null,
      cacheChannels: [category],
    });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      "ゲームカテゴリー",
    );
    expect(result).toEqual(category);
  });

  // 名前検索は大文字小文字を無視する
  it("matches category name case-insensitively", async () => {
    const category = makeCategoryChannel("cat-1", "GameCategory");
    const guild = makeGuild({
      fetchChannelResult: null,
      cacheChannels: [category],
    });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      "gamecategory",
    );
    expect(result).toEqual(category);
  });

  // 何も見つからない場合 → null を返す
  it("returns null when nothing is found", async () => {
    const guild = makeGuild({
      fetchChannelResult: null,
      cacheChannels: [],
    });

    const result = await resolveTargetCategory(
      guild as never,
      "text-ch-1",
      "nonexistent",
    );
    expect(result).toBeNull();
  });
});
