import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    include: { grade: { select: { name: true } } },
  });
  if (!u) return unauthorized();

  const stats = await Promise.all([
    user.role === "INSTRUCTOR"
      ? prisma.course.count({ where: { instructorId: user.id } })
      : prisma.enrollment.count({ where: { studentId: user.id } }),
    user.role === "INSTRUCTOR"
      ? prisma.submission.count({ where: { assignment: { course: { instructorId: user.id } }, status: "SUBMITTED" } })
      : prisma.submission.count({ where: { studentId: user.id } }),
  ]);

  return NextResponse.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      section: u.section,
      grade: u.grade ? { name: u.grade.name } : null,
    },
    stats: [stats[0], stats[1]],
  });
}
