// runtime/models.ts
// Core runtime data structures

export interface RuntimeContext {
  tenant_id: string;
  user_id: string;
  user_email?: string;
  correlation_id: string;
  source_system_code: string; // "qc360" | "api" | "scheduler"
  request_id?: string;
  timestamp: Date;
}

export interface CommandEnvelope {
  command_name: string;
  payload: Record<string, any>;
  context: RuntimeContext;
  queued_at?: Date;
}

export interface WorkflowDecision {
  allowed: boolean;
  transition_code?: string;
  from_state?: string;
  to_state?: string;
  reason?: string;
}

export interface JobDefinition {
  job_code: string;
  job_name: string;
  schedule_type: "daily" | "weekly" | "hourly" | "on_demand";
  cron_expression?: string;
  enabled: boolean;
  handler_name: string;
}

export interface DeadLetterRecord {
  dead_letter_id: string;
  operation_name: string;
  payload: Record<string, any>;
  error_message: string;
  retry_count: number;
  max_retries: number;
  created_at: Date;
  last_retry_at?: Date;
  status: "pending" | "recovered" | "failed";
}

export interface DashboardMetric {
  metric_code: string;
  metric_name: string;
  metric_value: any;
  calculated_at: Date;
}

export interface WorkflowTransition {
  workflow_code: string;
  from_state: string;
  to_state: string;
  transition_code: string;
  guard_rule_code?: string;
  action_handler?: string;
}

export interface GuardRule {
  guard_rule_code: string;
  evaluate: (facts: Record<string, any>) => boolean;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  error_code?: string;
}

export interface AuditEvent {
  audit_id: string;
  benefit_case_id: string;
  entity_type: string;
  entity_id: string;
  event_code: string;
  actor_user_id: string;
  source_system_code: string;
  correlation_id: string;
  before_json?: Record<string, any>;
  after_json?: Record<string, any>;
  created_at: Date;
}

export interface ExceptionRecord {
  exception_id: string;
  benefit_case_id: string;
  entity_type: string;
  entity_id: string;
  exception_code: string;
  category_code: string;
  severity: "low" | "medium" | "high" | "critical";
  owner_role_code: string;
  root_cause: string;
  status: "open" | "acknowledged" | "resolved" | "closed";
  created_at: Date;
}