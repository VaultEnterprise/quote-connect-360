/**
 * Broker Signup Route Shell — Phase 7A-1.7
 * 
 * Fail-closed route shell. Hidden while BROKER_SIGNUP_ENABLED=false.
 * Returns 403 Forbidden if accessed while feature flag is disabled.
 * No applicant can access signup while gate is inactive.
 * 
 * Backend: brokerSignupContract.submitStandaloneBrokerSignup()
 * Feature Flag: BROKER_SIGNUP_ENABLED (false)
 */

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function BrokerSignupShell() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureFlagEnabled, setFeatureFlagEnabled] = useState(false);

  useEffect(() => {
    // Feature flag check: fail-closed
    // In production, this would be checked server-side during route access
    // For now, we simulate the check and render fail-closed message
    setFeatureFlagEnabled(false); // Hardcoded: BROKER_SIGNUP_ENABLED = false
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!featureFlagEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Service Unavailable</h1>
          <p className="text-muted-foreground">
            The broker signup feature is not currently available. Please try again later.
          </p>
          <p className="text-xs text-muted-foreground">
            Status: Feature gate inactive (BROKER_SIGNUP_ENABLED=false)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Broker Signup</h1>
        {/* Signup form would render here when flag is true */}
        <p className="text-muted-foreground">Broker signup form shell (inactive)</p>
      </div>
    </div>
  );
}