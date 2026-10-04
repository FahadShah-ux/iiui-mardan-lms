"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User as UserIcon, Settings, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch, useAuth } from "@/src/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/src/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function Topbar({ name, role, onMenuClick }: { name: string; role: string; onMenuClick?: () => void }) {
  const router = useRouter();
  const clearSession = useAuth((s) => s.clearSession);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [notifs, setNotifs] = React.useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    apiFetch<Notification[]>("/api/notifications")
      .then((data) => setNotifs(data))
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));
  }, []);

  const unread = notifs.filter((n) => !n.read).length;
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const markAllRead = async () => {
    await apiFetch("/api/notifications", { method: "PATCH" });
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };

  const signOut = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearSession();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden flex-1 md:block">
        <div className="relative max-w-md">
          <Search className={cn("absolute left-3 top-2.5 h-4 w-4", isDark ? "text-zinc-500" : "text-zinc-400")} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                router.push(`/search?q=${encodeURIComponent(search.trim())}`);
              }
            }}
            placeholder="Search courses, lectures..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c1121f] text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0" align="end">
            <div className="flex items-center justify-between border-b p-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#990000] hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loadingNotifs && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
              {!loadingNotifs && notifs.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No notifications</p>
              )}
              {notifs.map((n) => (
                <div key={n.id} className={cn("border-b p-3 last:border-0", !n.read && "bg-primary/5")}>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {role === "ADMIN" ? "Administrator" : role === "INSTRUCTOR" ? "Faculty" : "Student"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <UserIcon className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
