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

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true } },
      grade: { select: { name: true } },
      modules: { orderBy: { order: "asc" }, include: { lectures: { orderBy: { order: "asc" } } } },
      lectures: { where: { moduleId: null }, orderBy: { order: "asc" } },
      _count: { select: { enrollments: true } },
      enrollments: { where: { studentId: user.id }, select: { id: true } },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isEnrolled = course.enrollments.length > 0;
  const isOwner = user.role === "INSTRUCTOR" && course.instructor?.id === user.id;
  const canAccessContent = isEnrolled || user.role === "ADMIN" || isOwner;

  return NextResponse.json({
    id: course.id,
    code: course.code,
    title: course.title,
    description: course.description,
    credits: course.credits,
    semester: course.semester,
    instructor: course.instructor ? { name: course.instructor.name } : null,
    grade: course.grade ? { name: course.grade.name } : null,
    enrollmentsCount: course._count.enrollments,
    isEnrolled,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lectures: m.lectures.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        contentUrl: canAccessContent ? l.contentUrl : null,
      })),
    })),
    lectures: course.lectures.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      contentUrl: canAccessContent ? l.contentUrl : null,
    })),
  });
}
