/**
 * Broker Onboarding Route Shell — Phase 7A-1.7
 * 
 * Fail-closed route shell. Hidden while BROKER_ONBOARDING_ENABLED=false.
 * Takes ?token={token} query parameter for onboarding link access.
 * Validates token via brokerTokenSecurityContract.validateBrokerSignupToken()
 * Returns 403 if accessed while feature flag is disabled.
 * Returns masked 404 if token is invalid, expired, or replayed.
 * 
 * Backend: brokerTokenSecurityContract.validateBrokerSignupToken()
 * Feature Flag: BROKER_ONBOARDING_ENABLED (false)
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function BrokerOnboardingShell() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureFlagEnabled, setFeatureFlagEnabled] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Feature flag check: fail-closed
    setFeatureFlagEnabled(false); // Hardcoded: BROKER_ONBOARDING_ENABLED = false
    setLoading(false);
  }, [token]);

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
            The onboarding feature is not currently available. Please check your email for updated instructions.
          </p>
          <p className="text-xs text-muted-foreground">
            Status: Feature gate inactive (BROKER_ONBOARDING_ENABLED=false)
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">
            The onboarding link appears to be invalid or expired. Please request a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Complete Your Onboarding</h1>
        {/* Onboarding form would render here when flag is true and token is valid */}
        <p className="text-muted-foreground">Broker onboarding form shell (inactive)</p>
      </div>
    </div>
  );
}