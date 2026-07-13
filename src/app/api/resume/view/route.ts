/**
 * Same-origin resume proxy. The backend serves the PDF from api.faisalkhan.cloud,
 * which the browser refuses to embed in an iframe cross-subdomain (X-Frame-Options).
 * Streaming it through the frontend makes the iframe same-origin, so the in-page
 * resume viewer works. Download stays a direct link (no framing, so it's fine).
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

export const runtime = "nodejs";

export async function GET() {
  try {
    const res = await fetch(`${BASE}/resume/view`, { cache: "no-store" });
    if (!res.ok) {
      return new Response("Resume not found", { status: res.status });
    }
    const body = await res.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
