import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getSharedRouteContext } from "@/lib/routing/resolveRouteContext";

export default function useRouteContext() {
  const location = useLocation();
  return useMemo(() => getSharedRouteContext(location.search), [location.search]);
}