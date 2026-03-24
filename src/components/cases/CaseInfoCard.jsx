import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function CaseInfoCard({ caseData, employerData }) {
  const caseTypeLabel = useMemo(() => {
    const labels = {
      new_business: 'New Business',
      renewal: 'Renewal',
      mid_year_change: 'Mid-Year Change',
      takeover: 'Takeover',
    };
    return labels[caseData.case_type] || caseData.case_type;
  }, [caseData.case_type]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{caseData.employer_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Case Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Case Number</span>
            <span className="text-sm font-semibold">{caseData.case_number}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant="outline" className="text-xs">{caseTypeLabel}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className="text-xs">
              {caseData.stage.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Effective Date</p>
              <p className="text-sm font-semibold">
                {caseData.effective_date ? format(new Date(caseData.effective_date), 'MMM d, yyyy') : 'TBD'}
              </p>
            </div>
          </div>

          {caseData.target_close_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Target Close</p>
                <p className="text-sm font-semibold">
                  {format(new Date(caseData.target_close_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Employees */}
        {caseData.employee_count && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-sm font-semibold">{caseData.employee_count}</p>
            </div>
          </div>
        )}

        {/* Employer Contact Info */}
        {employerData && (
          <div className="space-y-2 pt-2 border-t">
            {employerData.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${employerData.phone}`} className="text-sm text-blue-600 hover:underline">
                  {employerData.phone}
                </a>
              </div>
            )}

            {employerData.primary_contact_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${employerData.primary_contact_email}`} className="text-sm text-blue-600 hover:underline">
                  {employerData.primary_contact_email}
                </a>
              </div>
            )}

            {employerData.city && employerData.state && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {employerData.city}, {employerData.state}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Products Requested */}
        {caseData.products_requested && caseData.products_requested.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground font-semibold">Products Requested</p>
            <div className="flex flex-wrap gap-1">
              {caseData.products_requested.map(product => (
                <Badge key={product} variant="secondary" className="text-xs">
                  {product}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {caseData.notes && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground font-semibold">Notes</p>
            <p className="text-sm text-foreground line-clamp-3">{caseData.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}