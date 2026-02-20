// src/bot/features/vac/commands/vacCommand.constants.ts
// VAC コマンド定数

export const VAC_COMMAND = {
  NAME: "vac",
  SUBCOMMAND: {
    VC_RENAME: "vc-rename",
    VC_LIMIT: "vc-limit",
  },
  OPTION: {
    NAME: "name",
    LIMIT: "limit",
  },
  LIMIT_MIN: 0,
  LIMIT_MAX: 99,
} as const;
