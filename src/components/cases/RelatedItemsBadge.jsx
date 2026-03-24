import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, CheckSquare, Users, BarChart3 } from "lucide-react";

export default function RelatedItemsBadge({ caseId, quotes = 0, tasks = 0, documents = 0, enrollments = 0 }) {
  const [open, setOpen] = useState(false);
  const total = quotes + tasks + documents + enrollments;

  if (total === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge variant="secondary" className="text-[10px] py-0 h-4 cursor-pointer hover:bg-secondary/80 transition-colors">
          {total} items
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3">
        <div className="space-y-2 text-xs">
          {quotes > 0 && (
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-blue-600" />
              <span>{quotes} quote{quotes !== 1 ? "s" : ""}</span>
            </div>
          )}
          {tasks > 0 && (
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3 h-3 text-green-600" />
              <span>{tasks} task{tasks !== 1 ? "s" : ""}</span>
            </div>
          )}
          {documents > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3 text-amber-600" />
              <span>{documents} document{documents !== 1 ? "s" : ""}</span>
            </div>
          )}
          {enrollments > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-purple-600" />
              <span>{enrollments} enrollment window{enrollments !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}