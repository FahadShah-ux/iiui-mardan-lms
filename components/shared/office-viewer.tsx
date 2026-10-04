"use client";

import * as React from "react";
import { X, Download, FileSpreadsheet, FileText, Presentation, AlertTriangle } from "lucide-react";
import { getClientToken, downloadAuthed } from "@/src/auth-client";
import { cn } from "@/src/lib/utils";

const SPREADSHEET_EXT = ["xlsx", "xls"];
const WORD_EXT = ["docx", "dotx"];
const SLIDES_EXT = ["pptx"];

type OfficeStyle = { icon: React.ComponentType<{ className?: string }>; iconColor: string; badgeBg: string };

const OFFICE_STYLES: Record<string, OfficeStyle> = {
  xlsx: { icon: FileSpreadsheet, iconColor: "text-emerald-600", badgeBg: "bg-[#107c41]" },
  xls: { icon: FileSpreadsheet, iconColor: "text-emerald-600", badgeBg: "bg-[#107c41]" },
  docx: { icon: FileText, iconColor: "text-blue-600", badgeBg: "bg-[#2563eb]" },
  dotx: { icon: FileText, iconColor: "text-blue-600", badgeBg: "bg-[#2563eb]" },
  pptx: { icon: Presentation, iconColor: "text-orange-600", badgeBg: "bg-[#ea580c]" },
};

function getExt(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  const m = clean.match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

async function fetchAuthedArrayBuffer(url: string): Promise<ArrayBuffer> {
  const token = getClientToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to load file");
  return res.arrayBuffer();
}

type SheetCell = { v: string; rowSpan?: number; colSpan?: number };

type SheetData = {
  sheetNames: string[];
  active: string;
  numRows: number;
  numCols: number;
  colLetters: string[];
  colWidths: number[];
  rows: SheetCell[][];
};

const MAX_SPREADSHEET_CELLS = 60000;

function parseSheet(XLSX: typeof import("xlsx"), wb: import("xlsx").WorkBook, sheetName: string): SheetData {
  const ws = wb.Sheets[sheetName];
  const range = ws && ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : null;
  if (!range) {
    return { sheetNames: wb.SheetNames.slice(), active: sheetName, numRows: 0, numCols: 0, colLetters: [], colWidths: [], rows: [] };
  }
  const numCols = range.e.c - range.s.c + 1;
  const numRows = range.e.r - range.s.r + 1;

  if (numCols * numRows > MAX_SPREADSHEET_CELLS) {
    throw new Error("Sheet too large to preview in the browser");
  }

  const colLetters: string[] = [];
  const colWidths: number[] = [];
  for (let c = 0; c < numCols; c++) {
    colLetters.push(XLSX.utils.encode_col(range.s.c + c));

    let width = 0;
    const colDef = ws["!cols"]?.[range.s.c + c];
    if (colDef && typeof colDef.wch === "number") {
      width = colDef.wch * 7.5 + 16;
    } else {
      let longest = colLetters[c].length;
      for (let r = 0; r < numRows; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r: range.s.r + r, c: range.s.c + c })];
        if (cell && cell.v != null) {
          const txt = String(cell.v);
          if (txt.length > longest) longest = txt.length;
        }
      }
      width = longest * 8 + 20;
    }
    colWidths.push(Math.min(360, Math.max(80, Math.round(width))));
  }

  const originMap: Record<string, { rs: number; cs: number }> = {};
  const coveredSet = new Set<string>();
  const merges = ws["!merges"] ?? [];
  for (const m of merges) {
    originMap[`${m.s.r}:${m.s.c}`] = { rs: m.e.r - m.s.r + 1, cs: m.e.c - m.s.c + 1 };
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (r === m.s.r && c === m.s.c) continue;
        coveredSet.add(`${r}:${c}`);
      }
    }
  }

  const rows: SheetCell[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: SheetCell[] = [];
    for (let c = 0; c < numCols; c++) {
      const rIdx = range.s.r + r;
      const cIdx = range.s.c + c;
      const key = `${rIdx}:${cIdx}`;
      if (coveredSet.has(key)) continue;
      const cell = ws[XLSX.utils.encode_cell({ r: rIdx, c: cIdx })];
      const o = originMap[key];
      row.push({
        v: cell ? XLSX.utils.format_cell(cell) : "",
        rowSpan: o?.rs,
        colSpan: o?.cs,
      });
    }
    rows.push(row);
  }

  return { sheetNames: wb.SheetNames.slice(), active: sheetName, numRows, numCols, colLetters, colWidths, rows };
}

