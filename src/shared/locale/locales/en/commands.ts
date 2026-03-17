// src/shared/locale/locales/en/commands.ts
// Command-related translations (English)

export const commands = {
  // Ping command
  // Basic latency diagnostics shown to any user
  "ping.description":
    "Check bot response speed",
  "ping.embed.measuring":
    "🏓 Measuring...",
  "ping.embed.response":
    "📡 API Latency: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // Cooldown
  "cooldown.wait":
    "⏱️ You can use this command in **{{seconds}} seconds**",

  // AFK command
  "afk.description":
    "Move user to AFK channel",
  "afk.user.description":
    "User to move (default: yourself)",
  "afk.embed.moved":
    "Moved {{user}} to {{channel}}",

  // AFK config command
  // Admin-only AFK configuration labels and result text
  "afk-config.description":
    "Configure AFK feature (administrators only)",
  "afk-config.set-channel.description":
    "Configure AFK channel",
  "afk-config.set-channel.channel.description":
    "AFK channel (voice channel)",
  "afk-config.view.description":
    "Show current settings",
  "afk-config.embed.title":
    "AFK",
  "afk-config.embed.success_title":
    "Settings Updated",
  "afk-config.embed.set_ch_success":
    "AFK channel configured: {{channel}}",
  "afk-config.embed.not_configured":
    "AFK channel is not configured",
  "afk-config.embed.field.channel":
    "AFK Channel",

  // Bump Reminder config command (Discord UI labels)
  // Slash command and subcommand descriptions
  "bump-reminder-config.description":
    "Configure bump reminder (administrators only)",
  "bump-reminder-config.enable.description":
    "Enable bump reminder feature",
  "bump-reminder-config.disable.description":
    "Disable bump reminder feature",
  "bump-reminder-config.set-mention.description":
    "Set mention role",
  "bump-reminder-config.set-mention.role.description":
    "Role to mention in reminders",
  "bump-reminder-config.remove-mention.description":
    "Remove mention role setting",
  "bump-reminder-config.view.description":
    "Show current settings",

  // Bump Reminder config command responses
  // Generic status messages
  // Success/warning/error result strings for config subcommands
  "bump-reminder-config.embed.success_title":
    "Settings Updated",
  "bump-reminder-config.embed.not_configured":
    "Bump reminder is not configured.",
  "bump-reminder-config.embed.enable_success":
    "Bump reminder feature has been enabled",
  "bump-reminder-config.embed.disable_success":
    "Bump reminder feature has been disabled",
  // Mention setting results (role set/remove/error)
  "bump-reminder-config.embed.set_mention_role_success":
    "Mention role set to {{role}}",
  "bump-reminder-config.embed.set_mention_error":
    "Failed to set mention role.",
  "bump-reminder-config.embed.remove_mention_role":
    "Mention role registration has been removed",
  // view subcommand display fields
  "bump-reminder-config.embed.title":
    "Bump Reminder Feature",
  "bump-reminder-config.embed.status":
    "Current settings status",
  "bump-reminder-config.embed.field.status":
    "Status",
  "bump-reminder-config.embed.field.mention_role":
    "Mention Role",
  "bump-reminder-config.embed.field.mention_users":
    "Mention Users",

  // VAC config command
  // Trigger VC management (create/remove)
  // Labels for setup commands that define VAC trigger channels
  "vac-config.description":
    "Configure voice auto-create feature (Manage Server)",
  "vac-config.create-trigger-vc.description":
    "Create trigger channel",
  "vac-config.create-trigger-vc.category.description":
    "Destination category (TOP or category; defaults to current category)",
  "vac-config.remove-trigger-vc.description":
    "Remove trigger channel",
  "vac-config.remove-trigger-vc.category.description":
    "Target category (TOP or category; defaults to current category)",
  "vac-config.remove-trigger-vc.category.top":
    "TOP (no category)",
  "vac-config.view.description":
    "Show current settings",
  // view subcommand display fields
  "vac-config.embed.title":
    "Voice Auto-Create",
  "vac-config.embed.success_title":
    "Settings Updated",
  "vac-config.embed.not_configured":
    "Not configured",
  "vac-config.embed.no_created_vcs":
    "None",
  "vac-config.embed.top":
    "TOP",
  "vac-config.embed.field.trigger_channels":
    "Trigger channels",
  "vac-config.embed.field.created_vcs":
    "Created VC count",
  "vac-config.embed.field.created_vc_details":
    "Created VCs",
  "vac-config.embed.trigger_created":
    "Created trigger channel {{channel}}",
  "vac-config.embed.trigger_removed":
    "Removed trigger channel {{channel}}",
  "vac-config.embed.remove_error_title":
    "Removal Error",

  // VAC command
  // VC operation commands (rename/user limit)
  // Runtime panel/manual operation result messages
  "vac.description":
    "Change settings of an auto-created VC",
  "vac.vc-rename.description":
    "Rename your current VC",
  "vac.vc-rename.name.description":
    "New VC name",
  "vac.vc-limit.description":
    "Change user limit of your current VC",
  "vac.vc-limit.limit.description":
    "User limit (0=unlimited, max 99)",
  "vac.embed.renamed":
    "VC name has been changed to {{name}}",
  "vac.embed.limit_changed":
    "User limit has been set to {{limit}}",
  // Result message for AFK bulk-move action on panel
  "vac.embed.members_moved":
    "Moved to {{channel}}.",
  // Result message when re-posting panel to the latest position
  "vac.embed.panel_refreshed":
    "Panel moved to the bottom",
  // Shared label used when 0 (= no cap) is selected
  "vac.embed.unlimited":
    "unlimited",
  // Control panel UI labels
  "vac.panel.title":
    "Voice Channel Control Panel",
  // Panel intro sentence shown in embed body
  "vac.panel.description":
    "You can change VC settings from this panel.",
  // Button labels correspond to VAC panel interaction handlers
  "vac.panel.rename_button":
    "Change VC Name",
  "vac.panel.limit_button":
    "Change User Limit",
  "vac.panel.limit_input_placeholder":
    "0–99 (0: unlimited)",
  "vac.panel.afk_button":
    "Move Members to AFK",
  "vac.panel.refresh_button":
    "Move Panel to Bottom",

  // Message Delete command
  "message-delete.description":
    "Bulk delete messages (default: all channels in server)",
  "message-delete.count.description":
    "Number of messages to delete (1–1000, defaults to 1000 if omitted)",
  "message-delete.user.description":
    "Target user ID or mention (for webhooks, paste the user ID directly)",
  "message-delete.errors.user_invalid_format":
    "Invalid `user` format. Enter a user ID or mention (e.g. `<@123456789>`).",
  "message-delete.keyword.description":
    "Delete messages containing this keyword (case-insensitive partial match)",
  "message-delete.days.description":
    "Delete only messages from the past N days (1–366, cannot combine with after/before)",
  "message-delete.after.description":
    "Delete only messages after this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
  "message-delete.before.description":
    "Delete only messages before this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
  "message-delete.channel.description":
    "Restrict deletion to a specific channel (default: entire server)",

  // message-delete validation errors
  "message-delete.errors.no_filter":
    "No filter condition specified. Please provide at least one of: `count`, `user`, `keyword`, `days`, `after`, `before`.",
  "message-delete.errors.days_and_date_conflict":
    "`days` cannot be combined with `after`/`before`. Use one or the other.",
  "message-delete.errors.after_invalid_format":
    "Invalid `after` date format. Use `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`.",
  "message-delete.errors.before_invalid_format":
    "Invalid `before` date format. Use `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`.",
  "message-delete.errors.date_range_invalid":
    "`after` must be earlier than `before`.",
  "message-delete.errors.no_permission":
    "You do not have permission to perform this action.\nRequired permission: Manage Messages",
  "message-delete.errors.bot_no_permission":
    "The bot does not have the required permissions to delete messages.\nRequired: Manage Messages, Read Message History, View Channel",
  "message-delete.errors.text_channel_only":
    "Please specify a text channel.",
  "message-delete.errors.no_messages_found":
    "No deletable messages were found.",
  "message-delete.errors.delete_failed":
    "An error occurred while deleting messages.",
  "message-delete.errors.scan_failed":
    "An error occurred while scanning messages.",
  "message-delete.errors.not_authorized":
    "You are not authorized to do this.",
  "message-delete.errors.jump_invalid_page":
    "Page number must be an integer from 1 to {{total}}",
  "message-delete.errors.days_invalid_value":
    "Please enter a positive integer for the number of days.",
  "message-delete.errors.after_future":
    "Please specify a past date/time for `after`. (Today's date is valid.)",
  "message-delete.errors.before_future":
    "Please specify a past date/time for `before`. (Today's date is valid.)",
  "message-delete.errors.locked":
    "A message-delete command is already running on this server. Please try again after it completes.",
  "message-delete.errors.channel_no_access":
    "Cannot access the specified channel. The bot requires ReadMessageHistory and ManageMessages permissions.",
  // scanning
  "message-delete.confirm.btn_scan_cancel":
    "Preview Collected",
  "message-delete.confirm.scan_progress":
    "Scanning... {{totalScanned}} fetched\nSearching for targets... {{collected}} / {{limit}}",
  "message-delete.confirm.delete_progress":
    "Deleting... {{totalDeleted}} / {{total}}",
  "message-delete.confirm.delete_progress_channel":
    "<#{{channelId}}>: {{deleted}} / {{total}}",
  // confirmation dialog (Stage 1 preview)
  "message-delete.confirm.embed_title":
    "📋 Messages to Delete ({{page}} / {{total}})",
  "message-delete.confirm.btn_delete":
    "Delete ({{count}})",
  "message-delete.confirm.btn_no":
    "Cancel",
  "message-delete.confirm.exclude_placeholder":
    "Select messages to exclude from this page",
  "message-delete.confirm.exclude_no_messages":
    "(no messages)",
  "message-delete.confirm.zero_targets":
    "No messages left to delete",
  "message-delete.confirm.cancelled":
    "Deletion cancelled.",
  "message-delete.confirm.timed_out":
    "Timed out. Please run the command again.",
  "message-delete.confirm.scan_timed_out":
    "Scan timed out. Showing preview with collected messages.",
  "message-delete.confirm.scan_timed_out_empty":
    "Scan timed out. No deletable messages were found.",
  "message-delete.confirm.delete_timed_out":
    "Deletion timed out. Messages deleted: {{count}}",
  // final confirmation dialog (Stage 2)
  "message-delete.final.embed_title":
    "🗑️ Are you sure? ({{page}} / {{total}})",
  "message-delete.final.embed_warning":
    "⚠️ **This action cannot be undone**",
  "message-delete.final.embed_desc":
    "The following messages will be deleted (total: {{count}})",
  "message-delete.final.btn_yes":
    "Delete ({{count}})",
  "message-delete.final.btn_back":
    "Go back",
  "message-delete.final.btn_no":
    "Cancel",
  // result display
  "message-delete.result.empty_content":
    "*(no content)*",
  "message-delete.result.attachments":
    "📎 {{count}} attachment(s)",
  "message-delete.result.embed_no_title":
    "🔗 Embedded content",
  "message-delete.result.jump_to_message":
    "↗ Jump to message",
  // deletion complete embed
  "message-delete.embed.summary_title":
    "✅ Deletion Complete",
  "message-delete.embed.total_deleted":
    "Total Deleted",
  "message-delete.embed.total_deleted_value":
    "{{count}}",
  "message-delete.embed.channel_breakdown":
    "By Channel",
  "message-delete.embed.channel_breakdown_item":
    "<#{{channelId}}>: {{count}}",
  "message-delete.embed.breakdown_empty":
    "—",
  // filter buttons (Stage 1 preview dialog)
  "message-delete.pagination.btn_first":
    "First",
  "message-delete.pagination.btn_prev":
    "Prev",
  "message-delete.pagination.btn_next":
    "Next",
  "message-delete.pagination.btn_last":
    "Last",
  "message-delete.pagination.btn_jump":
    "Page {{page}}/{{total}}",
  "message-delete.pagination.btn_days_set":
    "Past {{days}} days",
  "message-delete.pagination.btn_days_empty":
    "Enter past N days",
  "message-delete.pagination.btn_after_set":
    "after: {{date}}",
  "message-delete.pagination.btn_after_empty":
    "Enter after date",
  "message-delete.pagination.btn_before_set":
    "before: {{date}}",
  "message-delete.pagination.btn_before_empty":
    "Enter before date",
  "message-delete.pagination.btn_keyword":
    "Search by content",
  "message-delete.pagination.btn_keyword_set":
    "{{keyword}}",
  "message-delete.pagination.btn_reset":
    "Reset",
  "message-delete.pagination.author_select_placeholder":
    "Filter by author",
  "message-delete.pagination.author_all":
    "(All authors)",
  // modals
  "message-delete.modal.keyword.title":
    "Filter by Content",
  "message-delete.modal.keyword.label":
    "Keyword",
  "message-delete.modal.keyword.placeholder":
    "Enter keyword to filter",
  "message-delete.modal.days.title":
    "Filter by Past N Days",
  "message-delete.modal.days.label":
    "Number of days (positive integer)",
  "message-delete.modal.days.placeholder":
    "e.g. 7",
  "message-delete.modal.after.title":
    "Filter by After Date",
  "message-delete.modal.after.label":
    "Start date/time",
  "message-delete.modal.after.placeholder":
    "e.g. 2026-01-01 or 2026-01-01T00:00:00",
  "message-delete.modal.before.title":
    "Filter by Before Date",
  "message-delete.modal.before.label":
    "End date/time",
  "message-delete.modal.before.placeholder":
    "e.g. 2026-02-28 or 2026-02-28T23:59:59",
  "message-delete.modal.jump.title":
    "Jump to Page",
  "message-delete.modal.jump.label":
    "Page number",
  "message-delete.modal.jump.placeholder":
    "Integer from 1 to {{total}}",
  // command conditions embed
  "message-delete.conditions.title":
    "📋 Command Conditions",
  "message-delete.conditions.count_limited":
    "{{count}}",
  "message-delete.conditions.count_unlimited":
    "(no limit: {{count}})",
  "message-delete.conditions.user_all":
    "(all users)",
  "message-delete.conditions.none":
    "(none)",
  "message-delete.conditions.channel_all":
    "(entire server)",
  "message-delete.conditions.days_value":
    "Past {{days}} days",
  "message-delete.conditions.after_value":
    "After {{date}}",
  "message-delete.conditions.before_value":
    "Before {{date}}",
  // Condition setup step
  "message-delete.condition-step.title":
    "Select target users and channels (optional)",
  "message-delete.condition-step.user_placeholder":
    "Select users",
  "message-delete.condition-step.channel_placeholder":
    "Select channels",
  "message-delete.condition-step.btn_start_scan":
    "Start Scan",
  "message-delete.condition-step.btn_webhook_input":
    "Enter Webhook ID",
  "message-delete.condition-step.btn_cancel":
    "Cancel",
  "message-delete.condition-step.timeout":
    "Condition setup timed out. Please run the command again.",
  "message-delete.condition-step.no_filter":
    "No filter conditions specified.\nPlease specify at least one of: `count`, `keyword`, `days`, `after`, `before`, or select target users.",
  "message-delete.modal.webhook.title":
    "Enter Webhook ID",
  "message-delete.modal.webhook.label":
    "Webhook ID (17-20 digit number)",
  "message-delete.modal.webhook.placeholder":
    "123456789012345678",
  "message-delete.errors.webhook_invalid_format":
    "Invalid Webhook ID format. Please enter a 17-20 digit number.",
  "message-delete.errors.channel_partial_skip":
    "Skipped channels due to insufficient bot permissions: {{channels}}",
  "message-delete.errors.channel_all_no_access":
    "Cannot access specified channels. Bot requires ReadMessageHistory and ManageMessages permissions.",

  // Member log config command (Discord UI labels)
  // Slash command and subcommand descriptions
  "member-log-config.description":
    "Configure member log feature (administrators only)",
  "member-log-config.set-channel.description":
    "Set the notification channel",
  "member-log-config.set-channel.channel.description":
    "Text channel to send notifications to",
  "member-log-config.enable.description":
    "Enable member log feature",
  "member-log-config.disable.description":
    "Disable member log feature",
  "member-log-config.set-join-message.description":
    "Set a custom join message",
  "member-log-config.set-leave-message.description":
    "Set a custom leave message",
  "member-log-config.clear-join-message.description":
    "Clear the custom join message",
  "member-log-config.clear-leave-message.description":
    "Clear the custom leave message",
  "member-log-config.view.description":
    "Show current settings",
  // Member log config command responses
  "member-log-config.embed.success_title":
    "Settings Updated",
  "member-log-config.embed.title":
    "Member Log",
  "member-log-config.embed.not_configured":
    "Member log is not configured.",
  "member-log-config.embed.set_channel_success":
    "Notification channel set to {{channel}}",
  "member-log-config.embed.enable_success":
    "Member log feature has been enabled",
  "member-log-config.embed.enable_error_no_channel":
    "No notification channel is configured. Run /member-log-config set-channel first.",
  "member-log-config.embed.disable_success":
    "Member log feature has been disabled",
  "member-log-config.embed.set_join_message_success":
    "Join message has been set",
  "member-log-config.embed.set_leave_message_success":
    "Leave message has been set",
  "member-log-config.embed.clear_join_message_success":
    "Join message has been cleared",
  "member-log-config.embed.clear_leave_message_success":
    "Leave message has been cleared",
  "member-log-config.embed.field.status":
    "Status",
  "member-log-config.embed.field.channel":
    "Notification Channel",
  "member-log-config.embed.field.join_message":
    "Join Message",
  "member-log-config.embed.field.leave_message":
    "Leave Message",
  // modals
  "member-log-config.modal.set_join_message.title":
    "Set Join Message",
  "member-log-config.modal.set_join_message.label":
    "Join message",
  "member-log-config.modal.set_join_message.placeholder":
    "Supports {userMention}, {userName}, {memberCount}, {serverName} (max 500 characters)",
  "member-log-config.modal.set_leave_message.title":
    "Set Leave Message",
  "member-log-config.modal.set_leave_message.label":
    "Leave message",
  "member-log-config.modal.set_leave_message.placeholder":
    "Supports {userMention}, {userName}, {memberCount}, {serverName} (max 500 characters)",
  // errors
  "member-log-config.errors.text_channel_only":
    "Please specify a text channel.",
  // Sticky Message command
  "sticky-message.description":
    "Manage sticky messages (pinned to channel bottom) — requires Manage Channels",
  // set subcommand
  "sticky-message.set.description":
    "Set a sticky message (modal input)",
  "sticky-message.set.channel.description":
    "Text channel to set the sticky message in (defaults to this channel)",
  "sticky-message.set.style.description":
    "Display style (text: plain text / embed: embed; defaults to text)",
  // set plain text modal
  "sticky-message.set.modal.title":
    "Enter sticky message content",
  "sticky-message.set.modal.message.label":
    "Message content",
  "sticky-message.set.modal.message.placeholder":
    "Supports multiple lines (max 2000 characters)",
  // set embed modal
  "sticky-message.set.embed-modal.title":
    "Set embed sticky message",
  "sticky-message.set.embed-modal.embed-title.label":
    "Title",
  "sticky-message.set.embed-modal.embed-title.placeholder":
    "Embed title (optional)",
  "sticky-message.set.embed-modal.embed-description.label":
    "Description",
  "sticky-message.set.embed-modal.embed-description.placeholder":
    "Embed body text (leave blank for none)",
  "sticky-message.set.embed-modal.embed-color.label":
    "Color code (optional)",
  "sticky-message.set.embed-modal.embed-color.placeholder":
    "#008969 or 0x008969 (default: #008969)",
  "sticky-message.set.success.title":
    "Done",
  "sticky-message.set.success.description":
    "Sticky message has been set.",
  "sticky-message.set.alreadyExists.title":
    "Warning",
  "sticky-message.set.alreadyExists.description":
    "A sticky message is already configured for this channel. Remove it first before setting a new one.",
  // remove subcommand
  "sticky-message.remove.description":
    "Remove sticky messages",
  "sticky-message.remove.select.placeholder":
    "Select channels to remove (multiple)",
  "sticky-message.remove.button.label":
    "Remove",
  "sticky-message.remove.noSelection.description":
    "Please select channels to remove.",
  "sticky-message.remove.success.title":
    "Removed",
  "sticky-message.remove.success.description":
    "Removed {{count}} sticky message(s).",
  "sticky-message.remove.success.channels":
    "Removed channels",
  "sticky-message.remove.notFound.title":
    "Not Found",
  "sticky-message.remove.notFound.description":
    "No sticky messages are configured.",

  // errors
  "sticky-message.errors.permissionDenied":
    "You do not have permission to do this. Manage Channels permission is required.",
  "sticky-message.errors.emptyMessage":
    "Please enter a message.",
  "sticky-message.errors.text_channel_only":
    "Sticky messages can only be set in text channels.",
  "sticky-message.errors.failed":
    "An error occurred while managing the sticky message.",
  // view subcommand
  "sticky-message.view.description":
    "View sticky message settings (channel select UI)",
  "sticky-message.view.title":
    "Sticky Message Settings",
  "sticky-message.view.select.placeholder":
    "Select a channel",
  "sticky-message.view.notFound.title":
    "Not Configured",
  "sticky-message.view.empty":
    "No sticky messages are configured for any channel.",
  "sticky-message.view.field.channel":
    "Channel",
  "sticky-message.view.field.format":
    "Format",
  "sticky-message.view.field.format_plain":
    "Plain text",
  "sticky-message.view.field.format_embed":
    "Embed",
  "sticky-message.view.field.updated_at":
    "Last updated",
  "sticky-message.view.field.updated_by":
    "Set by",
  "sticky-message.view.field.content":
    "Message content",
  "sticky-message.view.field.embed_title":
    "Embed title",
  "sticky-message.view.field.embed_color":
    "Embed color",
  // update subcommand
  "sticky-message.update.description":
    "Update the content of an existing sticky message (modal input)",
  "sticky-message.update.channel.description":
    "Channel whose sticky message to update (defaults to this channel)",
  "sticky-message.update.style.description":
    "Display style (text: plain text / embed: embed; defaults to text)",
  // update plain text modal
  "sticky-message.update.modal.title":
    "Update sticky message",
  "sticky-message.update.modal.message.label":
    "Message content",
  "sticky-message.update.modal.message.placeholder":
    "Supports multiple lines (max 2000 characters)",
  // update embed modal
  "sticky-message.update.embed-modal.title":
    "Update embed sticky message",
  "sticky-message.update.success.title":
    "Updated",
  "sticky-message.update.success.description":
    "Sticky message has been updated.",
  "sticky-message.update.notFound.title":
    "Not Configured",

  // VC Recruit config command
  "vc-recruit-config.description":
    "VC recruit feature settings (server administrators only)",
  "vc-recruit-config.setup.description":
    "Set up VC recruit channels",
  "vc-recruit-config.setup.category.description":
    "Target category (TOP or category name; defaults to this channel's category)",
  "vc-recruit-config.setup.category.top": "TOP (No category)",
  "vc-recruit-config.setup.thread-archive.description":
    "Auto-archive duration for recruit threads (1h/24h/3d/1w; default: 24h)",
  "vc-recruit-config.teardown.description":
    "Remove VC recruit channels (via selection UI)",
  // teardown select menu UI
  "vc-recruit-config.teardown.select.placeholder":
    "Select categories to teardown",
  "vc-recruit-config.teardown.select.top":
    "TOP (No category)",
  "vc-recruit-config.teardown.select.unknown_category":
    "Unknown category (ID: {{id}})",
  // teardown confirm panel
  "vc-recruit-config.teardown.confirm.title":
    "Remove VC recruit channels?",
  "vc-recruit-config.teardown.confirm.field_categories":
    "Target categories",
  "vc-recruit-config.teardown.confirm.warning":
    "The recruit panel and recruit list channels for the selected categories will be deleted. This action cannot be undone.",
  "vc-recruit-config.teardown.confirm.button_confirm":
    "🗑️ Remove",
  "vc-recruit-config.teardown.confirm.button_cancel":
    "Cancel",
  "vc-recruit-config.teardown.confirm.button_redo":
    "Reselect",
  "vc-recruit-config.add-role.description":
    "Add a role to the mention candidates",
  "vc-recruit-config.add-role.select.placeholder":
    "Select roles to add (multiple)",
  "vc-recruit-config.add-role.select.title":
    "Select the roles to add",
  "vc-recruit-config.add-role.button.confirm":
    "Add",
  "vc-recruit-config.add-role.button.cancel":
    "Cancel",
  "vc-recruit-config.add-role.noSelection":
    "Please select the roles to add.",
  "vc-recruit-config.remove-role.description":
    "Remove a role from the mention candidates",
  "vc-recruit-config.remove-role.select.placeholder":
    "Select roles to remove (multiple)",
  "vc-recruit-config.remove-role.select.title":
    "Select the roles to remove",
  "vc-recruit-config.remove-role.button.confirm":
    "Remove",
  "vc-recruit-config.remove-role.button.cancel":
    "Cancel",
  "vc-recruit-config.remove-role.noSelection":
    "Please select the roles to remove.",
  "vc-recruit-config.view.description":
    "Show current VC recruit settings",
  // setup success
  "vc-recruit-config.embed.setup_success":
    "VC recruit channels created",
  "vc-recruit-config.embed.setup_panel_channel":
    "Recruit panel: {{channel}}",
  "vc-recruit-config.embed.setup_post_channel":
    "Recruit board: {{channel}}",
  // teardown
  "vc-recruit-config.embed.teardown_success":
    "VC recruit channels removed",
  "vc-recruit-config.embed.teardown_category_item":
    "🗑️ {{category}}",
  "vc-recruit-config.embed.teardown_partial_error":
    "The following categories had errors:",
  "vc-recruit-config.embed.teardown_cancelled":
    "Cancelled.",
  // add-role/remove-role success
  "vc-recruit-config.embed.add_role_success":
    "Added {{role}} to mention candidates",
  "vc-recruit-config.embed.remove_role_success":
    "Removed {{role}} from mention candidates",
  // view
  "vc-recruit-config.embed.view_title":
    "VC Recruit Settings",
  "vc-recruit-config.embed.field_setups":
    "Configured categories",
  "vc-recruit-config.embed.field_roles":
    "Mention candidate roles",
  "vc-recruit-config.embed.no_setups":
    "Not configured",
  "vc-recruit-config.embed.no_roles":
    "None",
  "vc-recruit-config.embed.top":
    "TOP",
  "vc-recruit-config.embed.setup_item":
    "• {{category}}\n　Panel: {{panel}}\n　Board: {{post}}",
  "vc-recruit-config.embed.add_role_success_title":
    "Roles Registered",
  "vc-recruit-config.embed.add_role_success_field":
    "Registered Roles",
  "vc-recruit-config.embed.add_role_limit_title":
    "Role Limit Exceeded",
  "vc-recruit-config.embed.add_role_limit_desc":
    "The mention role limit ({{limit}}) has been reached. The following roles could not be registered.",
  "vc-recruit-config.embed.add_role_limit_field":
    "Roles Not Registered",
  "vc-recruit-config.embed.remove_role_success_title":
    "Roles Removed",
  "vc-recruit-config.embed.remove_role_success_field":
    "Removed Roles",
  "vc-recruit-config.embed.success_title":
    "Settings Updated",

  // Common
  "common.cancelled":
    "Cancelled.",

  // VC recruit channel names
  "vcRecruit.channelName.panel":
    "vc-create",
  "vcRecruit.channelName.post":
    "vc-recruit-list",

  // VC recruit panel
  "vcRecruit.panel.title":
    "📝 VC Recruit",
  "vcRecruit.panel.description":
    "You can create a VC recruitment post using the button below.\n\n**How to create**\n1. Press the button below to start\n2. Select the roles to mention and the VC to join\n3. Enter the details and submit — your post will appear in the recruitment list channel",
  "vcRecruit.panel.create_button":
    "Create VC Recruit",

  // VC recruit modal (step 2)
  "vcRecruit.modal.title":
    "Create VC Recruit (2/2)",
  "vcRecruit.modal.content_label":
    "Recruit message",
  "vcRecruit.modal.content_placeholder":
    "Enter your recruit message (max 200 characters)",
  "vcRecruit.modal.vc_name_label":
    "New VC name (optional)",
  "vcRecruit.modal.vc_name_placeholder":
    "Used only if \"Create new VC\" is selected (blank: DisplayName's Room)",

  // VC recruit select (step 1)
  "vcRecruit.select.title": "📋 Step 1/2",
  "vcRecruit.select.description": "Select mention and VC",
  "vcRecruit.select.mention_placeholder":
    "Mention (none)",
  "vcRecruit.select.vc_placeholder":
    "Select VC",
  "vcRecruit.select.open_modal_button":
    "📝 Next: Enter details",
  "vcRecruit.select.no_mention":
    "None (no mention)",
  "vcRecruit.select.new_vc_label":
    "🆕 Create new VC",

  // Recruit message
  "vcRecruit.embed.title":
    "📢 VC Recruit",
  "vcRecruit.embed.title_ended":
    "📢 VC Recruit [Ended]",
  "vcRecruit.embed.field_content":
    "Recruit message",
  "vcRecruit.embed.field_vc":
    "VC",
  "vcRecruit.embed.field_recruiter":
    "Recruiter",

  // Thread name
  "vcRecruit.thread_name":
    "{{recruiter}}'s recruit",

  // Post success notification
  "vcRecruit.embed.post_success":
    "Recruitment posted successfully",
  "vcRecruit.embed.post_success_link":
    "View post",

  // Recruit message buttons
  "vcRecruit.button.join_vc":
    "🎤 Join VC",
  "vcRecruit.button.rename_vc":
    "✏️ Rename VC",
  "vcRecruit.button.end_vc":
    "🔇 End Recruitment",
  "vcRecruit.button.delete_post":
    "🗑️ Delete post",
  "vcRecruit.button.vc_ended":
    "🔇 Recruitment Ended",

  // End recruitment confirmation
  "vcRecruit.confirm.end_vc_created":
    "End recruitment?\nThe VC will be deleted and the recruit post will be marked as ended. The post and thread will remain.",
  "vcRecruit.confirm.end_vc_existing":
    "End recruitment?\nThe recruit post will be marked as ended. The VC will not be deleted.",
  "vcRecruit.confirm.end_vc_button":
    "End",
  "vcRecruit.confirm.cancel_button":
    "Cancel",
  "vcRecruit.confirm.end_vc_success":
    "Recruitment has been ended",
  "vcRecruit.confirm.cancelled":
    "Cancelled.",

  // Delete post confirmation
  "vcRecruit.confirm.delete_created":
    "Delete this recruitment?\nThe post, thread, and created VC will all be deleted.",
  "vcRecruit.confirm.delete_existing":
    "Delete this recruitment?\nThe post and thread will be deleted. The VC will not be deleted.",
  "vcRecruit.confirm.delete_button":
    "Delete",
  "vcRecruit.confirm.delete_success":
    "Recruitment has been deleted",

  // VC rename
  "vcRecruit.rename.modal_title":
    "Rename VC",
  "vcRecruit.rename.vc_name_label":
    "VC Name",
  "vcRecruit.rename.vc_name_placeholder":
    "Enter a new VC name (max 100 characters)",
  "vcRecruit.rename.success":
    "VC name has been changed",
} as const;

export type CommandsTranslations = typeof commands;
