"use client";

import * as React from "react";
import { Trash2, Pin, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch } from "@/src/auth-client";

type Announcement = {
  id: string;
  title: string;
  body: string;
  scope: string;
  pinned: boolean;
  author: string;
  course: string | null;
  createdAt: string;
};

type Props = { initial: Announcement[] };

const SCOPE_LABEL: Record<string, string> = {
  GLOBAL: "Global",
  COURSE: "Course",
};

export function AnnouncementsManager({ initial }: Props) {
  const [items, setItems] = React.useState<Announcement[]>(initial);

  async function remove(a: Announcement) {
    if (!confirm(`Delete announcement "${a.title}"?`)) return;
    await apiFetch(`/api/announcements?id=${a.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== a.id));
  }

  return (
    <Card>
      <CardContent className="p-0">
        {items.length === 0 && (
          <div className="p-6"><EmptyState title="No announcements yet" description="Post a global announcement to get started." /></div>
        )}
        <div className="divide-y">
          {items.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-4">
              {a.pinned && <Pin className="mt-0.5 h-4 w-4 shrink-0 text-[#c1121f]" />}
              {!a.pinned && <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  <Badge variant="secondary">{SCOPE_LABEL[a.scope] ?? a.scope}</Badge>
                  {a.course && <Badge variant="outline">{a.course}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">by {a.author} · {new Date(a.createdAt).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(a)} title="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
