import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { instructorId, gradeId } = body;

  const updated = await prisma.course.update({
    where: { id },
    data: {
      instructorId: instructorId !== undefined ? instructorId || null : course.instructorId,
      gradeId: gradeId !== undefined ? gradeId || null : course.gradeId,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.enrollment.deleteMany({ where: { courseId: id } });
  await prisma.module.deleteMany({ where: { courseId: id } });
  await prisma.lecture.deleteMany({ where: { courseId: id } });
  await prisma.announcement.deleteMany({ where: { courseId: id } });
  await prisma.timetableSlot.deleteMany({ where: { courseId: id } });
  await prisma.submission.deleteMany({ where: { assignment: { courseId: id } } });
  await prisma.assignment.deleteMany({ where: { courseId: id } });
  await prisma.attendanceRecord.deleteMany({ where: { courseId: id } });
  await prisma.course.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
