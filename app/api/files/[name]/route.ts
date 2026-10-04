import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".dot": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  ".rtf": "application/rtf",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".wps": "application/vnd.ms-works",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".xls": "application/vnd.ms-excel",
  ".xlt": "application/vnd.ms-excel",
  ".ets": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pot": "application/vnd.ms-powerpoint",
  ".dps": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR" && user.role !== "STUDENT") {
    return forbidden();
  }

  const { name } = await params;
  const safeName = path.basename(name);
  if (!/^[a-f0-9-]{36}\.[a-z0-9]{1,10}$/i.test(safeName)) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }
  const filePath = path.join(process.cwd(), "storage", "uploads", safeName);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = await readFile(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const type = MIME[ext] ?? "application/octet-stream";

    const filename = safeName.replace(/^[a-f0-9-]{36}/i, "file");
    const disposition = "inline";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
