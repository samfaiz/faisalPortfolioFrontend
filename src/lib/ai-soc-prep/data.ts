/**
 * AI SOC Analyst path — module map.
 *
 * The third parallel path alongside /soc-prep and /cloud-security-prep, but
 * structurally different: 15 modules of 2,500–3,500 words each would be ~45k
 * words in one page, so each module gets its own route rather than a section
 * on a single kit page.
 *
 * The thesis, and the thing that separates this from every "AI for SOC" post:
 * AI is an evidence-processing layer that a human stays accountable for. Every
 * module ends with a verify-it exercise asking the same question — how do you
 * know the model didn't make this up?
 *
 * Content decisions locked with Faisal:
 *   Models    — local/Ollama is the runnable path; Enterprise and Cloud API
 *               appear as callouts. One tested path, two documented ones.
 *   Audience  — public, written for a stranger with L1 fundamentals.
 *               Internal annexes are planned; where they live is undecided.
 *   Queries   — KQL and SPL both first-class through modules 08–10.
 *   Malware   — defensive analysis only. No sample creation, no offensive
 *               tooling. Keeps the path publishable and defensible.
 */

export type Block =
  | "fundamentals"
  | "stack"
  | "logs"
  | "malware"
  | "additions"
  | "checkpoint";

export const BLOCK_NAMES: Record<Block, string> = {
  fundamentals: "Fundamentals",
  stack: "Tech Stack",
  logs: "Log Analysis with AI",
  malware: "Malware Analysis with AI",
  additions: "The Two Additions",
  checkpoint: "Readiness",
};

/** Blocks in teaching order — drives the START HERE grouping. */
export const BLOCK_ORDER: Block[] = [
  "fundamentals",
  "stack",
  "logs",
  "malware",
  "additions",
  "checkpoint",
];

export interface Module {
  n: number;
  slug: string;
  block: Block;
  title: string;
  /** One line for the index card. */
  summary: string;
  /** What you can do after this module. */
  objectives: string[];
  /** Section headings the full page will carry — the skeleton of the content. */
  outline: string[];
  /** The exercise that closes every module: prove the model was right. */
  verifyIt: string;
  /** Diagram filename under /public/ai-soc-prep/diagrams/. */
  diagram: string;
  /** Project numbers this module feeds. */
  projects: number[];
  minutes: number;
  /** Set where a module exists for a reason worth stating on the card. */
  whyItsHere?: string;
}

