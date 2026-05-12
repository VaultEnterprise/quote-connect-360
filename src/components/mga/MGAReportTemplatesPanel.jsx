import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Archive, Play } from 'lucide-react';
import MGAReportTemplateModal from './MGAReportTemplateModal';

export default function MGAReportTemplatesPanel({ masterGroupId, masterGeneralAgentId }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadUserRole();
  }, [masterGroupId, masterGeneralAgentId]);

  const loadUserRole = async () => {
    try {
      const user = await base44.auth.me();
      setUserRole(user?.role);
    } catch (err) {
      console.error('Failed to load user role:', err);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.functions.invoke('reportTemplateService', {
        action: 'listReportTemplates',
        masterGroupId,
        masterGeneralAgentId
      });
      setTemplates(result.data?.data || []);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canManageTemplates = ['platform_super_admin', 'mga_admin'].includes(userRole);
  const canViewTemplates = canManageTemplates || userRole === 'mga_manager';

  const handleArchive = async (templateId) => {
    try {
      await base44.functions.invoke('reportTemplateService', {
        action: 'archiveReportTemplate',
        target_entity_id: templateId,
        masterGroupId,
        masterGeneralAgentId
      });
      loadTemplates();
    } catch (err) {
      setError('Failed to archive template');
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  if (!canViewTemplates) {
    return <div className="p-4 text-muted-foreground">You do not have permission to view templates.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Report Templates</h3>
        {canManageTemplates && (
          <Button size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-4 text-muted-foreground text-center">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="p-4 text-muted-foreground text-center">No templates found.</div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-3 flex justify-between items-center hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="font-medium">{template.template_name}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {template.report_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.export_format.toUpperCase()}
                  </Badge>
                  {template.status === 'archived' && (
                    <Badge variant="secondary" className="text-xs">
                      Archived
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {canManageTemplates && template.status !== 'archived' && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenEdit(template)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleArchive(template.id)}
                      className="h-8 w-8"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MGAReportTemplateModal
          isOpen={showModal}
          mode={editingTemplate ? 'edit' : 'create'}
          template={editingTemplate}
          masterGroupId={masterGroupId}
          masterGeneralAgentId={masterGeneralAgentId}
          onClose={() => {
            setShowModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingTemplate(null);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
}