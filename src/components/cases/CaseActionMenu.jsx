import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Copy, ArrowRight, Plus } from "lucide-react";
import CaseEditModal from "./CaseEditModal";
import CloneCaseModal from "./CloneCaseModal";
import StageAdvanceModal from "./StageAdvanceModal";
import TaskQuickCreate from "./TaskQuickCreate";
import { getNextStage, getNextStageLabel } from "@/utils/caseWorkflow";

export default function CaseActionMenu({ caseData }) {
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [showAdvance, setShowAdvance] = useState(false);
  const [showTaskCreate, setShowTaskCreate] = useState(false);

  const nextStage = getNextStage(caseData?.stage);
  const nextStageLabel = getNextStageLabel(caseData?.stage);

  const advanceStage = useMutation({
    mutationFn: () => base44.entities.BenefitCase.update(caseData.id, {
      stage: nextStage,
      last_activity_date: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setShowAdvance(false);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Pencil className="w-4 h-4" />
            Edit case
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowClone(true)}>
            <Copy className="w-4 h-4" />
            Clone case
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowTaskCreate(true)}>
            <Plus className="w-4 h-4" />
            Add task
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowAdvance(true)} disabled={!nextStage}>
            <ArrowRight className="w-4 h-4" />
            {nextStageLabel ? `Advance to ${nextStageLabel}` : "No next stage"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showEdit && <CaseEditModal caseData={caseData} open={showEdit} onClose={() => setShowEdit(false)} />}
      {showClone && <CloneCaseModal isOpen={showClone} caseData={caseData} onClose={() => setShowClone(false)} />}
      {showTaskCreate && <TaskQuickCreate isOpen={showTaskCreate} caseId={caseData.id} onClose={() => setShowTaskCreate(false)} />}
      {showAdvance && nextStage && (
        <StageAdvanceModal
          caseData={caseData}
          nextStage={nextStage}
          nextStageLabel={nextStageLabel}
          open={showAdvance}
          onClose={() => setShowAdvance(false)}
          onConfirm={() => advanceStage.mutate()}
        />
      )}
    </>
  );
}