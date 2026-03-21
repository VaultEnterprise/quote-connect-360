import React, { useEffect, useCallback } from "react";

const STORAGE_KEY = "enrollment_draft_data";

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
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [enrollmentId, state]);

  const getSavedData = useCallback(() => {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  const clearSavedData = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return { save, getSavedData, clearSavedData };
}