import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, User } from "lucide-react";
import { format } from "date-fns";

const MOCK_COMMENTS = [
  { id: "c1", author: "alice@company.com", role: "Broker", text: "This is blocking our renewal proposal. Need urgent attention.", ts: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "c2", author: "bob@carrier.com", role: "Carrier Rep", text: "We've escalated this to our technical team. ETA ~4 hours.", ts: new Date(Date.now() - 90 * 60 * 1000) },
  { id: "c3", author: "alice@company.com", role: "Broker", text: "Thanks for the update. Will monitor.", ts: new Date(Date.now() - 45 * 60 * 1000) },
];

export default function ExceptionCommentThread() {
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState("");

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: `c${prev.length + 1}`,
      author: "current_user@company.com",
      role: "You",
      text: newComment,
      ts: new Date()
    }]);
    setNewComment("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-semibold">Discussion Thread ({comments.length})</p>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {comments.map(c => (
          <Card key={c.id} className="bg-muted/40">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{c.author.split("@")[0]}</p>
                    <Badge className="text-[8px] bg-primary/10 text-primary border-primary/30 border py-0">{c.role}</Badge>
                    <span className="text-[10px] text-muted-foreground">{format(c.ts, "MMM d, h:mm a")}</span>
                  </div>
                  <p className="text-xs text-foreground mt-1">{c.text}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addComment()}
          placeholder="Add a comment..."
          className="h-8 text-xs"
        />
        <Button size="sm" onClick={addComment} className="gap-1.5 flex-shrink-0">
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}