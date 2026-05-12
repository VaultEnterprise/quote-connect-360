import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function MGAReportTemplateModal({
  isOpen,
  mode,
  template,
  masterGroupId,
  masterGeneralAgentId,
  onClose,
  onSave
}) {
  const [formData, setFormData] = useState(
    template || {
      template_name: '',
      description: '',
      report_type: '',
      export_format: 'pdf',
      filters_json: {},
      is_public: false
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!formData.template_name || !formData.report_type) {
      setError('Template name and report type are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const action = mode === 'edit' ? 'updateReportTemplate' : 'createReportTemplate';
      const payload = {
        template_name: formData.template_name,
        description: formData.description,
        report_type: formData.report_type,
        export_format: formData.export_format,
        filters_json: formData.filters_json,
        is_public: formData.is_public
      };

      await base44.functions.invoke('reportTemplateService', {
        action,
        target_entity_id: template?.id,
        payload,
        masterGroupId,
        masterGeneralAgentId
      });

      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Template' : 'Create Report Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="template_name">Template Name *</Label>
            <Input
              id="template_name"
              value={formData.template_name}
              onChange={(e) =>
                setFormData({ ...formData, template_name: e.target.value })
              }
              placeholder="e.g., Weekly Case Summary"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional notes about this template"
              maxLength={1000}
              className="h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report_type">Report Type *</Label>
            <Select
              value={formData.report_type}
              onValueChange={(value) =>
                setFormData({ ...formData, report_type: value })
              }
            >
              <SelectTrigger id="report_type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cases">Cases</SelectItem>
                <SelectItem value="quotes">Quotes</SelectItem>
                <SelectItem value="census">Census</SelectItem>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="renewals">Renewals</SelectItem>
                <SelectItem value="proposals">Proposals</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="export_format">Export Format</Label>
            <Select
              value={formData.export_format}
              onValueChange={(value) =>
                setFormData({ ...formData, export_format: value })
              }
            >
              <SelectTrigger id="export_format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_public: checked })
              }
            />
            <Label htmlFor="is_public" className="font-normal cursor-pointer">
              Make visible to team
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.template_name || !formData.report_type}>
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}