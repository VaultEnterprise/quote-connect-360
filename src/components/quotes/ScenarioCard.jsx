import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, DollarSign, Calendar, Star, Calculator, XCircle,
  ArrowRight, ChevronDown, ChevronUp, AlertTriangle, Pencil,
  Trash2, CheckSquare, Square, MoreHorizontal, Copy, Send,
  StickyNote, Clock, Sliders
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/shared/StatusBadge";
import { format, parseISO, differenceInDays, isAfter, differenceInCalendarDays } from "date-fns";
import CloneScenarioDialog from "./CloneScenarioDialog";
import CreateProposalFromScenario from "./CreateProposalFromScenario";

const PRODUCT_COLORS = {
  medical: "bg-blue-100 text-blue-700",
  dental: "bg-emerald-100 text-emerald-700",
  vision: "bg-purple-100 text-purple-700",
  life: "bg-amber-100 text-amber-700",
  std: "bg-orange-100 text-orange-700",
  ltd: "bg-red-100 text-red-700",
  accident: "bg-pink-100 text-pink-700",
  critical_illness: "bg-rose-100 text-rose-700",
};

const TYPE_COLORS = {
  medical: "bg-blue-100 text-blue-700",
  dental: "bg-emerald-100 text-emerald-700",
  vision: "bg-purple-100 text-purple-700",
  life: "bg-amber-100 text-amber-700",
  std: "bg-orange-100 text-orange-700",
  ltd: "bg-red-100 text-red-700",
  voluntary: "bg-pink-100 text-pink-700",
};

