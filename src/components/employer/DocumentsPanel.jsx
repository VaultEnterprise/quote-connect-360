import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

const TYPE_LABELS = {
  census:          "Census",
  proposal:        "Proposals",
  sbc:             "Summary of Benefits",
  application:     "Applications",
  contract:        "Contracts",
  correspondence:  "Correspondence",
  enrollment_form: "Enrollment Forms",
  other:           "Other",
};

const TYPE_ORDER = ["proposal", "sbc", "enrollment_form", "census", "application", "contract", "correspondence", "other"];

/**
 * DocumentsPanel
 * Groups documents by type with download links.
 *
 * Props:
 *   docs — Document[]
 */
export default function DocumentsPanel({ docs }) {
  if (docs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No Documents"
        description="Documents shared by your broker will appear here."
      />
    );
  }

  const grouped = docs.reduce((acc, d) => {
    const type = d.document_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(d);
    return acc;
  }, {});

  const sortedTypes = TYPE_ORDER.filter(t => grouped[t]).concat(
    Object.keys(grouped).filter(t => !TYPE_ORDER.includes(t))
  );

  return (
    <div className="space-y-5">
      {sortedTypes.map(type => (
        <div key={type}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {TYPE_LABELS[type] || type}
          </p>
          <div className="space-y-2">
            {grouped[type].map(d => (
              <Card key={d.id}>
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      {d.created_date && (
                        <p className="text-xs text-muted-foreground">{format(new Date(d.created_date), "MMM d, yyyy")}</p>
                      )}
                    </div>
                  </div>
                  {d.file_url && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-shrink-0" asChild>
                      <a href={d.file_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}