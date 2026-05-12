/**
 * MGABrokerAgencySettingsPanel — Gate 6L-A
 * Settings and preferences for Broker / Agency
 */
import React, { useState, useEffect } from 'react';
import { getBrokerAgencySettings, updateBrokerAgencySettings } from '@/lib/mga/services/masterGroupService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function MGABrokerAgencySettingsPanel({
  masterGroupId,
  mgaId,
  scopeRequest,
  userRole,
}) {
  const [settings, setSettings] = useState({
    notification_email_frequency: 'weekly',
    notification_channels: ['email'],
    default_invite_role: 'mga_user',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const SETTINGS_MANAGE_ROLES = ['platform_super_admin', 'mga_admin'];
  const SETTINGS_VIEW_ROLES = ['platform_super_admin', 'mga_admin', 'mga_manager'];

  useEffect(() => {
    loadSettings();
  }, [masterGroupId]);

  async function loadSettings() {
    setLoading(true);
    const result = await getBrokerAgencySettings({
      ...scopeRequest,
      target_entity_id: masterGroupId,
    });
    if (result?.data) {
      setSettings(result.data);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateBrokerAgencySettings({
        ...scopeRequest,
        target_entity_id: masterGroupId,
        payload: settings,
        idempotency_key: `update-settings-${masterGroupId}`,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const canManage = SETTINGS_MANAGE_ROLES.includes(userRole);
  const canView = SETTINGS_VIEW_ROLES.includes(userRole);

  if (!canView) return <div className="text-sm text-muted-foreground">Access denied</div>;

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div>
            <Label className="text-sm">Notification Email Frequency</Label>
            <Select
              value={settings.notification_email_frequency}
              onValueChange={v => canManage && setSettings({ ...settings, notification_email_frequency: v })}
              disabled={!canManage}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Notification Channels</Label>
            <div className="space-y-2">
              {['email', 'sms', 'webhook'].map(channel => (
                <div key={channel} className="flex items-center gap-2">
                  <Checkbox
                    checked={settings.notification_channels?.includes(channel)}
                    onCheckedChange={checked => {
                      if (!canManage) return;
                      const channels = checked
                        ? [...(settings.notification_channels || []), channel]
                        : (settings.notification_channels || []).filter(c => c !== channel);
                      setSettings({ ...settings, notification_channels: channels });
                    }}
                    disabled={!canManage}
                  />
                  <Label className="text-sm capitalize cursor-pointer">{channel}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Default Invite Role</Label>
            <Select
              value={settings.default_invite_role}
              onValueChange={v => canManage && setSettings({ ...settings, default_invite_role: v })}
              disabled={!canManage}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mga_user">User</SelectItem>
                <SelectItem value="mga_read_only">Read-Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canManage && (
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}