import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import type { Role } from "@/src/generated/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const users = await prisma.user.findMany({
    include: {
      grade: { select: { id: true, name: true } },
      instructorGrades: { include: { grade: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      section: u.section,
      grade: u.grade ?? null,
      instructorGradeIds: u.instructorGrades.map((ig) => ig.gradeId),
      createdAt: u.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { name, email, password, role, gradeId, section, instructorGradeIds, status } = body as {
    name: string;
    email: string;
    password?: string;
    role: Role;
    gradeId?: string;
    section?: string;
    instructorGradeIds?: string[];
    status?: string;
  };

  if (!name || !email || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password || "password123", 10);
  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      gradeId: gradeId || null,
      section: section || null,
      instructorGrades: instructorGradeIds?.length
        ? { create: instructorGradeIds.map((gradeId) => ({ gradeId })) }
        : undefined,
      status: (status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    },
  });
  return NextResponse.json(
    {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      status: created.status,
      section: created.section,
    },
    { status: 201 }
  );
}
