import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, BookOpen, FileDown, BarChart2, Scale, GitBranch, Layers, Settings, FileText, Calculator, HandCoins, Sparkles } from "lucide-react";
import PlanSummaryGenerator from "@/components/plans/PlanSummaryGenerator";
import PlanCostCalculator from "@/components/plans/PlanCostCalculator";
import BenefitsGlossaryPanel from "@/components/plans/BenefitsGlossaryPanel";
import NegotiationTracker from "@/components/plans/NegotiationTracker";
import PlanReportBuilder from "@/components/plans/PlanReportBuilder";
import RateCardGenerator from "@/components/plans/RateCardGenerator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import PlanCard from "@/components/plans/PlanCard";
import PlanFormModal from "@/components/plans/PlanFormModal";
import PlanWorkbookImportModal from "@/components/plans/PlanWorkbookImportModal";
import PlanAnalyticsPanel from "@/components/plans/PlanAnalyticsPanel";
import PlanComparisonTool from "@/components/plans/PlanComparisonTool";
import PlanBulkActionsPanel from "@/components/plans/PlanBulkActionsPanel";
import PlanFilterPresets from "@/components/plans/PlanFilterPresets";
import PlanLibraryGuide from "@/components/plans/PlanLibraryGuide";
import PlanSearchAdvanced from "@/components/plans/PlanSearchAdvanced";
import PlanQualityChecklist from "@/components/plans/PlanQualityChecklist";
import PlanArchiveManager from "@/components/plans/PlanArchiveManager";
import PlanDataValidation from "@/components/plans/PlanDataValidation";
import BulkRateUpload from "@/components/plans/BulkRateUpload";
import PlanCompareDrawer from "@/components/plans/PlanCompareDrawer";
import PlanEffectiveDateManager from "@/components/plans/PlanEffectiveDateManager";
import PlanFavoritesRecents, { usePlanFavorites } from "@/components/plans/PlanFavoritesRecents";
import ScenarioAutoPopulate from "@/components/plans/ScenarioAutoPopulate";

const MEDICAL_CARRIERS = ["Aetna", "Anthem", "BlueCross BlueShield", "Cigna", "Humana", "Kaiser", "UnitedHealthcare", "Other"];
const ANCILLARY_TYPES = ["dental", "vision", "life", "std", "ltd", "voluntary"];

