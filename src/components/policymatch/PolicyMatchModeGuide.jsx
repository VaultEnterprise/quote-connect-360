import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Lightbulb } from "lucide-react";

export default function PolicyMatchModeGuide() {
  const [expandedMode, setExpandedMode] = useState(null);

  const modes = [
    {
      mode: "Full Auto",
      icon: "⚡",
      desc: "System selects and binds optimal policy automatically",
      bestFor: "High-confidence, low-risk segments",
      pros: ["Fastest close", "Zero broker effort", "Maximizes value capture"],
      cons: ["Less control", "May not fit all preferences"]
    },
    {
      mode: "Guided",
      icon: "🧭",
      desc: "System presents ranked options with clear advantages",
      bestFor: "Broker or employer final selection",
      pros: ["Informed decisions", "Maintains control", "Confidence-building"],
      cons: ["Requires review", "May slow close"]
    },
    {
      mode: "Hybrid",
      icon: "⚙️",
      desc: "Automatic upgrades applied, final selection user-controlled",
      bestFor: "Best of both worlds",
      pros: ["Balanced approach", "Quick upgrades", "Full control on selection"],
      cons: ["Moderate complexity", "Training required"]
    },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-600" /> Operating Modes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {modes.map((m, i) => (
          <div key={i} className="border border-blue-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedMode(expandedMode === i ? null : i)}
              className="w-full p-3 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-lg">{m.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-900">{m.mode}</p>
                  <p className="text-[10px] text-blue-700 truncate">{m.desc}</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-blue-600 transition-transform flex-shrink-0 ${expandedMode === i ? "rotate-90" : ""}`} />
            </button>
            {expandedMode === i && (
              <div className="p-3 bg-white border-t border-blue-200 space-y-2">
                <div>
                  <p className="text-[10px] font-semibold text-blue-900">Best For:</p>
                  <p className="text-xs text-blue-700">{m.bestFor}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-700 mb-1">✓ Pros</p>
                    <ul className="text-[10px] text-emerald-600 space-y-0.5">
                      {m.pros.map((p, j) => <li key={j}>• {p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-700 mb-1">⚠ Cons</p>
                    <ul className="text-[10px] text-amber-600 space-y-0.5">
                      {m.cons.map((c, j) => <li key={j}>• {c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}