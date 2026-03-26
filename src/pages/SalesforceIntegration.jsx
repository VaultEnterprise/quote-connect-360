import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle, XCircle, RefreshCw, Upload, Download,
  Building2, Briefcase, FileText, Users, ArrowRight, ArrowLeft, Zap, AlertTriangle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

function ResultCard({ result }) {
  if (!result) return null;
  const hasErrors = result.errors?.length > 0;
  return (
    <div className={`mt-3 p-3 rounded-lg border text-sm space-y-2 ${hasErrors ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
      <div className="flex items-center gap-3 flex-wrap">
        {!hasErrors ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
        <span className="font-semibold">{result.created != null && `${result.created} created`}{result.updated != null && ` · ${result.updated} updated`}{result.skipped != null && ` · ${result.skipped} skipped`}</span>
        <span className="text-muted-foreground">of {result.total} records</span>
      </div>
      {hasErrors && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-700 font-mono">· {e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncCard({ title, description, icon: Icon, action, buttonLabel, badge, variant = "push" }) {
  const [result, setResult] = useState(null);
  const mutation = useMutation({
    mutationFn: () => base44.functions.invoke("salesforceSync", { action }),
    onSuccess: (res) => {
      setResult(res.data);
      if (res.data?.error) { toast.error(res.data.error); return; }
      const msg = `${res.data?.created ?? 0} created, ${res.data?.updated ?? 0} updated`;
      if (res.data?.errors?.length > 0) toast.warning(`${msg} · ${res.data.errors.length} errors`);
      else toast.success(`${title}: ${msg}`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
          {badge && <Badge variant="outline" className="text-xs ml-auto">{badge}</Badge>}
          <Badge className={`text-xs ml-auto ${variant === "push" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
            {variant === "push" ? <><Upload className="w-2.5 h-2.5 mr-1 inline" />Push to SF</> : <><Download className="w-2.5 h-2.5 mr-1 inline" />Pull from SF</>}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          onClick={() => { setResult(null); mutation.mutate(); }}
          disabled={mutation.isPending}
          className="gap-2"
          variant={variant === "push" ? "default" : "outline"}
        >
          {mutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : variant === "push" ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          {mutation.isPending ? "Syncing..." : buttonLabel}
        </Button>
        <ResultCard result={result} />
      </CardContent>
    </Card>
  );
}

export default function SalesforceIntegration() {
  const qc = useQueryClient();

  const { data: sfStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["sf-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("salesforceSync", { action: "status" });
      return res.data;
    },
    retry: false,
  });

  const { data: employers = [] } = useQuery({
    queryKey: ["employer-groups"],
    queryFn: () => base44.entities.EmployerGroup.list("-updated_date", 500),
  });
  const { data: cases = [] } = useQuery({
    queryKey: ["benefit-cases"],
    queryFn: () => base44.entities.BenefitCase.list("-updated_date", 500),
  });

  const syncedEmployers = employers.filter(e => e.sf_account_id).length;
  const syncedCases = cases.filter(c => c.sf_opportunity_id).length;

  const runFullSync = useMutation({
    mutationFn: async () => {
      const actions = ["syncEmployers", "syncContacts", "syncCases", "syncProposals"];
      const results = [];
      for (const action of actions) {
        const res = await base44.functions.invoke("salesforceSync", { action });
        results.push({ action, ...res.data });
      }
      return results;
    },
    onSuccess: (results) => {
      qc.invalidateQueries();
      const totalCreated = results.reduce((n, r) => n + (r.created || 0), 0);
      const totalUpdated = results.reduce((n, r) => n + (r.updated || 0), 0);
      const totalErrors = results.reduce((n, r) => n + (r.errors?.length || 0), 0);
      if (totalErrors > 0) toast.warning(`Full sync done — ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`);
      else toast.success(`Full sync complete — ${totalCreated} created, ${totalUpdated} updated`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg" alt="Salesforce" className="h-7" />
            Salesforce Integration
          </h1>
          <p className="text-muted-foreground text-sm">Bidirectional sync of Employers, Cases, Proposals, and Contacts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sfStatus?.connected && sfStatus?.instance_url && (
            <Button
              variant="outline"
              onClick={() => window.open(sfStatus.instance_url, "_blank", "noopener,noreferrer")}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Salesforce
            </Button>
          )}
          <Button onClick={() => runFullSync.mutate()} disabled={runFullSync.isPending} className="gap-2">
            {runFullSync.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {runFullSync.isPending ? "Syncing all..." : "Full Sync Now"}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card className={sfStatus?.connected ? "border-green-200 bg-green-50" : sfStatus?.error ? "border-red-200 bg-red-50" : ""}>
        <CardContent className="p-4">
          {statusLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />Checking connection...
            </div>
          ) : sfStatus?.error ? (
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Connection Error</p>
                <p className="text-xs">{sfStatus.error}</p>
              </div>
            </div>
          ) : sfStatus?.connected ? (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Connected to Salesforce</p>
                  <p className="text-xs">{sfStatus.instance_url} · API {sfStatus.api_version}</p>
                </div>
              </div>
              <div className="flex gap-4 ml-auto flex-wrap text-sm">
                <div className="text-center"><p className="font-bold text-lg">{sfStatus.sf_counts?.accounts?.toLocaleString()}</p><p className="text-xs text-muted-foreground">SF Accounts</p></div>
                <div className="text-center"><p className="font-bold text-lg">{sfStatus.sf_counts?.opportunities?.toLocaleString()}</p><p className="text-xs text-muted-foreground">SF Opportunities</p></div>
                <div className="text-center"><p className="font-bold text-lg">{sfStatus.sf_counts?.contacts?.toLocaleString()}</p><p className="text-xs text-muted-foreground">SF Contacts</p></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertTriangle className="w-4 h-4" />Unable to determine connection status.
              <Button size="sm" variant="ghost" onClick={() => refetchStatus()} className="ml-2">Retry</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local sync counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Employers Synced",  val: syncedEmployers,  total: employers.length,  color: "text-blue-600" },
          { label: "Cases Synced",       val: syncedCases,       total: cases.length,       color: "text-green-600" },
          { label: "Employers Total",    val: employers.length,  total: null, color: "text-slate-600" },
          { label: "Cases Total",        val: cases.length,      total: null, color: "text-slate-600" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${k.color}`}>{k.val}</p>
              {k.total != null && <p className="text-[10px] text-muted-foreground">of {k.total}</p>}
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Actions */}
      <Tabs defaultValue="push">
        <TabsList>
          <TabsTrigger value="push" className="gap-1.5"><Upload className="w-3.5 h-3.5" />Push to Salesforce</TabsTrigger>
          <TabsTrigger value="pull" className="gap-1.5"><Download className="w-3.5 h-3.5" />Pull from Salesforce</TabsTrigger>
        </TabsList>

        <TabsContent value="push" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SyncCard
            title="Employers → Accounts"
            description="Syncs all EmployerGroup records to Salesforce Accounts. Creates new or updates existing via sf_account_id."
            icon={Building2}
            action="syncEmployers"
            buttonLabel="Sync Employers"
            badge={`${employers.length} employers`}
            variant="push"
          />
          <SyncCard
            title="Cases → Opportunities"
            description="Syncs BenefitCases to Salesforce Opportunities. Maps pipeline stages automatically."
            icon={Briefcase}
            action="syncCases"
            buttonLabel="Sync Cases"
            badge={`${cases.length} cases`}
            variant="push"
          />
          <SyncCard
            title="Proposals → Quotes"
            description="Syncs Proposals to Salesforce Quotes linked to their parent Opportunity."
            icon={FileText}
            action="syncProposals"
            buttonLabel="Sync Proposals"
            variant="push"
          />
          <SyncCard
            title="Employer Contacts → SF Contacts"
            description="Syncs primary contact info from each EmployerGroup to Salesforce Contact records."
            icon={Users}
            action="syncContacts"
            buttonLabel="Sync Contacts"
            badge={`${employers.filter(e => e.primary_contact_email).length} with contact`}
            variant="push"
          />
        </TabsContent>

        <TabsContent value="pull" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SyncCard
            title="SF Accounts → Employers"
            description="Imports Salesforce Account records into EmployerGroup. Skips records already linked. Assigns to your default agency."
            icon={Building2}
            action="pullAccounts"
            buttonLabel="Import SF Accounts"
            variant="pull"
          />
        </TabsContent>
      </Tabs>

      {/* Field mapping reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Field Mapping Reference</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2">QC360 Object</th>
                <th className="text-left px-3 py-2">SF Object</th>
                <th className="text-left px-3 py-2">Key Fields Synced</th>
                <th className="text-left px-3 py-2">Link Field</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { src: "EmployerGroup", sf: "Account",     fields: "Name, Address, Phone, Website, NumberOfEmployees", link: "sf_account_id" },
                { src: "BenefitCase",   sf: "Opportunity", fields: "Name, StageName, CloseDate, Type, Description",    link: "sf_opportunity_id" },
                { src: "Proposal",      sf: "Quote",       fields: "Name, Status, ExpirationDate, Description",         link: "sf_quote_id" },
                { src: "EmployerGroup (contact)", sf: "Contact", fields: "FirstName, LastName, Email, Phone, AccountId", link: "sf_contact_id" },
              ].map(r => (
                <tr key={r.src} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{r.src}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{r.sf}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{r.fields}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-blue-600">{r.link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}