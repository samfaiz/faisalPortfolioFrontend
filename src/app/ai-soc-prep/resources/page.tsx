import Link from "next/link";
import type { Metadata } from "next";

const title = "Resources — AI SOC Analyst";
const description =
  "The external material worth your time, grouped by type — YouTube, free courses, GitHub, reading and communities — each with a one-line reason it earns a place. A bare link list is worthless.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ai-soc-prep/resources" },
  openGraph: { title, description, type: "article" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Grouped, not one long list, and every entry carries a one-line "why this,
 * specifically" — a bare link list is worthless. Links open in a new tab.
 */
interface Resource {
  name: string;
  url: string;
  why: string;
}
interface Group {
  heading: string;
  blurb: string;
  items: Resource[];
}

const GROUPS: Group[] = [
  {
    heading: "YouTube",
    blurb: "Channels that go deep on the mechanics, not the hype.",
    items: [
      { name: "13Cubed", url: "https://www.youtube.com/@13Cubed", why: "The reference for Windows forensics and event-log analysis — the raw evidence your assistant reasons over." },
      { name: "John Hammond", url: "https://www.youtube.com/@_JohnHammond", why: "Hands-on malware and deobfuscation walkthroughs — exactly the static-triage work modules 11–12 cover." },
      { name: "MyDFIR", url: "https://www.youtube.com/@MyDFIR", why: "Practical SOC-analyst content and detection engineering, pitched at the level this path assumes." },
      { name: "Simply Cyber (Gerald Auger)", url: "https://www.youtube.com/@SimplyCyber", why: "Careers and framing — how to talk about your work, which the interview page builds on." },
      { name: "Black Hills Information Security", url: "https://www.youtube.com/@BlackHillsInformationSecurity", why: "Long, free webcasts on detection and offensive/defensive tradecraft — durable-signal thinking (module 14)." },
      { name: "Microsoft Security", url: "https://www.youtube.com/@MicrosoftSecurity", why: "Official Sentinel, Defender and Security Copilot walkthroughs — the vendor layer of module 06, from the source." },
    ],
  },
  {
    heading: "Free courses",
    blurb: "Structured learning, no paywall.",
    items: [
      { name: "Microsoft Learn — Sentinel & Security Copilot", url: "https://learn.microsoft.com/en-us/training/", why: "Free, official, hands-on paths for the exact enterprise tools the projects' enterprise-variant callouts describe." },
      { name: "LetsDefend", url: "https://letsdefend.io/", why: "Blue-team labs with a free tier — practise triage on realistic alerts, the raw material for your golden dataset." },
      { name: "TryHackMe — SOC paths", url: "https://tryhackme.com/", why: "Free rooms covering SIEM, phishing and DFIR fundamentals if you need to shore up the L1 base this path assumes." },
      { name: "Hugging Face LLM Course", url: "https://huggingface.co/learn", why: "The clearest free grounding in how LLMs actually work — tokens, embeddings, inference (module 02) from first principles." },
      { name: "DeepLearning.AI short courses", url: "https://www.deeplearning.ai/short-courses/", why: "Free, hour-long courses on RAG, agents and prompt engineering — the build techniques behind projects 04 and 08." },
    ],
  },
  {
    heading: "GitHub",
    blurb: "The tools the projects actually use, and the rule repos worth reading.",
    items: [
      { name: "Ollama", url: "https://github.com/ollama/ollama", why: "The local model runtime every project runs on — install it once, run inference offline forever." },
      { name: "CAPA (Mandiant)", url: "https://github.com/mandiant/capa", why: "Maps a binary's capabilities with addresses — the grounded input the model summarises in project 06." },
      { name: "Sigma", url: "https://github.com/SigmaHQ/sigma", why: "The portable detection format projects 07 drafts and backtests, plus thousands of real rules to learn from." },
      { name: "YARA rules (Yara-Rules)", url: "https://github.com/Yara-Rules/rules", why: "A large corpus of real YARA rules — read them to see what specific-not-generic looks like before you draft your own." },
      { name: "Microsoft Presidio", url: "https://github.com/microsoft/presidio", why: "PII redaction — what makes 'redact-then-cloud' from module 05 a real option rather than a hope." },
      { name: "awesome-llm-security", url: "https://github.com/corca-ai/awesome-llm-security", why: "A curated map of prompt-injection and LLM-attack research — the reading list behind module 13." },
      { name: "Model Context Protocol", url: "https://github.com/modelcontextprotocol", why: "The MCP spec and reference servers — the clean tool-access layer the agent in project 08 is built on." },
      { name: "Atomic Red Team", url: "https://github.com/redcanaryco/atomic-red-team", why: "ATT&CK-mapped test behaviours to generate telemetry you can triage and backtest detections against." },
    ],
  },
  {
    heading: "Reading",
    blurb: "The primary sources this path is built on — read these, don't just cite them.",
    items: [
      { name: "OWASP Top 10 for LLM Applications", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/", why: "The canonical list of LLM-app risks; module 13 walks the entries a SOC actually sees telemetry on." },
      { name: "MITRE ATT&CK", url: "https://attack.mitre.org/", why: "The technique vocabulary every detection maps to — the language projects 07 and 12 speak." },
      { name: "MITRE ATLAS", url: "https://atlas.mitre.org/", why: "ATT&CK for AI systems — how to map an incident against an LLM application (module 13)." },
      { name: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", why: "The governance backbone behind module 05's audit trail and the 'explain this to the regulator' test." },
      { name: "OCSF (Open Cybersecurity Schema Framework)", url: "https://schema.ocsf.io/", why: "The vendor-neutral schema module 08 normalises toward — the direction the industry is moving." },
    ],
  },
  {
    heading: "Communities",
    blurb: "Where the durable-signal conversations happen.",
    items: [
      { name: "r/blueteamsec", url: "https://www.reddit.com/r/blueteamsec/", why: "A high-signal defensive-security subreddit — new tradecraft and detection discussion, light on noise." },
      { name: "SANS Internet Storm Center", url: "https://isc.sans.edu/", why: "Daily practitioner diaries on live threats — real IOCs and analysis to practise your pipeline against." },
      { name: "abuse.ch (MalwareBazaar / URLhaus)", url: "https://abuse.ch/", why: "The free malware and IOC feeds projects 06 and 07 pull samples and indicators from." },
    ],
  },
];

function ResourceItem({ r }: { r: Resource }) {
  return (
    <li className="rounded-md border border-hairline bg-surface px-4 py-3 transition-colors hover:border-ink">
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-ink transition-colors group-hover:text-accent-strong">
            {r.name}
          </span>
          <span aria-hidden className="font-mono text-[12px] text-faint">
            ↗
          </span>
        </span>
        <span className="mt-1 block max-w-(--soc-measure) text-[13px] leading-relaxed text-muted-2">
          {r.why}
        </span>
      </a>
    </li>
  );
}

export default function ResourcesPage() {
  const count = GROUPS.reduce((n, g) => n + g.items.length, 0);
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
            {count} RESOURCES · GROUPED BY TYPE
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.7rem,5vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]">
            Resources
          </h1>
          <p className="mt-4 max-w-(--soc-measure) text-[16px] leading-[1.6] text-muted-2">
            Grouped, not one long list, and every entry says{" "}
            <b className="font-medium text-ink">why this one specifically</b> —
            because a bare link list is worthless. All free or free-tier.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          {GROUPS.map((g) => (
            <section key={g.heading}>
              <h2 className="mono-label mb-1.5 flex items-center gap-3 text-accent-strong">
                {g.heading.toUpperCase()}
                <span aria-hidden className="h-px flex-1 bg-hairline" />
                <span className="text-faint">{g.items.length}</span>
              </h2>
              <p className="mb-3 max-w-(--soc-measure) font-mono text-[11.5px] leading-relaxed text-muted-2">
                {`// ${g.blurb}`}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {g.items.map((r) => (
                  <ResourceItem key={r.name} r={r} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
