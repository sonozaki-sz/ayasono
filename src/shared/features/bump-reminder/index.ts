// src/shared/features/bump-reminder/index.ts
// Bumpリマインダー機能のエントリーポイント

// Constants
export {
  BUMP_COMMANDS,
  BUMP_CONSTANTS,
  BUMP_REMINDER_STATUS,
  BUMP_SERVICES,
  getReminderDelayMinutes,
  resolveBumpService,
  toBumpReminderJobId,
  toScheduledAt,
} from "./constants";
export type { BumpReminderStatus, BumpServiceName } from "./constants";

// Repository
export {
  BumpReminderRepository,
  getBumpReminderRepository,
} from "./repository";
export type { BumpReminder, IBumpReminderRepository } from "./repository";

// Manager
export {
  BumpReminderManager,
  getBumpReminderManager,
  type BumpReminderTaskFactory,
} from "./manager";

// Handler
export { handleBumpDetected, sendBumpPanel, sendBumpReminder } from "./handler";
