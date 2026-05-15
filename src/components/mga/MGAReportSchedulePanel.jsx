import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Pause, Play, X } from 'lucide-react';
import MGAReportScheduleModal from './MGAReportScheduleModal';
import MGAReportScheduleStatusBadge from './MGAReportScheduleStatusBadge';
import { format } from 'date-fns';

export default function MGAReportSchedulePanel({ masterGroupId, masterGeneralAgentId }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadSchedules();
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

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.functions.invoke('reportTemplateService', {
        action: 'listReportSchedules',
        masterGroupId,
        masterGeneralAgentId
      });
      setSchedules(result.data?.data || []);
    } catch (err) {
      setError('Failed to load schedules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canManageSchedules = ['platform_super_admin', 'mga_admin'].includes(userRole);
  const canViewSchedules = canManageSchedules || userRole === 'mga_manager';

  const handlePause = async (scheduleId) => {
    try {
      await base44.functions.invoke('reportTemplateService', {
        action: 'pauseReportSchedule',
        target_entity_id: scheduleId,
        masterGroupId,
        masterGeneralAgentId
      });
      loadSchedules();
    } catch (err) {
      setError('Failed to pause schedule');
      console.error(err);
    }
  };

  const handleCancel = async (scheduleId) => {
    try {
      await base44.functions.invoke('reportTemplateService', {
        action: 'cancelReportSchedule',
        target_entity_id: scheduleId,
        masterGroupId,
        masterGeneralAgentId
      });
      loadSchedules();
    } catch (err) {
      setError('Failed to cancel schedule');
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setShowModal(true);
  };

  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  if (!canViewSchedules) {
    return <div className="p-4 text-muted-foreground">You do not have permission to view schedules.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Schedule Definitions</h3>
        {canManageSchedules && (
          <Button size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Schedule
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-4 text-muted-foreground text-center">Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="p-4 text-muted-foreground text-center">No schedules found.</div>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="border rounded-lg p-3 flex justify-between items-center hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="font-medium">{schedule.schedule_name}</div>
                <div className="flex gap-2 mt-1 text-sm">
                  <span className="text-muted-foreground">
                    {schedule.scheduled_date_time && format(new Date(schedule.scheduled_date_time), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <MGAReportScheduleStatusBadge status={schedule.status} />
                {canManageSchedules && schedule.status !== 'cancelled' && (
                  <>
                    {schedule.status === 'active' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePause(schedule.id)}
                        className="h-8 w-8"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    {schedule.status === 'paused' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingSchedule(schedule);
                          setShowModal(true);
                        }}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCancel(schedule.id)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MGAReportScheduleModal
          isOpen={showModal}
          mode={editingSchedule ? 'edit' : 'create'}
          schedule={editingSchedule}
          masterGroupId={masterGroupId}
          masterGeneralAgentId={masterGeneralAgentId}
          onClose={() => {
            setShowModal(false);
            setEditingSchedule(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingSchedule(null);
            loadSchedules();
          }}
        />
      )}
    </div>
  );
}