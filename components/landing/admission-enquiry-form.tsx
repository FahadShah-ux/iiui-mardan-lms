"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMISSION_STAGES } from "@/src/lib/admission-stages";

/**
 * Landing-page enquiry form. Posts to /api/admissions, which validates every
 * field server-side and stores the row.
 *
 * State updates happen only inside event handlers and async callbacks, never
 * synchronously in an effect body, so this satisfies the project's
 * `react-hooks/set-state-in-effect` error rule.
 */

const STAGES = ADMISSION_STAGES;

type Status = "idle" | "busy" | "done" | "error";

export function AdmissionEnquiryForm() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("busy");
    setMessage("");

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: data.get("parentName"),
          email: data.get("email"),
          phone: data.get("phone"),
          stage: data.get("stage"),
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus("error");
        setMessage(body?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      setMessage("Thank you. Our admissions team will contact you shortly.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-12 text-center">
        <CheckCircle2 className="h-9 w-9 text-[#990000]" />
        <p className="text-sm font-medium">Enquiry received</p>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
          Submit another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-border bg-card p-6 shadow-sm md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="parentName">Parent / Guardian Name</Label>
          <Input id="parentName" name="parentName" autoComplete="name" required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stage">Programme Stage</Label>
          <select
            id="stage"
            name="stage"
            required
            defaultValue=""
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Select a stage
            </option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={status === "busy"}
        className="mt-6 w-full bg-[#990000] hover:bg-[#7a0000] sm:w-auto"
      >
        {status === "busy" && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Admission Inquiry
      </Button>
    </form>
  );
}