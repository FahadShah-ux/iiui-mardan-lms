"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
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
  const [error, setError] = React.useState<string | null>(null);
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
    let cancelled = false;
    apiFetch<CourseDetailData>(`/api/instructor/courses/${id}`)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [mounted, user, id, refreshKey]);

  // Already the page's refresh mechanism, so retry reuses it rather than
  // adding a second counter.
  const handleChildRefresh = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (!mounted || !user) return <LoadingScreen variant="section" />;
  if (!data) {
    if (error) {
      // Previously read "Course not found.", which is wrong for a network or
      // server failure. Retry is what distinguishes a genuine 404 from a
      // transient error.
      return (
        <ErrorState
          title="Could not load this course"
          description={error}
          onRetry={handleChildRefresh}
        />
      );
    }
    return <LoadingScreen variant="section" />;
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