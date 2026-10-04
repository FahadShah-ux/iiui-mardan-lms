"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch } from "@/src/auth-client";

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  submissions: { status: string }[];
};

type Props = {
  courseId: string;
  assignments: Assignment[];
  onRefresh?: () => void;
};

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

export function AssignmentsManager({ courseId, assignments, onRefresh }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [maxMarks, setMaxMarks] = React.useState("100");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate: new Date(dueDate).toISOString(), maxMarks: Number(maxMarks) }),
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setMaxMarks("100");
      onRefresh?.();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteAssignment(a: Assignment) {
    if (!confirm(`Delete assignment "${a.title}"? This will remove all submissions.`)) return;
    await apiFetch(`/api/courses/${courseId}/assignments?assignmentId=${a.id}`, { method: "DELETE" });
    onRefresh?.();
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> New Assignment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
              <DialogDescription>Add a new assignment for students.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Marks</Label>
                  <Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} min={1} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 && (
        <EmptyState title="No assignments yet" description="Create an assignment for your students." />
      )}

      <div className="space-y-3">
        {assignments.map((a) => {
          const submitted = Array.isArray(a.submissions)
            ? a.submissions.filter((s) => s.status === "SUBMITTED").length
            : 0;
          const graded = Array.isArray(a.submissions)
            ? a.submissions.filter((s) => s.status === "GRADED").length
            : 0;
          const total = a.submissions.length;
          const overdue = isOverdue(a.dueDate);
          return (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(a.dueDate).toLocaleString()} · Max {a.maxMarks} marks
                  </p>
                  {a.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{a.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={overdue ? "destructive" : "secondary"}>{overdue ? "Overdue" : "Open"}</Badge>
                  <Badge variant="outline">{submitted} pending · {graded} graded</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/instructor/grading?assignment=${a.id}`}>Grade ({total})</Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteAssignment(a)} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
