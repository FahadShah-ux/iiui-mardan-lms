
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
const ALLOWED: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc", ".dot"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": [".dotx"],
  "application/vnd.ms-rtf": [".rtf"],
  "application/rtf": [".rtf"],
  "application/vnd.oasis.opendocument.text": [".odt"],
  "application/vnd.ms-works": [".wps"],
  "text/plain": [".txt", ".csv"],
  "application/vnd.ms-excel": [".xls", ".xlt", ".ets"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": [".xltx"],
  "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
  "application/vnd.ms-powerpoint": [".ppt", ".pot", ".dps"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.openxmlformats-officedocument.presentationml.template": [".potx"],
  "application/vnd.oasis.opendocument.presentation": [".odp"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/bmp": [".bmp"],
  "image/webp": [".webp"],
  "image/tiff": [".tiff", ".tif"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/x-wav": [".wav"],
  "audio/mp4": [".m4a"],
  "audio/aac": [".aac"],
  "audio/ogg": [".ogg"],
  "audio/flac": [".flac"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "video/x-matroska": [".mkv"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "application/vnd.rar": [".rar"],
  "application/x-rar-compressed": [".rar"],
  "application/x-7z-compressed": [".7z"],
};

export async function POST(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const mime = file.type || "";
  const extAllowed = ALLOWED[mime];
  const originalName = file.name || "file";
  const ext = path.extname(originalName).toLowerCase();

  if (!extAllowed) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  if (!extAllowed.includes(ext)) {
    return NextResponse.json({ error: `Extension ${ext} not allowed for ${mime}` }, { status: 400 });
  }
  if (file.size > 70000 * 1024) {
    return NextResponse.json({ error: "File too large (max 70MB)" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const magicOk =
    (ext === ".pdf" && buffer.subarray(0, 5).toString("latin1") === "%PDF-") ||
    (ext === ".png" && buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") ||
    (ext === ".jpeg" || ext === ".jpg") &&
      (buffer.subarray(0, 3).toString("hex") === "ffd8ff") ||
    (ext === ".gif" && buffer.subarray(0, 6).toString("latin1") === "GIF89a") ||
    (ext === ".webp" && buffer.subarray(0, 4).toString("latin1") === "RIFF") ||
    (ext === ".zip" || ext === ".docx" || ext === ".xlsx" || ext === ".pptx") &&
      (buffer.subarray(0, 2).toString("latin1") === "PK");

  if (!magicOk) {
    return NextResponse.json({ error: "File content does not match its type" }, { status: 400 });
  }

  const safeName = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "storage", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);

  const url = `/api/files/${safeName}`;
  return NextResponse.json({ url, name: originalName });
}

