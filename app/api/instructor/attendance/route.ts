import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "INSTRUCTOR") return forbidden();

  const courses = await prisma.course.findMany({
    where: { instructorId: user.id },
    include: { enrollments: { include: { student: { select: { id: true, name: true, email: true } } } } },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(
    courses.map((c) => ({
      id: c.id,
      title: c.title,
      code: c.code,
      semester: c.semester,
      students: c.enrollments.map((e) => ({ id: e.student.id, name: e.student.name, email: e.student.email })),
    }))
  );
}