import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getBearerToken, verifyToken } from "@/src/lib/auth-token";

export const ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT"] as const;
export type RoleKey = (typeof ROLES)[number];

export async function apiUser(req: NextRequest | Request) {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== "ACTIVE") return null;
  if (payload.role !== user.role) return null;
  if ((payload.v ?? 0) !== user.tokenVersion) return null;
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
