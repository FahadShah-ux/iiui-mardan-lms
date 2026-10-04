import { PrismaClient, Role, LectureType, AttendanceStatus, AnnouncementScope } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GRADES: { name: string; order: number }[] = [
  { name: "Nursery", order: 0 },
  { name: "Kindergarten", order: 1 },
  { name: "Grade 1", order: 2 },
  { name: "Grade 2", order: 3 },
  { name: "Grade 3", order: 4 },
  { name: "Grade 4", order: 5 },
  { name: "Grade 5", order: 6 },
  { name: "Grade 6", order: 7 },
  { name: "Grade 7", order: 8 },
  { name: "Grade 8", order: 9 },
  { name: "Grade 9", order: 10 },
  { name: "Grade 10", order: 11 },
  { name: "1st Year", order: 12 },
  { name: "2nd Year", order: 13 },
];

function gradeSections(gradeName: string): string[] {
  if (gradeName === "Nursery" || gradeName === "Kindergarten" || gradeName === "1st Year" || gradeName === "2nd Year") {
    return [];
  }
  const num = parseInt(gradeName.replace(/\D/g, ""), 10);
  if (!Number.isNaN(num) && num >= 8 && num <= 10) return ["M", "C"];
  return ["I", "U"];
}

async function main() {
  console.log("Seeding database...");

  // Clean slate
  await prisma.submission.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.module.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.instructorGrade.deleteMany();
  await prisma.user.deleteMany();
  await prisma.grade.deleteMany();

  const pw = await bcrypt.hash("password123", 10);

  // Grades
  const gradeMap: Record<string, { id: string; name: string }> = {};
  for (const g of GRADES) {
    const created = await prisma.grade.create({ data: { name: g.name, order: g.order } });
    gradeMap[g.name] = { id: created.id, name: created.name };
  }

  // Admin
  const admin = await prisma.user.create({
    data: { name: "Campus Administrator", email: "admin@iiui.edu.pk", passwordHash: pw, role: Role.ADMIN },
  });

  // Instructors — assigned to multiple grades via InstructorGrade
  const instructor1 = await prisma.user.create({
    data: { name: "Dr. Ahmed Raza", email: "instructor@iiui.edu.pk", passwordHash: pw, role: Role.INSTRUCTOR, gradeId: gradeMap["Grade 8"].id, section: "M" },
  });
  const instructor2 = await prisma.user.create({
    data: { name: "Ms. Fatima Khan", email: "fatima@iiui.edu.pk", passwordHash: pw, role: Role.INSTRUCTOR, gradeId: gradeMap["Grade 1"].id, section: "I" },
  });
  const instructor3 = await prisma.user.create({
    data: { name: "Prof. Hassan Ali", email: "hassan@iiui.edu.pk", passwordHash: pw, role: Role.INSTRUCTOR, gradeId: gradeMap["Grade 4"].id, section: "U" },
  });

  await prisma.instructorGrade.createMany({
    data: [
      { instructorId: instructor1.id, gradeId: gradeMap["Grade 8"].id },
      { instructorId: instructor1.id, gradeId: gradeMap["Grade 9"].id },
      { instructorId: instructor1.id, gradeId: gradeMap["Grade 10"].id },
      { instructorId: instructor2.id, gradeId: gradeMap["Grade 1"].id },
      { instructorId: instructor2.id, gradeId: gradeMap["Grade 2"].id },
      { instructorId: instructor3.id, gradeId: gradeMap["Grade 4"].id },
      { instructorId: instructor3.id, gradeId: gradeMap["Grade 5"].id },
    ],
  });

  // Students
  const student1 = await prisma.user.create({
    data: { name: "Ayesha Siddiqui", email: "student@iiui.edu.pk", passwordHash: pw, role: Role.STUDENT, gradeId: gradeMap["Grade 8"].id, section: "M" },
  });
  const student2 = await prisma.user.create({
    data: { name: "Bilal Ahmed", email: "bilal@iiui.edu.pk", passwordHash: pw, role: Role.STUDENT, gradeId: gradeMap["Grade 8"].id, section: "C" },
  });
  const student3 = await prisma.user.create({
    data: { name: "Zainab Malik", email: "zainab@iiui.edu.pk", passwordHash: pw, role: Role.STUDENT, gradeId: gradeMap["Grade 1"].id, section: "I" },
  });
  const student4 = await prisma.user.create({
    data: { name: "Usman Tariq", email: "usman@iiui.edu.pk", passwordHash: pw, role: Role.STUDENT, gradeId: gradeMap["Grade 1"].id, section: "U" },
  });
  const student5 = await prisma.user.create({
    data: { name: "Marium Fatima", email: "marium@iiui.edu.pk", passwordHash: pw, role: Role.STUDENT, gradeId: gradeMap["Grade 4"].id, section: "U" },
  });

  // Courses — assigned to a specific grade; only visible to students of that grade
  const c1 = await prisma.course.create({
    data: { code: "G8-MATHS", title: "Mathematics — Grade 8", description: "Advanced algebra, geometry, and introductory statistics for Grade 8.", credits: 3, semester: "Fall 2026", color: "#990000", instructorId: instructor1.id, gradeId: gradeMap["Grade 8"].id },
  });
  const c2 = await prisma.course.create({
    data: { code: "G8-SCI", title: "Science — Grade 8", description: "Physics and chemistry foundations for Grade 8 students.", credits: 3, semester: "Fall 2026", color: "#0f766e", instructorId: instructor1.id, gradeId: gradeMap["Grade 8"].id },
  });
  const c3 = await prisma.course.create({
    data: { code: "G1-ENG", title: "English — Grade 1", description: "Reading, phonics and early writing for Grade 1.", credits: 3, semester: "Fall 2026", color: "#4338ca", instructorId: instructor2.id, gradeId: gradeMap["Grade 1"].id },
  });
  const c4 = await prisma.course.create({
    data: { code: "G1-MATHS", title: "Mathematics — Grade 1", description: "Numbers, counting and basic arithmetic for Grade 1.", credits: 3, semester: "Fall 2026", color: "#b45309", instructorId: instructor2.id, gradeId: gradeMap["Grade 1"].id },
  });
  const c5 = await prisma.course.create({
    data: { code: "G4-ISL", title: "Islamic Studies — Grade 4", description: "Foundations of Islamic teachings for Grade 4.", credits: 3, semester: "Fall 2026", color: "#15803d", instructorId: instructor3.id, gradeId: gradeMap["Grade 4"].id },
  });

  // Enrollments
  await prisma.enrollment.createMany({
    data: [
      { studentId: student1.id, courseId: c1.id },
      { studentId: student1.id, courseId: c2.id },
      { studentId: student2.id, courseId: c1.id },
      { studentId: student2.id, courseId: c2.id },
      { studentId: student3.id, courseId: c3.id },
      { studentId: student3.id, courseId: c4.id },
      { studentId: student4.id, courseId: c3.id },
      { studentId: student4.id, courseId: c4.id },
      { studentId: student5.id, courseId: c5.id },
    ],
  });

  // Progress updates
  await prisma.enrollment.updateMany({ where: { courseId: c1.id }, data: { progress: 65 } });
  await prisma.enrollment.updateMany({ where: { courseId: c2.id }, data: { progress: 30 } });
  await prisma.enrollment.updateMany({ where: { courseId: c3.id }, data: { progress: 50 } });
  await prisma.enrollment.updateMany({ where: { courseId: c4.id }, data: { progress: 20 } });
  await prisma.enrollment.updateMany({ where: { courseId: c5.id }, data: { progress: 80 } });

  // Modules & Lectures
  const m1 = await prisma.module.create({ data: { courseId: c1.id, title: "Algebra Foundations", order: 1 } });
  const m2 = await prisma.module.create({ data: { courseId: c1.id, title: "Geometry", order: 2 } });
  const m3 = await prisma.module.create({ data: { courseId: c1.id, title: "Statistics", order: 3 } });
  await prisma.lecture.createMany({
    data: [
      { courseId: c1.id, moduleId: m1.id, title: "Linear Equations", type: LectureType.VIDEO, contentUrl: "https://www.youtube.com/embed/oWbUtlUhwa8" },
      { courseId: c1.id, moduleId: m1.id, title: "Algebra Worksheet (PDF)", type: LectureType.PDF, contentUrl: "/uploads/algebra-worksheet.pdf" },
      { courseId: c1.id, moduleId: m2.id, title: "Properties of Shapes", type: LectureType.VIDEO, contentUrl: "https://www.youtube.com/embed/CHgJdlQz7dw" },
      { courseId: c1.id, moduleId: m3.id, title: "Data & Graphs", type: LectureType.LINK, contentUrl: "https://www.khanacademy.org/math/cc-eighth-grade-math" },
      { courseId: c2.id, title: "Intro to Physics", type: LectureType.VIDEO, contentUrl: "https://www.youtube.com/embed/aircAruvnKk" },
      { courseId: c3.id, title: "Phonics Basics", type: LectureType.PDF, contentUrl: "/uploads/phonics-basics.pdf" },
      { courseId: c5.id, title: "Module 1: Foundations of Ethics", type: LectureType.VIDEO, contentUrl: "https://www.youtube.com/embed/3xJqwbSP45Y" },
    ],
  });

  // Assignments
  const now = new Date();
  const a1 = await prisma.assignment.create({
    data: { courseId: c1.id, title: "Assignment 1: Linear Equations", description: "Solve linear equation problems and graph them.", dueDate: new Date(now.getTime() + 3 * 86400000), maxMarks: 100 },
  });
  const a2 = await prisma.assignment.create({
    data: { courseId: c1.id, title: "Quiz 1: Algebra", description: "Weekly quiz on linear equations.", dueDate: new Date(now.getTime() + 1 * 86400000), maxMarks: 20 },
  });
  await prisma.assignment.create({
    data: { courseId: c3.id, title: "Phonics Practice", description: "Submit your phonics workbook pages.", dueDate: new Date(now.getTime() + 5 * 86400000), maxMarks: 50 },
  });
  const a4 = await prisma.assignment.create({
    data: { courseId: c5.id, title: "Essay: Ethics in Daily Life", description: "Write a short essay on honesty.", dueDate: new Date(now.getTime() - 2 * 86400000), maxMarks: 25 },
  });

  // Submissions
  await prisma.submission.create({
    data: { assignmentId: a1.id, studentId: student1.id, text: "Submitted my solutions.", fileUrl: "/uploads/submission-a1-ayesha.pdf", status: "SUBMITTED" },
  });
  await prisma.submission.create({
    data: { assignmentId: a2.id, studentId: student1.id, text: "Quiz attempt.", status: "GRADED", marks: 18, feedback: "Excellent work! Careful with fractions.", gradedAt: new Date(now.getTime() - 86400000) },
  });
  await prisma.submission.create({
    data: { assignmentId: a4.id, studentId: student5.id, text: "My essay on honesty.", status: "GRADED", marks: 22, feedback: "Great depth of analysis.", gradedAt: new Date(now.getTime() - 86400000) },
  });

  // Attendance (last 5 days)
  for (let d = 4; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 86400000);
    date.setHours(9, 0, 0, 0);
    const students = [student1, student2];
    for (let i = 0; i < students.length; i++) {
      const status = (i + d) % 4 === 0 ? (i + d) % 3 === 0 ? "ABSENT" : "LATE" : "PRESENT";
      await prisma.attendanceRecord.upsert({
        where: { courseId_studentId_date: { courseId: c1.id, studentId: students[i].id, date } },
        update: { status: status as AttendanceStatus },
        create: { courseId: c1.id, studentId: students[i].id, date, status: status as AttendanceStatus },
      });
    }
  }

  // Announcements (no department scope; only GLOBAL and COURSE)
  await prisma.announcement.createMany({
    data: [
      { title: "Campus Wide: Semester Mid-Terms Schedule", body: "Mid-term examinations for Fall 2026 will commence on the 3rd week of next month. Please check your individual course pages for the detailed schedule.", scope: AnnouncementScope.GLOBAL, authorId: admin.id, pinned: true },
      { title: "Maths: Office Hours Update", body: "Office hours for Mathematics moved to Tuesdays and Thursdays 3-5 PM in room B-204.", scope: AnnouncementScope.COURSE, authorId: instructor1.id, courseId: c1.id },
    ],
  });

  // Timetable (Grade 8 students - days 0-6, Monday-first)
  await prisma.timetableSlot.createMany({
    data: [
      { courseId: c1.id, day: 0, start: "09:00", end: "10:30", room: "Room 8A" },
      { courseId: c2.id, day: 0, start: "11:00", end: "12:30", room: "Science Lab" },
      { courseId: c1.id, day: 2, start: "09:00", end: "10:30", room: "Room 8A" },
      { courseId: c2.id, day: 3, start: "02:00", end: "03:30", room: "Science Lab" },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: student1.id, title: "Assignment due soon", body: "'Assignment 1: Linear Equations' is due in 3 days." },
      { userId: student1.id, title: "New lecture uploaded", body: "Dr. Ahmed Raza uploaded 'Linear Equations' to Mathematics — Grade 8." },
      { userId: student1.id, title: "Grade published", body: "You scored 18/20 on 'Quiz 1: Algebra'." },
      { userId: instructor1.id, title: "New submission", body: "Ayesha Siddiqui submitted 'Assignment 1: Linear Equations'." },
    ],
  });

  console.log("Seeding complete!");
  console.log("Grade sections:");
  for (const g of GRADES) {
    const sections = gradeSections(g.name);
    console.log(`  ${g.name}: ${sections.length ? sections.join(", ") : "(no sections)"}`);
  }
  console.log("Demo accounts (password: password123):");
  console.log("  admin@iiui.edu.pk (Admin)");
  console.log("  instructor@iiui.edu.pk (Instructor)");
  console.log("  student@iiui.edu.pk (Student)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
