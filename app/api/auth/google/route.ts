import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken } from "@/src/lib/auth-token";
import { GoogleAuthError, googleClientId, verifyGoogleIdToken } from "@/src/lib/google";

/**
 * Google Sign-In (ID token / GIS flow).
 *
 * Signs in EXISTING users only. This endpoint never creates a User row, so it
 * cannot be used to obtain an account or a role that an admin did not already
 * provision. Matching is by the Google-verified email.
 *
 * Response shape is deliberately identical to /api/auth/custom-login so the
 * client calls the same setSession().
 */
export async function POST(req: NextRequest) {
  if (!googleClientId()) {
    return NextResponse.json({ error: "Google sign-in is not enabled." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const credential = typeof body?.credential === "string" ? body.credential.trim() : "";
  if (!credential) {
    return NextResponse.json({ error: "Missing Google credential" }, { status: 400 });
  }

  let identity;
  try {
    identity = await verifyGoogleIdToken(credential);
  } catch (err) {
    const message =
      err instanceof GoogleAuthError
        ? err.message
        : "Google sign-in failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: identity.email } });

  if (!user) {
    return NextResponse.json(
      {
        error: `No LMS account exists for ${identity.email}. Ask an administrator to create it, then sign in with Google.`,
      },
      { status: 403 }
    );
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "This account is inactive." }, { status: 403 });
  }

  const token = await signToken({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    v: user.tokenVersion,
  });

  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
