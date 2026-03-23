import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RateTableDashboard({ plan }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [showNewRate, setShowNewRate] = useState(false);
  const [newRate, setNewRate] = useState({
    rate_type: "composite",
    ee_rate: "",
    es_rate: "",
    ec_rate: "",
    fam_rate: "",
  });

  const { data: rateTables = [] } = useQuery({
    queryKey: ["rate-tables", plan?.id],
    queryFn: () => base44.entities.PlanRateTable.filter({ plan_id: plan?.id }, "effective_date", 50),
  });

  const updateRateTable = useMutation({
    mutationFn: (data) => base44.entities.PlanRateTable.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-tables", plan?.id] });
      toast({ title: "Rate table updated" });
      setEditing(null);
    },
  });

  const deleteRateTable = useMutation({
    mutationFn: (id) => base44.entities.PlanRateTable.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-tables", plan?.id] });
      toast({ title: "Rate table deleted" });
    },
  });

  const createRateTable = useMutation({
    mutationFn: (data) =>
      base44.entities.PlanRateTable.create({
        ...data,
        plan_id: plan?.id,
        effective_date: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-tables", plan?.id] });
      toast({ title: "Rate table created" });
      setShowNewRate(false);
      setNewRate({ rate_type: "composite", ee_rate: "", es_rate: "", ec_rate: "", fam_rate: "" });
    },
  });

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Rate Tables</CardTitle>
          <Button size="sm" onClick={() => setShowNewRate(true)} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" /> Add Rate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rateTables.length === 0 && !showNewRate && (
          <p className="text-xs text-muted-foreground">No rate tables defined.</p>
        )}

        {rateTables.map((rt) => (
          <div key={rt.id} className="p-2 rounded-lg border bg-white text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">Eff: {rt.effective_date?.substring(0, 10)}</span>
              <Badge variant="outline" className="text-[10px]">{rt.rate_type}</Badge>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={() => setEditing(rt)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-destructive"
                  onClick={() => deleteRateTable.mutate(rt.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div>
                <span className="text-muted-foreground">EE:</span> ${rt.ee_rate}
              </div>
              <div>
                <span className="text-muted-foreground">ES:</span> ${rt.es_rate}
              </div>
              <div>
                <span className="text-muted-foreground">EC:</span> ${rt.ec_rate}
              </div>
              <div>
                <span className="text-muted-foreground">Fam:</span> ${rt.fam_rate}
              </div>
            </div>
          </div>
        ))}

        {(showNewRate || editing) && (
          <div className="p-2 rounded-lg border bg-white space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="EE Rate"
                value={editing?.ee_rate || newRate.ee_rate}
                onChange={(e) => {
                  if (editing) setEditing({ ...editing, ee_rate: e.target.value });
                  else setNewRate({ ...newRate, ee_rate: e.target.value });
                }}
                className="h-7 text-xs"
              />
              <Input
                placeholder="ES Rate"
                value={editing?.es_rate || newRate.es_rate}
                onChange={(e) => {
                  if (editing) setEditing({ ...editing, es_rate: e.target.value });
                  else setNewRate({ ...newRate, es_rate: e.target.value });
                }}
                className="h-7 text-xs"
              />
              <Input
                placeholder="EC Rate"
                value={editing?.ec_rate || newRate.ec_rate}
                onChange={(e) => {
                  if (editing) setEditing({ ...editing, ec_rate: e.target.value });
                  else setNewRate({ ...newRate, ec_rate: e.target.value });
                }}
                className="h-7 text-xs"
              />
              <Input
                placeholder="Family Rate"
                value={editing?.fam_rate || newRate.fam_rate}
                onChange={(e) => {
                  if (editing) setEditing({ ...editing, fam_rate: e.target.value });
                  else setNewRate({ ...newRate, fam_rate: e.target.value });
                }}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-6 text-xs flex-1"
                onClick={() => {
                  if (editing) updateRateTable.mutate(editing);
                  else createRateTable.mutate(newRate);
                }}
              >
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                onClick={() => {
                  setEditing(null);
                  setShowNewRate(false);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}