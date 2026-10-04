"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, GraduationCap, ClipboardCheck, Building2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

type AnalyticsData = {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalGrades: number;
  pendingSubs: number;
  grades: { name: string; students: number; courses: number }[];
  courses: { name: string; students: number }[];
  attendance: { name: string; value: number }[];
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<AnalyticsData>("/api/admin/analytics")
      .then(setData)
      .catch(() => setError(true));
  }, [mounted, user]);

  if (!mounted || !user)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (error && !data)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-destructive">Failed to load analytics. Please try again.</p>
      </div>
    );
  if (!data)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader title="Analytics" description="System-wide statistics and trends." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Students" value={data.totalStudents} icon={GraduationCap} accent="#990000" />
        <StatCard title="Faculty" value={data.totalInstructors} icon={Users} accent="#4338ca" />
        <StatCard title="Courses" value={data.totalCourses} icon={Building2} accent="#0f766e" />
        <StatCard title="Pending Grading" value={data.pendingSubs} icon={ClipboardCheck} accent="#b45309" />
      </div>

      <AnalyticsCharts
        grades={data.grades}
        courses={data.courses}
        attendance={data.attendance}
      />

      <p className="mt-4 text-xs text-muted-foreground">Total grades: {data.totalGrades}</p>
    </div>
  );
}