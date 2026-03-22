import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Heart, Baby, Briefcase, Users, X } from "lucide-react";

const LIFE_EVENTS = [
  { value: "marriage", label: "Marriage / Domestic Partnership", icon: Heart },
  { value: "birth_adoption", label: "Birth or Adoption of a Child", icon: Baby },
  { value: "divorce", label: "Divorce or Legal Separation", icon: Users },
  { value: "loss_coverage", label: "Loss of Other Coverage", icon: Briefcase },
  { value: "new_dependent", label: "New Dependent Eligible", icon: Users },
  { value: "other", label: "Other Qualifying Event", icon: Heart },
];

export default function LifeEventCard({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedEvent) return;
    setSubmitted(true);
    onSubmit?.(selectedEvent);
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Heart className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Life Event Submitted</p>
            <p className="text-xs text-green-700 mt-0.5">
              Your HR administrator has been notified. They will open a special enrollment window if you qualify.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!open) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">Had a Life Change?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Marriage, new baby, or lost other coverage? You may qualify for a special enrollment period.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex-shrink-0">
            Report Event
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-blue-900 text-sm">Report a Qualifying Life Event</p>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select event type..." />
          </SelectTrigger>
          <SelectContent>
            {LIFE_EVENTS.map(e => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-blue-700">
          You typically have 30–60 days from the event date to make changes. Your administrator will confirm eligibility.
        </p>
        <Button size="sm" className="w-full" onClick={handleSubmit} disabled={!selectedEvent}>
          Submit Request
        </Button>
      </CardContent>
    </Card>
  );
}