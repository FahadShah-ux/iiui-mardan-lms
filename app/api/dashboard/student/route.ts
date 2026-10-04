import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const enrolledCourseIds = (
    await prisma.enrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    })
  ).map((e) => e.courseId);

  const [enrollments, deadlines, announcements] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            color: true,
            credits: true,
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.assignment.findMany({
      where: {
        dueDate: { gte: new Date() },
        course: { enrollments: { some: { studentId: user.id } } },
      },
      include: {
        course: { select: { code: true, title: true } },
        submissions: { where: { studentId: user.id }, select: { status: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    prisma.announcement.findMany({
      where: {
        OR: [
          { scope: "GLOBAL" },
          { scope: "COURSE", courseId: { in: enrolledCourseIds } },
        ],
      },
      include: { author: { select: { name: true } }, course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
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
        color: e.course.color,
        credits: e.course.credits,
        instructor: e.course.instructor
          ? { name: e.course.instructor.name }
          : null,
      },
    })),
    deadlines: deadlines.map((d) => ({
      id: d.id,
      title: d.title,
      dueDate: d.dueDate.toISOString(),
      course: { code: d.course.code, title: d.course.title },
      submissions: d.submissions.map((s) => ({ status: s.status })),
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt.toISOString(),
      course: a.course ? { title: a.course.title } : null,
      author: { name: a.author.name },
    })),
  });
}
