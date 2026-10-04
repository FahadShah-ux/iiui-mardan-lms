"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiFetch } from "@/src/auth-client";
import { gradeSections } from "@/src/grade-utils";

type Grade = { id: string; name: string };
type User = {
  id: string; name: string; email: string; role: string; status: string;
  section: string | null;
  grade: Grade | null;
  instructorGradeIds: string[];
  createdAt: string;
};

const ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT"] as const;

export function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [grades, setGrades] = React.useState<Grade[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>("ALL");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [saving, setSaving] = React.useState(false);

  // form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<string>("STUDENT");
  const [gradeId, setGradeId] = React.useState<string>("");
  const [section, setSection] = React.useState<string>("");
  const [instructorGradeIds, setInstructorGradeIds] = React.useState<string[]>([]);

  async function load() {
    try {
      const [u, g] = await Promise.all([
        apiFetch<User[]>("/api/admin/users"),
        apiFetch<Grade[]>("/api/admin/grades"),
      ]);
      setUsers(u);
      setGrades(g);
      setError(null);
    } catch {
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const id = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("STUDENT");
    setGradeId("");
    setSection("");
    setInstructorGradeIds([]);
  };

  function toggleInstructorGrade(grade: Grade) {
    setInstructorGradeIds((prev) =>
      prev.includes(grade.id)
        ? prev.filter((id) => id !== grade.id)
        : [...prev, grade.id]
    );
  }

  const sections = gradeId
    ? gradeSections(grades.find((g) => g.id === gradeId)?.name ?? "")
    : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isInstructor = role === "INSTRUCTOR";
      const body = {
        name,
        email,
        password,
        role,
        gradeId,
        section,
        ...(isInstructor ? { instructorGradeIds } : { instructorGradeIds: [] }),
      };
      if (editing) {
        await apiFetch(`/api/admin/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      setOpen(false);
      resetForm();
      setEditing(null);
      load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: User) {
    const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await apiFetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function remove(u: User) {
    if (!confirm(`Delete user ${u.name}? This cannot be undone.`)) return;
    await apiFetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    load();
  }

  const filtered = filter === "ALL" ? users : users.filter((u) => u.role === filter);

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Add, edit, or deactivate student and faculty accounts."
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); resetForm(); }}>
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
                <DialogDescription>{editing ? "Update account details." : "Create a new account."}</DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {!editing && (
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Default: password123" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => { setRole(v); setSection(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Grade</Label>
                  <Select value={gradeId} onValueChange={(v) => { setGradeId(v); setSection(""); }}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {sections.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Section</Label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                      <SelectContent>
                        {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {role === "INSTRUCTOR" && (
                  <div className="space-y-1.5">
                    <Label>Assigned Grades {editing ? "" : "(optional)"}</Label>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {grades.map((g) => {
                        const checked = instructorGradeIds.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            onClick={() => toggleInstructorGrade(g)}
                            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${checked ? "border-[#990000] bg-[#990000]/10" : "border-border"}`}
                          >
                            <span aria-hidden className={`h-3 w-3 rounded-sm border ${checked ? "border-[#990000] bg-[#990000]" : "border-muted-foreground"}`} />
                            {g.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">Courses can be created for any of these grades.</p>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? "Save" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          {["ALL", ...ROLES].map((r) => (
            <Button
              key={r}
              variant={filter === r ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(r)}
            >
              {r}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="p-6 text-center text-sm text-destructive">{error}</p>
          ) : (
            <>
              {filtered.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>
              )}
              <div className="divide-y md:hidden">
                {filtered.map((u) => (
                  <div key={u.id} className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs">{u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>{u.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{u.role}</Badge>
                      {u.grade ? (
                        <Badge variant="outline">{u.grade.name}{u.section ? ` · ${u.section}` : ""}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="flex justify-end gap-1 border-t pt-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(u); setName(u.name); setEmail(u.email); setRole(u.role); setGradeId(u.grade?.id ?? ""); setSection(u.section ?? ""); setInstructorGradeIds(u.instructorGradeIds ?? []); setOpen(true); }} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(u)} title={u.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                        {u.status === "ACTIVE" ? <Ban className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(u)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No users found.</TableCell></TableRow>
                    )}
                    {filtered.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px]">{u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{u.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                        <TableCell>
                          {u.grade ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge variant="outline">{u.grade.name}</Badge>
                              {u.section && <Badge variant="secondary">{u.section}</Badge>}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>{u.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditing(u); setName(u.name); setEmail(u.email); setRole(u.role); setGradeId(u.grade?.id ?? ""); setSection(u.section ?? ""); setInstructorGradeIds(u.instructorGradeIds ?? []); setOpen(true); }} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toggleStatus(u)} title={u.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                              {u.status === "ACTIVE" ? <Ban className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(u)} title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
