import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Play, Zap, Database, GitMerge, ChevronDown, ChevronRight } from "lucide-react";

const EXAMPLE_QUERIES = [
  {
    label: "Cases with enrollment status",
    query: `query EnrollmentDashboard($agencyId: ID!) {
  cases(agencyId: $agencyId, stage: ENROLLMENT_OPEN) {
    id
    caseNumber
    employerName
    enrollmentWindow {
      enrolledCount
      totalEligible
      participationRate
      endDate
    }
    members(status: PENDING) {
      id
      firstName
      lastName
      email
    }
  }
}`,
    vars: `{ "agencyId": "agency_abc123" }`,
  },
  {
    label: "Quote scenario comparison",
    query: `query CompareScenarios($caseId: ID!) {
  quoteScenarios(caseId: $caseId) {
    id
    name
    status
    totalMonthlyPremium
    employerMonthlyCost
    employeeAvgCost
    plans {
      planName
      carrier
      networkType
      deductibleIndividual
      eeRate
      familyRate
    }
  }
}`,
    vars: `{ "caseId": "case_xyz789" }`,
  },
  {
    label: "Proposal approval mutation",
    query: `mutation ApproveProposal($proposalId: ID!, $comment: String) {
  updateProposalStatus(
    id: $proposalId
    status: APPROVED
    comment: $comment
  ) {
    id
    status
    approvedAt
    employerName
    totalMonthlyPremium
  }
}`,
    vars: `{ "proposalId": "prop_111", "comment": "Approved after review." }`,
  },
  {
    label: "Real-time enrollment subscription",
    query: `subscription EnrollmentUpdates($windowId: ID!) {
  enrollmentUpdated(windowId: $windowId) {
    memberId
    memberName
    event
    coverageTier
    planName
    timestamp
  }
}`,
    vars: `{ "windowId": "window_001" }`,
  },
];

const SCHEMA_TYPES = [
  { name: "BenefitCase", fields: ["id", "caseNumber", "employerName", "stage", "enrollmentWindow", "quoteScenarios", "proposals", "members"] },
  { name: "EnrollmentWindow", fields: ["id", "status", "startDate", "endDate", "enrolledCount", "totalEligible", "participationRate", "members"] },
  { name: "QuoteScenario", fields: ["id", "name", "status", "plans", "totalMonthlyPremium", "employerMonthlyCost", "employeeAvgCost"] },
  { name: "BenefitPlan", fields: ["id", "planName", "carrier", "networkType", "deductibleIndividual", "deductibleFamily", "eeRate", "familyRate", "hsaEligible"] },
  { name: "Proposal", fields: ["id", "title", "status", "sentAt", "viewedAt", "approvedAt", "totalMonthlyPremium", "planSummary"] },
  { name: "CensusMember", fields: ["id", "firstName", "lastName", "email", "employmentStatus", "coverageTier", "validationStatus", "gradientAiData"] },
];

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="text-[10px] bg-slate-900 text-cyan-300 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre leading-relaxed max-h-64">{code}</pre>
      <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="absolute top-2 right-2 text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded">
        <Copy className="w-2.5 h-2.5" />{copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function GraphQLPanel() {
  const [activeQuery, setActiveQuery] = useState(EXAMPLE_QUERIES[0]);
  const [expandedType, setExpandedType] = useState(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold">GraphQL API</p>
          <p className="text-xs text-muted-foreground">Flexible queries, mutations, and real-time subscriptions over WebSocket</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs">GraphQL 16.8</Badge>
          <Button size="sm" className="gap-1.5 h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white">
            <Play className="w-3 h-3" /> Open GraphiQL IDE
          </Button>
        </div>
      </div>

      {/* Endpoint info */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">HTTP Endpoint</p>
              <code className="text-xs font-mono">https://api.connectquote360.com/graphql</code>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">WebSocket (Subscriptions)</p>
              <code className="text-xs font-mono">wss://api.connectquote360.com/graphql/ws</code>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Persisted Queries</p>
              <code className="text-xs font-mono">/graphql/persisted</code>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Introspection", "Subscriptions", "Batching", "Persisted Queries", "APQ", "DataLoader", "N+1 Protection"].map(f => (
              <Badge key={f} variant="outline" className="text-[9px] py-0">{f}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Example queries */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Example Operations</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {EXAMPLE_QUERIES.map(q => (
            <button key={q.label} onClick={() => setActiveQuery(q)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${activeQuery.label === q.label ? "bg-purple-600 text-white border-purple-600" : "border-border hover:border-purple-400 text-muted-foreground hover:text-foreground"}`}>
              {q.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Query / Mutation</p>
            <CodeBlock code={activeQuery.query} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Variables</p>
            <CodeBlock code={activeQuery.vars} />
          </div>
        </div>
      </div>

      {/* Schema Explorer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" /> Schema Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {SCHEMA_TYPES.map(t => (
            <div key={t.name} className="border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedType(expandedType === t.name ? null : t.name)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 text-left">
                {expandedType === t.name ? <ChevronDown className="w-3.5 h-3.5 text-purple-600" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <code className="text-xs font-mono font-semibold text-purple-700">{t.name}</code>
                <span className="text-[10px] text-muted-foreground ml-auto">{t.fields.length} fields</span>
              </button>
              {expandedType === t.name && (
                <div className="px-4 pb-3 pt-1 bg-muted/20 flex flex-wrap gap-1.5">
                  {t.fields.map(f => (
                    <code key={f} className="text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded">{f}</code>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}