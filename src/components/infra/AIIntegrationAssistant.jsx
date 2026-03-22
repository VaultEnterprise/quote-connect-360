import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import {
  Bot, Sparkles, Send, Copy, CheckCircle2, AlertCircle,
  Code2, Zap, RefreshCw, ChevronRight, Loader2, Brain,
  GitMerge, Plug, FileCode, MessageSquare
} from "lucide-react";

const QUICK_PROMPTS = [
  { label: "Map census CSV to API", icon: GitMerge, prompt: "Generate a field mapping and transformation code snippet to import a CSV census file into the /api/census/:case_id/upload endpoint. Include column normalization and error handling." },
  { label: "Webhook receiver setup", icon: Plug, prompt: "Generate a Node.js Express webhook receiver for enrollment.member_enrolled and enrollment.closed events with HMAC signature verification." },
  { label: "Full enrollment sync", icon: RefreshCw, prompt: "Write a polling integration that syncs enrollment status from ConnectQuote360 to a payroll system every 15 minutes, handling pagination and retries." },
  { label: "Proposal PDF pipeline", icon: FileCode, prompt: "Describe and generate code for an automated pipeline: trigger on proposal.approved webhook → fetch proposal data → generate PDF → store in S3 → notify HR via email." },
  { label: "Rate limit handler", icon: AlertCircle, prompt: "Write a rate-limit-aware API client wrapper for ConnectQuote360 that queues requests and backs off on 429 responses with exponential retry." },
  { label: "OAuth2 integration", icon: Code2, prompt: "Generate a complete OAuth2 client_credentials flow for machine-to-machine integration with ConnectQuote360, including token caching and refresh." },
];

const SYSTEM_PROMPT = `You are an expert enterprise API integration engineer for ConnectQuote360, a health benefits broker platform. 
You help developers integrate with the CQ360 REST API. 
You know the full API surface: Cases, Census, Quotes, Proposals, Enrollment, Renewals, Webhooks, Auth.
Always produce production-ready, copy-paste code with proper error handling, type hints, and comments.
Prefer TypeScript for Node.js, Python for data pipelines. Always include authentication headers.
Base URL: https://api.connectquote360.com`;

export default function AIIntegrationAssistant({ aiEnabled, onToggleAI }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI Integration Assistant for ConnectQuote360. I can help you:\n\n• **Generate integration code** for any endpoint\n• **Map data schemas** between your systems and CQ360\n• **Debug webhook payloads** and signature verification\n• **Design end-to-end pipelines** for census, enrollment, and billing sync\n\nAsk me anything or pick a quick-start prompt below.",
      ts: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nConversation:\n${history}\n\nAssistant:`,
        model: "claude_sonnet_4_6"
      });
      setMessages(prev => [...prev, { role: "assistant", content: res, ts: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}`, ts: new Date(), error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* AI Toggle Header */}
      <Card className={aiEnabled ? "border-primary/40 bg-primary/5" : "border-dashed"}>
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${aiEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                AI Integration Assistant
                {aiEnabled && <Badge className="bg-primary/20 text-primary border-primary/30 border text-[10px]">Active</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">Powered by Claude Sonnet · Uses integration credits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{aiEnabled ? "Enabled" : "Disabled"}</span>
            <Switch checked={aiEnabled} onCheckedChange={onToggleAI} />
          </div>
        </CardContent>
      </Card>

      {!aiEnabled ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground space-y-3">
            <Bot className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium">AI Assistant is disabled</p>
            <p className="text-xs">Toggle the switch above to enable AI-powered integration help. Admin access required.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick prompts */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Start Prompts</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.prompt)}
                  disabled={loading}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <q.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  <span className="text-xs font-medium">{q.label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/40 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">Integration Chat</CardTitle>
              <Badge className="ml-auto text-[10px] bg-green-100 text-green-700 border-green-200 border">Claude Sonnet</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} />
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI is thinking...
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <Input
                  placeholder="Ask about any integration, mapping, or code pattern..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  className="text-sm"
                  disabled={loading}
                />
                <Button size="sm" onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="gap-1.5 flex-shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyAll = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Render code blocks
  const parts = message.content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isUser ? "bg-primary text-primary-foreground" : "bg-slate-800 text-green-400"}`}>
        {isUser ? <span className="text-[10px] font-bold">YOU</span> : <Sparkles className="w-3.5 h-3.5" />}
      </div>
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed ${isUser ? "bg-primary text-primary-foreground" : message.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-muted text-foreground"}`}>
          {parts.map((part, i) => {
            if (part.startsWith("```")) {
              const lines = part.replace(/^```\w*\n?/, "").replace(/```$/, "");
              return (
                <div key={i} className="my-2 relative">
                  <pre className="bg-slate-900 text-green-400 rounded-lg p-3 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">{lines}</pre>
                </div>
              );
            }
            // Bold formatting
            return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />;
          })}
        </div>
        {!isUser && (
          <button onClick={copyAll} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1">
            <Copy className="w-2.5 h-2.5" />{copied ? "Copied!" : "Copy response"}
          </button>
        )}
      </div>
    </div>
  );
}