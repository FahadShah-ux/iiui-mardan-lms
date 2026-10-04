"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardCheck, CalendarDays, FileText } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";

type DashboardData = {
  courses: {
    id: string;
    code: string;
    title: string;
    semester: string;
    _count: { enrollments: number; assignments: number };
    enrollments: { progress: number }[];
  }[];
  pendingSubs: { id: string; student: { name: string }; assignment: { title: string } }[];
  ungradedCount: number;
  todayAttendance: number;
  deadlines: {
    id: string;
    title: string;
    dueDate: string;
    course: { code: string; title: string };
    _count: { submissions: number };
  }[];
};

export default function InstructorDashboardPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<DashboardData>("/api/dashboard/instructor")
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

  if (!mounted || !user) return <LoadingScreen variant="section" />;
  // Ahead of `!data`, so a failure reports itself instead of spinning forever.
  if (error && !data)
    return (
      <ErrorState
        title="Could not load your dashboard"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen variant="section" />;

  const { courses, pendingSubs, ungradedCount, todayAttendance, deadlines } = data;
  const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0);

  return (
    <div>
      <PageHeader
        title="Instructor Dashboard"
        description="Manage your courses, grades, and attendance."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Courses" value={courses.length} icon={BookOpen} accent="#990000" />
        <StatCard title="Total Students" value={totalEnrollments} icon={FileText} accent="#4338ca" />
        <StatCard title="Pending Grading" value={ungradedCount} icon={ClipboardCheck} accent="#b45309" />
        <StatCard title="Attendance Today" value={todayAttendance} icon={CalendarDays} accent="#0f766e" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Courses</CardTitle>
            <CardDescription>Courses assigned to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.length === 0 && <EmptyState title="No courses yet" description="Courses will appear here once assigned by an administrator." />}
            {courses.map((c) => {
              const avgProgress = c.enrollments.length
                ? Math.round(c.enrollments.reduce((s, e) => s + e.progress, 0) / c.enrollments.length)
                : 0;
              return (
                <Link key={c.id} href={`/instructor/courses/${c.id}`} className="block rounded-lg border p-4 transition-colors hover:border-primary/40">
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.code} · {c.semester}</p>
                    </div>
                    <Badge variant="secondary">{c._count.enrollments} students</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={avgProgress} className="flex-1" />
                    <span className="text-xs text-muted-foreground">{avgProgress}%</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deadlines.length === 0 && <p className="text-sm text-muted-foreground">No upcoming assignment deadlines.</p>}
              {deadlines.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.course.code} · due {new Date(a.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline">{a._count.submissions} submissions</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Submissions</CardTitle>
              <CardDescription>Awaiting your review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingSubs.length === 0 && <p className="text-sm text-muted-foreground">All caught up!</p>}
              {pendingSubs.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.student.name}</p>
                    <p className="text-xs text-muted-foreground">{s.assignment.title}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}