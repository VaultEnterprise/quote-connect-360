import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { validateRouteParams } from "@/validation/routeContractValidator";

export default function useRouteParamsContract(routeKey) {
  const params = useParams();
  return useMemo(() => validateRouteParams(routeKey, params), [routeKey, params]);
}