import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function BreadcrumbNav({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm">
      {/* Home */}
      <Link to="/">
        <Button variant="ghost" size="sm" className="gap-1 h-7 px-2">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Button>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />

          {item.href ? (
            <Link to={item.href}>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                {item.label}
              </Button>
            </Link>
          ) : (
            <span className="px-2 py-1 text-muted-foreground">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}