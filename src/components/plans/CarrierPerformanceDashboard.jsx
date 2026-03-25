import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Award, TrendingUp, AlertCircle, Phone, Mail, Plus, Star } from "lucide-react";
import { toast } from "sonner";

const MetricCard = ({ label, value, suffix = "", color = "text-foreground", sub }) => (
  <div className="text-center p-3 rounded-lg bg-muted/40">
    <p className={`text-2xl font-bold ${color}`}>{value}{suffix}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

export default function CarrierPerformanceDashboard({ plans }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ carrier_name: "", win_rate: "", average_client_retention: "", average_rate_increase: "", complaint_count: "", service_score: "", account_manager: "", account_phone: "", account_email: "" });

  const { data: performances = [], isLoading } = useQuery({
    queryKey: ["carrier-performances"],
    queryFn: () => base44.entities.CarrierPerformance.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CarrierPerformance.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["carrier-performances"] }); setShowAdd(false); toast.success("Carrier added"); },
  });

  // Augment performances with plan count from plans array
  const carriersWithData = performances.map(cp => {
    const carrierPlans = plans.filter(p => p.carrier === cp.carrier_name);
    return { ...cp, plan_count: carrierPlans.length, utilization: cp.total_plans_used || 0 };
  });

  const chartData = carriersWithData.slice(0, 6).map(c => ({
    name: c.carrier_name.split(" ").slice(-1)[0],
    win: c.win_rate || 0,
    retention: c.average_client_retention || 0,
    plans: c.plan_count,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Carrier Performance Dashboard</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" /> Add Carrier
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_,i) => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : carriersWithData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No carrier performance data. Add carrier metrics to begin.</div>
      ) : (
        <>
          {/* Win/Retention Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Win Rate vs. Retention Rate (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="win" name="Win Rate %" fill="hsl(var(--primary))" radius={[2,2,0,0]} />
                    <Bar dataKey="retention" name="Retention %" fill="hsl(var(--accent))" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Carrier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {carriersWithData.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{c.carrier_name}</p>
                      <p className="text-xs text-muted-foreground">{c.plan_count} plans in library</p>
                    </div>
                    {c.service_score && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold">{c.service_score}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <MetricCard label="Win Rate" value={c.win_rate || "—"} suffix={c.win_rate ? "%" : ""} color="text-blue-600" />
                    <MetricCard label="Retention" value={c.average_client_retention || "—"} suffix={c.average_client_retention ? "%" : ""} color="text-green-600" />
                    <MetricCard label="Avg Rate↑" value={c.average_rate_increase || "—"} suffix={c.average_rate_increase ? "%" : ""} color={c.average_rate_increase > 10 ? "text-red-600" : "text-foreground"} />
                  </div>
                  {c.complaint_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                      <AlertCircle className="w-3 h-3" /> {c.complaint_count} complaints on record
                    </div>
                  )}
                  <div className="border-t pt-2 text-xs text-muted-foreground space-y-1">
                    {c.account_manager && <p className="flex items-center gap-1"><span className="font-medium">Rep:</span> {c.account_manager}</p>}
                    {c.account_phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.account_phone}</p>}
                    {c.account_email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.account_email}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Carrier Performance Data</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              {[["carrier_name","Carrier Name"],["win_rate","Win Rate (%)"],["average_client_retention","Retention (%)"],["average_rate_increase","Avg Rate Increase (%)"],["complaint_count","Complaint Count"],["service_score","Service Score (1-5)"],["account_manager","Account Manager"],["account_phone","Account Phone"],["account_email","Account Email"]].map(([key, label]) => (
                <div key={key} className={key === "carrier_name" ? "col-span-2" : ""}>
                  <label className="text-xs font-medium mb-1 block">{label}</label>
                  <Input value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="h-8 text-xs" />
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.carrier_name || createMutation.isPending}>Add Carrier</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}