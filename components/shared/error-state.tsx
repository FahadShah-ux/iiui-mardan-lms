"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";

/**
 * Failure state with an optional retry.
 *
 * Generalises the pattern already in tree at `components/admin/grades-manager.tsx`,
 * so this introduces no new convention. `onRetry` must re-run the caller's own
 * fetch: `router.refresh()` is a no-op in this app because pages are
 * client-rendered and hold no server data.
 *
 * The `"use client"` directive is required because of the callback prop, and it
 * is kept even though callers are already client components so the component
 * stays safe to import from a server component later.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  /** Friendly, fixed wording. Do not put `err.message` here. */
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10 text-center", className)}>
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      )}
    </div>
  );
}