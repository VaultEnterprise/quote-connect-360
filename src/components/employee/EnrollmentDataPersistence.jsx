import React, { useEffect, useCallback } from "react";

// Key scoped to enrollmentId so multiple enrollment windows don't collide
const getDraftKey = (enrollmentId) => `enrollment_draft_${enrollmentId || "anon"}`;

/**
 * EnrollmentDataPersistence Hook
 * Auto-saves enrollment form state and provides recovery
 */
export function useEnrollmentSave(enrollmentId, state) {
  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (state && enrollmentId) {
        const data = {
          enrollmentId,
          timestamp: new Date().toISOString(),
          state,
        };
        sessionStorage.setItem(getDraftKey(enrollmentId), JSON.stringify(data));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [enrollmentId, state]);

  const save = useCallback(() => {
    if (state && enrollmentId) {
      const data = {
        enrollmentId,
        timestamp: new Date().toISOString(),
        state,
      };
      sessionStorage.setItem(getDraftKey(enrollmentId), JSON.stringify(data));
    }
  }, [enrollmentId, state]);

  const getSavedData = useCallback(() => {
    try {
      const data = sessionStorage.getItem(getDraftKey(enrollmentId));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  const clearSavedData = useCallback(() => {
    sessionStorage.removeItem(getDraftKey(enrollmentId));
  }, []);

  return { save, getSavedData, clearSavedData };
}