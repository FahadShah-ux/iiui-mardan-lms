import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user || user.role !== "ADMIN") return unauthorized();

  const grades = await prisma.grade.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { courses: true } },
      users: { where: { role: "STUDENT" }, select: { id: true } },
    },
  });

  return NextResponse.json(
    grades.map((g) => ({
      id: g.id,
      name: g.name,
      order: g.order,
      memberCount: g.users.length,
      courseCount: g._count.courses,
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await apiUser(req);
  if (!user || user.role !== "ADMIN") return unauthorized();

  const body = await req.json();
  const { name, order } = body;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const existing = await prisma.grade.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "Grade already exists" }, { status: 409 });

  const maxOrder = await prisma.grade.aggregate({ _max: { order: true } });
  const created = await prisma.grade.create({
    data: { name, order: order !== undefined ? Number(order) : (maxOrder._max.order ?? -1) + 1 },
  });

  return NextResponse.json(created, { status: 201 });
}
