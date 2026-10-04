import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role === "STUDENT") {
    return NextResponse.json({ error: "Students cannot create announcements" }, { status: 403 });
  }

  const body = await req.json();
  const { title, body: content, scope, courseId, pinned } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
  }

  const rawScope = scope || (courseId ? "COURSE" : "GLOBAL");
  if (rawScope !== "GLOBAL" && rawScope !== "COURSE") {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  let finalScope = rawScope;
  if (finalScope === "GLOBAL" && user.role === "INSTRUCTOR") {
    return NextResponse.json({ error: "Only administrators can post global announcements" }, { status: 403 });
  }

  if (finalScope === "COURSE" || (user.role === "INSTRUCTOR" && courseId)) {
    if (!courseId) {
      return NextResponse.json({ error: "A course must be selected for this announcement" }, { status: 400 });
    }
    if (user.role === "INSTRUCTOR") {
      const owned = await prisma.course.findFirst({
        where: { id: courseId, instructorId: user.id },
        select: { id: true },
      });
      if (!owned) return forbidden();
    } else {
      const exists = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    finalScope = "COURSE";
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body: content,
      scope: finalScope,
      authorId: user.id,
      courseId: finalScope === "COURSE" ? courseId : null,
      pinned: !!pinned,
    },
  });

  // Notify relevant users
  if (finalScope === "GLOBAL") {
    const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
    await prisma.notification.createMany({
      data: students.map((s) => ({ userId: s.id, title: "New announcement", body: title })),
    });
  } else if (finalScope === "COURSE" && courseId) {
    const students = await prisma.enrollment.findMany({ where: { courseId }, select: { studentId: true } });
    await prisma.notification.createMany({
      data: students.map((s) => ({ userId: s.studentId, title: "New course announcement", body: title })),
    });
  }

  return NextResponse.json(announcement, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { title: true, scope: true },
  });
  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { body: announcement.title } }),
    prisma.announcement.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
