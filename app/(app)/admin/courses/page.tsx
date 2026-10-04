"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { AdminCoursesManager } from "@/components/admin/courses-manager";

type CoursesData = {
  courses: {
    id: string;
    code: string;
    title: string;
    description: string;
    credits: number;
    semester: string;
    color: string;
    instructorId: string | null;
    instructorName: string | null;
    gradeId: string | null;
    gradeName: string | null;
    enrollments: number;
    assignments: number;
  }[];
  instructors: { id: string; name: string }[];
  grades: { id: string; name: string }[];
};

export default function AdminCoursesPage() {
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
    apiFetch<CoursesData>("/api/admin/courses/page")
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
        title="Could not load courses"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen />;

  return (
    <div>
      <PageHeader title="Course Allocation" description="Create courses and assign instructors and grades." />
      <AdminCoursesManager
        initial={data.courses}
        instructors={data.instructors}
        grades={data.grades}
      />
    </div>
  );
}