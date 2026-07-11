import { revalidatePath } from "next/cache";

/**
 * On-demand ISR revalidation. The Laravel backend POSTs here after publishing
 * content so the affected pages refresh immediately instead of waiting for the
 * ISR interval. Guarded by a shared secret.
 *
 * Body: { secret: string; paths: string[] }
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { secret, paths } = (await request.json()) as {
      secret?: string;
      paths?: string[];
    };

    if (secret !== process.env.REVALIDATE_SECRET) {
      return Response.json({ error: "invalid secret" }, { status: 401 });
    }

    const list = Array.isArray(paths) ? paths : [];
    for (const p of list) {
      revalidatePath(p);
    }

    return Response.json({ revalidated: true, paths: list });
  } catch {
    return Response.json({ error: "revalidation failed" }, { status: 500 });
  }
}
