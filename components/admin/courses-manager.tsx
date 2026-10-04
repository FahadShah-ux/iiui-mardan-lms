"use client";

import * as React from "react";
import { Plus, Loader2, Trash2, BookOpen, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch } from "@/src/auth-client";

type Course = {
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
};

type People = { id: string; name: string }[];

type RawCourse = {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  semester: string;
  color: string;
  instructor?: { id: string; name: string } | null;
  grade?: { id: string; name: string } | null;
  _count?: { enrollments?: number; assignments?: number };
};

type Props = { initial: Course[]; instructors: People; grades: People };

export function AdminCoursesManager({ initial, instructors, grades }: Props) {
  const [courses, setCourses] = React.useState<Course[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [credits, setCredits] = React.useState("3");
  const [semester, setSemester] = React.useState("Fall 2026");
  const [color, setColor] = React.useState("#990000");
  const [instructorId, setInstructorId] = React.useState("");
  const [gradeId, setGradeId] = React.useState("");

  function load() {
    apiFetch<RawCourse[]>("/api/admin/courses")
      .then((data) => {
        setCourses(data.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          description: c.description,
          credits: c.credits,
          semester: c.semester,
          color: c.color,
          instructorId: c.instructor?.id ?? null,
          instructorName: c.instructor?.name ?? null,
          gradeId: c.grade?.id ?? null,
          gradeName: c.grade?.name ?? null,
          enrollments: c._count?.enrollments ?? 0,
          assignments: c._count?.assignments ?? 0,
        })));
      })
      .catch(() => {});
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, title, description, credits: Number(credits), semester, color, instructorId: instructorId || null, gradeId: gradeId || null }),
      });
      setOpen(false);
      resetForm();
      load();
    } finally {
      setBusy(false);
    }
  }

  async function assign(c: Course, field: "instructorId" | "gradeId", value: string) {
    const body = field === "instructorId" ? { instructorId: value || null } : { gradeId: value || null };
    await apiFetch(`/api/admin/courses/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  async function remove(c: Course) {
    if (!confirm(`Delete course "${c.title}"? This will remove all content and submissions.`)) return;
    await apiFetch(`/api/admin/courses/${c.id}`, { method: "DELETE" });
    load();
  }

  function resetForm() {
    setCode("");
    setTitle("");
    setDescription("");
    setCredits("3");
    setSemester("Fall 2026");
    setColor("#990000");
    setInstructorId("");
    setGradeId("");
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}><Plus className="h-4 w-4" /> New Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Course</DialogTitle>
              <DialogDescription>Add a new course to the catalog.</DialogDescription>
            </DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS-101" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Credits</Label>
                  <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} min={1} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Input value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Instructor</Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Grade</Label>
                <Select value={gradeId} onValueChange={setGradeId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 && <EmptyState title="No courses" description="Create your first course." />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: c.color || "#990000" }}>
                  {c.code.slice(0, 3).toUpperCase()}
                </div>
                <Badge variant="secondary">{c.semester}</Badge>
              </div>
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.code} · {c.credits} credits{c.gradeName ? ` · ${c.gradeName}` : ""}</p>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Instructor</Label>
                  <Select value={c.instructorId ?? ""} onValueChange={(v) => assign(c, "instructorId", v)}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Grade</Label>
                  <Select value={c.gradeId ?? ""} onValueChange={(v) => assign(c, "gradeId", v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t pt-3">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.enrollments}</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {c.assignments}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(c)} title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
