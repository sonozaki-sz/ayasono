-- CreateTable
CREATE TABLE "message_delete_user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "skip_confirm" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "message_delete_user_settings_guild_id_idx" ON "message_delete_user_settings"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_delete_user_settings_user_id_guild_id_key" ON "message_delete_user_settings"("user_id", "guild_id");
