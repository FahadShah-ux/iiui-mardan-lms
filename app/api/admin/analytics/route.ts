import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const [
    totalStudents,
    totalInstructors,
    totalCourses,
    totalGrades,
    pendingSubs,
    grades,
    studentCountByGrade,
    enrollments,
    attendanceStats,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "INSTRUCTOR" } }),
    prisma.course.count(),
    prisma.grade.count(),
    prisma.submission.count({ where: { status: "SUBMITTED" } }),
    prisma.grade.findMany({
      include: { _count: { select: { users: true, courses: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.user.groupBy({
      by: ["gradeId"],
      where: { role: "STUDENT", gradeId: { not: null } },
      _count: { _all: true },
    }),
    prisma.course.findMany({
      include: { _count: { select: { enrollments: true } }, grade: { select: { name: true } } },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    totalStudents,
    totalInstructors,
    totalCourses,
    totalGrades,
    pendingSubs,
    grades: grades.map((g) => ({
      name: g.name,
      students: studentCountByGrade.find((s) => s.gradeId === g.id)?._count._all ?? 0,
      courses: g._count.courses,
    })),
    courses: enrollments.map((c) => ({
      name: c.code,
      students: c._count.enrollments,
    })),
    attendance: attendanceStats.map((a) => ({
      name: a.status,
      value: a._count._all,
    })),
  });
}