export default function PlanLibrary() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("medical");
  const [comparisonPlans, setComparisonPlans] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid", "analytics", "guide", "employee", "reports", "negotiation"
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showScenarioPopulate, setShowScenarioPopulate] = useState(false);
  const { toggleFavorite, getFavorites, addRecent } = usePlanFavorites();
  const [favIds, setFavIds] = React.useState(() => { try { return JSON.parse(localStorage.getItem(`plan_library_favorites_`) || "[]"); } catch { return []; } });

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500),
  });

  const { data: zipMappings = [] } = useQuery({
    queryKey: ["zip-area-maps"],
    queryFn: () => base44.entities.PlanZipAreaMap.list("-created_date", 5000),
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
    return matchSearch && matchCarrier && matchNetwork;
  });

  const carriers = [...new Set(plans.map(p => p.carrier).filter(Boolean))].sort();

  const zipCountByPlanId = zipMappings.reduce((acc, mapping) => {
    if (!mapping.plan_id) return acc;
    acc[mapping.plan_id] = (acc[mapping.plan_id] || 0) + 1;
    return acc;
  }, {});

  const handleEdit = (plan) => { setEditingPlan(plan); setShowForm(true); };
  const handleNew = () => { setEditingPlan(null); setShowForm(true); };

  const PageContent = () => (
    <div className="space-y-6">
      <PageHeader
        title="Plan Library"
        description="Rate intelligence system · carrier analytics · compliance enforcement"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link to="/plan-rate-editor" className="flex items-center gap-1.5"><Settings className="w-4 h-4" />Rate Editor</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/plan-analytics" className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4" />Analytics</Link>
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Sparkles className="w-4 h-4 mr-2" /> Special Import
            </Button>
            <Button variant="outline" onClick={() => setShowBulkUpload(!showBulkUpload)}>
              <Upload className="w-4 h-4 mr-2" /> Bulk Upload
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
            <SelectItem value="employee">Employee Tools</SelectItem>
            <SelectItem value="reports">Reports & Exports</SelectItem>
            <SelectItem value="negotiation">Negotiations</SelectItem>
            <SelectItem value="guide">Help & Tips</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick filter presets */}
      {viewMode === "grid" && <PlanFilterPresets onSelectPreset={() => {}} />}

      {/* Filters (grid view only) */}
      {viewMode === "grid" && (
        <div className="flex flex-col sm:flex-row gap-3">
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
        </div>
      )}

      {/* Advanced search */}
      {viewMode === "grid" && <PlanSearchAdvanced onSearch={() => {}} />}

      {/* Effective Date Alerts */}
      {viewMode === "grid" && <PlanEffectiveDateManager plans={plans} />}

      {/* Favorites & Recents */}
      {viewMode === "grid" && <PlanFavoritesRecents plans={plans} onSelectPlan={(p) => { setEditingPlan(p); setShowForm(true); }} />}

      {/* Bulk Rate Upload */}
      {showBulkUpload && (
        <BulkRateUpload plans={plans} />
      )}

      {/* Data Completeness Validation */}
      {viewMode === "grid" && <PlanDataValidation plans={plans} />}

      {/* Quality checklist */}
      {viewMode === "grid" && <PlanQualityChecklist plans={plans} />}

      {/* Compare / Scenario bar */}
      {selectedForCompare.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/30 flex-wrap">
          <Scale className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{selectedForCompare.length} plan(s) selected</span>
          <Button size="sm" onClick={() => setShowCompareDrawer(true)} className="h-7 text-xs">Compare</Button>
          <Button size="sm" variant="outline" onClick={() => setShowScenarioPopulate(true)} className="h-7 text-xs gap-1"><Layers className="w-3 h-3" />Generate Scenarios</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setSelectedForCompare([])}>Clear</Button>
        </div>
      )}

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
              <div key={p.id} className="relative">
                <div className={`absolute top-2 right-2 z-10`}>
                  <input type="checkbox" checked={selectedForCompare.includes(p.id)} onChange={e => setSelectedForCompare(prev => e.target.checked ? [...prev.slice(0,5), p.id] : prev.filter(id => id !== p.id))} className="w-4 h-4 accent-primary" title="Add to comparison" />
                </div>
                <PlanCard plan={p} zipCount={zipCountByPlanId[p.id] || 0} onEdit={handleEdit} onArchive={() => archiveMutation.mutate(p.id)} />
              </div>
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
      {showImport && (
        <PlanWorkbookImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImported={(planId) => navigate(`/plans/${planId}`)}
        />
      )}
      {showCompareDrawer && (
        <PlanCompareDrawer
          plans={plans.filter(p => selectedForCompare.includes(p.id))}
          open={showCompareDrawer}
          onClose={() => setShowCompareDrawer(false)}
          onRemovePlan={(id) => setSelectedForCompare(prev => prev.filter(x => x !== id))}
        />
      )}
      {showScenarioPopulate && (
        <ScenarioAutoPopulate
          selectedPlans={plans.filter(p => selectedForCompare.includes(p.id))}
          open={showScenarioPopulate}
          onClose={() => setShowScenarioPopulate(false)}
        />
      )}
    </div>
  );

  // View mode content
  if (viewMode === "analytics") {
    return (
      <div className="space-y-6">
        <PageContent />
        <PlanAnalyticsPanel plans={plans} />
        <PlanQualityChecklist plans={plans} />
        <PlanArchiveManager archivedPlans={archivedPlans} />
      </div>
    );
  }

  if (viewMode === "employee") {
    return (
      <div className="space-y-6">
        <PageContent />
        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Plan Summary Generator</h2>
          <PlanSummaryGenerator plans={plans} />
        </div>
        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" />Employee Cost Calculator</h2>
          <PlanCostCalculator plans={plans} />
        </div>
        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-base font-semibold">Benefits Glossary</h2>
          <BenefitsGlossaryPanel />
        </div>
      </div>
    );
  }

  if (viewMode === "reports") {
    return (
      <div className="space-y-6">
        <PageContent />
        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-base font-semibold">Custom Report Builder</h2>
          <PlanReportBuilder plans={plans} />
        </div>
        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-base font-semibold">Rate Card Generator</h2>
          <RateCardGenerator plans={plans} />
        </div>
      </div>
    );
  }

  if (viewMode === "negotiation") {
    return (
      <div className="space-y-6">
        <PageContent />
        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2"><HandCoins className="w-4 h-4 text-primary" />Carrier Negotiation Tracker</h2>
          <NegotiationTracker plans={plans} />
        </div>
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