"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, apiFetch } from "@/src/auth-client";
import { useMounted } from "@/src/use-mounted";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  INSTRUCTOR: "Faculty Member",
  STUDENT: "Student",
};

type ProfileData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    grade: { name: string } | null;
    section: string | null;
  };
  stats: [number, number];
};

export default function ProfilePage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [mounted, user, router]);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let cancelled = false;
    apiFetch<ProfileData>("/api/profile")
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [mounted, user, attempt]);

  if (!mounted || !user) return <LoadingScreen />;

  // Checked before `!data`: the old order made this branch unreachable, so the
  // page spun forever instead of reporting the failure.
  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="My Profile" description="View your account information." />
        <Card>
          <CardContent className="p-6">
            <ErrorState
              className="py-4"
              title="Could not load your profile"
              description={error}
              onRetry={() => setAttempt((a) => a + 1)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return <LoadingScreen />;

  const profile = data.user;
  const stats = data.stats;
  const initials = profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My Profile" description="View your account information." />

      <Card className="mb-6">
        <CardContent className="flex flex-col items-center gap-4 p-8 sm:flex-row sm:items-start sm:text-left text-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant="secondary">{ROLE_LABEL[profile.role] ?? profile.role}</Badge>
              <Badge variant={profile.status === "ACTIVE" ? "success" : "destructive"}>{profile.status}</Badge>
              {profile.grade && <Badge variant="outline">{profile.grade.name}{profile.section ? ` · ${profile.section}` : ""}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{profile.role === "INSTRUCTOR" ? "Courses Taught" : "Enrolled Courses"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#990000]">{stats[0]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{profile.role === "INSTRUCTOR" ? "Pending Grading" : "Submissions"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats[1]}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
          <CardDescription>Manage your profile. Changes take effect system-wide.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input defaultValue={profile.name} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input defaultValue={profile.email} readOnly />
          </div>
          {profile.grade && (
            <div className="space-y-1.5">
              <Label>Grade</Label>
              <Input defaultValue={profile.grade.name + (profile.section ? ` · ${profile.section}` : "")} readOnly />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
