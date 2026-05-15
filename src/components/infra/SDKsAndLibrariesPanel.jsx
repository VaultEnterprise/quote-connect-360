import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink, Package, CheckCircle2, Star, GitBranch } from "lucide-react";

const SDKS = [
  {
    lang: "Node.js / TypeScript",
    emoji: "🟩",
    package: "npm install @connectquote360/sdk",
    version: "2.4.1",
    stars: 284,
    downloads: "18k/mo",
    status: "stable",
    features: ["Full TypeScript types", "Promise & callback support", "Auto-retry with backoff", "Webhook verification helper", "Paginator utility"],
    example: `import { CQ360Client } from '@connectquote360/sdk';

const client = new CQ360Client({ apiKey: process.env.CQ360_API_KEY });

// List active cases
const { data: cases } = await client.cases.list({ stage: 'enrollment_open' });

// Stream census upload
await client.census.upload(caseId, fs.createReadStream('./census.csv'));

// Verify webhook
const event = client.webhooks.verify(req.body, req.headers['x-cq360-signature']);`,
  },
  {
    lang: "Python",
    emoji: "🐍",
    package: "pip install connectquote360",
    version: "1.9.0",
    stars: 156,
    downloads: "9k/mo",
    status: "stable",
    features: ["Type annotations (PEP 484)", "Async/await support", "Pandas DataFrame integration", "Pydantic models", "CLI tool included"],
    example: `from connectquote360 import CQ360Client
import os

client = CQ360Client(api_key=os.environ["CQ360_API_KEY"])

# Run a quote scenario
scenario = client.quotes.run(
    case_id="case_abc123",
    carriers=["Aetna", "BCBS", "United"],
    effective_date="2026-07-01"
)
print(scenario.status)  # "running"

# Async usage
async with CQ360Client(api_key=...) as client:
    cases = await client.cases.list_async()`,
  },
  {
    lang: "Java / Kotlin",
    emoji: "☕",
    package: "implementation 'com.connectquote360:sdk:1.2.0'",
    version: "1.2.0",
    stars: 72,
    downloads: "3k/mo",
    status: "beta",
    features: ["Spring Boot autoconfiguration", "Reactive (WebFlux) support", "Jackson JSON mapping", "Kotlin coroutine extensions", "Maven + Gradle artifacts"],
    example: `CQ360Client client = CQ360Client.builder()
    .apiKey(System.getenv("CQ360_API_KEY"))
    .timeout(Duration.ofSeconds(30))
    .build();

CaseListResponse cases = client.cases()
    .list(ListCasesRequest.builder()
        .stage("enrollment_open")
        .limit(50)
        .build());`,
  },
  {
    lang: "Go",
    emoji: "🔵",
    package: "go get github.com/connectquote360/go-sdk",
    version: "0.8.2",
    stars: 44,
    downloads: "1.2k/mo",
    status: "beta",
    features: ["Context-aware requests", "Idiomatic Go error handling", "Built-in rate limiter", "Webhook HMAC verifier", "net/http compatible"],
    example: `client := cq360.NewClient(os.Getenv("CQ360_API_KEY"))

ctx := context.Background()
cases, err := client.Cases.List(ctx, &cq360.ListCasesParams{
    Stage: cq360.StageEnrollmentOpen,
    Limit: 50,
})
if err != nil {
    log.Fatal(err)
}`,
  },
];

const POSTMAN_COLLECTION = {
  name: "ConnectQuote360 API",
  version: "v2.4",
  requests: 48,
  environments: ["Production", "Sandbox"],
  url: "https://api.connectquote360.com/postman/collection.json",
};

const OPENAPI_SPECS = [
  { name: "OpenAPI 3.1 (YAML)", url: "/api/openapi.yaml", size: "142 KB" },
  { name: "OpenAPI 3.1 (JSON)", url: "/api/openapi.json", size: "198 KB" },
  { name: "AsyncAPI 2.6 (Webhooks)", url: "/api/asyncapi.yaml", size: "54 KB" },
  { name: "Postman Collection v2.1", url: POSTMAN_COLLECTION.url, size: "318 KB" },
];

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="relative mt-2">
      <pre className="text-[10px] bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre leading-relaxed">{code}</pre>
      <button onClick={copy} className="absolute top-2 right-2 text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded">
        <Copy className="w-2.5 h-2.5" />{copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function SDKsAndLibrariesPanel() {
  const [expanded, setExpanded] = useState("Node.js / TypeScript");

  return (
    <div className="space-y-5">
      {/* SDKs */}
      <div>
        <p className="text-sm font-semibold mb-1">Official Client Libraries</p>
        <p className="text-xs text-muted-foreground mb-3">First-party SDKs maintained by the ConnectQuote360 engineering team</p>
        <div className="space-y-3">
          {SDKS.map(sdk => (
            <Card key={sdk.lang} className={expanded === sdk.lang ? "border-primary/40" : ""}>
              <button className="w-full text-left" onClick={() => setExpanded(expanded === sdk.lang ? null : sdk.lang)}>
                <CardHeader className="pb-2 flex-row items-center gap-3">
                  <span className="text-xl">{sdk.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{sdk.lang}</p>
                      <Badge className={sdk.status === "stable"
                        ? "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0"
                        : "bg-amber-100 text-amber-700 border-amber-200 border text-[9px] py-0"}>
                        v{sdk.version} · {sdk.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" />{sdk.stars}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Download className="w-2.5 h-2.5" />{sdk.downloads}
                      </span>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground">{sdk.package}</code>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(sdk.package); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={e => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
              </button>
              {expanded === sdk.lang && (
                <CardContent className="pt-0 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {sdk.features.map(f => (
                      <div key={f} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />{f}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Quick Example</p>
                    <CodeBlock code={sdk.example} />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* OpenAPI / Specs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> API Specifications & Collections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {OPENAPI_SPECS.map(s => (
            <div key={s.name} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{s.name}</span>
                <span className="text-[10px] text-muted-foreground">{s.size}</span>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Download className="w-3 h-3" /> Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Postman */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
          <span className="text-2xl">📮</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{POSTMAN_COLLECTION.name} — Postman Collection</p>
            <p className="text-xs text-muted-foreground">{POSTMAN_COLLECTION.requests} requests · {POSTMAN_COLLECTION.environments.join(", ")} environments · v{POSTMAN_COLLECTION.version}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Download className="w-3 h-3" /> JSON
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white">
              <ExternalLink className="w-3 h-3" /> Run in Postman
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sandbox */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">🧪</div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Sandbox Environment</p>
            <p className="text-xs text-muted-foreground">Full API parity · Pre-seeded data · No rate limits · Resets daily at 00:00 UTC</p>
            <code className="text-[10px] font-mono text-primary">https://sandbox.connectquote360.com/api</code>
          </div>
          <Button size="sm" className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Open Sandbox Docs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}