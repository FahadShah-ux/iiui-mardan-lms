"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { AdminCoursesManager } from "@/components/admin/courses-manager";

type CoursesData = {
  courses: {
    id: string;
    code: string;
    title: string;
    description: string;
    credits: number;
    semester: string;
    color: string;
    instructorId: string | null;
    instructorName: string | null;
    gradeId: string | null;
    gradeName: string | null;
    enrollments: number;
    assignments: number;
  }[];
  instructors: { id: string; name: string }[];
  grades: { id: string; name: string }[];
};

export default function AdminCoursesPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<CoursesData | null>(null);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    apiFetch<CoursesData>("/api/admin/courses/page")
      .then(setData)
      .catch(() => {});
  }, [mounted, user]);

  if (!mounted || !user)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader title="Course Allocation" description="Create courses and assign instructors and grades." />
      <AdminCoursesManager
        initial={data.courses}
        instructors={data.instructors}
        grades={data.grades}
      />
    </div>
  );
}