// src/shared/locale/locales/en/common.ts
// Common translations (English)

export const common = {
  // State labels
  // Shared in embed titles and field values
  success: "Success",
  info: "Information",
  warning: "Warning",
  error: "Error",
  // Feature configuration state (ON/OFF)
  enabled: "Enabled",
  disabled: "Disabled",
  // Placeholder for unset / empty values
  none: "None",

  // Embed titles (noun phrases)
  // Standard titles used in status notification Embed options.title
  title_permission_denied: "Insufficient Permissions",
  title_bot_permission_denied: "Bot Permissions Required",
  title_input_error: "Invalid Input",
  title_option_conflict: "Option Conflict",
  title_filter_required: "Filter Required",
  title_channel_error: "Channel Error",
  title_channel_not_found: "Channel Not Found",
  title_not_in_vc: "Not in Voice Channel",
  title_config_required: "Configuration Required",
  title_resource_not_found: "Resource Not Found",
  title_limit_exceeded: "Limit Exceeded",
  title_role_limit_exceeded: "Role Limit Exceeded",
  title_timeout: "Timeout",
  title_already_running: "Already Running",
  title_already_registered: "Already Registered",
  title_not_configured: "Not Configured",
  title_server_only: "Server Only",
  title_operation_error: "Operation Failed",
  title_scan_error: "Scan Error",
  title_delete_error: "Delete Error",
  title_move_failed: "Move Failed",
  title_rate_limited: "Rate Limited",
  title_config_error: "Configuration Error",
} as const;

export type CommonTranslations = typeof common;
