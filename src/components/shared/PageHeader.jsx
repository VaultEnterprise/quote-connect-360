import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  backButton = false,
  actions = [],
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        {backButton && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 gap-1"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        )}

        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex gap-2 flex-shrink-0">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size={action.size || 'default'}
              className={action.className}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}