import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function DataTable({
  columns = [],
  data = [],
  selectable = false,
  onSelectionChange,
  sortable = true,
  striped = true,
  hover = true,
  compact = false,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(data.map((_, i) => i)));
      onSelectionChange?.(data);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (index, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
    const selectedData = data.filter((_, i) => newSelected.has(i));
    onSelectionChange?.(selectedData);
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    });

    return sorted;
  }, [data, sortConfig]);

  const handleSort = (columnKey) => {
    if (!sortable) return;

    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (columnKey) => {
    if (!sortable) return null;
    if (sortConfig.key !== columnKey) return <ChevronsUpDown className="w-4 h-4" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {selectable && (
              <TableHead className={`w-12 ${compact ? 'px-3 py-2' : ''}`}>
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map(column => (
              <TableHead
                key={column.key}
                className={`${column.className || ''} ${sortable ? 'cursor-pointer hover:bg-muted' : ''} ${compact ? 'px-3 py-2' : ''}`}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, idx) => (
            <TableRow
              key={idx}
              className={`${striped && idx % 2 === 0 ? 'bg-muted/25' : ''} ${hover ? 'hover:bg-muted/50' : ''} ${compact ? 'h-10' : ''}`}
            >
              {selectable && (
                <TableCell className={`w-12 ${compact ? 'px-3 py-2' : ''}`}>
                  <Checkbox
                    checked={selectedRows.has(idx)}
                    onCheckedChange={(checked) => handleSelectRow(idx, checked)}
                  />
                </TableCell>
              )}
              {columns.map(column => (
                <TableCell key={column.key} className={`${column.className || ''} ${compact ? 'px-3 py-2 text-xs' : 'text-sm'}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}