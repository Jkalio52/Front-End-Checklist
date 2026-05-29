export const TELEMETRY_EVENTS = {
  accountDeleted: 'account_deleted',
  accountExported: 'account_exported',
  apiRequestFailed: 'api_request_failed',
  auditSaved: 'audit_saved',
  authSignInFailed: 'auth_sign_in_failed',
  authSignInStarted: 'auth_sign_in_started',
  authSignOutFailed: 'auth_sign_out_failed',
  authSignOutSucceeded: 'auth_sign_out_succeeded',
  checklistCreated: 'checklist_created',
  checklistDeleted: 'checklist_deleted',
  checklistShared: 'checklist_shared',
  checklistUnshared: 'checklist_unshared',
  checklistUpdated: 'checklist_updated',
  mcpToolCalled: 'mcp_tool_called',
  profileUpdated: 'profile_updated',
  progressBulkSynced: 'progress_bulk_synced',
  ruleCompleted: 'rule_completed',
  ruleFeedbackSubmitted: 'rule_feedback_submitted',
  ruleNotesUpdated: 'rule_notes_updated',
  ruleUncompleted: 'rule_uncompleted',
  waitlistJoined: 'waitlist_joined'
} as const

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS]
