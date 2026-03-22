import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Key, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

const CODE_EXAMPLES = {
  curl: `curl -X GET https://api.connectquote360.com/api/cases \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  javascript: `const response = await fetch('https://api.connectquote360.com/api/cases', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`,
  python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.connectquote360.com/api/cases',
    headers=headers
)
data = response.json()`,
};

export default function AuthGuidePanel() {
  const [lang, setLang] = useState("curl");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Authentication Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>All API requests must be authenticated using a <strong className="text-foreground">Bearer token</strong> passed in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization</code> header.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Token Type", value: "Bearer (JWT)", Icon: Key },
              { label: "Header Name", value: "Authorization", Icon: Shield },
              { label: "Token TTL", value: "24 hours", Icon: CheckCircle2 },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="p-3 rounded-lg bg-muted/40 text-center">
                <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code example */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Code Examples</CardTitle>
            <div className="flex gap-1">
              {Object.keys(CODE_EXAMPLES).map(l => (
                <Button key={l} variant={lang === l ? "default" : "outline"} size="sm" className="h-7 text-xs px-2.5" onClick={() => setLang(l)}>
                  {l}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="text-[11px] bg-slate-900 text-green-400 rounded-lg p-4 overflow-x-auto font-mono whitespace-pre">
              {CODE_EXAMPLES[lang]}
            </pre>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-700 gap-1" onClick={copy}>
              <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auth flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Token Exchange Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { step: "1", label: "Generate API Key", desc: "Create a key from the API Keys tab with appropriate scopes." },
              { step: "2", label: "Exchange for Bearer Token", desc: "POST /auth/token with your API key to receive a short-lived JWT." },
              { step: "3", label: "Attach to Requests", desc: 'Include the JWT as Authorization: Bearer <token> on every request.' },
              { step: "4", label: "Refresh When Expired", desc: "Tokens expire after 24h. Re-exchange your API key to get a new token." },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-800">
            <p className="font-semibold">Security Best Practices</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Never expose API keys in client-side code or public repositories</li>
              <li>Use environment variables or a secrets manager to store keys</li>
              <li>Rotate keys every 90 days or immediately if compromised</li>
              <li>Use minimum-scope keys — don't use a write-all key for read-only tasks</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}