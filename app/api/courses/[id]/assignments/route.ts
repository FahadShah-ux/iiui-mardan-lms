import { NextRequest, NextResponse } from "next/server";
import { apiUser, unauthorized, forbidden } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";

async function getCourseRole(user: { id: string; role: string }, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) return "NOT_FOUND";
  if (user.role === "ADMIN") return "ALLOW";
  if (user.role === "INSTRUCTOR" && course.instructorId === user.id) return "ALLOW";
  return "DENY";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;

  const role = await getCourseRole(user, id);
  if (role === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "DENY") return forbidden();

  const body = await req.json();
  const { title, description, dueDate, maxMarks } = body;
  if (!title || !dueDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedDue = new Date(dueDate as string);
  if (Number.isNaN(parsedDue.getTime())) {
    return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
  }

  const hasMax = maxMarks !== null && maxMarks !== undefined && maxMarks !== "";
  const parsedMax = Number(maxMarks);
  if (hasMax && (Number.isNaN(parsedMax) || parsedMax <= 0)) {
    return NextResponse.json({ error: "Invalid max marks" }, { status: 400 });
  }

  const created = await prisma.assignment.create({
    data: {
      courseId: id,
      title,
      description: description || "",
      dueDate: parsedDue,
      maxMarks: hasMax ? parsedMax : 100,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  const role = await getCourseRole(user, id);
  if (role === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "DENY") return forbidden();

  const url = new URL(req.url);
  const assignmentId = url.searchParams.get("assignmentId");
  if (!assignmentId) return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 });

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, courseId: id },
    select: { id: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found in this course" }, { status: 404 });
  }

  await prisma.submission.deleteMany({ where: { assignmentId } });
  await prisma.assignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ ok: true });
}
