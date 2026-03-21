// components/census/MemberDetailModal.tsx
// View and fix individual member validation issues (Phase 3)

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MemberDetailModalProps {
  member: any;
  open: boolean;
  onClose: () => void;
  onUpdate?: (updatedMember: any) => void;
}

export default function MemberDetailModal({
  member,
  open,
  onClose,
  onUpdate,
}: MemberDetailModalProps) {
  const [editedMember, setEditedMember] = useState(member);
  const [isSaving, setIsSaving] = useState(false);

  const validationIcon = (type: string) => {
    if (type === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.CensusMember.update(member.id, editedMember);
      onUpdate?.(editedMember);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const criticalIssues = member.validation_issues?.filter((i: any) => i.type === 'error') || [];
  const warnings = member.validation_issues?.filter((i: any) => i.type === 'warning') || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {member.first_name} {member.last_name}
            {member.validation_status && (
              <Badge className="ml-2" variant={member.validation_status === 'valid' ? 'default' : 'secondary'}>
                {member.validation_status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Validation Issues */}
          {(criticalIssues.length > 0 || warnings.length > 0) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Issues Found</h4>
              {criticalIssues.map((issue: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
                  {validationIcon(issue.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-red-900 capitalize">{issue.field}</p>
                    <p className="text-xs text-red-700">{issue.message}</p>
                  </div>
                </div>
              ))}
              {warnings.map((issue: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                  {validationIcon(issue.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-amber-900 capitalize">{issue.field}</p>
                    <p className="text-xs text-amber-700">{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {member.gradient_ai_data && (
            <div className="border rounded-lg p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">🤖</span> Risk Assessment
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className="font-bold text-lg">{member.gradient_ai_data.risk_score}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tier</p>
                  <Badge variant="outline" className="capitalize">{member.gradient_ai_data.risk_tier}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Predicted Claims</p>
                  <p className="font-bold">${member.gradient_ai_data.predicted_annual_claims?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Member Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">First Name</label>
                <Input
                  value={editedMember.first_name}
                  onChange={e => setEditedMember({ ...editedMember, first_name: e.target.value })}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                <Input
                  value={editedMember.last_name}
                  onChange={e => setEditedMember({ ...editedMember, last_name: e.target.value })}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  value={editedMember.email || ''}
                  onChange={e => setEditedMember({ ...editedMember, email: e.target.value })}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                <Input
                  type="date"
                  value={editedMember.date_of_birth || ''}
                  onChange={e => setEditedMember({ ...editedMember, date_of_birth: e.target.value })}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Annual Salary</label>
                <Input
                  type="number"
                  value={editedMember.annual_salary || ''}
                  onChange={e => setEditedMember({ ...editedMember, annual_salary: parseFloat(e.target.value) })}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Employment Status</label>
                <select
                  value={editedMember.employment_status || 'active'}
                  onChange={e => setEditedMember({ ...editedMember, employment_status: e.target.value })}
                  className="w-full h-9 rounded-md border border-input text-sm"
                >
                  <option value="active">Active</option>
                  <option value="leave">Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}