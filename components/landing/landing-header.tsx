"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Landing-page header: crimson square logo box with a double-bar mark,
 * wordmark plus sub-tagline, then the theme toggle and a mobile menu.
 *
 * The spec calls for a squared logo rather than the circular one used in the
 * app chrome, and a hamburger instead of the inline desktop nav.
 */

const NAV_LINKS = [
  { href: "#mission", label: "Our Mission" },
  { href: "#academics", label: "Academics" },
  { href: "#community", label: "Community" },
  { href: "#news", label: "News" },
  { href: "#admissions", label: "Admissions" },
];

export function LandingHeader({ lmsHref }: { lmsHref: string }) {
  const [open, setOpen] = React.useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={close}>
          {/* Squared crimson logo box with a white double bar */}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#990000] text-white">
            <span aria-hidden className="flex gap-[3px]">
              <span className="block h-4 w-[3px] bg-white" />
              <span className="block h-4 w-[3px] bg-white" />
            </span>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-bold tracking-tight">IIUI School</span>
            <span className="hidden truncate text-[11px] text-muted-foreground sm:block">
              Excellence · Character · Technology
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav
          id="landing-mobile-nav"
          className="border-t border-border bg-background lg:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2 md:px-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="border-b border-border/60 py-3 text-sm font-medium last:border-b-0"
              >
                {l.label}
              </a>
            ))}
            <Link
              href={lmsHref}
              onClick={close}
              className="mt-3 mb-2 inline-flex items-center justify-center rounded-md bg-[#990000] px-4 py-2 text-sm font-medium text-white"
            >
              Access LMS Portal
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}