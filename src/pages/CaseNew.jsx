import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";

const PRODUCT_OPTIONS = [
  { value: "medical",   label: "Medical" },
  { value: "dental",    label: "Dental" },
  { value: "vision",    label: "Vision" },
  { value: "life",      label: "Life" },
  { value: "std",       label: "Short-Term Disability" },
  { value: "ltd",       label: "Long-Term Disability" },
  { value: "voluntary", label: "Voluntary" },
];

export default function CaseNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: agencies  = [] } = useQuery({ queryKey: ["agencies"],   queryFn: () => base44.entities.Agency.list() });
  const { data: employers = [] } = useQuery({ queryKey: ["employers"],  queryFn: () => base44.entities.EmployerGroup.list("-created_date", 100) });

  const [form, setForm] = useState({
    employer_group_id:  "",
    employer_name:      "",
    case_type:          "new_business",
    effective_date:     "",
    target_close_date:  "",
    priority:           "normal",
    notes:              "",
    assigned_to:        user?.email || "",
    employee_count:     "",
    products_requested: ["medical"],
  });

  const toggleProduct = (val) => {
    setForm(prev => ({
      ...prev,
      products_requested: prev.products_requested.includes(val)
        ? prev.products_requested.filter(p => p !== val)
        : [...prev.products_requested, val],
    }));
  };

  const createCase = useMutation({
    mutationFn: async (data) => {
      const agencyId   = agencies[0]?.id || "default";
      const employer   = employers.find(e => e.id === data.employer_group_id);
      const caseNumber = `BC-${Date.now().toString(36).toUpperCase()}`;
      return base44.entities.BenefitCase.create({
        ...data,
        agency_id:     agencyId,
        employer_name: employer?.name || data.employer_name,
        case_number:   caseNumber,
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employer */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Employer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {employers.length > 0 && (
              <div>
                <Label>Select Existing Employer Group</Label>
                <Select value={form.employer_group_id} onValueChange={(v) => {
                  const emp = employers.find(e => e.id === v);
                  updateField("employer_group_id", v);
                  if (emp) {
                    updateField("employer_name", emp.name);
                    if (emp.employee_count) updateField("employee_count", String(emp.employee_count));
                  }
                }}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select employer group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employers.map((eg) => (
                      <SelectItem key={eg.id} value={eg.id}>{eg.name}{eg.city ? ` — ${eg.city}, ${eg.state}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>{employers.length > 0 ? "Or Enter New Employer Name" : "Employer Name"}</Label>
              <Input
                value={form.employer_name}
                onChange={(e) => { updateField("employer_name", e.target.value); updateField("employer_group_id", ""); }}
                placeholder="Enter employer name"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label>Employee Count</Label>
              <Input
                type="number"
                value={form.employee_count}
                onChange={(e) => updateField("employee_count", e.target.value)}
                placeholder="e.g. 50"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Case Details */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Case Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Case Type</Label>
                <Select value={form.case_type} onValueChange={(v) => updateField("case_type", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
                <Input type="date" value={form.effective_date} onChange={(e) => updateField("effective_date", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Target Close Date</Label>
                <Input type="date" value={form.target_close_date} onChange={(e) => updateField("target_close_date", e.target.value)} className="mt-1.5" />
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
          </CardContent>
        </Card>

        {/* Products Requested */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Products Requested</CardTitle>
            <p className="text-xs text-muted-foreground">Select all benefit lines the employer is shopping for</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_OPTIONS.map(p => {
                const selected = form.products_requested.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => toggleProduct(p.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selected ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {selected ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
                    {p.label}
                  </button>
                );
              })}
            </div>
            {form.products_requested.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="text-xs text-muted-foreground">Selected:</span>
                {form.products_requested.map(p => (
                  <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any initial notes about this case, special requirements, or context..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/cases">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={createCase.isPending || !form.employer_name} className="shadow-sm min-w-32">
            {createCase.isPending ? "Creating..." : "Create Case"}
          </Button>
        </div>
      </form>
    </div>
  );
}