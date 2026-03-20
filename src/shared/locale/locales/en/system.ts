// src/shared/locale/locales/en/system.ts
// System message translations (English)

export const system = {
  // Log prefixes
  // Feature/event names auto-prepended by logPrefixed() helper
  "log_prefix.bot": "Bot",
  "log_prefix.bump_reminder": "BumpReminder",
  "log_prefix.sticky_message": "StickyMessage",
  "log_prefix.member_log": "MemberLog",
  "log_prefix.vac": "VAC",
  "log_prefix.vc_recruit": "VcRecruit",
  "log_prefix.msg_del": "MsgDel",
  "log_prefix.afk": "AFK",
  "log_prefix.database": "DB",
  "log_prefix.cooldown": "Cooldown",
  "log_prefix.scheduler": "Scheduler",
  "log_prefix.web": "Web",
  "log_prefix.json": "JSON",
  "log_prefix.interaction_create": "interactionCreate",
  "log_prefix.guild_member_add": "guildMemberAdd",
  "log_prefix.guild_member_remove": "guildMemberRemove",
  "log_prefix.message_create": "messageCreate",
  "log_prefix.message_delete": "messageDelete",
  "log_prefix.voice_state_update": "voiceStateUpdate",
  "log_prefix.channel_delete": "channelDelete",
  "log_prefix.ready": "ready",

  // Bot startup & shutdown
  // High-level lifecycle logs emitted from process startup/teardown paths
  "bot.starting":
    "Starting Discord Bot...",
  "bot.commands.registering":
    "Registering {{count}} commands...",
  "bot.commands.registered":
    "Commands registered",
  "bot.commands.command_registered":
    "  ✓ /{{name}}",
  "bot.events.registering":
    "Registering {{count}} events...",
  "bot.events.registered":
    "Events registered",
  "bot.startup.error":
    "Error during bot startup:",
  "bot.startup.failed":
    "Bot startup failed:",
  "bot.client.initialized":
    "Discord Bot client initialized",
  "bot.client.shutting_down":
    "Shutting down bot client...",
  "bot.client.shutdown_complete":
    "Bot client shut down successfully",
  "bot.presence_activity":
    "growin' up~ | {{count}} servers | by sonozaki",

  // BumpReminder feature logs
  "bump-reminder.detected":
    "bump detected GuildId: {{guildId}} Service: {{service}}",
  "bump-reminder.detection_failed":
    "failed to handle bump detection GuildId: {{guildId}}",
  // Bump panel button operation logs
  "bump-reminder.panel_mention_updated":
    "mention {{action}} UserId: {{userId}} GuildId: {{guildId}}",
  "bump-reminder.panel_handle_failed":
    "Failed to handle panel button",
  "bump-reminder.panel_reply_failed":
    "Failed to send error reply for panel button",
  // BumpReminder admin command operation logs
  "bump-reminder.config_enabled":
    "enabled GuildId: {{guildId}} ChannelId: {{channelId}}",
  "bump-reminder.config_disabled":
    "disabled GuildId: {{guildId}}",
  "bump-reminder.config_mention_set":
    "mention role set GuildId: {{guildId}} RoleId: {{roleId}}",
  "bump-reminder.config_mention_removed":
    "mention settings removed GuildId: {{guildId}} Target: {{target}}",
  "bump-reminder.config_users_removed":
    "mention users removed GuildId: {{guildId}} UserIds: {{userIds}}",

  // Error handling
  // Generic process-level failure and cleanup traces
  "error.reply_failed":
    "Failed to send error message",
  "error.unhandled_rejection":
    "Unhandled Promise rejection:",
  "error.uncaught_exception":
    "Uncaught exception:",
  "error.unhandled_rejection_log":
    "Unhandled Promise Rejection:",
  "error.uncaught_exception_log":
    "Uncaught Exception:",
  "error.node_warning":
    "Node Warning:",
  "error.global_handlers_already_registered":
    "Global error handlers already registered, skipping.",
  "error.shutdown_handlers_already_registered":
    "Graceful shutdown handlers already registered, skipping.",

  // Locale
  "locale.manager_initialized":
    "LocaleManager initialized with i18next",

  // Cooldown manager
  "cooldown.cleared_all":
    "All cooldowns cleared",
  "cooldown.destroyed":
    "CooldownManager destroyed",
  "cooldown.reset":
    "Reset CommandName: {{commandName}} UserId: {{userId}}",
  "cooldown.cleared_for_command":
    "Cleared all for command CommandName: {{commandName}}",
  "cooldown.cleanup":
    "Removed {{count}} expired cooldowns",

  // Scheduler
  // Generic job lifecycle logs
  // Common scheduler traces shared by reminder and other jobs
  // `scheduler.*` is consumed across both runtime scheduler and startup restoration
  "scheduler.stopping":
    "Stopping all scheduled jobs...",
  "scheduler.job_exists":
    "Job already exists, removing old job JobId: {{jobId}}",
  "scheduler.executing_job":
    "Executing job JobId: {{jobId}}",
  "scheduler.job_completed":
    "Job completed JobId: {{jobId}}",
  "scheduler.job_error":
    "Job error JobId: {{jobId}}",
  "scheduler.schedule_failed":
    "Failed to schedule job JobId: {{jobId}}",
  "scheduler.job_removed":
    "Job removed JobId: {{jobId}}",
  "scheduler.job_stopped":
    "Job stopped JobId: {{jobId}}",
  "scheduler.job_scheduled":
    "Job scheduled JobId: {{jobId}}",
  // Bump reminder scheduling / restoration logs
  // Keys below are intentionally split by lifecycle: schedule / execute / restore / panel-cleanup
  "scheduler.bump_reminder_task_failed":
    "Task failed GuildId: {{guildId}}",
  "scheduler.bump_reminder_description":
    "GuildId: {{guildId}} ExecuteAt: {{executeAt}}",
  "scheduler.bump_reminder_scheduled":
    "Scheduled reminder in {{minutes}} minutes GuildId: {{guildId}}",
  "scheduler.bump_reminder_cancelling":
    "Cancelling existing reminder GuildId: {{guildId}}",
  "scheduler.bump_reminder_cancelled":
    "Reminder cancelled GuildId: {{guildId}}",
  "scheduler.bump_reminder_executing_immediately":
    "Executing overdue reminder immediately GuildId: {{guildId}}",
  "scheduler.bump_reminders_restored":
    "Restored {{count}} pending reminders",
  "scheduler.bump_reminders_restored_none":
    "No pending reminders to restore",
  "scheduler.bump_reminder_sent":
    "Reminder sent GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_send_failed":
    "Reminder send failed GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_channel_not_found":
    "Channel not found GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_disabled":
    "Disabled GuildId: {{guildId}}",
  "scheduler.bump_reminder_restore_failed":
    "Failed to restore:",
  "scheduler.bump_reminder_duplicates_cancelled":
    "Cancelled {{count}} duplicate reminders",
  "scheduler.bump_reminder_duplicates_none":
    "No duplicate reminders to cancel",
  // Panel synchronization and channel consistency logs
  // Keep panel-related keys contiguous to simplify grep-based incident review
  "scheduler.bump_reminder_unregistered_channel":
    "Skipping unregistered channel GuildId: {{guildId}} ChannelId: {{channelId}} ExpectedChannelId: {{expectedChannelId}}",
  "scheduler.bump_reminder_orphaned_panel_delete_failed":
    "Failed to delete orphaned panel message PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_deleted":
    "Deleted panel message GuildId: {{guildId}} PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_delete_failed":
    "Failed to delete panel message PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_send_failed":
    "Failed to send panel",

  // Shutdown
  "shutdown.signal_received":
    "{{signal}} received, shutting down gracefully...",
  "shutdown.already_in_progress":
    "{{signal}} received, but shutdown is already in progress.",
  "shutdown.cleanup_complete":
    "Cleanup completed",
  "shutdown.cleanup_failed":
    "Error during cleanup:",
  "shutdown.gracefully":
    "Shutting down gracefully...",
  "shutdown.sigterm":
    "Received SIGTERM, shutting down...",

  // Database operation logs
  // Prisma client availability
  "database.prisma_not_available":
    "Prisma client is not available",
  // GuildConfig operation logs
  // Key-value style persistence logs for guild-scoped config
  "database.get_config_log":
    "Failed to get config GuildId: {{guildId}}",
  "database.save_config_log":
    "Failed to save config GuildId: {{guildId}}",
  "database.saved_config":
    "Config saved GuildId: {{guildId}}",
  "database.update_config_log":
    "Failed to update config GuildId: {{guildId}}",
  "database.updated_config":
    "Config updated GuildId: {{guildId}}",
  "database.delete_config_log":
    "Failed to delete config GuildId: {{guildId}}",
  "database.deleted_config":
    "Config deleted GuildId: {{guildId}}",
  "database.check_existence_log":
    "Failed to check existence GuildId: {{guildId}}",

  // Bump Reminder database operations
  // BumpReminder table operation logs
  // Persistence lifecycle logs for reminder records
  "database.bump_reminder_created":
    "Bump reminder created Id: {{id}} GuildId: {{guildId}}",
  "database.bump_reminder_create_failed":
    "Failed to create bump reminder GuildId: {{guildId}}",
  "database.bump_reminder_find_failed":
    "Failed to find bump reminder Id: {{id}}",
  "database.bump_reminder_find_all_failed":
    "Failed to find pending bump reminders",
  "database.bump_reminder_status_updated":
    "Bump reminder status updated Id: {{id}} Status: {{status}}",
  "database.bump_reminder_update_failed":
    "Failed to update bump reminder Id: {{id}}",
  "database.bump_reminder_deleted":
    "Bump reminder deleted Id: {{id}}",
  "database.bump_reminder_delete_failed":
    "Failed to delete bump reminder Id: {{id}}",
  "database.bump_reminder_cancelled_by_guild":
    "Cancelled pending bump reminders GuildId: {{guildId}}",
  "database.bump_reminder_cancelled_by_channel":
    "Cancelled pending bump reminders GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.bump_reminder_cancel_failed":
    "Failed to cancel bump reminders GuildId: {{guildId}}",
  "database.bump_reminder_cleanup_completed":
    "Cleaned up {{count}} old bump reminders older than {{days}} days",
  "database.bump_reminder_cleanup_failed":
    "Failed to cleanup old bump reminders:",

  // Sticky message database operations
  // StickyMessage table operation logs
  "database.sticky_message_find_by_channel_failed":
    "Failed to find sticky message ChannelId: {{channelId}}",
  "database.sticky_message_find_all_by_guild_failed":
    "Failed to find all sticky messages GuildId: {{guildId}}",
  "database.sticky_message_create_failed":
    "Failed to create sticky message GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.sticky_message_update_last_message_id_failed":
    "Failed to update sticky message lastMessageId Id: {{id}}",
  "database.sticky_message_update_content_failed":
    "Failed to update sticky message content Id: {{id}}",
  "database.sticky_message_delete_failed":
    "Failed to delete sticky message Id: {{id}}",
  "database.sticky_message_delete_by_channel_failed":
    "Failed to delete sticky message by channel ChannelId: {{channelId}}",

  // UserSetting DB operations
  // user_settings table operation logs
  "database.user_setting_find_failed":
    "Failed to find user setting UserId: {{userId}} GuildId: {{guildId}}",
  "database.user_setting_upsert_failed":
    "Failed to upsert user setting UserId: {{userId}} GuildId: {{guildId}}",

  // VAC database operation logs
  "database.vac_trigger_added":
    "VAC trigger channel added GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_add_failed":
    "Failed to add VAC trigger channel GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_removed":
    "VAC trigger channel removed GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_remove_failed":
    "Failed to remove VAC trigger channel GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_channel_registered":
    "VAC managed channel registered GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_register_failed":
    "Failed to register VAC managed channel GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_unregistered":
    "VAC managed channel unregistered GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_unregister_failed":
    "Failed to unregister VAC managed channel GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",

  // AFK database operation logs
  "database.afk_channel_set":
    "AFK channel set GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.afk_channel_set_failed":
    "Failed to set AFK channel GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.afk_config_saved":
    "AFK config saved GuildId: {{guildId}}",
  "database.afk_config_save_failed":
    "Failed to save AFK config GuildId: {{guildId}}",

  // Bot startup event logs
  // Human-readable startup summary logs
  // These are mostly operator-facing summary lines on ready
  "ready.bot_ready":
    "✅ Bot is ready! Logged in as {{tag}}",
  "ready.servers":
    "📊 Servers: {{count}}",
  "ready.users":
    "👥 Users: {{count}}",
  "ready.commands":
    "💬 Commands: {{count}}",
  "ready.event_registered":
    "  ✓ {{name}}",

  // Interaction event logs
  // Command/modal/button/select execution traces
  // Unified interaction execution and failure logs
  // Keep interaction keys contiguous because handlers share common error paths
  "interaction.unknown_command":
    "Unknown command CommandName: {{commandName}}",
  "interaction.command_executed":
    "Command executed CommandName: {{commandName}} UserId: {{userId}}",
  "interaction.command_error":
    "Command error CommandName: {{commandName}}",
  "interaction.autocomplete_error":
    "Autocomplete error CommandName: {{commandName}}",
  "interaction.unknown_modal":
    "Unknown modal CustomId: {{customId}}",
  "interaction.modal_submitted":
    "Modal submitted CustomId: {{customId}} UserId: {{userId}}",
  "interaction.modal_error":
    "Modal error CustomId: {{customId}}",
  "interaction.button_error":
    "Button error CustomId: {{customId}}",
  "interaction.select_menu_error":
    "Select menu error CustomId: {{customId}}",

  // Sticky message feature logs
  // Runtime logs from handler and service layers
  "sticky-message.channel_delete_cleanup":
    "Cleaned up on channel delete ChannelId: {{channelId}}",
  "sticky-message.channel_delete_cleanup_failed":
    "Failed to delete record on channel delete ChannelId: {{channelId}}",
  "sticky-message.create_handler_error":
    "messageCreate handler error ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.resend_scheduled_error":
    "Resend scheduled error",
  "sticky-message.send_failed":
    "Failed to send message ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.previous_deleted_or_not_found":
    "Previous message already deleted or not found ChannelId: {{channelId}}",
  "sticky-message.set_failed":
    "Failed to set via modal ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.set_embed_failed":
    "Failed to set via embed modal ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.update_failed":
    "Failed to update via modal ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.update_embed_failed":
    "Failed to update via embed modal ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.resend_after_update_failed":
    "Failed to resend after update ChannelId: {{channelId}}",
  "sticky-message.resend_after_embed_update_failed":
    "Failed to resend after embed update ChannelId: {{channelId}}",

  // AFK command logs
  "afk.moved":
    "moved user to AFK channel GuildId: {{guildId}} UserId: {{userId}} ChannelId: {{channelId}}",
  "afk.configured":
    "channel configured GuildId: {{guildId}} ChannelId: {{channelId}}",

  // VAC logs
  // Voice-state / channel lifecycle / panel operation logs
  // Keep VAC runtime keys grouped for easier operator triage during incidents
  // VAC startup cleanup logs
  "vac.startup_cleanup_stale_trigger_removed":
    "Startup cleanup: removed stale trigger channel GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.startup_cleanup_orphaned_channel_removed":
    "Startup cleanup: removed orphaned VAC channel from DB GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.startup_cleanup_empty_channel_deleted":
    "Startup cleanup: deleted empty VAC channel GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.startup_cleanup_done":
    "Startup cleanup done: removed {{removedTriggers}} triggers and {{removedChannels}} channels",
  "vac.startup_cleanup_done_none":
    "Startup cleanup done No inconsistencies found",
  "vac.voice_state_update_failed":
    "Failed to process voiceStateUpdate",
  "vac.channel_created":
    "channel created GuildId: {{guildId}} ChannelId: {{channelId}} OwnerId: {{ownerId}}",
  "vac.channel_deleted":
    "channel deleted GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.category_full":
    "category reached channel limit GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vac.trigger_removed_by_delete":
    "removed deleted trigger channel from config GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.channel_delete_sync_failed":
    "Failed to sync config on channelDelete",
  "vac.panel_send_failed":
    "Failed to send control panel",
  "vac.startup_cleanup_failed":
    "Startup cleanup failed",

  // Web server
  // Startup and exception handling
  // HTTP process and request pipeline logs for the web module
  "web.server_started":
    "Started URL: {{url}}",
  "web.startup_error":
    "Startup error:",
  "web.unhandled_rejection":
    "Unhandled Promise rejection:",
  "web.uncaught_exception":
    "Uncaught exception:",
  "web.startup_failed":
    "Startup failed:",
  "web.api_error":
    "API Error:",
  "web.internal_server_error":
    "Internal Server Error",
  // API authentication (Bearer API key)
  // Request-level auth result logs and user-facing messages
  "web.auth_unauthorized":
    "[Auth] Unauthorized request Method: {{method}} URL: {{url}}",
  "web.auth_invalid_token":
    "[Auth] Invalid token Method: {{method}} URL: {{url}}",
  "web.auth_unauthorized_error":
    "Unauthorized",
  "web.auth_forbidden_error":
    "Forbidden",
  // Missing/invalid Authorization header guidance
  "web.auth_header_required":
    "Authorization: Bearer <api-key> header is required",
  "web.auth_invalid_token_message":
    "Invalid token",

  // Discord error notification
  "discord.error_notification_title":
    "🚨 {{appName}} Error Notification",

  // Member log feature logs
  // guildMemberAdd/Remove event processing outcome logs
  "member-log.join_notification_sent":
    "join notification sent GuildId: {{guildId}} UserId: {{userId}}",
  "member-log.leave_notification_sent":
    "leave notification sent GuildId: {{guildId}} UserId: {{userId}}",
  "member-log.notification_failed":
    "failed to send notification GuildId: {{guildId}}",
  "member-log.channel_not_found":
    "channel not found GuildId: {{guildId}} ChannelId: {{channelId}}",
  "member-log.channel_deleted_config_cleared":
    "channel deleted, config cleared GuildId: {{guildId}} ChannelId: {{channelId}}",
  // Config command operation logs
  "member-log.config_set_channel":
    "channel configured GuildId: {{guildId}} ChannelId: {{channelId}}",
  "member-log.config_enabled":
    "enabled GuildId: {{guildId}}",
  "member-log.config_disabled":
    "disabled GuildId: {{guildId}}",
  "member-log.config_join_message_set":
    "join message set GuildId: {{guildId}}",
  "member-log.config_leave_message_set":
    "leave message set GuildId: {{guildId}}",
  "member-log.config_join_message_cleared":
    "join message cleared GuildId: {{guildId}}",
  "member-log.config_leave_message_cleared":
    "leave message cleared GuildId: {{guildId}}",

  // Translation system
  "locale.translation_failed":
    "Translation failed for key: {{key}}",

  // Error utilities
  "error.base_error_log":
    "[{{errorName}}] {{message}}",
  "error.unhandled_error_log":
    "[UnhandledError] {{message}}",

  // JSON utilities
  "json.parse_array_failed":
    "parseJsonArray: failed to parse, returning empty array. value=\"{{value}}\" error=\"{{error}}\"",

  // VC Recruit feature logs
  "vc-recruit.voice_state_update_failed":
    "Failed to process voiceStateUpdate",
  "vc-recruit.empty_vc_deleted":
    "Deleted empty VC GuildId: {{guildId}} ChannelId: {{channelId}} ChannelName: {{channelName}}",
  "vc-recruit.voice_state_update_error":
    "voiceStateUpdate processing error",
  "vc-recruit.panel_channel_delete_detected":
    "Panel channel deletion detected, deleting post channel and setup GuildId: {{guildId}} PanelChannelId: {{panelChannelId}}",
  "vc-recruit.post_channel_delete_failed":
    "Failed to delete post channel GuildId: {{guildId}} PostChannelId: {{postChannelId}}",
  "vc-recruit.post_channel_delete_detected":
    "Post channel deletion detected, deleting panel channel and setup GuildId: {{guildId}} PostChannelId: {{postChannelId}}",
  "vc-recruit.panel_channel_cleanup_failed":
    "Failed to delete panel channel GuildId: {{guildId}} PanelChannelId: {{panelChannelId}}",
  "vc-recruit.created_vc_manual_delete_detected":
    "Created VC manual deletion detected, updating DB and marking post button as ended GuildId: {{guildId}} VcId: {{vcId}}",
  "vc-recruit.channel_created":
    "new VC created GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vc-recruit.channel_deleted":
    "VC deleted GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vc-recruit.recruit_posted":
    "recruit message posted GuildId: {{guildId}} UserId: {{userId}}",
  "vc-recruit.setup_created":
    "setup created GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vc-recruit.setup_removed":
    "setup removed GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vc-recruit.panel_delete_detected":
    "panel message deletion detected, resending panel GuildId: {{guildId}} PanelChannelId: {{panelChannelId}} MessageId: {{messageId}}",
  "vc-recruit.panel_resent":
    "panel message resent GuildId: {{guildId}} PanelChannelId: {{panelChannelId}} NewMessageId: {{newMessageId}}",

  // Message Delete feature logs
  "message-delete.cmd_all_channels_start":
    "fetching all channels",
  "message-delete.cmd_channel_count":
    "channel count={{count}}",
  "message-delete.svc_scan_start":
    "scan start channels={{channelCount}} count={{count}} targetUserIds={{targetUserIds}}",
  "message-delete.svc_initial_fetch":
    "initial fetch ch={{channelId}}",
  "message-delete.svc_refill":
    "refill ch={{channelId}} before={{lastId}}",
  "message-delete.svc_scan_complete":
    "scan complete total={{count}}",
  "message-delete.svc_channel_no_access":
    "channel {{channelId}} skipped (no access)",
  "message-delete.svc_bulk_delete_chunk":
    "bulkDelete chunk size={{size}}",
  "message-delete.svc_message_delete_failed":
    "failed to delete messageId={{messageId}}: {{error}}",
  "message-delete.scan_error":
    "scan error: {{error}}",
  "message-delete.delete_error":
    "delete error: {{error}}",
  "message-delete.deleted":
    "{{userId}} deleted {{count}} messages{{countPart}}{{targetPart}}{{keywordPart}}{{periodPart}} channels=[{{channels}}]",
  "message-delete.lock_acquired":
    "lock acquired: guild={{guildId}}",
  "message-delete.lock_released":
    "lock released: guild={{guildId}}",
  "message-delete.cancel_collector_ended":
    "Scan cancelCollector ended: reason={{reason}}",
  "message-delete.aborting_non_user_end":
    "Aborting scan due to non-user end",
} as const;

export type SystemTranslations = typeof system;
