import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") return forbidden();
  const { id } = await params;

  const sub = await prisma.submission.findUnique({
    where: { id },
    include: { assignment: { include: { course: { select: { instructorId: true } } } } },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "INSTRUCTOR" && sub.assignment.course.instructorId !== user.id) return forbidden();

  const body = await req.json();
  const { marks, feedback, status } = body;

  const gradedStatus = status === "SUBMITTED" ? "SUBMITTED" : "GRADED";

  let safeMarks = sub.marks;
  if (marks != null) {
    const num = Number(marks);
    if (Number.isNaN(num)) {
      return NextResponse.json({ error: "Invalid marks" }, { status: 400 });
    }
    if (num < 0 || num > sub.assignment.maxMarks) {
      return NextResponse.json({ error: `Marks must be between 0 and ${sub.assignment.maxMarks}` }, { status: 400 });
    }
    safeMarks = num;
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      marks: safeMarks,
      feedback: feedback !== undefined ? feedback : sub.feedback,
      status: gradedStatus,
      gradedAt: gradedStatus === "GRADED" ? new Date() : sub.gradedAt,
    },
  });

  if (gradedStatus === "GRADED") {
    await prisma.notification.create({
      data: {
        userId: sub.studentId,
        title: "Assignment graded",
        body: `Your submission for "${sub.assignment.title}" has been graded.`,
      },
    });
  }

  return NextResponse.json(updated);
}
