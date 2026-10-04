"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/src/auth-client";

export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function enroll() {
    setBusy(true);
    try {
      await apiFetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={enroll} disabled={busy} className="w-full">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Enroll
    </Button>
  );
}
