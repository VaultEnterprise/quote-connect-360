// runtime/workflow_runtime.ts
// State machine and workflow validation

import { WorkflowDecision, WorkflowTransition, GuardRule } from "./models";

export class WorkflowRuntime {
  private transitions: Map<string, WorkflowTransition[]> = new Map();
  private guard_rules: Map<string, GuardRule> = new Map();

  registerTransitions(workflow_code: string, transitions: WorkflowTransition[]): void {
    this.transitions.set(workflow_code, transitions);
  }

  registerGuardRule(guard_rule_code: string, rule: GuardRule): void {
    this.guard_rules.set(guard_rule_code, rule);
  }

  evaluateTransition(
    workflow_code: string,
    current_state: string,
    transition_code: string,
    facts: Record<string, any> = {}
  ): WorkflowDecision {
    const transitions = this.transitions.get(workflow_code);
    if (!transitions) {
      return {
        allowed: false,
        transition_code,
        from_state: current_state,
        reason: `Workflow not found: ${workflow_code}`,
      };
    }

    const transition = transitions.find(
      (t) => t.from_state === current_state && t.transition_code === transition_code
    );

    if (!transition) {
      return {
        allowed: false,
        transition_code,
        from_state: current_state,
        reason: `No transition found from ${current_state} with code ${transition_code}`,
      };
    }

    // Evaluate guard rule if present
    if (transition.guard_rule_code) {
      const guard_rule = this.guard_rules.get(transition.guard_rule_code);
      if (!guard_rule) {
        return {
          allowed: false,
          transition_code,
          from_state: current_state,
          to_state: transition.to_state,
          reason: `Guard rule not found: ${transition.guard_rule_code}`,
        };
      }

      const passed = guard_rule.evaluate(facts);
      if (!passed) {
        return {
          allowed: false,
          transition_code,
          from_state: current_state,
          to_state: transition.to_state,
          reason: `Guard rule failed: ${transition.guard_rule_code}`,
        };
      }
    }

    return {
      allowed: true,
      transition_code,
      from_state: current_state,
      to_state: transition.to_state,
    };
  }
}