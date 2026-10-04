import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { LectureType } from "@/src/generated/prisma";

async function getCourseRole(user: { id: string; role: string }, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) return "NOT_FOUND";
  if (user.role === "ADMIN") return "ALLOW";
  if (user.role === "INSTRUCTOR" && course.instructorId === user.id) return "ALLOW";
  return "DENY";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const role = await getCourseRole(user, id);
  if (role === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "DENY") return forbidden();

  const body = await req.json();
  const { title, type, contentUrl, moduleId } = body;

  if (!title || !type || !contentUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!(type in LectureType)) {
    return NextResponse.json({ error: "Invalid lecture type" }, { status: 400 });
  }

  if (moduleId) {
    const dbModule = await prisma.module.findFirst({
      where: { id: moduleId, courseId: id },
      select: { id: true },
    });
    if (!dbModule) return NextResponse.json({ error: "Module not found in this course" }, { status: 400 });
  }

  const count = await prisma.lecture.count({ where: { courseId: id } });
  const created = await prisma.lecture.create({
    data: {
      courseId: id,
      title,
      type: type as LectureType,
      contentUrl,
      moduleId: moduleId || null,
      order: count,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  const role = await getCourseRole(user, id);
  if (role === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "DENY") return forbidden();

  const url = new URL(req.url);
  const lectureId = url.searchParams.get("lectureId");
  if (!lectureId) return NextResponse.json({ error: "Missing lectureId" }, { status: 400 });

  const lecture = await prisma.lecture.findFirst({
    where: { id: lectureId, courseId: id },
    select: { id: true },
  });
  if (!lecture) return NextResponse.json({ error: "Lecture not found in this course" }, { status: 404 });

  await prisma.lecture.delete({ where: { id: lectureId } });
  return NextResponse.json({ ok: true });
}
