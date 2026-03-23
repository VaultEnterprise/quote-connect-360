// Shared type definitions for documentation system

export type Uuid = string;

export interface PageInventoryItem {
  page_code: string;
  page_name: string;
  route: string;
  parent_page_code?: string | null;
  module: string;
  page_type: "screen" | "modal" | "tab" | "embedded";
  access_roles: string[];
  is_hidden: boolean;
  entry_points: string[];
  child_pages: string[];
  related_workflows: string[];
  related_entities: string[];
  backend_services: string[];
  dependencies_inbound: string[];
  dependencies_outbound: string[];
  description: string;
}

export interface FeatureInventoryItem {
  feature_code: string;
  feature_name: string;
  page_code: string;
  feature_type: "action" | "display" | "automation";
  trigger_type: "button_click" | "load" | "schedule" | "system";
  user_roles: string[];
  description: string;
  input_data: string[];
  output_data: string[];
  backend_process: string;
  workflow_impact: string[];
  notification_impact: string[];
  validation_rules: string[];
  success_result: string;
  failure_conditions: string[];
  dependencies: string[];
  audit_logged: boolean;
}

export interface ControlDictionaryItem {
  control_code: string;
  page_code: string;
  control_name: string;
  control_type: "button" | "field" | "dropdown" | "tab" | "modal" | "toggle" | "grid" | "link";
  visible_roles: string[];
  visible_conditions: string[];
  action_triggered: string;
  backend_flow: string[];
  data_written: string[];
  data_read: string[];
  validations: string[];
  success_behavior: string;
  error_behavior: string;
  dependencies: string[];
}

export interface WorkflowState {
  state_code: string;
  state_name: string;
  available_actions: string[];
  responsible_roles: string[];
  next_states: string[];
}

export interface WorkflowTransition {
  from_state: string;
  to_state: string;
  trigger: string;
  validations: string[];
  actions: string[];
}

export interface WorkflowNotification {
  trigger: string;
  template: string;
  recipients: string[];
}

export interface WorkflowException {
  condition: string;
  resolution: string;
}

export interface WorkflowDocumentationItem {
  workflow_code: string;
  workflow_name: string;
  description: string;
  trigger_event: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  notifications: WorkflowNotification[];
  exceptions: WorkflowException[];
}

export interface ManualSectionOutline {
  section_code: string;
  heading_level: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  sort_order: number;
  is_repeatable: boolean;
}

export interface DocumentationDataset {
  pages: PageInventoryItem[];
  features: FeatureInventoryItem[];
  controls: ControlDictionaryItem[];
  workflows: WorkflowDocumentationItem[];
  sections: ManualSectionOutline[];
  master_prompt: string;
}