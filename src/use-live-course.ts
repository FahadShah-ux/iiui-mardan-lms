"use client";

import * as React from "react";
import { apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";

const REFRESH_INTERVAL_MS = 20000;

export function useLiveCourse<T>(courseId: string | null, fallback: T | null = null) {
  const mounted = useMounted();
  const [data, setData] = React.useState<T | null>(fallback);
  const lastPayloadRef = React.useRef<string>(fallback ? JSON.stringify(fallback) : "");

  React.useEffect(() => {
    if (!mounted || !courseId) return;

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    async function fetchOnce() {
      if (cancelled) return;
      try {
        const next = await apiFetch<T>(`/api/student/courses/${courseId}`);
        if (cancelled) return;
        const payload = JSON.stringify(next);
        if (payload !== lastPayloadRef.current) {
          lastPayloadRef.current = payload;
          setData(next);
        }
      } catch {
        // transient error: keep showing last known data
      }
    }

    function schedule() {
      if (cancelled) return;
      timerId = setTimeout(async () => {
        await fetchOnce();
        schedule();
      }, REFRESH_INTERVAL_MS);
    }

    function onVisibility() {
      if (document.hidden) {
        if (timerId) clearTimeout(timerId);
        timerId = null;
      } else {
        if (timerId) clearTimeout(timerId);
        void fetchOnce();
        schedule();
      }
    }

    void fetchOnce();
    schedule();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mounted, courseId]);

  return data;
}
