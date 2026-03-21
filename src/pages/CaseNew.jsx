import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";

export default function CaseNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: () => base44.entities.Agency.list(),
  });

  const { data: employers = [] } = useQuery({
    queryKey: ["employers"],
    queryFn: () => base44.entities.EmployerGroup.list("-created_date", 100),
  });

  const [form, setForm] = useState({
    employer_group_id: "",
    employer_name: "",
    case_type: "new_business",
    effective_date: "",
    priority: "normal",
    notes: "",
    assigned_to: user?.email || "",
    employee_count: "",
  });

  const createCase = useMutation({
    mutationFn: async (data) => {
      const agencyId = agencies[0]?.id || "default";
      const employer = employers.find(e => e.id === data.employer_group_id);
      const caseNumber = `BC-${Date.now().toString(36).toUpperCase()}`;
      return base44.entities.BenefitCase.create({
        ...data,
        agency_id: agencyId,
        employer_name: employer?.name || data.employer_name,
        case_number: caseNumber,
        employee_count: data.employee_count ? Number(data.employee_count) : undefined,
        stage: "draft",
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      navigate(`/cases/${result.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createCase.mutate(form);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/cases">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Benefit Case</h1>
          <p className="text-sm text-muted-foreground">Create a new case to start the benefits lifecycle</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Employer Group</Label>
              {employers.length > 0 ? (
                <Select value={form.employer_group_id} onValueChange={(v) => {
                  const emp = employers.find(e => e.id === v);
                  updateField("employer_group_id", v);
                  if (emp) {
                    updateField("employer_name", emp.name);
                    if (emp.employee_count) updateField("employee_count", String(emp.employee_count));
                  }
                }}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select existing employer group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employers.map((eg) => (
                      <SelectItem key={eg.id} value={eg.id}>{eg.name} {eg.city ? `— ${eg.city}, ${eg.state}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Input
                value={form.employer_name}
                onChange={(e) => { updateField("employer_name", e.target.value); updateField("employer_group_id", ""); }}
                placeholder={employers.length > 0 ? "Or type a new employer name..." : "Enter employer name"}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Case Type</Label>
                <Select value={form.case_type} onValueChange={(v) => updateField("case_type", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_business">New Business</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="mid_year_change">Mid-Year Change</SelectItem>
                    <SelectItem value="takeover">Takeover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => updateField("priority", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={form.effective_date}
                  onChange={(e) => updateField("effective_date", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Employee Count</Label>
                <Input
                  type="number"
                  value={form.employee_count}
                  onChange={(e) => updateField("employee_count", e.target.value)}
                  placeholder="e.g. 25"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Assigned To</Label>
              <Input
                value={form.assigned_to}
                onChange={(e) => updateField("assigned_to", e.target.value)}
                placeholder="Email of assigned broker"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Any initial notes about this case..."
                className="mt-1.5"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link to="/cases">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={createCase.isPending} className="shadow-sm">
            {createCase.isPending ? "Creating..." : "Create Case"}
          </Button>
        </div>
      </form>
    </div>
  );
}