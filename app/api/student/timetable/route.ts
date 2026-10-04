import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return unauthorized();

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      course: {
        select: { id: true, code: true, title: true, color: true, timetable: { orderBy: [{ day: "asc" }, { start: "asc" }] } },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const slots = enrollments.flatMap((e) =>
    e.course.timetable.map((t) => ({
      id: t.id,
      day: t.day,
      start: t.start,
      end: t.end,
      room: t.room,
      courseCode: e.course.code,
      courseTitle: e.course.title,
      color: e.course.color || "#990000",
    }))
  );

  return NextResponse.json({ slots, days: DAYS });
}
