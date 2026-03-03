// tests/unit/bot/utils/categoryAutocomplete.test.ts
import { respondCategoryAutocomplete } from "@/bot/utils/categoryAutocomplete";
import { ChannelType } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((_key: string) => "TOP"),
}));

const COMMAND = "test-command";
const SUBCOMMANDS = ["setup", "teardown"] as const;
const OPTS = {
  commandName: COMMAND,
  subcommands: SUBCOMMANDS,
  topLocaleKey: "commands:vc-recruit-config.setup.category.top" as const,
  topValue: "TOP",
};

type CategoryLike = { id: string; name: string; type: ChannelType };

function createCache(items: CategoryLike[]) {
  return {
    filter: (predicate: (item: CategoryLike) => boolean) => ({
      map: <T>(mapper: (item: CategoryLike) => T) =>
        items.filter(predicate).map(mapper),
    }),
  };
}

describe("bot/utils/categoryAutocomplete", () => {
  it("responds empty when command name does not match", async () => {
    const respond = vi.fn();
    const interaction = {
      commandName: "other-command",
      options: {
        getSubcommand: vi.fn(() => "setup"),
        getFocused: vi.fn(() => ""),
      },
      guild: null,
      respond,
    };

    await respondCategoryAutocomplete(interaction as never, OPTS);

    expect(respond).toHaveBeenCalledWith([]);
  });

  it("responds empty when subcommand is not in the allowed list", async () => {
    const respond = vi.fn();
    const interaction = {
      commandName: COMMAND,
      options: {
        getSubcommand: vi.fn(() => "view"),
        getFocused: vi.fn(() => ""),
      },
      guild: null,
      respond,
    };

    await respondCategoryAutocomplete(interaction as never, OPTS);

    expect(respond).toHaveBeenCalledWith([]);
  });

  it("responds empty when guild context is missing", async () => {
    const respond = vi.fn();
    const interaction = {
      commandName: COMMAND,
      options: {
        getSubcommand: vi.fn(() => "setup"),
        getFocused: vi.fn(() => ""),
      },
      guild: null,
      respond,
    };

    await respondCategoryAutocomplete(interaction as never, OPTS);

    expect(respond).toHaveBeenCalledWith([]);
  });

  it("returns TOP and matching categories with case-insensitive filtering", async () => {
    const respond = vi.fn();
    const interaction = {
      commandName: COMMAND,
      options: {
        getSubcommand: vi.fn(() => "setup"),
        getFocused: vi.fn(() => "ga"),
      },
      guild: {
        channels: {
          cache: createCache([
            { id: "cat-1", name: "Game", type: ChannelType.GuildCategory },
            { id: "cat-2", name: "General", type: ChannelType.GuildCategory },
            { id: "text-1", name: "chat", type: ChannelType.GuildText },
          ]),
        },
      },
      respond,
    };

    await respondCategoryAutocomplete(interaction as never, OPTS);

    expect(respond).toHaveBeenCalledWith([{ name: "Game", value: "cat-1" }]);
  });

  it("includes TOP choice when focused text matches topLabel", async () => {
    const respond = vi.fn();
    const interaction = {
      commandName: COMMAND,
      options: {
        getSubcommand: vi.fn(() => "teardown"),
        getFocused: vi.fn(() => "top"),
      },
      guild: {
        channels: {
          cache: createCache([
            { id: "cat-1", name: "Game", type: ChannelType.GuildCategory },
          ]),
        },
      },
      respond,
    };

    await respondCategoryAutocomplete(interaction as never, OPTS);

    const choices = respond.mock.calls[0][0] as Array<{
      name: string;
      value: string;
    }>;
    expect(choices).toContainEqual({ name: "TOP", value: "TOP" });
  });

  it("limits autocomplete choices to 25", async () => {
    const respond = vi.fn();
    const categories = Array.from({ length: 30 }, (_, i) => ({
      id: `cat-${i}`,
      name: `Category-${i}`,
      type: ChannelType.GuildCategory,
    }));

    const interaction = {
      commandName: COMMAND,
      options: {
        getSubcommand: vi.fn(() => "setup"),
        getFocused: vi.fn(() => ""),
      },
      guild: { channels: { cache: createCache(categories) } },
      respond,
    };

    await respondCategoryAutocomplete(interaction as never, OPTS);

    const choices = respond.mock.calls[0][0] as Array<{
      name: string;
      value: string;
    }>;
    expect(choices).toHaveLength(25);
    expect(choices[0]).toEqual({ name: "TOP", value: "TOP" });
  });
});
