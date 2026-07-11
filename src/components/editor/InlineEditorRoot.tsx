"use client";

/**
 * InlineEditorRoot — one-line mount for the whole inline editor (Phase 2).
 * Wraps children in the provider and renders the edit chrome (bar + toolbar).
 * Auth-gated: with no Sanctum token, the chrome hides and children render as
 * normal public output — so it's safe to leave mounted in production.
 *
 *   <InlineEditorRoot initialSections={{ home_hero: hero }}>
 *     ...page with <Editable/> bindings...
 *   </InlineEditorRoot>
 */
import { InlineEditorProvider } from "./InlineEditorProvider";
import { EditBar } from "./EditBar";
import { FloatingToolbar } from "./FloatingToolbar";

export function InlineEditorRoot({
  initialSections,
  token,
  localOnly,
  children,
}: {
  initialSections: Record<string, Record<string, unknown>>;
  token?: string;
  localOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <InlineEditorProvider initialSections={initialSections} token={token} localOnly={localOnly}>
      {children}
      <EditBar />
      <FloatingToolbar />
    </InlineEditorProvider>
  );
}
