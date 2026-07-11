"use client";

/**
 * Phase 3 — Rich content editor (PHASE_3 Track FE: "rich content blocks via TipTap").
 *
 * A real TipTap editor working in HTML strings: `value` is the current HTML and
 * `onChange` receives the updated HTML on every edit. Used by the AI blog writer
 * at /admin/blog to let authors edit an AI draft before publishing.
 */
import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export interface RichEditorProps {
  /** Current content as an HTML string. */
  value: string;
  /** Called with the updated HTML string on every edit. */
  onChange: (html: string) => void;
  className?: string;
}

/** Small mono-label pill toolbar button. */
function ToolButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`mono-label rounded-pill border-[1.5px] border-hairline px-2.5 py-1 leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-ink text-paper" : "bg-paper text-muted-2 hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      <ToolButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleBold().run();
        }}
      >
        B
      </ToolButton>
      <ToolButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleItalic().run();
        }}
      >
        I
      </ToolButton>
      <ToolButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
      >
        H2
      </ToolButton>
      <ToolButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
      >
        H3
      </ToolButton>
      <ToolButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleBulletList().run();
        }}
      >
        • List
      </ToolButton>
      <ToolButton
        title="Ordered list"
        active={editor.isActive("orderedList")}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleOrderedList().run();
        }}
      >
        1. List
      </ToolButton>
      <ToolButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleBlockquote().run();
        }}
      >
        Quote
      </ToolButton>
      <ToolButton
        title="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().toggleCodeBlock().run();
        }}
      >
        Code
      </ToolButton>
      <ToolButton title="Link" active={editor.isActive("link")} onClick={setLink}>
        Link
      </ToolButton>
      <ToolButton
        title="Undo"
        disabled={!editor.can().undo()}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().undo().run();
        }}
      >
        Undo
      </ToolButton>
      <ToolButton
        title="Redo"
        disabled={!editor.can().redo()}
        onClick={() => {
          if (!editor) return;
          editor.chain().focus().redo().run();
        }}
      >
        Redo
      </ToolButton>
    </div>
  );
}

export function RichEditor({ value, onChange, className }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g. a freshly-generated draft) into the editor
  // without clobbering in-progress edits or looping on our own onUpdate emits.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div className={className}>
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:outline-none min-h-[240px] rounded-md border-[1.5px] border-hairline bg-paper p-4 text-[15px] leading-[1.8] text-muted outline-none focus-within:border-ink [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h3]:font-display [&_h3]:font-semibold [&_h3]:mt-4 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_blockquote]:border-l-2 [&_blockquote]:border-hairline [&_blockquote]:pl-3 [&_pre]:bg-surface-alt [&_pre]:p-3 [&_pre]:rounded-md [&_a]:text-accent [&_a]:underline"
      />
    </div>
  );
}
