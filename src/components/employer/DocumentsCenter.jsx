import React, { useState } from "react";
import { Folder, FileText, CheckCircle2, AlertCircle, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DOC_CATEGORIES = {
  compliance: {
    label: "Compliance",
    icon: "📋",
    docs: [
      { name: "HIPAA Privacy Notice", status: "signed", uploaded: "2024-03-10" },
      { name: "SPD (Summary of Plan Description)", status: "signed", uploaded: "2024-03-10" },
      { name: "ACA Affordability Attestation", status: "pending", uploaded: "2024-03-15" },
    ],
  },
  plans: {
    label: "Plan Documents",
    icon: "📄",
    docs: [
      { name: "Medical Plan Brochure", status: "available", uploaded: "2024-03-01" },
      { name: "Dental Plan Details", status: "available", uploaded: "2024-03-01" },
      { name: "Vision Plan Guide", status: "available", uploaded: "2024-03-01" },
    ],
  },
  contracts: {
    label: "Contracts",
    icon: "📝",
    docs: [
      { name: "Employer Service Agreement", status: "signed", uploaded: "2024-02-15" },
      { name: "Amendment #1", status: "pending_signature", uploaded: "2024-03-18" },
    ],
  },
  admin: {
    label: "Admin",
    icon: "📦",
    docs: [
      { name: "Census Upload (v3)", status: "available", uploaded: "2024-03-15" },
      { name: "Rate Confirmation", status: "available", uploaded: "2024-03-12" },
    ],
  },
};

const STATUS_CONFIG = {
  signed: { icon: CheckCircle2, color: "text-green-600", label: "Signed", bg: "bg-green-50" },
  available: { icon: FileText, color: "text-blue-600", label: "Available", bg: "bg-blue-50" },
  pending: { icon: AlertCircle, color: "text-amber-600", label: "Pending", bg: "bg-amber-50" },
  pending_signature: { icon: AlertCircle, color: "text-destructive", label: "Needs Signature", bg: "bg-destructive/10" },
};

export default function DocumentsCenter({ docs = [] }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  return (
    <div className="space-y-4">
      {/* Compliance checklist summary */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Compliance Checklist
          </p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>HIPAA Privacy Notice</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Summary of Plan Description (SPD)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>ACA Affordability Attestation (pending)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <span>Amendment Signature (needs review)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document tabs */}
      <Tabs defaultValue="compliance">
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(DOC_CATEGORIES).map(([key, cat]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(DOC_CATEGORIES).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-2 mt-4">
            {category.docs.map((doc, idx) => {
              const statusConfig = STATUS_CONFIG[doc.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={idx} className={statusConfig.bg}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className={`w-4 h-4 ${statusConfig.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Uploaded {doc.uploaded}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`flex-shrink-0 ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Document actions */}
                    <div className="flex gap-2 mt-3">
                      <Dialog open={selectedDoc === `${key}-${idx}`} onOpenChange={() => setSelectedDoc(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs flex-1 h-7"
                            onClick={() => setSelectedDoc(`${key}-${idx}`)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{doc.name}</DialogTitle>
                          </DialogHeader>
                          <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-64">
                            <p className="text-muted-foreground">Document preview would display here</p>
                          </div>
                          <div className="space-y-2 text-xs">
                            <p className="text-muted-foreground">
                              <strong>Status:</strong> {statusConfig.label}
                            </p>
                            <p className="text-muted-foreground">
                              <strong>Uploaded:</strong> {doc.uploaded}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" className="text-xs flex-1 h-7">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Audit trail */}
      <Dialog open={showAuditTrail} onOpenChange={setShowAuditTrail}>
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowAuditTrail(true)}>
          View Audit Trail & Compliance Report
        </Button>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Trail & Compliance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Document Access Log</p>
              <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                <div className="flex justify-between">
                  <span>HIPAA Notice viewed by John Manager</span>
                  <span className="text-muted-foreground">Mar 15, 2:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Plan downloaded</span>
                  <span className="text-muted-foreground">Mar 14, 10:15 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Employer Agreement signed</span>
                  <span className="text-muted-foreground">Feb 15, 3:45 PM</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-semibold">Compliance Status</p>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1">
                <p>✓ HIPAA Privacy Policy signed</p>
                <p>✓ SPD acknowledged</p>
                <p>⚠ ACA Affordability Attestation pending (due Mar 25)</p>
                <p>⚠ Amendment signature required (overdue by 2 days)</p>
              </div>
            </div>
          </div>
          <Button className="w-full">
            <Download className="w-3.5 h-3.5 mr-2" />
            Export Compliance Report
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}