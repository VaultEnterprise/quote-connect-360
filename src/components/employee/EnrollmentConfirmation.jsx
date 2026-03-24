import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function EnrollmentConfirmation({ enrollment, onDownload, onClose }) {
  if (!enrollment) return null;

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="font-bold text-green-900 mb-1">Enrollment Complete!</h2>
            <p className="text-sm text-green-800">
              Your benefits selections have been submitted. A confirmation has been sent to {enrollment.employee_email}.
            </p>
          </div>
        </div>
      </Card>

      {/* Enrollment Summary */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-4">Enrollment Summary</p>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Employee</span>
            <strong>{enrollment.employee_name}</strong>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Coverage Tier</span>
            <Badge variant="outline" className="text-xs">
              {enrollment.coverage_tier?.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Selected Plan</span>
            <strong>{enrollment.selected_plan_name}</strong>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Effective Date</span>
            <strong>{format(new Date(enrollment.effective_date), 'MMMM d, yyyy')}</strong>
          </div>

          {enrollment.completed_at && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Submitted</span>
              <strong>{format(new Date(enrollment.completed_at), 'MMM d, yyyy h:mm a')}</strong>
            </div>
          )}
        </div>
      </Card>

      {/* Dependents */}
      {enrollment.dependents && enrollment.dependents.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Covered Dependents ({enrollment.dependents.length})</p>
          <div className="space-y-2">
            {enrollment.dependents.map((dep, idx) => (
              <div key={idx} className="text-xs p-2 bg-muted rounded flex justify-between">
                <span>{dep.name || 'Dependent'}</span>
                <span className="text-muted-foreground">{dep.relationship}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* DocuSign Status */}
      {enrollment.docusign_envelope_id && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Document Signing</p>
              <p className="text-xs text-blue-800 mt-1">
                Status: <strong>{enrollment.docusign_status?.replace(/_/g, ' ').toUpperCase()}</strong>
              </p>
              {enrollment.docusign_status === 'completed' && enrollment.docusign_signed_at && (
                <p className="text-xs text-blue-800 mt-1">
                  Signed: {format(new Date(enrollment.docusign_signed_at), 'MMM d, yyyy h:mm a')}
                </p>
              )}
              {enrollment.docusign_document_url && (
                <Button
                  size="sm"
                  variant="link"
                  className="mt-2 h-auto p-0 text-xs text-blue-600 underline"
                  onClick={() => window.open(enrollment.docusign_document_url, '_blank')}
                >
                  View Signed Document
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onDownload && (
          <Button variant="outline" className="flex-1" onClick={onDownload}>
            <FileText className="w-4 h-4 mr-2" />
            Download Confirmation
          </Button>
        )}
        {onClose && (
          <Button className="flex-1" onClick={onClose}>
            Done
          </Button>
        )}
      </div>

      {/* Next Steps */}
      <Card className="p-4 bg-gray-50">
        <p className="text-sm font-semibold mb-2">Next Steps</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✓ Benefits effective {format(new Date(enrollment.effective_date), 'MMMM d, yyyy')}</li>
          <li>✓ Employee ID cards will arrive within 7-10 business days</li>
          <li>✓ Questions? Contact your benefits administrator</li>
        </ul>
      </Card>
    </div>
  );
}