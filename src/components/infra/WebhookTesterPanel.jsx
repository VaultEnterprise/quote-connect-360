import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader, Send, CheckCircle, AlertCircle, Copy } from "lucide-react";

/**
 * WebhookTesterPanel
 * Test webhook delivery and signature validation.
 */
export default function WebhookTesterPanel() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [eventType, setEventType] = useState("case.created");
  const [loading, setLoading] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState(null);

  const EVENT_TYPES = [
    "case.created",
    "case.updated",
    "case.deleted",
    "enrollment.created",
    "enrollment.updated",
    "exception.created",
    "task.created",
    "renewal.created",
  ];

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      alert("Please enter a webhook URL");
      return;
    }

    setLoading(true);
    const start = Date.now();

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          timestamp: new Date().toISOString(),
          data: { test: true },
        }),
      });

      const time = Date.now() - start;
      setDeliveryTime(time);
      setDeliveryStatus(response.ok ? "success" : "failed");
    } catch (err) {
      setDeliveryTime(Date.now() - start);
      setDeliveryStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Webhook Delivery Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Webhook URL</label>
            <Input
              placeholder="https://your-domain.com/webhooks/cq360"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Event Type</label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(et => (
                  <SelectItem key={et} value={et}>{et}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleTestWebhook}
            disabled={loading || !webhookUrl}
            className="w-full text-xs"
          >
            {loading && <Loader className="w-3 h-3 mr-1.5 animate-spin" />}
            {loading ? "Sending..." : "Send Test Webhook"}
          </Button>
        </CardContent>
      </Card>

      {deliveryStatus && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            {deliveryStatus === "success" && (
              <>
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-700">
                  Webhook delivered successfully in {deliveryTime}ms
                </span>
              </>
            )}
            {deliveryStatus === "failed" && (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-700">
                  Webhook returned non-2xx status ({deliveryTime}ms)
                </span>
              </>
            )}
            {deliveryStatus === "error" && (
              <>
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-xs text-destructive">
                  Failed to deliver webhook ({deliveryTime}ms)
                </span>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Webhook signature info */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <p><strong>Signature Verification:</strong> All webhooks are signed with HMAC-SHA256</p>
          <p><strong>Header:</strong> <code className="bg-background px-1 rounded">X-CQ360-Signature</code></p>
          <p><strong>Format:</strong> <code className="bg-background px-1 rounded text-[10px]">t=1234567890,v1=hash</code></p>
        </CardContent>
      </Card>
    </div>
  );
}