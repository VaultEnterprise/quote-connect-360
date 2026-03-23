import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, BookOpen, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import PlanCard from "@/components/plans/PlanCard";
import PlanFormModal from "@/components/plans/PlanFormModal";
import PlanImportModal from "@/components/plans/PlanImportModal";
import PlanAnalyticsPanel from "@/components/plans/PlanAnalyticsPanel";
import PlanComparisonTool from "@/components/plans/PlanComparisonTool";
import PlanBulkActionsPanel from "@/components/plans/PlanBulkActionsPanel";
import PlanFilterPresets from "@/components/plans/PlanFilterPresets";
import PlanLibraryGuide from "@/components/plans/PlanLibraryGuide";
import PlanSearchAdvanced from "@/components/plans/PlanSearchAdvanced";
import PlanQualityChecklist from "@/components/plans/PlanQualityChecklist";
import PlanArchiveManager from "@/components/plans/PlanArchiveManager";
import PlanCSVExporter from "@/components/plans/PlanCSVExporter";
import PlanTemplateLibrary from "@/components/plans/PlanTemplateLibrary";
import EffectiveDateTracker from "@/components/plans/EffectiveDateTracker";
import PlanUsageMetrics from "@/components/plans/PlanUsageMetrics";
import DeprecationWarnings from "@/components/plans/DeprecationWarnings";
import FormularyComparison from "@/components/plans/FormularyComparison";
import HSAFilter from "@/components/plans/HSAFilter";
import BulkRateUpdater from "@/components/plans/BulkRateUpdater";
import CoverageTierComparison from "@/components/plans/CoverageTierComparison";

const MEDICAL_CARRIERS = ["Aetna", "Anthem", "BlueCross BlueShield", "Cigna", "Humana", "Kaiser", "UnitedHealthcare", "Other"];
const ANCILLARY_TYPES = ["dental", "vision", "life", "std", "ltd", "voluntary"];

export default function PlanLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("medical");
  const [comparisonPlans, setComparisonPlans] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid", "analytics", "guide"
  const [hsaFilter, setHsaFilter] = useState(false);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500),
  });

  const plans = allPlans.filter(p => p.status === "active");
  const archivedPlans = allPlans.filter(p => p.status === "archived");

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.BenefitPlan.update(id, { status: "archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] }),
  });

  const medicalPlans = plans.filter(p => p.plan_type === "medical");
  const ancillaryPlans = plans.filter(p => ANCILLARY_TYPES.includes(p.plan_type));

  const filterPlans = (list) => list.filter(p => {
    const matchSearch = !search ||
      p.plan_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.carrier?.toLowerCase().includes(search.toLowerCase()) ||
      p.plan_code?.toLowerCase().includes(search.toLowerCase());
    const matchCarrier = carrierFilter === "all" || p.carrier === carrierFilter;
    const matchNetwork = networkFilter === "all" || p.network_type === networkFilter;
    const matchHSA = !hsaFilter || p.hsa_eligible;
    return matchSearch && matchCarrier && matchNetwork && matchHSA;
  });

  const carriers = [...new Set(plans.map(p => p.carrier).filter(Boolean))].sort();

  const handleEdit = (plan) => { setEditingPlan(plan); setShowForm(true); };
  const handleNew = () => { setEditingPlan(null); setShowForm(true); };

  const PageContent = () => (
    <div className="space-y-6">
      <PageHeader
        title="Plan Library"
        description="Manage your Medical and Ancillary plan catalog with rate tables"
        actions={
          <div className="flex gap-2 flex-wrap">
            <PlanCSVExporter plans={plans} />
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-2" /> Import Plans
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Add Plan</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setActiveTab("medical"); handleNew(); }}>Medical Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setActiveTab("ancillary"); handleNew(); }}>Ancillary Plan</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid View</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="guide">Help & Tips</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deprecation warnings */}
      {viewMode === "grid" && <DeprecationWarnings plans={plans} />}

      {/* Quick filter presets */}
      {viewMode === "grid" && <PlanFilterPresets onSelectPreset={() => {}} />}

      {/* Filters (grid view only) */}
      {viewMode === "grid" && (
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, carrier, or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Carriers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Network" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Networks</SelectItem>
              {["HMO","PPO","EPO","HDHP","POS"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <HSAFilter plans={plans} onFilterChange={(f) => f === "hsa" && setHsaFilter(!hsaFilter)} />
        </div>
      )}

      {/* Advanced search */}
      {viewMode === "grid" && <PlanSearchAdvanced onSearch={() => {}} />}

      {/* Plan templates */}
      {viewMode === "grid" && <PlanTemplateLibrary />}

      {/* Effective date tracker */}
      {viewMode === "grid" && <EffectiveDateTracker plans={plans} />}

      {/* Bulk components */}
      {viewMode === "grid" && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BulkRateUpdater plans={plans} />
          <FormularyComparison plans={plans} />
        </div>
      )}

      {/* Coverage tier comparison */}
      {viewMode === "grid" && <CoverageTierComparison plans={plans} />}

      {/* Quality checklist */}
      {viewMode === "grid" && <PlanQualityChecklist plans={plans} />}

      {/* Comparison tool for medical plans */}
      {activeTab === "medical" && filterPlans(medicalPlans).length > 0 && (
        <PlanComparisonTool plans={filterPlans(medicalPlans)} medical={true} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="medical">
            Medical <Badge variant="secondary" className="ml-2 text-xs">{medicalPlans.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ancillary">
            Ancillary <Badge variant="secondary" className="ml-2 text-xs">{ancillaryPlans.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : filterPlans(medicalPlans).length === 0 ? (
            <EmptyState icon={BookOpen} title="No medical plans" description="Add plans manually or import from a CSV file" actionLabel="Add Plan" onAction={handleNew} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterPlans(medicalPlans).map(p => (
                <PlanCard key={p.id} plan={p} onEdit={handleEdit} onArchive={() => archiveMutation.mutate(p.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ancillary" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : filterPlans(ancillaryPlans).length === 0 ? (
            <EmptyState icon={BookOpen} title="No ancillary plans" description="Add dental, vision, life, or other ancillary plans" actionLabel="Add Plan" onAction={handleNew} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterPlans(ancillaryPlans).map(p => (
                <PlanCard key={p.id} plan={p} onEdit={handleEdit} onArchive={() => archiveMutation.mutate(p.id)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Archived plans manager */}
      <PlanArchiveManager archivedPlans={archivedPlans} />

      {showForm && (
        <PlanFormModal
          plan={editingPlan}
          open={showForm}
          defaultType={activeTab === "medical" ? "medical" : "dental"}
          onClose={() => { setShowForm(false); setEditingPlan(null); }}
        />
      )}
      {showImport && <PlanImportModal open={showImport} onClose={() => setShowImport(false)} />}
    </div>
  );

  // View mode content
  if (viewMode === "analytics") {
    return (
      <div className="space-y-6">
        <PageContent />
        <PlanAnalyticsPanel plans={plans} />
        <PlanUsageMetrics plans={plans} />
        <EffectiveDateTracker plans={plans} />
        <PlanQualityChecklist plans={plans} />
        <PlanArchiveManager archivedPlans={archivedPlans} />
      </div>
    );
  }

  if (viewMode === "guide") {
    return (
      <div className="space-y-6">
        <PageContent />
        <PlanLibraryGuide />
        <PlanQualityChecklist plans={plans} />
      </div>
    );
  }

  return <PageContent />;
}