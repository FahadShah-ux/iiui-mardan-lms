"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, GraduationCap, ClipboardCheck, Building2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
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
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<AnalyticsData>("/api/admin/analytics")
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
        title="Could not load analytics"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen />;

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