
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  CalendarDays,
  ClipboardCheck,
  Users,
  Megaphone,
  BarChart3,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/grades", label: "Grades", icon: GraduationCap },
    { href: "/admin/courses", label: "Course Allocation", icon: BookOpen },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
  INSTRUCTOR: [
    { href: "/instructor", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/instructor/courses", label: "My Courses", icon: BookOpen },
    { href: "/instructor/grading", label: "Grading", icon: ClipboardCheck },
    { href: "/instructor/attendance", label: "Attendance", icon: CalendarDays },
  ],
  STUDENT: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/student/courses", label: "My Courses", icon: GraduationCap },
    { href: "/student/grades", label: "Grades", icon: FileText },
    { href: "/student/attendance", label: "Attendance", icon: CalendarDays },
    { href: "/student/timetable", label: "Timetable", icon: CalendarDays },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  INSTRUCTOR: "Faculty Member",
  STUDENT: "Student",
};

export function Sidebar({
  role,
  name,
  open,
  onOpenChange,
}: {
  role: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const items = NAV_BY_ROLE[role] ?? [];
  const isDark = resolvedTheme === "dark";
  const labelColor = isDark ? "text-zinc-300" : "text-zinc-700";
  const activeBg = isDark ? "bg-[#c1121f]/15 text-[#ff9999]" : "bg-[#990000]/10 text-[#990000]";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 lg:flex",
          open ? "flex translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={cn("flex flex-col gap-1 p-4", labelColor)}>
          <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">Menu</p>
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <p className={cn("truncate text-sm font-semibold", labelColor)}>{name}</p>
              <p className={cn("truncate text-xs", isDark ? "text-[#c1121f]" : "text-[#990000]")}>
                {ROLE_LABEL[role] ?? role}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 lg:hidden" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? activeBg : cn(labelColor, isDark ? "hover:bg-white/5" : "hover:bg-black/5")
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <p className={cn("text-[11px] leading-relaxed", isDark ? "text-zinc-500" : "text-zinc-400")}>
            Islamic International University
            <br />
            Islamabad - Mardan Campus
          </p>
        </div>
      </aside>
    </>
  );
}

