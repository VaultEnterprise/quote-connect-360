/**
 * Gate 6D — Export Delivery History & Tracking
 * Primary history dashboard UI. Hidden when MGA_EXPORT_HISTORY_ENABLED = false
 * or when the user lacks mga.reports.history.view permission.
 *
 * Step 7 of Gate 6D Implementation Work Order.
 *
 * DO NOT ACTIVATE until operator approval is obtained.
 * Feature flag: MGA_EXPORT_HISTORY_ENABLED = false
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { History, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { hasHistoryPermission, HISTORY_PERMISSIONS } from '@/lib/mga/reportExportHistoryPermissions';

const STATUS_COLORS = {
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-800',
  failed:     'bg-red-100 text-red-700',
  expired:    'bg-gray-100 text-gray-500',
  cancelled:  'bg-orange-100 text-orange-700',
  pending:    'bg-yellow-100 text-yellow-700',
};

export default function MGAExportHistoryPanel({ mgaId, userRole, scopeRequest }) {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters]       = useState({ report_type: 'all', status: 'all' });

  const canAudit = hasHistoryPermission(userRole, HISTORY_PERMISSIONS.AUDIT);

  useEffect(() => {
    if (!mgaId) return;
    load();
  }, [mgaId, filters]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('mgaExportHistoryContract', {
        action: 'listExportHistory',
        mga_id: mgaId,
        filters: {
          report_type: filters.report_type !== 'all' ? filters.report_type : undefined,
          status:      filters.status !== 'all'      ? filters.status      : undefined,
        },
      });
      setRecords(res.data?.records || []);
    } catch (err) {
      setError('Unable to load export history.');
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(id) {
    setExpandedRow(prev => prev === id ? null : id);
  }

  return (
    <div className="mt-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={filters.report_type}
          onValueChange={v => setFilters(f => ({ ...f, report_type: v }))}
        >
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All report types</SelectItem>
            <SelectItem value="case_summary">Case Summary</SelectItem>
            <SelectItem value="quote_scenario">Quote Scenario</SelectItem>
            <SelectItem value="census_member">Census Member</SelectItem>
            <SelectItem value="audit_activity">Audit Activity</SelectItem>
            <SelectItem value="mga_summary">MGA Summary</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={v => setFilters(f => ({ ...f, status: v }))}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* History table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : error ? (
          <ErrorState message={error} />
        ) : records.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y">
            {records.map(record => (
              <HistoryRow
                key={record.export_request_id}
                record={record}
                expanded={expandedRow === record.export_request_id}
                onToggle={() => toggleRow(record.export_request_id)}
                canAudit={canAudit}
                mgaId={mgaId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ record, expanded, onToggle, canAudit, mgaId }) {
  const {
    export_request_id, report_type, format: fmt, status,
    requested_by_user_id, requested_at, artifact_available,
  } = record;

  return (
    <div>
      <div
        className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground capitalize">
              {report_type?.replace(/_/g, ' ') || 'Unknown'}
            </span>
            <span className="text-xs font-mono text-muted-foreground uppercase">{fmt}</span>
            <Badge className={`text-xs px-2 py-0 ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
            <span>{requested_by_user_id || '—'}</span>
            {requested_at && <span>{format(new Date(requested_at), 'MMM d, yyyy HH:mm')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <HistoryRowDetail
          record={record}
          artifact_available={artifact_available}
          canAudit={canAudit}
          mgaId={mgaId}
        />
      )}
    </div>
  );
}

// ─── Expanded Detail ──────────────────────────────────────────────────────────

function HistoryRowDetail({ record, canAudit, mgaId }) {
  const {
    export_request_id, generated_at, downloaded_at, expires_at,
    record_count, failure_reason_code, artifact_available, status,
  } = record;

  const isExpired = expires_at && new Date(expires_at) <= new Date();
  const canDownload = artifact_available && !isExpired && status === 'completed';

  return (
    <div className="px-5 pb-4 pt-1 bg-muted/10 border-t text-xs space-y-2">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
        <span>Export ID: <span className="font-mono text-foreground">{export_request_id}</span></span>
        {record_count !== null && (
          <span>Records: <span className="text-foreground">{record_count.toLocaleString()}</span></span>
        )}
        {generated_at && (
          <span>Generated: <span className="text-foreground">{format(new Date(generated_at), 'MMM d, yyyy HH:mm')}</span></span>
        )}
        {downloaded_at && (
          <span>Downloaded: <span className="text-foreground">{format(new Date(downloaded_at), 'MMM d, yyyy HH:mm')}</span></span>
        )}
        {expires_at && (
          <span>Expires: <span className={isExpired ? 'text-red-600' : 'text-foreground'}>
            {format(new Date(expires_at), 'MMM d, yyyy HH:mm')}{isExpired ? ' (expired)' : ''}
          </span></span>
        )}
        {failure_reason_code && (
          <span className="text-red-600">Failure: {failure_reason_code}</span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {/* Download — only shown when artifact valid, scoped, unexpired, permissioned */}
        {canDownload && (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled>
            Download (requires signed URL — available when Gate 6C active)
          </Button>
        )}
        {/* Retry/Cancel — deferred; always hidden */}
        {/* No retry or cancel buttons rendered until separately approved */}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingRows() {
  return (
    <div className="p-6 space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">No export history found.</p>
      <p className="text-xs text-muted-foreground mt-1">Exports will appear here once Gate 6C is active.</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="p-8 text-center">
      <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}