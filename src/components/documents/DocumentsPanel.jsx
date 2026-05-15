/**
 * Gate 6L-B.3 Documents Panel (Frontend UI)
 * 
 * Role-aware document list with upload, download, and visibility controls.
 * All access through DocumentAccessService (safe payloads only).
 * No raw entity reads. No file_uri exposure.
 */

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import documentAccessService from '@/lib/services/documentAccessService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Lock } from 'lucide-react';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentDetailDrawer from './DocumentDetailDrawer';

export default function DocumentsPanel({ caseId, brokerAgencyId, mgaRelationshipId }) {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [error, setError] = useState(null);

  // Fetch current user
  useEffect(() => {
    async function getUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setError('Failed to load user');
      }
    }
    getUser();
  }, []);

  // Load documents with access control
  useEffect(() => {
    async function loadDocuments() {
      if (!user) return;
      
      setLoading(true);
      try {
        const result = await documentAccessService.listDocuments(user, { case_id: caseId });
        setDocuments(result.documents || []);
      } catch (e) {
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [user, caseId]);

  // Check if user can upload (brokers only, not MGA)
  const canUpload = user && (user.role.startsWith('broker_') || user.role.startsWith('platform_'));

  // Check if user is MGA
  const isMga = user && user.role.startsWith('mga_');

  if (loading) return <div className="p-4 text-muted-foreground">Loading documents...</div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Documents</CardTitle>
          {canUpload && (
            <Button size="sm" onClick={() => setShowUploadModal(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <DocumentListItem
                  key={doc.id}
                  document={doc}
                  user={user}
                  onSelect={setSelectedDoc}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showUploadModal && (
        <DocumentUploadModal
          caseId={caseId}
          brokerAgencyId={brokerAgencyId}
          mgaRelationshipId={mgaRelationshipId}
          user={user}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            // Reload documents
            window.location.reload();
          }}
        />
      )}

      {selectedDoc && (
        <DocumentDetailDrawer
          document={selectedDoc}
          user={user}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </>
  );
}

function DocumentListItem({ document, user, onSelect }) {
  // Role-aware visibility check
  const isBroker = user.role.startsWith('broker_');
  const isMga = user.role.startsWith('mga_');

  // MGA users cannot see direct_broker_owned documents
  if (isMga && document.document_classification === 'direct_broker_owned') {
    return null;
  }

  return (
    <button
      onClick={() => onSelect(document)}
      className="w-full p-3 border rounded-lg hover:bg-accent/50 transition text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{document.name}</div>
          <div className="text-xs text-muted-foreground">
            {document.document_type} • Uploaded by {document.uploaded_by}
          </div>
        </div>
        {document.document_classification === 'mga_affiliated' && document.visibility_scope === 'relationship_bound' && (
          <Lock className="w-4 h-4 text-muted-foreground ml-2" />
        )}
      </div>
    </button>
  );
}