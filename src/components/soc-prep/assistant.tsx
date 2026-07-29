"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  speech,
  useActiveTopic,
  useSpeakingId,
  useVoicePicker,
} from "./speech";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const HANDSFREE_KEY = "soc-prep:handsfree";
const CHAT_PREFIX = "soc-prep:chat:";

/* ---- Turnstile token broker -------------------------------------------------
 * A Turnstile token is single-use: replaying one gets `timeout-or-duplicate`
 * back from siteverify, so holding one in a ref and sending it with every
 * question would 403 from the second question onward. Instead each token is
 * handed out once and the widget is reset immediately to mint the next one.
 * takeTurnstileToken() waits for that next token rather than sending a stale
 * one, and resolves null if the widget is absent or slow — the server treats a
 * missing token as a failed check only when it has a secret configured.
 */
interface TurnstileGlobal {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme: string;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}
const turnstileApi = () =>
  (window as unknown as { turnstile?: TurnstileGlobal }).turnstile;

let tsWidgetId: string | null = null;
let tsToken: string | null = null;
let tsWaiters: ((token: string | null) => void)[] = [];
/* Set when the widget can't run at all — a malformed site key, a domain the
 * widget isn't registered for, a blocked challenges.cloudflare.com. Without
 * this every question would stall for the full token timeout before giving up,
 * which looks exactly like a hung assistant. */
let tsBroken = false;

function tsResetWidget() {
  tsToken = null;
  const api = turnstileApi();
  if (tsWidgetId && api) api.reset(tsWidgetId);
}

/* Called by Cloudflare whenever a fresh token is solved. */
function tsOnToken(token: string) {
  const waiter = tsWaiters.shift();
  if (waiter) {
    waiter(token);
    tsResetWidget(); // consumed — start solving the next one now
  } else {
    tsToken = token; // park it for the next question
  }
}

async function takeTurnstileToken(timeoutMs = 8000): Promise<string | null> {
  if (!TURNSTILE_SITE_KEY || tsBroken) return null;
  if (tsToken) {
    const token = tsToken;
    tsResetWidget();
    return token;
  }
  return new Promise((resolve) => {
    const waiter = (token: string | null) => {
      clearTimeout(timer);
      resolve(token);
    };
    const timer = setTimeout(() => {
      tsWaiters = tsWaiters.filter((w) => w !== waiter);
      resolve(null);
    }, timeoutMs);
    tsWaiters.push(waiter);
  });
}

/* Suggested starter questions by card type — steer usage toward useful prompts. */
function chipsFor(kind?: string): string[] {
  switch (kind) {
    case "Scenario":
      return ["How would I detect this?", "What would I say in an interview?", "What's the key lesson?"];
    case "Fundamental":
      return ["Explain this more simply", "How do I detect it?", "Give a real-world example"];
    case "Malware topic":
      return ["How do I detect this?", "Show me a real example", "How do I explain this in an interview?"];
    case "Quiz question":
      return ["Why is that the answer?", "What makes the others wrong?", "How does this look in real life?"];
    default:
      return ["Explain this simply", "How would I detect this?", "Give a real example"];
  }
}

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Cloud/neural voices that actually sound human, vs the robotic local ones. */
function isHumanVoice(v: SpeechSynthesisVoice): boolean {
  return /natural|neural|online|google/i.test(v.name);
}

function voiceLabel(v: SpeechSynthesisVoice): string {
  const name = v.name.replace(/^Microsoft\s+/, "").replace(/\s*\((Natural|Neural)\)/i, "");
  return `${name} — ${v.lang}`;
}

/** "continue with the topic", "resume", "go on"… — resume the narration. */
function isResumeCommand(text: string): boolean {
  const t = text.toLowerCase().replace(/[^a-z\s]/g, " ").trim();
  return (
    /^(continue|resume|carry on|go on|go ahead|keep going|keep reading|proceed)\b/.test(t) ||
    /\b(continue|resume|read|back)\b.*\btopic\b/.test(t)
  );
}

