import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ScenarioVersionHistory({ scenario, versions = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!versions || versions.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        No version history available.
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full hover:bg-muted p-2 rounded"
      >
        <p className="font-semibold text-sm">Version History ({versions.length})</p>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.map((version, idx) => (
            <div key={idx} className="border rounded p-3 text-sm hover:bg-muted/50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">v{version.version || idx + 1}</span>
                <Badge variant={idx === 0 ? 'default' : 'secondary'} className="text-xs">
                  {idx === 0 ? 'Current' : 'Previous'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {format(new Date(version.created_at || Date.now()), 'MMM d, yyyy h:mm a')}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs">
                  View
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Download className="w-3 h-3" /> Export
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}