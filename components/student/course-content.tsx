"use client";

import * as React from "react";
import { Folder, FileText, Video, LinkIcon, FileArchive, BookOpen, ExternalLink, Download, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/src/lib/utils";
import { getClientToken } from "@/src/auth-client";
import { OfficeViewer } from "@/components/shared/office-viewer";

type Lecture = { id: string; title: string; type: string; contentUrl: string };
type Module = { id: string; title: string; lectures: Lecture[] };
type Props = { modules: Module[]; unassignedLectures: Lecture[] };

const TYPE_LABEL: Record<string, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  LINK: "Link",
  FILE: "File",
};

function LectureTypeIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Video className="h-4 w-4 text-[#c1121f]" />;
  if (type === "PDF") return <FileText className="h-4 w-4 text-[#c1121f]" />;
  if (type === "LINK") return <LinkIcon className="h-4 w-4 text-[#c1121f]" />;
  return <FileArchive className="h-4 w-4 text-[#c1121f]" />;
}

// Extensions that browsers can render natively inline.
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "tiff", "tif"];
const VIDEO_EXT = ["mp4", "webm", "mov", "mkv"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];
const PDF_EXT = ["pdf"];
const TEXT_EXT = ["txt", "csv"];
const OFFICE_EXT = [
  "doc", "docx", "dot", "dotx", "rtf", "odt", "wps",
  "xls", "xlsx", "xlt", "xltx", "ets", "ods", "csv",
  "ppt", "pptx", "pot", "potx", "dps", "odp",
];
const OFFICE_VIEWABLE_EXT = ["xlsx", "xls", "docx", "dotx", "pptx"];

