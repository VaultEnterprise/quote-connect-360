import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import ReactMarkdown from "react-markdown";

const CATEGORY_CONFIG = {
  getting_started: { icon: "🚀", label: "Getting Started" },
  features: { icon: "⚡", label: "Features" },
  workflows: { icon: "🔄", label: "Workflows" },
  integrations: { icon: "🔗", label: "Integrations" },
  settings: { icon: "⚙️", label: "Settings" },
  troubleshooting: { icon: "🔧", label: "Troubleshooting" },
  best_practices: { icon: "✨", label: "Best Practices" },
};

export default function UserManualViewer({ manual, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [regenerating, setRegenerating] = useState(false);
  const [currentManual, setCurrentManual] = useState(manual);
  const cfg = CATEGORY_CONFIG[currentManual.category] || CATEGORY_CONFIG.features;
  const isAdmin = user?.role === "admin";

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await base44.functions.invoke("generateUserManual", {
        prompt: `Regenerate and comprehensively update the user manual for "${currentManual.title}". Include all current features, capabilities, workflows, setup processes, best practices, and troubleshooting guidance. Make it thorough and up to date with the latest platform functionality.`,
        title: currentManual.title,
        module: currentManual.module,
      });
      const generated = res.data;
      const updated = await base44.entities.UserManual.update(currentManual.id, {
        content: generated.content,
        description: generated.description || currentManual.description,
        last_updated: new Date().toISOString(),
      });
      setCurrentManual(prev => ({ ...prev, content: generated.content, description: generated.description || prev.description }));
      queryClient.invalidateQueries({ queryKey: ["user-manuals"] });
      queryClient.invalidateQueries({ queryKey: ["user-manuals-all"] });
      toast({ title: "Manual Regenerated", description: "Content has been updated with the latest information." });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl my-8">
        {/* Header */}
        <CardHeader className="border-b flex items-start justify-between gap-4 flex-row">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{cfg.icon}</span>
              <Badge>{cfg.label}</Badge>
              <Badge variant="outline">{currentManual.module}</Badge>
            </div>
            <h2 className="text-2xl font-bold">{currentManual.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{currentManual.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {currentManual.estimated_read_time || 5} min read
              </span>
              <span className="capitalize">{currentManual.difficulty_level}</span>
              {currentManual.last_updated && (
                <span>Updated {new Date(currentManual.last_updated).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="gap-1.5 text-xs h-8"
                title="Regenerate manual content with AI"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                {regenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Main Content */}
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{currentManual.content}</ReactMarkdown>
          </div>

          {/* Setup Steps */}
          {currentManual.setup_steps && currentManual.setup_steps.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span>📋</span> Setup Steps
              </h3>
              <div className="space-y-3">
                {currentManual.setup_steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      {step.details && step.details.length > 0 && (
                        <ul className="text-xs text-muted-foreground mt-1.5 ml-3 space-y-1">
                          {step.details.map((detail, j) => (
                            <li key={j} className="list-disc">{detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {currentManual.best_practices && currentManual.best_practices.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3 bg-emerald-50/30 border-emerald-200">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-900">
                <span>✨</span> Best Practices
              </h3>
              <ul className="text-xs text-emerald-800 space-y-2 ml-2">
                {currentManual.best_practices.map((practice, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex-shrink-0">✓</span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Issues */}
          {currentManual.common_issues && currentManual.common_issues.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3 bg-amber-50/30 border-amber-200">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-amber-900">
                <span>🔧</span> Troubleshooting
              </h3>
              <div className="space-y-2">
                {currentManual.common_issues.map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-amber-900">Q: {item.issue}</p>
                    <p className="text-xs text-amber-800 mt-1">A: {item.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {currentManual.screenshot_urls && currentManual.screenshot_urls.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm">📸 Screenshots</h3>
              <div className="grid grid-cols-2 gap-3">
                {currentManual.screenshot_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="rounded border max-h-48 w-full object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {currentManual.video_url && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm">🎥 Tutorial Video</h3>
              <iframe
                width="100%"
                height="315"
                src={currentManual.video_url}
                title="Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded"
              />
            </div>
          )}

          {/* Related Manuals */}
          {currentManual.related_manuals && currentManual.related_manuals.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2 bg-blue-50/30 border-blue-200">
              <h3 className="font-semibold text-sm text-blue-900">📚 Related Topics</h3>
              <p className="text-xs text-blue-800">See also: {currentManual.related_manuals.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}