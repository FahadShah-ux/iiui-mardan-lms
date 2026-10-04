import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          color: true,
          assignments: {
            include: { submissions: { where: { studentId: user.id, status: "GRADED" }, select: { marks: true } } },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const gradedCourses = enrollments.map((e) => {
    const gradedAssignments = e.course.assignments.filter((a) => a.submissions.length > 0);
    const totalEarned = gradedAssignments.reduce((s, a) => s + (a.submissions[0]?.marks ?? 0), 0);
    const totalMax = gradedAssignments.reduce((s, a) => s + a.maxMarks, 0);
    const pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : null;
    return {
      course: {
        id: e.course.id,
        code: e.course.code,
        title: e.course.title,
        color: e.course.color,
        assignments: e.course.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          maxMarks: a.maxMarks,
          submission: a.submissions[0] ? { marks: a.submissions[0].marks } : null,
        })),
      },
      totalEarned,
      totalMax,
      pct,
    };
  });

  const allGraded = enrollments.flatMap((e) => e.course.assignments.flatMap((a) => a.submissions));
  const overallEarned = allGraded.reduce((s, sub) => s + (sub.marks ?? 0), 0);
  const overallMax = enrollments
    .flatMap((e) => e.course.assignments)
    .filter((a) => a.submissions.length > 0)
    .reduce((s, a) => s + a.maxMarks, 0);
  const overallPct = overallMax > 0 ? Math.round((overallEarned / overallMax) * 100) : null;

  return NextResponse.json({
    gradedCourses,
    allGradedCount: allGraded.length,
    overallPct,
    overallEarned,
    overallMax,
  });
}
