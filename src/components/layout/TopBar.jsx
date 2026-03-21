import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "U";

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-pending"],
    queryFn: () => base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 10),
  });

  const results = searchQuery.length > 1 ? cases.filter(c =>
    c.employer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6) : [];

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="relative max-w-md w-full" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search cases, employers..."
          className="pl-10 bg-background/60 border-border/50 h-9 text-sm"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {results.map(c => (
              <button key={c.id} className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors"
                onClick={() => { navigate(`/cases/${c.id}`); setShowResults(false); setSearchQuery(""); }}>
                <p className="text-sm font-medium">{c.employer_name}</p>
                <p className="text-xs text-muted-foreground">{c.case_number} • {c.stage?.replace(/_/g, " ")}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              {tasks.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {tasks.length > 9 ? "9+" : tasks.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">{tasks.length} pending task(s)</div>
            {tasks.slice(0, 5).map(t => (
              <DropdownMenuItem key={t.id} asChild>
                <Link to="/tasks" className="flex flex-col items-start py-2">
                  <span className="text-sm font-medium">{t.title}</span>
                  <span className="text-xs text-muted-foreground">{t.employer_name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            {tasks.length > 5 && (
              <DropdownMenuItem asChild>
                <Link to="/tasks" className="text-xs text-primary">View all tasks →</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{user?.full_name || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs text-muted-foreground">{user?.email}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={() => base44.auth.logout()}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}