import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const announcements = await prisma.announcement.findMany({
    include: {
      author: { select: { name: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      scope: a.scope,
      pinned: a.pinned,
      author: a.author.name,
      course: a.course?.title ?? null,
      createdAt: a.createdAt.toISOString(),
    }))
  );
}