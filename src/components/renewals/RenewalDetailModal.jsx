import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";

/**
 * RenewalDetailModal
 * Rich detail view: full renewal info, rate comparison with auto-calc, disruption score visual,
 * recommendation CTAs, decision capture workflow, optional notes history.
 *
 * Props:
 *   renewal  — RenewalCycle
 *   open     — boolean
 *   onClose  — () => void
 */
export default function RenewalDetailModal({ renewal, open, onClose }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    current_premium: renewal?.current_premium || 0,
    renewal_premium: renewal?.renewal_premium || 0,
    rate_change_percent: renewal?.rate_change_percent || 0,
    disruption_score: renewal?.disruption_score || 0,
    recommendation: renewal?.recommendation || "",
    decision: renewal?.decision || "pending",
    notes: renewal?.notes || "",
    status: renewal?.status || "pre_renewal",
  });

  useEffect(() => {
    setFormData({
      current_premium: renewal?.current_premium || 0,
      renewal_premium: renewal?.renewal_premium || 0,
      rate_change_percent: renewal?.rate_change_percent || 0,
      disruption_score: renewal?.disruption_score || 0,
      recommendation: renewal?.recommendation || "",
      decision: renewal?.decision || "pending",
      notes: renewal?.notes || "",
      status: renewal?.status || "pre_renewal",
    });
    setIsEditing(false);
  }, [renewal]);

  const { data: linkedCase } = useQuery({
    queryKey: ["renewal-case", renewal?.case_id],
    queryFn: () => renewal?.case_id ? base44.entities.BenefitCase.filter({ id: renewal.case_id }) : Promise.resolve([]),
    enabled: open && !!renewal?.case_id,
  });

  const derivedStatus = useMemo(() => {
    if (formData.decision === "accepted_renewal") return "decision_made";
    if (formData.decision === "requests_changes") return "employer_review";
    if (formData.decision === "accepted_new_quote") return "decision_made";
    if (formData.decision === "declined") return "completed";
    return formData.status;
  }, [formData.decision, formData.status]);

  const update = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        status: derivedStatus,
        current_premium: Number(formData.current_premium) || 0,
        renewal_premium: Number(formData.renewal_premium) || 0,
        rate_change_percent: Number(formData.rate_change_percent) || 0,
        disruption_score: Number(formData.disruption_score) || 0,
        decision: formData.decision === "pending" ? "" : formData.decision,
        decision_date: formData.decision && formData.decision !== "pending" ? new Date().toISOString().slice(0, 10) : renewal?.decision_date,
      };

      const updated = await base44.entities.RenewalCycle.update(renewal.id, payload);

      if (renewal.case_id) {
        const caseUpdate = {
          last_activity_date: new Date().toISOString(),
        };

        if (payload.status === "completed" && payload.decision === "accepted_renewal") {
          caseUpdate.stage = "renewed";
        } else if (["pre_renewal", "marketed", "options_prepared", "employer_review", "decision_made", "install_renewal", "active_renewal"].includes(payload.status)) {
          caseUpdate.stage = "renewal_pending";
        }

        await base44.entities.BenefitCase.update(renewal.case_id, caseUpdate);
        await base44.entities.ActivityLog.create({
          case_id: renewal.case_id,
          action: "Renewal updated",
          detail: `${renewal.employer_name || "Renewal"} updated to ${payload.status}`,
          entity_type: "RenewalCycle",
          entity_id: renewal.id,
          new_value: JSON.stringify({ status: payload.status, decision: payload.decision, recommendation: payload.recommendation }),
        });
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renewals-all"] });
      queryClient.invalidateQueries({ queryKey: ["renewal-case", renewal?.case_id] });
      queryClient.invalidateQueries({ queryKey: ["case", renewal?.case_id] });
      setIsEditing(false);
    },
  });

  const deleteRenewal = useMutation({
    mutationFn: async () => {
      await base44.entities.RenewalCycle.delete(renewal.id);
      if (renewal.case_id) {
        await base44.entities.BenefitCase.update(renewal.case_id, {
          stage: "active",
          last_activity_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renewals-all"] });
      queryClient.invalidateQueries({ queryKey: ["case", renewal?.case_id] });
      onClose();
    },
  });

  const handleCalcRateChange = (currentPrem, renewalPrem) => {
    if (currentPrem && renewalPrem && currentPrem > 0) {
      const pct = ((renewalPrem - currentPrem) / currentPrem * 100).toFixed(1);
      setFormData(f => ({ ...f, rate_change_percent: parseFloat(pct) }));
    }
  };

  const caseLink = linkedCase?.[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{renewal?.employer_name || "Renewal Details"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Linked case */}
          {caseLink && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Linked Case</p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">{caseLink.employer_name} • {caseLink.case_number || caseLink.id.slice(-6)}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/cases/${caseLink.id}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Case
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status and dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <div className="mt-1.5">
                <StatusBadge status={derivedStatus} />
              </div>
            </div>
            {renewal?.renewal_date && (
              <div>
                <Label className="text-xs">Renewal Date</Label>
                <p className="text-sm font-medium mt-1.5">{format(new Date(renewal.renewal_date), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>

          {/* Premium section with auto-calc */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Premium & Rate Change</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="currentPrem" className="text-xs">Current Premium/mo ($)</Label>
                  <Input
                    id="currentPrem"
                    type="number"
                    step="0.01"
                    value={formData.current_premium}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFormData(f => ({ ...f, current_premium: val }));
                      handleCalcRateChange(val, formData.renewal_premium);
                    }}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="renewalPrem" className="text-xs">Renewal Premium/mo ($)</Label>
                  <Input
                    id="renewalPrem"
                    type="number"
                    step="0.01"
                    value={formData.renewal_premium}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFormData(f => ({ ...f, renewal_premium: val }));
                      handleCalcRateChange(formData.current_premium, val);
                    }}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rateChange" className="text-xs">Rate Change (%)</Label>
                <Input
                  id="rateChange"
                  type="number"
                  step="0.1"
                  value={formData.rate_change_percent}
                  onChange={(e) => setFormData(f => ({ ...f, rate_change_percent: parseFloat(e.target.value) }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Auto-calculates when you update premiums above.</p>
              </div>

              {formData.current_premium && formData.renewal_premium && (
                <div className="p-3 rounded-lg bg-muted/40 text-sm">
                  <p className="text-muted-foreground text-xs">Monthly difference:</p>
                  <p className={`font-semibold ${formData.renewal_premium > formData.current_premium ? "text-destructive" : "text-green-600"}`}>
                    {formData.renewal_premium > formData.current_premium ? "+" : ""}${(formData.renewal_premium - formData.current_premium).toFixed(2)}/month
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disruption score visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Disruption Risk Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <span className={`text-lg font-bold ${
                  formData.disruption_score >= 70 ? "text-destructive" :
                  formData.disruption_score >= 40 ? "text-amber-600" :
                  "text-green-600"
                }`}>
                  {formData.disruption_score}/100
                </span>
              </div>
              <Progress value={formData.disruption_score} className="h-2" />
              {!isEditing ? (
                <p className="text-xs text-muted-foreground">
                  {formData.disruption_score >= 70 ? "High risk of employer dissatisfaction" :
                   formData.disruption_score >= 40 ? "Moderate risk, recommend clear communication" :
                   "Low risk, good renewal opportunity"}
                </p>
              ) : (
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.disruption_score}
                  onChange={(e) => setFormData(f => ({ ...f, disruption_score: parseInt(e.target.value) }))}
                />
              )}
            </CardContent>
          </Card>

          {/* Recommendation and decision workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommendation & Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="rec" className="text-xs">Recommendation</Label>
                <Select
                  value={formData.recommendation}
                  onValueChange={(v) => setFormData(f => ({ ...f, recommendation: v }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="rec" className="mt-1">
                    <SelectValue placeholder="Select recommendation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renew_as_is">Renew As-Is</SelectItem>
                    <SelectItem value="renew_with_changes">Renew with Changes</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="terminate">Terminate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="decision" className="text-xs">Employer Decision</Label>
                <Select
                  value={formData.decision}
                  onValueChange={(v) => setFormData(f => ({ ...f, decision: v }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="decision" className="mt-1">
                    <SelectValue placeholder="Select employer decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted_renewal">Accepted Renewal</SelectItem>
                    <SelectItem value="requests_changes">Requests Changes</SelectItem>
                    <SelectItem value="accepted_new_quote">Accepted New Quote</SelectItem>
                    <SelectItem value="declined">Declined / Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recommendation CTAs */}
              {!isEditing && (
                <div className="pt-2 border-t space-y-2">
                  {formData.recommendation === "market" && caseLink && (
                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                      <a href={`/cases/${caseLink.id}`} target="_blank" rel="noreferrer">Open Linked Case</a>
                    </Button>
                  )}
                  {formData.recommendation === "renew_as_is" && formData.decision === "accepted_renewal" && (
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setIsEditing(true)}>
                      Advance to Install
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                placeholder="Internal notes about this renewal..."
                disabled={!isEditing}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isEditing ? (
              <>
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Close
                </Button>
                <Button className="flex-1" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button variant="destructive" size="icon" onClick={() => {
                  if (confirm("Are you sure? This will delete the renewal cycle.")) {
                    deleteRenewal.mutate();
                  }
                }} disabled={deleteRenewal.isPending}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => update.mutate()} disabled={update.isPending}>
                  {update.isPending ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}