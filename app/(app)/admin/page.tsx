"use client";
import * as React from "react";
import { Users, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentAnnouncements } from "@/components/admin/recent-announcements";
import { AdminGlobalBanner } from "@/components/admin/global-banner";

type AdminDashboardData = {
  students: number;
  instructors: number;
  courses: number;
  grades: number;
  enrollments: number;
  pendingSubs: number;
  announcements: {
    id: string;
    title: string;
    author: { name: string };
    pinned: boolean;
    scope: string;
    createdAt: string;
  }[];
  recentEnrollments: {
    id: string;
    progress: number;
    course: { code: string; title: string };
  }[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<AdminDashboardData | null>(null);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<AdminDashboardData>("/api/dashboard/admin")
      .then(setData)
      .catch(() => {});
  }, [mounted, user]);

  if (!mounted || !user)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const { students, instructors, courses, grades, enrollments, pendingSubs } = data;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Campus-wide oversight, user management, and system analytics."
        actions={<AdminGlobalBanner />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={students} icon={GraduationCap} accent="#990000" />
        <StatCard title="Faculty" value={instructors} icon={Users} accent="#4338ca" />
        <StatCard title="Courses" value={courses} icon={BookOpen} accent="#0f766e" />
        <StatCard title="Grades" value={grades} icon={GraduationCap} accent="#b45309" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Grading</CardTitle>
            <CardDescription>Submissions awaiting instructor review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#990000]">{pendingSubs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Enrollments</CardTitle>
            <CardDescription>Registered course enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{enrollments}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RecentAnnouncements data={data.announcements.map((a) => ({
              id: a.id, title: a.title, author: a.author.name, pinned: a.pinned,
              scope: a.scope, createdAt: a.createdAt,
            }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentEnrollments.length === 0 && (
              <p className="text-sm text-muted-foreground">No enrollments yet.</p>
            )}
            {data.recentEnrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{e.course.title}</p>
                  <p className="text-xs text-muted-foreground">{e.course.code}</p>
                </div>
                <Badge variant="secondary">{e.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}