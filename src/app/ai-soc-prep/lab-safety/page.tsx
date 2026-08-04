import Link from "next/link";
import type { Metadata } from "next";

const title = "Malware lab safety — AI SOC Analyst";
const description =
  "Build an isolated analysis lab before touching a sample: a no-network VM, clean snapshots, password-protected intake, and the handling rules that keep a static session from becoming an accidental detonation. Linked from modules 11–12 and project 06.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/lab-safety" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * The lab-safety page. Modules 11 and 12 and project 06 all link here rather
 * than each restating the isolation rules, because the rules are identical and
 * getting them wrong once is worse than getting the analysis wrong.
 *
 * Defensive scope only: this page is about not hurting yourself or your network
 * while reading a sample. Nothing here creates, arms, or distributes malware.
 */

interface Rule {
  n: number;
  title: string;
  body: string;
  /** The concrete failure this rule prevents. */
  failure: string;
}

const RULES: Rule[] = [
  {
    n: 1,
    title: "A virtual machine with the network adapter removed",
    body: "Not disconnected — removed. In VirtualBox or VMware, set the adapter to “Not attached”, or delete it entirely. A disconnected adapter can be re-enabled by a click, a script, or the sample itself; a removed one cannot. If you genuinely need to observe network behaviour, that is dynamic analysis in a purpose-built setup (INetSim or FakeNet simulating the internet), not a live connection.",
    failure:
      "The sample beacons out, phones home to real infrastructure, and now your analysis IP is on an attacker's list — or worse, the payload pulls its second stage and detonates for real.",
  },
  {
    n: 2,
    title: "No shared folders, no shared clipboard, no drag-and-drop",
    body: "Every bridge between the guest VM and the host is a path the malware can walk. Shared folders are the obvious one; clipboard sharing and drag-and-drop are the ones people forget. Turn all of them off in the VM settings before the first sample ever enters. The sample goes in one way — as a file you copy in deliberately — and nothing comes back out except your notes, typed by hand.",
    failure:
      "Ransomware in the guest reaches the shared folder and encrypts the host copy of everything in it, including the analysis you were writing.",
  },
  {
    n: 3,
    title: "A clean snapshot you revert to after every sample",
    body: "Take a snapshot of the pristine VM before any sample touches it. After you finish with a sample — every time, no exceptions — revert to that snapshot. Do not reuse a VM across samples, because you cannot be certain the previous one left nothing behind, and a persistence mechanism you missed will contaminate the next analysis.",
    failure:
      "Sample A installed a rootkit you did not spot. You analyse sample B in the same VM and attribute sample A's behaviour to it, and every conclusion after that is wrong.",
  },
  {
    n: 4,
    title: "The sample enters as a password-protected archive",
    body: "Samples from MalwareBazaar and most sharing platforms arrive in a ZIP with the password infected. Keep them that way. The archive is only extracted inside the VM, never on the host, and the extracted binary never sits loose on a host filesystem where a preview handler, an indexer, or a reflex double-click could touch it.",
    failure:
      "The raw executable lands in your Downloads folder, Windows Explorer generates a thumbnail by invoking a handler, and you have executed code you meant only to read.",
  },
  {
    n: 5,
    title: "Treat the sample as data to measure, never a program to open",
    body: "This is the mindset that ties the other four together. You hash the file, read its bytes, and feed those bytes to tools — pefile, strings, CAPA, oletools. At no point is the file itself the thing you click. If a step in a guide would run the sample, that is dynamic analysis and it belongs in a sandbox, not on your desktop. When in doubt, the safe default is: do not execute it.",
    failure:
      "Muscle memory takes over — you double-click to “just have a look” — and static analysis becomes an unplanned detonation on an unprepared machine.",
  },
];

