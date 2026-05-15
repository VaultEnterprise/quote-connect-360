import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Users, UserX, UserPlus, TrendingUp } from "lucide-react";

export default function CensusVersionComparison({ version1Id, version2Id, open, onOpenChange }) {
  const { data: members1 = [] } = useQuery({
    queryKey: ["census-members", version1Id],
    queryFn: () => base44.entities.CensusMember.filter({ census_version_id: version1Id }),
    enabled: !!version1Id && open,
  });

  const { data: members2 = [] } = useQuery({
    queryKey: ["census-members", version2Id],
    queryFn: () => base44.entities.CensusMember.filter({ census_version_id: version2Id }),
    enabled: !!version2Id && open,
  });

  if (!open || !version1Id || !version2Id) return null;

  // Build unique ID set (email or first+last name)
  const getMemberId = (m) => m.email || `${m.first_name}${m.last_name}`.toLowerCase();

  const set1 = new Set(members1.map(getMemberId));
  const set2 = new Set(members2.map(getMemberId));

  const added = members2.filter(m => !set1.has(getMemberId(m)));
  const removed = members1.filter(m => !set2.has(getMemberId(m)));
  const retained = members1.filter(m => set2.has(getMemberId(m)));

  // Age distribution shift
  const getAge = (m) => m.date_of_birth ? new Date().getFullYear() - new Date(m.date_of_birth).getFullYear() : null;
  const avgAge1 = retained.length > 0 ? Math.round(retained.reduce((sum, m) => sum + (getAge(m) || 0), 0) / retained.length) : 0;
  const avgAge2 = members2.length > 0 ? Math.round(members2.reduce((sum, m) => sum + (getAge(m) || 0), 0) / members2.length) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Census Comparison</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Previous Total</p>
                <p className="text-xl font-bold">{members1.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-blue-700 mb-1 font-medium">Added</p>
                <p className="text-xl font-bold text-blue-700">{added.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-red-700 mb-1 font-medium">Removed</p>
                <p className="text-xl font-bold text-red-700">{removed.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">New Total</p>
                <p className="text-xl font-bold">{members2.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Change Arrow */}
          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Previous</p>
              <p className="text-sm font-semibold">{members1.length} members</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground mx-3" />
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-sm font-semibold">{members2.length} members</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Net Change</p>
              <p className={`text-sm font-semibold ${members2.length >= members1.length ? "text-green-600" : "text-red-600"}`}>
                {members2.length >= members1.length ? "+" : ""}{members2.length - members1.length}
              </p>
            </div>
          </div>

          {/* Demographics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Workforce Demographics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground mb-1">Previous Avg Age</p>
                <p className="text-lg font-bold">{avgAge1}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground mb-1">Current Avg Age</p>
                <p className="text-lg font-bold">{avgAge2}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Retention Rate</p>
                <p className="text-lg font-bold">{Math.round((retained.length / members1.length) * 100)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Turnover</p>
                <p className="text-lg font-bold text-red-600">{Math.round((removed.length / members1.length) * 100)}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Added Members */}
          {added.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Added Members ({added.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                  {added.slice(0, 10).map(m => (
                    <div key={getMemberId(m)} className="flex items-center justify-between p-1.5 bg-blue-50 rounded">
                      <span className="font-medium">{m.first_name} {m.last_name}</span>
                      <Badge className="text-[10px] bg-blue-100 text-blue-800">New</Badge>
                    </div>
                  ))}
                  {added.length > 10 && <p className="text-muted-foreground text-center py-2">+{added.length - 10} more</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Removed Members */}
          {removed.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserX className="w-4 h-4 text-red-600" />
                  Removed Members ({removed.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                  {removed.slice(0, 10).map(m => (
                    <div key={getMemberId(m)} className="flex items-center justify-between p-1.5 bg-red-50 rounded">
                      <span className="font-medium">{m.first_name} {m.last_name}</span>
                      <Badge className="text-[10px] bg-red-100 text-red-800">Removed</Badge>
                    </div>
                  ))}
                  {removed.length > 10 && <p className="text-muted-foreground text-center py-2">+{removed.length - 10} more</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {added.length === 0 && removed.length === 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-green-700 font-medium">No changes detected</p>
                <p className="text-xs text-green-600">Census membership remained stable</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}