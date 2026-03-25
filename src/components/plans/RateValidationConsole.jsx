import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Play, Search } from "lucide-react";
import { toast } from "sonner";

export default function RateValidationConsole({ schedules }) {
  const [scheduleId, setScheduleId] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [testZip, setTestZip] = useState("");
  const [testDob, setTestDob] = useState("");
  const [testTier, setTestTier] = useState("");
  const [zipResult, setZipResult] = useState(null);
  const [ageResult, setAgeResult] = useState(null);
  const [tierResult, setTierResult] = useState(null);

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "validateRateSchedule", rateScheduleId: scheduleId });
      return res.data;
    },
    onSuccess: (data) => { setValidationResult(data); if (data.status === "valid") toast.success("Schedule is valid!"); else toast.error(`${data.error_count} validation error(s) found`); },
  });

  const testZipMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "zipToArea", zip: testZip });
      return res.data;
    },
    onSuccess: setZipResult,
  });

  const testAgeMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "dobToAgeBand", dob: testDob, effectiveDate: new Date().toISOString().slice(0, 10) });
      return res.data;
    },
    onSuccess: setAgeResult,
  });

  const testTierMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "tierNormalize", tier: testTier });
      return res.data;
    },
    onSuccess: setTierResult,
  });

  return (
    <div className="space-y-4">
      {/* Schedule Validation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />Rate Schedule Validator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Select value={scheduleId} onValueChange={setScheduleId}>
              <SelectTrigger className="w-72 h-8 text-xs"><SelectValue placeholder="Select schedule to validate..." /></SelectTrigger>
              <SelectContent>{schedules.filter(s => s.is_active).map(s => <SelectItem key={s.id} value={s.id}>{s.schedule_name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={() => validateMutation.mutate()} disabled={!scheduleId || validateMutation.isPending} className="h-8 gap-1.5">
              <Play className="w-3.5 h-3.5" />{validateMutation.isPending ? "Validating..." : "Run Validation"}
            </Button>
          </div>

          {validationResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                {validationResult.status === "valid"
                  ? <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5" /><span className="font-semibold">Valid — {validationResult.row_count} rate rows pass all checks</span></div>
                  : <div className="flex items-center gap-2 text-red-700"><XCircle className="w-5 h-5" /><span className="font-semibold">{validationResult.error_count} error(s) found in {validationResult.row_count} rows</span></div>
                }
              </div>
              {validationResult.errors?.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-red-50 rounded-lg border border-red-200">
                  {validationResult.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{e}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            <p className="font-medium mb-1">Validation checks:</p>
            <ul className="space-y-0.5">
              {["Missing or zero monthly rate","Missing rating area code","Missing age band code","Invalid tier code (must be EE/ES/EC/FAM)","Duplicate rate key: area + band + tier + tobacco"].map(c => (
                <li key={c} className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-primary" />{c}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Unit Testers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ZIP tester */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Search className="w-3.5 h-3.5 text-primary" />ZIP → Area Resolver</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input value={testZip} onChange={e => setTestZip(e.target.value)} placeholder="e.g. 90210" className="h-8 text-xs" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => testZipMutation.mutate()} disabled={!testZip}>Resolve</Button>
            {zipResult && (
              <div className={`p-2 rounded text-xs ${zipResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                {zipResult.error ? zipResult.error : (
                  <>
                    <p><span className="font-medium">Area:</span> {zipResult.rating_area_code}</p>
                    <p><span className="font-medium">State:</span> {zipResult.state_code}</p>
                    {zipResult.county && <p><span className="font-medium">County:</span> {zipResult.county}</p>}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Age band tester */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Search className="w-3.5 h-3.5 text-primary" />DOB → Age Band</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input type="date" value={testDob} onChange={e => setTestDob(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => testAgeMutation.mutate()} disabled={!testDob}>Resolve</Button>
            {ageResult && (
              <div className="p-2 rounded text-xs bg-blue-50 text-blue-700">
                <p><span className="font-medium">Age:</span> {ageResult.age}</p>
                <p><span className="font-medium">Band:</span> {ageResult.band_code}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier normalizer */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Search className="w-3.5 h-3.5 text-primary" />Tier Normalizer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input value={testTier} onChange={e => setTestTier(e.target.value)} placeholder="e.g. EE+Sp, Single, Family" className="h-8 text-xs" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => testTierMutation.mutate()} disabled={!testTier}>Normalize</Button>
            {tierResult && (
              <div className={`p-2 rounded text-xs ${tierResult.normalized ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                <p><span className="font-medium">Input:</span> {tierResult.input}</p>
                <p><span className="font-medium">Normalized:</span> {tierResult.normalized || "❌ Unknown"}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium">Known inputs:</p>
              {["Single / EE / Employee","EE+Sp / EE+Spouse","EE+Ch / EE+Ch(ren) / EE+Children","Family / FAM"].map(t => <p key={t}>· {t}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}