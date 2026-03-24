import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CaseSelectionBar({ selectedCount, onSelectAll, onClearSelection, onBulkStatusUpdate, onBulkDelete, totalCount }) {
  const [statusMenu, setStatusMenu] = useState(false);

  const statuses = ['draft', 'census_in_progress', 'census_validated', 'ready_for_quote', 'quoting', 'proposal_ready', 'employer_review', 'approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active', 'closed'];

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-primary/5 border-b border-border rounded-t-lg">
      <Checkbox
        checked={selectedCount === totalCount && totalCount > 0}
        onCheckedChange={(checked) => checked ? onSelectAll() : onClearSelection()}
        className="w-5 h-5"
      />
      <span className="text-sm font-medium">{selectedCount} selected</span>
      
      <div className="ml-auto flex gap-2">
        <DropdownMenu open={statusMenu} onOpenChange={setStatusMenu}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Update Status <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Change Status To</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                onClick={() => {
                  onBulkStatusUpdate(status);
                  setStatusMenu(false);
                  toast.success(`Updated ${selectedCount} cases`);
                }}
              >
                {status.replace(/_/g, ' ')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (window.confirm(`Delete ${selectedCount} cases?`)) {
              onBulkDelete();
              toast.success(`Deleted ${selectedCount} cases`);
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </div>
  );
}