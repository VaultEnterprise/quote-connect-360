import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const CENSUS_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "date_of_birth", label: "DOB" },
  { key: "email", label: "Email" },
  { key: "employment_status", label: "Status" },
  { key: "employment_type", label: "Type" },
  { key: "coverage_tier", label: "Coverage" },
];

export default function TransformPreview({ rows, mapping, transformRow }) {
  const previewRows = useMemo(() => {
    return rows.slice(0, 5).map(row => ({
      original: row,
      transformed: transformRow(row, mapping)
    }));
  }, [rows, mapping, transformRow]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Transformed Data Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          This is how your data will be normalized and stored. Showing first 5 rows.
        </p>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {CENSUS_FIELDS.map(f => (
                  <TableHead key={f.key} className="text-xs py-2 whitespace-nowrap">
                    {f.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((pr, i) => (
                <TableRow key={i} className="text-xs">
                  {CENSUS_FIELDS.map(f => {
                    const val = pr.transformed[f.key];
                    return (
                      <TableCell key={f.key} className="py-2 text-muted-foreground">
                        {val ? (
                          <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                            {typeof val === "string" ? val : JSON.stringify(val)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}