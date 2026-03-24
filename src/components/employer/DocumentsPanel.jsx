import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentsPanel({ documents = [], caseId, onUpload, onDelete }) {
  const [selectedDocType] = useState('all');

  const grouped = useMemo(() => {
    const types = {};
    documents.forEach(doc => {
      if (!types[doc.document_type]) types[doc.document_type] = [];
      types[doc.document_type].push(doc);
    });
    return types;
  }, [documents]);

  const typeLabels = {
    census: { label: 'Census Files', color: 'bg-blue-50 border-blue-200' },
    proposal: { label: 'Proposals', color: 'bg-purple-50 border-purple-200' },
    sbc: { label: 'Summary of Benefits', color: 'bg-green-50 border-green-200' },
    application: { label: 'Applications', color: 'bg-orange-50 border-orange-200' },
    contract: { label: 'Contracts', color: 'bg-red-50 border-red-200' },
    correspondence: { label: 'Correspondence', color: 'bg-gray-50 border-gray-200' },
    enrollment_form: { label: 'Enrollment Forms', color: 'bg-indigo-50 border-indigo-200' },
    other: { label: 'Other Documents', color: 'bg-slate-50 border-slate-200' },
  };

  if (documents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground mb-4">No documents uploaded yet</p>
        {onUpload && (
          <Button size="sm" onClick={() => onUpload?.()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([docType, docs]) => (
        <Card key={docType} className={`p-4 border ${typeLabels[docType]?.color || 'bg-gray-50'}`}>
          <p className="text-sm font-semibold mb-3">{typeLabels[docType]?.label || docType}</p>

          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB • ` : ''}
                      {format(new Date(doc.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.notes && <Badge variant="outline" className="text-xs">{doc.notes}</Badge>}
                  {doc.file_url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {onUpload && (
        <Button variant="outline" className="w-full" onClick={() => onUpload?.()}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      )}
    </div>
  );
}