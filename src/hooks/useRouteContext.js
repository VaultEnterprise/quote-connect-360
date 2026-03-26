import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getRouteContext } from "@/contracts/routeContracts";

export default function useRouteContext() {
  const location = useLocation();
  return useMemo(() => getRouteContext(location.search), [location.search]);
}