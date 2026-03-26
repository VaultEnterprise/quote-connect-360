import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/dashboardControls";
import { getDashboardPageModel } from "@/domain/dashboard/useDashboardMetrics";
import { resolveRouteContext } from "@/lib/routing/resolveRouteContext";
import { assertBlockingValidationGate } from "@/validation/blockingValidationGate";

export const DASHBOARD_PRESET_QUERY_KEY = ["dashboard-view-presets"];

export function useDashboardPageController() {
  useMemo(() => {
    assertBlockingValidationGate({ pageKey: "Dashboard", routeKey: "dashboard" });
    return true;
  }, []);

  const queryClient = useQueryClient();
  const location = useLocation();
  const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS);
  const [selectedPresetId, setSelectedPresetId] = useState("none");
  const [hasInitializedPreferences, setHasInitializedPreferences] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const routeFilters = useMemo(() => resolveRouteContext("dashboard", location.search), [location.search]);

  const { data: user, isLoading: isUserLoading } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: cases = [], isLoading, dataUpdatedAt: casesUpdatedAt } = useQuery({ queryKey: ["cases"], queryFn: () => base44.entities.BenefitCase.list("-created_date", 200) });
  const { data: tasks = [], dataUpdatedAt: tasksUpdatedAt } = useQuery({ queryKey: ["tasks-pending"], queryFn: () => base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 200) });
  const { data: enrollments = [], dataUpdatedAt: enrollmentsUpdatedAt } = useQuery({ queryKey: ["enrollments"], queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 100) });
  const { data: renewals = [], dataUpdatedAt: renewalsUpdatedAt } = useQuery({ queryKey: ["renewals"], queryFn: () => base44.entities.RenewalCycle.list("-renewal_date", 100) });
  const { data: scenarios = [], dataUpdatedAt: scenariosUpdatedAt } = useQuery({ queryKey: ["scenarios-all"], queryFn: () => base44.entities.QuoteScenario.list("-created_date", 100) });
  const { data: exceptions = [], dataUpdatedAt: exceptionsUpdatedAt } = useQuery({ queryKey: ["exceptions"], queryFn: () => base44.entities.ExceptionItem.list("-created_date", 100) });
  const { data: proposals = [], dataUpdatedAt: proposalsUpdatedAt } = useQuery({ queryKey: ["proposals"], queryFn: () => base44.entities.Proposal.list("-created_date", 100) });
  const { data: agencies = [], dataUpdatedAt: agenciesUpdatedAt } = useQuery({ queryKey: ["agencies"], queryFn: () => base44.entities.Agency.list("name", 100) });
  const { data: presets = [], isFetched: presetsFetched, dataUpdatedAt: presetsUpdatedAt } = useQuery({ queryKey: DASHBOARD_PRESET_QUERY_KEY, enabled: !!user?.email, queryFn: () => base44.entities.DashboardViewPreset.filter({ created_by: user.email }, "name", 50) });

  useEffect(() => {
    const unsubscribeCases = base44.entities.BenefitCase.subscribe(() => queryClient.invalidateQueries({ queryKey: ["cases"] }));
    const unsubscribeTasks = base44.entities.CaseTask.subscribe(() => queryClient.invalidateQueries({ queryKey: ["tasks-pending"] }));
    const unsubscribeEnrollments = base44.entities.EnrollmentWindow.subscribe(() => queryClient.invalidateQueries({ queryKey: ["enrollments"] }));
    const unsubscribeExceptions = base44.entities.ExceptionItem.subscribe(() => queryClient.invalidateQueries({ queryKey: ["exceptions"] }));
    const unsubscribeProposals = base44.entities.Proposal.subscribe(() => queryClient.invalidateQueries({ queryKey: ["proposals"] }));
    return () => {
      unsubscribeCases?.();
      unsubscribeTasks?.();
      unsubscribeEnrollments?.();
      unsubscribeExceptions?.();
      unsubscribeProposals?.();
    };
  }, [queryClient]);

  useEffect(() => {
    const hasRouteFilters = Object.keys(routeFilters).length > 0;
    if (!hasRouteFilters) return;
    setFilters((current) => ({
      ...current,
      viewMode: routeFilters.viewMode || current.viewMode,
      dateRange: routeFilters.dateRange || current.dateRange,
      owner: routeFilters.owner || current.owner,
      team: routeFilters.team || current.team,
      agencyId: routeFilters.agencyId || current.agencyId,
      employerId: routeFilters.employerId || current.employerId,
      caseType: routeFilters.caseType || current.caseType,
      stage: routeFilters.stage || current.stage,
    }));
  }, [routeFilters]);

  useEffect(() => {
    if (hasInitializedPreferences || !user || !presetsFetched || Object.keys(routeFilters).length > 0) return;
    const defaultPreset = presets.find((preset) => preset.is_default);
    if (defaultPreset) {
      setFilters({
        dateRange: defaultPreset.date_range || DEFAULT_DASHBOARD_FILTERS.dateRange,
        viewMode: defaultPreset.view_mode || DEFAULT_DASHBOARD_FILTERS.viewMode,
        owner: defaultPreset.filters?.owner || "all",
        team: defaultPreset.filters?.team || "all",
        agencyId: defaultPreset.filters?.agencyId || "all",
        employerId: defaultPreset.filters?.employerId || "all",
        caseType: defaultPreset.filters?.caseType || "all",
        stage: defaultPreset.filters?.stage || "all",
      });
      setSelectedPresetId(defaultPreset.id);
    } else {
      setFilters((current) => ({ ...current, viewMode: user.role === "admin" ? "executive" : "my" }));
    }
    setHasInitializedPreferences(true);
  }, [hasInitializedPreferences, presets, presetsFetched, routeFilters, user]);

  const pageModel = useMemo(() => getDashboardPageModel({
    cases,
    tasks,
    enrollments,
    renewals,
    scenarios,
    exceptions,
    proposals,
    agencies,
    filters,
    user,
  }), [cases, tasks, enrollments, renewals, scenarios, exceptions, proposals, agencies, filters, user]);

  const lastUpdated = useMemo(() => {
    const timestamps = [casesUpdatedAt, tasksUpdatedAt, enrollmentsUpdatedAt, renewalsUpdatedAt, scenariosUpdatedAt, exceptionsUpdatedAt, proposalsUpdatedAt, agenciesUpdatedAt, presetsUpdatedAt].filter(Boolean);
    return timestamps.length === 0 ? "" : format(new Date(Math.max(...timestamps)), "MMM d, yyyy h:mm a");
  }, [casesUpdatedAt, tasksUpdatedAt, enrollmentsUpdatedAt, renewalsUpdatedAt, scenariosUpdatedAt, exceptionsUpdatedAt, proposalsUpdatedAt, agenciesUpdatedAt, presetsUpdatedAt]);

  const handleFilterChange = (key, value) => {
    setSelectedPresetId("none");
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      ["cases"],
      ["tasks-pending"],
      ["enrollments"],
      ["renewals"],
      ["scenarios-all"],
      ["exceptions"],
      ["proposals"],
      ["agencies"],
      DASHBOARD_PRESET_QUERY_KEY,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    setIsRefreshing(false);
  };

  const handleSaveView = async () => {
    const name = window.prompt("Name this dashboard view");
    if (!name) return;
    await base44.entities.DashboardViewPreset.create({
      name,
      view_mode: filters.viewMode,
      date_range: filters.dateRange,
      filters: {
        owner: filters.owner,
        team: filters.team,
        agencyId: filters.agencyId,
        employerId: filters.employerId,
        caseType: filters.caseType,
        stage: filters.stage,
      },
      is_default: false,
    });
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_PRESET_QUERY_KEY });
  };

  const handlePresetChange = (presetId) => {
    if (presetId === "none") {
      setSelectedPresetId("none");
      return;
    }
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setFilters({
      dateRange: preset.date_range || DEFAULT_DASHBOARD_FILTERS.dateRange,
      viewMode: preset.view_mode || DEFAULT_DASHBOARD_FILTERS.viewMode,
      owner: preset.filters?.owner || "all",
      team: preset.filters?.team || "all",
      agencyId: preset.filters?.agencyId || "all",
      employerId: preset.filters?.employerId || "all",
      caseType: preset.filters?.caseType || "all",
      stage: preset.filters?.stage || "all",
    });
  };

  const handleSetDefault = async () => {
    if (!selectedPresetId || selectedPresetId === "none") return;
    await Promise.all(
      presets.map((preset) => base44.entities.DashboardViewPreset.update(preset.id, { is_default: preset.id === selectedPresetId }))
    );
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_PRESET_QUERY_KEY });
  };

  return {
    user,
    presets,
    filters,
    selectedPresetId,
    isLoading,
    isUserLoading,
    isRefreshing,
    lastUpdated,
    setSelectedPresetId,
    handleFilterChange,
    handleRefresh,
    handleSaveView,
    handlePresetChange,
    handleSetDefault,
    ...pageModel,
  };
}