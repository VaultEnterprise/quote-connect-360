import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, BookOpen, BarChart2, Grid, Star, Archive, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import PlanCard from "@/components/plans/PlanCard";
import PlanFormModal from "@/components/plans/PlanFormModal";
import PlanImportModal from "@/components/plans/PlanImportModal";
import PlanAnalyticsPanel from "@/components/plans/PlanAnalyticsPanel";
import PlanLibraryGuide from "@/components/plans/PlanLibraryGuide";
import PlanQualityChecklist from "@/components/plans/PlanQualityChecklist";
import PlanArchiveManager from "@/components/plans/PlanArchiveManager";
import PlanLibraryKPIBar from "@/components/plans/PlanLibraryKPIBar";
import PlanDetailDrawer from "@/components/plans/PlanDetailDrawer";

const MEDICAL_SUBTABS = [
  { key: "all_medical", label: "All Medical" },
  { key: "mec", label: "MEC" },
  { key: "mvp", label: "MVP" },
  { key: "mec_bronze", label: "MEC Bronze" },
  { key: "mec_elite", label: "MEC Elite" },
  { key: "aca_bronze", label: "ACA Bronze" },
  { key: "aca_silver", label: "ACA Silver" },
  { key: "aca_gold", label: "ACA Gold" },
  { key: "aca_platinum", label: "ACA Platinum" },
  { key: "hdhp", label: "HDHP" },
];

const ANCILLARY_SUBTABS = [
  { key: "all_ancillary", label: "All Ancillary" },
  { key: "dental", label: "Dental" },
  { key: "vision", label: "Vision" },
  { key: "life", label: "Life" },
  { key: "std", label: "STD" },
  { key: "ltd", label: "LTD" },
  { key: "voluntary", label: "Voluntary" },
  { key: "accident", label: "Accident" },
  { key: "critical_illness", label: "Critical Illness" },
  { key: "hospital_indemnity", label: "Hospital Indemnity" },
];

const ANCILLARY_TYPES = ["dental","vision","life","std","ltd","voluntary","accident","critical_illness","hospital_indemnity"];

function matchesMedicalSubtab(plan, subtab) {
  if (subtab === "all_medical") return true;
  if (subtab === "hdhp") return plan.network_type === "HDHP" || plan.plan_subtype === "hdhp";
  return plan.plan_subtype === subtab || plan.metal_level?.toLowerCase().replace(" ","_") === subtab;
}