function getExt(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  const m = clean.match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function typeFromUrl(type: string, url: string): string {
  if (type === "VIDEO") return "VIDEO";
  if (type === "LINK") return "LINK";
  const ext = getExt(url);
  if (ext && VIDEO_EXT.includes(ext)) return "VIDEO";
  if (ext && IMAGE_EXT.includes(ext)) return "IMAGE";
  if (ext && AUDIO_EXT.includes(ext)) return "AUDIO";
  if (ext && TEXT_EXT.includes(ext)) return "TEXT";
  // "PDF"/"FILE" types and any extension -> default to file viewer below.
  return "FILE";
}

function useAuthedSrc(url: string): string | null {
  const [apiSrc, setApiSrc] = React.useState<string | null>(null);

  const isApiFile =
    url.startsWith("/api/files/") ||
    (typeof window !== "undefined" &&
      url.startsWith(window.location.origin + "/api/files/"));

  React.useEffect(() => {
    if (!isApiFile) return;

    let objectUrl: string | null = null;
    let cancelled = false;
    const controller = new AbortController();
    const token = getClientToken();
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setApiSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setApiSrc(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, isApiFile]);

  if (!isApiFile) return url;
  return apiSrc;
}

function FilePanel({
  url, title,
}: { url: string; title: string }) {
  const src = useAuthedSrc(url);
  const viewUrl = src ?? url;
  const ext = getExt(url);
  const isOffice = !!ext && OFFICE_EXT.includes(ext);
  const [downloading, setDownloading] = React.useState(false);

  async function download() {
    if (!url) return;
    const token = getClientToken();
    try {
      setDownloading(true);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = title || `${ext || "file"}.${ext || "bin"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted p-6 text-center">
        <FileArchive className="mx-auto mb-2 h-10 w-10 text-[#c1121f]" />
        <p className="font-medium">{title}</p>
        {ext && <p className="text-xs text-muted-foreground">.{ext.toUpperCase()} file</p>}
        {isOffice && (
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            This file is stored privately. Use <span className="font-medium">Download</span> to open it locally.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#990000] px-4 text-sm font-medium text-primary-foreground hover:bg-[#7a0000]"
          >
            <ExternalLink className="h-4 w-4" /> Open in browser
          </a>
          <button
            onClick={download}
            disabled={downloading}
            className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
      {ext && !OFFICE_VIEWABLE_EXT.includes(ext) && PDF_EXT.includes(ext) && (
        <iframe title={title} src={viewUrl} className="h-[70vh] w-full rounded-lg border bg-white" />
      )}
    </div>
  );
}

function Player({ type, url, title }: { type: string; url: string; title: string }) {
  const view = typeFromUrl(type, url);
  const src = useAuthedSrc(url);
  const mediaUrl = src ?? url;

  if (view === "VIDEO") {
    return (
      <div className="aspect-video overflow-hidden rounded-lg border bg-black">
        <video key={url} src={mediaUrl} controls className="h-full w-full" />
      </div>
    );
  }
  if (view === "IMAGE") {
    return (
      <div className="overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={url} src={mediaUrl} alt={title} className="max-h-[70vh] w-full object-contain" />
      </div>
    );
  }
  if (view === "AUDIO") {
    return (
      <div className="rounded-lg border bg-muted p-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-[#c1121f]" /> {title}
        </p>
        <audio key={url} src={mediaUrl} controls className="w-full" />
      </div>
    );
  }
  if (view === "TEXT") {
    return <iframe key={url} title={title} src={mediaUrl} className="h-[70vh] w-full rounded-lg border bg-white" />;
  }
  if (type === "LINK" || view === "LINK") {
    return (
      <div className="rounded-lg border bg-muted p-6 text-center">
        <LinkIcon className="mx-auto mb-2 h-10 w-10 text-[#c1121f]" />
        <p className="font-medium">{title}</p>
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-[#990000] hover:underline">
          Open external link
        </a>
      </div>
    );
  }
  return <FilePanel url={url} title={title} />;
}

export function CourseContentPlayer({ modules, unassignedLectures }: Props) {
  const [active, setActive] = React.useState<Lecture | null>(null);
  const [officeView, setOfficeView] = React.useState<Lecture | null>(null);
  const [listOpen, setListOpen] = React.useState(true);

  const allLectures = React.useMemo(
    () => [...unassignedLectures, ...modules.flatMap((m) => m.lectures)],
    [modules, unassignedLectures]
  );

  React.useEffect(() => {
    if (allLectures.length > 0 && !active) {
      const id = setTimeout(() => setActive(allLectures[0]), 0);
      return () => clearTimeout(id);
    }
  }, [allLectures, active]);

  function isOfficeFile(l: Lecture): boolean {
    const ext = getExt(l.contentUrl);
    return !!ext && OFFICE_VIEWABLE_EXT.includes(ext);
  }

  function onSelect(l: Lecture) {
    setActive(l);
    setOfficeView(isOfficeFile(l) ? l : null);
  }

  const list = (
    <div className="space-y-3">
      {modules.map((m) => (
        <div key={m.id} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <Folder className="h-4 w-4 text-[#990000]" />
            <span className="text-sm font-semibold">{m.title}</span>
            <Badge variant="secondary" className="ml-auto">{m.lectures.length}</Badge>
          </div>
          <div className="space-y-1">
            {m.lectures.map((l) => (
              <button
                key={l.id}
                onClick={() => onSelect(l)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active?.id === l.id ? "bg-[#990000]/10 text-[#990000]" : "hover:bg-muted"
                )}
              >
                <LectureTypeIcon type={l.type} />
                <span className="truncate font-medium">{l.title}</span>
              </button>
            ))}
            {m.lectures.length === 0 && <p className="text-xs text-muted-foreground">No lectures.</p>}
          </div>
        </div>
      ))}

      {unassignedLectures.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Resources</p>
          <div className="space-y-1">
            {unassignedLectures.map((l) => (
              <button
                key={l.id}
                onClick={() => onSelect(l)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active?.id === l.id ? "bg-[#990000]/10 text-[#990000]" : "hover:bg-muted"
                )}
              >
                <LectureTypeIcon type={l.type} />
                <span className="truncate font-medium">{l.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const player = active ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-[#990000]" />
        <h3 className="font-semibold">{active.title}</h3>
        <Badge variant="secondary" className="ml-auto">{TYPE_LABEL[active.type] ?? active.type}</Badge>
      </div>
      <Player type={active.type} url={active.contentUrl} title={active.title} />
    </div>
  ) : null;

  return (
    <>
      <div className="mb-3 lg:hidden">
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm font-medium"
        >
          {listOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Lectures ({allLectures.length})
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className={`lg:col-span-2 lg:block ${listOpen ? "block" : "hidden"}`}>{list}</div>
        <div className="lg:col-span-3">
          {player ?? (
            <EmptyState title="Select a lecture" description="Choose a lecture from the list to begin." />
          )}
        </div>
      </div>
      {officeView && (
        <OfficeViewer url={officeView.contentUrl} title={officeView.title} onClose={() => setOfficeView(null)} />
      )}
    </>
  );
}
