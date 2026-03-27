import React, { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

export default function GradientAIAnalysisPanel({ censusVersionId, caseId, onAnalysisComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('processGradientAI', {
        census_version_id: censusVersionId,
        force_reanalysis: false
      });

      setResult(response.data);
      setLastAnalyzed(new Date());
      
      try {
        await base44.functions.invoke('createHighRiskExceptions', {
          census_version_id: censusVersionId,
          case_id: caseId
        });
      } catch (exceptionError) {
        console.error('High-risk exception creation failed:', exceptionError);
      }

      onAnalysisComplete?.();
    } catch (error) {
      console.error('GradientAI analysis failed:', error);
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">GradientAI Risk Analysis</CardTitle>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            size="sm"
            className="text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Run Analysis"
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-xs">
        {lastAnalyzed && (
          <p className="text-muted-foreground">
            Last analyzed: {lastAnalyzed.toLocaleString()}
          </p>
        )}

        {result && !result.error && (
          <div className="space-y-1 p-2 rounded bg-muted">
            <p><strong>Processed:</strong> {result.processed} members</p>
            <p><strong>Succeeded:</strong> {result.succeeded}</p>
            {result.failed > 0 && (
              <p className="text-destructive"><strong>Failed:</strong> {result.failed}</p>
            )}
            <div className="mt-2 pt-2 border-t space-y-1">
              <p><strong>Risk Distribution:</strong></p>
              <p className="text-green-600">• Preferred: {result.risk_summary.preferred_count}</p>
              <p className="text-blue-600">• Standard: {result.risk_summary.standard_count}</p>
              <p className="text-orange-600">• Elevated: {result.risk_summary.elevated_count}</p>
              <p className="text-red-600">• High: {result.risk_summary.high_risk_count}</p>
            </div>
          </div>
        )}

        {result?.error && (
          <p className="text-destructive">Error: {result.error}</p>
        )}

        <p className="text-muted-foreground italic">
          Analyzes member profiles to predict health risks and optimal plan matches.
        </p>
      </CardContent>
    </Card>
  );
}