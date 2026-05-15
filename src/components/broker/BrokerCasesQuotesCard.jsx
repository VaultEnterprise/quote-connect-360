/**
 * Cases and Quotes Card — Phase 7A-2.5
 * 
 * Displays open cases and quotes separated by channel.
 * Read-only metadata only.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart3 } from 'lucide-react';

export default function BrokerCasesQuotesCard({ dashboard }) {
  if (!dashboard?.book_of_business) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-4 h-4" />
              Open Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-4 h-4" />
              Open Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { direct_book, mga_affiliated_book } = dashboard.book_of_business;
  const directCases = direct_book?.total_cases || 0;
  const mgaCases = mga_affiliated_book?.total_cases || 0;
  const directQuotes = direct_book?.open_quotes || 0;
  const mgaQuotes = mga_affiliated_book?.open_quotes || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Open Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-4 h-4" />
            Open Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Direct Book</span>
              <span className="text-2xl font-bold text-foreground">{directCases}</span>
            </div>
            {mga_affiliated_book?.accessible && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">MGA-Affiliated</span>
                <span className="text-2xl font-bold text-foreground">{mgaCases}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{directCases + mgaCases}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-4 h-4" />
            Open Quotes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Direct Book</span>
              <span className="text-2xl font-bold text-foreground">{directQuotes}</span>
            </div>
            {mga_affiliated_book?.accessible && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">MGA-Affiliated</span>
                <span className="text-2xl font-bold text-foreground">{mgaQuotes}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{directQuotes + mgaQuotes}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Read-only view</p>
        </CardContent>
      </Card>
    </div>
  );
}