function RuleCard({ rule: r }: { rule: Rule }) {
  return (
    <li className="rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-pill border-[1.5px] border-(--ai-unverified) font-mono text-[11px] font-bold text-(--ai-unverified)"
        >
          {String(r.n).padStart(2, "0")}
        </span>
        <h2 className="flex-1 font-display text-[19px] font-bold leading-tight tracking-[-0.02em] sm:text-[21px]">
          {r.title}
        </h2>
      </div>

      <div className="mt-3 space-y-3 sm:pl-10">
        <p className="soc-prose max-w-(--soc-measure)">{r.body}</p>

        <div className="max-w-(--soc-measure) rounded-r-md border-l-2 border-(--ai-unverified) bg-surface-alt px-4 py-3">
          <span className="mono-label mb-1.5 block text-(--ai-unverified)">
            What this prevents
          </span>
          <p className="soc-prose">{r.failure}</p>
        </div>
      </div>
    </li>
  );
}

export default function LabSafetyPage() {
  return (
    <div className="soc-page min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-225 px-4 pb-24 pt-10 sm:px-6 md:pt-14">
        <Link
          href="/ai-soc-prep"
          className="mono-label soc-noprint inline-flex items-center gap-1.5 text-muted-2 transition-colors hover:text-ink"
        >
          ← BACK TO AI SOC ANALYST
        </Link>

        <header className="mt-6 border-b-2 border-ink pb-7">
          <span className="mono-label text-(--ai-unverified)">
            READ BEFORE ANY MALWARE WORK
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Malware lab safety
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[17px] leading-[1.65] text-muted">
            Modules 11 and 12 and project 06 all send you here first, and none of
            them proceed until this is true. The scope of this whole path is{" "}
            <b className="font-medium text-ink">defensive analysis only</b> —
            static triage, deobfuscation, reading sandbox reports, authoring
            detections. No sample creation, no offensive tooling, no live
            detonation outside an isolated lab.
          </p>
          <p className="mt-3 max-w-(--soc-measure) font-mono text-[12.5px] leading-[1.7] text-muted-2">
            {
              "// Static analysis reads a file without running it. That is mostly safe — and \"mostly\" is doing real work in that sentence. The five rules below are what make it actually safe."
            }
          </p>
        </header>

        <ol className="mt-10 space-y-4">
          {RULES.map((r) => (
            <RuleCard key={r.n} rule={r} />
          ))}
        </ol>

        {/* The one-sentence test that generalises the five rules. */}
        <section className="mt-12">
          <div className="max-w-(--soc-measure) rounded-lg border-[1.5px] border-ink bg-surface px-5 py-5">
            <span className="mono-label mb-2 block text-accent-strong">
              The gate, in one sentence
            </span>
            <p className="text-[17px] font-medium leading-[1.6] text-ink">
              If you cannot say out loud where the sample is, what can reach the
              internet, and how you get back to a clean state, you are not ready
              to download it.
            </p>
            <p className="mt-3 font-mono text-[11.5px] leading-relaxed text-muted-2">
              {
                "// This is not caution for its own sake. A misconfigured analysis machine is malware with a network connection, and the cost of getting it wrong is paid by your whole estate, not just your afternoon."
              }
            </p>
          </div>
        </section>

        {/* Where to go next. */}
        <section className="soc-noprint mt-12 border-t border-hairline pt-8">
          <h3 className="mono-label mb-4 text-accent-strong">WHEN THE LAB IS READY</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/ai-soc-prep/module/static-triage"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">
                MODULE 11 · STATIC TRIAGE →
              </span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                Hashes, PE headers, strings, CAPA, deobfuscation and YARA — with
                AI accelerating interpretation, not replacing it.
              </span>
            </Link>
            <Link
              href="/ai-soc-prep/projects/malware-static-triage-assistant"
              className="rounded-md border-[1.5px] border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-ink"
            >
              <span className="mono-label block text-accent-strong">
                PROJECT 06 · BUILD IT →
              </span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-2">
                A static triage assistant: CAPA/FLOSS/strings/PE into a structured
                report and a YARA draft, checked against goodware.
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
