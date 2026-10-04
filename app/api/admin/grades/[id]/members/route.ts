import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user || user.role !== "ADMIN") return unauthorized();
  const { id } = await params;

  const grade = await prisma.grade.findUnique({ where: { id } });
  if (!grade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [students, instructorLinks] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT", gradeId: id },
      select: { id: true, name: true, email: true, section: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.instructorGrade.findMany({
      where: { gradeId: id },
      include: {
        instructor: { select: { id: true, name: true, email: true, section: true, status: true } },
      },
      orderBy: { instructor: { name: "asc" } },
    }),
  ]);

  const studentIds = students.map((s) => s.id);
  const instructorIds = instructorLinks.map((l) => l.instructor.id);

  const [studentCourses, instructorCourses] = await Promise.all([
    studentIds.length
      ? prisma.enrollment.findMany({
          where: { studentId: { in: studentIds } },
          select: { studentId: true, course: { select: { code: true, title: true } } },
          orderBy: { course: { code: "asc" } },
        })
      : [],
    instructorIds.length
      ? prisma.course.findMany({
          where: { instructorId: { in: instructorIds } },
          select: { instructorId: true, code: true, title: true },
          orderBy: { code: "asc" },
        })
      : [],
  ]);

  const studentCourseMap = new Map<string, { code: string; title: string }[]>();
  for (const e of studentCourses) {
    const list = studentCourseMap.get(e.studentId) ?? [];
    list.push({ code: e.course.code, title: e.course.title });
    studentCourseMap.set(e.studentId, list);
  }

  const instructorCourseMap = new Map<string, { code: string; title: string }[]>();
  for (const c of instructorCourses) {
    const list = instructorCourseMap.get(c.instructorId!) ?? [];
    list.push({ code: c.code, title: c.title });
    instructorCourseMap.set(c.instructorId!, list);
  }

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      section: s.section,
      status: s.status,
      courses: studentCourseMap.get(s.id) ?? [],
    })),
    instructors: instructorLinks.map((l) => {
      const ins = l.instructor;
      return {
        id: ins.id,
        name: ins.name,
        email: ins.email,
        section: ins.section,
        status: ins.status,
        courses: instructorCourseMap.get(ins.id) ?? [],
      };
    }),
  });
}
