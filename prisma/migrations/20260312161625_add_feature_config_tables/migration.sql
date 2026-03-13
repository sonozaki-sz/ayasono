-- CreateTable
CREATE TABLE "guild_afk_configs" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "channel_id" TEXT
);

-- MigrateData: guild_configs.afkConfig -> guild_afk_configs
INSERT INTO "guild_afk_configs" ("guild_id", "enabled", "channel_id")
SELECT
    "guildId",
    COALESCE(CAST(json_extract("afkConfig", '$.enabled') AS INTEGER), 0),
    json_extract("afkConfig", '$.channelId')
FROM "guild_configs"
WHERE "afkConfig" IS NOT NULL;

-- CreateTable
CREATE TABLE "guild_bump_reminder_configs" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "channel_id" TEXT,
    "mention_role_id" TEXT,
    "mention_user_ids" TEXT NOT NULL DEFAULT '[]'
);

-- MigrateData: guild_configs.bumpReminderConfig -> guild_bump_reminder_configs
INSERT INTO "guild_bump_reminder_configs" ("guild_id", "enabled", "channel_id", "mention_role_id", "mention_user_ids")
SELECT
    "guildId",
    COALESCE(CAST(json_extract("bumpReminderConfig", '$.enabled') AS INTEGER), 0),
    json_extract("bumpReminderConfig", '$.channelId'),
    json_extract("bumpReminderConfig", '$.mentionRoleId'),
    COALESCE(json_extract("bumpReminderConfig", '$.mentionUserIds'), '[]')
FROM "guild_configs"
WHERE "bumpReminderConfig" IS NOT NULL;

-- CreateTable
CREATE TABLE "guild_vac_configs" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "trigger_channel_ids" TEXT NOT NULL DEFAULT '[]',
    "created_channels" TEXT NOT NULL DEFAULT '[]'
);

-- MigrateData: guild_configs.vacConfig -> guild_vac_configs
INSERT INTO "guild_vac_configs" ("guild_id", "enabled", "trigger_channel_ids", "created_channels")
SELECT
    "guildId",
    COALESCE(CAST(json_extract("vacConfig", '$.enabled') AS INTEGER), 0),
    COALESCE(json_extract("vacConfig", '$.triggerChannelIds'), '[]'),
    COALESCE(json_extract("vacConfig", '$.createdChannels'), '[]')
FROM "guild_configs"
WHERE "vacConfig" IS NOT NULL;

-- CreateTable
CREATE TABLE "guild_member_log_configs" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "channel_id" TEXT,
    "join_message" TEXT,
    "leave_message" TEXT
);

-- MigrateData: guild_configs.memberLogConfig -> guild_member_log_configs
INSERT INTO "guild_member_log_configs" ("guild_id", "enabled", "channel_id", "join_message", "leave_message")
SELECT
    "guildId",
    COALESCE(CAST(json_extract("memberLogConfig", '$.enabled') AS INTEGER), 0),
    json_extract("memberLogConfig", '$.channelId'),
    json_extract("memberLogConfig", '$.joinMessage'),
    json_extract("memberLogConfig", '$.leaveMessage')
FROM "guild_configs"
WHERE "memberLogConfig" IS NOT NULL;

-- CreateTable
CREATE TABLE "guild_vc_recruit_configs" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mention_role_ids" TEXT NOT NULL DEFAULT '[]',
    "setups" TEXT NOT NULL DEFAULT '[]'
);

-- MigrateData: guild_configs.vcRecruitConfig -> guild_vc_recruit_configs
INSERT INTO "guild_vc_recruit_configs" ("guild_id", "enabled", "mention_role_ids", "setups")
SELECT
    "guildId",
    COALESCE(CAST(json_extract("vcRecruitConfig", '$.enabled') AS INTEGER), 0),
    COALESCE(json_extract("vcRecruitConfig", '$.mentionRoleIds'), '[]'),
    COALESCE(json_extract("vcRecruitConfig", '$.setups'), '[]')
FROM "guild_configs"
WHERE "vcRecruitConfig" IS NOT NULL;
