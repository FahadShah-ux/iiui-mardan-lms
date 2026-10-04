"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuth, ROLE_HOME } from "@/src/auth-client";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

const BUTTON_THEME = {
  theme: "outline",
  size: "large",
  width: 400,
  text: "continue_with" as const,
  shape: "rectangular" as const,
  logo_alignment: "left" as const,
};

type CredentialResponse = { credential?: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
  }) => void;
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

/**
 * Renders Google's official sign-in button.
 *
 * Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is absent, which is how the
 * feature is switched off without touching code.
 */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mountedRef = React.useRef(false);

  const signInWith = React.useCallback(
    async (credential?: string) => {
      if (!credential) {
        onError("Google sign-in did not return a credential.");
        return;
      }
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          onError(data?.error ?? "Google sign-in failed.");
          return;
        }
        setSession(data.token, data.user);
        router.push(ROLE_HOME[data.user.role] ?? "/student");
        router.refresh();
      } catch {
        onError("Google sign-in failed. Please try again.");
      }
    },
    [onError, router, setSession]
  );

  const mountButton = React.useCallback(() => {
    // onLoad and onReady can both fire, and React Strict Mode double-invokes in
    // dev. Google warns if initialize() is called twice on the same context.
    if (mountedRef.current) return;
    const googleId = window.google?.accounts?.id;
    if (!googleId || !containerRef.current) return;
    mountedRef.current = true;
    googleId.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        void signInWith(response?.credential);
      },
    });
    googleId.renderButton(containerRef.current, BUTTON_THEME);
  }, [signInWith]);

  if (!CLIENT_ID) return null;

  return (
    <div className="mt-4">
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onLoad={mountButton} onReady={mountButton} />
      <div className="flex justify-center">
        <div ref={containerRef} />
      </div>
    </div>
  );
}
