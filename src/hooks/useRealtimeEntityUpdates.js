import { useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useRealtimeEntityUpdates
 * WebSocket subscription to entity changes.
 * Auto-updates local state when entity is created/updated/deleted elsewhere.
 * 
 * Usage:
 *   const { subscribe, unsubscribe } = useRealtimeEntityUpdates();
 *   useEffect(() => {
 *     subscribe("BenefitCase", (event) => {
 *       if (event.type === "update") {
 *         setData(prev => prev.map(item => item.id === event.id ? event.data : item));
 *       }
 *     });
 *   }, []);
 */
export function useRealtimeEntityUpdates() {
  const subscriptions = new Map();

  const subscribe = useCallback((entityName, callback) => {
    try {
      const unsubscribe = base44.entities[entityName].subscribe((event) => {
        callback(event);
      });
      
      subscriptions.set(entityName, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.warn(`Failed to subscribe to ${entityName}:`, error);
      return () => {};
    }
  }, []);

  const unsubscribe = useCallback((entityName) => {
    const unsub = subscriptions.get(entityName);
    if (unsub) {
      unsub();
      subscriptions.delete(entityName);
    }
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptions.forEach(unsub => unsub?.());
    subscriptions.clear();
  }, []);

  useEffect(() => {
    return () => unsubscribeAll();
  }, [unsubscribeAll]);

  return { subscribe, unsubscribe, unsubscribeAll };
}