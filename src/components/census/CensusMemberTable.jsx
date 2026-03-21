import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";

export default function CensusMemberTable({ censusVersionId, caseId, onSelectMember }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["census-members", censusVersionId],
    queryFn: () => base44.entities.CensusMember.filter({ census_version_id: censusVersionId }),
    enabled: !!censusVersionId,
  });

  const filtered = members.filter(m => {
    const name = `${m.first_name} ${m.last_name}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.validation_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const validationIcon = (status) => {
    if (status === "valid") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    if (status === "has_errors") return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    if (status === "has_warnings") return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    return null;
  };

  if (isLoading) return <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="has_warnings">Has Warnings</SelectItem>
            <SelectItem value="has_errors">Has Errors</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertCircle} title="No members found" description={members.length === 0 ? "No member records in this census version" : "Try adjusting your filters"} />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs py-2">Name</TableHead>
                <TableHead className="text-xs py-2">DOB</TableHead>
                <TableHead className="text-xs py-2">Employment</TableHead>
                <TableHead className="text-xs py-2">Coverage</TableHead>
                <TableHead className="text-xs py-2">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow 
                  key={m.id} 
                  className="text-xs cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectMember?.(m)}
                >
                  <TableCell className="py-2">
                    <div className="font-medium">{m.first_name} {m.last_name}</div>
                    {m.email && <div className="text-muted-foreground">{m.email}</div>}
                  </TableCell>
                  <TableCell className="py-2">{m.date_of_birth || "—"}</TableCell>
                  <TableCell className="py-2">
                    <div className="capitalize">{m.employment_status || "active"}</div>
                    <div className="text-muted-foreground capitalize">{m.employment_type?.replace(/_/g, " ")}</div>
                  </TableCell>
                  <TableCell className="py-2 capitalize">{m.coverage_tier?.replace(/_/g, " ") || "—"}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      {validationIcon(m.validation_status)}
                      <span className="capitalize">{m.validation_status || "pending"}</span>
                    </div>
                    {m.validation_issues?.length > 0 && (
                      <div className="text-destructive mt-0.5">{m.validation_issues.length} issue(s)</div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} of {members.length} members</p>
    </div>
  );
}