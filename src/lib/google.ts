import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Verification of Google ID tokens.
 *
 * Uses Google's published JWKS endpoint, so there is no client secret and no
 * shared secret to rotate. Tokens are validated for signature, audience,
 * issuer, expiry and `email_verified` before we trust the email inside them.
 */

const GOOGLE_JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export function googleClientId(): string | null {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  return id ? id : null;
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function googleKeys() {
  // createRemoteJWKSet caches the certs and refetches only on an unknown `kid`.
  if (!cachedJwks) cachedJwks = createRemoteJWKSet(GOOGLE_JWKS_URL);
  return cachedJwks;
}

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export async function verifyGoogleIdToken(credential: string): Promise<GoogleIdentity> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new GoogleAuthError("Google sign-in is not configured on this server.");
  }

  let payload;
  try {
    // jose v6 accepts a single `issuer` option; pass both accepted spellings.
    ({ payload } = await jwtVerify(credential, googleKeys(), {
      audience: clientId,
      issuer: GOOGLE_ISSUERS,
      algorithms: ["RS256"],
    }));
  } catch {
    // Deliberately opaque: never surface jose/JWKS internals to the client.
    throw new GoogleAuthError("Google sign-in failed. Please try again.");
  }

  if (!payload.sub) {
    throw new GoogleAuthError("Google token was missing a subject.");
  }

  // Google sets this to boolean true for addresses it has verified. Without this
  // check an unverified address could be used to claim an existing account.
  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw new GoogleAuthError("Your Google account email is not verified.");
  }

  if (typeof payload.email !== "string" || !payload.email.includes("@")) {
    throw new GoogleAuthError("Google token was missing an email address.");
  }

  const email = payload.email.toLowerCase();
  return {
    sub: payload.sub,
    email,
    name: typeof payload.name === "string" && payload.name ? payload.name : email,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
