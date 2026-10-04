"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";
import { AdminGlobalBanner } from "@/components/admin/global-banner";

type Announcement = {
  id: string;
  title: string;
  body: string;
  scope: string;
  pinned: boolean;
  author: string;
  course: string | null;
  createdAt: string;
};

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<Announcement[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<Announcement[]>("/api/admin/announcements")
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [mounted, user, attempt]);

  if (!mounted || !user) return <LoadingScreen />;
  if (error && !data)
    return (
      <ErrorState
        title="Could not load announcements"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen />;

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Manage system-wide announcements."
        actions={<AdminGlobalBanner />}
      />
      <AnnouncementsManager initial={data} />
    </div>
  );
}