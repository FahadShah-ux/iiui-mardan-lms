"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/src/lib/utils";

type Course = {
  id: string;
  code: string;
  title: string;
  semester: string;
  color: string;
  _count: { enrollments: number; lectures: number; assignments: number };
  enrollments: { progress: number }[];
  grade: { name: string } | null;
};

type Grade = { id: string; name: string };

type CoursesResponse = {
  courses: Course[];
  grades: Grade[];
};

export default function InstructorCoursesPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [courses, setCourses] = React.useState<Course[] | null>(null);
  const [grades, setGrades] = React.useState<Grade[]>([]);
  const [error, setError] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [semester, setSemester] = React.useState("Fall 2026");
  const [credits, setCredits] = React.useState("3");
  const [color, setColor] = React.useState("#990000");
  const [gradeId, setGradeId] = React.useState("");

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<CoursesResponse>("/api/instructor/courses")
      .then((data) => {
        setCourses(data.courses);
        setGrades(data.grades);
      })
      .catch(() => setError(true));
  }, [mounted, user]);

  function resetForm() {
    setCode("");
    setTitle("");
    setDescription("");
    setSemester("Fall 2026");
    setCredits("3");
    setColor("#990000");
    setGradeId("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, title, description, credits: Number(credits), semester, color, gradeId: gradeId || undefined }),
      });
      setOpen(false);
      resetForm();
      const data = await apiFetch<CoursesResponse>("/api/instructor/courses");
      setCourses(data.courses);
      setGrades(data.grades);
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error && !courses) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-destructive">Failed to load courses. Please try again.</p>
      </div>
    );
  }
  if (!courses) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Courses"
        description="Manage your assigned courses, lectures, and assessments."
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} disabled={grades.length === 0}>
                <Plus className="h-4 w-4" /> New Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Course</DialogTitle>
                <DialogDescription>Choose the grade this course is for. It will only be visible to students in that grade.</DialogDescription>
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
                  <Label>Grade</Label>
                  <Select value={gradeId} onValueChange={setGradeId}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={busy || !gradeId}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {courses.length === 0 && (
        <EmptyState
          title="No courses assigned"
          description="Courses will appear here once created or assigned."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const avgProgress = c.enrollments.length
            ? Math.round(c.enrollments.reduce((s, e) => s + e.progress, 0) / c.enrollments.length)
            : 0;
          return (
            <Link key={c.id} href={`/instructor/courses/${c.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ backgroundColor: c.color || "#990000" }}
                    >
                      {c.code.slice(0, 3).toUpperCase()}
                    </div>
                    <Badge variant="secondary">{c.semester}</Badge>
                  </div>
                  <div>
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.code}{c.grade ? ` · ${c.grade.name}` : ""}</p>
                  </div>
                  <div className="mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-[#990000]">{c._count.enrollments}</p>
                      <p className="text-[11px] text-muted-foreground">Students</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{c._count.lectures}</p>
                      <p className="text-[11px] text-muted-foreground">Lectures</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{c._count.assignments}</p>
                      <p className="text-[11px] text-muted-foreground">Assign.</p>
                    </div>
                  </div>
                  <p className={cn("text-xs text-muted-foreground")}>Avg progress: {avgProgress}%</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
