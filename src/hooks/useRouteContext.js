import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getSharedRouteContext, resolveRouteContext } from "@/lib/routing/resolveRouteContext";

export default function useRouteContext(routeKey = null) {
  const location = useLocation();
  return useMemo(() => routeKey ? resolveRouteContext(routeKey, location.search) : getSharedRouteContext(location.search), [routeKey, location.search]);
}