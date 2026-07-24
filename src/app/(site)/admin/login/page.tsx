"use client";

/**
 * /admin/login — obtains a Sanctum token for the inline editor.
 *
 * On success the token is stored (localStorage cms_token) via the editor's
 * write-client; navigating to any editor-wrapped page (e.g. Home) then shows
 * the EDIT MODE bar. Dev credentials: admin@faisal.dev / password.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken, setToken } from "@/lib/editor/write-client";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@faisal.dev");
  const [password, setPassword] = useState("password");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => setLoggedIn(!!getToken()), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setStatus("error");
        setMessage(res.status === 422 ? "Invalid credentials." : `Login failed (${res.status}).`);
        return;
      }
      const data = await res.json();
      setToken(data.token);
      setLoggedIn(true);
      setStatus("ok");
      setMessage(`Signed in as ${data.user?.name ?? email}.`);
    } catch {
      setStatus("error");
      setMessage("Could not reach the API. Is the Laravel server running on :8000?");
    }
  };

  const logout = () => {
    setToken(null);
    setLoggedIn(false);
    setStatus("idle");
    setMessage("Signed out.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-5">
      <div className="rounded-lg border-[1.5px] border-ink bg-surface p-8">
        <div className="mono-label text-accent-strong">~/admin/login</div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Inline editor sign-in</h1>
        <p className="mt-2 text-sm text-muted-2">
          Sign in to edit pages in place. Then open the{" "}
          <Link href="/" className="text-accent underline">home page</Link> and toggle EDIT MODE.
        </p>

        {loggedIn ? (
          <div className="mt-6">
            <div className="rounded-md border-[1.5px] border-accent/45 bg-accent/10 p-4 text-sm text-accent-strong">
              You&apos;re signed in. Open the{" "}
              <Link href="/" className="underline">home page</Link> — the EDIT MODE bar is at the bottom — or the{" "}
              <Link href="/admin/dashboard" className="underline">insights dashboard</Link> ·{" "}
              <Link href="/admin/blog" className="underline">AI blog writer</Link>.
            </div>
            <button
              onClick={logout}
              className="mono-label mt-4 rounded-pill border-[1.5px] border-hairline px-4 py-2.5 text-ink hover:border-ink"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mono-label text-muted-2">EMAIL</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="block">
              <span className="mono-label text-muted-2">PASSWORD</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border-[1.5px] border-hairline bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="mono-label w-full rounded-pill bg-ink px-4 py-3 font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "loading" ? "SIGNING IN…" : "SIGN IN →"}
            </button>
          </form>
        )}

        {message && (
          <p className={`mono-label mt-4 ${status === "error" ? "text-red-500" : "text-muted-2"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
