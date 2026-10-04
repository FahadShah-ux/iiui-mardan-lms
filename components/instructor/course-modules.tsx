"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Folder, FileText, Video, LinkIcon, FileArchive, Loader2, Trash2, ExternalLink, GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { OfficeViewer } from "@/components/shared/office-viewer";
import { apiFetch, openAuthedInNewTab } from "@/src/auth-client";

type Lecture = {
  id: string;
  title: string;
  type: string;
  contentUrl: string;
};

type Module = {
  id: string;
  title: string;
  order: number;
  lectures: Lecture[];
};

type Props = {
  courseIdForApi: string;
  modules: Module[];
  unassignedLectures: Lecture[];
  onRefresh?: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  LINK: "Link",
  FILE: "File",
};

const EXT_TO_TYPE: Record<string, string> = {
  mp4: "VIDEO",
  webm: "VIDEO",
  mov: "VIDEO",
  mkv: "VIDEO",
  pdf: "PDF",
  doc: "FILE",
  docx: "FILE",
  dot: "FILE",
  dotx: "FILE",
  rtf: "FILE",
  odt: "FILE",
  wps: "FILE",
  txt: "FILE",
  csv: "FILE",
  xls: "FILE",
  xlsx: "FILE",
  xlt: "FILE",
  xltx: "FILE",
  ets: "FILE",
  ods: "FILE",
  ppt: "FILE",
  pptx: "FILE",
  pot: "FILE",
  potx: "FILE",
  dps: "FILE",
  odp: "FILE",
  png: "FILE",
  jpg: "FILE",
  jpeg: "FILE",
  gif: "FILE",
  bmp: "FILE",
  webp: "FILE",
  tiff: "FILE",
  tif: "FILE",
  mp3: "FILE",
  wav: "FILE",
  m4a: "FILE",
  aac: "FILE",
  ogg: "FILE",
  flac: "FILE",
  zip: "FILE",
  rar: "FILE",
  "7z": "FILE",
};

const ACCEPT = ".pdf,.doc,.docx,.dot,.dotx,.rtf,.odt,.wps,.txt,.csv,.xls,.xlsx,.xlt,.xltx,.ets,.ods,.ppt,.pptx,.pot,.potx,.dps,.odp,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.webm,.mov,.mkv,.zip,.rar,.7z";

function typeFromFile(f: File): string {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_TYPE[ext] ?? "FILE";
}

const OFFICE_VIEWABLE_EXT = ["xlsx", "xls", "docx", "dotx", "pptx"];

function getExt(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  const m = clean.match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function isViewableOffice(url: string): boolean {
  return OFFICE_VIEWABLE_EXT.includes(getExt(url));
}

function LectureIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Video className="h-4 w-4 text-[#c1121f]" />;
  if (type === "PDF") return <FileText className="h-4 w-4 text-[#c1121f]" />;
  if (type === "LINK") return <LinkIcon className="h-4 w-4 text-[#c1121f]" />;
  return <FileArchive className="h-4 w-4 text-[#c1121f]" />;
}

