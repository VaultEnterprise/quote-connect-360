import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLocation } from "react-router-dom";
import { MessageSquare, X, Send, ThumbsUp, ThumbsDown, Sparkles, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const PAGE_CODES = {
  "/": "DASHBOARD", "/cases": "CASES", "/census": "CENSUS", "/quotes": "QUOTES",
  "/proposals": "PROPOSALS", "/enrollment": "ENROLLMENT", "/renewals": "RENEWALS",
  "/plans": "PLANS", "/policymatch": "POLICYMATCH", "/employers": "EMPLOYERS",
  "/tasks": "TASKS", "/contributions": "CONTRIBUTIONS", "/exceptions": "EXCEPTIONS",
  "/settings": "SETTINGS",
};

const MODULE_CODES = { ...PAGE_CODES };

export default function HelpAIAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm HelpAI — your governed assistant for ConnectQuote 360. I answer only from approved help content. Ask me anything about any feature, workflow, field, or process." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextTargetCode, setContextTargetCode] = useState(null);
  const bottomRef = useRef(null);

  const currentPageCode = PAGE_CODES[location.pathname] || "GENERAL";
  const currentModuleCode = MODULE_CODES[location.pathname] || "GENERAL";

  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      if (e.detail?.prefill) setInput(e.detail.prefill);
      if (e.detail?.targetCode) setContextTargetCode(e.detail.targetCode);
    };
    window.addEventListener("openHelpAI", handler);
    return () => window.removeEventListener("openHelpAI", handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    const ctc = contextTargetCode;
    setContextTargetCode(null);
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await base44.functions.invoke("helpAIAnswer", {
        question: q,
        page_code: currentPageCode,
        module_code: currentModuleCode,
        user_email: user?.email,
        context_target_code: ctc,
      });
      const data = res.data;
      setMessages(prev => [...prev, {
        role: "assistant",
        text: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        answer_status: data.answer_status,
        related_topics: data.related_topics,
        log_id: data.log_id,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "I encountered an error retrieving help content. Please try again or browse the Help Manual.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (logId, rating) => {
    if (!logId) return;
    await base44.entities.HelpAIQuestionLog.update(logId, { feedback_rating: rating });
    setMessages(prev => prev.map(m => m.log_id === logId ? { ...m, feedback_submitted: true } : m));
  };

  const statusColor = (status) => {
    if (status === "low_confidence") return "text-amber-600";
    if (status === "unanswered") return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <>
      {/* CMP-GLOBAL-HELP-AI-LAUNCHER — floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center justify-center"
        title="HelpAI Assistant"
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[540px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <div>
                <p className="font-semibold text-sm">HelpAI Assistant</p>
                <p className="text-[10px] opacity-75">Governed knowledge · {currentPageCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/help" onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-[10px] flex items-center gap-0.5">
                <BookOpen className="w-3 h-3" /> Manual
              </Link>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white ml-1">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[92%] ${msg.role === "user"
                  ? "bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2 text-sm"
                  : "bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm space-y-2"
                }`}>
                  {msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-[10px] text-muted-foreground mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.map((s, j) => (
                              <span key={j} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.confidence !== undefined && (
                        <p className={`text-[9px] ${statusColor(msg.answer_status)}`}>
                          {msg.answer_status === "low_confidence" ? "⚠ Low confidence" : msg.answer_status === "unanswered" ? "✗ Not found in knowledge base" : "✓ Answered"} · {Math.round(msg.confidence * 100)}%
                        </p>
                      )}
                      {msg.related_topics && msg.related_topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {msg.related_topics.slice(0,3).map((t, j) => (
                            <span key={j} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                      {msg.log_id && !msg.feedback_submitted && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-muted-foreground">Helpful?</span>
                          <button onClick={() => submitFeedback(msg.log_id, 5)} className="text-muted-foreground hover:text-green-600"><ThumbsUp className="w-3 h-3" /></button>
                          <button onClick={() => submitFeedback(msg.log_id, 1)} className="text-muted-foreground hover:text-red-600"><ThumbsDown className="w-3 h-3" /></button>
                        </div>
                      )}
                      {msg.feedback_submitted && <p className="text-[10px] text-muted-foreground">Thank you!</p>}
                    </>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }}
              placeholder="Ask anything about the system…"
              className="text-sm h-9"
              disabled={loading}
            />
            <Button size="sm" onClick={sendMessage} disabled={loading || !input.trim()} className="h-9 px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}