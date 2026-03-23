import React, { useState, useEffect, useRef } from "react";
import { HelpCircle, X, ExternalLink, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

/**
 * HelpIcon — the universal contextual help trigger.
 * Usage: <HelpIcon targetCode="CASES.DETAIL.STAGE" />
 * Place it next to any field, button, label, or UI element.
 */
export default function HelpIcon({ targetCode, size = "sm", className = "" }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  const iconSize = size === "xs" ? "w-3 h-3" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  useEffect(() => {
    if (open && !content) {
      loadContent();
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const results = await base44.entities.HelpContent.filter(
        { help_target_code: targetCode, status: "active" },
        "-version_no",
        1
      );
      if (results.length > 0) {
        setContent(results[0]);
        // increment view count silently
        base44.entities.HelpContent.update(results[0].id, {
          view_count: (results[0].view_count || 0) + 1
        });
      } else {
        setContent(null);
      }
    } catch (e) {
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center justify-center text-muted-foreground/50 hover:text-primary transition-colors flex-shrink-0 ${className}`}
        title="Help"
        aria-label="Open help"
      >
        <HelpCircle className={iconSize} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
          onClick={handleOverlayClick}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{targetCode}</span>
                </div>
                <h3 className="font-semibold text-base">
                  {loading ? "Loading…" : content ? content.help_title : "Help"}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-3 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  Loading help content…
                </div>
              ) : content ? (
                <>
                  {/* Short summary */}
                  {content.short_help && (
                    <p className="text-sm text-foreground font-medium bg-primary/5 border border-primary/10 rounded-lg p-3">
                      {content.short_help}
                    </p>
                  )}

                  {/* Detailed help */}
                  {content.detailed_help && (
                    <div className="prose prose-sm max-w-none text-sm">
                      <ReactMarkdown>{content.detailed_help}</ReactMarkdown>
                    </div>
                  )}

                  {/* Expected action */}
                  {content.expected_user_action && (
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What to do</p>
                      <p className="text-sm">{content.expected_user_action}</p>
                    </div>
                  )}

                  {/* Allowed values */}
                  {content.allowed_values && (
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Allowed Values</p>
                      <p className="text-sm text-muted-foreground">{content.allowed_values}</p>
                    </div>
                  )}

                  {/* Example */}
                  {content.usage_example && (
                    <div className="rounded-lg bg-slate-50 border p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Example</p>
                      <p className="text-sm text-slate-700">{content.usage_example}</p>
                    </div>
                  )}

                  {/* Warnings */}
                  {content.warnings && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">⚠ Warning</p>
                      <p className="text-sm text-amber-800">{content.warnings}</p>
                    </div>
                  )}

                  {/* Related topics */}
                  {content.related_topics && content.related_topics.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Related Topics</p>
                      <div className="flex flex-wrap gap-1.5">
                        {content.related_topics.map((t, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">Help content is not yet available for this item.</p>
                  <p className="text-xs text-muted-foreground">Contact your administrator to add help for this item.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => {
                  window.location.href = "/settings?tab=help&search=" + encodeURIComponent(targetCode);
                  setOpen(false);
                }}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> View in Help Manual
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("openHelpAI", { detail: { targetCode, prefill: content?.help_title } }));
                  setOpen(false);
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" /> Ask HelpAI
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}