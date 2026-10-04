"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
};

export const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  INSTRUCTOR: "/instructor",
  STUDENT: "/student",
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: "lms-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return useAuth.getState().token;
}

export async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const token = getClientToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        useAuth.getState().clearSession();
        window.location.replace("/login");
      }
    }
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

function isApiFile(url: string): boolean {
  return (
    url.startsWith("/api/files/") ||
    (typeof window !== "undefined" && url.startsWith(window.location.origin + "/api/files/"))
  );
}

async function fetchAuthedFile(url: string): Promise<Blob> {
  if (!isApiFile(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("failed");
    return res.blob();
  }
  const token = getClientToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("failed");
  return res.blob();
}

export async function openAuthedInNewTab(url: string, docTitle = "file"): Promise<void> {
  const blob = await fetchAuthedFile(url);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  void docTitle;
}

export async function downloadAuthed(url: string, filename = "file"): Promise<void> {
  const blob = await fetchAuthedFile(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
