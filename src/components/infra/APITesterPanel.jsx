import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader, Play, Copy, Check, AlertCircle } from "lucide-react";

/**
 * APITesterPanel
 * Live API endpoint tester for Integration Infrastructure page.
 * Test REST endpoints with request/response logging.
 */
export default function APITesterPanel() {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("/api/cases");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [statusCode, setStatusCode] = useState(null);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const ENDPOINTS = [
    { method: "GET", path: "/api/cases", label: "List Cases" },
    { method: "GET", path: "/api/cases/:id", label: "Get Case" },
    { method: "POST", path: "/api/cases", label: "Create Case" },
    { method: "GET", path: "/api/enrollments", label: "List Enrollments" },
    { method: "GET", path: "/api/census", label: "List Census" },
    { method: "GET", path: "/api/quotes", label: "List Quotes" },
  ];

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setStatusCode(response.status);
      setResponse(data);

      if (!response.ok) {
        setError(data.error || "Request failed");
      }
    } catch (err) {
      setError(err.message);
      setStatusCode(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">API Endpoint Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick endpoints */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Endpoints:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ENDPOINTS.map(ep => (
                <Button
                  key={`${ep.method}-${ep.path}`}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-8"
                  onClick={() => { setMethod(ep.method); setEndpoint(ep.path); }}
                >
                  <Badge className="mr-2 text-[10px]">{ep.method}</Badge>
                  {ep.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom request */}
          <div className="space-y-2 pt-3 border-t">
            <label className="text-xs font-medium text-muted-foreground">Custom Request:</label>
            <div className="flex gap-2">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="/api/endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="h-8 text-xs flex-1"
              />
            </div>
          </div>

          {/* Test button */}
          <Button
            onClick={handleTest}
            disabled={loading || !endpoint}
            className="w-full text-xs"
          >
            {loading && <Loader className="w-3 h-3 mr-1.5 animate-spin" />}
            {loading ? "Testing..." : "Send Request"}
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              Response ({statusCode})
              {statusCode >= 200 && statusCode < 300 && (
                <Badge className="bg-green-100 text-green-700 text-[10px]">Success</Badge>
              )}
              {statusCode >= 400 && (
                <Badge variant="destructive" className="text-[10px]">Error</Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(response, null, 2));
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
            >
              {copiedCode ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto text-muted-foreground max-h-64 overflow-y-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}