import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TxQuoteModal({ open, onClose, caseData, censusVersions = [], canTransmit, disabledReason }) {
  const queryClient = useQueryClient();
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [cc, setCc] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [turnaroundDateRequested, setTurnaroundDateRequested] = useState("");
  const [productType, setProductType] = useState(caseData?.products_requested?.join(", ") || "");
  const [contactOverride, setContactOverride] = useState("");

  const { data: routes = [] } = useQuery({
    queryKey: ["quote-provider-routes"],
    queryFn: () => base44.entities.QuoteProviderRoute.list("provider_code", 50),
    enabled: open,
  });

  const latestValidated = useMemo(() => censusVersions.find((item) => item.status === "validated" && item.file_url), [censusVersions]);

  const sendMutation = useMutation({
    mutationFn: () => base44.functions.invoke("sendTxQuote", {
      caseId: caseData.id,
      providerCodes: selectedProviders,
      cc,
      internalNote,
      turnaroundDateRequested,
      productType,
      contactOverride,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["activity", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["census-versions", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["quote-transmissions", caseData.id] });
      onClose();
    },
  });

  const toggleProvider = (providerCode) => {
    setSelectedProviders((current) => current.includes(providerCode)
      ? current.filter((item) => item !== providerCode)
      : [...current, providerCode]);
  };

  const carrierOrder = ["AST", "SUS", "BENEFITTER", "MEC_MVP", "TRIAD"];
  const sortedRoutes = [
    ...routes.filter((route) => carrierOrder.includes(route.provider_code)).sort((a, b) => carrierOrder.indexOf(a.provider_code) - carrierOrder.indexOf(b.provider_code)),
    ...routes.filter((route) => !carrierOrder.includes(route.provider_code)),
  ];
  const selectedRouteRows = routes.filter((route) => selectedProviders.includes(route.provider_code));
  const subjectPreview = `Quote Request - ${caseData?.employer_name || "Employer"} - ${caseData?.case_number || caseData?.id || "Case"} - ${caseData?.effective_date || "TBD"}`;
  const bodyPreview = `Please provide a quote for the attached validated census file for ${caseData?.employer_name || "this employer"}.`;
  const allRoutesConfigured = routes.some((route) => route.active && route.destination_email);
  const isSendDisabled = !canTransmit || !latestValidated || !selectedProviders.length || !selectedRouteRows.every((route) => route.active && route.destination_email);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transmit Quote Request</DialogTitle>
          <DialogDescription>{disabledReason || "This step comes immediately after census validation and sends the validated census file to selected quote providers."}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Case</span><div className="font-medium">{caseData?.case_number || caseData?.id}</div></div>
              <div><span className="text-muted-foreground">Employer</span><div className="font-medium">{caseData?.employer_name || "—"}</div></div>
              <div><span className="text-muted-foreground">Census File</span><div className="font-medium">{latestValidated?.file_name || "—"}</div></div>
              <div><span className="text-muted-foreground">Census Version</span><div className="font-medium">{latestValidated?.version_number || "—"}</div></div>
              <div><span className="text-muted-foreground">Validation Status</span><div className="font-medium">{latestValidated ? "Validated" : "Not available"}</div></div>
              <div><span className="text-muted-foreground">Effective Date</span><div className="font-medium">{caseData?.effective_date || "—"}</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Carrier Selection</p>
                {!allRoutesConfigured && <Badge variant="destructive">No active routes configured</Badge>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {sortedRoutes.map((route) => (
                  <label key={route.provider_code} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
                    <Checkbox checked={selectedProviders.includes(route.provider_code)} onCheckedChange={() => toggleProvider(route.provider_code)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{route.provider_name}</span>
                        <Badge variant={route.active ? "secondary" : "destructive"}>{route.active ? "Configured" : "Inactive"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{route.destination_email || "No destination email"}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-medium">Email Preview</p>
              <div><span className="text-muted-foreground">Subject</span><div className="font-medium">{subjectPreview}</div></div>
              <div><span className="text-muted-foreground">Body</span><div className="text-sm">{bodyPreview}</div></div>
              <div><span className="text-muted-foreground">Attachment</span><div className="font-medium">{latestValidated?.file_name || "Validated census file"}</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 grid gap-3 md:grid-cols-2">
              <div>
                <Label>CC</Label>
                <Input value={cc} onChange={(e) => setCc(e.target.value)} />
              </div>
              <div>
                <Label>Turnaround Date Requested</Label>
                <Input type="date" value={turnaroundDateRequested} onChange={(e) => setTurnaroundDateRequested(e.target.value)} />
              </div>
              <div>
                <Label>Product / Coverage Type</Label>
                <Input value={productType} onChange={(e) => setProductType(e.target.value)} />
              </div>
              <div>
                <Label>Contact Override</Label>
                <Input value={contactOverride} onChange={(e) => setContactOverride(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Internal Note</Label>
                <Input value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline">Validate Recipients</Button>
          <Button variant="outline">Preview Email</Button>
          <Button onClick={() => sendMutation.mutate()} disabled={isSendDisabled || sendMutation.isPending}>
            {sendMutation.isPending ? "Sending..." : "Send Quote Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}