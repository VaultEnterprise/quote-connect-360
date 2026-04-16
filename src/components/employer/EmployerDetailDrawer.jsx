import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Briefcase, Mail, Phone, MapPin, Calendar, FileText, Activity, TrendingUp } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/shared/StatusBadge";

export default function EmployerDetailDrawer({ employer, cases, documents, open, onClose }) {
  if (!employer) return null;

  const employerCases = cases.filter(c => c.employer_group_id === employer.id);
  const employerDocs = documents.filter(
    d => d.employer_group_id === employer.id || d.case_id && employerCases.some(c => c.id === d.case_id)
  );

  const daysToRenewal = employer.renewal_date ? differenceInDays(parseISO(employer.renewal_date), new Date()) : null;
  const isRenewingSoon = daysToRenewal !== null && daysToRenewal >= 0 && daysToRenewal <= 60;

  const caseStageCounts = employerCases.reduce((acc, c) => {
    acc[c.stage] = (acc[c.stage] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{employer.name}</DialogTitle>
                {employer.dba_name && <p className="text-sm text-muted-foreground">dba {employer.dba_name}</p>}
              </div>
            </div>
            <StatusBadge status={employer.status} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Cases ({employerCases.length})</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="activity">Activity ({employerDocs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span>Total Cases</span>
                </div>
                <p className="text-2xl font-bold">{employerCases.length}</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span>Employees</span>
                </div>
                <p className="text-2xl font-bold">{employer.employee_count || 0}</p>
                {employer.eligible_count && (
                  <p className="text-xs text-muted-foreground">{employer.eligible_count} eligible</p>
                )}
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Renewal</span>
                </div>
                {employer.renewal_date ? (
                  <>
                    <p className={`text-lg font-bold ${isRenewingSoon ? "text-amber-600" : ""}`}>
                      {isRenewingSoon ? `${daysToRenewal} days` : format(parseISO(employer.renewal_date), "MMM d, yyyy")}
                    </p>
                    {isRenewingSoon && <p className="text-xs text-amber-600">Renewing soon</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not set</p>
                )}
              </div>
            </div>

            {/* Case Pipeline Summary */}
            {Object.keys(caseStageCounts).length > 0 && (
              <div className="p-3 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Case Pipeline
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(caseStageCounts).map(([stage, count]) => (
                    <Badge key={stage} variant="outline" className="text-xs">
                      {count} {stage.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Company Information</h4>
                {employer.industry && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{employer.industry}</span>
                  </div>
                )}
                {employer.sic_code && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>SIC: {employer.sic_code}</span>
                  </div>
                )}
                {(employer.city || employer.state) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{[employer.city, employer.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Contact Information</h4>
                {employer.primary_contact_name && (
                  <div className="text-sm">
                    <p className="font-medium">{employer.primary_contact_name}</p>
                    {employer.primary_contact_email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{employer.primary_contact_email}</span>
                      </div>
                    )}
                    {employer.primary_contact_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{employer.primary_contact_phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cases" className="mt-4">
            {employerCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No cases associated with this employer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employerCases.map(c => (
                  <div key={c.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Link to={`/cases/${c.id}`} className="text-sm font-semibold text-primary hover:underline">
                          {c.case_number || `Case #${c.id.slice(0, 8)}`}
                        </Link>
                        <Badge variant="outline" className="text-xs">{c.case_type.replace(/_/g, " ")}</Badge>
                      </div>
                      <StatusBadge status={c.stage} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {c.effective_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Effective: {format(parseISO(c.effective_date), "MMM d, yyyy")}
                        </span>
                      )}
                      {c.products_requested?.length > 0 && (
                        <span>{c.products_requested.join(", ")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="mt-4 space-y-3">
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="text-sm font-semibold mb-3">Primary Contact</h4>
              {employer.primary_contact_name ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{employer.primary_contact_name}</p>
                  {employer.primary_contact_email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${employer.primary_contact_email}`} className="hover:underline">
                        {employer.primary_contact_email}
                      </a>
                    </div>
                  )}
                  {employer.primary_contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${employer.primary_contact_phone}`} className="hover:underline">
                        {employer.primary_contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No primary contact specified</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-center py-4">
              Additional contacts can be added through case management
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" />
                <span className="font-semibold">Recent Activity</span>
              </div>
              {employerCases.length > 0 || employerDocs.length > 0 ? (
                <div className="space-y-2">
                  {employerCases.slice(0, 5).map(c => (
                    <div key={`case-${c.id}`} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/50">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>Case {c.case_type.replace(/_/g, " ")} created</span>
                      {c.created_date && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(parseISO(c.created_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  ))}
                  {employerDocs.slice(0, 5).map(doc => (
                    <div key={`doc-${doc.id}`} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/50">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>Document {doc.name || doc.file_name || "uploaded file"} added</span>
                      {doc.created_date && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(parseISO(doc.created_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}