import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

/**
 * Relationship Scope Summary
 * Displays allowed operations and denied operations from scope definition
 * Fail-closed: returns null if scope_definition is missing
 */
export default function MGARelationshipScopeSummary({ scopeDefinition }) {
  if (!scopeDefinition) {
    return null;
  }

  const allowedOperations = scopeDefinition.allowed_operations || [];
  const deniedOperations = scopeDefinition.denied_operations || [];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Scope Definition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allowedOperations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-green-700 mb-2">Allowed Operations</h4>
            <ul className="space-y-1">
              {allowedOperations.map((op, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="w-3 h-3 text-green-600" />
                  {op}
                </li>
              ))}
            </ul>
          </div>
        )}

        {deniedOperations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-700 mb-2">Denied Operations</h4>
            <ul className="space-y-1">
              {deniedOperations.map((op, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                  <X className="w-3 h-3 text-red-600" />
                  {op}
                </li>
              ))}
            </ul>
          </div>
        )}

        {allowedOperations.length === 0 && deniedOperations.length === 0 && (
          <p className="text-sm text-slate-500">No scope definition available</p>
        )}
      </CardContent>
    </Card>
  );
}