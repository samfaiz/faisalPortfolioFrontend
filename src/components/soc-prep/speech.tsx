"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Read-aloud for the SOC-prep kit, built on the browser's Web Speech API
 * (SpeechSynthesis) — no network, no external service, works offline.
 *
 * A tiny module-level store holds the single id currently being read (only one
 * thing speaks at a time). Long text is split into sentence-sized chunks and
 * queued, which sidesteps Chrome's ~15s single-utterance cut-off. A session
 * counter invalidates the callbacks of any superseded/cancelled run so queues
 * never cross.
 */

const READ_RATE = 1; // 1 = natural pace

const supported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

/** Strip HTML to speakable text. Code/table blocks read as gibberish, so they
 *  are announced rather than spelled out. */
export function plainText(html: string): string {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/gi, " (code example shown on screen) ")
    .replace(/<table[\s\S]*?<\/table>/gi, " (table shown on screen) ")
    .replace(/<li>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|div|tr|ol|ul|blockquote)>/gi, ". ")
    .replace(/<br\s*\/?>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, " and ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;|&ldquo;|&rdquo;/g, "")
    .replace(/&#39;|&lsquo;|&rsquo;/g, "'")
    .replace(/&mdash;|&ndash;/g, ", ")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/[“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, max = 220): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && (cur + " " + s).length > max) {
      chunks.push(cur);
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** The topic the visitor last pressed Listen on — what the voice assistant is
 *  focused on. Set on Listen, kept after narration ends so you can still ask,
 *  cleared only by closing the assistant or focusing another topic. */
export interface ActiveTopic {
  id: string;
  title: string;
  kind?: string;
  text: string;
}

/** Special speakingId for the assistant's own spoken answer, so topic Listen
 *  buttons don't show STOP while the answer is read. */
export const ASSISTANT_ID = "__assistant__";

let speakingId: string | null = null;
let activeTopic: ActiveTopic | null = null;
let session = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/* --- Voice selection: prefer the most human-sounding voice available, and
   let the user change it. Applies to both narration and the assistant. ---- */
const VOICE_KEY = "soc-prep:voice";
let allVoices: SpeechSynthesisVoice[] = [];
let selectedVoiceURI: string | null = null;
let voicesInit = false;

/** Higher = more human. The newest Azure neural ("Multilingual"/"Natural"/
 *  "Online") and Google cloud voices win; the old robotic local SAPI voices
 *  (David/Zira/Mark…) are pushed to the bottom. */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();
  if (!lang.startsWith("en")) return -1000;

  let s = 0;
  if (lang === "en-us") s += 8;
  else if (lang === "en-gb") s += 5;
  else s += 1;

  // Quality tiers (a voice can hit several).
  if (n.includes("natural")) s += 60; // Edge/Windows neural
  if (n.includes("multilingual")) s += 30; // newest, most human generation
  if (n.includes("neural")) s += 30;
  if (n.includes("online")) s += 15;
  if (n.includes("google")) s += 45; // Chrome's cloud voice — very natural

  // Pleasant named neural voices.
  if (/\b(ava|andrew|emma|aria|jenny|guy|brian|nova|amber|ana|jane|nancy)\b/.test(n)) s += 10;
  if (/\b(sonia|ryan|libby|thomas|olivia|maisie)\b/.test(n)) s += 8;

  // Old robotic local voices — only if not actually a natural/neural build.
  const legacy = /\b(david|zira|mark|hazel|susan|george|catherine|richard|james|linda|heera|ravi)\b/.test(n);
  if (legacy && !n.includes("natural") && !n.includes("neural")) s -= 40;
  if (v.localService && !n.includes("natural") && !n.includes("neural") && !n.includes("google")) s -= 6;

  return s;
}

function refreshVoices() {
  if (!supported()) return;
  allVoices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a)); // most human first
  if (!selectedVoiceURI && allVoices.length) {
    selectedVoiceURI = allVoices[0].voiceURI; // default to the best available
  }
  emit();
}

function resolveVoice(): SpeechSynthesisVoice | null {
  if (!allVoices.length) return null;
  return allVoices.find((v) => v.voiceURI === selectedVoiceURI) ?? allVoices[0];
}

