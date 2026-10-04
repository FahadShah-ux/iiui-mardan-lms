import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const [courses, instructors, grades] = await Promise.all([
    prisma.course.findMany({
      include: {
        instructor: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "INSTRUCTOR", status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.grade.findMany({ select: { id: true, name: true, order: true }, orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      credits: c.credits,
      semester: c.semester,
      color: c.color,
      instructorId: c.instructor?.id ?? null,
      instructorName: c.instructor?.name ?? null,
      gradeId: c.grade?.id ?? null,
      gradeName: c.grade?.name ?? null,
      enrollments: c._count.enrollments,
      assignments: c._count.assignments,
    })),
    instructors,
    grades,
  });
}