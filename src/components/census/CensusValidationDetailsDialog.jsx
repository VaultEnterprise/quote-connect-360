import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CensusValidationDetailsDialog({ open, onOpenChange, results = [] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation Details</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id || result.record_id}>
                <TableCell>{result.row_number || "—"}</TableCell>
                <TableCell className="capitalize">{result.status}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {(result.errors || []).map((error, index) => (
                      <div key={index} className="text-xs">
                        <span className="font-medium uppercase">{error.severity}</span> — {error.field}: {error.message}
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}