/*
  Warnings:

  - You are about to drop the column `joinLeaveLogConfig` on the `guild_configs` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guild_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ja',
    "afkConfig" TEXT,
    "profChannelConfig" TEXT,
    "vacConfig" TEXT,
    "bumpReminderConfig" TEXT,
    "stickMessages" TEXT,
    "memberLogConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_guild_configs" ("afkConfig", "bumpReminderConfig", "createdAt", "guildId", "id", "locale", "profChannelConfig", "stickMessages", "updatedAt", "vacConfig") SELECT "afkConfig", "bumpReminderConfig", "createdAt", "guildId", "id", "locale", "profChannelConfig", "stickMessages", "updatedAt", "vacConfig" FROM "guild_configs";
DROP TABLE "guild_configs";
ALTER TABLE "new_guild_configs" RENAME TO "guild_configs";
CREATE UNIQUE INDEX "guild_configs_guildId_key" ON "guild_configs"("guildId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
