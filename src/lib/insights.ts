/**
 * Phase 3 — insights + integrations read client (API_CONTRACT §7).
 *
 * Authenticated (Sanctum) client for the dashboard/insight endpoints. The primary
 * Phase 3 dashboard lives in Filament (backend); this client exists so a future
 * Next.js admin surface (or the inline editor's SEO panel) can read the same data.
 *
 * Additive: reuses the editor token; separate from the public read client.
 */
import { getToken } from "./editor/write-client";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

export interface GscQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface GscPage {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SearchInsights {
  queries: GscQuery[];
  pages: GscPage[];
  range_days: number;
}

export interface TrafficPoint {
  date: string;
  value: number;
}

export interface TrafficInsights {
  provider: string;
  series: TrafficPoint[];
  top_pages: { page: string; value: number }[];
  sources: { source: string; value: number }[];
  range_days: number;
}

export interface KeywordMetric {
  keyword: string;
  search_volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  competition: string | null;
  trend: number[];
  provider?: string;
}

export interface KeywordInsights {
  seed: string;
  metrics: KeywordMetric[];
  suggestions: { keyword: string; search_volume: number | null; difficulty: number | null }[];
}

export type IntegrationProvider =
  | "anthropic"
  | "openai"
  | "gemini"
  | "gsc"
  | "ga4"
  | "plausible"
  | "seo_data";

export interface IntegrationStatus {
  provider: IntegrationProvider;
  label: string | null;
  configured: boolean;
  is_active: boolean;
  last_tested_at: string | null;
  last_test: { status: string; message: string; at: string } | null;
  meta: Record<string, unknown>;
}

async function authGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

export const insights = {
  search: (days = 28) => authGet<SearchInsights>(`/insights/search?days=${days}`),
  traffic: (days = 30) => authGet<TrafficInsights>(`/insights/traffic?days=${days}`),
  keywords: (q: string, location?: string) =>
    authGet<KeywordInsights>(
      `/insights/keywords?q=${encodeURIComponent(q)}${location ? `&location=${encodeURIComponent(location)}` : ""}`,
    ),

  /** Encrypted key vault status (never returns secrets). */
  integrations: () => authGet<IntegrationStatus[]>(`/integrations`),

  async testIntegration(provider: IntegrationProvider): Promise<{ ok: boolean; message: string }> {
    const token = getToken();
    const res = await fetch(`${BASE}/integrations/${provider}/test`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
    const json = (await res.json()) as { data: { ok: boolean; message: string } };
    return json.data;
  },
};
