import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EXPORT_OPTIONS = [
  { label: "Excel (.xlsx)", value: "xlsx", icon: FileSpreadsheet },
  { label: "Excel 97-2003 (.xls)", value: "xls", icon: FileSpreadsheet },
  { label: "JSON (.json)", value: "json", icon: FileJson },
  { label: "SQL (.sql)", value: "sql", icon: FileText },
  { label: "Comma Delimited (.csv)", value: "csv", icon: FileText },
  { label: "Tab Delimited (.txt)", value: "txt", icon: FileText },
];

function downloadFile({ filename, mimeType, content, encoding }) {
  const blob = encoding === "base64"
    ? new Blob([
        Uint8Array.from(atob(content), (char) => char.charCodeAt(0))
      ], { type: mimeType })
    : new Blob([content], { type: mimeType });

  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

export default function PlanExportMenu({ planId }) {
  const [loadingFormat, setLoadingFormat] = useState("");

  const handleExport = async (format) => {
    setLoadingFormat(format);
    try {
      const response = await base44.functions.invoke("exportPlanData", { plan_id: planId, format });
      downloadFile(response.data);
      toast.success("Plan export downloaded");
    } catch (error) {
      toast.error(error.message || "Could not export plan");
    } finally {
      setLoadingFormat("");
    }
  };

  const activeOption = EXPORT_OPTIONS.find((option) => option.value === loadingFormat);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={!!loadingFormat}>
          {loadingFormat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {activeOption ? `Exporting ${activeOption.value.toUpperCase()}...` : "Export Plan"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {EXPORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem key={option.value} onClick={() => handleExport(option.value)}>
              <Icon className="w-4 h-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}