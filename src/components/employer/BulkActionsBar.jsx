import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, MoreVertical, FileSpreadsheet, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

export function BulkActionsBar({ selectedEmployers, onClearSelection, agencies }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showImportModal, setShowImportModal] = useState(false);

  const bulkStatusUpdate = useMutation({
    mutationFn: async ({ ids, status }) => {
      await Promise.all(ids.map(id => base44.entities.EmployerGroup.update(id, { status })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employers"] });
      toast({ title: `Updated ${selectedEmployers.length} employers` });
      onClearSelection();
    },
  });

  const bulkAgencyAssign = useMutation({
    mutationFn: async ({ ids, agency_id }) => {
      await Promise.all(ids.map(id => base44.entities.EmployerGroup.update(id, { agency_id })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employers"] });
      toast({ title: `Assigned ${selectedEmployers.length} employers to agency` });
      onClearSelection();
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.EmployerGroup.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employers"] });
      toast({ title: `Deleted ${selectedEmployers.length} employers` });
      onClearSelection();
    },
  });

  const handleExport = () => {
    const csv = selectedEmployers.map(e => [
      e.name, e.dba_name, e.ein, e.industry, e.sic_code, e.address, e.city, e.state, e.zip,
      e.phone, e.website, e.employee_count, e.eligible_count, e.effective_date, e.renewal_date,
      e.status, e.primary_contact_name, e.primary_contact_email, e.primary_contact_phone
    ]);
    csv.unshift(["Name", "DBA", "EIN", "Industry", "SIC", "Address", "City", "State", "ZIP", "Phone", "Website", "Employees", "Eligible", "Effective Date", "Renewal Date", "Status", "Contact Name", "Contact Email", "Contact Phone"]);
    
    const blob = new Blob([csv.map(row => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employers_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export started" });
  };

  const handleStatusChange = (status) => {
    if (confirm(`Set ${selectedEmployers.length} employers to ${status}?`)) {
      bulkStatusUpdate.mutate({ ids: selectedEmployers.map(e => e.id), status });
    }
  };

  const handleAgencyAssign = (agency_id) => {
    if (confirm(`Assign ${selectedEmployers.length} employers to this agency?`)) {
      bulkAgencyAssign.mutate({ ids: selectedEmployers.map(e => e.id), agency_id });
    }
  };

  const handleDelete = () => {
    if (confirm(`Permanently delete ${selectedEmployers.length} employers? This cannot be undone.`)) {
      bulkDelete.mutate(selectedEmployers.map(e => e.id));
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4">
      <span className="text-sm font-medium text-primary">{selectedEmployers.length} selected</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreVertical className="w-3.5 h-3.5 mr-1" />
            Update Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleStatusChange("prospect")}>Set to Prospect</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("active")}>Set to Active</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("inactive")}>Set to Inactive</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("terminated")}>Set to Terminated</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {agencies.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              Assign Agency
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {agencies.map(a => (
              <DropdownMenuItem key={a.id} onClick={() => handleAgencyAssign(a.id)}>
                {a.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button size="sm" variant="outline" onClick={handleExport}>
        <Download className="w-3.5 h-3.5 mr-1" />
        Export
      </Button>

      <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}>
        <Upload className="w-3.5 h-3.5 mr-1" />
        Import
      </Button>

      <Button size="sm" variant="destructive" onClick={handleDelete}>
        Delete ({selectedEmployers.length})
      </Button>

      <Button size="sm" variant="ghost" onClick={onClearSelection}>
        Clear Selection
      </Button>
    </div>
  );
}

export function EmployerImportModal({ open, onClose, agencies }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [agency_id, setAgency_id] = useState(agencies[0]?.id || "");

  const handleImport = async () => {
    if (!file || !agency_id) {
      toast({ title: "Please select a file and agency", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").map(l => l.trim()).filter(l => l);
        const headers = lines[0].split(",").map(h => h.toLowerCase().trim());
        
        const employers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          const employer = { agency_id };
          
          headers.forEach((header, idx) => {
            const value = values[idx]?.trim();
            if (value) {
              if (header.includes("employee") || header.includes("eligible")) {
                employer[header.replace(/\s+/g, "_")] = Number(value) || undefined;
              } else {
                employer[header.replace(/\s+/g, "_")] = value;
              }
            }
          });
          
          if (employer.name) {
            employers.push(employer);
          }
        }

        await base44.entities.EmployerGroup.bulkCreate(employers);
        queryClient.invalidateQueries({ queryKey: ["employers"] });
        toast({ title: `Imported ${employers.length} employers` });
        onClose();
      } catch (error) {
        toast({ title: "Import failed", description: error.message, variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Employers from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Select Agency</Label>
            <Select value={agency_id} onValueChange={setAgency_id}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select agency..." />
              </SelectTrigger>
              <SelectContent>
                {agencies.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Upload CSV File</Label>
            <Input 
              type="file" 
              accept=".csv" 
              onChange={(e) => setFile(e.target.files[0])}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              CSV should include columns: name, dba_name, ein, industry, sic_code, address, city, state, zip, phone, website, employee_count, eligible_count, status, primary_contact_name, primary_contact_email, primary_contact_phone
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || !agency_id}>
            <Upload className="w-4 h-4 mr-2" />
            Import Employers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}