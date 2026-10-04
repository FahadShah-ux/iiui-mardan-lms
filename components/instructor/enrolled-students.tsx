"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

type Student = { id: string; name: string; email: string };

export function EnrolledStudents({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return <EmptyState title="No students enrolled" description="Once students enroll, they will appear here." />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {students.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-4">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-[11px]">{s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
