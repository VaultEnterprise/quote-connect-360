import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CensusMappingPreview({ preview = [], mapping = {} }) {
  const reversedMapping = {};
  Object.entries(mapping).forEach(([sourceIdx, systemField]) => {
    if (systemField && systemField !== "ignore") {
      reversedMapping[systemField] = parseInt(sourceIdx, 10);
    }
  });

  const mappedFields = Object.keys(reversedMapping).sort();

  if (preview.length === 0 || mappedFields.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No preview data available. Complete the mapping to see a preview.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mapped Data Preview</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          First {preview.length} rows with mapped fields applied.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">Row</TableHead>
                {mappedFields.map((field) => (
                  <TableHead key={field} className="text-left">
                    {field}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  {mappedFields.map((field) => (
                    <TableCell key={field} className="max-w-32 truncate">
                      {row[field] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}