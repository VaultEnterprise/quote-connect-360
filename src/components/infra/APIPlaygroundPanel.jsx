import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Copy, Plus, Trash2, Clock, CheckCircle2, XCircle, ChevronDown, ChevronRight, Loader2, Send } from "lucide-react";

const METHOD_COLORS = {
  GET: "bg-blue-100 text-blue-700 border-blue-200",
  POST: "bg-green-100 text-green-700 border-green-200",
  PATCH: "bg-amber-100 text-amber-700 border-amber-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
  PUT: "bg-purple-100 text-purple-700 border-purple-200",
};

const SAVED_REQUESTS = [
  { id: "r1", name: "List Active Cases", method: "GET", path: "/api/cases?stage=enrollment_open&limit=20", body: "" },
  { id: "r2", name: "Get Enrollment Window", method: "GET", path: "/api/enrollment/window_001", body: "" },
  { id: "r3", name: "Run Quote", method: "POST", path: "/api/quotes/case_abc/run", body: '{\n  "effective_date": "2026-07-01",\n  "carriers": ["Aetna", "BCBS"]\n}' },
  { id: "r4", name: "Send Proposal", method: "POST", path: "/api/proposals/case_abc/send", body: '{\n  "scenario_id": "scen_001",\n  "recipient_email": "hr@acme.com"\n}' },
  { id: "r5", name: "Update Case Stage", method: "PATCH", path: "/api/cases/case_abc", body: '{\n  "stage": "enrollment_open"\n}' },
];

const MOCK_RESPONSES = {
  "GET /api/cases": { status: 200, time: "89ms", body: '{\n  "data": [\n    {\n      "id": "case_abc123",\n      "case_number": "CQ-2026-0042",\n      "employer_name": "Acme Corporation",\n      "stage": "enrollment_open",\n      "employee_count": 84,\n      "enrollment_status": "open"\n    }\n  ],\n  "pagination": { "total": 12, "page": 1, "limit": 20 }\n}' },
  "POST /api/quotes": { status: 201, time: "234ms", body: '{\n  "scenario_id": "scen_new_001",\n  "status": "running",\n  "estimated_completion_seconds": 45,\n  "poll_url": "/api/quotes/scen_new_001/status"\n}' },
  "PATCH /api/cases": { status: 200, time: "61ms", body: '{\n  "id": "case_abc123",\n  "updated": true,\n  "stage": "enrollment_open",\n  "updated_at": "2026-03-22T14:22:00Z"\n}' },
};

export default function APIPlaygroundPanel() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/cases");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState([
    { key: "Authorization", value: "Bearer YOUR_API_KEY" },
    { key: "Content-Type", value: "application/json" },
  ]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("body");
  const [showSaved, setShowSaved] = useState(true);

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    const key = `${method} /api/${path.split("/api/")[1]?.split("?")[0] || "cases"}`;
    const mock = MOCK_RESPONSES[key] || { status: 200, time: "112ms", body: '{\n  "success": true,\n  "message": "Request processed successfully"\n}' };
    setResponse(mock);
    setLoading(false);
  };

  const loadSaved = (req) => {
    setMethod(req.method);
    setPath(req.path);
    setBody(req.body);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">API Playground</p>
        <p className="text-xs text-muted-foreground">Interactive REST client — test any endpoint against the live or sandbox API</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Saved requests sidebar */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved Requests</p>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Plus className="w-3 h-3" /></Button>
          </div>
          <div className="space-y-1">
            {SAVED_REQUESTS.map(r => (
              <button key={r.id} onClick={() => loadSaved(r)}
                className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/60 transition-colors group">
                <Badge className={`text-[8px] px-1.5 py-0 border font-mono flex-shrink-0 ${METHOD_COLORS[r.method]}`}>{r.method}</Badge>
                <span className="text-xs truncate">{r.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main request builder */}
        <div className="lg:col-span-3 space-y-3">
          {/* URL bar */}
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-24 h-9 text-xs font-mono font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(METHOD_COLORS).map(m => (
                      <SelectItem key={m} value={m}><span className="font-mono font-bold text-xs">{m}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 flex items-center border border-input rounded-md overflow-hidden">
                  <span className="text-xs text-muted-foreground pl-3 font-mono whitespace-nowrap">https://api.connectquote360.com</span>
                  <Input value={path} onChange={e => setPath(e.target.value)} className="border-0 shadow-none focus-visible:ring-0 text-xs font-mono h-9" placeholder="/api/cases" />
                </div>
                <Button onClick={sendRequest} disabled={loading} className="gap-1.5 flex-shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? "Sending..." : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs: body / headers */}
          <div className="flex gap-1 border-b border-border pb-0">
            {["body", "headers", "auth"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "headers" ? `Headers (${headers.length})` : t}
              </button>
            ))}
          </div>

          {activeTab === "body" && (
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder={'{\n  "key": "value"\n}'}
              className="w-full h-32 text-xs font-mono border border-input rounded-md bg-transparent px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          )}

          {activeTab === "headers" && (
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={h.key} onChange={e => setHeaders(prev => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} placeholder="Header name" className="h-8 text-xs font-mono" />
                  <Input value={h.value} onChange={e => setHeaders(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="Value" className="h-8 text-xs font-mono" />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setHeaders(prev => prev.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setHeaders(prev => [...prev, { key: "", value: "" }])}>
                <Plus className="w-3 h-3" /> Add Header
              </Button>
            </div>
          )}

          {activeTab === "auth" && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">API Key</label>
                  <Input type="password" placeholder="cq360_prod_••••••••••••" className="h-8 text-xs font-mono" />
                </div>
                <p className="text-[10px] text-muted-foreground">Key will be auto-injected as <code>Authorization: Bearer ...</code></p>
              </CardContent>
            </Card>
          )}

          {/* Response */}
          {response && (
            <Card className={response.status < 400 ? "border-green-200" : "border-red-200"}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {response.status < 400
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />}
                  <CardTitle className="text-sm">Response</CardTitle>
                  <Badge className={`${response.status < 400 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"} border text-xs`}>
                    {response.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{response.time}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto gap-1" onClick={() => navigator.clipboard.writeText(response.body)}>
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="text-[10px] bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre max-h-56">{response.body}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}