const excelScrollStyles = `  .excel-scroll { scrollbar-width: thin; scrollbar-color: #b0b4bd transparent; }
  .excel-scroll::-webkit-scrollbar { width: 12px; height: 12px; }
  .excel-scroll::-webkit-scrollbar-track { background: #f3f4f6; }
  .excel-scroll::-webkit-scrollbar-thumb { background: #c5c9d0; border-radius: 6px; border: 2px solid #f3f4f6; }
  .excel-scroll::-webkit-scrollbar-thumb:hover { background: #a8adb5; }
  .excel-scroll::-webkit-scrollbar-corner { background: #f3f4f6; }
`;

function ExcelGrid({ data }: { data: SheetData }) {
  return (
    <div className="excel-scroll h-full w-full overflow-auto">
      <table className="border-separate border-spacing-0 text-[13px]">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 h-8 w-10 border-b border-r border-[#d0d3d9] bg-[#e8eaed]" />
            {data.colLetters.map((letter, ci) => (
              <th
                key={ci}
                className="sticky top-0 z-20 h-8 border-b border-r border-[#d0d3d9] bg-[#f0f1f3] px-2 text-center text-xs font-semibold text-[#444]"
                style={{ minWidth: data.colWidths[ci] ?? 80, maxWidth: data.colWidths[ci] ?? 80 }}
              >
                {letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri}>
              <th className="sticky left-0 z-10 h-8 w-10 border-b border-r border-[#d0d3d9] bg-[#f6f7f8] px-1 text-right text-xs font-normal text-[#777]">
                {ri + 1}
              </th>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  rowSpan={cell.rowSpan}
                  colSpan={cell.colSpan}
                  title={cell.v}
                  className="h-8 whitespace-nowrap border-b border-r border-[#e5e7eb] bg-white px-2 text-foreground"
                  style={{ minWidth: data.colWidths[ci] ?? 80, maxWidth: data.colWidths[ci] ?? 80, overflow: "hidden" }}
                >
                  {cell.v || "\u00A0"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExcelBody({
  url, title, ext, buffer,
}: {
  url: string;
  title: string;
  ext: string;
  buffer: ArrayBuffer;
}) {
  const [status, setStatus] = React.useState<"loading" | "error" | "ready">("loading");
  const [data, setData] = React.useState<SheetData | null>(null);
  const stateRef = React.useRef<{ XLSX: typeof import("xlsx"); wb: import("xlsx").WorkBook } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
        if (cancelled) return;
        const first = wb.SheetNames[0] ?? "";
        stateRef.current = { XLSX, wb };
        if (cancelled) return;
        setData(parseSheet(XLSX, wb, first));
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buffer]);

  const filename = (title?.trim() || "spreadsheet") + ext;

  if (status === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[#f7f8fa]">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-[#e5e7eb]" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#990000]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Rendering Preview...</p>
          <p className="mt-1 text-xs text-muted-foreground">Preparing the spreadsheet grid for you.</p>
        </div>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#f7f8fa] px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Preview unavailable</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            This spreadsheet couldn&apos;t be rendered in the browser. Download the file to open it locally.
          </p>
        </div>
        <button
          onClick={() => downloadAuthed(url, filename)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#990000] px-5 text-sm font-medium text-white transition-colors hover:bg-[#7a0000]"
        >
          <Download className="h-4 w-4" /> Download File
        </button>
      </div>
    );
  }

  function switchSheet(name: string) {
    const s = stateRef.current;
    if (s) setData(parseSheet(s.XLSX, s.wb, name));
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#f7f8fa]">
      {data.sheetNames.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[#e5e7eb] bg-[#f3f4f6] px-2 py-1.5" role="tablist" aria-label="Spreadsheet sheets">
          {data.sheetNames.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={data.active === name}
              onClick={() => switchSheet(name)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                data.active === name ? "bg-[#990000] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        <ExcelGrid data={data} />
      </div>
    </div>
  );
}

function DocxViewer({ buffer }: { buffer: ArrayBuffer }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    (async () => {
      const mod = await import("docx-preview");
      if (cancelled) return;
      await mod.renderAsync(new Blob([buffer]), el, el, {
        inWrapper: true,
        breakPages: true,
      });
    })();
    return () => {
      cancelled = true;
      el.innerHTML = "";
    };
  }, [buffer]);

  return (
    <div className="excel-scroll h-full w-full overflow-auto bg-white">
      <div ref={containerRef} />
    </div>
  );
}

function PptxViewer({ buffer }: { buffer: ArrayBuffer }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let previewer: { preview: (f: ArrayBuffer) => Promise<unknown>; destroy: () => void } | null = null;
    (async () => {
      const mod = await import("pptx-preview");
      if (cancelled) return;
      previewer = mod.init(el, { width: 960, height: 540 });
      await previewer.preview(buffer);
    })();
    return () => {
      cancelled = true;
      previewer?.destroy();
      el.innerHTML = "";
    };
  }, [buffer]);

  return <div ref={containerRef} className="excel-scroll h-full w-full overflow-auto bg-white" />;
}

function ViewerLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[#f7f8fa]">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-[#e5e7eb]" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#990000]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Rendering Preview...</p>
        <p className="mt-1 text-xs text-muted-foreground">Please wait while we prepare the file.</p>
      </div>
    </div>
  );
}

function ViewerError({ url, filename }: { url: string; filename: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#f7f8fa] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">Preview unavailable</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          This file couldn&apos;t be rendered in the browser. Download it to open it locally.
        </p>
      </div>
      <button
        onClick={() => downloadAuthed(url, filename)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#990000] px-5 text-sm font-medium text-white transition-colors hover:bg-[#7a0000]"
      >
        <Download className="h-4 w-4" /> Download File
      </button>
    </div>
  );
}

export function OfficeViewer({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const ext = getExt(url);
  const [buffer, setBuffer] = React.useState<ArrayBuffer | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const buf = await fetchAuthedArrayBuffer(url);
        if (!cancelled) setBuffer(buf);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const filename = (title?.trim() || "file") + ext;
  const isSpreadsheet = SPREADSHEET_EXT.includes(ext);
  const isWord = WORD_EXT.includes(ext);
  const isSlides = SLIDES_EXT.includes(ext);
  const officeStyle = OFFICE_STYLES[ext] ?? { icon: FileSpreadsheet, iconColor: "text-emerald-600", badgeBg: "bg-[#107c41]" };
  const IconComp = officeStyle.icon;

  let body: React.ReactNode;
  if (failed) {
    body = <ViewerError url={url} filename={filename} />;
  } else if (!buffer) {
    body = <ViewerLoading />;
  } else if (isSpreadsheet) {
    body = (
      <ExcelBody
        url={url}
        title={title}
        ext={ext}
        buffer={buffer}
      />
    );
  } else if (isWord) {
    body = <DocxViewer buffer={buffer} />;
  } else if (isSlides) {
    body = <PptxViewer buffer={buffer} />;
  } else {
    body = <ViewerError url={url} filename={filename} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white" role="dialog" aria-modal="true" aria-label={title || "File preview"}>
      <style>{excelScrollStyles}</style>
      <div className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <IconComp className={`h-5 w-5 shrink-0 ${officeStyle.iconColor}`} />
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{title || "File preview"}</span>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ${officeStyle.badgeBg}`}>
              {ext || ".file"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => downloadAuthed(url, filename)}
            title="Download"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Download
          </button>
          <button
            onClick={onClose}
            title="Exit preview"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-white">{body}</div>
    </div>
  );
}
