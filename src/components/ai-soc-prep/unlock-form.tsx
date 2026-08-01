"use client";

import { useActionState } from "react";
import { unlock, type UnlockState } from "@/app/ai-soc-prep/internal/actions";

export function UnlockForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<UnlockState, FormData>(
    unlock,
    {}
  );

  return (
    <form action={action} className="mt-6 max-w-sm space-y-3">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label
          htmlFor="password"
          className="mono-label mb-1.5 block text-muted-2"
        >
          PASSWORD
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-md border-[1.5px] border-hairline bg-surface px-3.5 py-2.5 font-mono text-[13px] text-ink outline-none transition-colors focus:border-ink"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-(--ai-unverified) bg-(--ai-unverified)/10 px-3 py-2 font-mono text-[12px] text-(--ai-unverified)"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mono-label w-full rounded-pill border-[1.5px] border-ink bg-ink px-4 py-2.5 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "CHECKING…" : "UNLOCK"}
      </button>
    </form>
  );
}
