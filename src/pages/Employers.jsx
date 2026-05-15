import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Plus, Search, MapPin, Phone, Mail, Users,
  Pencil, AlertTriangle, Briefcase, Filter, X, Eye, CheckSquare, Upload
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { differenceInDays, parseISO, isAfter } from "date-fns";
import EmployerDetailDrawer from "@/components/employer/EmployerDetailDrawer";
import { BulkActionsBar, EmployerImportModal } from "@/components/employer/BulkActionsBar";
import { QuickCreateCase } from "@/components/employer/QuickCreateCase";
import { RenewalDashboard } from "@/components/employer/RenewalDashboard";
import EmployerControlSummary from "@/components/employer/EmployerControlSummary";
import EmployerDependencyPanel from "@/components/employer/EmployerDependencyPanel";
import { buildEmployerControlPlane, buildEmployerConfigDraft, serializeEmployerConfigDraft } from "@/components/employer/employerConfigEngine";

const INDUSTRIES = [
  "Accommodation & Food Services",
  "Agriculture, Forestry & Fishing",
  "Arts, Entertainment & Recreation",
  "Construction",
  "Education",
  "Finance & Insurance",
  "Government",
  "Healthcare & Social Assistance",
  "Information Technology",
  "Legal Services",
  "Manufacturing",
  "Non-Profit",
  "Professional, Scientific & Technical",
  "Real Estate",
  "Retail Trade",
  "Transportation & Warehousing",
  "Utilities",
  "Wholesale Trade",
  "Other",
];

