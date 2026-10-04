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
      _count: { select: { enrollments: true, lectures: true, assignments: true } },
      enrollments: { select: { progress: true } },
      grade: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const grades = await prisma.instructorGrade.findMany({
    where: { instructorId: user.id },
    include: { grade: { select: { id: true, name: true } } },
    orderBy: { grade: { order: "asc" } },
  });

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      semester: c.semester,
      color: c.color,
      _count: {
        enrollments: c._count.enrollments,
        lectures: c._count.lectures,
        assignments: c._count.assignments,
      },
      enrollments: c.enrollments.map((e) => ({ progress: e.progress })),
      grade: c.grade ? { name: c.grade.name } : null,
    })),
    grades: grades.map((g) => ({ id: g.grade.id, name: g.grade.name })),
  });
}