/* ---- Minimal Web Speech Recognition typings (not in lib.dom) ------------- */
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  0: SRAlternative;
  isFinal: boolean;
}
interface SREvent {
  resultIndex: number;
  results: ArrayLike<SRResult>;
}
interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SRCtor = new () => SpeechRec;

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Turn {
  q: string;
  a: string;
  stub?: boolean;
}
type Status = "idle" | "recording" | "thinking" | "answering";

export function SocAssistant({
  domain = "soc",
}: {
  domain?: "soc" | "cloud" | "seo";
}) {
  const topic = useActiveTopic();
  const speakingId = useSpeakingId();
  const speaking = speakingId !== null;

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [live, setLive] = useState(""); // in-flight transcript (question)
  const [streamed, setStreamed] = useState(""); // in-flight answer
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [handsFree, setHandsFree] = useState(false);
  const [copied, setCopied] = useState(-1);
  const [topicPaused, setTopicPaused] = useState(false);
  const [hfTick, setHfTick] = useState(0); // restarts the continuous recognizer

  const recRef = useRef<SpeechRec | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef(topic);
  const turnsRef = useRef<Turn[]>([]);
  const speakingRef = useRef(false);
  const handsFreeRef = useRef(false);
  const coachWordsRef = useRef<Set<string>>(new Set());
  const { voices, selected: selectedVoice, setVoice } = useVoicePicker();
  useEffect(() => {
    topicRef.current = topic;
    turnsRef.current = turns;
    speakingRef.current = speaking;
    handsFreeRef.current = handsFree;
  });

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHandsFree(localStorage.getItem(HANDSFREE_KEY) === "1");
    } catch {}
  }, []);

  const SR = mounted ? getSR() : null;
  const micMode: "browser" | "whisper" | "none" = SR
    ? "browser"
    : mounted && typeof navigator !== "undefined" && navigator.mediaDevices
      ? "whisper"
      : "none";

  /* --- persistence: load stored chat when the topic changes ------------ */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLive("");
    setStreamed("");
    setError(null);
    setTyped("");
    setStatus("idle");
    setTopicPaused(false);
    let stored: Turn[] = [];
    try {
      if (topic) stored = JSON.parse(localStorage.getItem(CHAT_PREFIX + topic.id) ?? "[]");
    } catch {}
    setTurns(Array.isArray(stored) ? stored : []);
    // Seed the echo filter with the topic + any stored answers.
    const set = new Set<string>();
    if (topic) wordsOf(topic.text).forEach((w) => set.add(w));
    (Array.isArray(stored) ? stored : []).forEach((t) => wordsOf(t.a).forEach((w) => set.add(w)));
    coachWordsRef.current = set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commitTurn = useCallback((turn: Turn) => {
    const t = topicRef.current;
    wordsOf(turn.a).forEach((w) => coachWordsRef.current.add(w)); // grow echo filter
    setTurns((prev) => {
      const next = [...prev.slice(-7), turn];
      try {
        if (t) localStorage.setItem(CHAT_PREFIX + t.id, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  /* --- ask the backend (streaming, with non-streaming fallback) -------- */
  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      const t = topicRef.current;
      if (!q || !t) return;

      // Interrupt anything in flight (request + speech) before the new question.
      abortRef.current?.abort();
      speech.stop();
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setLive(q);
      setStreamed("");
      setStatus("thinking");

      const history = turnsRef.current.slice(-2).flatMap((turn) => [
        { role: "user", content: turn.q },
        { role: "assistant", content: turn.a },
      ]);
      const body: Record<string, unknown> = {
        question: q,
        topic: { title: t.title, text: t.text },
        history,
        domain,
      };
      const turnstileToken = await takeTurnstileToken();
      if (turnstileToken) body.turnstile_token = turnstileToken;

      // 1) Streamed path.
      try {
        const res = await fetch(`${API_BASE}/soc/ask/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message ?? "stream-unavailable");
        }

        speech.sayStreamStart();
        setStatus("answering");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let answer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n\n")) >= 0) {
            const line = buf
              .slice(0, idx)
              .split("\n")
              .find((l) => l.startsWith("data:"));
            buf = buf.slice(idx + 2);
            if (!line) continue;
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.type === "delta") {
              answer += evt.text;
              setStreamed(answer);
              speech.sayStreamPush(answer);
            } else if (evt.type === "error") {
              throw new Error(evt.message ?? "stream-error");
            }
          }
        }
        speech.sayStreamEnd();
        const finalAnswer = answer.trim();
        if (!finalAnswer) throw new Error("empty-stream");

        commitTurn({ q, a: finalAnswer });
        setLive("");
        setStreamed("");
        setStatus("idle");
        return;
      } catch {
        if (controller.signal.aborted) return; // interrupted — stop silently
        // fall through to non-streaming
      }

      // 2) Non-streaming fallback.
      try {
        const res = await fetch(`${API_BASE}/soc/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "The assistant is unavailable right now.");
        const answer: string | undefined = data?.data?.text?.trim();
        if (!answer) throw new Error("No answer came back — please try again.");
        commitTurn({ q, a: answer, stub: data.data.stub });
        setLive("");
        setStreamed("");
        setStatus("idle");
        speech.say(answer);
      } catch (err) {
        if (controller.signal.aborted) return; // interrupted — stop silently
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setLive("");
        setStreamed("");
        setStatus("idle");
      }
    },
    [commitTurn, domain]
  );

  /** Interrupt everything: cancel the request and stop the spoken answer,
   *  remembering the topic position so it can be resumed. */
  const stopEverything = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    speech.pauseNarration();
    setTopicPaused(speech.hasPausedTopic());
    setStreamed("");
    setLive("");
    setStatus("idle");
  }, []);

  /* --- browser tap-to-ask (one-shot recognition) ----------------------- */
  const startTap = useCallback(() => {
    if (!SR) return;
    abortRef.current?.abort();
    speech.stop();
    setError(null);
    setLive("");
    let finalText = "";
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setLive((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      recRef.current = null;
      setStatus("idle");
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setError("Microphone access was blocked. Allow it, or type your question below.");
      else if (e.error !== "aborted" && e.error !== "no-speech")
        setError("Could not hear that — try again or type your question.");
    };
    rec.onend = () => {
      recRef.current = null;
      setStatus((s) => (s === "recording" ? "idle" : s));
      const q = finalText.trim();
      if (q) ask(q);
    };
    recRef.current = rec;
    setStatus("recording");
    try {
      rec.start();
    } catch {}
  }, [SR, ask]);

  const stopTap = useCallback(() => recRef.current?.stop(), []);

  /* --- Whisper fallback (MediaRecorder → /soc/transcribe) --------------- */
  const startWhisper = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        mediaRef.current = null;
        setStatus("thinking");
        try {
          const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
          const fd = new FormData();
          fd.append("audio", blob, "q.webm");
          const res = await fetch(`${API_BASE}/soc/transcribe`, { method: "POST", body: fd });
          const data = await res.json().catch(() => null);
          if (!res.ok) throw new Error(data?.error?.message ?? "Transcription failed.");
          const text = (data?.data?.text ?? "").trim();
          if (text) ask(text);
          else {
            setStatus("idle");
            setError("Didn't catch that — try again or type your question.");
          }
        } catch (err) {
          setStatus("idle");
          setError(err instanceof Error ? err.message : "Transcription failed. Type instead.");
        }
      };
      mediaRef.current = mr;
      mr.start();
      speech.stop();
      setStatus("recording");
    } catch {
      setError("Microphone access was blocked. Type your question below.");
    }
  }, [ask]);

  const stopWhisper = useCallback(() => mediaRef.current?.stop(), []);

  /* --- hands-free: always-on mic with barge-in (browser SR only, beta) ---
     The recognizer stays live even while the coach speaks. When the coach is
     talking we ignore transcripts that echo its own words (word-overlap with
     coachWordsRef); anything else is treated as the user, which immediately
     pauses the coach (barge-in). A short silence finalizes the utterance:
     "continue"/"resume" resumes the topic, otherwise it's asked. */
  useEffect(() => {
    if (!handsFree || !topic || !SR) return;

    let userText = "";
    let silence: ReturnType<typeof setTimeout> | undefined;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    const isEcho = (text: string) => {
      const w = wordsOf(text);
      if (w.length < 2) return true; // too short to act on
      const known = w.filter((x) => coachWordsRef.current.has(x)).length;
      return known / w.length >= 0.7;
    };

    const finalize = () => {
      const q = userText.trim();
      userText = "";
      setLive("");
      if (wordsOf(q).length < 2) return;
      if (isResumeCommand(q)) {
        setTopicPaused(false);
        speech.resumeTopic();
        return;
      }
      ask(q);
    };

    rec.onresult = (e) => {
      let interim = "";
      let fin = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript;
        else interim += r[0].transcript;
      }
      const heard = (fin + " " + interim).trim();
      if (!heard) return;
      // While the coach is speaking, drop its own voice picked up by the mic.
      if (speakingRef.current && isEcho(heard)) return;

      // Real user speech → stop the coach at once (barge-in).
      if (speakingRef.current) {
        speech.pauseNarration();
        if (speech.hasPausedTopic()) setTopicPaused(true);
      }
      if (fin) userText = (userText + " " + fin).trim();
      setLive((userText + " " + interim).trim());
      clearTimeout(silence);
      silence = setTimeout(finalize, 1200);
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setHandsFree(false);
        setError("Microphone access was blocked. Enable hands-free again after allowing it.");
      }
    };
    rec.onend = () => {
      recRef.current = null;
      clearTimeout(silence);
      if (userText.trim()) finalize();
      // Continuous recognition can stop on its own — restart while enabled.
      if (handsFreeRef.current) setHfTick((t) => t + 1);
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {}

    return () => {
      clearTimeout(silence);
      rec.onend = null;
      rec.onresult = null;
      try {
        rec.abort();
      } catch {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree, topic?.id, SR, hfTick, ask]);

  /* --- keep the transcript scrolled to newest -------------------------- */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, live, streamed, status]);

  if (!mounted || !topic) return null;

  const toggleHandsFree = () => {
    const v = !handsFree;
    setHandsFree(v);
    try {
      localStorage.setItem(HANDSFREE_KEY, v ? "1" : "0");
    } catch {}
    if (!v) recRef.current?.abort();
  };

  const close = () => {
    recRef.current?.abort();
    mediaRef.current?.stop();
    abortRef.current?.abort();
    recRef.current = null;
    speech.clearTopic();
  };

  const copy = (text: string, i: number) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(i);
        window.setTimeout(() => setCopied(-1), 1500);
      },
      () => {}
    );
  };

  const recording = status === "recording";
  const busy = status === "thinking" || status === "answering";
  // The coach is thinking or speaking (topic or answer) — allow interrupting it.
  const canInterrupt = busy || speaking;
  const showResume = topicPaused && !speaking && !busy;

  const resumeTopic = () => {
    setTopicPaused(false);
    speech.resumeTopic();
  };
  const chips = chipsFor(topic.kind);
  const micLabel = recording
    ? "Stop listening"
    : canInterrupt
      ? "Interrupt the coach"
      : micMode === "whisper"
        ? "Hold-to-record via server"
        : "Tap to ask by voice";

  const onMic = () => {
    if (recording) {
      if (micMode === "whisper") stopWhisper();
      else stopTap();
    } else if (canInterrupt) {
      stopEverything();
    } else if (micMode === "whisper") {
      startWhisper();
    } else {
      startTap();
    }
  };

  return (
    <div
      role="region"
      aria-label="SOC study voice assistant"
      className="soc-noprint fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-lg border-[1.5px] border-ink bg-surface shadow-offset-sm sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-95"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-divider px-3.5 py-2.5">
        <span aria-hidden className="text-accent-strong">◆</span>
        <div className="min-w-0 flex-1">
          <div className="mono-label text-accent-strong">
            Ask the coach{topic.kind ? ` · ${topic.kind}` : ""}
          </div>
          <div className="truncate text-[12.5px] text-muted-2" title={topic.title}>
            {topic.title}
          </div>
        </div>
        {canInterrupt && (
          <button
            type="button"
            onClick={stopEverything}
            className="mono-label rounded-pill border-[1.5px] border-accent px-2.5 py-1 text-accent-strong"
          >
            ■ Stop
          </button>
        )}
        <button
          type="button"
          onClick={close}
          aria-label="Close assistant"
          className="grid size-7 place-items-center rounded-pill text-muted-2 hover:bg-surface-alt hover:text-ink"
        >
          ✕
        </button>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="max-h-[38vh] overflow-y-auto px-3.5 py-3">
        {turns.length === 0 && !live && !busy && (
          <>
            <p className="text-[13px] leading-relaxed text-muted-2">
              {handsFree
                ? "Hands-free is on — just start talking to interrupt and ask. Say “continue” to resume the topic."
                : micMode !== "none"
                  ? "Ask anything about this topic — how to detect it, what to say in an interview, a real example."
                  : "Type a question about this topic below."}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => ask(c)}
                  className="rounded-pill border border-hairline px-2.5 py-1 text-[12px] text-muted-2 transition-colors hover:border-ink hover:text-ink"
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="space-y-3">
          {turns.map((t, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-[13px] text-muted-2">
                <span className="mono-label mr-1.5 text-faint">YOU</span>
                {t.q}
              </p>
              <div className="group">
                <p className="text-[14px] leading-relaxed text-ink">
                  <span className="mono-label mr-1.5 text-accent-strong">COACH</span>
                  {t.a}
                </p>
                <button
                  type="button"
                  onClick={() => copy(t.a, i)}
                  className="mono-label mt-1 text-faint transition-colors hover:text-ink"
                >
                  {copied === i ? "✓ copied" : "copy"}
                </button>
              </div>
            </div>
          ))}

          {/* in-flight question */}
          {live && (
            <p className="text-[13px] text-muted-2">
              <span className="mono-label mr-1.5 text-faint">{recording ? "HEARING" : "YOU"}</span>
              {live}
            </p>
          )}
          {/* in-flight streamed answer */}
          {streamed && (
            <p className="text-[14px] leading-relaxed text-ink">
              <span className="mono-label mr-1.5 text-accent-strong">COACH</span>
              {streamed}
              <span className="animate-blink">▋</span>
            </p>
          )}
          {status === "thinking" && !streamed && (
            <p className="mono-label text-accent-strong">
              <span className="animate-blink">thinking…</span>
            </p>
          )}
        </div>

        {error && <p className="mt-2 text-[12.5px] text-destructive">{error}</p>}
      </div>

      {/* Controls */}
      <div className="space-y-2.5 border-t border-divider px-3.5 py-3">
        {canInterrupt && (
          <p className="mono-label text-accent-strong">
            {speaking ? "Coach is speaking" : "Working"} —{" "}
            {handsFree ? "just speak, or tap ■" : "tap ■ or type"} to interrupt
          </p>
        )}
        {showResume && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resumeTopic}
              className="mono-label inline-flex items-center gap-1.5 rounded-pill border-[1.5px] border-accent px-3 py-1.5 text-accent-strong hover:bg-accent/10"
            >
              ▶ Resume topic
            </button>
            {handsFree && <span className="mono-label text-faint">or say “continue”</span>}
          </div>
        )}
        <div className="flex items-center gap-2">
          {micMode !== "none" && !handsFree && (
            <button
              type="button"
              onClick={onMic}
              aria-pressed={recording}
              aria-label={micLabel}
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-pill border-[1.5px] text-lg transition-colors disabled:opacity-50",
                recording
                  ? "animate-pulse border-accent bg-accent text-paper"
                  : canInterrupt
                    ? "border-accent text-accent-strong hover:bg-accent/10"
                    : "border-ink text-ink hover:bg-surface-alt"
              )}
            >
              {recording || canInterrupt ? "■" : "🎙"}
            </button>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = typed.trim();
              if (q && !recording) {
                setTyped("");
                ask(q); // interrupts anything in flight
              }
            }}
            className="flex flex-1 items-center gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={recording}
              placeholder={
                canInterrupt
                  ? "Type to interrupt & ask…"
                  : handsFree
                    ? "Listening… or type"
                    : micMode !== "none"
                      ? "Or type a question…"
                      : "Type your question…"
              }
              aria-label="Type your question"
              className="h-9 w-full min-w-0 rounded-pill border-[1.5px] border-hairline bg-paper px-3.5 text-[13px] outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={recording || !typed.trim()}
              aria-label="Send question"
              className="mono-label grid h-9 shrink-0 place-items-center rounded-pill bg-ink px-3 text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              →
            </button>
          </form>
        </div>

        {/* Voice picker (applies to narration + the coach) */}
        {voices.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="mono-label shrink-0 text-faint">Voice</span>
            <select
              value={selectedVoice ?? ""}
              onChange={(e) => {
                setVoice(e.target.value);
                speech.stop();
              }}
              aria-label="Choose the reading voice"
              className="h-8 w-full min-w-0 rounded-pill border-[1.5px] border-hairline bg-paper px-2.5 text-[12px] text-ink outline-none focus:border-accent"
            >
              {voices.some(isHumanVoice) && (
                <optgroup label="Human-like (online)">
                  {voices.filter(isHumanVoice).map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {voiceLabel(v)}
                    </option>
                  ))}
                </optgroup>
              )}
              {voices.some((v) => !isHumanVoice(v)) && (
                <optgroup label="Standard">
                  {voices.filter((v) => !isHumanVoice(v)).map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {voiceLabel(v)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        )}

        <div className="flex items-center justify-between gap-2">
          {micMode === "browser" ? (
            <button
              type="button"
              role="switch"
              aria-checked={handsFree}
              onClick={toggleHandsFree}
              className={cn(
                "mono-label inline-flex items-center gap-1.5 rounded-pill border-[1.5px] px-2.5 py-1 transition-colors",
                handsFree ? "border-accent text-accent-strong" : "border-hairline text-muted-2 hover:border-ink hover:text-ink"
              )}
            >
              <span
                aria-hidden
                className={cn("size-2 rounded-full", handsFree ? "animate-pulse bg-accent" : "bg-faint")}
              />
              Hands-free {handsFree ? "on" : "off"} · beta
            </button>
          ) : (
            <span className="mono-label text-faint">
              {micMode === "whisper" ? "Voice via server" : "Type to ask"}
            </span>
          )}
          <span className="mono-label text-faint">AI · verify before use</span>
        </div>
      </div>

      {TURNSTILE_SITE_KEY && <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} />}
    </div>
  );
}

