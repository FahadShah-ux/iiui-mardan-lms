"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/src/lib/utils";
import { apiFetch } from "@/src/auth-client";

type Student = { id: string; name: string; email: string };
type Course = { id: string; title: string; code: string; semester: string; students: Student[] };
type Props = { courses: Course[] };

type Status = "PRESENT" | "ABSENT" | "LATE";

const STATUS_LABEL: Record<Status, string> = { PRESENT: "Present", ABSENT: "Absent", LATE: "Late" };

export function AttendancePanel({ courses }: Props) {
  const router = useRouter();
  const [courseId, setCourseId] = React.useState<string>(courses[0]?.id ?? "");
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = React.useState<Record<string, Status>>({});
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Identifies which course+date `statuses` actually describes.
  //
  // Storing the key rather than a boolean is what keeps a failed or superseded
  // load from being mistaken for good data: after switching date, the old key no
  // longer matches, so the roster is neither rendered as loaded nor writable.
  // It also avoids clearing state inside the effect body, which the
  // `react-hooks/set-state-in-effect` rule rejects.
  const selection = `${courseId}|${date}`;
  const [loadedSelection, setLoadedSelection] = React.useState<string | null>(null);
  const loaded = loadedSelection === selection;

  // Guards against an older, slower request overwriting a newer one.
  const requestId = React.useRef(0);

  const course = courses.find((c) => c.id === courseId);

  const loadAttendance = React.useCallback(async () => {
    if (!course) return;
    const mine = ++requestId.current;
    setLoading(true);
    try {
      const data = await apiFetch<{ records: { studentId: string; status: Status }[] }>(
        `/api/courses/${courseId}/attendance?date=${date}`
      );
      if (mine !== requestId.current) return;
      const map: Record<string, Status> = {};
      for (const r of data.records ?? []) {
        map[r.studentId] = r.status;
      }
      setStatuses(map);
      setError(null);
      setLoadedSelection(`${courseId}|${date}`);
    } catch (err) {
      if (mine !== requestId.current) return;
      // `loadedSelection` is deliberately left alone: it still points at the
      // previous selection, so `loaded` is false and Save stays disabled.
      setError(err instanceof Error ? err.message : "Could not load attendance.");
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, [course, courseId, date]);

  React.useEffect(() => {
    const id = setTimeout(() => {
      loadAttendance();
    }, 0);
    return () => clearTimeout(id);
  }, [loadAttendance]);

  async function save() {
    // Never write unless the roster on screen came from a successful load for
    // this exact course and date. Without this, a failed load left `statuses`
    // empty and every student was written as ABSENT.
    if (!course || !loaded) return;
    setBusy(true);
    try {
      const entries = course.students.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? "ABSENT" }));
      await apiFetch(`/api/courses/${courseId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, entries }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const unmarked = (course?.students ?? []).filter((s) => !statuses[s.id]).length;
  const canSave = Boolean(course) && loaded && !busy && !loading;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={save} disabled={!canSave} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {!course && <EmptyState title="No courses" description="No courses assigned." />}

      {course && !loaded && loading && (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading attendance for {date}…
          </CardContent>
        </Card>
      )}

      {course && !loaded && !loading && (
        <Card>
          <CardContent className="p-0">
            <ErrorState
              className="py-8"
              title="Could not load attendance"
              description={error ?? "The attendance records for this course and date could not be loaded, so they cannot be edited or saved."}
              onRetry={loadAttendance}
            />
          </CardContent>
        </Card>
      )}

      {course && loaded && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <p className="font-semibold">{course.title}</p>
                <p className="text-xs text-muted-foreground">{course.students.length} students</p>
              </div>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Badge variant={unmarked > 0 ? "warning" : "success"}>
                  {unmarked > 0 ? `${unmarked} unmarked` : "All marked"}
                </Badge>
              )}
            </div>
            <div className="divide-y">
              {course.students.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No students enrolled.</p>}
              {course.students.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {(["PRESENT", "LATE", "ABSENT"] as Status[]).map((st) => {
                      const active = statuses[s.id] === st;
                      return (
                        <button
                          key={st}
                          onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: st }))}
                          className={cn(
                            "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                            active
                              ? st === "ABSENT"
                                ? "border-destructive bg-destructive text-destructive-foreground"
                                : st === "LATE"
                                  ? "border-amber-500 bg-amber-500 text-white"
                                  : "border-green-600 bg-green-600 text-white"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {STATUS_LABEL[st]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
