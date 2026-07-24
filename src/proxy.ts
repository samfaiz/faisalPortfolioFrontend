import { NextResponse, type NextRequest } from "next/server";

/**
 * Canonicalize /SOC-prep (any casing) to /soc-prep. Route matching is
 * case-sensitive in production, and next.config redirects can't do this —
 * their source patterns match case-insensitively, so a "/SOC-prep" rule
 * would also match the canonical URL and loop.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.toLowerCase() === "/soc-prep" && pathname !== "/soc-prep") {
    const url = request.nextUrl.clone();
    url.pathname = "/soc-prep";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Only single-segment paths (the only place a casing variant can exist).
  matcher: "/:path",
};
