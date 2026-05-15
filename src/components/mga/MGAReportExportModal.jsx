/**
 * MGA Gate 6C — Report Export Modal
 * User-facing modal for configuring and executing exports.
 * Hidden behind feature flag; authorization enforced in backend.
 */

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, Download, Loader2 } from 'lucide-react';

export default function MGAReportExportModal({
  open,
  onClose,
  mgaId,
  scopeRequest,
  userPermissions = [],
}) {
  const [step, setStep] = useState('selecting_report'); // selecting_report → selecting_format → preparing → ready → downloading → success
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [availableReports, setAvailableReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [artifactUrl, setArtifactUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent duplicate clicks

  // Load available exports on modal open
  useEffect(() => {
    if (open) {
      loadAvailableReports();
    }
  }, [open]);

  async function loadAvailableReports() {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('mgaReportExport', {
        action: 'listAvailableExports',
      });

      if (response.data?.success) {
        setAvailableReports(response.data.data || []);
      } else {
        setError('Failed to load available reports.');
      }
    } catch (e) {
      setError('Error loading reports: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePrepareExport() {
    if (!selectedReport || !selectedFormat) {
      setError('Please select a report type and format.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('mgaReportExport', {
        action: 'prepareExport',
        report_type: selectedReport,
        format: selectedFormat,
      });

      if (response.data?.success) {
        setStep('ready');
      } else {
        setError(response.data?.message || 'Failed to prepare export.');
      }
    } catch (e) {
      setError('Error preparing export: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateExport() {
    if (isProcessing) return; // Prevent duplicate clicks
    setIsProcessing(true);
    setError(null);
    setStep('downloading');

    try {
      const response = await base44.functions.invoke('mgaReportExport', {
        action: 'generateExport',
        report_type: selectedReport,
        format: selectedFormat,
      });

      if (response.data?.success) {
        setArtifactUrl(response.data.artifact_url);
        setStep('success');
      } else {
        setError(response.data?.message || 'Failed to generate export.');
        setStep('ready');
      }
    } catch (e) {
      setError('Error generating export: ' + (e.message || 'Unknown error'));
      setStep('ready');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleClose() {
    setStep('selecting_report');
    setSelectedReport('');
    setSelectedFormat('');
    setError(null);
    setArtifactUrl(null);
    onClose();
  }

  function handleReset() {
    setStep('selecting_report');
    setError(null);
    setArtifactUrl(null);
  }

  const selectedReportObj = availableReports.find((r) => r.type === selectedReport);
  const availableFormats = selectedReportObj?.formats || [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Configure and download a report for your MGA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Select Report Type */}
          {step === 'selecting_report' && (
            <>
              <div>
                <Label htmlFor="report-select" className="text-sm font-medium">
                  Report Type
                </Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger id="report-select" className="mt-1.5">
                    <SelectValue placeholder="Choose a report..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReports.map((report) => (
                      <SelectItem key={report.type} value={report.type}>
                        {report.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedReportObj && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {selectedReportObj.description}
                  </p>
                )}
              </div>

              {selectedReport && (
                <div>
                  <Label htmlFor="format-select" className="text-sm font-medium">
                    Export Format
                  </Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger id="format-select" className="mt-1.5">
                      <SelectValue placeholder="Choose a format..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats.map((fmt) => (
                        <SelectItem key={fmt} value={fmt}>
                          {fmt.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Step 2: Ready to Export */}
          {step === 'ready' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                Ready to export <strong>{selectedReportObj?.label}</strong> as{' '}
                <strong>{selectedFormat.toUpperCase()}</strong>.
              </p>
            </div>
          )}

          {/* Step 3: Downloading */}
          {step === 'downloading' && (
            <div className="flex items-center justify-center gap-2 p-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating export...</p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 font-medium">
                  ✓ Export generated successfully
                </p>
              </div>
              {artifactUrl && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    // In production, would initiate download
                    window.open(artifactUrl, '_blank');
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'success' ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Export Another
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              {step === 'selecting_report' && (
                <Button
                  onClick={() => setStep('ready')}
                  disabled={!selectedReport || !selectedFormat || loading}
                >
                  Next
                </Button>
              )}
              {step === 'ready' && (
                <Button
                  onClick={handleGenerateExport}
                  disabled={isProcessing || loading}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export Now
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}