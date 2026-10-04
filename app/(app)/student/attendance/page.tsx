"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/src/lib/utils";

type AttendanceData = {
  perCourse: {
    course: { id: string; code: string; title: string; color: string };
    recs: { id: string; status: string; date: string }[];
    present: number;
    absent: number;
    pct: number | null;
  }[];
};

export default function StudentAttendancePage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<AttendanceData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<AttendanceData>("/api/student/attendance")
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
        title="Could not load your attendance"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen />;

  const { perCourse } = data;

  return (
    <div>
      <PageHeader title="My Attendance" description="Track your class attendance." />

      {perCourse.length === 0 && (
        <EmptyState title="No courses" description="Enroll in a course to see attendance." />
      )}

      <div className="space-y-6">
        {perCourse.map(({ course, recs, present, absent, pct }) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{course.title}</CardTitle>
                {pct !== null ? (
                  <Badge variant={pct >= 75 ? "success" : pct >= 50 ? "warning" : "destructive"}>{pct}% present</Badge>
                ) : (
                  <Badge variant="secondary">No records</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{course.code}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-4 text-sm">
                <span className="flex shrink-0 items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> {present} present</span>
                <span className="flex shrink-0 items-center gap-1 text-red-600"><XCircle className="h-4 w-4" /> {absent} absent</span>
              </div>
              {recs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recs.map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        "flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                        r.status === "PRESENT" && "border-green-600/40 text-green-700",
                        r.status === "LATE" && "border-amber-500/40 text-amber-700",
                        r.status === "ABSENT" && "border-red-600/40 text-red-700"
                      )}
                      title={new Date(r.date).toLocaleDateString()}
                    >
                      {r.status === "LATE" && <Clock className="h-3 w-3" />}
                      {new Date(r.date).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
