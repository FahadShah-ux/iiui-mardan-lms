"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Folder, FileText, Video, LinkIcon, FileArchive, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth, apiFetch, openAuthedInNewTab } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

const TYPE_LABEL: Record<string, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  LINK: "Link",
  FILE: "File",
};

function TypeIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Video className="h-4 w-4 text-[#c1121f]" />;
  if (type === "PDF") return <FileText className="h-4 w-4 text-[#c1121f]" />;
  if (type === "LINK") return <LinkIcon className="h-4 w-4 text-[#c1121f]" />;
  return <FileArchive className="h-4 w-4 text-[#c1121f]" />;
}

type Lecture = { id: string; title: string; type: string; contentUrl: string | null };
type Module = { id: string; title: string; lectures: Lecture[] };

type CourseData = {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  semester: string;
  instructor: { name: string } | null;
  grade: { name: string } | null;
  enrollmentsCount: number;
  isEnrolled: boolean;
  modules: Module[];
  lectures: Lecture[];
};

function isApiFile(url: string): boolean {
  return (
    url.startsWith("/api/files/") ||
    (typeof window !== "undefined" && url.startsWith(window.location.origin + "/api/files/"))
  );
}

function OpenLink({ url }: { url: string | null }) {
  if (!url) {
    return <span className="text-xs text-muted-foreground">Enroll to access</span>;
  }
  return (
    <a
      href={isApiFile(url) ? undefined : url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        if (isApiFile(url)) {
          e.preventDefault();
          void openAuthedInNewTab(url);
        }
      }}
      className="text-xs text-[#990000] hover:underline"
    >
      Open
    </a>
  );
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const id = params?.id;
  const [data, setData] = React.useState<CourseData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

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
    apiFetch<CourseData>(`/api/course/${id}`)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [mounted, user, id, attempt]);

  if (!mounted || !user) return <LoadingScreen />;

  if (error) {
    // The back link is a genuine escape hatch, so it stays. Retry is what
    // separates a real 404 from a transient network or server failure, which
    // this single message cannot distinguish.
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>
          <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
        <EmptyState title="Course not found" description="The course you are looking for does not exist or is unavailable." />
      </div>
    );
  }

  if (!data) return <LoadingScreen />;

  const course = data;
  const isEnrolled = course.isEnrolled;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/search" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <PageHeader
        title={course.title}
        description={`${course.code} · ${course.semester} · ${course.credits} credits · by ${course.instructor?.name ?? "Unassigned"}`}
        actions={
          isEnrolled ? (
            <Button asChild>
              <Link href={`/student/courses/${course.id}`}>Go to Course</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="secondary">{course.grade?.name ?? "No grade"}</Badge>
        <Badge variant="outline">{course.enrollmentsCount} students enrolled</Badge>
      </div>

      <p className="mb-8 max-w-3xl text-sm text-muted-foreground">{course.description || "No description provided."}</p>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Folder className="h-5 w-5 text-[#990000]" /> Course Content</h2>

      {course.modules.length === 0 && course.lectures.length === 0 && (
        <EmptyState title="No content available" description="The instructor has not published any lectures yet." />
      )}

      <div className="space-y-4">
        {course.modules.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-5">
              <p className="mb-3 font-semibold">{m.title}</p>
              <div className="space-y-2">
                {m.lectures.length === 0 && <p className="text-sm text-muted-foreground">No lectures in this module.</p>}
                {m.lectures.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <TypeIcon type={l.type} />
                    <span className="flex-1 truncate text-sm font-medium">{l.title}</span>
                    <Badge variant="secondary">{TYPE_LABEL[l.type] ?? l.type}</Badge>
                    {(l.type === "PDF" || l.type === "FILE" || l.type === "VIDEO" || l.type === "LINK") && (
                      <OpenLink url={l.contentUrl} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {course.lectures.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <p className="mb-3 font-semibold text-muted-foreground">Resources</p>
              <div className="space-y-2">
                {course.lectures.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <TypeIcon type={l.type} />
                    <span className="flex-1 truncate text-sm font-medium">{l.title}</span>
                    <Badge variant="secondary">{TYPE_LABEL[l.type] ?? l.type}</Badge>
                    <OpenLink url={l.contentUrl} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
