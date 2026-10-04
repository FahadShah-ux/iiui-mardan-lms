"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { GradingPanel } from "@/components/instructor/grading-panel";

type Submission = {
  id: string;
  studentId: string;
  assignmentId: string;
  studentName: string;
  studentEmail: string;
  text: string | null;
  fileUrl: string | null;
  status: string;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

type Assignment = {
  id: string;
  title: string;
  dueDate: string;
  maxMarks: number;
  submissions: Submission[];
};

type Course = {
  id: string;
  title: string;
  code: string;
  assignments: Assignment[];
};

function GradingContent() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const searchParams = useSearchParams();
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
    apiFetch<Course[]>("/api/instructor/grading")
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

  const initialAssignmentId = React.useMemo(() => {
    if (!courses) return undefined;
    const assignment = searchParams.get("assignment");
    if (!assignment) return undefined;
    return courses.flatMap((c) => c.assignments).find((a) => a.id === assignment)?.id;
  }, [courses, searchParams]);

  if (!mounted || !user) return <LoadingScreen variant="section" />;
  // Ahead of `!courses`, so a failure reports itself instead of spinning forever.
  if (error && !courses)
    return (
      <ErrorState
        title="Could not load submissions"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!courses) return <LoadingScreen variant="section" />;

  return (
    <div>
      <PageHeader title="Grading" description="Review submissions and enter marks." />
      <GradingPanel courses={courses} initialAssignmentId={initialAssignmentId} />
    </div>
  );
}

export default function InstructorGradingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GradingContent />
    </React.Suspense>
  );
}