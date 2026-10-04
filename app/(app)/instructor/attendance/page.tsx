"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { AttendancePanel } from "@/components/instructor/attendance-panel";

type Student = { id: string; name: string; email: string };
type Course = { id: string; title: string; code: string; semester: string; students: Student[] };

export default function InstructorAttendancePage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [courses, setCourses] = React.useState<Course[] | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<Course[]>("/api/instructor/attendance")
      .then(setCourses)
      .catch(() => setError(true));
  }, [mounted, user]);

  if (!mounted || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!courses) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  void error;

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily student attendance." />
      <AttendancePanel courses={courses} />
    </div>
  );
}