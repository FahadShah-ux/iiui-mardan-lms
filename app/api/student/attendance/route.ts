import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      course: { select: { id: true, code: true, title: true, color: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const courseIds = enrollments.map((e) => e.course.id);

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: user.id, courseId: { in: courseIds } },
    orderBy: { date: "desc" },
  });

  const perCourse = enrollments.map((e) => {
    const recs = records.filter((r) => r.courseId === e.course.id);
    const present = recs.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const absent = recs.filter((r) => r.status === "ABSENT").length;
    const pct = recs.length > 0 ? Math.round((present / recs.length) * 100) : null;
    return {
      course: e.course,
      recs: recs.map((r) => ({ id: r.id, status: r.status, date: r.date.toISOString() })),
      present,
      absent,
      pct,
    };
  });

  return NextResponse.json({ perCourse });
}
