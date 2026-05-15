import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, BookOpen, ThumbsUp, ThumbsDown, Printer, Copy, Check, Link2, ArrowLeft, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const SectionBlock = ({ label, content, className = "" }) => {
  if (!content) return null;
  return (
    <div className={`rounded-lg border p-4 space-y-1.5 ${className}`}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="text-sm prose prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default function HelpTopicDetail({ selectedTarget, helpTargets, contentMap, onBack, onBackToModule, onSelectTarget }) {
  const target = helpTargets.find(t => t.target_code === selectedTarget);
  const content = contentMap[selectedTarget];
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Increment view count on open
  useEffect(() => {
    if (content?.id) {
      base44.entities.HelpContent.update(content.id, { view_count: (content.view_count || 0) + 1 }).catch(() => {});
    }
  }, [content?.id]);

  const handleFeedback = async (rating) => {
    if (!content?.id || feedbackSubmitted) return;
    try {
      await base44.entities.HelpAuditLog.create({
        event_type: "HELP_MODAL_OPENED",
        entity_type: "HelpContent",
        entity_id: content.id,
        target_code: selectedTarget,
        notes: `User feedback rating: ${rating}/5`,
      });
      setFeedbackSubmitted(true);
    } catch {}
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/help?target=${selectedTarget}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  // Parse related topics as clickable links to other target codes
  const relatedTopics = content?.related_topics_text
    ? content.related_topics_text.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const relatedTargetCodes = relatedTopics.filter(t => t.includes("-") || t.includes("_") && contentMap[t]);
  const relatedLabels = relatedTopics.filter(t => !relatedTargetCodes.includes(t));

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <button onClick={onBack} className="text-primary hover:underline">All Modules</button>
        {target && (
          <>
            <span className="text-muted-foreground">/</span>
            <button onClick={onBackToModule} className="text-primary hover:underline">{MODULE_LABELS[target.module_code] || target.module_code}</button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">{target.target_label}</span>
          </>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <CardTitle className="text-xl leading-tight">{content?.help_title || target?.target_label}</CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {target?.module_code && <Badge variant="outline" className="text-[9px]">{MODULE_LABELS[target.module_code] || target.module_code}</Badge>}
                {(target?.component_type || target?.target_type) && (
                  <Badge variant="outline" className="text-[9px]">{target?.component_type || target?.target_type}</Badge>
                )}
                <code className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{selectedTarget}</code>
                {content?.view_count > 0 && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {content.view_count} views
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={handleCopyLink}>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={handlePrint}>
                <Printer className="w-3 h-3" /> Print
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1 text-xs h-8"
                onClick={() => window.dispatchEvent(new CustomEvent("openHelpAI", {
                  detail: { targetCode: selectedTarget, prefill: `Tell me about: ${content?.help_title || target?.target_label}` }
                }))}
              >
                <MessageSquare className="w-3 h-3" /> Ask HelpAI
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {!content ? (
            <div className="text-center py-10 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/20" />
              <p className="text-muted-foreground text-sm">Help content is not yet available for this item.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("openHelpAI", { detail: { prefill: `What is ${target?.target_label}?` } }))}
                className="text-sm text-primary hover:underline"
              >
                Ask HelpAI instead →
              </button>
            </div>
          ) : (
            <>
              {/* Summary highlight */}
              {content.short_help_text && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                  <p className="text-sm font-medium leading-relaxed">{content.short_help_text}</p>
                </div>
              )}

              {/* Main content */}
              {content.detailed_help_text && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{content.detailed_help_text}</ReactMarkdown>
                </div>
              )}

              {/* Process meaning */}
              {content.process_meaning_text && (
                <SectionBlock label="What this means in your workflow" content={content.process_meaning_text} />
              )}

              {/* Capabilities */}
              {content.feature_capabilities_text && (
                <SectionBlock label="Capabilities" content={content.feature_capabilities_text} />
              )}

              {/* What to do */}
              {content.expected_user_action_text && (
                <SectionBlock label="What to do" content={content.expected_user_action_text} className="bg-green-50/50 border-green-100" />
              )}

              {/* Allowed values */}
              {content.allowed_values_text && (
                <SectionBlock label="Allowed Values" content={content.allowed_values_text} />
              )}

              {/* Examples */}
              {content.examples_text && (
                <div className="rounded-lg bg-slate-50 border p-4 space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Example</p>
                  <p className="text-sm text-slate-700">{content.examples_text}</p>
                </div>
              )}

              {/* Dependency notes */}
              {content.dependency_notes_text && (
                <SectionBlock label="Dependencies & Prerequisites" content={content.dependency_notes_text} className="bg-blue-50/50 border-blue-100" />
              )}

              {/* Validation */}
              {content.validation_notes_text && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-1.5">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Validation Rules</p>
                  <p className="text-sm text-blue-800">{content.validation_notes_text}</p>
                </div>
              )}

              {/* Warnings */}
              {content.warnings_text && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-1.5">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">⚠ Warning</p>
                  <p className="text-sm text-amber-800">{content.warnings_text}</p>
                </div>
              )}

              {/* Related Topics */}
              {(relatedTargetCodes.length > 0 || relatedLabels.length > 0) && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Related Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {relatedTargetCodes.map((code, i) => (
                      <button key={i} onClick={() => onSelectTarget(code)}
                        className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors">
                        {contentMap[code]?.help_title || code}
                      </button>
                    ))}
                    {relatedLabels.map((label, i) => (
                      <span key={i} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded border">{label}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Last updated */}
              {content.updated_date && (
                <p className="text-[10px] text-muted-foreground pt-2 border-t">
                  Last updated: {new Date(content.updated_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {content.last_updated_by && ` by ${content.last_updated_by}`}
                  {content.version_no && ` · v${content.version_no}`}
                </p>
              )}

              {/* Feedback */}
              <div className="pt-3 border-t flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Was this helpful?</span>
                {feedbackSubmitted ? (
                  <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Thank you!</span>
                ) : (
                  <>
                    <button onClick={() => handleFeedback(5)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600 transition-colors px-2 py-1 rounded hover:bg-green-50">
                      <ThumbsUp className="w-3.5 h-3.5" /> Yes
                    </button>
                    <button onClick={() => handleFeedback(1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">
                      <ThumbsDown className="w-3.5 h-3.5" /> No
                    </button>
                  </>
                )}
                <button
                  className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={() => window.dispatchEvent(new CustomEvent("openHelpAI", { detail: { prefill: `I need more detail on: ${content.help_title}` } }))}
                >
                  <MessageSquare className="w-3 h-3" /> Ask follow-up question
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Back navigation */}
      <button onClick={onBackToModule} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {MODULE_LABELS[target?.module_code] || "module"}
      </button>
    </div>
  );
}