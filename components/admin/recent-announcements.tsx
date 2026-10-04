import { Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Announcement = {
  id: string;
  title: string;
  author: string;
  pinned: boolean;
  scope: string;
  createdAt: string;
};

const SCOPE_LABEL: Record<string, string> = {
  GLOBAL: "Global",
  COURSE: "Course",
};

export function RecentAnnouncements({ data }: { data: Announcement[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No announcements yet.</p>;
  }
  return (
    <div className="space-y-2">
      {data.map((a) => (
        <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {a.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-[#c1121f]" />}
              <p className="truncate text-sm font-medium">{a.title}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              by {a.author} · {new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary">{SCOPE_LABEL[a.scope] ?? a.scope}</Badge>
        </div>
      ))}
    </div>
  );
}
