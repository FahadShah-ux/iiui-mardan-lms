"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GraduationCap, FileText, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch } from "@/src/auth-client";

type Results = {
  courses: { id: string; code: string; title: string }[];
  lectures: { id: string; title: string; courseId: string }[];
  announcements: { id: string; title: string }[];
};

export function SearchResults() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const [results, setResults] = React.useState<Results | null>(null);

  React.useEffect(() => {
    if (!q.trim()) return;
    apiFetch<Results>(`/api/search?q=${encodeURIComponent(q)}`)
      .then(setResults)
      .catch(() => {});
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Search results for "${q}"`} description="Courses, lectures, and announcements" />
      {!results && <EmptyState title="Searching..." />}
      {results && results.courses.length === 0 && results.lectures.length === 0 && results.announcements.length === 0 && (
        <EmptyState title="No results found" description="Try different keywords." />
      )}
      {results && results.courses.length > 0 && (
        <SearchSection icon={GraduationCap} title="Courses">
          {results.courses.map((c) => (
            <ResultRow key={c.id} href={`/course/${c.id}`} title={c.title} sub={c.code} />
          ))}
        </SearchSection>
      )}
      {results && results.lectures.length > 0 && (
        <SearchSection icon={FileText} title="Lectures">
          {results.lectures.map((l) => (
            <ResultRow key={l.id} href={`/course/${l.courseId}`} title={l.title} sub="Lecture" />
          ))}
        </SearchSection>
      )}
      {results && results.announcements.length > 0 && (
        <SearchSection icon={Megaphone} title="Announcements">
          {results.announcements.map((a) => (
            <ResultRow key={a.id} href="#" title={a.title} sub="Announcement" />
          ))}
        </SearchSection>
      )}
    </div>
  );
}

function SearchSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ResultRow({ href, title, sub }: { href: string; title: string; sub?: string }) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="flex items-center justify-between p-4">
          <span className="font-medium">{title}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </CardContent>
      </Card>
    </Link>
  );
}
