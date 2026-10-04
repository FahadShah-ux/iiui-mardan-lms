"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Slot = {
  id: string;
  day: number;
  start: string;
  end: string;
  room: string;
  courseCode: string;
  courseTitle: string;
  color: string;
};

type TimetableData = { slots: Slot[] };

export default function StudentTimetablePage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<TimetableData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<TimetableData>("/api/student/timetable")
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
        title="Could not load your timetable"
        description={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  if (!data) return <LoadingScreen />;

  const slots = data.slots;
  const hasTimetable = slots.length > 0;

  return (
    <div>
      <PageHeader title="Weekly Timetable" description="Your weekly class schedule." />

      {!hasTimetable && (
        <EmptyState
          title="No timetable available"
          description="Your enrolled courses do not have a published timetable yet. Check back later."
        />
      )}

      {hasTimetable && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((dayName, idx) => {
            const daySlots = slots
              .filter((s) => s.day === idx)
              .sort((a, b) => a.start.localeCompare(b.start));
            return (
              <Card key={dayName}>
                <CardContent className="p-4">
                  <p className="mb-3 font-semibold text-muted-foreground">{dayName}</p>
                  {daySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes</p>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map((s) => (
                        <div key={s.id} className="rounded-lg p-3 text-white" style={{ backgroundColor: s.color }}>
                          <p className="text-sm font-semibold">{s.courseCode}</p>
                          <p className="text-xs opacity-90">{s.courseTitle}</p>
                          <p className="mt-1 text-xs opacity-80">{s.start} â€“ {s.end}</p>
                          <p className="text-xs opacity-80">Room {s.room}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
