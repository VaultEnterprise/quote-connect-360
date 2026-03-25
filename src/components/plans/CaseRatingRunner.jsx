import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

function fmt(n) { return n != null ? `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"; }

export default function CaseRatingRunner({ plans, schedules }) {
  const [caseId, setCaseId] = useState("");
  const [planId, setPlanId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState(null);

  const { data: cases = [] } = useQuery({
    queryKey: ["benefit-cases-rating"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const filteredSchedules = schedules.filter(s => s.plan_id === planId && s.is_active);

  const rateMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", {
        action: "rateCensus", caseId, planId, rateScheduleId: scheduleId || undefined, effectiveDate,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.error) { toast.error(data.error); return; }
      toast.success(`Rated ${data.total_members_rated} members — ${fmt(data.total_monthly_premium)}/mo`);
    },
  });

  const selectedCase = cases.find(c => c.id === caseId);
  const selectedPlan = plans.find(p => p.id === planId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Census Rating Engine</CardTitle>
          <p className="text-xs text-muted-foreground">Runs the full backend rating pipeline: ZIP → Area → DOB → Age Band → Tier → Rate Lookup</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Case (census members)</label>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select case..." /></SelectTrigger>
                <SelectContent>{cases.map(c => <SelectItem key={c.id} value={c.id}>{c.employer_name || c.case_number} ({c.employee_count || "?"} EEs)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Plan</label>
              <Select value={planId} onValueChange={v => { setPlanId(v); setScheduleId(""); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select plan..." /></SelectTrigger>
                <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name} — {p.carrier}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Rate Schedule (optional — uses latest if blank)</label>
              <Select value={scheduleId} onValueChange={setScheduleId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Auto-select latest" /></SelectTrigger>
                <SelectContent><SelectItem value={null}>Auto (latest active)</SelectItem>{filteredSchedules.map(s => <SelectItem key={s.id} value={s.id}>{s.schedule_name} v{s.version_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Rating Effective Date</label>
              <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <Button onClick={() => rateMutation.mutate()} disabled={!caseId || !planId || rateMutation.isPending} className="gap-2">
            <Zap className="w-4 h-4" />{rateMutation.isPending ? "Rating census..." : "Run Rating Engine"}
          </Button>
        </CardContent>
      </Card>

      {result && !result.error && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Monthly Premium", val: fmt(result.total_monthly_premium), icon: DollarSign, color: "text-primary" },
              { label: "Members Rated", val: result.total_members_rated, icon: CheckCircle, color: "text-green-600" },
              { label: "Failed Members", val: result.total_members_failed, icon: AlertTriangle, color: result.total_members_failed > 0 ? "text-red-600" : "text-muted-foreground" },
              { label: "Members Total", val: (result.total_members_rated || 0) + (result.total_members_failed || 0), icon: Users, color: "text-blue-600" },
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardContent className="p-3 flex items-center gap-2">
                  <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
                  <div><p className="text-lg font-bold leading-none">{kpi.val}</p><p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tier breakdown */}
          {result.tier_breakdown && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Premium by Tier</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(result.tier_breakdown).map(([tier, data]) => (
                    <div key={tier} className="p-3 rounded-lg border text-center">
                      <Badge className="mb-1">{tier}</Badge>
                      <p className="font-bold text-base">{fmt(data.premium)}</p>
                      <p className="text-xs text-muted-foreground">{data.count} member(s)</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating area breakdown */}
          {result.rating_area_breakdown && Object.keys(result.rating_area_breakdown).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Premium by Rating Area</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {Object.entries(result.rating_area_breakdown).sort((a,b) => b[1].premium - a[1].premium).map(([area, data]) => (
                    <div key={area} className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="w-16 justify-center text-xs">{area}</Badge>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(data.premium / result.total_monthly_premium) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium w-24 text-right">{fmt(data.premium)}</span>
                      <span className="text-xs text-muted-foreground w-16 text-right">{data.count} members</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings / errors */}
          {(result.warnings?.length > 0 || result.errors?.length > 0) && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Rating Warnings & Errors</CardTitle></CardHeader>
              <CardContent className="space-y-1 max-h-40 overflow-y-auto">
                {[...result.errors || [], ...result.warnings || []].map((msg, i) => (
                  <p key={i} className="text-xs text-amber-700">· {msg}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Member detail */}
          {result.member_results?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Member-Level Results</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80 border-b"><tr><th className="text-left px-3 py-1.5">Member</th><th className="text-center px-3 py-1.5">Age</th><th className="text-center px-3 py-1.5">Band</th><th className="text-center px-3 py-1.5">Tier</th><th className="text-center px-3 py-1.5">Area</th><th className="text-right px-3 py-1.5">Monthly Rate</th><th className="text-left px-3 py-1.5">Status</th></tr></thead>
                    <tbody>
                      {result.member_results.map((m, i) => (
                        <tr key={i} className={`border-b last:border-0 ${m.errors?.length > 0 ? "bg-red-50" : "hover:bg-muted/20"}`}>
                          <td className="px-3 py-1.5 font-medium">{m.name}</td>
                          <td className="px-3 py-1.5 text-center">{m.age ?? "—"}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{m.age_band_code || "—"}</td>
                          <td className="px-3 py-1.5 text-center">{m.tier_code ? <Badge className="text-xs h-4 px-1">{m.tier_code}</Badge> : "—"}</td>
                          <td className="px-3 py-1.5 text-center text-muted-foreground">{m.rating_area_code || "—"}</td>
                          <td className="px-3 py-1.5 text-right font-semibold">{m.monthly_rate != null ? fmt(m.monthly_rate) : "—"}</td>
                          <td className="px-3 py-1.5">{m.errors?.length > 0 ? <span className="text-red-600">{m.errors.join("; ")}</span> : <span className="text-green-600">✓</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}