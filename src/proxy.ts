import { NextResponse, type NextRequest } from "next/server";

/**
 * Canonicalize the prep-page URLs (any casing, plus the common no-hyphen
 * spellings) to their real routes. Route matching is case-sensitive in
 * production, and next.config redirects can't do this — their source patterns
 * match case-insensitively, so a "/SOC-prep" rule would also match the
 * canonical URL and loop. Keyed by the lowercased path.
 */
const ALIASES: Record<string, string> = {
  "/soc-prep": "/soc-prep",
  "/cloud-security-prep": "/cloud-security-prep",
  "/cloudsecurity-prep": "/cloud-security-prep", // e.g. /CloudSecurity-prep
  "/seo-prep": "/seo-prep", // e.g. /SEO-prep
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const target = ALIASES[pathname.toLowerCase()];
  if (target && pathname !== target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Only single-segment paths (the only place a casing variant can exist).
  matcher: "/:path",
};
