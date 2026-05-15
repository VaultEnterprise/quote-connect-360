import type { WorkflowDocumentationItem } from "../shared/documentation_types";

export const WorkflowDocumentationSeed: WorkflowDocumentationItem[] = [
  {
    workflow_code: "WF-ONBOARD-001",
    workflow_name: "Client Onboarding",
    description: "Tracks onboarding from initiation to completion.",
    trigger_event: "New client created",
    states: [
      {
        state_code: "ST-001",
        state_name: "Initiated",
        available_actions: ["Start Setup"],
        responsible_roles: ["Admin"],
        next_states: ["ST-002"],
      },
      {
        state_code: "ST-002",
        state_name: "In Progress",
        available_actions: ["Submit Documents"],
        responsible_roles: ["Admin", "Client"],
        next_states: ["ST-003"],
      },
      {
        state_code: "ST-003",
        state_name: "Complete",
        available_actions: ["Archive"],
        responsible_roles: ["Admin"],
        next_states: [],
      },
    ],
    transitions: [
      {
        from_state: "ST-001",
        to_state: "ST-002",
        trigger: "Start Setup",
        validations: ["client exists", "client.status = active"],
        actions: [
          "update client.workflow_state = ST-002",
          "create task for document submission",
          "send notification to client",
          "log audit entry",
        ],
      },
      {
        from_state: "ST-002",
        to_state: "ST-003",
        trigger: "Submit Documents",
        validations: ["documents uploaded", "document count >= minimum"],
        actions: [
          "update client.workflow_state = ST-003",
          "enable all client features",
          "send completion notification",
          "log audit entry",
        ],
      },
    ],
    notifications: [
      {
        trigger: "transition to ST-002",
        template: "Onboarding Started",
        recipients: ["Client"],
      },
      {
        trigger: "transition to ST-003",
        template: "Onboarding Complete",
        recipients: ["Client", "Admin"],
      },
    ],
    exceptions: [
      {
        condition: "missing required onboarding data",
        resolution: "remain in current state and show exception message",
      },
      {
        condition: "documents expire after 30 days",
        resolution: "revert to ST-001, notify client",
      },
    ],
  },
];