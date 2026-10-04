import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user || user.role !== "ADMIN") return unauthorized();
  const { id } = await params;

  const body = await req.json();
  const { name, order } = body;

  if (name !== undefined) {
    const existing = await prisma.grade.findUnique({ where: { name } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Grade already exists" }, { status: 409 });
    }
  }

  const updated = await prisma.grade.update({
    where: { id },
    data: {
      name: name !== undefined ? name : undefined,
      order: order !== undefined ? Number(order) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user || user.role !== "ADMIN") return unauthorized();
  const { id } = await params;

  const grade = await prisma.grade.findUnique({
    where: { id },
    include: { _count: { select: { users: true, courses: true } } },
  });
  if (!grade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (grade._count.users > 0 || grade._count.courses > 0) {
    return NextResponse.json({ error: "Cannot delete: grade has users or courses assigned" }, { status: 400 });
  }

  await prisma.grade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