function applyVoice(u: SpeechSynthesisUtterance) {
  const v = resolveVoice();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  }
}

/* Topic-narration progress, so a barge-in can pause mid-topic and "continue"
   can resume from where it left off (answers are not tracked / resumable). */
let narrationChunks: string[] = [];
let narrationNextIndex = 0;
let narrationId: string | null = null;
let pausedRemaining: string | null = null;
let pausedTopicId: string | null = null;

function stop() {
  session++;
  if (supported()) window.speechSynthesis.cancel();
  if (speakingId !== null) {
    speakingId = null;
    emit();
  }
}

function speak(id: string, text: string) {
  if (!supported()) return;
  const chunks = chunkText(text);
  if (!chunks.length) return;

  const isTopic = id !== ASSISTANT_ID;
  if (isTopic) {
    narrationChunks = chunks;
    narrationNextIndex = 0;
    narrationId = id;
  }

  session++;
  const mySession = session;
  window.speechSynthesis.cancel(); // fires callbacks of the old run — now stale
  speakingId = id;
  emit();

  let i = 0;
  const next = () => {
    if (mySession !== session) return; // superseded or stopped
    if (i >= chunks.length) {
      speakingId = null;
      if (isTopic) {
        narrationId = null;
        pausedRemaining = null; // finished cleanly — nothing to resume
        pausedTopicId = null;
      }
      emit();
      return;
    }
    if (isTopic) narrationNextIndex = i;
    const u = new SpeechSynthesisUtterance(chunks[i]);
    i++;
    u.rate = READ_RATE;
    applyVoice(u);
    u.onend = () => {
      if (mySession !== session) return;
      if (isTopic) narrationNextIndex = i;
      next();
    };
    u.onerror = () => {
      if (mySession === session) next(); // skip a failed chunk, keep going
    };
    window.speechSynthesis.speak(u);
  };
  next();
}

/* --- Streaming TTS: speak the assistant's answer sentence-by-sentence as the
   text streams in, so the voice starts almost immediately. Sentences are
   enqueued to the native SpeechSynthesis queue as they complete. --------- */
let streamBuf = "";
let streamSpokenLen = 0;
let streamQueued = 0;
let streamFinished = 0;
let streamEnded = false;
let streamSession = 0;

function maybeClearStream() {
  if (streamEnded && streamFinished >= streamQueued && speakingId === ASSISTANT_ID) {
    speakingId = null;
    emit();
  }
}

function enqueueSentence(text: string) {
  const clean = text.trim();
  if (!clean || !supported()) return;
  streamQueued++;
  const mine = streamSession;
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = READ_RATE;
  applyVoice(u);
  const done = () => {
    if (mine !== session) return;
    streamFinished++;
    maybeClearStream();
  };
  u.onend = done;
  u.onerror = done;
  window.speechSynthesis.speak(u);
}

