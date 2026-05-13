/**
 * Gate 6L-B.3 Document Upload Modal (Frontend UI)
 * 
 * Safe file upload with validation.
 * Calls uploadDocumentFile backend function.
 * No direct file storage access.
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.ms-excel', 'text/csv', 'image/jpeg', 'image/png'];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export default function DocumentUploadModal({ caseId, brokerAgencyId, mgaRelationshipId, user, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Frontend validation
    if (f.size > MAX_SIZE) {
      setError(`File too large (max ${MAX_SIZE / 1024 / 1024}MB)`);
      return;
    }

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('File type not allowed');
      return;
    }

    setFile(f);
    setFilename(f.name);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !filename) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target.result.split(',')[1];

        // Call backend upload function
        const response = await base44.functions.invoke('uploadDocumentFile', {
          file_base64: base64,
          filename,
          file_size: file.size,
          file_mime_type: file.type,
          case_id: caseId,
          broker_agency_id: brokerAgencyId,
          mga_relationship_id: mgaRelationshipId,
          document_type: 'other',
          notes
        });

        if (response.status === 200) {
          onSuccess();
        } else {
          setError(response.data?.error || 'Upload failed');
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Upload Document</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">File</label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="w-full p-2 border rounded text-sm mt-1"
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded flex gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}