export const MODULES: Module[] = [
  /* ---- Block A — Fundamentals (1–5) ------------------------------------- */
  {
    n: 1,
    slug: "what-ai-changes",
    block: "fundamentals",
    title: "What AI actually changes in the SOC",
    summary:
      "Where AI helps, and the four decisions it must never be allowed to make.",
    objectives: [
      "Describe where AI helps: triage, enrichment, summarisation, hunting, reporting",
      "Name the four places it must not decide: verdict ownership, escalation, containment authority, legal hold",
      "Explain why summarising alerts does not reduce alert count",
    ],
    outline: [
      "The Tier-1 day, before and after",
      "The four AI roles: summariser, enricher, correlator, drafter",
      "Alert fatigue maths — why summarisation ≠ fewer alerts",
      "The accountability line: the analyst signs the ticket, not the model",
      "What “AI SOC analyst” means on a job description in 2026",
    ],
    verifyIt:
      "Given three alert outcomes, identify the one the AI should never have been allowed to close.",
    diagram: "01-ai-in-soc.webp",
    projects: [],
    minutes: 35,
  },
  {
    n: 2,
    slug: "llm-mechanics",
    block: "fundamentals",
    title: "LLM mechanics for defenders",
    summary:
      "Tokens, context, temperature, RAG, tools and agents — explained in security terms.",
    objectives: [
      "Explain why the same prompt can produce two different verdicts",
      "Budget a context window instead of pasting 40k log lines into one",
      "Describe RAG, function calling and agents in terms of a triage workflow",
      "Treat hallucination as a technical property of the system, not a bug awaiting a patch",
    ],
    outline: [
      "Tokens and the context window as a budget",
      "Temperature, sampling, and what non-determinism costs a SOC",
      "Embeddings as similarity maths — dedup, clustering, retrieval",
      "RAG: the model reads your runbook before answering",
      "Tool use and function calling — query the SIEM instead of guessing",
      "Agents are loops with tools, and loops need approval gates",
      "Hallucination as a technical phenomenon",
    ],
    verifyIt:
      "Same log, temperature 0 versus 0.8, three runs each. Record the variance and decide which is deployable.",
    diagram: "02-llm-mechanics.webp",
    projects: [1],
    minutes: 45,
  },
  {
    n: 3,
    slug: "classical-ml",
    block: "fundamentals",
    title: "The classical ML you still need",
    summary:
      "Half the ML in a real SIEM is not generative — and a 1% false positive rate is catastrophic.",
    objectives: [
      "Distinguish generative AI from the ML already running in your SIEM",
      "Read a confusion matrix as a SOC cost model",
      "Compute precision, recall and F1 by hand",
    ],
    outline: [
      "UEBA and baselining",
      "Anomaly scoring — isolation forest, z-score on login counts",
      "Clustering for alert grouping — k-means, DBSCAN",
      "Supervised classifiers for phishing and malware scoring",
      "Precision, recall, F1 — and why 1% FP is catastrophic at 100k events/day",
      "The confusion matrix as a cost model",
    ],
    verifyIt:
      "Compute precision and recall by hand from a 200-alert confusion matrix, then say what the FP rate costs in analyst hours.",
    diagram: "03-classical-ml.webp",
    projects: [3],
    minutes: 50,
    whyItsHere:
      "Every curriculum skips this, and it is half the ML in a real SIEM. It is also the fastest way to look competent when someone asks what the anomaly score in Sentinel actually means.",
  },
  {
    n: 4,
    slug: "prompt-engineering",
    block: "fundamentals",
    title: "Prompt engineering for security work",
    summary:
      "Structured, schema-constrained output where every claim cites the raw log line behind it.",
    objectives: [
      "Write prompts that return validated JSON rather than prose",
      "Force evidence grounding — a citation for every claim",
      "Make the model refuse rather than guess when evidence is thin",
      "Version prompts the way you version detection rules",
    ],
    outline: [
      "Structured JSON output, and why free text is unusable downstream",
      "Schema-constrained responses",
      "Evidence grounding — cite the raw log line for every claim",
      "Explicit refusal: return insufficient_evidence rather than a guess",
      "Few-shot with real alert samples",
      "System prompts for a triage persona",
      "Chain-of-thought for triage, and when it is theatre",
      "Prompt versioning — tested, rolled back, owned",
    ],
    verifyIt:
      "Take a deliberately bad prompt, find its four failure modes, and rewrite it.",
    diagram: "04-prompt-anatomy.webp",
    projects: [2, 4],
    minutes: 55,
  },
  {
    n: 5,
    slug: "data-governance",
    block: "fundamentals",
    title: "Data handling, governance, and the accountability trail",
    summary:
      "What may be sent to a model, what may never be, and how to evidence an AI-assisted decision.",
    objectives: [
      "Classify data against a local / redact-then-cloud / never-send decision tree",
      "Redact PII before inference",
      "Log an AI-assisted decision so it survives an audit",
    ],
    outline: [
      "The data classification question — PII, credentials, IP, case data",
      "PII redaction before inference (Presidio)",
      "Local versus cloud model decision tree",
      "UAE data residency and GDPR considerations",
      "Logging for audit: prompt, model, version, output, reviewer, timestamp",
      "What your DPO will ask",
      "Vendor terms — does the provider train on your data?",
      "The “explain this to the regulator” test",
    ],
    verifyIt:
      "Classify eight realistic snippets against the tree and defend the two hardest calls.",
    diagram: "05-data-governance.webp",
    projects: [9],
    minutes: 45,
    whyItsHere:
      "This is the module that makes a candidate employable rather than a liability, and it is the one that gets skipped everywhere.",
  },

  /* ---- Block B — Tech Stack (6–7) --------------------------------------- */
  {
    n: 6,
    slug: "vendor-layer",
    block: "stack",
    title: "The vendor layer",
    summary:
      "What each platform's AI actually does, what is a wrapper, and what costs money per query.",
    objectives: [
      "Describe what Sentinel, Defender, CrowdStrike, Splunk, Elastic and Google SecOps each ship",
      "Tell a genuine capability from a marketing wrapper",
      "Reason about lock-in and portability",
    ],
    outline: [
      "Microsoft Sentinel + Security Copilot — promptbooks, KQL generation, incident summarisation",
      "Defender XDR incident narratives",
      "CrowdStrike Charlotte AI",
      "Splunk AI/ML toolkit",
      "Elastic AI Assistant",
      "Google SecOps + Gemini",
      "Honest comparison table — useful, wrapper, or priced per query",
      "Lock-in and portability",
    ],
    verifyIt:
      "Pick a workflow, map which vendor feature covers which step, and name the gap nobody covers.",
    diagram: "06-vendor-landscape.webp",
    projects: [],
    minutes: 40,
  },
  {
    n: 7,
    slug: "build-your-own",
    block: "stack",
    title: "The build-your-own layer",
    summary:
      "Stand up the local toolchain every project in this path runs on.",
    objectives: [
      "Run a local model and get a structured response out of it",
      "Choose between plain SDK, LangGraph and LlamaIndex — and know when plain SDK wins",
      "Give a model tool access cleanly via MCP",
    ],
    outline: [
      "Models — Ollama, LM Studio, vLLM; sizing 7B vs 14B vs 70B",
      "Code — Python, pandas, DuckDB, Jupyter",
      "Frameworks — plain SDK vs LangChain/LangGraph vs LlamaIndex",
      "Retrieval — Chroma, Qdrant, pgvector",
      "Tool access — MCP (Model Context Protocol)",
      "Orchestration — n8n, Shuffle, Tines, Logic Apps",
      "Enrichment APIs — VirusTotal, AbuseIPDB, urlscan, GreyNoise, MISP, OTX",
      "Guardrails — Presidio, LLM Guard, schema validation",
    ],
    verifyIt:
      "The environment gate: Ollama running, model pulled, Python env ready, first inference returned. Nothing else in this path works until this passes.",
    diagram: "07-stack-architecture.webp",
    projects: [1, 8],
    minutes: 60,
  },

  /* ---- Block C — Log analysis with AI (8–10) ---------------------------- */
  {
    n: 8,
    slug: "normalization",
    block: "logs",
    title: "Normalisation first",
    summary:
      "Feeding raw heterogeneous logs to a model is noise amplification. Schema comes before AI.",
    objectives: [
      "Map fields across Windows Event Log, Sysmon, firewall and cloud audit logs",
      "Normalise to OCSF, ASIM or ECS and explain the token cost saved",
      "Resolve one user across five log sources",
    ],
    outline: [
      "OCSF, Microsoft ASIM, Elastic ECS",
      "Field mapping across sources",
      "Timestamp and timezone normalisation — the silent killer",
      "Entity resolution — one user across five sources",
      "Why raw input is noise amplification",
      "Token efficiency: a normalised event costs a fraction of a raw one",
    ],
    verifyIt:
      "Normalise five raw events into a common schema by hand, then count tokens before and after.",
    diagram: "08-normalization.webp",
    projects: [2, 3],
    minutes: 50,
  },
  {
    n: 9,
    slug: "triage-assist",
    block: "logs",
    title: "Triage assist",
    summary:
      "The reasoning pattern behind an assistant: verdict, confidence, evidence, next steps — then a human gate.",
    objectives: [
      "Build an entity timeline from multiple sources",
      "Collapse repetitive alerts with embedding-based dedup",
      "Ground verdicts in your own runbooks with RAG",
      "Calibrate confidence, because models are overconfident by default",
    ],
    outline: [
      "Alert bundle summarisation",
      "Entity timeline construction",
      "Embedding-based dedup and clustering",
      "RAG over runbooks, past tickets and threat intel",
      "The output contract: verdict + confidence + evidence[] + next_steps[]",
      "Confidence calibration",
      "The human-in-the-loop gate",
      "Measuring MTTT before and after",
    ],
    verifyIt:
      "Three model verdicts against the raw logs. Find the one that is confidently wrong.",
    diagram: "09-triage-assist.webp",
    projects: [4, 9],
    minutes: 60,
  },
  {
    n: 10,
    slug: "nl-to-detection",
    block: "logs",
    title: "NL→query and AI-assisted detection engineering",
    summary:
      "Generate KQL and SPL with schema grounding — then validate, backtest, and never blind-execute.",
    objectives: [
      "Generate queries grounded in your actual table and field list",
      "Validate before running: syntax, bounded dry run, row-count sanity",
      "Draft a Sigma rule from an IOC and backtest it before enabling",
    ],
    outline: [
      "Natural language → KQL and SPL with schema grounding",
      "Why an ungrounded model invents field names",
      "The mandatory validation step",
      "Never blind-execute generated queries against production",
      "Sigma rule drafting from an IOC or report",
      "ATT&CK technique mapping",
      "Backtesting against historical data before enabling",
      "AI-assisted tuning of a noisy rule",
      "Detection-as-code with prompts in version control",
    ],
    verifyIt:
      "A generated query contains two invented field names. Catch both before it runs.",
    diagram: "10-nl-to-detection.webp",
    projects: [5, 7],
    minutes: 65,
  },

  /* ---- Block D — Malware analysis with AI (11–12) ----------------------- */
  {
    n: 11,
    slug: "static-triage",
    block: "malware",
    title: "Static triage with AI",
    summary:
      "Accelerate interpretation, not replace it — and validate every YARA rule against goodware.",
    objectives: [
      "Set up an isolated analysis lab before touching a sample",
      "Turn CAPA capability output into an analyst-readable brief",
      "Deobfuscate PowerShell, JavaScript and VBA — where models are genuinely excellent",
      "Draft a YARA rule and prove it does not alert on Notepad",
    ],
    outline: [
      "Lab safety and isolation, first",
      "Hashes and reputation lookup",
      "PE headers, imports, sections, entropy",
      "Strings and FLOSS",
      "CAPA capability output → model summarisation",
      "Macro and document analysis with oletools",
      "PowerShell / JavaScript / VBA deobfuscation",
      "Behaviour description → YARA draft",
      "YARA validation against a goodware corpus",
    ],
    verifyIt:
      "The model claims an obfuscated script exfiltrates to a domain. Prove or disprove it from the raw script.",
    diagram: "11-static-triage.webp",
    projects: [6],
    minutes: 70,
  },
  {
    n: 12,
    slug: "dynamic-and-re",
    block: "malware",
    title: "Dynamic analysis and AI-assisted reverse engineering",
    summary:
      "Sandbox report to detection — and the failure mode where models describe functions confidently and wrongly.",
    objectives: [
      "Read a sandbox report and extract IOCs, ATT&CK mapping and a Sigma proposal as one chain",
      "Use AI on decompiler output without trusting it",
      "Confirm every AI claim against a second independent source",
    ],
    outline: [
      "Sandbox options — CAPE self-hosted, Any.Run, Joe, Hybrid Analysis",
      "Reading a sandbox report",
      "Report → IOC extraction → ATT&CK mapping → Sigma proposal",
      "Decompiler output summarisation (Ghidra + MCP)",
      "The core failure mode: confident, incorrect function summaries",
      "The verification discipline — a second independent source, always",
      "When to stop and escalate to a real reverse engineer",
    ],
    verifyIt:
      "An AI function summary is wrong. Find the contradicting evidence in the decompiled code.",
    diagram: "12-dynamic-and-re.webp",
    projects: [7],
    minutes: 70,
  },

  /* ---- Block E — The two additions (13–14) ------------------------------ */
  {
    n: 13,
    slug: "defending-ai",
    block: "additions",
    title: "Defending AI systems",
    summary:
      "Your SOC will be asked to alert on prompt injection within a year. Almost no path covers it.",
    objectives: [
      "Walk the OWASP LLM Top 10",
      "Distinguish direct from indirect prompt injection, and know why indirect matters more",
      "Decide what to log from an LLM application and what detections to write on it",
    ],
    outline: [
      "OWASP LLM Top 10",
      "Direct vs indirect prompt injection",
      "Why indirect is the real problem — instructions ride in with the data",
      "Agentic tool-use abuse and why approval gates exist",
      "Excessive agency and blast radius",
      "Data leakage through model outputs",
      "AI supply chain — model provenance, poisoned weights, malicious packages",
      "What to log from an LLM app, and the detections to write",
      "MITRE ATLAS",
    ],
    verifyIt:
      "A document contains a hidden instruction block. Identify the injection and the control that stops it.",
    diagram: "13-defending-ai.webp",
    projects: [8],
    minutes: 60,
    whyItsHere:
      "High-signal precisely because it is missing from almost every learning path, and because it is arriving in real SOC queues now.",
  },
  {
    n: 14,
    slug: "ai-enabled-attacks",
    block: "additions",
    title: "Detecting AI-enabled attacks",
    summary:
      "Which detection signals are now dead, which still work, and why the countermeasure to deepfake fraud is a process.",
    objectives: [
      "Update detection assumptions for an AI-capable adversary",
      "Name the content-based signals that no longer work",
      "Build a phishing detection case without relying on content",
    ],
    outline: [
      "AI-generated phishing and BEC at scale",
      "Deepfake voice in vishing and CFO fraud; deepfake video in verification flows",
      "LLM-assisted script generation and lightweight polymorphism",
      "Dead signals — grammar errors, awkward phrasing, template reuse",
      "Durable signals — infrastructure, headers, auth anomalies, process lineage",
      "Shifting weight from content to behaviour and infrastructure",
      "Callback verification and out-of-band confirmation as the real control",
    ],
    verifyIt:
      "A flawless AI-written phishing email. Build the detection case without using a single content signal.",
    diagram: "14-ai-enabled-attacks.webp",
    projects: [2],
    minutes: 55,
  },

  /* ---- Checkpoint ------------------------------------------------------- */
  {
    n: 15,
    slug: "readiness",
    block: "checkpoint",
    title: "AI SOC readiness checkpoint",
    summary:
      "Final exam, a practical scenario, and the portfolio checklist that turns this into an interview answer.",
    objectives: [
      "Pass a 30-question mixed exam",
      "Produce a triage verdict with evidence and a stated confidence, using your own assistant",
      "Decide which project artefacts to publish and how to describe them",
    ],
    outline: [
      "30-question final exam",
      "Practical: unlabelled alert bundle → verdict + evidence + confidence",
      "Self-assessment rubric across the 14 modules",
      "Portfolio checklist — what to publish and how to describe it",
    ],
    verifyIt:
      "State your own assistant's precision and hallucination rate from project 10, and where it fails.",
    diagram: "15-ai-soc-readiness.webp",
    projects: [10],
    minutes: 90,
  },
];

/* -------------------------------------------------------------------------- */
/* Derived                                                                     */
/* -------------------------------------------------------------------------- */

export const MODULE_COUNT = MODULES.length;

export const TOTAL_MINUTES = MODULES.reduce((n, m) => n + m.minutes, 0);

export const MODULES_BY_BLOCK = BLOCK_ORDER.map((block) => ({
  block,
  label: BLOCK_NAMES[block],
  modules: MODULES.filter((m) => m.block === block),
}));

export function moduleBySlug(slug: string): Module | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function moduleByNumber(n: number): Module | undefined {
  return MODULES.find((m) => m.n === n);
}