function flushSentences() {
  const pending = streamBuf.slice(streamSpokenLen);
  // A sentence = up to a terminal punctuation mark followed by a space.
  const re = /[^.!?…]*[.!?…]+["'”’)]*\s/g;
  let consumed = 0;
  while (re.exec(pending) !== null) {
    enqueueSentence(pending.slice(consumed, re.lastIndex));
    consumed = re.lastIndex;
  }
  streamSpokenLen += consumed;
}

/** Public controller (safe to import anywhere; no-ops when unsupported). */
export const speech = {
  /** Press Listen on a topic: focus the assistant on it and toggle narration. */
  toggle(topic: ActiveTopic) {
    const switching = activeTopic?.id !== topic.id;
    activeTopic = topic;
    if (switching) {
      pausedRemaining = null;
      pausedTopicId = null;
    }
    if (speakingId === topic.id) stop();
    else speak(topic.id, topic.text);
    emit();
  },
  /** Barge-in: stop speaking, remembering where the topic narration was so
   *  resumeTopic() can pick it up. (Answers aren't resumable.) */
  pauseNarration() {
    if (narrationId && speakingId === narrationId) {
      pausedRemaining = narrationChunks.slice(narrationNextIndex).join(" ") || null;
      pausedTopicId = narrationId;
    }
    stop();
  },
  /** Resume the topic reading from where it was interrupted (or restart it). */
  resumeTopic() {
    if (!activeTopic) return false;
    const remaining =
      pausedRemaining && pausedTopicId === activeTopic.id ? pausedRemaining : activeTopic.text;
    pausedRemaining = null;
    pausedTopicId = null;
    speak(activeTopic.id, remaining);
    return true;
  },
  hasPausedTopic() {
    return !!pausedRemaining;
  },
  /** Speak arbitrary text (the assistant's answer) without changing the topic. */
  say(text: string) {
    speak(ASSISTANT_ID, text);
  },
  /** Begin a streamed spoken answer. */
  sayStreamStart() {
    session++;
    streamSession = session;
    if (supported()) window.speechSynthesis.cancel();
    streamBuf = "";
    streamSpokenLen = 0;
    streamQueued = 0;
    streamFinished = 0;
    streamEnded = false;
    speakingId = ASSISTANT_ID;
    emit();
  },
  /** Feed the full answer text so far; speaks any newly-completed sentences. */
  sayStreamPush(fullText: string) {
    if (streamSession !== session) return;
    streamBuf = fullText;
    flushSentences();
  },
  /** Answer finished streaming — speak whatever sentence remains. */
  sayStreamEnd() {
    if (streamSession !== session) return;
    const rest = streamBuf.slice(streamSpokenLen).trim();
    streamEnded = true;
    if (rest) enqueueSentence(rest);
    else maybeClearStream();
  },
  /** Stop narration; keeps the assistant focused on the current topic. */
  stop,
  /** Close the assistant entirely (stop audio + drop the focused topic). */
  clearTopic() {
    stop();
    if (activeTopic !== null) {
      activeTopic = null;
      emit();
    }
  },
  supported,
  /** Load the OS voice list (idempotent). */
  initVoices() {
    if (voicesInit || !supported()) return;
    voicesInit = true;
    try {
      selectedVoiceURI = localStorage.getItem(VOICE_KEY);
    } catch {}
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  },
  getVoices: () => allVoices,
  getSelectedVoiceURI: () => selectedVoiceURI,
  setVoice(uri: string) {
    selectedVoiceURI = uri || null;
    try {
      if (uri) localStorage.setItem(VOICE_KEY, uri);
    } catch {}
    emit();
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSpeakingId(): string | null {
  return useSyncExternalStore(subscribe, () => speakingId, () => null);
}

export function useActiveTopic(): ActiveTopic | null {
  return useSyncExternalStore(subscribe, () => activeTopic, () => null);
}

/** Voice list + current selection for a picker. Loads voices on mount. */
export function useVoicePicker() {
  useEffect(() => {
    speech.initVoices();
  }, []);
  useSyncExternalStore(
    subscribe,
    () => `${allVoices.length}:${selectedVoiceURI ?? ""}`,
    () => "0:"
  );
  return {
    voices: speech.getVoices(),
    selected: speech.getSelectedVoiceURI(),
    setVoice: speech.setVoice,
  };
}

/**
 * Play/stop button. `getText` is called lazily on click, so the (heavy) text
 * assembly only runs when the user actually wants to listen.
 */
export function ListenButton({
  id,
  title,
  kind,
  getText,
  label = "Listen",
  className,
}: {
  id: string;
  title: string;
  kind?: string;
  getText: () => string;
  label?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  // Mount gate so server and first client render match (speech is client-only).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const active = useSpeakingId() === id;

  // Render nothing on the server and until mounted (avoids hydration mismatch),
  // and when the browser has no speech support.
  if (!mounted || !speech.supported()) return null;

  return (
    <button
      type="button"
      onClick={() =>
        speech.toggle({
          id,
          title,
          kind,
          text: getText(),
        })
      }
      aria-pressed={active}
      aria-label={active ? "Stop reading aloud" : "Listen — read this aloud"}
      className={cn(
        "soc-noprint mono-label inline-flex items-center gap-1.5 rounded-pill border-[1.5px] px-3 py-1.5 transition-colors",
        active
          ? "border-accent text-accent-strong"
          : "border-hairline text-muted-2 hover:border-ink hover:text-ink",
        className
      )}
    >
      <span aria-hidden className="text-[11px] leading-none">
        {active ? "■" : "▶"}
      </span>
      {active ? "STOP" : label.toUpperCase()}
    </button>
  );
}
