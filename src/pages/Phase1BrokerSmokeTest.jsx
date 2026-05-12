import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';

export default function Phase1BrokerSmokeTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupRunId, setCleanupRunId] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [cleanupResults, setCleanupResults] = useState(null);

  if (!user || !['admin', 'platform_super_admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access Restricted: Admin only</p>
      </div>
    );
  }

  const runSmokeTest = async () => {
    setLoading(true);
    setTestResults(null);
    try {
      const response = await base44.functions.invoke('runPhase1BrokerSmokeTest', {});
      setTestResults(response.data);
    } catch (err) {
      console.error('Error running smoke test:', err);
      setTestResults({
        overall_status: 'BLOCKED',
        error: err.message || 'Failed to run smoke test'
      });
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    if (!cleanupRunId.trim()) {
      alert('Please enter a Run ID');
      return;
    }
    setCleanupLoading(true);
    setCleanupResults(null);
    try {
      const response = await base44.functions.invoke('cleanupPhase1BrokerSmokeTestData', {
        run_id: cleanupRunId,
        dry_run: dryRun
      });
      setCleanupResults(response.data);
    } catch (err) {
      console.error('Error running cleanup:', err);
      setCleanupResults({
        success: false,
        error: err.message || 'Failed to run cleanup'
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const copyRunLog = () => {
    if (!testResults) return;
    const markdown = testResults.run_log || 'Run log not available';
    navigator.clipboard.writeText(markdown);
    alert('Run log copied to clipboard');
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Phase 1 Broker Signup — Automated QA Harness</h1>
        <p className="text-muted-foreground">Execute 8 automated validation steps for standalone broker signup and approval</p>
      </div>

      {/* Automated Smoke Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Smoke Test (8 Steps)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runSmokeTest}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Running Test...' : 'Run Smoke Test'}
          </Button>

          {testResults && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: testResults.overall_status === 'PASS' ? '#f0fdf4' : '#fef2f2',
                borderColor: testResults.overall_status === 'PASS' ? '#bbf7d0' : '#fecaca'
              }}>
                <div className="flex items-center gap-2">
                  {testResults.overall_status === 'PASS' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    Overall Status: <strong>{testResults.overall_status}</strong>
                  </span>
                </div>
                {testResults.run_id && <p className="text-sm text-muted-foreground mt-2">Run ID: {testResults.run_id}</p>}
              </div>

              {/* Results Table */}
              {testResults.steps && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Step</th>
                        <th className="text-left py-2 px-2">Label</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.steps.map((step, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">{idx + 1}</td>
                          <td className="py-2 px-2">{step.label}</td>
                          <td className="py-2 px-2">
                            <Badge variant={step.status === 'PASS' ? 'default' : 'destructive'}>
                              {step.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">{step.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Copy Run Log Button */}
              <Button
                onClick={copyRunLog}
                variant="outline"
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Markdown Run Log
              </Button>

              {/* Test Data Summary */}
              {testResults.test_data && (
                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                  <p><strong>Broker 1 Email:</strong> {testResults.test_data.broker1_email}</p>
                  <p><strong>Broker 1 Profile ID:</strong> {testResults.test_data.broker1_profile_id}</p>
                  <p><strong>Broker 2 Email:</strong> {testResults.test_data.broker2_email}</p>
                  <p><strong>Broker 2 Profile ID:</strong> {testResults.test_data.broker2_profile_id}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Checks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Checks Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground mb-4">Complete these manual browser/auth checks:</p>
            <label className="flex items-center gap-2">
              <Checkbox disabled /> Hard refresh <code className="bg-muted px-2 py-1 rounded">/broker-signup</code> → form loads
            </label>
            <label className="flex items-center gap-2">
              <Checkbox disabled /> Hard refresh <code className="bg-muted px-2 py-1 rounded">/command-center/broker-agencies</code> (admin) → broker list loads
            </label>
            <label className="flex items-center gap-2">
              <Checkbox disabled /> Non-admin access to <code className="bg-muted px-2 py-1 rounded">/command-center/broker-agencies</code> → 404
            </label>
            <label className="flex items-center gap-2">
              <Checkbox disabled /> Logged-out access to QA page → 404
            </label>
            <label className="flex items-center gap-2">
              <Checkbox disabled /> Verify automated test brokers display in UI (Acme active, Premier pending)
            </label>
            <label className="flex items-center gap-2">
              <Checkbox disabled /> Verify QA harness renders correctly (this page)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Cleanup Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cleanup Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Enter Run ID from automated test to delete test data (dry run by default)</p>

          <div className="flex gap-2">
            <Input
              placeholder="PHASE1-YYYYMMDD-HHMMSS"
              value={cleanupRunId}
              onChange={(e) => setCleanupRunId(e.target.value)}
              className="flex-1"
            />
          </div>

          <label className="flex items-center gap-2">
            <Checkbox
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <span className="text-sm">Dry run (preview only, no deletion)</span>
          </label>

          <Button
            onClick={runCleanup}
            disabled={cleanupLoading || !cleanupRunId.trim()}
            className="w-full"
            variant="outline"
          >
            {cleanupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {dryRun ? 'Preview Cleanup' : 'Execute Cleanup'}
          </Button>

          {cleanupResults && (
            <div className={`p-3 rounded-lg border ${cleanupResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-sm">
                {cleanupResults.success ? (
                  <>
                    <CheckCircle className="inline w-4 h-4 mr-2 text-green-600" />
                    {dryRun ? 'Preview: ' : 'Deleted: '}{cleanupResults.deleted_count || 0} records
                  </>
                ) : (
                  <>
                    <AlertCircle className="inline w-4 h-4 mr-2 text-red-600" />
                    {cleanupResults.error || 'Cleanup failed'}
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}