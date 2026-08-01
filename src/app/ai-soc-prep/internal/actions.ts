"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPassword,
  clearRateLimit,
  grantInternalAccess,
  internalAuthConfigured,
  rateLimit,
  revokeInternalAccess,
} from "@/lib/internal-auth";

/**
 * A Server Action is a POST endpoint reachable by anyone who can construct the
 * request — the form around it is not the boundary. So every check that matters
 * lives here: rate limit, constant-time comparison, and a signed cookie issued
 * only on success.
 */

/** Best-effort client IP for rate limiting. Behind nginx this is the real one. */
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export type UnlockState = { error?: string };

export async function unlock(
  _prev: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  if (!internalAuthConfigured()) {
    return {
      error:
        "The internal annexes are not configured on this deployment. Set INTERNAL_ANNEX_PASSWORD and rebuild.",
    };
  }

  const ip = await clientIp();
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return {
      error: `Too many attempts. Try again in ${limit.retryInMinutes} minute${
        limit.retryInMinutes === 1 ? "" : "s"
      }.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    // Deliberately does not distinguish "wrong password" from "no password
    // supplied" — there is nothing to learn from the difference.
    return { error: "Incorrect password." };
  }

  clearRateLimit(ip);
  await grantInternalAccess();

  const next = String(formData.get("next") ?? "/ai-soc-prep/internal");
  // Only ever redirect within this path — an open redirect here would be a
  // gift to a phishing campaign against the people who know the password.
  redirect(next.startsWith("/ai-soc-prep/") ? next : "/ai-soc-prep/internal");
}

export async function lock(): Promise<void> {
  await revokeInternalAccess();
  redirect("/ai-soc-prep");
}
