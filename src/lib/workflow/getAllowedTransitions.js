import { STAGE_ORDER } from "@/contracts/workflow/stageDefinitions";

export function getAllowedTransitions(stage) {
  const currentIndex = STAGE_ORDER.indexOf(stage || "draft");
  if (currentIndex < 0) return [];
  return STAGE_ORDER.slice(currentIndex + 1, currentIndex + 2);
}