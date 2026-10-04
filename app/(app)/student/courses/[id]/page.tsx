"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { useLiveCourse } from "@/src/use-live-course";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CourseContentPlayer } from "@/components/student/course-content";
import { AssignmentList } from "@/components/student/assignment-list";
import { Progress } from "@/components/ui/progress";

type ModuleData = { id: string; title: string; lectures: { id: string; title: string; type: string; contentUrl: string }[] };
type LectureData = { id: string; title: string; type: string; contentUrl: string };
type CourseData = {
  progress: number;
  title: string;
  code: string;
  semester: string;
  credits: number;
  description: string;
  instructorName: string | null;
  gradeName: string | null;
  modules: ModuleData[];
  unassignedLectures: LectureData[];
  assignments: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
    submission: {
      id: string;
      status: string;
      marks: number | null;
      feedback: string | null;
      text: string | null;
      fileUrl: string | null;
    } | null;
  }[];
};

export default function StudentCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [id, setId] = React.useState<string | null>(null);
  const data = useLiveCourse<CourseData>(id, null);

  React.useEffect(() => {
    let cancelled = false;
    params.then((p) => { if (!cancelled) setId(p.id); });
    return () => { cancelled = true; };
  }, [params]);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) { router.replace("/login"); return; }
  }, [mounted, user, router]);

  if (!mounted || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title={data.title}
        description={`${data.code} · ${data.semester} · ${data.credits} credits · by ${data.instructorName ?? "Unknown"}`}
        actions={<div className="flex items-center gap-2"><Badge variant="outline">{data.gradeName ?? "No grade"}</Badge><Badge variant="secondary">{data.progress}% complete</Badge></div>}
      />

      <p className="mb-4">{data.description}</p>
      <div className="mb-6 max-w-md">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Course progress</span>
          <span className="font-medium">{data.progress}%</span>
        </div>
        <Progress value={data.progress} indicatorClassName="bg-[#990000]" />
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Lecture Material</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({data.assignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <CourseContentPlayer
            modules={data.modules.map((m) => ({
              id: m.id,
              title: m.title,
              lectures: m.lectures.map((l) => ({ id: l.id, title: l.title, type: l.type, contentUrl: l.contentUrl })),
            }))}
            unassignedLectures={data.unassignedLectures.map((l) => ({ id: l.id, title: l.title, type: l.type, contentUrl: l.contentUrl }))}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentList
            assignments={data.assignments.map((a) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              dueDate: a.dueDate,
              maxMarks: a.maxMarks,
              submission: a.submission,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
