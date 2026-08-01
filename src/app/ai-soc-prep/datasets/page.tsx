import Link from "next/link";
import type { Metadata } from "next";

const title = "Datasets & free labs — AI SOC Analyst";
const description =
  "Every dataset the AI SOC projects run on, with licence and load instructions. All free, all public, so a stranger can reproduce the work without access to a real SOC.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/datasets" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Moved into milestone 2 rather than 3, deliberately.
 *
 * Every module from 08 onward references data. Writing that content before
 * knowing exactly which corpus a reader will have in front of them produces
 * hand-waving — "load your logs" instead of "this file, this shape, this many
 * rows". This page is short and it unblocks all of it.
 */

interface Dataset {
  name: string;
  what: string;
  /** Why this one rather than the dozen alternatives. */
  why: string;
  licence: string;
  size: string;
  url: string;
  /** Projects that use it. */
  projects: number[];
  load?: { lang: string; code: string };
  caution?: string;
}

const GROUPS: { group: string; blurb: string; items: Dataset[] }[] = [
  {
    group: "Windows and endpoint telemetry",
    blurb:
      "The backbone of modules 08–10 and projects 03 and 05. Real attack telemetry, already labelled by technique.",
    items: [
      {
        name: "Security Datasets (formerly Mordor)",
        what: "Pre-recorded telemetry from executed ATT&CK techniques — Windows events, Sysmon, PowerShell logs — in JSON, one file per technique.",
        why: "Labelled by technique, which means you can measure a detection's recall honestly instead of eyeballing it. Almost nothing else free is labelled.",
        licence: "MIT / CC — check the individual dataset",
        size: "MBs per technique",
        url: "https://github.com/OTRF/Security-Datasets",
        projects: [3, 5],
        load: {
          lang: "python",
          code: "import json, pandas as pd, requests, zipfile, io\n\nURL = (\"https://raw.githubusercontent.com/OTRF/Security-Datasets/master/\"\n       \"datasets/atomic/windows/credential_access/host/\"\n       \"empire_mimikatz_logonpasswords.zip\")\n\nz = zipfile.ZipFile(io.BytesIO(requests.get(URL).content))\nname = z.namelist()[0]\nrows = [json.loads(l) for l in z.open(name).read().decode().splitlines() if l]\n\ndf = pd.DataFrame(rows)\nprint(df.shape)\nprint(df[\"EventID\"].value_counts().head())",
        },
      },
      {
        name: "EVTX-ATTACK-SAMPLES",
        what: "Raw .evtx event log files captured during attack simulations, organised by ATT&CK tactic.",
        why: "Native .evtx rather than pre-parsed JSON, so you practise the parsing step that module 08 is about. Closer to what you actually receive in an investigation.",
        licence: "MIT",
        size: "~200 MB total",
        url: "https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES",
        projects: [3],
        load: {
          lang: "python",
          code: "# pip install evtx\nfrom evtx import PyEvtxParser\nimport json\n\nparser = PyEvtxParser(\"Lateral Movement/LM_wmic_process_call_create.evtx\")\nfor record in parser.records_json():\n    event = json.loads(record[\"data\"])\n    print(event[\"Event\"][\"System\"][\"EventID\"])",
        },
      },
    ],
  },
  {
    group: "Full-scope SOC scenarios",
    blurb:
      "Multi-source datasets with a story running through them — the right shape for triage and correlation work.",
    items: [
      {
        name: "Splunk BOTS v1–v3",
        what: "Boss of the SOC. Complete multi-day intrusion datasets spanning proxy, endpoint, IDS, email and cloud, with a documented narrative.",
        why: "The only free dataset where the events genuinely correlate into one incident across sources. That is exactly what module 09's entity timeline needs, and synthetic data cannot fake it.",
        licence: "Splunk — free for non-commercial use, registration required",
        size: "Several GB per dataset",
        url: "https://github.com/splunk/botsv3",
        projects: [4, 9],
        caution:
          "Large. Start with BOTSv1, which is the smallest, and filter to one host before loading anything into a model.",
      },
    ],
  },
  {
    group: "Phishing and email",
    blurb: "Project 02 runs entirely on these.",
    items: [
      {
        name: "Nazario phishing corpus",
        what: "Thousands of real phishing emails in mbox format, collected over years.",
        why: "Real headers with real SPF/DKIM failures. Synthetic phishing has clean headers, which defeats the point of the exercise.",
        licence: "Research use — attribute the source",
        size: "~100 MB",
        url: "https://monkey.org/~jose/phishing/",
        projects: [2],
        caution:
          "Live malicious URLs. Never open one; defang before it touches any tool, and treat attachments as live samples.",
      },
      {
        name: "Your own spam folder",
        what: "Export as .eml from any mail client.",
        why: "Current, in your language and region, and targeting your actual sector — which public corpora from 2015 are not. Best single source for project 02.",
        licence: "Yours",
        size: "As much as you have",
        url: "https://support.google.com/mail/answer/9261412",
        projects: [2],
      },
    ],
  },
  {
    group: "Malware — defensive analysis only",
    blurb:
      "Modules 11–12 and projects 06–07. Isolated VM, no network, snapshot before every sample.",
    items: [
      {
        name: "MalwareBazaar",
        what: "Live malware samples with tags, YARA matches and family attribution. API and bulk download.",
        why: "Tagged by family, so you can pick something documented and check your analysis against published write-ups — which is how you learn whether you were right.",
        licence: "CC0",
        size: "Per sample",
        url: "https://bazaar.abuse.ch/",
        projects: [6, 7],
        caution:
          "LIVE MALWARE. Archives are password-protected with 'infected' by convention. Isolated VM, no shared folders, no network, snapshot first. Module 11 covers the setup before any sample is downloaded.",
      },
      {
        name: "Malware-Traffic-Analysis.net",
        what: "PCAPs and samples from real infections, each with a written exercise and answers.",
        why: "Comes with the answers, so it doubles as a self-marking exercise. Rare and valuable.",
        licence: "Free, non-commercial",
        size: "MBs per exercise",
        url: "https://malware-traffic-analysis.net/",
        projects: [7],
        caution: "Same handling rules. The PCAPs are safe; the samples are not.",
      },
    ],
  },
  {
    group: "Detection content and mappings",
    blurb: "Reference corpora for modules 10–14.",
    items: [
      {
        name: "SigmaHQ rules",
        what: "Several thousand production-quality detection rules in YAML, mapped to ATT&CK.",
        why: "Both a reference and a benchmark: module 10 generates Sigma rules, and this is what good ones look like. Also the goodware corpus for checking a generated rule is not nonsense.",
        licence: "DRL 1.1",
        size: "~30 MB",
        url: "https://github.com/SigmaHQ/sigma",
        projects: [7],
      },
      {
        name: "Atomic Red Team",
        what: "Executable tests per ATT&CK technique, with cleanup commands.",
        why: "Generates your own labelled telemetry on demand. When no public dataset covers the technique you need, this makes one.",
        licence: "MIT",
        size: "~50 MB",
        url: "https://github.com/redcanaryco/atomic-red-team",
        projects: [3, 5],
        caution: "These genuinely modify the system. Lab VM with a snapshot, never a workstation you care about.",
      },
      {
        name: "LOLBAS / GTFOBins",
        what: "Catalogues of signed binaries abusable for execution, download and bypass — Windows and Unix respectively.",
        why: "The ground truth for module 10's hunting queries and module 14's durable-signal argument.",
        licence: "MIT / GPL",
        size: "Small",
        url: "https://lolbas-project.github.io/",
        projects: [5],
      },
    ],
  },
];

