"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch, openAuthedInNewTab } from "@/src/auth-client";

type Submission = {
  id: string;
  status: string;
  marks: number | null;
  feedback: string | null;
  text: string | null;
  fileUrl: string | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  submission: Submission | null;
};

type Props = { assignments: Assignment[] };

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

export function AssignmentList({ assignments }: Props) {
  const router = useRouter();
  const [active, setActive] = React.useState<Assignment | null>(null);
  const [text, setText] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    try {
      let fileUrl: string | undefined;
      if (file) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const data = await apiFetch<{ url?: string }>("/api/upload", { method: "POST", body: fd });
        fileUrl = data.url;
      }
      await apiFetch(`/api/assignments/${active.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileUrl }),
      });
      setActive(null);
      setText("");
      setFile(null);
      router.refresh();
    } finally {
      setUploading(false);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {assignments.length === 0 && <EmptyState title="No assignments" description="No assignments have been posted yet." />}

      {assignments.map((a) => {
        const overdue = isOverdue(a.dueDate);
        const graded = a.submission?.status === "GRADED";
        const submitted = a.submission?.status === "SUBMITTED";
        return (
          <Card key={a.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleString()} · Max {a.maxMarks} marks</p>
                {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {graded ? (
                  <Badge variant="success">Grade: {a.submission!.marks}/{a.maxMarks}</Badge>
                ) : submitted ? (
                  <Badge variant="secondary">Submitted</Badge>
                ) : overdue ? (
                  <Badge variant="destructive">Overdue</Badge>
                ) : (
                  <Badge variant="warning">Open</Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => { setActive(a); setText(a.submission?.text ?? ""); setFile(null); }}>
                  {submitted || graded ? "View" : "Submit"}
                </Button>
              </div>
            </CardContent>
            {a.submission?.feedback && (
              <div className="border-t bg-muted/40 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedback</p>
                <p className="text-sm">{a.submission.feedback}</p>
              </div>
            )}
          </Card>
        );
      })}

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) setActive(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>
              {active?.submission?.status === "GRADED"
                ? `Your grade: ${active.submission.marks}/${active.maxMarks}`
                : active?.submission ? "Update your submission." : "Submit your work."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Response Text</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your answer here..." />
            </div>
            <div className="space-y-1.5">
              <Label>Attachment</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file && <span className="text-xs text-muted-foreground">{file.name}</span>}
              </div>
              {active?.submission?.fileUrl && (
                <button
                  onClick={() => openAuthedInNewTab(active.submission!.fileUrl!, "attachment")}
                  className="inline-flex items-center gap-1 text-xs text-[#990000] hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> View current attachment
                </button>
              )}
            </div>
            {active?.submission?.feedback && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Feedback</p>
                <p className="text-sm">{active.submission.feedback}</p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setActive(null)}>Cancel</Button>
              <Button type="submit" disabled={busy || uploading}>
                {(busy || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {active?.submission ? "Update Submission" : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
