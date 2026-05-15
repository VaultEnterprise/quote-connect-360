import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Copy, Check, Printer, BookOpen, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function HelpManualTopicDetail({ topic, onBack }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/help?topic=${topic.topic_code}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button onClick={onBack} className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{topic.topic_title}</span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[9px]">{topic.topic_type?.replace(/_/g, " ")}</Badge>
                  {topic.module_code && <Badge variant="outline" className="text-[9px] ml-1">{topic.module_code}</Badge>}
                </div>
              </div>
              <CardTitle className="text-xl">{topic.topic_title}</CardTitle>
              {topic.topic_summary && (
                <p className="text-sm text-muted-foreground mt-1">{topic.topic_summary}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {topic.view_count > 0 && <span>{topic.view_count} views</span>}
                {topic.published_at && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    Published {new Date(topic.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => window.print()}>
                <Printer className="w-3 h-3" /> Print
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1 text-xs h-8"
                onClick={() => window.dispatchEvent(new CustomEvent("openHelpAI", {
                  detail: { prefill: `Tell me more about: ${topic.topic_title}` }
                }))}
              >
                <MessageSquare className="w-3 h-3" /> Ask HelpAI
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {topic.topic_body ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{topic.topic_body}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No content available for this guide.</p>
          )}

          {topic.search_keywords && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {topic.search_keywords.split(",").map((k, i) => (
                  <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{k.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}