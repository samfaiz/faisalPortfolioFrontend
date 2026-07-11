"use client";

/**
 * EditableImage — an image bound to a media field (Phase 2, Track FE).
 *
 *   <EditableImage field="home_hero.photo" className="size-13 rounded-full" />
 *
 * The field holds a MediaRef ({ id, url, alt }). Outside edit mode it renders
 * the image (or a striped placeholder). In edit mode a click opens the media
 * library to swap src + alt on the draft.
 */
import { useState } from "react";
import { useOptionalEditor } from "./InlineEditorProvider";
import { ImageReplaceModal } from "./ImageReplaceModal";
import type { MediaAsset } from "@/lib/editor/types";

interface MediaRef {
  id?: number;
  url?: string;
  alt?: string;
}

export function EditableImage({
  field,
  className,
  fallbackAlt,
}: {
  field: string;
  className?: string;
  fallbackAlt?: string;
}) {
  const ed = useOptionalEditor();
  const [open, setOpen] = useState(false);

  const value = (ed?.getField(field) as MediaRef | null) ?? null;
  const url = value?.url;
  const alt = value?.alt ?? fallbackAlt ?? "";
  const editing = !!ed?.editMode;

  const img = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={`object-cover ${className ?? ""}`} />
  ) : (
    <span className={`stripes block ${className ?? ""}`} aria-label={alt || "image placeholder"} />
  );

  if (!editing) return img;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Replace image"
        className={`group relative block cursor-pointer ${className ?? ""}`}
      >
        {img}
        <span className="absolute inset-0 grid place-items-center rounded-[inherit] bg-ink/45 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="mono-label rounded-pill bg-paper px-2 py-1 text-ink">REPLACE</span>
        </span>
      </button>
      {ed && (
        <ImageReplaceModal
          open={open}
          onClose={() => setOpen(false)}
          currentAlt={alt}
          onPick={(asset: MediaAsset) =>
            ed.setField(field, { id: asset.id, url: asset.url, alt: asset.alt ?? "" }, { commit: true })
          }
        />
      )}
    </>
  );
}
