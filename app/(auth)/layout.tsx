"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ROLE_HOME, useAuth } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);

  React.useEffect(() => {
    if (!mounted) return;
    if (user && ROLE_HOME[user.role]) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [mounted, user, router]);

  return <>{children}</>;
}
