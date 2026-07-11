"use client";

/**
 * /admin/dashboard — Phase 3 insights surface (consumes lib/insights.ts).
 *
 * Token-gated (Sanctum, via the editor login). Reads the now-live insights API:
 * GSC search performance, analytics traffic, and on-demand keyword metrics.
 * Renders sample data until real integration credentials are connected.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/editor/write-client";
import {
  insights,
  type SearchInsights,
  type TrafficInsights,
  type KeywordInsights,
} from "@/lib/insights";

function Sparkline({ points }: { points: number[] }) {
  if (!points.length) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 220;
  const h = 44;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible" role="img" aria-label="traffic trend">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} />
    </svg>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border-[1.5px] border-hairline bg-surface p-4">
      <div className="mono-label text-faint">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-bold text-ink">{value}</div>
      {sub && <div className="mono-label mt-1 text-muted-2">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [search, setSearch] = useState<SearchInsights | null>(null);
  const [traffic, setTraffic] = useState<TrafficInsights | null>(null);
  const [error, setError] = useState("");

  const [kw, setKw] = useState("soc analyst");
  const [kwResult, setKwResult] = useState<KeywordInsights | null>(null);

  useEffect(() => {
    const token = getToken();
    setAuthed(!!token);
    if (!token) return;
    Promise.all([insights.search(28), insights.traffic(30)])
      .then(([s, t]) => {
        setSearch(s);
        setTraffic(t);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const lookupKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setKwResult(await insights.keywords(kw));
    } catch (err) {
      setError(String(err));
    }
  };

  if (authed === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-5">
        <div className="rounded-lg border-[1.5px] border-ink bg-surface p-8 text-center">
          <div className="mono-label text-accent-strong">~/admin/dashboard</div>
          <p className="mt-3 text-sm text-muted">Sign in to view SEO &amp; analytics insights.</p>
          <Link href="/admin/login" className="mono-label mt-4 inline-block rounded-pill bg-ink px-4 py-2.5 font-semibold text-paper">
            GO TO LOGIN →
          </Link>
        </div>
      </div>
    );
  }

  const impressions = search ? search.queries.reduce((a, q) => a + q.impressions, 0) : 0;
  const clicks = search ? search.queries.reduce((a, q) => a + q.clicks, 0) : 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0";
  const avgPos = search && search.queries.length
    ? (search.queries.reduce((a, q) => a + q.position, 0) / search.queries.length).toFixed(1)
    : "—";
  const totalVisits = traffic ? traffic.series.reduce((a, p) => a + p.value, 0) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mono-label text-accent-strong">~/admin/dashboard</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Insights</h1>
        </div>
        <span className="mono-label rounded-pill bg-accent/10 px-3 py-1.5 text-accent-strong">
          sample data · connect credentials in the key vault
        </span>
      </div>

      {error && <p className="mono-label mt-4 text-red-500">{error}</p>}

      {/* Search performance */}
      <h2 className="mono-label mt-8 text-muted-2">SEARCH · GSC (28d)</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="IMPRESSIONS" value={impressions.toLocaleString()} sub="top queries" />
        <Tile label="CLICKS" value={clicks.toLocaleString()} sub={`${ctr}% CTR`} />
        <Tile label="AVG POSITION" value={String(avgPos)} sub="lower is better" />
        <Tile label="PROVIDER" value={traffic?.provider ?? "—"} sub="analytics" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Top queries */}
        <div className="rounded-lg border-[1.5px] border-hairline bg-surface p-5">
          <div className="mono-label text-faint">TOP QUERIES</div>
          <div className="mt-3 divide-y divide-divider">
            {search?.queries.map((q) => (
              <div key={q.query} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate text-ink">{q.query}</span>
                <span className="mono-label shrink-0 text-muted-2">{q.clicks} clk · {q.impressions.toLocaleString()} imp</span>
              </div>
            )) ?? <p className="mono-label py-4 text-faint">loading…</p>}
          </div>
        </div>

        {/* Traffic */}
        <div className="rounded-lg border-[1.5px] border-hairline bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="mono-label text-faint">TRAFFIC (30d)</div>
            <div className="font-display text-lg font-semibold">{totalVisits.toLocaleString()} visits</div>
          </div>
          <div className="mt-3">
            <Sparkline points={traffic?.series.map((p) => p.value) ?? []} />
          </div>
          <div className="mt-4 mono-label text-faint">TOP SOURCES</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {traffic?.sources.map((s) => (
              <span key={s.source} className="mono-label rounded-pill border border-hairline px-2.5 py-1 text-muted-2">
                {s.source} · {s.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Keyword lookup */}
      <h2 className="mono-label mt-8 text-muted-2">KEYWORD RESEARCH · SEO DATA</h2>
      <form onSubmit={lookupKeyword} className="mt-3 flex gap-2">
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          className="flex-1 rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          placeholder="seed keyword…"
        />
        <button className="mono-label rounded-pill bg-ink px-4 py-2.5 font-semibold text-paper">LOOK UP →</button>
      </form>
      {kwResult && (
        <div className="mt-3 rounded-lg border-[1.5px] border-hairline bg-surface p-5">
          <div className="mono-label text-faint">SUGGESTIONS FOR “{kwResult.seed}”</div>
          <div className="mt-3 divide-y divide-divider">
            {kwResult.suggestions.map((s) => (
              <div key={s.keyword} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate text-ink">{s.keyword}</span>
                <span className="mono-label shrink-0 text-muted-2">
                  vol {s.search_volume ?? "—"} · diff {s.difficulty ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