// Carrier initials avatar color
function carrierColor(name) {
  const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700", "bg-orange-100 text-orange-700"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function ScenarioCard({ scenario, isSelected, onToggleSelect, onEdit, calculating, onCalculate, onShowDetails, onApproval, onContribution }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const now = new Date();
  const expiresAt = scenario.expires_at ? parseISO(scenario.expires_at) : null;
  const daysUntilExpiry = expiresAt ? differenceInDays(expiresAt, now) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 14;
  const isExpired = expiresAt && !isAfter(expiresAt, now);

  // Stale rates warning: quoted > 45 days ago
  const quotedDaysAgo = scenario.quoted_at ? differenceInCalendarDays(now, parseISO(scenario.quoted_at)) : null;
  const isStale = quotedDaysAgo !== null && quotedDaysAgo > 45 && scenario.status === "completed";

  // Effective date approaching warning: eff date within 14 days and status not completed
  const effectiveDate = scenario.effective_date ? parseISO(scenario.effective_date) : null;
  const daysToEffective = effectiveDate ? differenceInCalendarDays(effectiveDate, now) : null;
  const effectiveApproaching = daysToEffective !== null && daysToEffective >= 0 && daysToEffective <= 14 && !["completed"].includes(scenario.status);

  const { data: scenarioPlans = [] } = useQuery({
    queryKey: ["scenario-plans", scenario.id],
    queryFn: () => base44.entities.ScenarioPlan.filter({ scenario_id: scenario.id }),
    enabled: expanded,
  });

  const updateScenario = useMutation({
    mutationFn: (data) => base44.entities.QuoteScenario.update(scenario.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scenarios-all"] }),
  });

  const deleteScenario = useMutation({
    mutationFn: () => base44.entities.QuoteScenario.delete(scenario.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scenarios-all"] }),
  });

  const totalPremium = scenario.total_monthly_premium || 0;
  const employerCost = scenario.employer_monthly_cost || 0;
  const eeCost = scenario.employee_monthly_cost_avg || 0;
  const employerPct = totalPremium > 0 ? Math.round((employerCost / totalPremium) * 100) : 0;

  const isCalc = calculating === scenario.id;

  const STATUS_BORDER = {
    draft: "border-l-gray-300",
    running: "border-l-blue-400",
    completed: "border-l-green-500",
    error: "border-l-destructive",
    expired: "border-l-orange-400",
  };

  return (
  <>
    <Card className={`border-l-4 ${STATUS_BORDER[scenario.status] || "border-l-gray-300"} transition-all ${isSelected ? "ring-2 ring-primary/30 bg-primary/5" : "hover:shadow-md"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Select checkbox */}
          <button
            className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => onToggleSelect(scenario.id)}
          >
            {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Top Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{scenario.name}</p>
              <StatusBadge status={scenario.status} />
              {scenario.has_incomplete_rates && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                  ⚠ Incomplete Rates
                </span>
              )}
              {scenario.is_recommended && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                  <Star className="w-2.5 h-2.5 mr-0.5" fill="currentColor" /> Recommended
                </Badge>
              )}
              {scenario.recommendation_score != null && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">
                  Score: {scenario.recommendation_score}/100
                </span>
              )}
              {isExpiringSoon && !isExpired && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                  <AlertTriangle className="w-2.5 h-2.5" /> Exp. in {daysUntilExpiry}d
                </span>
              )}
              {isExpired && scenario.status !== "expired" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="w-2.5 h-2.5" /> Expired
                </span>
              )}
              {isStale && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <Clock className="w-2.5 h-2.5" /> Rates {quotedDaysAgo}d old
                </span>
              )}
              {effectiveApproaching && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="w-2.5 h-2.5" /> Eff. date in {daysToEffective}d — not complete
                </span>
              )}
            </div>

            {/* Products + Carrier Avatars */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {scenario.products_included?.map(p => (
                <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${PRODUCT_COLORS[p] || "bg-gray-100 text-gray-700"}`}>
                  {p.replace(/_/g, " ")}
                </span>
              ))}
              {scenario.carriers_included?.map(c => (
                <span key={c} title={c} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${carrierColor(c)}`}>
                  {c.substring(0, 3).toUpperCase()}
                </span>
              ))}
            </div>

            {/* Financial row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {totalPremium > 0 && (
                <span className="flex items-center gap-0.5 text-primary font-semibold">
                  <DollarSign className="w-3 h-3" />{totalPremium.toLocaleString()}/mo total
                </span>
              )}
              {employerCost > 0 && <span>${employerCost.toLocaleString()}/mo employer</span>}
              {eeCost > 0 && <span>~${eeCost.toFixed(0)}/mo avg EE</span>}
              {scenario.plan_count > 0 && <span>{scenario.plan_count} plans</span>}
              {scenario.carriers_included?.length > 0 && (
                <span>{scenario.carriers_included.join(", ")}</span>
              )}
              {scenario.effective_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Eff. {format(parseISO(scenario.effective_date), "MMM d, yyyy")}
                </span>
              )}
              {scenario.quoted_at && (
                <span>Quoted {format(parseISO(scenario.quoted_at), "MMM d")}</span>
              )}
            </div>

            {/* Cost share bar */}
            {totalPremium > 0 && employerCost > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                  <span>Employer {employerPct}%</span>
                  <span>Employee {100 - employerPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                  <div className="bg-primary rounded-l-full" style={{ width: `${employerPct}%` }} />
                  <div className="bg-muted-foreground/30 rounded-r-full flex-1" />
                </div>
              </div>
            )}

            {/* Inline Notes */}
            {showNotes && scenario.notes && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{scenario.notes}</p>
              </div>
            )}

            {/* Expanded plan list */}
            {expanded && (
              <div className="mt-3 border-t pt-3 space-y-1.5">
                {scenarioPlans.length === 0 ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-dashed">
                    <p className="text-xs text-muted-foreground">No plans added to this scenario yet.</p>
                    <Link to={`/cases/${scenario.case_id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                      Add plans <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{scenarioPlans.length} plan(s)</p>
                    {scenarioPlans.map(sp => (
                      <div key={sp.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold">{sp.plan_name}</span>
                            {sp.plan_type && (
                              <Badge className={`text-[9px] py-0 ${TYPE_COLORS[sp.plan_type] || "bg-gray-100 text-gray-700"}`}>
                                {sp.plan_type.toUpperCase()}
                              </Badge>
                            )}
                            {sp.network_type && (
                              <Badge variant="outline" className="text-[9px] py-0">{sp.network_type}</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{sp.carrier}</p>
                        </div>
                        <div className="text-right text-[10px] text-muted-foreground flex-shrink-0">
                          <p>EE: {sp.employer_contribution_ee ?? "—"}{sp.contribution_type === "flat_dollar" ? "$" : "%"}</p>
                          <p>Dep: {sp.employer_contribution_dep ?? "—"}{sp.contribution_type === "flat_dollar" ? "$" : "%"}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {["draft", "error"].includes(scenario.status) && (
              <Button size="sm" className="text-xs h-7" onClick={() => onCalculate(scenario)} disabled={isCalc}>
                {isCalc ? (
                  <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Calculating…</>
                ) : (
                  <><Calculator className="w-3 h-3 mr-1.5" />Calculate</>
                )}
              </Button>
            )}

            {scenario.notes && (
              <Button
                variant="ghost" size="icon"
                className={`h-7 w-7 ${showNotes ? "text-amber-600" : ""}`}
                title="Toggle notes"
                onClick={() => setShowNotes(v => !v)}
              >
                <StickyNote className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button
              variant="ghost" size="icon"
              className="h-7 w-7"
              title="Expand plans"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setShowClone(true)}>
                  <Copy className="w-3.5 h-3.5 mr-2" /> Clone Scenario
                </DropdownMenuItem>
                {scenario.status === "completed" && (
                  <DropdownMenuItem onClick={() => setShowProposal(true)}>
                    <Send className="w-3.5 h-3.5 mr-2" /> Create Proposal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => updateScenario.mutate({ is_recommended: !scenario.is_recommended })}>
                  <Star className="w-3.5 h-3.5 mr-2" />
                  {scenario.is_recommended ? "Remove Recommendation" : "Mark Recommended"}
                </DropdownMenuItem>
                {onShowDetails && (
                  <DropdownMenuItem onClick={() => onShowDetails(scenario)}>
                    <FileText className="w-3.5 h-3.5 mr-2" /> View Details
                  </DropdownMenuItem>
                )}
                {onApproval && (
                  <DropdownMenuItem onClick={() => onApproval(scenario)}>
                    <Send className="w-3.5 h-3.5 mr-2" /> Approval
                  </DropdownMenuItem>
                )}
                {onContribution && (
                  <DropdownMenuItem onClick={() => onContribution(scenario)}>
                    <Sliders className="w-3.5 h-3.5 mr-2" /> Adjust Contribution
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(scenario)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Scenario
                </DropdownMenuItem>
                {scenario.status !== "expired" && (
                  <DropdownMenuItem onClick={() => updateScenario.mutate({ status: "expired" })}>
                    <XCircle className="w-3.5 h-3.5 mr-2" /> Mark Expired
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = `/cases/${scenario.case_id}`}>
                  <ArrowRight className="w-3.5 h-3.5 mr-2" /> Open Case
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteScenario.mutate()}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>

    {showClone && (
      <CloneScenarioDialog scenario={scenario} open={showClone} onClose={() => setShowClone(false)} />
    )}
    {showProposal && (
      <CreateProposalFromScenario scenario={scenario} open={showProposal} onClose={() => setShowProposal(false)} />
    )}
  </>
  );
}