function EmployerModal({ employer, open, onClose, agencies }) {
  const queryClient = useQueryClient();
  const isEdit = !!employer;
  const [form, setForm] = useState({
    name: employer?.name || "",
    dba_name: employer?.dba_name || "",
    ein: employer?.ein || "",
    industry: employer?.industry || "",
    sic_code: employer?.sic_code || "",
    address: employer?.address || "",
    city: employer?.city || "",
    state: employer?.state || "",
    zip: employer?.zip || "",
    phone: employer?.phone || "",
    website: employer?.website || "",
    employee_count: employer?.employee_count || "",
    eligible_count: employer?.eligible_count || "",
    effective_date: employer?.effective_date || "",
    renewal_date: employer?.renewal_date || "",
    status: employer?.status || "prospect",
    agency_id: employer?.agency_id || "",
    primary_contact_name: employer?.primary_contact_name || "",
    primary_contact_email: employer?.primary_contact_email || "",
    primary_contact_phone: employer?.primary_contact_phone || "",
    ...buildEmployerConfigDraft(employer),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        employee_count: Number(form.employee_count) || undefined,
        eligible_count: Number(form.eligible_count) || undefined,
        settings: serializeEmployerConfigDraft(form),
      };
      return isEdit
        ? base44.entities.EmployerGroup.update(employer.id, payload)
        : base44.entities.EmployerGroup.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employers"] }); onClose(); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Employer" : "New Employer Group"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">

          {/* Agency picker */}
          {agencies.length > 0 && (
            <div>
              <Label>Agency <span className="text-destructive">*</span></Label>
              <Select value={form.agency_id || agencies[0]?.id} onValueChange={v => set("agency_id", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select agency..." /></SelectTrigger>
                <SelectContent>
                  {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Legal Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1.5" /></div>
            <div><Label>DBA Name</Label><Input value={form.dba_name} onChange={e => set("dba_name", e.target.value)} className="mt-1.5" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>EIN</Label><Input value={form.ein} onChange={e => set("ein", e.target.value)} className="mt-1.5" placeholder="XX-XXXXXXX" /></div>
            <div><Label>SIC Code</Label><Input value={form.sic_code} onChange={e => set("sic_code", e.target.value)} className="mt-1.5" placeholder="e.g. 7372" /></div>
          </div>

          <div>
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={v => set("industry", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry..." /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div><Label>Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1.5" /></div>
            <div><Label>State</Label><Input value={form.state} onChange={e => set("state", e.target.value)} className="mt-1.5" maxLength={2} /></div>
            <div><Label>ZIP</Label><Input value={form.zip} onChange={e => set("zip", e.target.value)} className="mt-1.5" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => set("website", e.target.value)} className="mt-1.5" /></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><Label>Total Employees</Label><Input type="number" value={form.employee_count} onChange={e => set("employee_count", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Eligible Employees</Label><Input type="number" value={form.eligible_count} onChange={e => set("eligible_count", e.target.value)} className="mt-1.5" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Effective Date</Label><Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Renewal Date</Label><Input type="date" value={form.renewal_date} onChange={e => set("renewal_date", e.target.value)} className="mt-1.5" /></div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Primary Contact</p>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Name</Label><Input value={form.primary_contact_name} onChange={e => set("primary_contact_name", e.target.value)} className="mt-1.5" /></div>
              <div><Label>Email</Label><Input value={form.primary_contact_email} onChange={e => set("primary_contact_email", e.target.value)} className="mt-1.5" /></div>
              <div><Label>Phone</Label><Input value={form.primary_contact_phone} onChange={e => set("primary_contact_phone", e.target.value)} className="mt-1.5" /></div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <p className="text-sm font-medium">Employer Control Plane</p>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Waiting Period (days)</Label><Input type="number" value={form.eligibility_waiting_period_days} onChange={e => set("eligibility_waiting_period_days", e.target.value)} className="mt-1.5" /></div>
              <div><Label>Minimum Hours / Week</Label><Input type="number" value={form.eligibility_minimum_hours_per_week} onChange={e => set("eligibility_minimum_hours_per_week", e.target.value)} className="mt-1.5" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contribution Strategy</Label>
                <Select value={form.contribution_strategy} onValueChange={v => set("contribution_strategy", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat_dollar">Flat Dollar</SelectItem>
                    <SelectItem value="defined_contribution">Defined Contribution</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Enabled Products</Label><Input value={form.enabled_products} onChange={e => set("enabled_products", e.target.value)} className="mt-1.5" placeholder="medical, dental, vision" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Employer % Employee</Label><Input type="number" value={form.contribution_employee_percent} onChange={e => set("contribution_employee_percent", e.target.value)} className="mt-1.5" /></div>
              <div><Label>Employer % Dependent</Label><Input type="number" value={form.contribution_dependent_percent} onChange={e => set("contribution_dependent_percent", e.target.value)} className="mt-1.5" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Billing Method</Label>
                <Select value={form.billing_method} onValueChange={v => set("billing_method", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carrier_invoice">Carrier Invoice</SelectItem>
                    <SelectItem value="self_bill">Self Bill</SelectItem>
                    <SelectItem value="payroll_deduction">Payroll Deduction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payroll System</Label>
                <Select value={form.payroll_system} onValueChange={v => set("payroll_system", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="adp">ADP</SelectItem>
                    <SelectItem value="paychex">Paychex</SelectItem>
                    <SelectItem value="workday">Workday</SelectItem>
                    <SelectItem value="gusto">Gusto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>
            {save.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Employer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Employers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState(null);
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [viewingEmployer, setViewingEmployer] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRenewalDashboard, setShowRenewalDashboard] = useState(false);

  const { data: employers = [] } = useQuery({
    queryKey: ["employers"],
    queryFn: () => base44.entities.EmployerGroup.list("-created_date", 100),
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: () => base44.entities.Agency.list(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 500),
  });

  const { data: censusMembers = [] } = useQuery({
    queryKey: ["employer-census-members"],
    queryFn: () => base44.entities.CensusMember.list("-created_date", 1000),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["employer-proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 300),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["employer-enrollments"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 300),
  });

  const { data: renewals = [] } = useQuery({
    queryKey: ["employer-renewals"],
    queryFn: () => base44.entities.RenewalCycle.list("-created_date", 300),
  });

  // Build case count map per employer group
  const caseCountMap = useMemo(() => {
    const map = {};
    cases.forEach(c => {
      if (c.employer_group_id) {
        map[c.employer_group_id] = (map[c.employer_group_id] || 0) + 1;
      }
    });
    return map;
  }, [cases]);

  // Build active case ID map for linking
  const activeCaseMap = useMemo(() => {
    const map = {};
    cases.forEach(c => {
      if (c.employer_group_id && !map[c.employer_group_id]) {
        map[c.employer_group_id] = c.id;
      }
    });
    return map;
  }, [cases]);

  const now = new Date();

  const filtered = useMemo(() => employers.filter(e => {
    const matchSearch = !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.city?.toLowerCase().includes(search.toLowerCase()) ||
      e.industry?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  }), [employers, search, statusFilter]);

  const renewingSoon = useMemo(() => employers.filter(e => {
    if (!e.renewal_date) return false;
    const rd = parseISO(e.renewal_date);
    const days = differenceInDays(rd, now);
    return days >= 0 && days <= 60;
  }), [employers]);

  const employerControlPlane = useMemo(() => {
    const firstEmployer = filtered[0];
    if (!firstEmployer) return null;
    return buildEmployerControlPlane(firstEmployer, {
      censusMembers: censusMembers.filter((member) => member.case_id && cases.some((item) => item.id === member.case_id && item.employer_group_id === firstEmployer.id)),
      proposals: proposals.filter((proposal) => cases.some((item) => item.id === proposal.case_id && item.employer_group_id === firstEmployer.id)),
      enrollments: enrollments.filter((enrollment) => cases.some((item) => item.id === enrollment.case_id && item.employer_group_id === firstEmployer.id)),
      renewals: renewals.filter((renewal) => renewal.employer_group_id === firstEmployer.id),
      cases: cases.filter((item) => item.employer_group_id === firstEmployer.id),
    });
  }, [filtered, censusMembers, proposals, enrollments, renewals, cases]);

  return (
    <div>
      <PageHeader
        title="Master Groups"
        description="Manage employer accounts, renewals, documents, and quick case creation"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowRenewalDashboard(!showRenewalDashboard)}>
              <Briefcase className="w-4 h-4 mr-1" /> {showRenewalDashboard ? "Hide" : "Show"} Renewals
            </Button>
            <Button size="sm" onClick={() => { setEditingEmployer(null); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> New Employer
            </Button>
          </div>
        }
      />

      <EmployerControlSummary controlPlane={employerControlPlane} />
      <EmployerDependencyPanel controlPlane={employerControlPlane} />

      {/* Renewal Dashboard */}
      {showRenewalDashboard && (
        <RenewalDashboard employers={employers} onEmployerClick={setViewingEmployer} />
      )}

      {/* Renewal warning banner */}
      {renewingSoon.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span><strong>{renewingSoon.length}</strong> employer group{renewingSoon.length !== 1 ? "s" : ""} renewing within 60 days</span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedEmployers.length > 0 && (
        <BulkActionsBar
          selectedEmployers={selectedEmployers}
          onClearSelection={() => setSelectedEmployers([])}
          agencies={agencies}
        />
      )}

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search employers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
          <Upload className="w-3.5 h-3.5 mr-1" /> Import
        </Button>
        <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} employer{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No Employer Groups" description="Add employer groups to associate with benefit cases"
          actionLabel="New Employer" onAction={() => setShowModal(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map(eg => {
            const daysToRenewal = eg.renewal_date ? differenceInDays(parseISO(eg.renewal_date), now) : null;
            const isRenewing = daysToRenewal !== null && daysToRenewal >= 0 && daysToRenewal <= 60;
            const caseCount = caseCountMap[eg.id] || 0;
            const firstCaseId = activeCaseMap[eg.id];
            const isSelected = selectedEmployers.some(e => e.id === eg.id);

            return (
              <Card key={eg.id} className={`hover:shadow-md transition-all ${isRenewing ? "border-amber-300" : ""} ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmployers(prev => [...prev, eg]);
                        } else {
                          setSelectedEmployers(prev => prev.filter(e => e.id !== eg.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setViewingEmployer(eg)}
                              className="text-sm font-semibold text-left hover:underline flex items-center gap-2"
                            >
                              {eg.name}
                              <Eye className="w-3 h-3 text-muted-foreground" />
                            </button>
                            {eg.dba_name && <span className="text-xs text-muted-foreground">dba {eg.dba_name}</span>}
                            {isRenewing && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                                <AlertTriangle className="w-2.5 h-2.5" /> Renews in {daysToRenewal}d
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            {eg.industry && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{eg.industry}</span>}
                            {(eg.city || eg.state) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[eg.city, eg.state].filter(Boolean).join(", ")}</span>}
                            {eg.employee_count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{eg.employee_count} employees</span>}
                            {eg.primary_contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{eg.primary_contact_email}</span>}
                            {eg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{eg.phone}</span>}
                            {eg.sic_code && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">SIC {eg.sic_code}</span>}
                          </div>
                          {eg.primary_contact_name && (
                            <p className="text-xs text-muted-foreground mt-0.5">Contact: {eg.primary_contact_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <QuickCreateCase employer={eg} />
                        {caseCount > 0 && (
                          firstCaseId ? (
                            <Link to={`/cases/${firstCaseId}`}>
                              <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors">
                                {caseCount} case{caseCount !== 1 ? "s" : ""} →
                              </Badge>
                            </Link>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">{caseCount} case{caseCount !== 1 ? "s" : ""}</Badge>
                          )
                        )}
                        <StatusBadge status={eg.status} />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingEmployer(eg); setShowModal(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <EmployerModal
          employer={editingEmployer}
          agencies={agencies}
          open={showModal}
          onClose={() => { setShowModal(false); setEditingEmployer(null); }}
        />
      )}

      {viewingEmployer && (
        <EmployerDetailDrawer
          employer={viewingEmployer}
          cases={cases}
          documents={documents}
          open={!!viewingEmployer}
          onClose={() => setViewingEmployer(null)}
        />
      )}

      {showImportModal && (
        <EmployerImportModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          agencies={agencies}
        />
      )}
    </div>
  );
}