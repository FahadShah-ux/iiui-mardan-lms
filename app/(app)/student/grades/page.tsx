"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Award, FileText, TrendingUp } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";

type GradesData = {
  gradedCourses: {
    course: {
      id: string;
      code: string;
      title: string;
      color: string;
      assignments: {
        id: string;
        title: string;
        maxMarks: number;
        submission: { marks: number | null } | null;
      }[];
    };
    totalEarned: number;
    totalMax: number;
    pct: number | null;
  }[];
  allGradedCount: number;
  overallPct: number | null;
  overallEarned: number;
  overallMax: number;
};

export default function StudentGradesPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<GradesData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<GradesData>("/api/student/grades")
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
        title="Could not load your grades"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen />;

  const { gradedCourses, allGradedCount, overallPct, overallEarned, overallMax } = data;

  return (
    <div>
      <PageHeader title="My Grades" description="Track your academic performance." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Graded Assignments" value={allGradedCount} icon={FileText} accent="#990000" />
        <StatCard title="Overall Average" value={overallPct !== null ? `${overallPct}%` : "â€”"} icon={TrendingUp} accent="#0f766e" />
        <StatCard title="Marks Earned" value={`${overallEarned}/${overallMax}`} icon={Award} accent="#b45309" />
      </div>

      {gradedCourses.length === 0 && (
        <EmptyState title="No grades yet" description="Grades will appear here once your instructors mark your assignments." />
      )}

      <div className="space-y-6">
        {gradedCourses.map(({ course, totalEarned, totalMax, pct }) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{course.title}</CardTitle>
                {pct !== null ? (
                  <Badge variant={pct >= 50 ? "success" : "destructive"}>{pct}%</Badge>
                ) : (
                  <Badge variant="secondary">No grades</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{course.code}</p>
            </CardHeader>
            <CardContent>
              {course.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments in this course yet.</p>
              ) : (
                <div className="divide-y">
                  {course.assignments.map((a) => {
                    const sub = a.submission;
                    return (
                      <div key={a.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                        </div>
                        {sub && sub.marks != null ? (
                          <div className="text-right">
                            <Badge variant="success">{sub.marks}/{a.maxMarks}</Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary">Not graded</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 border-t pt-2 text-right text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold">{totalEarned}/{totalMax}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
