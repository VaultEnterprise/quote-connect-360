/**
 * Gate 6B (GATE-6B-20260505) — TXQuote Transmit Modal
 * Scope: /mga/command — Quotes tab only.
 * Enforces: readiness pre-check, idempotency key generation, scope-gated transmit,
 *            fail-closed error states, RBAC visibility enforced by parent panel.
 */
import React, { useState, useEffect } from 'react';
import { validateTXQuoteReadiness, transmitTXQuote } from '@/lib/mga/services/txquoteService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

function generateIdempotencyKey(quoteId, actorEmail) {
  return `txq-transmit-${quoteId}-${actorEmail}-${Date.now()}`;
}

export default function MGATXQuoteTransmitModal({ open, onClose, quote, scopeRequest, actorEmail }) {
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState(null);
  const [transmitting, setTransmitting] = useState(false);
  const [transmitResult, setTransmitResult] = useState(null); // 'success' | 'duplicate' | 'error'
  const [transmitError, setTransmitError] = useState(null);

  useEffect(() => {
    if (!open || !quote) return;
    setReadinessLoading(true);
    setReadinessError(null);
    setTransmitResult(null);
    setTransmitError(null);
    validateTXQuoteReadiness({ ...scopeRequest, target_entity_id: quote.id })
      .then(result => {
        if (!result?.success && result?.reason_code) {
          setReadinessError(result.reason_code);
        }
      })
      .catch(() => setReadinessError('READINESS_CHECK_FAILED'))
      .finally(() => setReadinessLoading(false));
  }, [open, quote?.id]);

  async function handleTransmit() {
    setTransmitting(true);
    setTransmitError(null);
    const idempotencyKey = generateIdempotencyKey(quote.id, actorEmail);
    const result = await transmitTXQuote({
      ...scopeRequest,
      target_entity_id: quote.id,
      idempotency_key: idempotencyKey,
      payload: { quote_scenario_id: quote.id, quote_name: quote.name },
    });
    setTransmitting(false);
    if (!result?.success && result?.reason_code) {
      setTransmitError(result.reason_code);
    } else if (result?.idempotency_result === 'already_processed') {
      setTransmitResult('duplicate');
    } else {
      setTransmitResult('success');
    }
  }

  const canConfirm = !readinessLoading && !readinessError && !transmitResult;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4" /> Transmit Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Quote: <span className="font-medium text-foreground">{quote?.name}</span>
          </div>

          {/* Readiness check */}
          {readinessLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking readiness…
            </div>
          )}
          {readinessError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Readiness check failed: <code className="font-mono text-xs">{readinessError}</code>. Transmit is blocked.</span>
            </div>
          )}
          {!readinessLoading && !readinessError && !transmitResult && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Readiness check passed. Ready to transmit.
            </div>
          )}

          {/* Transmit result */}
          {transmitResult === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Transmission submitted successfully.
            </div>
          )}
          {transmitResult === 'duplicate' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Already transmitted — duplicate detected, no second send.
            </div>
          )}
          {transmitError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Transmit failed: <code className="font-mono text-xs">{transmitError}</code></span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={transmitting}>
            {transmitResult ? 'Close' : 'Cancel'}
          </Button>
          {canConfirm && (
            <Button onClick={handleTransmit} disabled={transmitting} className="gap-1.5">
              {transmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {transmitting ? 'Transmitting…' : 'Confirm Transmit'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}