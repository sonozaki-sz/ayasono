-- CreateTable
CREATE TABLE "guild_reaction_role_panels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'toggle',
    "title" TEXT NOT NULL DEFAULT 'ロール選択',
    "description" TEXT NOT NULL DEFAULT 'ボタンを押してロールを取得・解除できます。',
    "color" TEXT NOT NULL DEFAULT '#00A8F3',
    "buttons" TEXT NOT NULL DEFAULT '[]',
    "button_counter" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "guild_reaction_role_panels_guild_id_idx" ON "guild_reaction_role_panels"("guild_id");
