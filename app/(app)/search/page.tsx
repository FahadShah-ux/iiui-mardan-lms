"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { SearchResults } from "@/components/search/search-results";

export default function SearchPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SearchResults />;
}
