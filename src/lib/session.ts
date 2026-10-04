import { redirect } from "next/navigation";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export type RoleKey = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { grade: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

const ROLE_HOME: Record<RoleKey, string> = {
  ADMIN: "/admin",
  INSTRUCTOR: "/instructor",
  STUDENT: "/student",
};

export async function requireRole(...roles: RoleKey[]) {
  const user = await requireUser();
  const roleKey = user.role as RoleKey;
  if (!roles.includes(roleKey)) redirect(ROLE_HOME[roleKey] ?? "/");
  return user;
}
