"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Post, PostCategory } from "@/lib/types";

const FILTERS: { label: string; value: PostCategory }[] = [
  { label: "ALL", value: "all" },
  { label: "SECURITY", value: "security" },
  { label: "AI+DEV", value: "ai-dev" },
  { label: "CTF", value: "ctf" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BlogList({ posts }: { posts: Post[] }) {
  const [category, setCategory] = useState<PostCategory>("all");
  const visible = useMemo(
    () => posts.filter((p) => category === "all" || p.category === category),
    [posts, category],
  );

  const featured = visible.find((p) => p.featured) ?? visible[0] ?? null;
  const rest = visible.filter((p) => p.id !== featured?.id);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setCategory(f.value)}
            className={`mono-label rounded-pill border-[1.5px] px-3 py-1.5 transition-colors ${
              category === f.value ? "border-ink bg-ink text-paper" : "border-hairline text-muted-2 hover:border-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Featured (dark) */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="scanlines shadow-offset group flex flex-col justify-between rounded-lg bg-ink p-7 text-on-dark"
          >
            <div>
              <div className="mono-label flex items-center gap-3 text-on-dark-faint">
                <span className="text-accent-soft">★ FEATURED</span>
                <span>{fmtDate(featured.published_at)}</span>
                <span>{featured.read_minutes} MIN</span>
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight">{featured.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-on-dark-muted">{featured.excerpt}</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="mono-label rounded-pill bg-accent px-3 py-1.5 font-semibold text-paper">READ →</span>
              <span className="mono-label text-on-dark-faint">/{featured.slug}</span>
            </div>
          </Link>
        )}

        {/* Rest */}
        <div className="grid gap-4">
          {rest.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="rounded-md border-[1.5px] border-hairline bg-surface p-5 transition-colors hover:border-ink"
            >
              <div className="mono-label flex items-center gap-3 text-faint">
                <span className="text-accent-strong">{p.category.replace("-", "+").toUpperCase()}</span>
                <span>{p.read_minutes} MIN</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-2">{p.excerpt}</p>
            </Link>
          ))}
          <div className="rounded-md border-[1.5px] border-dashed border-faint p-5 text-center">
            <span className="mono-label text-faint">older posts →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
