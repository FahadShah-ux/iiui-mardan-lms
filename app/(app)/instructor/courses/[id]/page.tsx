"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CourseModulesManager } from "@/components/instructor/course-modules";
import { AssignmentsManager } from "@/components/instructor/assignments-manager";
import { EnrolledStudents } from "@/components/instructor/enrolled-students";

type Lecture = {
  id: string;
  title: string;
  type: string;
  contentUrl: string;
};

type CourseDetailData = {
  id: string;
  title: string;
  code: string;
  semester: string;
  credits: number;
  description: string;
  grade: { name: string } | null;
  modules: { id: string; title: string; order: number; lectures: Lecture[] }[];
  unassignedLectures: Lecture[];
  assignments: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
    submissions: { status: string }[];
  }[];
  students: { id: string; name: string; email: string }[];
  studentCount: number;
};

export default function InstructorCourseDetailPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = React.useState<CourseDetailData | null>(null);
  const [error, setError] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user || !id) return;
    apiFetch<CourseDetailData>(`/api/instructor/courses/${id}`)
      .then(setData)
      .catch(() => setError(true));
  }, [mounted, user, id, refreshKey]);

  const handleChildRefresh = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (!mounted || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    if (error) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Course not found.</p>
        </div>
      );
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={data.title}
        description={`${data.code} · ${data.semester} · ${data.credits} credits`}
        actions={<Badge variant="secondary">{data.grade?.name ?? "No grade"}</Badge>}
      />

      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">{data.description}</p>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Modules & Lectures</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students ({data.studentCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <CourseModulesManager
            modules={data.modules}
            unassignedLectures={data.unassignedLectures}
            courseIdForApi={data.id}
            onRefresh={handleChildRefresh}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsManager
            courseId={data.id}
            assignments={data.assignments}
            onRefresh={handleChildRefresh}
          />
        </TabsContent>

        <TabsContent value="students">
          <EnrolledStudents students={data.students} />
        </TabsContent>
      </Tabs>
    </div>
  );
}