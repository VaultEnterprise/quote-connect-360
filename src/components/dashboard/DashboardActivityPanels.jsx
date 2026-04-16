import React from "react";
import { Link } from "react-router-dom";
import { Activity, AlertCircle, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function DashboardActivityPanels({ monthlyData, currentCases, currentTasks, openExceptions }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Cases Created</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={130}><LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} /><Line type="monotone" dataKey="cases" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} /></LineChart></ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold">Recent Cases</CardTitle><Link to="/cases" className="text-xs text-muted-foreground inline-flex items-center hover:text-primary transition-colors">View all <ArrowRight className="w-3 h-3 ml-1" /></Link></div></CardHeader>
        <CardContent><div className="space-y-2">{currentCases.filter(Boolean).slice(0, 5).map((item, index) => (<Link key={item.id || `case-${index}`} to={`/cases/${item.id}`} className="block"><div className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.employer_name || "Unnamed"}</p><p className="text-xs text-muted-foreground">{item.case_number || `#${item.id?.slice(-6)}`}</p></div><span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground capitalize">{item.stage?.replace(/_/g, " ") || "unknown"}</span></div></Link>))}</div></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold">Needs Attention</CardTitle><Link to="/tasks" className="text-xs text-muted-foreground inline-flex items-center hover:text-primary transition-colors">Tasks <ArrowRight className="w-3 h-3 ml-1" /></Link></div></CardHeader>
        <CardContent>{currentTasks.length === 0 && openExceptions.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-6">All caught up! ✓</p>) : (<div className="space-y-2">{openExceptions.filter(Boolean).slice(0, 2).map((item, index) => (<Link key={item.id || `exception-${index}`} to="/exceptions"><div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"><AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /><div className="min-w-0"><p className="text-xs font-medium text-red-700 truncate">{item.title}</p><p className="text-[10px] text-red-500 capitalize">{item.severity} • {item.category}</p></div></div></Link>))}{currentTasks.filter(Boolean).slice(0, 3).map((item, index) => (<div key={item.id || `task-${index}`} className="p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"><p className="text-xs font-medium truncate">{item.title}</p><div className="flex items-center justify-between mt-1"><span className="text-[10px] text-muted-foreground">{item.employer_name}</span>{item.due_date && (<span className={`text-[10px] flex items-center gap-0.5 ${new Date(item.due_date) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}`}><Clock className="w-3 h-3" />{format(new Date(item.due_date), "MMM d")}</span>)}</div></div>))}</div>)}</CardContent>
      </Card>
    </div>
  );
}