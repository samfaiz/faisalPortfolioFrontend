import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Shared-password gate for the internal annexes on the AI SOC path.
 *
 * Threat model, stated plainly: this keeps internal notes off the public web
 * and out of search results. It is a shared password for a small known team —
 * it is NOT per-user auth, there is no identity, and it should never guard
 * anything whose disclosure would be a genuine incident. If the annexes ever
 * need to hold customer data or credentials, this is the wrong control and
 * should be replaced with real accounts.
 *
 * What it does get right:
 *
 *  - The password never reaches the client. No NEXT_PUBLIC_, no client-side
 *    comparison, and gated pages render nothing until the cookie verifies —
 *    so the protected HTML is never sent, rather than sent and hidden.
 *  - The cookie is a signed token, not a boolean. `internal=1` would be
 *    trivially forged from devtools; this carries an HMAC over its own expiry
 *    that only the server can produce.
 *  - Comparison is constant time on both the password and the signature, so
 *    neither leaks through response timing.
 *  - Attempts are rate limited per IP.
 */

const COOKIE = "ai_soc_internal";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h — a working day, then re-auth

/** Fail closed: with no password configured, nobody gets in. */
function configuredPassword(): string | null {
  const v = process.env.INTERNAL_ANNEX_PASSWORD;
  return v && v.length > 0 ? v : null;
}

/**
 * Signing key. Falls back to the password itself so a single env var is enough
 * to run — but a separate secret is better, because rotating the password then
 * does not silently invalidate the signing key and vice versa.
 */
function signingKey(): string | null {
  return process.env.INTERNAL_ANNEX_SECRET ?? configuredPassword();
}

/**
 * Constant-time string comparison.
 *
 * timingSafeEqual throws on length mismatch, which would itself leak length —
 * so both sides are hashed to a fixed 32 bytes first and the digests compared.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                               */
/* -------------------------------------------------------------------------- */

/**
 * In-memory, per-IP. Honest about its limits: it resets on deploy and is
 * per-instance, so it is a speed bump against casual guessing rather than a
 * defence against a distributed attempt. Adequate for a shared password on a
 * personal site; it is not a substitute for a strong password.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function rateLimit(ip: string): { ok: boolean; retryInMinutes: number } {
  const now = Date.now();
  const rec = attempts.get(ip);

  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryInMinutes: 0 };
  }

  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    return {
      ok: false,
      retryInMinutes: Math.max(1, Math.ceil((rec.resetAt - now) / 60000)),
    };
  }
  return { ok: true, retryInMinutes: 0 };
}

/** Clear the counter after a correct password so one typo does not linger. */
export function clearRateLimit(ip: string): void {
  attempts.delete(ip);
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

export function checkPassword(input: string): boolean {
  const expected = configuredPassword();
  if (!expected) return false;
  return safeEqual(input, expected);
}

/** True when the request carries a valid, unexpired, correctly-signed token. */
export async function hasInternalAccess(): Promise<boolean> {
  const key = signingKey();
  if (!key) return false;

  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [exp, sig, nonce] = raw.split(".");
  if (!exp || !sig || !nonce) return false;

  const expiry = Number(exp);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  // Sign over the nonce too, so two sessions issued in the same millisecond
  // are still distinct tokens.
  return safeEqual(sig, sign(`${exp}.${nonce}`, key));
}

export async function grantInternalAccess(): Promise<void> {
  const key = signingKey();
  if (!key) return;

  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const nonce = randomBytes(9).toString("base64url");

  (await cookies()).set(COOKIE, `${exp}.${sign(`${exp}.${nonce}`, key)}.${nonce}`, {
    httpOnly: true, // not readable from JS, so XSS cannot lift it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function revokeInternalAccess(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Whether the gate is configured at all — used to explain a locked-out state. */
export function internalAuthConfigured(): boolean {
  return configuredPassword() !== null;
}
