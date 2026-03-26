import {
  differenceInCalendarDays,
  endOfDay,
  startOfDay,
  startOfYear,
  subDays,
} from "date-fns";

export const DATE_RANGE_OPTIONS = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "year_to_date", label: "Year to date" },
  { value: "last_12_months", label: "Last 12 months" },
];

export const DASHBOARD_VIEW_OPTIONS = [
  { value: "my", label: "My View" },
  { value: "team", label: "Team View" },
  { value: "executive", label: "Executive View" },
];

export const DEFAULT_DASHBOARD_FILTERS = {
  dateRange: "last_30_days",
  viewMode: "my",
  owner: "all",
  team: "all",
  agencyId: "all",
  employerId: "all",
  caseType: "all",
  stage: "all",
};

export function getDateRangeWindow(rangeKey, now = new Date()) {
  const todayEnd = endOfDay(now);
  let start = startOfDay(subDays(now, 29));

  if (rangeKey === "last_7_days") start = startOfDay(subDays(now, 6));
  if (rangeKey === "last_90_days") start = startOfDay(subDays(now, 89));
  if (rangeKey === "year_to_date") start = startOfYear(now);
  if (rangeKey === "last_12_months") start = startOfDay(subDays(now, 364));

  const span = differenceInCalendarDays(todayEnd, start) + 1;
  const previousEnd = endOfDay(subDays(start, 1));
  const previousStart = startOfDay(subDays(start, span));

  return {
    start,
    end: todayEnd,
    previousStart,
    previousEnd,
  };
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterByWindow(items, getDateValue, windowBounds) {
  return items.filter((item) => {
    const date = toDate(getDateValue(item));
    return date && date >= windowBounds.start && date <= windowBounds.end;
  });
}

export function formatEmailLabel(value) {
  if (!value) return "Unassigned";
  return value.split("@")[0].replace(/[._-]/g, " ");
}

export function buildDashboardOptions(cases, agencies) {
  const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const agencyMap = Object.fromEntries(agencies.map((agency) => [agency.id, agency.name]));

  return {
    owners: unique(cases.map((c) => c.assigned_to)).map((value) => ({
      value,
      label: formatEmailLabel(value),
    })),
    teams: unique(cases.map((c) => c.created_by)).map((value) => ({
      value,
      label: formatEmailLabel(value),
    })),
    agencies: unique(cases.map((c) => c.agency_id)).map((value) => ({
      value,
      label: agencyMap[value] || value,
    })),
    employers: unique(cases.map((c) => `${c.employer_group_id || c.id}:::${c.employer_name || "Unnamed Employer"}`)).map((value) => {
      const [id, label] = value.split(":::");
      return { value: id, label };
    }),
  };
}

export function filterCasesForDashboard(cases, filters, user) {
  let next = [...cases];

  if (filters.viewMode === "my" && user?.email) {
    next = next.filter((c) => c.assigned_to === user.email || c.created_by === user.email);
  }

  if (filters.viewMode === "team") {
    next = next.filter((c) => Boolean(c.assigned_to || c.created_by));
  }

  if (filters.owner !== "all") next = next.filter((c) => c.assigned_to === filters.owner);
  if (filters.team !== "all") next = next.filter((c) => c.created_by === filters.team);
  if (filters.agencyId !== "all") next = next.filter((c) => c.agency_id === filters.agencyId);
  if (filters.employerId !== "all") next = next.filter((c) => (c.employer_group_id || c.id) === filters.employerId);
  if (filters.caseType !== "all") next = next.filter((c) => c.case_type === filters.caseType);
  if (filters.stage !== "all") next = next.filter((c) => c.stage === filters.stage);

  return next;
}

export function getComparisonMeta(currentValue, previousValue, betterWhenHigher = true) {
  const delta = currentValue - previousValue;
  const hasChange = delta !== 0;
  const percentChange = previousValue === 0
    ? currentValue === 0
      ? 0
      : 100
    : Math.round((Math.abs(delta) / previousValue) * 100);

  const better = betterWhenHigher ? delta > 0 : delta < 0;
  const worse = betterWhenHigher ? delta < 0 : delta > 0;

  return {
    trend: better ? "up" : worse ? "down" : undefined,
    label: hasChange
      ? `${delta > 0 ? "+" : ""}${percentChange}% vs previous period`
      : "Flat vs previous period",
  };
}