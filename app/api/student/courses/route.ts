import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const [enrollments, available] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            semester: true,
            credits: true,
            color: true,
            description: true,
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.course.findMany({
      where: {
        NOT: { enrollments: { some: { studentId: user.id } } },
        ...(user.gradeId ? { gradeId: user.gradeId } : {}),
      },
      include: { instructor: { select: { name: true } }, _count: { select: { enrollments: true } } },
      orderBy: { title: "asc" },
    }),
  ]);

  return NextResponse.json({
    enrollments: enrollments.map((e) => ({
      id: e.id,
      progress: e.progress,
      course: {
        id: e.course.id,
        code: e.course.code,
        title: e.course.title,
        semester: e.course.semester,
        credits: e.course.credits,
        color: e.course.color,
        description: e.course.description,
        instructor: e.course.instructor ? { name: e.course.instructor.name } : null,
      },
    })),
    available: available.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      semester: c.semester,
      credits: c.credits,
      color: c.color,
      description: c.description,
      instructor: c.instructor ? { name: c.instructor.name } : null,
      _count: { enrollments: Number(c._count.enrollments) },
    })),
  });
}
