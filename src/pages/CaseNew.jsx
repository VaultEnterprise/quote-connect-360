import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createValidatedEntityRecord } from "@/services/entities/validatedEntityWrites";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckSquare, Square, Building2, Briefcase, Users, Phone, MapPin, FileText } from "lucide-react";
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
  { value: "hsa",       label: "HSA / HRA" },
  { value: "accident",  label: "Accident" },
  { value: "critical_illness", label: "Critical Illness" },
];

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

const SIC_COMMON = [
  { code: "5411", label: "5411 — Grocery Stores" },
  { code: "5511", label: "5511 — Auto Dealers" },
  { code: "5812", label: "5812 — Eating Places (Restaurants)" },
  { code: "6411", label: "6411 — Insurance Agents & Brokers" },
  { code: "7011", label: "7011 — Hotels & Motels" },
  { code: "7372", label: "7372 — Software" },
  { code: "7371", label: "7371 — Computer Programming" },
  { code: "8011", label: "8011 — Offices & Clinics of Doctors" },
  { code: "8049", label: "8049 — Offices of Other Health Practitioners" },
  { code: "8099", label: "8099 — Health Services, NEC" },
  { code: "8111", label: "8111 — Legal Services" },
  { code: "8711", label: "8711 — Engineering Services" },
  { code: "8721", label: "8721 — Accounting & Auditing" },
  { code: "8742", label: "8742 — Management Consulting" },
  { code: "8999", label: "8999 — Services, NEC" },
  { code: "1731", label: "1731 — Electrical Work (Construction)" },
  { code: "1521", label: "1521 — General Building Contractors" },
  { code: "2000", label: "2000 — Food & Kindred Products (Mfg)" },
  { code: "3559", label: "3559 — Special Industry Machinery (Mfg)" },
  { code: "4213", label: "4213 — Trucking, Except Local" },
  { code: "4812", label: "4812 — Telephone Communications" },
  { code: "5065", label: "5065 — Electronic Parts (Wholesale)" },
  { code: "5122", label: "5122 — Drugs & Drug Proprietaries (Wholesale)" },
  { code: "6020", label: "6020 — Banks" },
  { code: "6311", label: "6311 — Life Insurance" },
  { code: "9999", label: "9999 — Other / Not Listed" },
];

const INDUSTRY_OPTIONS = [
  "Agriculture","Construction","Education","Finance & Banking","Government",
  "Healthcare & Medical","Hospitality & Food Service","Insurance","Legal",
  "Manufacturing","Non-Profit","Professional Services","Real Estate",
  "Retail","Technology","Transportation","Utilities","Wholesale","Other",
];

