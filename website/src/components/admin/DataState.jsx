import { AlertCircle, Inbox } from 'lucide-react';
import { Skeleton } from '../ui/Loader';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';

/** Loading skeleton, error with retry, or empty state; renders children once there is data. Pass `loading` only for the first load. */
export default function DataState({ loading, error, empty, onRetry, emptyTitle = 'Nothing here yet', emptyDescription, emptyAction, rows = 5, children }) {
  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8 text-destructive" />}
        title="Could not load data"
        description={error}
        action={onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>}
      />
    );
  }
  if (empty) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return children;
}