function DatasetCard({ d }: { d: Dataset }) {
  return (
    <li className="rounded-lg border-[1.5px] border-hairline bg-surface px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="font-display text-[17px] font-bold tracking-[-0.02em]">
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent-strong"
          >
            {d.name} <span aria-hidden className="font-mono text-[13px]">↗</span>
          </a>
        </h3>
        {d.projects.length > 0 && (
          <span className="mono-label text-faint">
            PROJECT {d.projects.map((p) => String(p).padStart(2, "0")).join(", ")}
          </span>
        )}
      </div>

      <p className="mt-2 max-w-(--soc-measure) text-[14px] leading-relaxed text-muted-2">
        {d.what}
      </p>

      <div className="mt-3 max-w-(--soc-measure) rounded-r-md border-l-2 border-accent bg-surface-alt px-3.5 py-2.5">
        <span className="mono-label mb-1 block text-accent-strong">
          Why this one
        </span>
        <p className="text-[13.5px] leading-relaxed text-muted-2">{d.why}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
          {d.licence}
        </span>
        <span className="mono-label rounded-pill border border-hairline px-2 py-0.5 text-muted-2">
          {d.size}
        </span>
      </div>

      {d.caution && (
        <p className="mono-label mt-3 max-w-(--soc-measure) rounded-md border border-(--ai-unverified) bg-(--ai-unverified)/10 px-3 py-2 leading-relaxed text-(--ai-unverified)">
          ⚠ {d.caution}
        </p>
      )}

      {d.load && (
        <div className="mt-3 overflow-hidden rounded-md border border-hairline bg-surface-alt">
          <div className="border-b border-hairline px-3 py-1.5">
            <span className="mono-label text-accent-strong">{d.load.lang}</span>
            <span className="ml-2 font-mono text-[10.5px] text-muted-2">
              load it
            </span>
          </div>
          <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-[1.7] text-ink">
            {d.load.code}
          </pre>
        </div>
      )}
    </li>
  );
}

export default function DatasetsPage() {
  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);

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
          <span className="mono-label text-accent-strong">
            {total} DATASETS · ALL FREE
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Datasets &amp; free labs
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            Every project on this path runs on public data, so a stranger can
            reproduce the work without access to a real SOC. Each entry says what
            it is, <b className="font-medium text-ink">why this one rather than
            the alternatives</b>, its licence, and how to load it.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          {GROUPS.map((g) => (
            <section key={g.group}>
              <h2 className="mono-label mb-1.5 flex items-center gap-3 text-accent-strong">
                {g.group.toUpperCase()}
                <span aria-hidden className="h-px flex-1 bg-hairline" />
                <span className="text-faint">{g.items.length}</span>
              </h2>
              <p className="mb-4 max-w-(--soc-measure) font-mono text-[11.5px] leading-relaxed text-muted-2">
                {"// "}
                {g.blurb}
              </p>
              <ul className="space-y-3">
                {g.items.map((d) => (
                  <DatasetCard key={d.name} d={d} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-12">
          <div className="max-w-(--soc-measure) rounded-lg border-[1.5px] border-(--ai-unverified) bg-(--ai-unverified)/5 px-5 py-4">
            <span className="mono-label mb-2 block text-(--ai-unverified)">
              ⚠ BEFORE ANY OF THIS TOUCHES A MODEL
            </span>
            <p className="soc-prose">
              Public datasets are safe to send to a hosted API. Anything from
              your own environment is not, until it has been through the
              classification tree in{" "}
              <Link
                href="/ai-soc-prep/module/data-governance"
                className="underline hover:text-ink"
              >
                module 05
              </Link>
              . The habit of checking before pasting is the one worth building
              now, while the stakes are a lab exercise.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
