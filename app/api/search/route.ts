import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json({ courses: [], lectures: [], announcements: [] });

  const isAdmin = user.role === "ADMIN";
  const isInstructor = user.role === "INSTRUCTOR";

  const courseWhere = isAdmin
    ? {}
    : isInstructor
      ? { instructorId: user.id }
      : user.gradeId
        ? { gradeId: user.gradeId }
        : { id: "none" };

  const courses = await prisma.course.findMany({
    where: { ...courseWhere, OR: [{ title: { contains: q } }, { code: { contains: q } }] },
    take: 20,
    select: { id: true, code: true, title: true },
  });

  const lectureWhere = isAdmin
    ? {}
    : isInstructor
      ? { course: { instructorId: user.id } }
      : { course: { enrollments: { some: { studentId: user.id } } } };

  const lectures = await prisma.lecture.findMany({
    where: { ...lectureWhere, title: { contains: q } },
    take: 20,
    select: { id: true, title: true, courseId: true, type: true },
  });

  const scopedCourseIds = isAdmin
    ? null
    : isInstructor
      ? (await prisma.course.findMany({ where: { instructorId: user.id }, select: { id: true } })).map((c) => c.id)
      : (await prisma.enrollment.findMany({ where: { studentId: user.id }, select: { courseId: true } })).map((e) => e.courseId);

  const announcementWhere = isAdmin
    ? { title: { contains: q } }
    : {
        OR: [
          { scope: "GLOBAL" as const, title: { contains: q } },
          ...(scopedCourseIds && scopedCourseIds.length > 0
            ? [{ scope: "COURSE" as const, courseId: { in: scopedCourseIds }, title: { contains: q } }]
            : []),
        ],
      };

  const announcements = await prisma.announcement.findMany({
    where: announcementWhere,
    take: 20,
    select: { id: true, title: true, scope: true },
  });

  return NextResponse.json({ courses, lectures, announcements });
}
