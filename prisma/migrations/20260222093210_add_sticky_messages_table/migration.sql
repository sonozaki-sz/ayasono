/*
  Warnings:

  - You are about to drop the column `profChannelConfig` on the `guild_configs` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "sticky_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embed_data" TEXT,
    "last_message_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guild_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ja',
    "afkConfig" TEXT,
    "vacConfig" TEXT,
    "bumpReminderConfig" TEXT,
    "stickMessages" TEXT,
    "memberLogConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_guild_configs" ("afkConfig", "bumpReminderConfig", "createdAt", "guildId", "id", "locale", "memberLogConfig", "stickMessages", "updatedAt", "vacConfig") SELECT "afkConfig", "bumpReminderConfig", "createdAt", "guildId", "id", "locale", "memberLogConfig", "stickMessages", "updatedAt", "vacConfig" FROM "guild_configs";
DROP TABLE "guild_configs";
ALTER TABLE "new_guild_configs" RENAME TO "guild_configs";
CREATE UNIQUE INDEX "guild_configs_guildId_key" ON "guild_configs"("guildId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "sticky_messages_channel_id_key" ON "sticky_messages"("channel_id");

-- CreateIndex
CREATE INDEX "sticky_messages_guild_id_idx" ON "sticky_messages"("guild_id");
