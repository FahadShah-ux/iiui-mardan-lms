"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { AttendancePanel } from "@/components/instructor/attendance-panel";

type Student = { id: string; name: string; email: string };
type Course = { id: string; title: string; code: string; semester: string; students: Student[] };

export default function InstructorAttendancePage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [courses, setCourses] = React.useState<Course[] | null>(null);
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
    apiFetch<Course[]>("/api/instructor/attendance")
      .then((d) => {
        if (cancelled) return;
        setCourses(d);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [mounted, user, attempt]);

  if (!mounted || !user) return <LoadingScreen variant="section" />;
  // Ahead of `!courses`, so a failure reports itself instead of spinning forever.
  if (error && !courses)
    return (
      <ErrorState
        title="Could not load your courses"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!courses) return <LoadingScreen variant="section" />;

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily student attendance." />
      <AttendancePanel courses={courses} />
    </div>
  );
}