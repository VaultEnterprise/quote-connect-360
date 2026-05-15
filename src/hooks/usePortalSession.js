import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * usePortalSession
 * Validates and manages employee portal session.
 * - Checks session token validity
 * - Enforces session timeout (30 min inactivity)
 * - Provides session info
 */
export function usePortalSession() {
  const navigate = useNavigate();
  const [sessionValid, setSessionValid] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minutesRemaining, setMinutesRemaining] = useState(30);

  useEffect(() => {
    const token = sessionStorage.getItem("portal_session_token");
    const enrollmentId = sessionStorage.getItem("portal_enrollment_id");
    const timestamp = sessionStorage.getItem("portal_session_timestamp");

    if (!token || !enrollmentId || !timestamp) {
      setSessionValid(false);
      setLoading(false);
      return;
    }

    // Check if session expired (30 min timeout)
    const createdAt = new Date(timestamp);
    const now = new Date();
    const minutesOld = Math.floor((now - createdAt) / 60000);

    if (minutesOld > 30) {
      sessionStorage.clear();
      setSessionValid(false);
      setLoading(false);
      return;
    }

    setEnrollmentId(enrollmentId);
    setSessionValid(true);
    setMinutesRemaining(30 - minutesOld);
    setLoading(false);

    // Warn user at 5 min remaining
    const timeoutMs = (30 - minutesOld - 5) * 60000;
    const warnTimer = setTimeout(() => {
      console.warn("Portal session expiring in 5 minutes");
    }, Math.max(0, timeoutMs));

    // Auto-logout at 30 min
    const logoutTimer = setTimeout(() => {
      sessionStorage.clear();
      navigate("/employee-portal-login", { replace: true });
    }, (30 - minutesOld) * 60000);

    // Update remaining time every minute
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date() - createdAt) / 60000);
      setMinutesRemaining(Math.max(0, 30 - elapsed));
    }, 60000);

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      clearInterval(interval);
    };
  }, [navigate]);

  const logout = () => {
    sessionStorage.clear();
    navigate("/employee-portal-login", { replace: true });
  };

  const extendSession = () => {
    sessionStorage.setItem("portal_session_timestamp", new Date().toISOString());
    setMinutesRemaining(30);
  };

  return { sessionValid, enrollmentId, loading, minutesRemaining, logout, extendSession };
}