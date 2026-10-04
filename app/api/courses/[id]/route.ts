import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

function canModify(user: { id: string; role: string }, course: { instructorId: string | null }) {
  if (user.role === "ADMIN") return true;
  if (user.role === "INSTRUCTOR" && course.instructorId === user.id) return true;
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true } },
      grade: { select: { id: true, name: true } },
      modules: { orderBy: { order: "asc" }, include: { lectures: { orderBy: { order: "asc" } } } },
      lectures: { where: { moduleId: null }, orderBy: { order: "asc" } },
      assignments: { orderBy: { dueDate: "asc" }, include: { submissions: true } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canModify(user, course)) return forbidden();
  return NextResponse.json(course);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canModify(user, course)) return forbidden();

  const body = await req.json();
  const { title, description, credits, semester, color, gradeId } = body;

  const updated = await prisma.course.update({
    where: { id },
    data: {
      title: title ?? course.title,
      description: description ?? course.description,
      credits: credits != null ? Number(credits) : course.credits,
      semester: semester ?? course.semester,
      color: color ?? course.color,
      gradeId: gradeId !== undefined ? gradeId || null : course.gradeId,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
