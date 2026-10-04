import { NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  await prisma.user.update({
    where: { id: user.id },
    data: { tokenVersion: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}