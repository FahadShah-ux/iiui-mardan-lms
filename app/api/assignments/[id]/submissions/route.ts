import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: { select: { id: true, instructorId: true } } },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "STUDENT") {
    const sub = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
    });
    return NextResponse.json(sub ? [sub] : []);
  }

  if (user.role === "INSTRUCTOR" && assignment.course.instructorId !== user.id) return forbidden();
  if (user.role === "ADMIN") {
    const subs = await prisma.submission.findMany({ where: { assignmentId: id } });
    return NextResponse.json(subs);
  }

  const subs = await prisma.submission.findMany({ where: { assignmentId: id }, include: { student: { select: { id: true, name: true, email: true } } } });
  return NextResponse.json(subs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: { include: { enrollments: { where: { studentId: user.id }, select: { id: true } } } } },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assignment.course.enrollments.length === 0) return forbidden();
  if (new Date(assignment.dueDate) < new Date()) {
    return NextResponse.json({ error: "Submission deadline has passed" }, { status: 403 });
  }

  const body = await req.json();
  const { text, fileUrl } = body;

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
  });

  const submissionData = { text: text || null, fileUrl: fileUrl || null };

  let result;
  if (existing) {
    result = await prisma.submission.update({
      where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
      data: { ...submissionData, status: "SUBMITTED", submittedAt: new Date() },
    });
  } else {
    result = await prisma.submission.create({
      data: { assignmentId: id, studentId: user.id, ...submissionData },
    });
  }

  return NextResponse.json(result, { status: existing ? 200 : 201 });
}
