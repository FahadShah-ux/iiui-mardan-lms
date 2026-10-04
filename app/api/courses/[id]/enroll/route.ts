import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: { enrollments: { where: { studentId: user.id }, select: { id: true } } },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (course.enrollments.length > 0) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }
  if (course.gradeId && user.gradeId && course.gradeId !== user.gradeId) {
    return NextResponse.json({ error: "This course is not available for your grade" }, { status: 403 });
  }

  const enrolled = await prisma.enrollment.create({
    data: { studentId: user.id, courseId: id },
  });

  return NextResponse.json(enrolled, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();
  const { id } = await params;

  await prisma.enrollment.deleteMany({ where: { courseId: id, studentId: user.id } });
  return NextResponse.json({ ok: true });
}
