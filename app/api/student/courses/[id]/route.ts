import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId: id } },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          grade: { select: { name: true } },
          modules: { orderBy: { order: "asc" }, include: { lectures: { orderBy: { order: "asc" } } } },
          lectures: { where: { moduleId: null }, orderBy: { order: "asc" } },
          assignments: {
            orderBy: { dueDate: "asc" },
            include: { submissions: { where: { studentId: user.id } } },
          },
        },
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const course = enrollment.course;

  return NextResponse.json({
    progress: enrollment.progress,
    title: course.title,
    code: course.code,
    semester: course.semester,
    credits: course.credits,
    description: course.description,
    instructorName: course.instructor?.name ?? null,
    gradeName: course.grade?.name ?? null,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lectures: m.lectures.map((l) => ({ id: l.id, title: l.title, type: l.type, contentUrl: l.contentUrl })),
    })),
    unassignedLectures: course.lectures.map((l) => ({ id: l.id, title: l.title, type: l.type, contentUrl: l.contentUrl })),
    assignments: course.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate.toISOString(),
      maxMarks: a.maxMarks,
      submission: a.submissions[0]
        ? {
            id: a.submissions[0].id,
            status: a.submissions[0].status,
            marks: a.submissions[0].marks,
            feedback: a.submissions[0].feedback,
            text: a.submissions[0].text,
            fileUrl: a.submissions[0].fileUrl,
          }
        : null,
    })),
  });
}