export default function PlanLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [detailPlan, setDetailPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("medical");
  const [medicalSubtab, setMedicalSubtab] = useState("all_medical");
  const [ancillarySubtab, setAncillarySubtab] = useState("all_ancillary");
  const [viewMode, setViewMode] = useState("grid");
  const [defaultPlanType, setDefaultPlanType] = useState("medical");

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500),
  });

  const plans = allPlans.filter(p => p.status === "active" || !p.status);
  const archivedPlans = allPlans.filter(p => p.status === "archived");

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.BenefitPlan.update(id, { status: "archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => base44.entities.BenefitPlan.update(id, { status: "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] }),
  });

  const medicalPlans = plans.filter(p => p.plan_type === "medical");
  const ancillaryPlans = plans.filter(p => ANCILLARY_TYPES.includes(p.plan_type));
  const featuredPlans = plans.filter(p => p.is_featured);

  const carriers = useMemo(() => [...new Set(plans.map(p => p.carrier).filter(Boolean))].sort(), [plans]);

  const filterPlans = (list) => list.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.plan_name?.toLowerCase().includes(q) ||
      p.carrier?.toLowerCase().includes(q) ||
      p.plan_code?.toLowerCase().includes(q) ||
      p.metal_level?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q));
    const matchCarrier = carrierFilter === "all" || p.carrier === carrierFilter;
    const matchNetwork = networkFilter === "all" || p.network_type === networkFilter;
    return matchSearch && matchCarrier && matchNetwork;
  });

  const filteredMedical = useMemo(() => {
    const base = filterPlans(medicalPlans);
    return base.filter(p => matchesMedicalSubtab(p, medicalSubtab));
  }, [medicalPlans, medicalSubtab, search, carrierFilter, networkFilter]);

  const filteredAncillary = useMemo(() => {
    const base = filterPlans(ancillaryPlans);
    if (ancillarySubtab === "all_ancillary") return base;
    return base.filter(p => p.plan_type === ancillarySubtab);
  }, [ancillaryPlans, ancillarySubtab, search, carrierFilter, networkFilter]);

  const subtabCount = (subtab) => {
    if (subtab === "all_medical") return medicalPlans.length;
    return medicalPlans.filter(p => matchesMedicalSubtab(p, subtab)).length;
  };

  const ancillarySubtabCount = (subtab) => {
    if (subtab === "all_ancillary") return ancillaryPlans.length;
    return ancillaryPlans.filter(p => p.plan_type === subtab).length;
  };

  const handleEdit = (plan) => { setEditingPlan(plan); setShowForm(true); };
  const handleNew = (type = "medical", subtype = null) => {
    setEditingPlan(null);
    setDefaultPlanType(type);
    setShowForm(true);
  };

  const handleViewDetail = (plan) => setDetailPlan(plan);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Plan Library"
        description="Manage your full plan catalog — Medical (MEC, MVP, ACA, HDHP) and all Ancillary lines"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-1.5" /> Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> Add Plan</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem className="font-semibold text-xs text-muted-foreground" disabled>MEDICAL</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "mec")}>MEC Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "mvp")}>MVP Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "mec_bronze")}>MEC Bronze Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "mec_elite")}>MEC Elite Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "aca_bronze")}>ACA Bronze</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "aca_silver")}>ACA Silver</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "aca_gold")}>ACA Gold</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "aca_platinum")}>ACA Platinum</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNew("medical", "hdhp")}>HDHP Plan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="font-semibold text-xs text-muted-foreground" disabled>ANCILLARY</DropdownMenuItem>
                {["dental","vision","life","std","ltd","voluntary","accident","critical_illness","hospital_indemnity"].map(t => (
                  <DropdownMenuItem key={t} onClick={() => handleNew(t)} className="capitalize">{t.replace(/_/g," ")}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* KPI Bar */}
      <PlanLibraryKPIBar plans={plans} archivedPlans={archivedPlans} />

      {/* View Mode + Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/30">
          {[
            { v: "grid", icon: Grid, label: "Grid" },
            { v: "analytics", icon: BarChart2, label: "Analytics" },
            { v: "guide", icon: BookOpen, label: "Guide" },
          ].map(({ v, icon: Icon, label }) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === v ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {viewMode === "grid" && (
          <>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name, carrier, code, tag..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9 text-sm" />
            </div>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All Carriers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                {carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Network" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {["HMO","PPO","EPO","HDHP","POS","indemnity"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <>
          <PlanAnalyticsPanel plans={plans} />
          <PlanQualityChecklist plans={plans} />
          <PlanArchiveManager archivedPlans={archivedPlans} onRestore={id => restoreMutation.mutate(id)} />
        </>
      )}

      {/* Guide View */}
      {viewMode === "guide" && (
        <>
          <PlanLibraryGuide />
          <PlanQualityChecklist plans={plans} />
        </>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <>
          {/* Featured Plans */}
          {featuredPlans.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold">Featured Plans</span>
                <Badge variant="secondary" className="text-xs">{featuredPlans.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredPlans.map(p => (
                  <PlanCard key={p.id} plan={p} onEdit={handleEdit} onArchive={() => archiveMutation.mutate(p.id)} onViewDetail={handleViewDetail} />
                ))}
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
            <TabsList className="h-9">
              <TabsTrigger value="medical">
                Medical <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{medicalPlans.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ancillary">
                Ancillary <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{ancillaryPlans.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{archivedPlans.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* ── MEDICAL TAB ── */}
            <TabsContent value="medical" className="mt-4 space-y-4">
              {/* Medical sub-tabs */}
              <div className="flex flex-wrap gap-1.5">
                {MEDICAL_SUBTABS.map(st => {
                  const count = subtabCount(st.key);
                  return (
                    <button key={st.key} onClick={() => setMedicalSubtab(st.key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${medicalSubtab === st.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}>
                      {st.label}
                      {count > 0 && <span className={`rounded-full px-1 text-[9px] font-bold ${medicalSubtab === st.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : filteredMedical.length === 0 ? (
                <EmptyState icon={BookOpen}
                  title={medicalSubtab === "all_medical" ? "No medical plans" : `No ${MEDICAL_SUBTABS.find(s=>s.key===medicalSubtab)?.label} plans`}
                  description="Add plans manually or import from a CSV file"
                  actionLabel="Add Medical Plan"
                  onAction={() => handleNew("medical")} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMedical.map(p => (
                    <PlanCard key={p.id} plan={p} onEdit={handleEdit} onArchive={() => archiveMutation.mutate(p.id)} onViewDetail={handleViewDetail} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── ANCILLARY TAB ── */}
            <TabsContent value="ancillary" className="mt-4 space-y-4">
              {/* Ancillary sub-tabs */}
              <div className="flex flex-wrap gap-1.5">
                {ANCILLARY_SUBTABS.map(st => {
                  const count = ancillarySubtabCount(st.key);
                  return (
                    <button key={st.key} onClick={() => setAncillarySubtab(st.key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${ancillarySubtab === st.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}>
                      {st.label}
                      {count > 0 && <span className={`rounded-full px-1 text-[9px] font-bold ${ancillarySubtab === st.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : filteredAncillary.length === 0 ? (
                <EmptyState icon={BookOpen}
                  title={ancillarySubtab === "all_ancillary" ? "No ancillary plans" : `No ${ANCILLARY_SUBTABS.find(s=>s.key===ancillarySubtab)?.label} plans`}
                  description="Add dental, vision, life, or other ancillary plans"
                  actionLabel="Add Ancillary Plan"
                  onAction={() => handleNew(ancillarySubtab === "all_ancillary" ? "dental" : ancillarySubtab)} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAncillary.map(p => (
                    <PlanCard key={p.id} plan={p} onEdit={handleEdit} onArchive={() => archiveMutation.mutate(p.id)} onViewDetail={handleViewDetail} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── ARCHIVED TAB ── */}
            <TabsContent value="archived" className="mt-4">
              {archivedPlans.length === 0 ? (
                <EmptyState icon={Archive} title="No archived plans" description="Archived plans will appear here." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedPlans.map(p => (
                    <PlanCard key={p.id} plan={p} onEdit={handleEdit} onArchive={() => {}} archived
                      onRestore={() => restoreMutation.mutate(p.id)} onViewDetail={handleViewDetail} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {showForm && (
        <PlanFormModal
          plan={editingPlan}
          open={showForm}
          defaultType={defaultPlanType}
          onClose={() => { setShowForm(false); setEditingPlan(null); }}
        />
      )}
      {showImport && <PlanImportModal open={showImport} onClose={() => setShowImport(false)} />}
      {detailPlan && (
        <PlanDetailDrawer plan={detailPlan} open={!!detailPlan} onClose={() => setDetailPlan(null)} onEdit={handleEdit} />
      )}
    </div>
  );
}