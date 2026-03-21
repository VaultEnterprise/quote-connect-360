import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, MapPin, Phone, Mail, Users, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

function EmployerModal({ employer, open, onClose, agencyId }) {
  const queryClient = useQueryClient();
  const isEdit = !!employer;
  const [form, setForm] = useState({
    name: employer?.name || "",
    dba_name: employer?.dba_name || "",
    ein: employer?.ein || "",
    industry: employer?.industry || "",
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
    primary_contact_name: employer?.primary_contact_name || "",
    primary_contact_email: employer?.primary_contact_email || "",
    primary_contact_phone: employer?.primary_contact_phone || "",
  });

  const save = useMutation({
    mutationFn: () => isEdit
      ? base44.entities.EmployerGroup.update(employer.id, { ...form, employee_count: Number(form.employee_count) || undefined, eligible_count: Number(form.eligible_count) || undefined })
      : base44.entities.EmployerGroup.create({ ...form, agency_id: agencyId || "default", employee_count: Number(form.employee_count) || undefined, eligible_count: Number(form.eligible_count) || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employers"] }); onClose(); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Employer" : "New Employer Group"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Legal Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1.5" /></div>
            <div><Label>DBA Name</Label><Input value={form.dba_name} onChange={e => set("dba_name", e.target.value)} className="mt-1.5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>EIN</Label><Input value={form.ein} onChange={e => set("ein", e.target.value)} className="mt-1.5" placeholder="XX-XXXXXXX" /></div>
            <div><Label>Industry</Label><Input value={form.industry} onChange={e => set("industry", e.target.value)} className="mt-1.5" /></div>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>{save.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Employer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Employers() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState(null);

  const { data: employers = [] } = useQuery({
    queryKey: ["employers"],
    queryFn: () => base44.entities.EmployerGroup.list("-created_date", 100),
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: () => base44.entities.Agency.list(),
  });

  const filtered = employers.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Employer Groups"
        description="Manage your employer group accounts"
        actions={
          <Button size="sm" onClick={() => { setEditingEmployer(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> New Employer
          </Button>
        }
      />

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No Employer Groups" description="Add employer groups to associate with benefit cases"
          actionLabel="New Employer" onAction={() => setShowModal(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map(eg => (
            <Card key={eg.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{eg.name}</p>
                        {eg.dba_name && <span className="text-xs text-muted-foreground">dba {eg.dba_name}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {eg.industry && <span>{eg.industry}</span>}
                        {(eg.city || eg.state) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[eg.city, eg.state].filter(Boolean).join(", ")}</span>}
                        {eg.employee_count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{eg.employee_count} employees</span>}
                        {eg.primary_contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{eg.primary_contact_email}</span>}
                        {eg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{eg.phone}</span>}
                      </div>
                      {eg.primary_contact_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">Contact: {eg.primary_contact_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={eg.status} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingEmployer(eg); setShowModal(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <EmployerModal
          employer={editingEmployer}
          agencyId={agencies[0]?.id}
          open={showModal}
          onClose={() => { setShowModal(false); setEditingEmployer(null); }}
        />
      )}
    </div>
  );
}