import { useState, useMemo, useCallback } from 'react';
import { Search, X, Clock, FileText, Users, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const categoryIcons = {
  cases: Briefcase,
  employers: Users,
  proposals: FileText,
  recent: Clock,
};

export default function GlobalSearch({ isOpen, onClose, searchData = {} }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return { recent: searchData.recent || [] };

    const lowerQuery = query.toLowerCase();
    const filteredResults = {};

    // Search across categories
    Object.entries(searchData).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;

      const matches = items.filter(item =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.title?.toLowerCase().includes(lowerQuery) ||
        item.case_number?.toLowerCase().includes(lowerQuery) ||
        item.employer_name?.toLowerCase().includes(lowerQuery)
      );

      if (matches.length > 0) {
        filteredResults[category] = matches.slice(0, 5);
      }
    });

    return filteredResults;
  }, [query, searchData]);

  const handleSelect = useCallback((item, category) => {
    const routes = {
      cases: `/cases/${item.id}`,
      employers: `/employers/${item.id}`,
      proposals: `/proposals/${item.id}`,
    };

    if (routes[category]) {
      navigate(routes[category]);
      onClose?.();
      setQuery('');
    }
  }, [navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          onClose?.();
          setQuery('');
        }}
      />

      {/* Search Box */}
      <div className="relative z-50 top-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-card rounded-lg shadow-lg border">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search cases, employers, proposals..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 bg-transparent placeholder:text-muted-foreground focus-visible:ring-0"
                autoFocus
              />
              {query && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Results */}
            {Object.keys(results).length > 0 && (
              <div className="max-h-96 overflow-y-auto border-t">
                {Object.entries(results).map(([category, items]) => {
                  const IconComponent = categoryIcons[category] || Search;
                  return (
                    <div key={category}>
                      <div className="px-4 py-2 bg-muted text-xs font-semibold text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-3 h-3" />
                          {category.toUpperCase()}
                        </div>
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-b-0 text-sm"
                          onClick={() => handleSelect(item, category)}
                        >
                          <p className="font-semibold truncate">
                            {item.name || item.title || item.employer_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.case_number || category}
                          </p>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {query && Object.keys(results).length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No results found</p>
              </div>
            )}

            {!query && searchData.recent?.length > 0 && (
              <div className="px-4 py-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground py-2">Recent</p>
                <div className="space-y-1">
                  {searchData.recent.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors text-sm"
                      onClick={() => handleSelect(item, 'cases')}
                    >
                      {item.name || item.title || item.employer_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}