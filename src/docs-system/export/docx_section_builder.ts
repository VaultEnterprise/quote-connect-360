import {
  AlignmentType,
  HeadingLevel,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type {
  ControlDictionaryItem,
  FeatureInventoryItem,
  PageInventoryItem,
  WorkflowDocumentationItem,
} from "../shared/documentation_types";

function text(value: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: value, bold })],
  });
}

function heading(value: string, level: HeadingLevel): Paragraph {
  return new Paragraph({
    text: value,
    heading: level,
  });
}

function kvRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({ children: [text(label, true)] }),
      new TableCell({ children: [text(value || "")] }),
    ],
  });
}

export function buildTitlePage(
  applicationName: string,
  manualTitle: string,
  version: string,
  author: string,
  generatedOn: string,
): Paragraph[] {
  return [
    new Paragraph({
      text: applicationName,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: manualTitle,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: `Version: ${version}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Author/System Source: ${author}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Generated: ${generatedOn}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
  ];
}

export function buildDocumentControlTable(): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      kvRow("Purpose", "Complete step-by-step functional manual for the application."),
      kvRow("Audience", "Admins, support, QA, product, implementation, training, engineering."),
      kvRow("Scope", "All pages, controls, workflows, dependencies, validations, and system behavior."),
      kvRow("Usage", "Operational manual, training reference, QA baseline, and AI help knowledge source."),
    ],
  });
}

export function buildPageSection(
  page: PageInventoryItem,
  controls: ControlDictionaryItem[],
  features: FeatureInventoryItem[],
  workflows: WorkflowDocumentationItem[],
): (Paragraph | Table)[] {
  const relatedWorkflowNames = workflows.map((w) => `${w.workflow_code} - ${w.workflow_name}`).join(", ");

  const content: (Paragraph | Table)[] = [
    heading(`${page.page_name}`, HeadingLevel.HEADING_1),
    text(`Page Code: ${page.page_code}`, true),
    text(`Route: ${page.route}`),
    text(`Module: ${page.module}`),
    text(`Page Type: ${page.page_type}`),
    text(`Roles: ${page.access_roles.join(", ") || "None"}`),
    text(`Purpose: ${page.description}`),
    text(`[Insert screenshot of ${page.page_name} here]`),
    heading("Screen Layout", HeadingLevel.HEADING_2),
    text(`Parent Page: ${page.parent_page_code || "None"}`),
    text(`Child Pages: ${page.child_pages.join(", ") || "None"}`),
    text(`Inbound Dependencies: ${page.dependencies_inbound.join(", ") || "None"}`),
    text(`Outbound Dependencies: ${page.dependencies_outbound.join(", ") || "None"}`),
    heading("Controls", HeadingLevel.HEADING_2),
  ];

  for (const control of controls) {
    content.push(heading(control.control_name, HeadingLevel.HEADING_3));
    content.push(text(`Control Code: ${control.control_code}`, true));
    content.push(text(`Control Type: ${control.control_type}`));
    content.push(text(`Visible Roles: ${control.visible_roles.join(", ") || "None"}`));
    content.push(text(`Visible Conditions: ${control.visible_conditions.join("; ") || "Always visible"}`));
    content.push(text(`Action Triggered: ${control.action_triggered}`));
    content.push(text(`Validations: ${control.validations.join("; ") || "None"}`));
    content.push(text(`Data Read: ${control.data_read.join(", ") || "None"}`));
    content.push(text(`Data Written: ${control.data_written.join(", ") || "None"}`));
    content.push(text(`Dependencies: ${control.dependencies.join(", ") || "None"}`));
    content.push(text(`Success Behavior: ${control.success_behavior}`));
    content.push(text(`Error Behavior: ${control.error_behavior}`));

    content.push(
      new Paragraph({
        children: [new TextRun({ text: "Step-by-Step:", bold: true })],
      }),
    );

    const steps = [
      `1. User locates the "${control.control_name}" control on the page.`,
      `2. User interacts with the control according to the intended flow.`,
      `3. System executes: ${control.backend_flow.join(" -> ") || "no backend flow defined"}.`,
      `4. System applies all configured validations before completing the action.`,
      `5. System updates the resulting state and displays the expected outcome.`,
    ];

    for (const step of steps) {
      content.push(text(step));
    }
  }

  content.push(heading("Feature Summary", HeadingLevel.HEADING_2));
  for (const feature of features) {
    content.push(heading(feature.feature_name, HeadingLevel.HEADING_3));
    content.push(text(`Feature Code: ${feature.feature_code}`, true));
    content.push(text(`Type: ${feature.feature_type}`));
    content.push(text(`Trigger: ${feature.trigger_type}`));
    content.push(text(`Description: ${feature.description}`));
    content.push(text(`Backend Process: ${feature.backend_process}`));
    content.push(text(`Workflow Impact: ${feature.workflow_impact.join(", ") || "None"}`));
    content.push(text(`Notification Impact: ${feature.notification_impact.join(", ") || "None"}`));
    content.push(text(`Failure Conditions: ${feature.failure_conditions.join("; ") || "None"}`));
    content.push(text(`Success Result: ${feature.success_result}`));
  }

  content.push(heading("Related Workflows", HeadingLevel.HEADING_2));
  content.push(text(relatedWorkflowNames || "None"));

  return content;
}

export function buildWorkflowSection(workflow: WorkflowDocumentationItem): (Paragraph | Table)[] {
  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [text("State", true)] }),
        new TableCell({ children: [text("Available Actions", true)] }),
        new TableCell({ children: [text("Responsible Roles", true)] }),
        new TableCell({ children: [text("Next States", true)] }),
      ],
    }),
    ...workflow.states.map(
      (state) =>
        new TableRow({
          children: [
            new TableCell({ children: [text(`${state.state_code} - ${state.state_name}`)] }),
            new TableCell({ children: [text(state.available_actions.join(", "))] }),
            new TableCell({ children: [text(state.responsible_roles.join(", "))] }),
            new TableCell({ children: [text(state.next_states.join(", "))] }),
          ],
        }),
    ),
  ];

  return [
    heading(`${workflow.workflow_name}`, HeadingLevel.HEADING_1),
    text(`Workflow Code: ${workflow.workflow_code}`, true),
    text(`Description: ${workflow.description}`),
    text(`Trigger Event: ${workflow.trigger_event}`),
    heading("States", HeadingLevel.HEADING_2),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }),
    heading("Transitions", HeadingLevel.HEADING_2),
    ...workflow.transitions.flatMap((transition) => [
      text(`From: ${transition.from_state} -> To: ${transition.to_state}`, true),
      text(`Trigger: ${transition.trigger}`),
      text(`Validations: ${transition.validations.join("; ") || "None"}`),
      text(`Actions: ${transition.actions.join("; ") || "None"}`),
    ]),
    heading("Notifications", HeadingLevel.HEADING_2),
    ...workflow.notifications.flatMap((n) => [
      text(`Trigger: ${n.trigger}`, true),
      text(`Template: ${n.template}`),
      text(`Recipients: ${n.recipients.join(", ")}`),
    ]),
    heading("Exceptions", HeadingLevel.HEADING_2),
    ...workflow.exceptions.flatMap((e) => [
      text(`Condition: ${e.condition}`, true),
      text(`Resolution: ${e.resolution}`),
    ]),
  ];
}