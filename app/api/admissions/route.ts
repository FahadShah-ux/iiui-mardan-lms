import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdmissionStage } from "@/src/lib/admission-stages";

/**
 * Public landing-page admission enquiries.
 *
 * Unauthenticated write endpoint, so it validates every field server-side and
 * is rate limited by IP. Deliberately has no relation to User: an anonymous
 * visitor must not be able to reference or provision an account.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME = 80;
const MAX_PHONE = 24;
const MAX_EMAIL = 254;

type Bucket = { total: number; failures: number; resetAt: number };
const BUCKETS = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;

// Two ceilings, because the two threats here have different shapes. `total`
// bounds how much can be written to the database; `failures` detects junk and
// submission scripts. A single low cap on everything would punish a real
// visitor, because an entire campus can share one public IP behind carrier NAT
// -- note that only rejections count toward `failures`, so a busy shared IP
// sending valid enquiries never approaches the ceiling.
const MAX_TOTAL = 60;
const MAX_FAILURES = 8;

function bucketFor(key: string): Bucket {
  const now = Date.now();
  const existing = BUCKETS.get(key);
  if (existing && existing.resetAt > now) return existing;

  // Sweep expired entries so the map cannot grow without bound.
  if (BUCKETS.size > 5000) {
    for (const [k, v] of BUCKETS) if (v.resetAt <= now) BUCKETS.delete(k);
  }
  const fresh: Bucket = { total: 0, failures: 0, resetAt: now + WINDOW_MS };
  BUCKETS.set(key, fresh);
  return fresh;
}

/**
 * True once this key has tripped either ceiling. Blocking is all-or-nothing:
 * once tripped, even a well-formed payload is refused until the window rolls
 * over. A lockout that only rejected *more* invalid input would be trivially
 * bypassed by sending valid data instead.
 */
function isBlocked(bucket: Bucket): boolean {
  return bucket.total > MAX_TOTAL || bucket.failures > MAX_FAILURES;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  const bucket = bucketFor(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );

  // Counted before the lockout check so a blocked caller still consumes budget.
  bucket.total += 1;
  if (isBlocked(bucket)) {
    return NextResponse.json(
      { error: "Too many enquiries from this connection. Please try again later." },
      { status: 429 }
    );
  }

  const reject = (error: string) => {
    bucket.failures += 1;
    if (isBlocked(bucket)) {
      return NextResponse.json(
        { error: "Too many enquiries from this connection. Please try again later." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error }, { status: 400 });
  };

  const body = await req.json().catch(() => null);

  const parentName = text(body?.parentName);
  const email = text(body?.email).toLowerCase();
  const phone = text(body?.phone);
  const stage = text(body?.stage);

  if (parentName.length < 2 || parentName.length > MAX_NAME) {
    return reject("Please enter your full name.");
  }
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return reject("Please enter a valid email address.");
  }
  if (phone.length < 6 || phone.length > MAX_PHONE) {
    return reject("Please enter a valid contact number.");
  }
  if (!isAdmissionStage(stage)) {
    return reject("Please choose a programme stage.");
  }

  await prisma.admissionEnquiry.create({
    data: { parentName, email, phone, stage },
  });
  // A well-formed submission clears the rejection count, so an ordinary typo
  // cannot use up the budget of whoever is sharing this IP.
  bucket.failures = 0;

  // Deliberately does not echo the stored row back.
  return NextResponse.json({ ok: true }, { status: 201 });
}