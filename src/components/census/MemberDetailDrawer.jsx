import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Edit2, Save, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ISSUE_ICONS = {
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
};

const SEVERITY_COLORS = {
  error: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
};

export default function MemberDetailDrawer({ member, open, onOpenChange, onMemberUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(member || {});
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      Object.keys(formData).forEach(key => {
        if (member[key] !== formData[key]) {
          updates[key] = formData[key];
        }
      });

      if (Object.keys(updates).length > 0) {
        await base44.entities.CensusMember.update(member.id, updates);
        onMemberUpdate?.();
      }

      setEditing(false);
    } catch (error) {
      console.error("Failed to save member:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  const validationIssues = member.validation_issues || [];
  const hasErrors = validationIssues.some(i => i.type === "error");
  const hasWarnings = validationIssues.some(i => i.type === "warning");

  const editableFields = [
    { key: "first_name", label: "First Name", type: "text" },
    { key: "last_name", label: "Last Name", type: "text" },
    { key: "date_of_birth", label: "Date of Birth", type: "date" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "annual_salary", label: "Annual Salary", type: "number" },
    { key: "employment_status", label: "Employment Status", type: "text" },
    { key: "coverage_tier", label: "Coverage Tier", type: "text" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[500px] max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {formData.first_name} {formData.last_name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Validation Status */}
          <Card className={validationIssues.length > 0 ? SEVERITY_COLORS[hasErrors ? "error" : "warning"] : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {!validationIssues.length ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Validation Passed</p>
                      <p className="text-xs text-muted-foreground">No issues detected</p>
                    </div>
                  </>
                ) : (
                  <>
                    {hasErrors ? (
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {validationIssues.length} issue{validationIssues.length !== 1 ? "s" : ""} found
                      </p>
                      <div className="text-xs space-y-1 mt-2">
                        {validationIssues.slice(0, 3).map((issue, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {ISSUE_ICONS[issue.type]}
                            <span>{issue.message}</span>
                          </div>
                        ))}
                        {validationIssues.length > 3 && (
                          <p className="text-muted-foreground">+{validationIssues.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Member Info */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Member Information</CardTitle>
              {!editing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  className="text-xs h-7"
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  {editableFields.map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-medium block mb-1">{field.label}</label>
                      <Input
                        type={field.type}
                        value={formData[field.key] || ""}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{member.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{member.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">DOB</p>
                    <p className="font-medium">{member.date_of_birth || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Salary</p>
                    <p className="font-medium">${member.annual_salary?.toLocaleString() || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Status</p>
                    <Badge className="capitalize text-xs">{member.employment_status || "active"}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Coverage</p>
                    <Badge variant="secondary" className="capitalize text-xs">{member.coverage_tier || "—"}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Data (if GradientAI analyzed) */}
          {member.gradient_ai_data && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Health Risk Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk Tier</span>
                  <Badge className="capitalize">{member.gradient_ai_data.risk_tier}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className="font-semibold">{member.gradient_ai_data.risk_score}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Predicted Annual Claims</span>
                  <span className="font-semibold">${(member.gradient_ai_data.predicted_annual_claims || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => { setEditing(false); onOpenChange(false); }} className="text-xs">
            Close
          </Button>
          {editing && (
            <>
              <Button
                variant="outline"
                onClick={() => { setFormData(member); setEditing(false); }}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="text-xs"
              >
                <Save className="w-3 h-3 mr-1" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}