import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

function getCourseRole(user: { role: string }, instructorCourse: boolean) {
  if (user.role === "ADMIN") return "ALLOW";
  if (user.role === "INSTRUCTOR" && instructorCourse) return "ALLOW";
  return "DENY";
}

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const courses = await prisma.course.findMany({
    include: {
      instructor: { select: { id: true, name: true } },
      grade: { select: { id: true, name: true } },
      _count: { select: { enrollments: true, assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (getCourseRole({ role: user.role }, true) === "DENY") return forbidden();

  const body = await req.json();
  const { code, title, description, credits, semester, color, instructorId, gradeId } = body;

  if (!code || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const created = await prisma.course.create({
    data: {
      code,
      title,
      description: description || "",
      credits: credits ? Number(credits) : 3,
      semester: semester || "Fall 2026",
      color: color || "#990000",
      instructorId: instructorId || null,
      gradeId: gradeId || null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
