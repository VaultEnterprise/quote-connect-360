import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Calendar } from "lucide-react";
import { differenceInDays, parseISO, addDays, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function RateLockManager({ scenario, trigger }) {
  const [showDialog, setShowDialog] = useState(false);
  const [lockDays, setLockDays] = useState("30");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const lockExpiresAt = scenario.rate_lock_expires_at ? parseISO(scenario.rate_lock_expires_at) : null;
  const daysLeft = lockExpiresAt ? Math.max(0, differenceInDays(lockExpiresAt, now)) : 0;
  const isLocked = lockExpiresAt && differenceInDays(lockExpiresAt, now) > 0;

  const lockRates = useMutation({
    mutationFn: async () => {
      const expiresAt = addDays(now, parseInt(lockDays));
      await base44.entities.QuoteScenario.update(scenario.id, {
        rate_lock_expires_at: expiresAt.toISOString(),
        rate_locked_by: (await base44.auth.me()).email,
        rate_locked_at: now.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Rates locked", description: `Rates locked for ${lockDays} days` });
      setShowDialog(false);
    },
  });

  const unlockRates = useMutation({
    mutationFn: async () => {
      await base44.entities.QuoteScenario.update(scenario.id, {
        rate_lock_expires_at: null,
        rate_locked_by: null,
        rate_locked_at: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Rates unlocked" });
    },
  });

  return (
    <>
      {trigger ? (
        React.cloneElement(trigger, {
          onClick: () => setShowDialog(true),
          children: isLocked ? (
            <>
              <Lock className="w-3.5 h-3.5 mr-2" /> Locked ({daysLeft}d)
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 mr-2" /> Lock Rates
            </>
          ),
        })
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => setShowDialog(true)}
        >
          {isLocked ? (
            <>
              <Lock className="w-3.5 h-3.5 mr-1" /> Locked ({daysLeft}d)
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 mr-1" /> Lock Rates
            </>
          )}
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Lock Management</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLocked ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-semibold text-green-700">Rates are locked</p>
                <p className="text-xs text-green-600 mt-1">
                  Rates locked for {daysLeft} more days (until {lockExpiresAt ? format(lockExpiresAt, "MMM d, yyyy") : "—"})
                </p>
                {scenario.rate_locked_by && (
                  <p className="text-xs text-green-600">
                    Locked by {scenario.rate_locked_by}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm font-semibold text-amber-700">Rates are not locked</p>
                <p className="text-xs text-amber-600 mt-1">
                  Lock rates to prevent accidental updates
                </p>
              </div>
            )}

            {!isLocked && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Lock duration
                  </label>
                  <Select value={lockDays} onValueChange={setLockDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires on {format(addDays(now, parseInt(lockDays)), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            {isLocked ? (
              <Button
                variant="destructive"
                onClick={() => unlockRates.mutate()}
                disabled={unlockRates.isPending}
              >
                <Unlock className="w-3.5 h-3.5 mr-2" /> Unlock Rates
              </Button>
            ) : (
              <Button
                onClick={() => lockRates.mutate()}
                disabled={lockRates.isPending}
              >
                <Lock className="w-3.5 h-3.5 mr-2" /> Lock Rates
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}