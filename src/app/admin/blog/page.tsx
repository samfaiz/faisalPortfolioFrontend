"use client";

/**
 * /admin/blog — AI blog writer (Phase 2/3). Token-gated. Sends a topic to
 * POST /api/v1/ai/blog/draft; the backend drafts the post (Anthropic by
 * default), saves it as a **draft** Post, and returns it for review. Without
 * an AI key the backend returns clearly-labelled sample output.
 *
 * After a draft returns, the author can edit the title/excerpt/body (TipTap),
 * save the draft, and publish — publishing triggers ISR so /blog is immediate.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/editor/write-client";
import { RichEditor } from "@/components/editor/blocks/RichEditor";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

interface Draft {
  id: number;
  title: string;
  excerpt: string;
  body_html: string;
  read_minutes: number;
  status: string;
  category: string;
  generation: { provider: string; model: string; stub: boolean };
}

export default function AiBlogPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [topic, setTopic] = useState("Hardening SSH on a Linux VPS");
  const [length, setLength] = useState("medium");
  const [category, setCategory] = useState("security");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  // Editable post fields (prefilled from the returned draft).
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [postStatus, setPostStatus] = useState("");

  // Save / publish action state.
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => setAuthed(!!getToken()), []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setDraft(null);
    setSaved(false);
    setPublished(false);
    setActionError("");
    try {
      const res = await fetch(`${BASE}/ai/blog/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ topic, length, category }),
      });
      if (!res.ok) {
        setStatus("error");
        setError(`Request failed (${res.status}).`);
        return;
      }
      const d: Draft = (await res.json()).data;
      setDraft(d);
      setTitle(d.title);
      setExcerpt(d.excerpt);
      setBodyHtml(d.body_html);
      setPostStatus(d.status);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Could not reach the API. Is the Laravel server running on :8000?");
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    setSaved(false);
    setActionError("");
    try {
      const res = await fetch(`${BASE}/posts/${draft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title, excerpt, body_html: bodyHtml, category }),
      });
      if (!res.ok) {
        setActionError(`Save failed (${res.status}).`);
        return;
      }
      const json = await res.json();
      const post = json.data ?? json;
      if (post?.status) setPostStatus(post.status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setActionError("Could not reach the API to save.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    setPublishing(true);
    setActionError("");
    try {
      const res = await fetch(`${BASE}/posts/${draft.id}/publish`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) {
        setActionError(`Publish failed (${res.status}).`);
        return;
      }
      setPublished(true);
      setPostStatus("published");
    } catch {
      setActionError("Could not reach the API to publish.");
    } finally {
      setPublishing(false);
    }
  };

  if (authed === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-5">
        <div className="rounded-lg border-[1.5px] border-ink bg-surface p-8 text-center">
          <div className="mono-label text-accent-strong">~/admin/blog</div>
          <p className="mt-3 text-sm text-muted">Sign in to use the AI blog writer.</p>
          <Link href="/admin/login" className="mono-label mt-4 inline-block rounded-pill bg-ink px-4 py-2.5 font-semibold text-paper">
            GO TO LOGIN →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-5">
      <div className="mono-label text-accent-strong">~/admin/blog</div>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">AI blog writer</h1>
      <p className="mt-2 text-sm text-muted-2">
        Draft a post with AI, then review &amp; publish it. Drafts are never auto-published.
      </p>

      <form onSubmit={generate} className="mt-6 space-y-4 rounded-lg border-[1.5px] border-hairline bg-surface p-5">
        <label className="block">
          <span className="mono-label text-muted-2">TOPIC</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 w-full rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="block">
            <span className="mono-label text-muted-2">LENGTH</span>
            <select value={length} onChange={(e) => setLength(e.target.value)} className="mt-1 block rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 text-sm">
              <option value="short">short</option>
              <option value="medium">medium</option>
              <option value="long">long</option>
            </select>
          </label>
          <label className="block">
            <span className="mono-label text-muted-2">CATEGORY</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 text-sm">
              <option value="security">security</option>
              <option value="ai-dev">ai-dev</option>
              <option value="ctf">ctf</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="mono-label rounded-pill bg-ink px-5 py-3 font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "WRITING…" : "GENERATE DRAFT →"}
        </button>
        {error && <p className="mono-label text-red-500">{error}</p>}
      </form>

      {draft && (
        <div className="mt-6 rounded-lg border-2 border-ink bg-surface p-6">
          <div className="mono-label flex flex-wrap items-center gap-3 text-faint">
            <span className="rounded-pill bg-surface-alt px-2.5 py-1 text-muted-2">DRAFT · {postStatus}</span>
            <span>{draft.read_minutes} MIN</span>
            <span>{category}</span>
            {draft.generation.stub && (
              <span className="rounded-pill bg-accent/10 px-2.5 py-1 text-accent-strong">sample · add an AI key for real output</span>
            )}
            {!draft.generation.stub && <span className="text-accent">{draft.generation.model}</span>}
          </div>

          <label className="mt-4 block">
            <span className="mono-label text-muted-2">TITLE</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 font-display text-xl font-bold outline-none focus:border-ink"
            />
          </label>

          <label className="mt-4 block">
            <span className="mono-label text-muted-2">EXCERPT</span>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-y rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 text-[15px] italic text-muted-2 outline-none focus:border-ink"
            />
          </label>

          <div className="mt-4">
            <span className="mono-label text-muted-2">BODY</span>
            <RichEditor value={bodyHtml} onChange={setBodyHtml} className="mt-1" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || publishing}
              className="mono-label rounded-pill border-[1.5px] border-ink bg-paper px-5 py-3 font-semibold text-ink transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {saving ? "SAVING…" : "SAVE DRAFT"}
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={publishing || saving}
              className="mono-label rounded-pill bg-ink px-5 py-3 font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? "PUBLISHING…" : "PUBLISH →"}
            </button>
            {saved && <span className="mono-label text-accent-strong">Saved</span>}
          </div>

          {actionError && <p className="mono-label mt-3 text-red-500">{actionError}</p>}

          {published ? (
            <p className="mono-label mt-4 flex flex-wrap items-center gap-2 text-accent-strong">
              ✓ Published — live on
              <Link href="/blog" className="underline underline-offset-2">
                /blog
              </Link>
            </p>
          ) : (
            <p className="mono-label mt-4 text-faint">
              Editing draft (Post #{draft.id}). Save to keep changes, or publish when ready.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
