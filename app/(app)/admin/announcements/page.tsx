"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
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

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<Announcement[]>("/api/admin/announcements")
      .then(setData)
      .catch(() => {});
  }, [mounted, user]);

  if (!mounted || !user)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

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