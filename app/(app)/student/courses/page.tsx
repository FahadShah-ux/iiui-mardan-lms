"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { EnrollButton } from "@/components/student/enroll-button";

type CoursesData = {
  enrollments: {
    id: string;
    progress: number;
    course: {
      id: string;
      code: string;
      title: string;
      semester: string;
      credits: number;
      color: string;
      description: string;
      instructor: { name: string } | null;
    };
  }[];
  available: {
    id: string;
    code: string;
    title: string;
    semester: string;
    credits: number;
    color: string;
    description: string;
    instructor: { name: string } | null;
    _count: { enrollments: number };
  }[];
};

export default function StudentCoursesPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<CoursesData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<CoursesData>("/api/student/courses")
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
        title="Could not load your courses"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen />;

  const { enrollments, available } = data;

  return (
    <div>
      <PageHeader title="My Courses" description="Your enrolled courses and available courses." />

      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <GraduationCap className="h-5 w-5 text-[#990000]" /> Enrolled ({enrollments.length})
      </h2>

      {enrollments.length === 0 && (
        <EmptyState className="mb-8" title="No courses yet" description="Enroll in courses below to get started." />
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((e) => (
          <Link key={e.id} href={`/student/courses/${e.course.id}`}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="flex flex-col gap-3 p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: e.course.color || "#990000" }}
                >
                  {e.course.code.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{e.course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.course.code} Â· {e.course.semester} Â· {e.course.credits} cr
                  </p>
                  {e.course.instructor && <p className="text-xs text-muted-foreground">by {e.course.instructor.name}</p>}
                </div>
                <div className="mt-auto">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{e.progress}%</span>
                  </div>
                  <Progress value={e.progress} indicatorClassName="bg-[#990000]" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Available Courses ({available.length})</h2>
      {available.length === 0 && <p className="text-sm text-muted-foreground">You are enrolled in all available courses.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((c) => (
          <Card key={c.id} className="h-full">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: c.color || "#990000" }}
                >
                  {c.code.slice(0, 3).toUpperCase()}
                </div>
                <Badge variant="secondary">{c._count.enrollments} enrolled</Badge>
              </div>
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.code} Â· {c.semester} Â· {c.credits} cr</p>
                {c.instructor && <p className="text-xs text-muted-foreground">by {c.instructor.name}</p>}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-auto">
                <EnrollButton courseId={c.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
