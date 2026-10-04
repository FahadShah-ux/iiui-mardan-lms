"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { GradesManager } from "@/components/admin/grades-manager";

export type GradeRow = {
  id: string;
  name: string;
  order: number;
  memberCount: number;
  courseCount: number;
};

export default function AdminGradesPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<GradeRow[] | null>(null);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<GradeRow[]>("/api/admin/grades")
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
        title="Grades"
        description="Manage school grades (classes) and their sections."
      />
      <GradesManager initial={data} />
    </div>
  );
}
