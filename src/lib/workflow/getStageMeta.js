import { STAGE_LABELS } from "@/contracts/workflow/stageDefinitions";
import { CASE_STAGE_GROUPS } from "@/contracts/workflow/statusMappings";
import { getAllowedTransitions } from "@/lib/workflow/getAllowedTransitions";

export function getStageMeta(stage) {
  const group = CASE_STAGE_GROUPS.find((item) => item.match(stage));
  const [nextStage] = getAllowedTransitions(stage);

  return {
    key: stage,
    label: STAGE_LABELS[stage] || stage,
    nextStage,
    groupKey: group?.key,
    groupLabel: group?.label,
    color: group?.color,
  };
}