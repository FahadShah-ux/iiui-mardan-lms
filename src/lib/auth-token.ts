import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export type AuthTokenPayload = {
  sub: string;
  role: string;
  name: string;
  email: string;
  v?: number;
};

const TOKEN_TTL = "7d";
const ALG = "HS256";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a strong secret (at least 32 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, email: payload.email, v: payload.v ?? 0 })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
    if (!payload.sub || !payload.role) return null;
    return {
      sub: payload.sub,
      role: payload.role as string,
      name: (payload.name as string) || "",
      email: (payload.email as string) || "",
      v: typeof payload.v === "number" ? payload.v : 0,
    };
  } catch {
    return null;
  }
}

export function getBearerToken(req: NextRequest | Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
