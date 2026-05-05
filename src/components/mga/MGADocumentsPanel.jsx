/**
 * MGA Phase 5 — Section 5: Documents Panel
 * All data via documentService. Raw file_url never exposed directly.
 * Download/export sub-features: INACTIVE (Phase 5 sub-feature activation pending).
 */
import React, { useState, useEffect } from 'react';
import { listDocuments } from '@/lib/mga/services/documentService';
import { FileText, Lock } from 'lucide-react';
import { format } from 'date-fns';

const DOC_TYPE_LABELS = {
  census: 'Census',
  proposal: 'Proposal',
  sbc: 'SBC',
  application: 'Application',
  contract: 'Contract',
  correspondence: 'Correspondence',
  enrollment_form: 'Enrollment Form',
  other: 'Other',
};

export default function MGADocumentsPanel({ mgaId, scopeRequest }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!mgaId) return;
    load();
  }, [mgaId]);

  async function load() {
    setLoading(true);
    const result = await listDocuments({ ...scopeRequest, target_entity_id: mgaId });
    if (!result?.success && result?.reason_code) {
      setDenied(true);
    } else {
      setDocs(result?.data || []);
    }
    setLoading(false);
  }

  if (denied) {
    return <p className="text-sm text-muted-foreground p-4">Access restricted — Documents unavailable for your scope.</p>;
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-medium text-sm">Documents</h2>
        {!loading && <span className="text-xs text-muted-foreground">({docs.length})</span>}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" /> Downloads require activation
        </span>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No documents in scope.</div>
      ) : (
        <div className="divide-y">
          {docs.slice(0, 25).map(d => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-3">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">{d.name}</span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground capitalize">{DOC_TYPE_LABELS[d.document_type] || d.document_type}</span>
                  {d.employer_name && <span className="text-xs text-muted-foreground">— {d.employer_name}</span>}
                  {d.created_date && (
                    <span className="text-xs text-muted-foreground">{format(new Date(d.created_date), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
              {/* Download button: INACTIVE — Phase 5 sub-feature activation pending */}
              <span className="text-xs text-muted-foreground">View only</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}