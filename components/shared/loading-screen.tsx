import { Loader2 } from "lucide-react";

/**
 * Full-height spinner, extracted from the copy-pasted JSX that appeared in
 * roughly fifteen pages.
 *
 * Two heights exist in the codebase and they are NOT interchangeable:
 * `screen` fills the viewport, `section` is the shorter 50vh used by the
 * instructor pages. Normalising them shifts those pages' layout, so the variant
 * is explicit rather than defaulted everywhere.
 */
export function LoadingScreen({ variant = "screen" }: { variant?: "screen" | "section" }) {
  return (
    <div
      className={
        variant === "screen"
          ? "flex min-h-screen items-center justify-center"
          : "flex min-h-[50vh] items-center justify-center"
      }
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}