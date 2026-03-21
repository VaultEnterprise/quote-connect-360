// components/census/MappingTemplateManager.tsx
// Save/load mapping templates (Phase 3)

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Save, Download, Trash2 } from 'lucide-react';

interface MappingTemplate {
  id?: string;
  name: string;
  description?: string;
  mapping: Record<string, string>;
  created_at?: Date;
}

interface MappingTemplateManagerProps {
  mapping: Record<string, string>;
  headers: string[];
  onLoadTemplate: (mapping: Record<string, string>) => void;
}

export default function MappingTemplateManager({
  mapping,
  headers,
  onLoadTemplate,
}: MappingTemplateManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Note: In production, store templates in a database entity or localStorage
  const [savedTemplates, setSavedTemplates] = useState<MappingTemplate[]>(() => {
    const stored = localStorage.getItem('census_mapping_templates');
    return stored ? JSON.parse(stored) : [];
  });

  const saveTemplate = async () => {
    if (!templateName.trim()) return;

    setIsSaving(true);
    try {
      const newTemplate: MappingTemplate = {
        id: `template_${Date.now()}`,
        name: templateName,
        description: templateDesc,
        mapping,
        created_at: new Date(),
      };

      const updated = [...savedTemplates, newTemplate];
      setSavedTemplates(updated);
      localStorage.setItem('census_mapping_templates', JSON.stringify(updated));

      setTemplateName('');
      setTemplateDesc('');
      setShowSaveDialog(false);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('census_mapping_templates', JSON.stringify(updated));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          className="text-xs"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save as Template
        </Button>

        {savedTemplates.length > 0 && (
          <div className="text-xs text-muted-foreground flex items-center">
            {savedTemplates.length} template{savedTemplates.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>

      {savedTemplates.length > 0 && (
        <div className="space-y-2">
          {savedTemplates.map(template => (
            <div key={template.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="text-xs font-medium">{template.name}</p>
                {template.description && (
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLoadTemplate(template.mapping)}
                  className="text-xs h-7"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTemplate(template.id!)}
                  className="text-xs h-7 text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveDialog && (
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Mapping Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="e.g., Acme Corp Standard"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={templateDesc}
                  onChange={e => setTemplateDesc(e.target.value)}
                  placeholder="e.g., Standard mapping for Acme payroll exports"
                  className="mt-1"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Saving {Object.keys(mapping).filter(k => mapping[k]).length} mapped fields
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveTemplate} disabled={!templateName.trim() || isSaving}>
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}