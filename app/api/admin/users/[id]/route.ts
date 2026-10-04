import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await req.json();
  const { name, gradeId, section, instructorGradeIds, status, role, email } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (gradeId !== undefined) data.gradeId = gradeId || null;
  if (section !== undefined) data.section = section || null;
  if (status !== undefined) data.status = status;
  if (role !== undefined) data.role = role;

  let updated;
  if (Array.isArray(instructorGradeIds)) {
    updated = await prisma.$transaction(async (tx) => {
      await tx.instructorGrade.deleteMany({ where: { instructorId: id } });
      if (instructorGradeIds.length > 0) {
        await tx.instructorGrade.createMany({
          data: instructorGradeIds.map((gradeId) => ({ instructorId: id, gradeId })),
        });
      }
      return tx.user.update({ where: { id }, data });
    });
  } else {
    updated = await prisma.user.update({ where: { id }, data });
  }
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    status: updated.status,
    section: updated.section,
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
