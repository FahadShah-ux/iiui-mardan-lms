import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "INSTRUCTOR") return forbidden();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true } },
      grade: { select: { name: true } },
      modules: { orderBy: { order: "asc" }, include: { lectures: { orderBy: { order: "asc" } } } },
      lectures: { where: { moduleId: null }, orderBy: { order: "asc" } },
      assignments: { orderBy: { createdAt: "desc" }, include: { submissions: { select: { status: true } } } },
      enrollments: { include: { student: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (course.instructorId !== user.id) return forbidden();

  return NextResponse.json({
    id: course.id,
    title: course.title,
    code: course.code,
    semester: course.semester,
    credits: course.credits,
    description: course.description,
    grade: course.grade ? { name: course.grade.name } : null,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      lectures: m.lectures.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        contentUrl: l.contentUrl,
      })),
    })),
    unassignedLectures: course.lectures.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      contentUrl: l.contentUrl,
    })),
    assignments: course.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate.toISOString(),
      maxMarks: a.maxMarks,
      submissions: a.submissions.map((s) => ({ status: s.status })),
    })),
    students: course.enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.name,
      email: e.student.email,
    })),
    studentCount: course.enrollments.length,
  });
}