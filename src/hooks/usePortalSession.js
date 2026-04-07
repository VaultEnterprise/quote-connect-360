import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * usePortalSession
 * Validates and manages employee portal session.
 */
export function usePortalSession() {
  const navigate = useNavigate();
  const [sessionValid, setSessionValid] = useState(false);
  const [session, setSession] = useState(null);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minutesRemaining, setMinutesRemaining] = useState(30);

  useEffect(() => {
    let parsedSession = null;

    try {
      const rawSession = sessionStorage.getItem("portal_session");
      parsedSession = rawSession ? JSON.parse(rawSession) : null;
    } catch {
      parsedSession = null;
    }

    const timestamp = parsedSession?.authenticated_at;
    const currentEnrollmentId = parsedSession?.enrollment_id || null;

    if (!parsedSession || !currentEnrollmentId || !timestamp) {
      setSessionValid(false);
      setSession(null);
      setLoading(false);
      return;
    }

    const createdAt = new Date(timestamp);
    const now = new Date();
    const minutesOld = Math.floor((now - createdAt) / 60000);

    if (minutesOld > 30) {
      sessionStorage.removeItem("portal_session");
      setSessionValid(false);
      setSession(null);
      setLoading(false);
      return;
    }

    setSession(parsedSession);
    setEnrollmentId(currentEnrollmentId);
    setSessionValid(true);
    setMinutesRemaining(Math.max(0, 30 - minutesOld));
    setLoading(false);

    const timeoutMs = (30 - minutesOld - 5) * 60000;
    const warnTimer = setTimeout(() => {
      console.warn("Portal session expiring in 5 minutes");
    }, Math.max(0, timeoutMs));

    const logoutTimer = setTimeout(() => {
      sessionStorage.removeItem("portal_session");
      navigate("/employee-portal-login", { replace: true });
    }, Math.max(0, (30 - minutesOld) * 60000));

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
    sessionStorage.removeItem("portal_session");
    navigate("/employee-portal-login", { replace: true });
  };

  const extendSession = () => {
    setSession((prev) => {
      if (!prev) return prev;
      const updatedSession = { ...prev, authenticated_at: new Date().toISOString() };
      sessionStorage.setItem("portal_session", JSON.stringify(updatedSession));
      return updatedSession;
    });
    setMinutesRemaining(30);
  };

  return { sessionValid, session, enrollmentId, loading, minutesRemaining, logout, extendSession };
}