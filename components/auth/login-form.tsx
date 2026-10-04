"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth, ROLE_HOME } from "@/src/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/custom-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Invalid email or password, or account is inactive.");
        setLoading(false);
        return;
      }
      setSession(data.token, data.user);
      router.push(ROLE_HOME[data.user.role] ?? "/student");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#990000] text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to the IIUI Mardan Campus Learning Management System
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@iiui.edu.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">Demo accounts (password: password123)</p>
          <p>Admin: admin@iiui.edu.pk</p>
          <p>Instructor: instructor@iiui.edu.pk</p>
          <p>Student: student@iiui.edu.pk</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoginBody() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-14 items-center justify-between border-b bg-gradient-to-r from-[#990000] to-[#c1121f] px-4 text-white">
        <p className="truncate text-sm font-semibold">
          Islamic International University Islamabad - Mardan Campus
        </p>
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#990000]/10 via-background to-background p-4">
        <LoginForm />
      </main>
    </div>
  );
}
