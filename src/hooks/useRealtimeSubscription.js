import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook to subscribe to real-time entity updates via WebSocket
 * Auto-refetch data when entity changes, with debouncing
 * 
 * Usage:
 * useRealtimeSubscription('Case', () => refetch(), { debounce: 500 })
 */
export function useRealtimeSubscription(
  entityName,
  onUpdate = () => {},
  options = {}
) {
  const { debounce = 500, filter = null } = options;
  const unsubscribeRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!entityName) return;

    // Subscribe to all changes on this entity
    unsubscribeRef.current = base44.entities[entityName].subscribe((event) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Apply optional filter
      if (filter && !filter(event)) {
        return;
      }

      // Debounce the update callback
      debounceTimerRef.current = setTimeout(() => {
        onUpdate(event);
      }, debounce);
    });

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [entityName, onUpdate, debounce, filter]);
}

/**
 * Hook for multiple entity subscriptions
 * Usage:
 * useRealtimeSubscriptions(['Case', 'CaseTask'], () => refetch())
 */
export function useRealtimeSubscriptions(entityNames = [], onUpdate = () => {}, options = {}) {
  const unsubscribesRef = useRef([]);

  useEffect(() => {
    const debounce = options.debounce || 500;
    let debounceTimer = null;

    entityNames.forEach((entityName) => {
      const unsubscribe = base44.entities[entityName].subscribe((event) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(onUpdate, debounce);
      });
      unsubscribesRef.current.push(unsubscribe);
    });

    return () => {
      clearTimeout(debounceTimer);
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
    };
  }, [entityNames.join(","), onUpdate, options.debounce]);
}