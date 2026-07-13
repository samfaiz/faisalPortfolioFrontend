"use client";

/**
 * BootLineEditable — the hero's terminal "boot line", wired for inline editing.
 *
 * Public: the type-on animated chip (BootLine), wrapped in a link when a target
 *   is set — so it can point at a featured blog post.
 * Edit mode: the text becomes editable in place, plus a dropdown to link the
 *   line to any published blog post (or clear it). Both persist to the
 *   `home_hero` section (`boot_line`, `boot_line_url`).
 */
import Link from "next/link";
import { BootLine } from "@/components/boot-line";
import { Editable } from "@/components/editor/Editable";
import { useOptionalEditor } from "@/components/editor/InlineEditorProvider";

export type BootLinePost = { title: string; slug: string };

export function BootLineEditable({
  text,
  url,
  posts,
}: {
  text: string;
  url?: string | null;
  posts: BootLinePost[];
}) {
  const ed = useOptionalEditor();
  const editing = !!ed?.editMode;

  // Prefer the editor draft value (so a just-picked link previews), else the
  // served value.
  const draftUrl = ed?.getField("home_hero.boot_line_url");
  const currentUrl = draftUrl != null ? String(draftUrl) : (url ?? "");

  if (!editing) {
    const chip = <BootLine text={text} />;
    return currentUrl ? (
      <Link href={currentUrl} className="inline-flex" aria-label={`${text} — read more`}>
        {chip}
      </Link>
    ) : (
      chip
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {/* Editable text, keeping the terminal chip + caret look */}
      <span className="mono-label inline-flex items-center gap-1 rounded-pill border-[1.5px] border-hairline bg-surface px-3 py-1.5 text-muted">
        <Editable field="home_hero.boot_line" as="span">
          {text}
        </Editable>
        <span className="animate-blink inline-block h-3 w-[7px] bg-accent" aria-hidden />
      </span>

      {/* Link this line to a blog post */}
      <select
        value={currentUrl}
        onChange={(e) => ed!.setField("home_hero.boot_line_url", e.target.value, { commit: true })}
        title="Link this line to a blog post"
        className="mono-label rounded-pill border-[1.5px] border-hairline bg-surface px-2.5 py-1 text-ink"
      >
        <option value="">🔗 no link</option>
        {posts.map((p) => (
          <option key={p.slug} value={`/blog/${p.slug}`}>
            {p.title}
          </option>
        ))}
      </select>
    </span>
  );
}
