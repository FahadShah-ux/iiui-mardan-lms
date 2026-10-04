"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch, openAuthedInNewTab } from "@/src/auth-client";

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

type Props = {
  courses: Course[];
  initialAssignmentId?: string;
};

export function GradingPanel({ courses, initialAssignmentId }: Props) {
  const router = useRouter();

  const [courseId, setCourseId] = React.useState<string>(() => {
    if (initialAssignmentId) {
      const owner = courses.find((c) => c.assignments.some((a) => a.id === initialAssignmentId));
      if (owner) return owner.id;
    }
    return courses[0]?.id ?? "";
  });
  const [assignmentId, setAssignmentId] = React.useState<string>(initialAssignmentId ?? courses[0]?.assignments[0]?.id ?? "");

  const [grading, setGrading] = React.useState<Submission | null>(null);
  const [marks, setMarks] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const course = courses.find((c) => c.id === courseId);
  const assignments = course?.assignments ?? [];
  const selectedAssignment = assignments.find((a) => a.id === assignmentId);
  const submissions = selectedAssignment?.submissions ?? [];

  const courseAssignments = course?.assignments ?? [];

  async function saveGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!grading) return;
    setBusy(true);
    try {
      await apiFetch(`/api/submissions/${grading.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: Number(marks), feedback, status: "GRADED" }),
      });
      setGrading(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select
              value={courseId}
              onValueChange={(v) => {
                setCourseId(v);
                const c = courses.find((x) => x.id === v);
                setAssignmentId(c?.assignments[0]?.id ?? "");
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assignment</Label>
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {courseAssignments.length === 0 && <SelectItem value="" disabled>No assignments</SelectItem>}
                {courseAssignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedAssignment && <EmptyState title="Select a course and assignment" description="Choose an assignment to begin grading." />}

      {selectedAssignment && submissions.length === 0 && (
        <EmptyState title="No submissions yet" description="No students have submitted this assignment." />
      )}

      {submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{s.studentName}</p>
                  <p className="text-xs text-muted-foreground">{s.studentEmail}</p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(s.submittedAt).toLocaleString()}</p>
                  {s.fileUrl && (
                    <button
                      onClick={() => openAuthedInNewTab(s.fileUrl ?? "", "attachment")}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-[#990000] hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> View attachment
                    </button>
                  )}
                  {s.text && <p className="mt-1 rounded-lg bg-muted p-2 text-sm">{s.text}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {s.status === "GRADED" ? (
                    <div className="text-right">
                      <Badge variant="success">Graded: {s.marks}/{selectedAssignment?.maxMarks ?? "-"}</Badge>
                      {s.feedback && <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">{s.feedback}</p>}
                    </div>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setGrading(s); setMarks(s.marks?.toString() ?? ""); setFeedback(s.feedback ?? ""); }}>
                    {s.status === "GRADED" ? "Edit Grade" : "Grade"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!grading} onOpenChange={(o) => { if (!o) setGrading(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {grading?.studentName} · {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveGrade} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Marks (out of {selectedAssignment?.maxMarks ?? "-"})</Label>
              <Input type="number" min={0} max={selectedAssignment?.maxMarks} value={marks} onChange={(e) => setMarks(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional feedback for the student" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGrading(null)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save Grade</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
