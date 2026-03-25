import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Play, Search, DollarSign } from "lucide-react";
import { toast } from "sonner";

const TIERS = ["EE","ES","EC","FAM"];
const AGE_BANDS = ["Under25","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60-64","65+"];

export default function RateValidationConsole({ schedules }) {
  const [scheduleId, setScheduleId] = useState("");
  const [validationResult, setValidationResult] = useState(null);

  // ZIP tester
  const [testZip, setTestZip] = useState("");
  const [zipResult, setZipResult] = useState(null);

  // DOB tester
  const [testDob, setTestDob] = useState("");
  const [testEffDate, setTestEffDate] = useState(new Date().toISOString().slice(0, 10));
  const [ageResult, setAgeResult] = useState(null);

  // Tier tester
  const [testTier, setTestTier] = useState("");
  const [tierResult, setTierResult] = useState(null);

  // Rate resolve spot tester
  const [resolveScheduleId, setResolveScheduleId] = useState("");
  const [resolveArea, setResolveArea] = useState("");
  const [resolveBand, setResolveBand] = useState("");
  const [resolveTier, setResolveTier] = useState("EE");
  const [resolveTobacco, setResolveTobacco] = useState(false);
  const [resolveResult, setResolveResult] = useState(null);

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "validateRateSchedule", rateScheduleId: scheduleId });
      return res.data;
    },
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.status === "valid") toast.success("Schedule is valid!");
      else toast.error(`${data.error_count} validation error(s) found`);
    },
  });

  const testZipMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "zipToArea", zip: testZip });
      return res.data;
    },
    onSuccess: setZipResult,
    onError: (e) => setZipResult({ error: e.message }),
  });

  const testAgeMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "dobToAgeBand", dob: testDob, effectiveDate: testEffDate });
      return res.data;
    },
    onSuccess: setAgeResult,
    onError: (e) => setAgeResult({ error: e.message }),
  });

  const testTierMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("planRatingEngine", { action: "tierNormalize", tier: testTier });
      return res.data;
    },
    onSuccess: setTierResult,
    onError: (e) => setTierResult({ error: e.message }),
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      const schedule = schedules.find(s => s.id === resolveScheduleId);
      const res = await base44.functions.invoke("planRatingEngine", {
        action: "rateResolve",
        planId: schedule?.plan_id,
        rateScheduleId: resolveScheduleId || undefined,
        ratingAreaCode: resolveArea,
        ageBandCode: resolveBand,
        tierCode: resolveTier,
        tobaccoFlag: resolveTobacco,
      });
      return res.data;
    },
    onSuccess: setResolveResult,
    onError: (e) => setResolveResult({ error: e.message }),
  });

  const activeSchedules = schedules.filter(s => s.is_active);

  return (
    <div className="space-y-4">
      {/* ── Schedule Validator ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />Rate Schedule Validator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Select value={scheduleId} onValueChange={setScheduleId}>
              <SelectTrigger className="w-72 h-8 text-xs"><SelectValue placeholder="Select schedule to validate..." /></SelectTrigger>
              <SelectContent>{activeSchedules.map(s => <SelectItem key={s.id} value={s.id}>{s.schedule_name} (v{s.version_number})</SelectItem>)}</SelectContent>
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
                  : <div className="flex items-center gap-2 text-red-700"><XCircle className="w-5 h-5" /><span className="font-semibold">{validationResult.error_count} error(s) in {validationResult.row_count} rows</span></div>
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
            <p className="font-medium mb-1">Validation checks run:</p>
            <ul className="space-y-0.5">
              {[
                "Monthly rate present and > 0",
                "Rating area code present",
                "Age band code present",
                "Tier code normalized to EE / ES / EC / FAM",
                "No duplicate key: area + band + tier + tobacco + effective_date",
                "Every area+band combination has all 4 tier codes (EE, ES, EC, FAM)",
              ].map(c => <li key={c} className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-primary" />{c}</li>)}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ── Unit Testers row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ZIP tester */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Search className="w-3.5 h-3.5 text-primary" />ZIP → Area Resolver</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input value={testZip} onChange={e => setTestZip(e.target.value)} placeholder="e.g. 90210" className="h-8 text-xs" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => { setZipResult(null); testZipMutation.mutate(); }} disabled={!testZip || testZipMutation.isPending}>
              {testZipMutation.isPending ? "Resolving..." : "Resolve ZIP"}
            </Button>
            {zipResult && (
              <div className={`p-2 rounded text-xs ${zipResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                {zipResult.error ? zipResult.error : (
                  <>
                    <p><span className="font-medium">Area:</span> {zipResult.rating_area_code}</p>
                    <p><span className="font-medium">State:</span> {zipResult.state_code}</p>
                    {zipResult.county && <p><span className="font-medium">County:</span> {zipResult.county}</p>}
                    <p><span className="font-medium">ZIP:</span> {zipResult.zip_code}</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DOB → Age Band tester */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Search className="w-3.5 h-3.5 text-primary" />DOB → Age Band</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Date of Birth</label>
              <Input type="date" value={testDob} onChange={e => setTestDob(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Effective Date</label>
              <Input type="date" value={testEffDate} onChange={e => setTestEffDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => { setAgeResult(null); testAgeMutation.mutate(); }} disabled={!testDob || testAgeMutation.isPending}>
              {testAgeMutation.isPending ? "Resolving..." : "Resolve Age Band"}
            </Button>
            {ageResult && (
              <div className={`p-2 rounded text-xs ${ageResult.error ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                {ageResult.error ? ageResult.error : (
                  <>
                    <p><span className="font-medium">Age:</span> {ageResult.age}</p>
                    <p><span className="font-medium">Band:</span> {ageResult.band_code}</p>
                    {ageResult.band_label && <p><span className="font-medium">Label:</span> {ageResult.band_label}</p>}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier Normalizer */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Search className="w-3.5 h-3.5 text-primary" />Tier Normalizer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input value={testTier} onChange={e => setTestTier(e.target.value)} placeholder="e.g. EE+Sp, Single, Family" className="h-8 text-xs" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => { setTierResult(null); testTierMutation.mutate(); }} disabled={!testTier || testTierMutation.isPending}>
              {testTierMutation.isPending ? "Normalizing..." : "Normalize"}
            </Button>
            {tierResult && (
              <div className={`p-2 rounded text-xs ${tierResult.normalized ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                <p><span className="font-medium">Input:</span> {tierResult.input}</p>
                <p><span className="font-medium">Normalized:</span> {tierResult.normalized || "❌ Unknown"}</p>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              {["Single / EE / Employee → EE","EE+Sp / EE+Spouse → ES","EE+Ch(ren) / EE+Children → EC","Family / FAM → FAM"].map(t => <p key={t}>· {t}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Rate Resolve Spot Tester ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />Rate Resolve — Point Lookup
          </CardTitle>
          <p className="text-xs text-muted-foreground">Look up the exact monthly rate for a given area + age band + tier combination from a specific schedule.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Rate Schedule</label>
              <Select value={resolveScheduleId} onValueChange={setResolveScheduleId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select schedule..." /></SelectTrigger>
                <SelectContent>{activeSchedules.map(s => <SelectItem key={s.id} value={s.id}>{s.schedule_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Rating Area Code</label>
              <Input value={resolveArea} onChange={e => setResolveArea(e.target.value)} placeholder="e.g. CA001" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Age Band</label>
              <Select value={resolveBand} onValueChange={setResolveBand}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select band..." /></SelectTrigger>
                <SelectContent>{AGE_BANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Tier</label>
              <Select value={resolveTier} onValueChange={setResolveTier}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="res-tob" checked={resolveTobacco} onChange={e => setResolveTobacco(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="res-tob" className="text-xs font-medium">Tobacco User</label>
            </div>
            <div className="flex items-end">
              <Button size="sm" className="h-8 gap-1.5 w-full" onClick={() => { setResolveResult(null); resolveMutation.mutate(); }}
                disabled={!resolveScheduleId || !resolveArea || !resolveBand || resolveMutation.isPending}>
                <Play className="w-3.5 h-3.5" />{resolveMutation.isPending ? "Looking up..." : "Resolve Rate"}
              </Button>
            </div>
          </div>

          {resolveResult && (
            <div className={`p-3 rounded-lg border text-sm ${resolveResult.error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
              {resolveResult.error ? (
                <div className="flex items-center gap-2"><XCircle className="w-4 h-4" />{resolveResult.error}</div>
              ) : (
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-lg">${Number(resolveResult.monthly_rate).toFixed(2)}<span className="text-sm font-normal">/mo</span></p>
                    <p className="text-xs">Annual: ${(Number(resolveResult.monthly_rate) * 12).toFixed(2)} · Rate record: {resolveResult.rate_record_id?.slice(-8)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}