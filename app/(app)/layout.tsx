"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BrandBanner } from "@/components/layout/brand-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user || !token) {
      router.replace("/login");
    }
  }, [mounted, user, token, router]);

  if (!mounted || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BrandBanner />
      <div className="flex min-h-[calc(100vh-56px)]">
        <Sidebar role={user.role} name={user.name} open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar name={user.name} role={user.role} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
