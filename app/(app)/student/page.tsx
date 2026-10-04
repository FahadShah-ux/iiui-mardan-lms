"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, Clock, Megaphone } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";

type DashboardData = {
  enrollments: {
    id: string;
    progress: number;
    course: {
      id: string;
      code: string;
      title: string;
      color: string;
      credits: number;
      instructor: { name: string } | null;
    };
  }[];
  deadlines: {
    id: string;
    title: string;
    dueDate: string;
    course: { code: string; title: string };
    submissions: { status: string }[];
  }[];
  announcements: {
    id: string;
    title: string;
    createdAt: string;
    course: { title: string } | null;
    author: { name: string };
  }[];
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<DashboardData | null>(null);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<DashboardData>("/api/dashboard/student")
      .then(setData)
      .catch(() => {});
  }, [mounted, user]);

  if (!mounted || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const { enrollments, deadlines, announcements } = data;
  const totalCredits = enrollments.reduce((sum, e) => sum + e.course.credits, 0);

  return (
    <div>
      <PageHeader title="Student Dashboard" description="Welcome back! Track your courses, grades, and deadlines." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Enrolled Courses" value={enrollments.length} icon={GraduationCap} accent="#990000" />
        <StatCard title="Upcoming Deadlines" value={deadlines.length} icon={Clock} accent="#b45309" />
        <StatCard title="Credits" value={totalCredits} icon={GraduationCap} accent="#4338ca" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Enrolled Courses</CardTitle>
            <CardDescription>Course progress overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollments.length === 0 && <EmptyState title="No enrolled courses" description="Browse available courses to enroll." />}
            {enrollments.map((e) => (
              <Link key={e.id} href={`/student/courses/${e.course.id}`} className="block rounded-lg border p-4 transition-colors hover:border-primary/40">
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{e.course.title}</p>
                    <p className="text-xs text-muted-foreground">{e.course.code}{e.course.instructor ? ` · ${e.course.instructor.name}` : ""}</p>
                  </div>
                  <Badge variant="outline">{e.progress}%</Badge>
                </div>
                <Progress value={e.progress} className="flex-1" indicatorClassName="bg-[#990000]" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              <CardDescription>Assignments and quizzes due soon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {deadlines.length === 0 && <p className="text-sm text-muted-foreground">No upcoming deadlines. Enjoy the break!</p>}
              {deadlines.map((a) => {
                const submitted = a.submissions[0]?.status === "GRADED" || a.submissions[0]?.status === "SUBMITTED";
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.course.code} · due {new Date(a.dueDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={submitted ? "success" : "warning"}>{submitted ? "Submitted" : "Due"}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements.</p>}
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4 shrink-0 text-[#c1121f]" />
                    <p className="truncate text-sm font-medium">{a.title}</p>
                  </div>
                  {a.course && <p className="text-xs text-muted-foreground">{a.course.title} · by {a.author.name}</p>}
                  {!a.course && <p className="text-xs text-muted-foreground">by {a.author.name}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
