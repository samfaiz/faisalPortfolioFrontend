"use client";

/**
 * Single-login bridge for "Edit visually". When the Filament admin opens a page
 * with a one-time `?editToken=…`, this stores it as the inline-editor's Sanctum
 * token, strips it from the URL, and reloads so the editor picks it up — no
 * second sign-in.
 */
import { useEffect } from "react";
import { setToken } from "@/lib/editor/write-client";

export function EditTokenBridge() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("editToken");
    if (!token) return;

    setToken(token);
    // Signal the editor to open straight into EDIT MODE after the reload.
    try {
      sessionStorage.setItem("cms_autoedit", "1");
    } catch {
      /* sessionStorage unavailable */
    }
    url.searchParams.delete("editToken");
    window.history.replaceState({}, "", url.toString());
    window.location.reload();
  }, []);

  return null;
}
