import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "INSTRUCTOR") return forbidden();

  const courses = await prisma.course.findMany({
    where: { instructorId: user.id },
    include: {
      assignments: { include: { submissions: { include: { student: { select: { name: true, email: true } } }, orderBy: { submittedAt: "asc" } } } },
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(
    courses.map((c) => ({
      id: c.id,
      title: c.title,
      code: c.code,
      assignments: c.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate.toISOString(),
        maxMarks: a.maxMarks,
        submissions: a.submissions.map((s) => ({
          id: s.id,
          studentId: s.studentId,
          assignmentId: s.assignmentId,
          studentName: s.student?.name ?? "Unknown",
          studentEmail: s.student?.email ?? "",
          text: s.text,
          fileUrl: s.fileUrl,
          status: s.status,
          marks: s.marks,
          feedback: s.feedback,
          submittedAt: s.submittedAt.toISOString(),
          gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
        })),
      })),
    }))
  );
}