/* ---- Optional Cloudflare Turnstile (only mounts when a site key is set) ---
 * Tokens go through the broker above, not a callback prop — the widget outlives
 * individual questions and has to keep minting a fresh token after each one.
 */
function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const render = () => {
      const api = turnstileApi();
      if (!ref.current || !api || tsWidgetId || tsBroken) return;
      try {
        tsWidgetId = api.render(ref.current, {
          sitekey: siteKey,
          callback: tsOnToken,
          // An expired or errored challenge leaves us with no token; reset so
          // the next question waits on a fresh one instead of sending nothing.
          "expired-callback": tsResetWidget,
          "error-callback": tsResetWidget,
          theme: "auto",
        });
      } catch (err) {
        // render() throws on a malformed site key. Fall back to sending no
        // token rather than blocking the assistant behind a widget that will
        // never solve — the API's rate and spend caps still apply.
        console.error("[turnstile] disabled — widget failed to render", err);
        tsBroken = true;
        tsWidgetId = null;
        tsWaiters.splice(0).forEach((w) => w(null));
      }
    };
    if (turnstileApi()) {
      render();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.onload = render;
    document.head.appendChild(s);
  }, [siteKey]);

  // The dock unmounts whenever the topic closes. Drop the widget with it, or
  // the stale id blocks the next mount from rendering a new one.
  useEffect(
    () => () => {
      const api = turnstileApi();
      if (tsWidgetId && api) api.remove(tsWidgetId);
      tsWidgetId = null;
      tsToken = null;
    },
    []
  );

  return <div ref={ref} className="px-3.5 pb-3" />;
}
