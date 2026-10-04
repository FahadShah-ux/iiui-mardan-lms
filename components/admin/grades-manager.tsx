"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Trash2, Layers, Users, UserCog, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiFetch } from "@/src/auth-client";
import { gradeSections } from "@/src/grade-utils";

type Grade = {
  id: string;
  name: string;
  order: number;
  memberCount: number;
  courseCount: number;
};

type Props = { initial: Grade[] };

type Member = {
  id: string;
  name: string;
  email: string;
  section: string | null;
  status: string;
  courses: { code: string; title: string }[];
};

type GradeMembers = {
  students: Member[];
  instructors: Member[];
};

function MemberCard({ m }: { m: Member }) {
  const initials = m.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{m.name}</p>
          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
        </div>
        <Badge variant={m.status === "ACTIVE" ? "success" : "destructive"}>{m.status}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{m.section ?? "No section"}</Badge>
        {m.courses.slice(0, 4).map((c) => (
          <Badge key={c.code} variant="outline" title={c.title}>{c.code}</Badge>
        ))}
        {m.courses.length > 4 && (
          <span className="text-xs text-muted-foreground">+{m.courses.length - 4} more</span>
        )}
      </div>
    </div>
  );
}

function MembersDialog({
  grade,
  data,
  loading,
  error,
  onClose,
  onRetry,
}: {
  grade: Grade | null;
  data: GradeMembers | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <Dialog open={grade !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-4xl">
        {grade && (
          <>
            <DialogHeader>
              <DialogTitle>{grade.name} — Members</DialogTitle>
              <DialogDescription>
                {data
                  ? `${data.students.length} student${data.students.length === 1 ? "" : "s"} and ${data.instructors.length} instructor${data.instructors.length === 1 ? "" : "s"} in this grade.`
                  : "Loading members…"}
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading members...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-destructive">Could not load members for {grade.name}.</p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            ) : data ? (
              <Tabs defaultValue="students">
                <TabsList className="justify-start sm:justify-center">
                  <TabsTrigger value="students">
                    <Users className="mr-1.5 h-4 w-4" /> Students ({data.students.length})
                  </TabsTrigger>
                  <TabsTrigger value="instructors">
                    <UserCog className="mr-1.5 h-4 w-4" /> Instructors ({data.instructors.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="students">
                  {data.students.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No students in this grade.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {data.students.map((m) => <MemberCard key={m.id} m={m} />)}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="instructors">
                  {data.instructors.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No instructors assigned to this grade.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {data.instructors.map((m) => <MemberCard key={m.id} m={m} />)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function GradesManager({ initial }: Props) {
  const router = useRouter();
  const [grades, setGrades] = React.useState<Grade[]>(initial);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Grade | null>(null);
  const [name, setName] = React.useState("");
  const [order, setOrder] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [viewId, setViewId] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<Record<string, GradeMembers>>({});
  const [viewLoading, setViewLoading] = React.useState(false);
  const [viewError, setViewError] = React.useState(false);
  const fetchSeq = React.useRef(0);

  const viewGrade = grades.find((g) => g.id === viewId) ?? null;
  const viewData = viewId ? members[viewId] ?? null : null;

  async function loadMembers(id: string, { force = false } = {}) {
    if (members[id] && !force) return;
    const seq = ++fetchSeq.current;
    setViewLoading(true);
    setViewError(false);
    try {
      const data = await apiFetch<GradeMembers>(`/api/admin/grades/${id}/members`);
      if (seq !== fetchSeq.current) return;
      setMembers((prev) => ({ ...prev, [id]: data }));
    } catch {
      if (seq === fetchSeq.current) setViewError(true);
    } finally {
      if (seq === fetchSeq.current) setViewLoading(false);
    }
  }

  function openMembers(id: string) {
    setViewId(id);
    void loadMembers(id);
  }

  const resetForm = () => {
    setName("");
    setOrder("");
    setEditing(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/grades/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, order: order === "" ? undefined : Number(order) }),
        });
      } else {
        await apiFetch("/api/admin/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, order: order === "" ? undefined : Number(order) }),
        });
      }
      setOpen(false);
      resetForm();
      const next = await apiFetch<Grade[]>("/api/admin/grades");
      setGrades(next);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save grade");
    } finally {
      setSaving(false);
    }
  }

  async function remove(g: Grade) {
    if (!confirm(`Delete grade "${g.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/grades/${g.id}`, { method: "DELETE" });
      setGrades((prev) => prev.filter((x) => x.id !== g.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete grade");
    }
  }

  const actions = (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button onClick={() => resetForm()}>
          <Plus className="h-4 w-4" /> Add Grade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Grade" : "Add Grade"}</DialogTitle>
          <DialogDescription>{editing ? "Update the grade details." : "Create a new grade (class)."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Grade Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 5" required />
          </div>
          <div className="space-y-1.5">
            <Label>Order</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Leave blank to append" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="h-4 w-4 text-muted-foreground" />
            {grades.length} grades
          </div>
          {actions}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No grades yet.</TableCell></TableRow>
              )}
              {grades.map((g) => {
                const sections = gradeSections(g.name);
                return (
                  <TableRow key={g.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{g.name}</span>
                        {g.order === 0 && <Badge variant="outline">Nursery</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sections.length ? (
                        <div className="flex gap-1">
                          {sections.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{g.memberCount}</TableCell>
                    <TableCell>{g.courseCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openMembers(g.id)} title="View members">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(g); setName(g.name); setOrder(String(g.order)); setOpen(true); }} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(g)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y border-t md:hidden">
          {grades.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No grades yet.</p>
          )}
          {grades.map((g) => {
            const sections = gradeSections(g.name);
            return (
              <div key={g.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{g.name}</span>
                    {g.order === 0 && <Badge variant="outline">Nursery</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {sections.length
                      ? sections.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.memberCount} students · {g.courseCount} courses
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openMembers(g.id)} title="View members">
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(g); setName(g.name); setOrder(String(g.order)); setOpen(true); }} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(g)} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <MembersDialog
        grade={viewGrade}
        data={viewData}
        loading={viewLoading}
        error={viewError}
        onClose={() => setViewId(null)}
        onRetry={() => viewId && void loadMembers(viewId, { force: true })}
      />
    </Card>
  );
}