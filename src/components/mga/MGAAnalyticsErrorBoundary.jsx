/**
 * MGA Analytics Error Boundary
 * components/mga/MGAAnalyticsErrorBoundary.jsx
 *
 * Widget-level error handling
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function MGAAnalyticsErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const errorHandler = () => setHasError(true);
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Analytics Error</p>
            <p className="text-sm text-muted-foreground">Unable to load analytics data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}