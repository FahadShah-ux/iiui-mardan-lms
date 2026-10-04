import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

function pktTodayStartUTC(): Date {
  const now = new Date(Date.now() + 5 * 3600 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 5 * 3600 * 1000);
}

function pktTodayEndUTC(): Date {
  return new Date(pktTodayStartUTC().getTime() + 24 * 3600 * 1000);
}

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "INSTRUCTOR") return forbidden();

  const [courses, pendingSubs, ungradedCount, todayAttendance, deadlines] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId: user.id },
      include: {
        _count: { select: { enrollments: true, assignments: true } },
        enrollments: { select: { progress: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { status: "SUBMITTED", assignment: { course: { instructorId: user.id } } },
      include: { student: { select: { name: true } }, assignment: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
      take: 8,
    }),
    prisma.submission.count({ where: { status: "SUBMITTED", assignment: { course: { instructorId: user.id } } } }),
    prisma.attendanceRecord.count({ where: { course: { instructorId: user.id }, date: { gte: pktTodayStartUTC(), lt: pktTodayEndUTC() } } }),
    prisma.assignment.findMany({
      where: { course: { instructorId: user.id }, dueDate: { gte: new Date() } },
      include: { course: { select: { title: true, code: true } }, _count: { select: { submissions: true } } },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
  ]);

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      semester: c.semester,
      _count: {
        enrollments: c._count.enrollments,
        assignments: c._count.assignments,
      },
      enrollments: c.enrollments.map((e) => ({ progress: e.progress })),
    })),
    pendingSubs: pendingSubs.map((s) => ({
      id: s.id,
      student: { name: s.student.name },
      assignment: { title: s.assignment.title },
    })),
    ungradedCount,
    todayAttendance,
    deadlines: deadlines.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate.toISOString(),
      course: { code: a.course.code, title: a.course.title },
      _count: { submissions: a._count.submissions },
    })),
  });
}