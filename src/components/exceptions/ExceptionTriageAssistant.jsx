import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ExceptionTriageAssistant({ exception }) {
  const [triageData, setTriageData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateTriage = async () => {
    if (!exception) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert health benefits operations triage specialist. Analyze this exception and provide:
1. Root cause analysis (most likely reason this occurred)
2. Severity justification (is the current severity appropriate?)
3. Suggested immediate actions (1-3 concrete next steps)
4. Prevention recommendations
5. Related exception patterns to watch for

Exception Details:
Title: ${exception.title}
Category: ${exception.category}
Severity: ${exception.severity}
Description: ${exception.description || "None"}
Status: ${exception.status}
Suggested Action: ${exception.suggested_action || "None"}

Be concise but thorough. Format as a brief analysis with clear sections.`,
        model: "claude_sonnet_4_6"
      });
      setTriageData(res);
    } catch (e) {
      setTriageData(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!exception) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          AI Triage Assistant
          <Badge className="text-[9px] bg-purple-100 text-purple-700 border-purple-200 border py-0 ml-auto">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!triageData ? (
          <>
            <p className="text-xs text-muted-foreground">Get AI-powered insights on root cause, severity, and recommended actions for this exception.</p>
            <Button size="sm" onClick={generateTriage} disabled={loading} className="gap-1.5 w-full bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? "Analyzing..." : "Generate Triage Analysis"}
            </Button>
          </>
        ) : (
          <div className="prose prose-sm prose-purple max-w-none text-xs space-y-2">
            {triageData.split("\n").map((line, i) => {
              if (line.startsWith("##")) return <p key={i} className="font-bold text-sm mt-2">{line.replace("##", "").trim()}</p>;
              if (line.startsWith("-")) return <p key={i} className="ml-3">• {line.replace("-", "").trim()}</p>;
              return <p key={i}>{line}</p>;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}