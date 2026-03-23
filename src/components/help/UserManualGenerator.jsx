import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Save, Upload } from "lucide-react";

const CATEGORIES = [
  { value: "getting_started", label: "Getting Started" },
  { value: "features", label: "Features" },
  { value: "workflows", label: "Workflows" },
  { value: "integrations", label: "Integrations" },
  { value: "settings", label: "Settings" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "best_practices", label: "Best Practices" },
];

const MODULES = [
  "Dashboard", "Cases", "Census", "Quotes", "Enrollment", "Renewals",
  "Proposals", "Tasks", "Employers", "Plans", "PolicyMatch", "Exceptions",
  "Settings", "Integration Infrastructure", "Employee Portal"
];

/**
 * UserManualGenerator — AI-assisted manual creation tool
 * Status: Fully functional but may be superseded by HelpAdmin's content management
 * Note: This component creates UserManual entities via AI
 * Ensure this is not duplicating HelpContent entity functionality
 */
export default function UserManualGenerator() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAiMode, setIsAiMode] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    category: "features",
    module: "Dashboard",
    description: "",
    content: "",
    difficulty_level: "beginner",
    estimated_read_time: 5,
    published: false,
  });
  const [aiPrompt, setAiPrompt] = useState("");

  const createManual = useMutation({
    mutationFn: (data) => base44.entities.UserManual.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-manuals"] });
      toast({ title: "Manual created", description: "User manual published successfully." });
      resetForm();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const generateWithAI = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("generateUserManual", {
        prompt: aiPrompt,
        title: formData.title,
        module: formData.module,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        content: data.content,
        description: data.description,
      }));
      toast({ title: "Content Generated", description: "AI has created the manual content." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      category: "features",
      module: "Dashboard",
      description: "",
      content: "",
      difficulty_level: "beginner",
      estimated_read_time: 5,
      published: false,
    });
    setAiPrompt("");
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Required fields", description: "Title and content are required." });
      return;
    }
    createManual.mutate({
      ...formData,
      last_updated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" /> Create User Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
            <Button
              size="sm"
              variant={isAiMode ? "default" : "outline"}
              onClick={() => setIsAiMode(true)}
              className="gap-1"
            >
              <Sparkles className="w-3 h-3" /> AI Generate
            </Button>
            <Button
              size="sm"
              variant={!isAiMode ? "default" : "outline"}
              onClick={() => setIsAiMode(false)}
            >
              Manual Entry
            </Button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                placeholder="e.g., Dashboard Overview"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1.5 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Module</Label>
              <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v })}>
                <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Difficulty Level</Label>
              <Select value={formData.difficulty_level} onValueChange={(v) => setFormData({ ...formData, difficulty_level: v })}>
                <SelectTrigger className="mt-1.5 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              placeholder="Brief description of the manual content"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5 text-xs h-12"
            />
          </div>

          {/* AI Mode */}
          {isAiMode && (
            <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Label className="text-xs">AI Prompt</Label>
              <Textarea
                placeholder="Describe what the manual should cover. E.g., 'Create a comprehensive guide on how to use the Dashboard, including key metrics, filters, and navigation tips.'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="text-xs h-20"
              />
              <Button
                size="sm"
                onClick={() => generateWithAI.mutate()}
                disabled={generateWithAI.isPending || !aiPrompt}
                className="gap-1 text-xs"
              >
                {generateWithAI.isPending ? "Generating..." : <>
                  <Sparkles className="w-3 h-3" /> Generate Content
                </>}
              </Button>
            </div>
          )}

          {/* Manual Content */}
          <div>
            <Label className="text-xs">Manual Content (Markdown)</Label>
            <Textarea
              placeholder="Enter markdown formatted content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="mt-1.5 text-xs h-32 font-mono"
            />
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.published}
              onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              id="publish"
            />
            <label htmlFor="publish" className="text-xs font-medium cursor-pointer">
              Publish immediately (make visible to all users)
            </label>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={createManual.isPending || !formData.title || !formData.content}
            className="gap-1"
          >
            <Save className="w-4 h-4" /> {createManual.isPending ? "Saving..." : "Save Manual"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}