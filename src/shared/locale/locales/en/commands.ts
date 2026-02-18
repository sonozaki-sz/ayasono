// src/shared/locale/locales/en/commands.ts
// Command-related translations (English)

export const commands = {
  // Ping command
  "ping.description": "Check bot response speed",
  "ping.embed.measuring": "🏓 Measuring...",
  "ping.embed.response":
    "📡 API Latency: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // Cooldown
  "cooldown.wait": "⏱️ You can use this command in **{{seconds}} seconds**",

  // AFK command
  "afk.description": "Move user to AFK channel",
  "afk.user.description": "User to move (default: yourself)",
  "afk.embed.moved": "Moved {{user}} to {{channel}}",

  // AFK config command
  "afk-config.description": "Configure AFK feature (administrators only)",
  "afk-config.set-ch.description": "Configure AFK channel",
  "afk-config.set-ch.channel.description": "AFK channel (voice channel)",
  "afk-config.show.description": "Show current settings",
  "afk-config.embed.title": "AFK",
  "afk-config.embed.set_ch_success": "AFK channel configured: {{channel}}",
  "afk-config.embed.not_configured": "AFK channel is not configured",
  "afk-config.embed.field.channel": "AFK Channel",

  // Bump Reminder config command (Discord UI labels)
  "bump-reminder-config.description":
    "Configure bump reminder (administrators only)",
  "bump-reminder-config.enable.description": "Enable bump reminder feature",
  "bump-reminder-config.disable.description": "Disable bump reminder feature",
  "bump-reminder-config.set-mention.description": "Set mention role or user",
  "bump-reminder-config.set-mention.role.description":
    "Role to mention in reminders",
  "bump-reminder-config.set-mention.user.description":
    "User to mention in reminders (toggle add/remove)",
  "bump-reminder-config.remove-mention.description": "Remove mention settings",
  "bump-reminder-config.remove-mention.target.description": "Target to remove",
  "bump-reminder-config.remove-mention.target.role": "Role setting",
  "bump-reminder-config.remove-mention.target.user": "User (with selection UI)",
  "bump-reminder-config.remove-mention.target.users": "All users",
  "bump-reminder-config.remove-mention.target.all": "Role + All users",
  "bump-reminder-config.show.description": "Show current settings",

  // Bump Reminder config command responses
  "bump-reminder-config.embed.success_title": "Settings Updated",
  "bump-reminder-config.embed.not_configured":
    "Bump reminder is not configured.",
  "bump-reminder-config.embed.select_users_to_remove":
    "Select users to remove:",
  "bump-reminder-config.embed.enable_success":
    "Bump reminder feature has been enabled",
  "bump-reminder-config.embed.disable_success":
    "Bump reminder feature has been disabled",
  "bump-reminder-config.embed.set_mention_role_success":
    "Mention role set to {{role}}",
  "bump-reminder-config.embed.set_mention_user_added":
    "Added {{user}} to mention list",
  "bump-reminder-config.embed.set_mention_user_removed":
    "Removed {{user}} from mention list",
  "bump-reminder-config.embed.set_mention_error_title": "Input Error",
  "bump-reminder-config.embed.set_mention_error":
    "Please specify a role or user",
  "bump-reminder-config.embed.remove_mention_role":
    "Mention role registration has been removed",
  "bump-reminder-config.embed.remove_mention_users":
    "All mention users have been removed",
  "bump-reminder-config.embed.remove_mention_all":
    "All mention settings have been removed",
  "bump-reminder-config.embed.remove_mention_select":
    "Removed the following users from mention list:\n{{users}}",
  "bump-reminder-config.embed.remove_mention_error_title": "Deletion Error",
  "bump-reminder-config.embed.remove_mention_error_no_users":
    "No users are registered to remove",
  "bump-reminder-config.embed.title": "Bump Reminder Feature",
  "bump-reminder-config.embed.status": "Current settings status",
  "bump-reminder-config.embed.field.status": "Status",
  "bump-reminder-config.embed.field.mention_role": "Mention Role",
  "bump-reminder-config.embed.field.mention_users": "Mention Users",
} as const;

export type CommandsTranslations = typeof commands;
