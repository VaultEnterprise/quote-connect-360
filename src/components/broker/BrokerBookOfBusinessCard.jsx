/**
 * Book of Business Card — Phase 7A-2.5
 * 
 * Displays overview of Direct Book and MGA-Affiliated Book.
 * Shows channel-labeled counts from safe payloads.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

export default function BrokerBookOfBusinessCard({ dashboard }) {
  if (!dashboard?.book_of_business) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            My Book of Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const { direct_book, mga_affiliated_book } = dashboard.book_of_business;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          My Book of Business
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Direct Book Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Direct Book</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                Direct
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Employers</p>
                <p className="text-2xl font-bold text-foreground">
                  {direct_book?.total_employers || 0}
                </p>
              </div>
              <div className="bg-secondary/50 rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Cases</p>
                <p className="text-2xl font-bold text-foreground">
                  {direct_book?.total_cases || 0}
                </p>
              </div>
            </div>
          </div>

          {/* MGA-Affiliated Book Section */}
          {mga_affiliated_book?.accessible && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">MGA-Affiliated Book</h3>
                <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                  MGA-Affiliated
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Employers</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mga_affiliated_book?.total_employers || 0}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Cases</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mga_affiliated_book?.total_cases || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}