import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    include: { grade: { select: { id: true, name: true } } },
  });
  if (!u) return unauthorized();

  return NextResponse.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    section: u.section,
    gradeId: u.gradeId,
    grade: u.grade
      ? { id: u.grade.id, name: u.grade.name }
      : null,
  });
}
