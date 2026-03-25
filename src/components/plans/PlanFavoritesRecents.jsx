import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, X } from "lucide-react";

const STORAGE_KEY = "plan_library_favorites";
const RECENTS_KEY = "plan_library_recents";

export function usePlanFavorites() {
  const { user } = useAuth();
  const key = `${STORAGE_KEY}_${user?.id || "anon"}`;
  const recentsKey = `${RECENTS_KEY}_${user?.id || "anon"}`;

  const getFavorites = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  }, [key]);

  const getRecents = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(recentsKey) || "[]"); } catch { return []; }
  }, [recentsKey]);

  const toggleFavorite = useCallback((planId) => {
    const favs = getFavorites();
    const updated = favs.includes(planId) ? favs.filter(id => id !== planId) : [...favs, planId];
    localStorage.setItem(key, JSON.stringify(updated));
  }, [key, getFavorites]);

  const addRecent = useCallback((planId) => {
    const recents = getRecents().filter(id => id !== planId);
    const updated = [planId, ...recents].slice(0, 10);
    localStorage.setItem(recentsKey, JSON.stringify(updated));
  }, [recentsKey, getRecents]);

  return { getFavorites, getRecents, toggleFavorite, addRecent };
}

export default function PlanFavoritesRecents({ plans, onSelectPlan }) {
  const { getFavorites, getRecents, toggleFavorite } = usePlanFavorites();
  const [favIds, setFavIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    setFavIds(getFavorites());
    setRecentIds(getRecents());
    const handler = () => { setFavIds(getFavorites()); setRecentIds(getRecents()); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [getFavorites, getRecents]);

  const favPlans = plans.filter(p => favIds.includes(p.id));
  const recentPlans = plans.filter(p => recentIds.includes(p.id)).sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));

  const handleRemoveFav = (planId) => {
    toggleFavorite(planId);
    setFavIds(prev => prev.filter(id => id !== planId));
  };

  if (favPlans.length === 0 && recentPlans.length === 0) return null;

  const PlanChip = ({ plan, showStar }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg border hover:border-primary/40 cursor-pointer transition-all group" onClick={() => onSelectPlan?.(plan)}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{plan.plan_name}</p>
        <p className="text-xs text-muted-foreground truncate">{plan.carrier} · {plan.network_type}</p>
      </div>
      {showStar && (
        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={e => { e.stopPropagation(); handleRemoveFav(plan.id); }}>
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {favPlans.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />Favorites ({favPlans.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {favPlans.map(p => <PlanChip key={p.id} plan={p} showStar />)}
          </CardContent>
        </Card>
      )}
      {recentPlans.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />Recently Viewed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentPlans.slice(0, 5).map(p => <PlanChip key={p.id} plan={p} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}