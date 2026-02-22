-- CreateTable
CREATE TABLE "guild_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ja',
    "afkConfig" TEXT,
    "profChannelConfig" TEXT,
    "vacConfig" TEXT,
    "bumpReminderConfig" TEXT,
    "stickMessages" TEXT,
    "leaveMemberLogConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_configs_guildId_key" ON "guild_configs"("guildId");
