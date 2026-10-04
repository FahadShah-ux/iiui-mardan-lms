import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { AttendanceStatus } from "@/src/generated/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: { instructorId: true, enrollments: { include: { student: { select: { id: true, name: true, email: true } } } } },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "STUDENT") {
    const enrolled = course.enrollments.some((e) => e.studentId === user.id);
    if (!enrolled) return forbidden();
    const records = await prisma.attendanceRecord.findMany({
      where: { courseId: id, studentId: user.id },
      orderBy: { date: "desc" },
      take: 60,
    });
    return NextResponse.json({ records });
  }

  if (user.role === "INSTRUCTOR" && course.instructorId !== user.id) return forbidden();

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const normalizedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? new Date(`${dateParam}T00:00:00.000Z`)
    : null;
  const records = normalizedDate
    ? await prisma.attendanceRecord.findMany({ where: { courseId: id, date: normalizedDate } })
    : await prisma.attendanceRecord.findMany({ where: { courseId: id }, orderBy: { date: "desc" }, take: 60 });

  const students = course.enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.name,
    email: e.student.email,
  }));

  return NextResponse.json({ students, records, courseId: id });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") return forbidden();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: { instructorId: true },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "INSTRUCTOR" && course.instructorId !== user.id) return forbidden();

  const body = await req.json();
  const { date, entries } = body;
  if (!date || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "Missing date or entries" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const day = new Date(`${String(date)}T00:00:00.000Z`);
  if (Number.isNaN(day.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const enrolled = await prisma.enrollment.findMany({
    where: { courseId: id },
    select: { studentId: true },
  });
  const enrolledIds = new Set(enrolled.map((e) => e.studentId));
  const VALID_STATUSES = new Set(["PRESENT", "ABSENT", "LATE"]);

  const ops = [];
  for (const entry of entries) {
    const studentId = typeof entry?.studentId === "string" ? entry.studentId : "";
    const status = typeof entry?.status === "string" ? entry.status : "";
    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid attendance status" }, { status: 400 });
    }
    if (!enrolledIds.has(studentId)) {
      return NextResponse.json({ error: "A student is not enrolled in this course" }, { status: 400 });
    }
    ops.push(
      prisma.attendanceRecord.upsert({
        where: { courseId_studentId_date: { courseId: id, studentId, date: day } },
        update: { status: status as AttendanceStatus },
        create: { courseId: id, studentId, date: day, status: status as AttendanceStatus },
      })
    );
  }

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
