import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, X, MessageSquare, BookOpen } from "lucide-react";

export default function HelpCenterWidget({ onOpenManuals }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 hover:scale-110"
      >
        {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </button>

      {/* Help Menu */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-72 shadow-xl z-40">
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-3">Help & Support</h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8"
              onClick={() => {
                onOpenManuals();
                setIsOpen(false);
              }}
            >
              <BookOpen className="w-4 h-4" /> User Manuals
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8"
            >
              <MessageSquare className="w-4 h-4" /> Contact Support
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8"
            >
              <span>📚</span> Knowledge Base
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}