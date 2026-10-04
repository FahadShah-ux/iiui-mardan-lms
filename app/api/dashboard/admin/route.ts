import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const [students, instructors, courses, grades, enrollments, pendingSubs, announcements] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "INSTRUCTOR" } }),
      prisma.course.count(),
      prisma.grade.count(),
      prisma.enrollment.count(),
      prisma.submission.count({ where: { status: "SUBMITTED" } }),
      prisma.announcement.findMany({
        include: { author: { select: { name: true } }, course: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const recentEnrollments = await prisma.enrollment.findMany({
    include: { course: { select: { code: true, title: true } } },
    orderBy: { enrolledAt: "desc" },
    take: 6,
  });

  return NextResponse.json({
    students,
    instructors,
    courses,
    grades,
    enrollments,
    pendingSubs,
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      author: { name: a.author.name },
      pinned: a.pinned,
      scope: a.scope,
      createdAt: a.createdAt.toISOString(),
    })),
    recentEnrollments: recentEnrollments.map((e) => ({
      id: e.id,
      progress: e.progress,
      course: { code: e.course.code, title: e.course.title },
    })),
  });
}