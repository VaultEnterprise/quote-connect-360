/**
 * Gate 6L-B.3 Document Detail Drawer (Frontend UI)
 * 
 * Display safe document metadata and download button.
 * Download uses backend getDocumentSignedUrl function.
 * No file_uri or storage internals exposed.
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, X, AlertCircle, Loader2 } from 'lucide-react';

export default function DocumentDetailDrawer({ document, user, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Call backend to get signed URL (validates access first)
      const response = await base44.functions.invoke('getDocumentSignedUrl', {
        documentId: document.id
      });

      if (response.status === 200 && response.data.signed_url) {
        // Open download in new tab via signed URL
        window.open(response.data.signed_url, '_blank');
      } else {
        setError(response.data?.error || 'Download failed');
      }
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-background border-l rounded-l-lg shadow-lg flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Document Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="font-medium">{document.name}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Type</div>
            <div className="text-sm capitalize">{document.document_type}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Classification</div>
            <div className="text-sm capitalize">{document.document_classification}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Uploaded By</div>
            <div className="text-sm">{document.uploaded_by}</div>
          </div>

          {document.uploaded_date && (
            <div>
              <div className="text-xs text-muted-foreground">Uploaded Date</div>
              <div className="text-sm">{new Date(document.uploaded_date).toLocaleDateString()}</div>
            </div>
          )}

          {document.notes && (
            <div>
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="text-sm">{document.notes}</div>
            </div>
          )}

          {document.visibility_scope && (
            <div>
              <div className="text-xs text-muted-foreground">Visibility</div>
              <div className="text-sm capitalize">{document.visibility_scope.replace('_', ' ')}</div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded flex gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}