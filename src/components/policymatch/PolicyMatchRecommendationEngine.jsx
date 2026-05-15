import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Copy, Check } from "lucide-react";

export default function PolicyMatchRecommendationEngine({ result }) {
  const [copied, setCopied] = useState(false);

  if (!result.broker_talking_points || result.broker_talking_points.length === 0) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allTalkingPoints = result.broker_talking_points.join("\n\n");

  return (
    <Card>
      <CardHeader className="pb-3 flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" /> Broker Recommendation Script
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs gap-1"
          onClick={() => copyToClipboard(allTalkingPoints)}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy All"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {result.broker_talking_points.map((tp, i) => (
          <div
            key={i}
            onClick={() => copyToClipboard(tp)}
            className="cursor-pointer p-3 rounded-lg bg-primary/5 border border-primary/15 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-[10px] font-black text-primary bg-primary/15 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs text-foreground leading-relaxed flex-1">{tp}</p>
              <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}