export default function CaseNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: agencies  = [] } = useQuery({ queryKey: ["agencies"],  queryFn: () => base44.entities.Agency.list() });
  const { data: employers = [] } = useQuery({ queryKey: ["employers"], queryFn: () => base44.entities.EmployerGroup.list("-created_date", 200) });

  const [form, setForm] = useState({
    // Employer
    employer_group_id:   "",
    employer_name:       "",
    dba_name:            "",
    ein:                 "",
    industry:            "",
    sic_code:            "",
    // Location
    address:             "",
    city:                "",
    state:               "",
    zip:                 "",
    // Headcount
    employee_count:      "",
    eligible_count:      "",
    // Contact
    primary_contact_name:  "",
    primary_contact_email: "",
    primary_contact_phone: "",
    // Case
    case_type:           "new_business",
    effective_date:      "",
    renewal_date:        "",
    target_close_date:   "",
    priority:            "normal",
    assigned_to:         user?.email || "",
    agency_id:           "",
    // Existing coverage
    current_carrier:     "",
    current_renewal_increase: "",
    // Products
    products_requested:  ["medical"],
    // Notes
    notes:               "",
  });

  const [newAgency, setNewAgency] = useState({ name: "", code: "" });
  const [submitError, setSubmitError] = useState("");
  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateAgencyField = (field, value) => setNewAgency(prev => ({ ...prev, [field]: value }));
  const showNewAgencyFields = agencies.length === 0 || form.agency_id === "__new__";
  const agencyOptions = useMemo(() => agencies, [agencies]);

  const toggleProduct = (val) => {
    setForm(prev => ({
      ...prev,
      products_requested: prev.products_requested.includes(val)
        ? prev.products_requested.filter(p => p !== val)
        : [...prev.products_requested, val],
    }));
  };

  const handleEmployerSelect = (id) => {
    const emp = employers.find(e => e.id === id);
    if (!emp) return;
    setForm(prev => ({
      ...prev,
      employer_group_id:     id,
      employer_name:         emp.name || prev.employer_name,
      dba_name:              emp.dba_name || prev.dba_name,
      ein:                   emp.ein || prev.ein,
      industry:              emp.industry || prev.industry,
      sic_code:              emp.sic_code || prev.sic_code,
      address:               emp.address || prev.address,
      city:                  emp.city || prev.city,
      state:                 emp.state || prev.state,
      zip:                   emp.zip || prev.zip,
      employee_count:        emp.employee_count ? String(emp.employee_count) : prev.employee_count,
      eligible_count:        emp.eligible_count ? String(emp.eligible_count) : prev.eligible_count,
      primary_contact_name:  emp.primary_contact_name || prev.primary_contact_name,
      primary_contact_email: emp.primary_contact_email || prev.primary_contact_email,
      primary_contact_phone: emp.primary_contact_phone || prev.primary_contact_phone,
      renewal_date:          emp.renewal_date || prev.renewal_date,
      effective_date:        emp.effective_date || prev.effective_date,
    }));
  };

  const createCase = useMutation({
    mutationFn: async (data) => {
      let agencyId = data.agency_id;
      if (agencyId === "__new__") {
        agencyId = (await createValidatedEntityRecord("Agency", {
          name: newAgency.name,
          code: newAgency.code,
          status: "active",
        }, ["name", "code"]))?.id;
      }

      if (!agencyId && agencies[0]?.id) {
        agencyId = agencies[0].id;
      }

      if (!agencyId) {
        throw new Error("An agency is required before creating a case.");
      }

      const caseNumber = `BC-${Date.now().toString(36).toUpperCase()}`;
      let empGroupId = data.employer_group_id;

      if (!empGroupId && data.employer_name) {
        const newEmployer = await createValidatedEntityRecord("EmployerGroup", {
          agency_id: agencyId,
          name: data.employer_name,
          dba_name: data.dba_name || undefined,
          ein: data.ein || undefined,
          industry: data.industry || undefined,
          sic_code: data.sic_code || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          zip: data.zip || undefined,
          employee_count: data.employee_count ? Number(data.employee_count) : undefined,
          eligible_count: data.eligible_count ? Number(data.eligible_count) : undefined,
          primary_contact_name: data.primary_contact_name || undefined,
          primary_contact_email: data.primary_contact_email || undefined,
          primary_contact_phone: data.primary_contact_phone || undefined,
          renewal_date: data.renewal_date || undefined,
          effective_date: data.effective_date || undefined,
          status: "prospect",
        }, ["agency_id", "name"]);
        empGroupId = newEmployer.id;
      }

      if (!empGroupId) {
        throw new Error("Select an existing employer or enter a new employer name.");
      }

      return createValidatedEntityRecord("BenefitCase", {
        agency_id: agencyId,
        employer_group_id: empGroupId,
        employer_name: data.employer_name,
        case_number: caseNumber,
        case_type: data.case_type,
        effective_date: data.effective_date || undefined,
        target_close_date: data.target_close_date || undefined,
        priority: data.priority,
        assigned_to: data.assigned_to || undefined,
        products_requested: data.products_requested,
        employee_count: data.employee_count ? Number(data.employee_count) : undefined,
        notes: data.notes || undefined,
        stage: "draft",
        census_status: "not_started",
        quote_status: "not_started",
        enrollment_status: "not_started",
        last_activity_date: new Date().toISOString(),
      }, ["agency_id", "employer_group_id", "case_type", "effective_date"]);
    },
    onSuccess: (result) => {
      setSubmitError("");
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["employers"] });
      navigate(`/cases/${result.id}`);
    },
    onError: (error) => {
      setSubmitError(error.message || "Unable to create case.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");

    const employeeCount = form.employee_count ? Number(form.employee_count) : null;
    const eligibleCount = form.eligible_count ? Number(form.eligible_count) : null;

    if (!form.employer_name.trim()) {
      setSubmitError("Employer name is required.");
      return;
    }

    if (!form.case_type) {
      setSubmitError("Case type is required.");
      return;
    }

    if (showNewAgencyFields && (!newAgency.name.trim() || !newAgency.code.trim())) {
      setSubmitError("New agency name and code are required.");
      return;
    }

    if (employeeCount !== null && eligibleCount !== null && eligibleCount > employeeCount) {
      setSubmitError("Eligible count cannot be greater than total employee count.");
      return;
    }

    if (form.products_requested.length === 0) {
      setSubmitError("Select at least one requested product.");
      return;
    }

    createCase.mutate(form);
  };

  const selectedSic = SIC_COMMON.find(s => s.code === form.sic_code);

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/cases">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Benefit Case</h1>
          <p className="text-sm text-muted-foreground">Create a new case to start the benefits lifecycle</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ─── Employer Selection ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />Employer Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employers.length > 0 && (
              <div>
                <Label>Select Existing Employer Group</Label>
                <Select value={form.employer_group_id} onValueChange={handleEmployerSelect}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Search or select employer..." /></SelectTrigger>
                  <SelectContent>
                    {employers.map(eg => (
                      <SelectItem key={eg.id} value={eg.id}>
                        {eg.name}{eg.city ? ` — ${eg.city}, ${eg.state}` : ""}{eg.sic_code ? ` (SIC: ${eg.sic_code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Legal Business Name <span className="text-destructive">*</span></Label>
                <Input value={form.employer_name} onChange={e => { updateField("employer_name", e.target.value); updateField("employer_group_id", ""); }} placeholder="Acme Corporation" className="mt-1.5" required />
              </div>
              <div>
                <Label>DBA Name</Label>
                <Input value={form.dba_name} onChange={e => updateField("dba_name", e.target.value)} placeholder="Doing business as..." className="mt-1.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>EIN (Employer ID Number)</Label>
                <Input value={form.ein} onChange={e => updateField("ein", e.target.value)} placeholder="XX-XXXXXXX" className="mt-1.5" />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={v => updateField("industry", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry..." /></SelectTrigger>
                  <SelectContent>{INDUSTRY_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>SIC Code</Label>
                <Select value={form.sic_code} onValueChange={v => updateField("sic_code", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select SIC code..." /></SelectTrigger>
                  <SelectContent>
                    {SIC_COMMON.map(s => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {/* Allow manual entry too */}
                <Input value={form.sic_code} onChange={e => updateField("sic_code", e.target.value)} placeholder="Or type SIC code directly" className="mt-1.5 text-xs" />
              </div>
              <div className="flex flex-col justify-end">
                {form.sic_code && (
                  <div className="p-2 rounded-lg bg-muted text-xs">
                    <p className="font-medium">SIC: {form.sic_code}</p>
                    <p className="text-muted-foreground">{selectedSic?.label.split(" — ")[1] || "Custom code"}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Location ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Business Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Street Address</Label>
              <Input value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="123 Main St" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label>City</Label>
                <Input value={form.city} onChange={e => updateField("city", e.target.value)} placeholder="City" className="mt-1.5" />
              </div>
              <div>
                <Label>State</Label>
                <Select value={form.state} onValueChange={v => updateField("state", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="ST" /></SelectTrigger>
                  <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={e => updateField("zip", e.target.value)} placeholder="00000" className="mt-1.5" maxLength={10} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Headcount ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Workforce</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Employee Count</Label>
              <Input type="number" value={form.employee_count} onChange={e => updateField("employee_count", e.target.value)} placeholder="e.g. 75" className="mt-1.5" min={1} />
            </div>
            <div>
              <Label>Benefit-Eligible Count</Label>
              <Input type="number" value={form.eligible_count} onChange={e => updateField("eligible_count", e.target.value)} placeholder="e.g. 60" className="mt-1.5" min={1} />
            </div>
          </CardContent>
        </Card>

        {/* ─── Primary Contact ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Primary Contact (HR / Decision Maker)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={form.primary_contact_name} onChange={e => updateField("primary_contact_name", e.target.value)} placeholder="Jane Smith" className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.primary_contact_email} onChange={e => updateField("primary_contact_email", e.target.value)} placeholder="jane@company.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.primary_contact_phone} onChange={e => updateField("primary_contact_phone", e.target.value)} placeholder="(555) 000-0000" className="mt-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Case Details ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Case Type</Label>
                <Select value={form.case_type} onValueChange={v => updateField("case_type", v)}>
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
                <Select value={form.priority} onValueChange={v => updateField("priority", v)}>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Effective Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.effective_date} onChange={e => updateField("effective_date", e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input type="date" value={form.renewal_date} onChange={e => updateField("renewal_date", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Target Close Date</Label>
                <Input type="date" value={form.target_close_date} onChange={e => updateField("target_close_date", e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Assigned Broker / Rep</Label>
                <Input value={form.assigned_to} onChange={e => updateField("assigned_to", e.target.value)} placeholder="broker@agency.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Agency</Label>
                <Select value={form.agency_id} onValueChange={v => updateField("agency_id", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select agency..." /></SelectTrigger>
                  <SelectContent>
                    {agencyOptions.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    <SelectItem value="__new__">+ Add New Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showNewAgencyFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-dashed p-4">
                <div>
                  <Label>New Agency Name</Label>
                  <Input value={newAgency.name} onChange={e => updateAgencyField("name", e.target.value)} placeholder="Agency name" className="mt-1.5" />
                </div>
                <div>
                  <Label>Agency Code</Label>
                  <Input value={newAgency.code} onChange={e => updateAgencyField("code", e.target.value)} placeholder="Unique code" className="mt-1.5" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Existing Coverage ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Existing / Current Coverage</CardTitle>
            <p className="text-xs text-muted-foreground">For renewals and takeovers — helps benchmark quotes</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Current Carrier</Label>
              <Input value={form.current_carrier} onChange={e => updateField("current_carrier", e.target.value)} placeholder="e.g. Aetna, UnitedHealthcare" className="mt-1.5" />
            </div>
            <div>
              <Label>Renewal Rate Increase (%)</Label>
              <Input type="number" step="0.1" value={form.current_renewal_increase} onChange={e => updateField("current_renewal_increase", e.target.value)} placeholder="e.g. 8.5" className="mt-1.5" />
              {form.current_renewal_increase && parseFloat(form.current_renewal_increase) > 10 && (
                <p className="text-xs text-amber-600 mt-1">⚠ Increase exceeds 10% — rate variance alert will be flagged</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Products ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Products Requested</CardTitle>
            <p className="text-xs text-muted-foreground">Select all benefit lines the employer is shopping for</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {PRODUCT_OPTIONS.map(p => {
                const selected = form.products_requested.includes(p.value);
                return (
                  <button key={p.value} type="button" onClick={() => toggleProduct(p.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${selected ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {selected ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
                    {p.label}
                  </button>
                );
              })}
            </div>
            {form.products_requested.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="text-xs text-muted-foreground">Selected:</span>
                {form.products_requested.map(p => <Badge key={p} variant="secondary" className="text-xs capitalize">{p.replace("_", " ")}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Notes ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Notes & Special Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={form.notes} onChange={e => updateField("notes", e.target.value)}
              placeholder="Initial notes, special underwriting considerations, union status, multi-location notes, etc."
              rows={3} />
          </CardContent>
        </Card>

        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Link to="/cases"><Button variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={createCase.isPending || !form.employer_name || (showNewAgencyFields && (!newAgency.name || !newAgency.code))} className="shadow-sm min-w-36">
            {createCase.isPending ? "Creating..." : "Create Case →"}
          </Button>
        </div>
      </form>
    </div>
  );
}