import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

async function getCourseRole(user: { id: string; role: string }, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) return "NOT_FOUND";
  if (user.role === "ADMIN") return "ALLOW";
  if (user.role === "INSTRUCTOR" && course.instructorId === user.id) return "ALLOW";
  return "DENY";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const role = await getCourseRole(user, id);
  if (role === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "DENY") return forbidden();

  const body = await req.json();
  const { title } = body;
  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  const count = await prisma.module.count({ where: { courseId: id } });
  const created = await prisma.module.create({
    data: { courseId: id, title, order: count },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  const role = await getCourseRole(user, id);
  if (role === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "DENY") return forbidden();

  const body = await req.json();
  const { moduleId, title, order } = body;
  if (!moduleId) return NextResponse.json({ error: "Missing moduleId" }, { status: 400 });

  const dbModule = await prisma.module.findFirst({
    where: { id: moduleId, courseId: id },
    select: { id: true },
  });
  if (!dbModule) return NextResponse.json({ error: "Module not found in this course" }, { status: 404 });

  const updated = await prisma.module.update({
    where: { id: moduleId },
    data: { title: title !== undefined ? title : undefined, order: order !== undefined ? Number(order) : undefined },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  const role = await getCourseRole(user, id);
  if (role === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "DENY") return forbidden();

  const url = new URL(req.url);
  const moduleId = url.searchParams.get("moduleId");
  if (!moduleId) return NextResponse.json({ error: "Missing moduleId" }, { status: 400 });

  const dbModule = await prisma.module.findFirst({
    where: { id: moduleId, courseId: id },
    select: { id: true },
  });
  if (!dbModule) return NextResponse.json({ error: "Module not found in this course" }, { status: 404 });

  await prisma.lecture.updateMany({
    where: { moduleId },
    data: { moduleId: null },
  });
  await prisma.module.delete({ where: { id: moduleId } });
  return NextResponse.json({ ok: true });
}
