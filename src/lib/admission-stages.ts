/**
 * Programme stages offered on the public landing page.
 *
 * Single source of truth on purpose: the form's dropdown and the API's
 * validation allowlist must never disagree, or a user can pick an option the
 * server then rejects with a 400. The route re-checks against this list rather
 * than trusting the client.
 */
export const ADMISSION_STAGES = [
  "Pre-School (Ages 3–5)",
  "Primary (Grades 1–5)",
  "Secondary (Grades 6–10)",
  "College (Grades 11–12)",
  "Undergraduate Degree",
] as const;

export type AdmissionStage = (typeof ADMISSION_STAGES)[number];

export function isAdmissionStage(value: string): value is AdmissionStage {
  return (ADMISSION_STAGES as readonly string[]).includes(value);
}