export function CourseModulesManager({ courseIdForApi, modules, unassignedLectures, onRefresh }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const [moduleOpen, setModuleOpen] = React.useState(false);
  const [moduleTitle, setModuleTitle] = React.useState("");

  const [lectureOpen, setLectureOpen] = React.useState(false);
  const [lectureTitle, setLectureTitle] = React.useState("");
  const [lectureType, setLectureType] = React.useState("LINK");
  const [lectureUrl, setLectureUrl] = React.useState("");
  const [lectureFile, setLectureFile] = React.useState<File | null>(null);
  const [moduleId, setModuleId] = React.useState<string>("");

  async function refresh() {
    onRefresh?.();
    router.refresh();
  }

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/api/courses/${courseIdForApi}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: moduleTitle }),
      });
      setModuleOpen(false);
      setModuleTitle("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteModule(m: Module) {
    if (!confirm(`Delete module "${m.title}"? Its lectures will become unassigned.`)) return;
    await apiFetch(`/api/courses/${courseIdForApi}/modules?moduleId=${m.id}`, { method: "DELETE" });
    await refresh();
  }

  async function addLecture(e: React.FormEvent) {
    e.preventDefault();
    if (!lectureTitle.trim()) return;
    if (!lectureUrl.trim() && !lectureFile) {
      alert("Please upload a file or enter a content URL.");
      return;
    }
    setBusy(true);
    try {
      let contentUrl = lectureUrl;
      let type = lectureType;
      if (lectureFile) {
        const fd = new FormData();
        fd.append("file", lectureFile);
        try {
          const data = await apiFetch<{ url: string }>("/api/upload", { method: "POST", body: fd });
          contentUrl = data.url;
          type = typeFromFile(lectureFile);
        } catch (err) {
          alert((err as Error).message ?? "Upload failed");
          return;
        }
      }
      await apiFetch(`/api/courses/${courseIdForApi}/lectures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: lectureTitle, type, contentUrl, moduleId: moduleId || null }),
      });
      setLectureOpen(false);
      setLectureTitle("");
      setLectureUrl("");
      setLectureFile(null);
      setModuleId("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteLecture(lectureId: string) {
    if (!confirm("Delete this lecture?")) return;
    await apiFetch(`/api/courses/${courseIdForApi}/lectures?lectureId=${lectureId}`, { method: "DELETE" });
    await refresh();
  }

  const [viewing, setViewing] = React.useState<Lecture | null>(null);

  const [orderedModules, setOrderedModules] = React.useState<Module[]>(modules);
  if (orderedModules !== modules) setOrderedModules(modules);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function openLecture(l: Lecture) {
    if (isViewableOffice(l.contentUrl)) {
      setViewing(l);
    } else {
      openAuthedInNewTab(l.contentUrl, l.title);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedModules.findIndex((m) => m.id === active.id);
    const newIndex = orderedModules.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedModules, oldIndex, newIndex);
    setOrderedModules(reordered);
    setBusy(true);
    try {
      await Promise.all(
        reordered.map((m, i) =>
          apiFetch(`/api/courses/${courseIdForApi}/modules`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleId: m.id, order: i }),
          })
        )
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Add Module</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Module</DialogTitle>
              <DialogDescription>Group related lectures into a module.</DialogDescription>
            </DialogHeader>
            <form onSubmit={addModule} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Module Title</Label>
                <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="e.g. Week 1 - Introduction" required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModuleOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={lectureOpen} onOpenChange={setLectureOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> Add Lecture / Resource</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Lecture / Resource</DialogTitle>
              <DialogDescription>Provide a video URL, PDF link, or URL resource.</DialogDescription>
            </DialogHeader>
            <form onSubmit={addLecture} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={lectureTitle} onChange={(e) => setLectureTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={lectureType} onValueChange={setLectureType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="LINK">URL Link</SelectItem>
                    <SelectItem value="FILE">File</SelectItem>
                  </SelectContent>
                </Select>
                {lectureFile && (
                  <p className="text-xs text-muted-foreground">
                    Detected type from file: {TYPE_LABEL[typeFromFile(lectureFile)] ?? "File"}
                  </p>
                )}
                {lectureUrl && lectureType === "LINK" && (
                  <p className="text-xs text-muted-foreground">Will be saved as a URL link.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Upload File</Label>
                <Input
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setLectureFile(f);
                    if (f) {
                      setLectureUrl("");
                      setLectureType(typeFromFile(f));
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">PDF, documents, spreadsheets, images, audio & video (max 70MB).</p>
              </div>
              <div className="space-y-1.5">
                <Label>Or Content URL</Label>
                <Input value={lectureUrl} onChange={(e) => { setLectureUrl(e.target.value); if (e.target.value) setLectureFile(null); }} placeholder="https://... or /api/files/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Module (optional)</Label>
                <Select value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger><SelectValue placeholder="No module" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No module</SelectItem>
                    {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLectureOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {modules.length === 0 && unassignedLectures.length === 0 && (
        <EmptyState title="No content yet" description="Add a module and lecture to get started." />
      )}

      {modules.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={orderedModules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {orderedModules.map((m) => (
                <SortableModuleCard
                  key={m.id}
                  m={m}
                  disabled={busy}
                  onDelete={deleteModule}
                  onDeleteLecture={deleteLecture}
                  onOpenLecture={openLecture}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {unassignedLectures.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 font-semibold text-muted-foreground">Unassigned Lectures</p>
            <div className="space-y-2">
              {unassignedLectures.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <LectureIcon type={l.type} />
                    <button
                      onClick={() => openLecture(l)}
                      className="truncate text-sm font-medium hover:text-[#990000] hover:underline"
                      title={`View ${l.title}`}
                    >
                      {l.title}
                    </button>
                    <Badge variant="secondary" className="ml-1">{TYPE_LABEL[l.type] ?? l.type}</Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openLecture(l)} title="View in browser">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteLecture(l.id)} title="Delete lecture">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewing && <OfficeViewer url={viewing.contentUrl} title={viewing.title} onClose={() => setViewing(null)} />}
    </div>
  );
}

function SortableModuleCard({
  m, disabled, onDelete, onDeleteLecture, onOpenLecture,
}: {
  m: Module;
  disabled: boolean;
  onDelete: (m: Module) => void;
  onDeleteLecture: (id: string) => void;
  onOpenLecture: (l: Lecture) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-90 shadow-2xl ring-2 ring-[#990000]" : undefined}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              disabled={disabled}
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-default disabled:opacity-50"
              title="Drag to reorder"
              aria-label={`Reorder ${m.title}`}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <Folder className="h-5 w-5 text-[#990000]" />
            <span className="font-semibold">{m.title}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDelete(m)} title="Delete module">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <div className="space-y-2">
          {m.lectures.length === 0 && <p className="text-sm text-muted-foreground">No lectures in this module.</p>}
          {m.lectures.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div className="flex min-w-0 items-center gap-2">
                <LectureIcon type={l.type} />
                <button
                  onClick={() => onOpenLecture(l)}
                  className="truncate text-sm font-medium hover:text-[#990000] hover:underline"
                  title={`View ${l.title}`}
                >
                  {l.title}
                </button>
                <Badge variant="secondary" className="ml-1">{TYPE_LABEL[l.type] ?? l.type}</Badge>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onOpenLecture(l)} title="View in browser">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteLecture(l.id)} title="Delete lecture">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
