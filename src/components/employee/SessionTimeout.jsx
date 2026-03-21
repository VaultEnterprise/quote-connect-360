import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock } from "lucide-react";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME_MS = 5 * 60 * 1000; // 5 minutes before timeout

/**
 * SessionTimeout
 * Warns user before session expires and provides save option
 */
export default function SessionTimeout({ children, onSave }) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT_MS);

  useEffect(() => {
    let activityTimer;
    let warningTimer;

    const resetTimers = () => {
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      setTimeLeft(SESSION_TIMEOUT_MS);
      setShowWarning(false);

      // Show warning at 5 minutes remaining
      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(WARNING_TIME_MS);
      }, SESSION_TIMEOUT_MS - WARNING_TIME_MS);

      // Logout at timeout
      activityTimer = setTimeout(() => {
        base44.auth.logout();
      }, SESSION_TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => document.addEventListener(e, resetTimers));

    resetTimers();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimers));
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showWarning) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  if (!showWarning) return children;

  const minutes = Math.floor((timeLeft / 1000) / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <div className="max-w-md mx-auto py-16">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">Session Ending Soon</p>
              <p className="text-sm text-orange-700 mt-0.5">
                Your session will expire in {minutes}:{seconds.toString().padStart(2, "0")} due to inactivity.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={() => base44.auth.logout()}
            >
              Logout
            </Button>
            <Button
              className="flex-1 text-sm gap-1.5"
              onClick={async () => {
                if (onSave) await onSave();
                setShowWarning(false);
              }}
            >
              <Clock className="w-4 h-4" /> Continue Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}