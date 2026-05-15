import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export default function MGAReportScheduleModal({
  isOpen,
  mode,
  schedule,
  masterGroupId,
  masterGeneralAgentId,
  onClose,
  onSave
}) {
  const [formData, setFormData] = useState(
    schedule || {
      template_id: '',
      schedule_name: '',
      schedule_type: 'one_time',
      scheduled_date_time: '',
      timezone: 'UTC'
    }
  );
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [masterGroupId, masterGeneralAgentId]);

  const loadTemplates = async () => {
    try {
      const result = await base44.functions.invoke('reportTemplateService', {
        action: 'listReportTemplates',
        masterGroupId,
        masterGeneralAgentId
      });
      setTemplates(result.data?.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleSave = async () => {
    if (!formData.template_id || !formData.schedule_name || !formData.scheduled_date_time) {
      setError('Template, schedule name, and date/time are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const action = mode === 'edit' ? 'updateReportScheduleDefinition' : 'createReportScheduleDefinition';
      const payload = {
        template_id: formData.template_id,
        schedule_name: formData.schedule_name,
        schedule_type: 'one_time',
        scheduled_date_time: formData.scheduled_date_time,
        timezone: formData.timezone
      };

      await base44.functions.invoke('reportTemplateService', {
        action,
        target_entity_id: schedule?.id,
        payload,
        masterGroupId,
        masterGeneralAgentId
      });

      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save schedule');
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
            {mode === 'edit' ? 'Edit Schedule Definition' : 'Create Schedule Definition'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="template_id">Saved Template *</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) =>
                setFormData({ ...formData, template_id: value })
              }
            >
              <SelectTrigger id="template_id">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule_name">Schedule Name *</Label>
            <Input
              id="schedule_name"
              value={formData.schedule_name}
              onChange={(e) =>
                setFormData({ ...formData, schedule_name: e.target.value })
              }
              placeholder="e.g., Weekly Case Report"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule_type">Schedule Type</Label>
            <Select value="one_time" disabled>
              <SelectTrigger id="schedule_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-Time</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Recurring schedules will be available in a future release.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date_time ? format(new Date(formData.scheduled_date_time), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    const currentTime = formData.scheduled_date_time
                      ? new Date(formData.scheduled_date_time).toTimeString().slice(0, 5)
                      : '09:00';
                    const [hours, minutes] = currentTime.split(':');
                    date.setHours(parseInt(hours), parseInt(minutes));
                    setFormData({ ...formData, scheduled_date_time: date.toISOString() });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Time *</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_date_time ? format(new Date(formData.scheduled_date_time), 'HH:mm') : '09:00'}
                onChange={(e) => {
                  if (e.target.value && formData.scheduled_date_time) {
                    const date = new Date(formData.scheduled_date_time);
                    const [hours, minutes] = e.target.value.split(':');
                    date.setHours(parseInt(hours), parseInt(minutes));
                    setFormData({ ...formData, scheduled_date_time: date.toISOString() });
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) =>
                setFormData({ ...formData, timezone: value })
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.template_id || !formData.schedule_name || !formData.scheduled_date_time}
          >
            {loading ? 'Saving...' : 'Save Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}