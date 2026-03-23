import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ImportExportPanel({ contentMap }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalRecords: Object.keys(contentMap).length,
        records: Object.values(contentMap).map(c => ({
          id: c.id,
          help_target_code: c.help_target_code,
          help_title: c.help_title,
          short_help_text: c.short_help_text,
          detailed_help_text: c.detailed_help_text,
          feature_capabilities_text: c.feature_capabilities_text,
          process_meaning_text: c.process_meaning_text,
          expected_user_action_text: c.expected_user_action_text,
          allowed_values_text: c.allowed_values_text,
          examples_text: c.examples_text,
          dependency_notes_text: c.dependency_notes_text,
          warnings_text: c.warnings_text,
          validation_notes_text: c.validation_notes_text,
          related_topics_text: c.related_topics_text,
          search_keywords: c.search_keywords,
          content_status: c.content_status,
          role_visibility: c.role_visibility
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `help-content-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Exported", description: `${exportData.totalRecords} help content records exported.` });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data.records)) {
        throw new Error("Invalid file format. Expected records array.");
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const record of data.records) {
        try {
          const existing = Object.values(contentMap).find(c => c.help_target_code === record.help_target_code);
          if (existing) {
            await base44.entities.HelpContent.update(existing.id, record);
            updated++;
          } else {
            await base44.entities.HelpContent.create(record);
            created++;
          }
        } catch {
          skipped++;
        }
      }

      toast({ 
        title: "Imported", 
        description: `Created ${created}, updated ${updated}, skipped ${skipped}.` 
      });

      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Download all help content as JSON. Useful for backups, migration, or external analysis.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-[10px] font-mono text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-600" />
                {Object.keys(contentMap).length} records ready to export
              </p>
            </div>
            <Button 
              onClick={handleExport} 
              disabled={loading || Object.keys(contentMap).length === 0}
              className="w-full gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Export as JSON
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Import help content from a JSON file. Matching records will be updated, new ones created.
            </p>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-[10px] text-amber-700 flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Records are matched by help_target_code. Existing records will be overwritten.</span>
              </p>
            </div>
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={loading}
                className="hidden"
              />
              <Button 
                asChild
                disabled={loading}
                variant="outline"
                className="w-full gap-2 cursor-pointer"
              >
                <span>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Choose JSON File
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-xs text-blue-900 font-medium mb-2">Export/Import Format</p>
          <p className="text-[10px] text-blue-800 font-mono bg-white rounded p-2 border border-blue-100 overflow-x-auto">
            {`{ "exportDate": "...", "totalRecords": N, "records": [...] }`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}