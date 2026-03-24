import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: IconComponent = Inbox,
  title = 'Nothing here yet',
  description = 'Get started by creating a new item.',
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <Card className={`border-dashed border-2 ${compact ? 'p-8' : 'p-12'} text-center`}>
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-muted-foreground" />
        </div>

        <div>
          <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-muted-foreground ${compact ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
              {description}
            </p>
          )}
        </div>

        {actionLabel && onAction && (
          <Button onClick={onAction} size={compact ? 'sm' : 'default'}>
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}