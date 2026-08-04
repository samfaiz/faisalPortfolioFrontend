/**
 * AI SOC projects.
 *
 * Uses the same ProjectGuide schema as the SOC and Cloud walkthroughs, so these
 * get the print/PDF support, step ticking and troubleshooting layout for free.
 * Three additions carry the things this path needs and those did not: a
 * screenshot per step, a dataset block, and the enterprise / hosted-API
 * variants.
 *
 * Project 01 is deliberately the reference template. Per the plan: do not write
 * project 02 until this one is finished, because the format has to be proven
 * before it is scaled to ten.
 */
import type { ProjectGuide } from "@/lib/guides/types";
import { p02 } from "./guides/p02";
import { p03 } from "./guides/p03";
import { p04 } from "./guides/p04";
import { p05 } from "./guides/p05";
import { p06 } from "./guides/p06";
import { p07 } from "./guides/p07";
import { p08 } from "./guides/p08";
import { p09 } from "./guides/p09";
import { p10 } from "./guides/p10";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface AiSocProject {
  n: number;
  slug: string;
  title: string;
  tagline: string;
  /** What you physically have at the end. */
  outcome: string;
  /** What it demonstrates to an interviewer. */
  proves: string;
  difficulty: Difficulty;
  hours: string;
  /** Module numbers this assumes. */
  modules: number[];
  /** Prior project numbers this assumes. */
  after: number[];
  stack: string[];
  prerequisites: string[];
  validation: string[];
  pitch: string;
  stretch: string[];
  repoUrl?: string;
  /** Absent until the guide is written. */
  built?: boolean;
}

export const AI_SOC_PROJECTS: AiSocProject[] = [
  {
    n: 1,
    slug: "local-llm-triage-lab",
    title: "Local LLM triage lab",
    tagline:
      "Get a local model returning a schema-valid, evidence-grounded verdict on a single log line — entirely offline.",
    outcome:
      "<p>A working local model, a Python environment, and a script that turns one raw Windows event into validated JSON with a citation for every claim — and <b>rejects the model's answer when the citation is fabricated</b>.</p>",
    proves:
      "That you can run inference without sending data anywhere, and that you treat model output as something to validate rather than something to trust.",
    difficulty: "Beginner",
    hours: "1–2 h",
    modules: [2, 7],
    after: [],
    stack: ["Ollama", "Python 3.11", "Pydantic", "llama3.1:8b"],
    prerequisites: [
      "<b>Module 02</b> — you need to know what a context window and temperature are before the settings here mean anything.",
      "<b>Module 07</b> — this project <i>is</i> that module's environment gate. Nothing else on the path works until it passes.",
      "16 GB RAM. 8 GB works with a smaller model; the guide says where to switch.",
      "About 12 GB of disk for the model.",
    ],
    validation: [
      "<code>ollama list</code> shows your model and <code>ollama ps</code> shows it loaded.",
      "The script returns JSON that parses and validates against the schema, first time, without manual editing.",
      "Every <code>source_line</code> is an exact substring of the input — the validator proves it rather than you eyeballing it.",
      "Feeding deliberately thin evidence returns <code>insufficient_evidence</code> rather than a guess.",
      "The whole thing runs with networking disabled.",
    ],
    pitch:
      "\"I ran a local model against Windows event data with no network at all, and forced it to cite the exact raw log line behind every claim. The interesting part was the validator — it rejects the response when a citation is not a literal substring of the input, which is how I caught the model paraphrasing evidence rather than quoting it. That check became the base of everything else I built.\"",
    stretch: [
      "Swap the model for a 3B and a 14B and record where structured output starts failing. That number is worth knowing before you rely on it.",
      "Add a second log line and see how the verdict changes — this is the first hint of the context budgeting in module 08.",
      "Run the same prompt ten times at temperature 0 and record any variance. Module 02 claims it is not fully deterministic; check it yourself.",
    ],
    built: true,
  },
  {
    n: 2,
    slug: "phishing-email-analyzer",
    title: "Phishing email analyzer",
    tagline:
      "Raw .eml in, analyst report out — where every fact is parsed by code and only the interpretation is AI.",
    outcome:
      "<p>A tool that reads an email file and produces a ticket-ready Markdown report: real sender versus displayed sender, SPF/DKIM/DMARC with alignment, defanged URLs with display-vs-target mismatches, attachment hashes, and an AI verdict where <b>every claim cites a field you can check</b>.</p>",
    proves:
      "That you know which parts of an analysis must be deterministic and which benefit from a model — and that you measured the false-positive rate on legitimate mail rather than only testing on phishing.",
    difficulty: "Beginner",
    hours: "3–4 h",
    modules: [4, 5, 8],
    after: [1],
    stack: ["Python 3.11", "email (stdlib)", "tldextract", "Ollama", "Pydantic"],
    prerequisites: [
      "<b>Project 01</b> — the grounding validator is reused unchanged.",
      "<b>Module 08</b> — the evidence bundle is that module's normalisation applied to email.",
      "<b>Module 05</b> — matters here more than anywhere: an email is the worst thing to paste into a hosted API without thinking.",
      "One phishing email you can export as <code>.eml</code>, and several legitimate ones.",
    ],
    validation: [
      "Only the <b>topmost</b> <code>Authentication-Results</code> header is trusted, and the count of ignored ones appears in the report.",
      "A sample with <code>dkim=pass</code> but <code>aligned: false</code> is correctly called phishing — passing authentication on the wrong domain is the whole trick.",
      "Every URL in the output is defanged; nothing in the pipeline resolves or fetches anything.",
      "The evidence validator rejects a verdict citing a bundle path that does not exist.",
      "You have a measured false-positive rate on at least ten legitimate emails, written down with the date and model tag.",
    ],
    pitch:
      "\"I built a phishing analyzer and the interesting decision was how little of it is AI. Header parsing, authentication results and URL extraction are all deterministic Python — the model only interprets what that code found, and it is explicitly told not to re-derive the SPF result, because it will contradict the header if you let it. The detail I am proudest of is that it trusts only the topmost Authentication-Results header, since the ones below it were written by servers upstream of ours, possibly the attacker's. And I measured it on legitimate mail, not just phishing — it was flagging 8% of newsletters, which is the number that decides whether anyone would actually use it.\"",
    stretch: [
      "Add VirusTotal lookups on attachment hashes, behind an explicit flag — it is the first thing in this path that leaves your machine.",
      "Run the SpamAssassin corpus through it and see what a pre-DKIM world looks like when the strongest signals are simply absent.",
      "Redact the bundle with Presidio and compare a local verdict against a hosted one on the redacted version. If the accuracy holds, you have module 05's argument in numbers.",
    ],
    built: true,
  },
  {
    n: 3,
    slug: "windows-auth-anomaly-hunter",
    title: "Windows auth log anomaly hunter",
    tagline:
      "42,000 logon events down to 20 clusters with pure arithmetic, then one model call to write the hunt narrative.",
    outcome:
      "<p>A hunt pipeline over real Windows 4624/4625/4648 events: per-account baselines with a sparse-account guard, weighted deviation scoring where every score decomposes into readable reasons, embedding clustering, and a single AI call producing findings with an attack hypothesis, a benign explanation and a disconfirming check each.</p>",
    proves:
      "That you know where AI belongs in a detection pipeline — at the end, on the small set, doing interpretation — and that you measured recall against known attack samples instead of assuming it.",
    difficulty: "Intermediate",
    hours: "5–6 h",
    modules: [3, 8, 9],
    after: [1, 2],
    stack: ["Python 3.11", "pandas", "scikit-learn", "Ollama", "nomic-embed-text"],
    prerequisites: [
      "<b>Projects 01 and 02.</b> The validator and the bundle-then-interpret shape both carry over.",
      "<b>Module 03</b> — the sparse-account guard comes straight from it, and skipping it flags every new starter.",
      "<b>Module 09</b> — the clustering step is that module's dedup.",
      "A Windows machine with a few weeks of Security log history, or the cross-platform route in step 1.",
    ],
    validation: [
      "The baseline is fitted on the baseline period <b>only</b> — training over the attack window teaches it the attack is normal.",
      "Accounts below 30 events or 7 days are excluded, and the exclusion list is printed rather than hidden.",
      "Every anomaly score decomposes into reason strings, and the model's citations must match them verbatim.",
      "Steps 4 through 6 contain no language model at all. If you cannot say why that matters, the project has not landed.",
      "You have a recall figure against the attack samples and a false-positive count on your own machine, both written down.",
    ],
    pitch:
      "\"I built a Windows authentication hunt that takes 42,000 events down to about 20 clusters, and the part I would point at is that none of that reduction is AI. Baselining is a groupby, scoring is z-scores and set membership, deduplication is DBSCAN over embeddings. The language model runs once, on the 20 survivors, and its job is to write the narrative and propose a hypothesis with a check that would disprove it. Then I measured it — recall against EVTX-ATTACK-SAMPLES was about half, and I can tell you exactly why: I collected 4624 and 4625 but not the Kerberos events, so pass-the-ticket was never visible to it. Knowing where my own detection is blind is worth more than a better number.\"",
    stretch: [
      "Add 4768/4769/4771 and re-measure recall. The Kerberos misses should partly close and you will have a before-and-after.",
      "Require two or more signals before a cluster reaches the model, and measure what recall that costs. The trade is the interesting part.",
      "Precompute cross-cluster correlations — shared source IP, shared host, overlapping windows — in code and hand them to the model as facts. Smaller models skip this reasoning; giving it to them is cheaper than a bigger model.",
    ],
    built: true,
  },
  {
    n: 4,
    slug: "alert-triage-copilot-rag",
    title: "Alert triage copilot with RAG",
    tagline:
      "Retrieval-augmented triage that answers from your runbooks, cites the exact passage, and refuses when no runbook covers the alert.",
    outcome:
      "<p>A copilot that chunks a runbook corpus into a local vector store, retrieves the relevant procedure for an alert, and produces a grounded verdict where every recommendation quotes the runbook chunk behind it — with a validator that <b>rejects any citation the retrieval did not actually contain</b>.</p>",
    proves:
      "That you understand RAG is not a truthfulness upgrade but a source to verify against — and that you measured retrieval quality with recall@k rather than assuming it worked.",
    difficulty: "Intermediate",
    hours: "5–6 h",
    modules: [9],
    after: [1, 2, 3],
    stack: ["Python 3.11", "Chroma", "nomic-embed-text", "Ollama", "Pydantic"],
    prerequisites: [
      "<b>Project 01</b> — the grounding validator returns, pointed at retrieved chunks.",
      "<b>Module 09</b> — this is that module's triage loop with the retrieve step built out.",
      "A small runbook corpus — your own <a href=\"/soc-prep\">/soc-prep</a> notes, or the starter set in the guide.",
      "Ollama with an embedding model; the guide pulls <code>nomic-embed-text</code>.",
    ],
    validation: [
      "Retrieval is tested in isolation first — the right runbook comes back for a query it should match, before the model is ever involved.",
      "Every citation's quote is a literal substring of the chunk it names; a fabricated citation is rejected, not footnoted.",
      "An alert unlike anything in the corpus returns <code>no_runbook_match</code> rather than a confident answer from the nearest bad chunk.",
      "You have a measured recall@3 on a labelled set of at least ten queries, written down.",
    ],
    pitch:
      "\"I built a RAG triage copilot, and the part I would point at is that retrieval being right is a separate question from the model being right — so I measured both. recall@3 on my labelled set was 100% on a clean corpus and dropped when I pointed it at my messier real notes, which is the honest number. And the validator checks that every citation is literally in the retrieved chunk, because a model will happily name chunk 2 and then quote something chunk 2 never said. That check is the difference between grounding and the appearance of grounding.\"",
    stretch: [
      "Add hybrid retrieval — combine keyword (BM25) with vector search — and re-measure recall on the queries that shared no vocabulary with their runbook.",
      "Point the corpus at your full /soc-prep notes and record how recall changes on a larger, messier knowledge base.",
      "Log which runbook grounded which verdict over a batch, and find the runbook that never gets retrieved — it is either redundant or badly worded.",
    ],
    built: true,
  },
  {
    n: 5,
    slug: "nl-to-kql-validator",
    title: "NL→KQL assistant with validator",
    tagline:
      "Plain-English hunt ideas become KQL — and the assistant refuses to emit anything until it passes a schema check, a bounded dry run, and a row-count sanity gate.",
    outcome:
      "<p>An assistant that generates schema-grounded KQL (and its SPL equivalent), then runs it up a four-rung validation ladder — static field check, syntax, bounded dry run, row-count sanity — inside a bounded reject loop, so <b>no unvalidated query ever reaches a human</b>.</p>",
    proves:
      "That you treat generated queries as untrusted until validated — building the validator first, before the generator — and that you know why an invented field returns zero rows rather than an error.",
    difficulty: "Intermediate",
    hours: "4–5 h",
    modules: [10],
    after: [1],
    stack: ["Python 3.11", "DuckDB", "Ollama", "Pydantic"],
    prerequisites: [
      "<b>Module 10</b> — this is that module's validation ladder built into working code.",
      "<b>Project 01</b> — schema-constrained output and temperature-0 discipline carry over.",
      "<code>pip install duckdb</code> for the executable dry-run rungs. No Azure account needed.",
      "Ollama with <code>llama3.1:8b</code>.",
    ],
    validation: [
      "The static field check is built and proven <b>before</b> the generator exists — it catches <code>SourceIP</code> where the column is <code>IpAddress</code>.",
      "Generation runs in a bounded reject loop: a rejected query is fed its error and regenerates, at most three times, then refuses.",
      "The dry run executes over a 15-minute window only; zero rows and absurd counts both fail the sanity gate.",
      "The only two outputs are a fully validated query or a refusal with a reason — there is no path that emits an unchecked query.",
    ],
    pitch:
      "\"I built an NL-to-KQL assistant, and I built the validator before the generator on purpose, because once you have a fluent query in front of you the temptation is to trust it. The check that matters most is the cheapest — a static pass that confirms every field exists in the schema, which catches the invented-column mistake that returns zero rows in Sentinel and reads as 'nothing found'. The assistant literally cannot emit a query that has not passed a bounded dry run and a row-count sanity check. The refusals are the feature.\"",
    stretch: [
      "Add multi-table join validation — harder, because you must field-check against several schemas at once.",
      "Log which fields the model most often invents; it tells you which parts of your schema are confusingly named.",
      "Wire the reject-loop feedback into a small eval: what share of ideas emit on the first attempt versus needing the loop?",
    ],
    built: true,
  },
  {
    n: 6,
    slug: "malware-static-triage-assistant",
    title: "Malware static triage assistant",
    tagline:
      "CAPA, FLOSS, strings and PE structure into a grounded analyst brief and a YARA draft — every AI claim checked against the tool that produced it, every rule scanned against goodware.",
    outcome:
      "<p>A static triage pipeline that builds a deterministic evidence picture (PE, entropy, imports, FLOSS strings, CAPA capabilities), has a local model summarise it into an analyst brief, <b>rejects any capability the model invented that CAPA never reported</b>, verifies extracted IOCs against the raw bytes, and drafts a YARA rule proven clean against a goodware corpus.</p>",
    proves:
      "That you use AI to accelerate malware triage without trusting it — grounding every claim in tool output and validating every YARA rule against legitimate software.",
    difficulty: "Intermediate",
    hours: "5–6 h",
    modules: [11],
    after: [1],
    stack: ["Python 3.11", "pefile", "CAPA", "FLOSS", "YARA", "Ollama"],
    prerequisites: [
      "<b>The <a href=\"/ai-soc-prep/lab-safety\">lab safety page</a> read and your lab built.</b> This is not negotiable — the project handles real samples.",
      "<b>Module 11</b> — this project is that module made executable.",
      "<b>Project 01</b> — the grounding validator returns, pointed at CAPA output.",
      "Inside the VM: pefile, CAPA and FLOSS binaries, the <code>yara</code> CLI, Ollama.",
    ],
    validation: [
      "Every finding in the AI brief names a capability that appears in CAPA's output; an invented one is rejected.",
      "Every extracted IOC is confirmed present in the raw or self-decoded bytes; one the model invented is deleted.",
      "The YARA rule scans clean against a goodware corpus (System32, a clean mirror) and still matches its own sample.",
      "The brief states honestly what static analysis could not determine — a packed payload, a runtime-assembled IOC.",
    ],
    pitch:
      "\"I built a static malware triage assistant, and the design rule was that the model never touches the raw bytes and never decides anything — it summarises what a deterministic tool already proved. CAPA finds a capability and cites the address; the model explains it; and a validator rejects the brief if it names a capability CAPA never reported. The YARA rule it drafts isn't done until it scans clean against System32, because a rule that pages the on-call over Calculator is worse than no rule. Knowing where static analysis is blind — a packed payload it can't see into — is part of the brief, not hidden.\"",
    stretch: [
      "Add oletools macro extraction for document samples and route the macro through the deobfuscation-and-verify step.",
      "Build a small goodware corpus of your own line-of-business software — the false positives that matter are the ones generic corpora miss.",
      "Compare the local model's brief against a public analysis of the same sample and record where it was right, cautious, or wrong.",
    ],
    built: true,
  },
  {
    n: 7,
    slug: "sandbox-report-to-sigma",
    title: "Sandbox report → Sigma generator",
    tagline:
      "A three-step AI chain — IOCs, ATT&CK map, Sigma rule — that verifies at every hop, so a benign decoy domain never survives into the final detection.",
    outcome:
      "<p>A chain that extracts IOCs from a sandbox report, maps observed behaviour to ATT&CK, and drafts a backtested Sigma rule — verifying each hop against the report's own facts, and demonstrating side by side how the same chain produces a contaminated rule when the checks are removed.</p>",
    proves:
      "That you understand error compounding in AI chains — verifying at every hop rather than the end — and that you backtest a generated rule before it is anything but experimental.",
    difficulty: "Intermediate",
    hours: "4–5 h",
    modules: [12],
    after: [1, 6],
    stack: ["Python 3.11", "DuckDB", "Ollama", "Sigma", "Pydantic"],
    prerequisites: [
      "<b>Module 12</b> — this project is that module's report→detection chain, instrumented to show the compounding.",
      "<b>Projects 01 and 06</b> — the grounding validator and extract-then-summarise shape return.",
      "One sandbox report JSON — a public Hybrid Analysis / Any.Run report, or the sample in the guide.",
      "Ollama with <code>llama3.1:8b</code>.",
    ],
    validation: [
      "Each hop is verified against report facts before feeding the next — an unsupported IOC assessment is caught at step 1, not step 3.",
      "The ATT&CK map reflects behaviour actually observed in <i>this</i> detonation, not techniques the family is generally known for.",
      "The Sigma rule ships <code>status: experimental</code> with blank backtest fields until measured.",
      "A backtest counts fires per day, and only a rate analysts can absorb promotes the rule out of experimental.",
    ],
    pitch:
      "\"I built a sandbox-report-to-Sigma chain, and the interesting part is a failure mode I made visible: if step one mislabels a benign CDN as C2, step two maps it to a command-and-control technique and step three writes a rule to alert on legitimate traffic — and it looks exactly as trustworthy as a correct rule. So I verify at every hop, not at the end, and I can show you the same chain producing a clean rule or a contaminated one depending only on whether the checks are on. Then nothing gets past experimental without a 30-day backtest.\"",
    stretch: [
      "Feed a report with two benign decoys and measure how often each survives the unchecked chain across ten runs.",
      "Add a confidence score that travels with each IOC through the chain, so a low-confidence extraction cannot become a high-confidence rule.",
      "Compile the Sigma to both KQL and SPL and backtest in each, comparing the fire rates.",
    ],
    built: true,
  },
  {
    n: 8,
    slug: "mcp-soc-agent-approval-gate",
    title: "MCP SOC agent with approval gate",
    tagline:
      "An agent with VirusTotal, AbuseIPDB and log-query tools — read-only by default, and a human approves every action with a side effect before it runs.",
    outcome:
      "<p>An MCP-based agent that can enrich an alert by calling real tools, but whose every side-effecting action is stopped at a human approval gate — with the injected-instruction case from module 13 demonstrated and blocked, and every tool call logged.</p>",
    proves:
      "That you can give a model tools safely — read-only by default, approval-gated side effects, and injection-aware — which is the single strongest portfolio signal on the path.",
    difficulty: "Advanced",
    hours: "6–8 h",
    modules: [7, 13],
    after: [1, 4],
    stack: ["Python 3.11", "MCP", "Ollama", "VirusTotal API", "AbuseIPDB API"],
    prerequisites: [
      "<b>Module 07</b> — MCP as the clean answer to tool access.",
      "<b>Module 13</b> — the approval gate is that module's control against agentic abuse, made real.",
      "<b>Projects 01 and 04</b> — grounding and retrieval carry over.",
      "Free API keys for VirusTotal and AbuseIPDB; the guide keeps them read-only.",
    ],
    validation: [
      "Every tool is read-only unless there is a specific reason; the two with side effects require per-invocation human approval.",
      "An indirect prompt injection planted in an enrichment result is shown attempting to trigger an unapproved action — and the gate stops it.",
      "Every tool call is logged with its arguments, exactly as module 13's minimum log line requires.",
      "The agent's proposed actions cite the evidence behind them; a human approves against that evidence, not the model's say-so.",
    ],
    pitch:
      "\"I built an MCP agent that enriches alerts with VirusTotal and AbuseIPDB, and the whole design is about blast radius. Every tool is read-only unless it genuinely needs not to be, and anything with a side effect stops at a human approval gate — because the moment a model can act on text an attacker might have written, prompt injection stops being a text problem and becomes an access-control one. I actually plant an injection in an enrichment result to show the agent trying to take an unapproved action, and the gate catching it. Every tool call is logged. That's the difference between an agent and a liability.\"",
    stretch: [
      "Add a log-query tool bounded to read-only and a 15-minute window, reusing project 05's validator on any generated query.",
      "Build a second injection case that hides instructions in a document the agent summarises, and confirm the gate still holds.",
      "Add an override-rate log on the approval gate — how often a human rejects the agent's proposal is your best trust signal.",
    ],
    built: true,
  },
  {
    n: 9,
    slug: "ai-incident-report-writer",
    title: "AI incident report writer",
    tagline:
      "A verified timeline in, an executive summary and technical writeup out — with the module 05 audit-trail fields baked into every generated report.",
    outcome:
      "<p>A report writer that takes a structured incident timeline, grounds an executive summary and a technical writeup in it, refuses to state anything the timeline does not support, and stamps every output with the audit trail — prompt, model, version, reviewer, timestamp — that makes an AI-assisted decision defensible.</p>",
    proves:
      "That you can use AI for the high-value, low-risk job of drafting — while keeping the accountability trail that module 05 requires and refusing to let the model add facts.",
    difficulty: "Intermediate",
    hours: "3–4 h",
    modules: [5, 9],
    after: [1, 4],
    stack: ["Python 3.11", "Ollama", "Pydantic", "Jinja2"],
    prerequisites: [
      "<b>Module 09</b> — the entity timeline is this project's input.",
      "<b>Module 05</b> — the audit-trail fields are the point, not an add-on.",
      "<b>Projects 01 and 04</b> — grounding and retrieval of past tickets carry over.",
      "Ollama with <code>llama3.1:8b</code>.",
    ],
    validation: [
      "Every claim in both the exec summary and the technical writeup traces to a timeline entry; the model cannot add an event.",
      "Two audiences, one source of truth — the summaries differ in altitude, never in facts.",
      "Every generated report carries prompt, model, version, human reviewer and timestamp — the module 05 record.",
      "A timeline with a gap produces a report that states the gap rather than smoothing over it.",
    ],
    pitch:
      "\"I built an incident report writer, which is the highest-value, lowest-risk place to use AI — drafting, not deciding. It takes a verified timeline and produces an exec summary and a technical writeup that differ in altitude but never in facts, because every claim has to trace to a timeline entry and the model is forbidden from adding events. The detail I'm proudest of is boring on purpose: every report is stamped with the prompt, model, version, reviewer and timestamp, so an AI-assisted writeup can survive an auditor asking how it was produced. That audit trail is what makes it usable at work rather than just clever.\"",
    stretch: [
      "Retrieve similar past incidents (project 04's store) and cite them, without letting their details leak into this report's facts.",
      "Generate a regulator-facing version that states only what is confirmed and flags what is still under investigation.",
      "Diff two reports from the same timeline at temperature 0 and 0.7 to show why report generation runs cold.",
    ],
    built: true,
  },
  {
    n: 10,
    slug: "eval-harness-capstone",
    title: "Eval harness (capstone)",
    tagline:
      "A 50-alert golden dataset and the harness that measures your assistant's precision, recall and hallucination rate — the project that turns “I made a chatbot” into “I engineered a system”.",
    outcome:
      "<p>A labelled 50-alert golden dataset, a labelling protocol, and a harness that measures your triage assistant's precision, recall and hallucination rate, runs a prompt A/B, and produces a results table plus an honest written assessment of where the assistant fails.</p>",
    proves:
      "That you can measure an AI system, not just build one — the single capability that separates a portfolio from every other “I use AI for triage” claim.",
    difficulty: "Advanced",
    hours: "8–10 h",
    modules: [3, 9],
    after: [1, 2, 3, 4, 5],
    stack: ["Python 3.11", "pandas", "Ollama", "matplotlib"],
    prerequisites: [
      "<b>Everything before it.</b> The harness measures the assistant you built across the earlier projects.",
      "<b>Module 03</b> — precision, recall and the confusion matrix as a cost model.",
      "<b>Module 09</b> — the assistant under test and its confidence calibration.",
      "Ollama, and the patience to label 50 alerts properly.",
    ],
    validation: [
      "The golden dataset has a written labelling protocol and a resolved second-opinion process — labels are defensible, not vibes.",
      "Precision, recall and hallucination rate are computed against the labels, not asserted.",
      "A prompt A/B is measured on the same dataset, so a change is proven better rather than assumed.",
      "The deliverable includes a written account of where the assistant fails and why — the honest assessment nobody else writes.",
    ],
    pitch:
      "\"The capstone is the eval harness, and it's the project nobody builds — which is exactly why it's the one worth building. I labelled a 50-alert golden dataset with a written protocol, then measured my triage assistant against it: precision, recall, and the number that actually matters, the hallucination rate — how often it cited evidence that wasn't in the input. I ran a prompt A/B on the same set so I could prove one prompt was better rather than believe it. And I wrote up where it fails, honestly. That's the difference between saying 'I use AI for triage' and saying 'I measured mine at 82% precision with a 6% hallucination rate, and here's the harness' — one is a claim, the other is engineering.\"",
    stretch: [
      "Measure calibration: of the verdicts returned at 0.9 confidence, what share were actually right? Overconfidence is the default.",
      "Compare a 3B, 8B and 14B model on the same golden set and find where structured-output reliability breaks down.",
      "Re-run the harness after grounding was added (project 04) versus before (project 01) and quantify what RAG bought you.",
    ],
    built: true,
  },
];

export const AI_SOC_PROJECT_COUNT = 10; // planned
export const AI_SOC_PROJECTS_BUILT = AI_SOC_PROJECTS.filter((p) => p.built).length;

export function aiSocProjectBySlug(slug: string): AiSocProject | undefined {
  return AI_SOC_PROJECTS.find((p) => p.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* Guides                                                                      */
/* -------------------------------------------------------------------------- */

const p01: ProjectGuide = {
  slug: "local-llm-triage-lab",
  projectId: 1,
  intro:
    "<p>This project is deliberately small. Its job is to clear the environment gate — model running, Python talking to it, structured output coming back — so that every later project starts from something known to work rather than debugging an install.</p><p>But it is not trivial, because it introduces the one habit the whole path is built on. By the end you will have a model producing a security verdict, and a validator that <b>refuses to accept that verdict</b> when the evidence behind it does not literally appear in the input.</p><p>Everything runs on your machine. No API key, no account, and nothing leaves the box — which means you can point it at real log data later without a data-handling conversation.</p>",
  dataset: {
    name: "One hardcoded Windows 4688 event",
    note: "<p>No download. The event is in the guide and you paste it. That is intentional — a project whose first step is fetching a 2 GB corpus fails at the first hurdle for half the people who try it. Project 03 introduces real datasets, once the environment is known good.</p>",
  },
  glossary: [
    {
      term: "Ollama",
      plain:
        "A program that downloads and runs language models on your own machine and exposes them on a local HTTP port. Think of it as Docker for models.",
    },
    {
      term: "Quantisation",
      plain:
        "Compressing a model's weights so it fits in less memory, at some cost to quality. <code>q4</code> is smaller and rougher, <code>q8</code> larger and closer to the original. The <code>q5_K_M</code> in a model tag is the quantisation level.",
    },
    {
      term: "Structured output",
      plain:
        "Forcing the model to return JSON matching a shape you defined, rather than prose. It is the difference between something you can validate and something you can only read.",
    },
    {
      term: "Grounding",
      plain:
        "Requiring every claim to point at the specific evidence behind it. Here it means the model must copy the raw log line, not describe it.",
    },
    {
      term: "Pydantic",
      plain:
        "A Python library that checks data matches a declared shape and raises a clear error when it does not. It is what turns “the model returned something JSON-ish” into “the model returned a valid verdict”.",
    },
  ],
  before: [
    "A machine with <b>16 GB RAM</b> for the 8B model. With 8 GB, step 2 tells you which smaller model to pull instead.",
    "<b>12 GB free disk.</b>",
    "Python 3.11 or newer — check with <code>python --version</code>.",
    "No GPU required. It will be slower on CPU, and that is fine for one log line.",
  ],
  steps: [
    {
      title: "Install Ollama",
      time: "5 min",
      why: "Ollama handles the parts that are genuinely annoying — downloading weights, memory mapping, exposing a stable local API — so you can spend your time on the security work rather than on model plumbing.",
      body: "<p>Download the installer for your platform from <a href=\"https://ollama.com/download\" target=\"_blank\" rel=\"noopener noreferrer\">ollama.com/download</a> and run it. It installs a background service that listens on <code>127.0.0.1:11434</code>.</p><p>On Windows it starts automatically and puts an icon in the system tray. On macOS and Linux you may need to start it yourself the first time.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows",
          label: "Or install from the terminal",
          code: "winget install -e --id Ollama.Ollama",
        },
        {
          lang: "bash",
          where: "macOS / Linux",
          code: "# macOS\nbrew install ollama\nollama serve &\n\n# Linux\ncurl -fsSL https://ollama.com/install.sh | sh",
        },
        {
          lang: "bash",
          label: "Confirm the service is up",
          code: "curl http://127.0.0.1:11434/api/version",
        },
      ],
      expect:
        "<p>A version number comes back. If curl connects at all, the service is running — that is the only thing this step needed to establish.</p>",
      expectCode: '{"version":"0.5.7"}',
      fixes: [
        {
          problem: "curl: (7) Failed to connect to 127.0.0.1 port 11434",
          cause:
            "The service is not running. On Windows the tray icon may have been closed; on Linux the systemd unit may not be enabled.",
          fix: "Windows: relaunch Ollama from the Start menu. Linux: <code>sudo systemctl enable --now ollama</code>. macOS: <code>ollama serve</code> in a terminal you leave open.",
        },
        {
          problem: "Windows: 'ollama' is not recognized",
          cause: "The installer updated PATH but your terminal was opened before that.",
          fix: "Close and reopen the terminal. PATH is read once at launch.",
        },
      ],
    },
    {
      title: "Pull a model that is actually good at structured output",
      time: "10–20 min (download)",
      why: "Model choice matters more here than anywhere else in the project. Many models write fluent prose and are unreliable at returning valid JSON — which is the only thing this path asks them to do.",
      body: "<p>Pull <b>llama3.1:8b</b>. It is a reasonable default: good instruction-following, reliable structured output, and it fits comfortably in 16 GB.</p><p>If you have 8 GB, pull <code>llama3.2:3b</code> instead. Everything in this guide works; the output quality is lower and you will notice it more in project 04.</p>",
      commands: [
        {
          lang: "bash",
          label: "16 GB or more",
          code: "ollama pull llama3.1:8b",
        },
        {
          lang: "bash",
          label: "8 GB",
          code: "ollama pull llama3.2:3b",
        },
        {
          lang: "bash",
          label: "Confirm it landed",
          code: "ollama list",
        },
      ],
      expect: "<p>Your model appears with its size and a modified timestamp.</p>",
      expectCode:
        "NAME               ID              SIZE      MODIFIED\nllama3.1:8b        42182419e950    4.7 GB    2 minutes ago",
      fixes: [
        {
          problem: "The download stalls or restarts repeatedly",
          cause: "Ollama resumes on interruption, but a flaky connection can loop.",
          fix: "Re-run the same <code>ollama pull</code> — it resumes rather than starting over. On a very slow link, leave it and check back.",
        },
        {
          problem: "\"model requires more system memory than is available\"",
          cause: "The 8B model needs roughly 6 GB free at load time, not just installed.",
          fix: "Close other applications, or drop to <code>llama3.2:3b</code>. Browsers are usually the culprit.",
        },
      ],
    },
    {
      title: "Prove inference works before writing any code",
      time: "5 min",
      why: "Establish that the model runs, from the command line, with nothing else in the way. If this fails, no amount of Python debugging will help — and it is much easier to see that now than in step 6.",
      body: "<p>Ask it something security-shaped, so you also get a feel for its unprompted behaviour.</p>",
      commands: [
        {
          lang: "bash",
          code: "ollama run llama3.1:8b \"In one sentence: what does Windows Event ID 4688 record?\"",
        },
      ],
      expect:
        "<p>A sentence about process creation. Note the response time — on CPU this may take 10–30 seconds, and that number matters when you later think about a triage loop's latency budget.</p>",
      expectCode:
        "Windows Event ID 4688 records the creation of a new process, including\nthe process name, the account that started it, and (when command-line\nauditing is enabled) the full command line.",
      fixes: [
        {
          problem: "The answer is confidently wrong about the event ID",
          cause:
            "Entirely possible, and worth seeing at step 3 rather than step 9. The model is recalling from training data with no source.",
          fix: "Nothing to fix — this is the phenomenon module 02 described. The rest of the project is about not depending on this mode of answering.",
        },
      ],
    },
    {
      title: "Set up the Python environment",
      time: "5 min",
      body: "<p>A virtual environment, and three packages. <code>ollama</code> for the client, <code>pydantic</code> for schema validation, <code>rich</code> so the output is readable.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows",
          code: "mkdir ai-soc-lab; cd ai-soc-lab\npython -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1\npip install ollama pydantic rich",
        },
        {
          lang: "bash",
          where: "macOS / Linux",
          code: "mkdir ai-soc-lab && cd ai-soc-lab\npython3 -m venv .venv\nsource .venv/bin/activate\npip install ollama pydantic rich",
        },
      ],
      expect:
        "<p>Your prompt is prefixed with <code>(.venv)</code> and <code>pip list</code> shows the three packages.</p>",
      fixes: [
        {
          problem: "PowerShell: \"running scripts is disabled on this system\"",
          cause: "The default execution policy blocks the activation script.",
          fix: "<code>Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned</code>, then activate again. Scoped to your user, not machine-wide.",
        },
      ],
    },
    {
      title: "First call — and see why free text is unusable",
      time: "10 min",
      why: "Worth doing the wrong way once. The problem with prose output is obvious in ten seconds of looking at it, and much less abstract than being told.",
      body: "<p>Ask for a verdict in the naive way, with no schema and no grounding.</p>",
      commands: [
        {
          lang: "python",
          label: "naive.py",
          code: "import ollama\n\nMODEL = \"llama3.1:8b\"\n\nEVENT = \"\"\"\n2026-08-01T09:14:22Z  host=WKS-4471  EventID=4688\n  SubjectUserName=jbell\n  ParentProcessName=C:\\\\Program Files\\\\Microsoft Office\\\\root\\\\Office16\\\\WINWORD.EXE\n  NewProcessName=C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\powershell.exe\n  CommandLine=powershell.exe -w hidden -enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0\n\"\"\"\n\nresp = ollama.chat(\n    model=MODEL,\n    messages=[{\"role\": \"user\",\n               \"content\": f\"Is this event malicious?\\n{EVENT}\"}],\n)\nprint(resp[\"message\"][\"content\"])",
        },
        {
          lang: "bash",
          code: "python naive.py",
        },
      ],
      expect:
        "<p>A few paragraphs. Probably correct in substance — Word spawning hidden encoded PowerShell is a real pattern. Now ask yourself the operational questions: how would you count how many of these came back malicious this month? How would you route them? How would you measure whether it is any good? You cannot, and that is the point.</p>",
    },
    {
      title: "Constrain the output to a schema",
      time: "15 min",
      why: "This is where the project becomes useful. Ollama can force valid JSON matching a schema you supply, which removes an entire class of parsing problems rather than working around them.",
      body: "<p>Define the shape with Pydantic, hand its JSON schema to Ollama with <code>format=</code>, and set <b>temperature 0</b> — module 02's reasoning about verdicts applies here.</p>",
      commands: [
        {
          lang: "python",
          label: "triage.py — the schema",
          code: "from typing import Literal\nfrom pydantic import BaseModel, Field\n\nclass Evidence(BaseModel):\n    claim: str = Field(description=\"What you are asserting\")\n    source_line: str = Field(\n        description=\"The RAW input line supporting it, copied EXACTLY\"\n    )\n\nclass Verdict(BaseModel):\n    verdict: Literal[\n        \"benign\", \"suspicious\", \"malicious\", \"insufficient_evidence\"\n    ]\n    confidence: float = Field(ge=0.0, le=1.0)\n    evidence: list[Evidence]\n    recommended_next_steps: list[str]\n    unsupported_observations: list[str] = Field(\n        default_factory=list,\n        description=\"Things you suspect but cannot evidence from the input\",\n    )",
        },
        {
          lang: "python",
          label: "triage.py — the call",
          code: "import json, ollama\n\nSYSTEM = \"\"\"You are a Tier-1 triage assistant. You do not close alerts;\nyou prepare them for an analyst who does.\n\nFor every item in `evidence`, `source_line` MUST be copied EXACTLY from\nthe INPUT EVENT. Do not paraphrase, reformat, or tidy it.\n\nIf you cannot support a claim with an exact line, do not make the claim.\nPut it in `unsupported_observations` instead.\n\nIf fewer than two claims can be evidenced, set verdict to\n`insufficient_evidence` and return an empty evidence array.\"\"\"\n\nresp = ollama.chat(\n    model=MODEL,\n    format=Verdict.model_json_schema(),   # <- forces the shape\n    options={\"temperature\": 0},           # <- module 02: verdicts are not creative\n    messages=[\n        {\"role\": \"system\", \"content\": SYSTEM},\n        {\"role\": \"user\", \"content\": f\"INPUT EVENT:\\n{EVENT}\"},\n    ],\n)\n\nverdict = Verdict.model_validate_json(resp[\"message\"][\"content\"])\nprint(json.dumps(verdict.model_dump(), indent=2))",
        },
      ],
      expect:
        "<p>Valid JSON that parses into the model on the first attempt. If Pydantic raises, the model returned something off-shape and you have learned something about it — but with <code>format=</code> set that should be rare.</p>",
      expectCode:
        '{\n  "verdict": "suspicious",\n  "confidence": 0.85,\n  "evidence": [\n    {\n      "claim": "PowerShell was launched by Microsoft Word",\n      "source_line": "  ParentProcessName=C:\\\\Program Files\\\\Microsoft Office\\\\root\\\\Office16\\\\WINWORD.EXE"\n    },\n    {\n      "claim": "PowerShell ran hidden with an encoded command",\n      "source_line": "  CommandLine=powershell.exe -w hidden -enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0"\n    }\n  ],\n  "recommended_next_steps": [\n    "Decode the base64 command line",\n    "Check whether jbell opened an email attachment in the preceding minutes"\n  ],\n  "unsupported_observations": []\n}',
      fixes: [
        {
          problem: "ValidationError: confidence — Input should be less than or equal to 1",
          cause: "The model returned 85 rather than 0.85. Common, and exactly what the schema is for.",
          fix: "Nothing to fix in code — this is the validator working. Add “confidence is a decimal between 0 and 1” to the system prompt and re-run.",
        },
        {
          problem: "The response is valid JSON but the evidence array is empty",
          cause: "Some smaller models take the refusal instruction very literally.",
          fix: "Check the verdict field — if it is <code>insufficient_evidence</code>, the model followed instructions on a case where it should not have. Loosen the threshold in the prompt from two claims to one and observe the difference.",
        },
      ],
    },
    {
      title: "Validate the grounding — the step that matters",
      time: "15 min",
      why: "The system prompt asks for exact citations. Asking is not enforcing. This is the control, and it is about ten lines of code.",
      body: "<p>Check every <code>source_line</code> really is a substring of the input. If it is not, the model paraphrased or invented — and the response must be rejected, not displayed with a caveat.</p>",
      commands: [
        {
          lang: "python",
          label: "triage.py — the validator",
          code: "class GroundingError(Exception):\n    pass\n\ndef assert_grounded(verdict: Verdict, source: str) -> None:\n    \"\"\"Every citation must literally appear in the input.\n\n    Whitespace is normalised because models reflow lines; the words and\n    their order still have to match exactly.\n    \"\"\"\n    haystack = \" \".join(source.split())\n\n    for i, ev in enumerate(verdict.evidence):\n        needle = \" \".join(ev.source_line.split())\n        if needle not in haystack:\n            raise GroundingError(\n                f\"evidence[{i}] is not in the input.\\n\"\n                f\"  claimed: {ev.source_line!r}\\n\"\n                f\"  This is a fabricated citation. Reject the response.\"\n            )\n\ntry:\n    assert_grounded(verdict, EVENT)\n    print(f\"✓ grounded — {len(verdict.evidence)} citation(s) verified\")\nexcept GroundingError as e:\n    print(f\"✗ REJECTED\\n{e}\")",
        },
      ],
      expect:
        "<p>Either a confirmation that every citation checks out, or a rejection naming the fabricated one. Both outcomes are successes — the second is the validator earning its place.</p>",
      expectCode: "✓ grounded — 2 citation(s) verified",
      fixes: [
        {
          problem: "Citations fail even though they look right",
          cause:
            "Almost always whitespace or escaping. Windows paths contain backslashes that may be re-escaped differently in the response.",
          fix: "Print both strings with <code>repr()</code> and compare character by character. If it is purely a backslash difference, normalise both sides with <code>.replace(chr(92)+chr(92), chr(92))</code> before comparing.",
        },
        {
          problem: "The model quotes a line that is nearly right but reworded",
          cause: "This is the behaviour the whole step exists to catch.",
          fix: "Do not loosen the check to accommodate it. Strengthen the prompt — repeating “copy the line character for character, do not tidy it” usually fixes it. If it persists, that is a fact about your model worth writing down.",
        },
      ],
    },
    {
      title: "Prove it fails safe",
      time: "10 min",
      why: "A triage assistant that always produces a verdict is not confident, it is miscalibrated. Test the refusal path deliberately, because it will not exercise itself.",
      body: "<p>Feed it an event with nothing suspicious in it and confirm you get a refusal or a benign verdict rather than an invented concern.</p>",
      commands: [
        {
          lang: "python",
          label: "Swap the input and re-run",
          code: "THIN = \"\"\"\n2026-08-01T09:15:02Z  host=WKS-4471  EventID=4624\n  TargetUserName=jbell\n  LogonType=2\n\"\"\"\n\n# Re-run the same call with THIN in place of EVENT.\n# A single interactive console logon, with no context. There is no\n# honest verdict available from this alone.",
        },
      ],
      expect:
        "<p><code>insufficient_evidence</code>, or <code>benign</code> with low confidence and an empty or minimal evidence array. What you do <b>not</b> want is a confident verdict with invented reasoning.</p>",
      expectCode:
        '{\n  "verdict": "insufficient_evidence",\n  "confidence": 0.3,\n  "evidence": [],\n  "recommended_next_steps": [\n    "Retrieve surrounding events for host WKS-4471",\n    "Compare against this account\'s usual logon hours"\n  ],\n  "unsupported_observations": [\n    "LogonType 2 is an interactive console logon, which is unusual for a\\n     remote worker but cannot be judged without a baseline"\n  ]\n}',
      fixes: [
        {
          problem: "The model returns `suspicious` with confident reasoning",
          cause:
            "Its default is to answer. The refusal instruction is competing with that and losing.",
          fix: "Move the refusal rule to the end of the system prompt — instructions near the end carry more weight — and state it as a rule rather than a permission: “You MUST return insufficient_evidence when...”. Record which phrasing worked; that is a real finding about your model.",
        },
      ],
    },
    {
      title: "Verify it is genuinely offline",
      time: "5 min",
      why: "The claim “nothing leaves the box” is the reason this stack is usable on real data. Test it rather than assume it.",
      body: "<p>Disconnect networking entirely and run the script again.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows",
          code: "# Disable the adapter, run, then re-enable\nGet-NetAdapter | Where-Object Status -eq 'Up' | Disable-NetAdapter -Confirm:$false\npython triage.py\nGet-NetAdapter | Enable-NetAdapter -Confirm:$false",
        },
        {
          lang: "bash",
          where: "macOS / Linux",
          code: "# Or just pull the cable / turn off wifi, then:\npython triage.py",
        },
      ],
      expect:
        "<p>Identical behaviour. If it works with no network, then no part of this touched a third party — which is what makes it safe to point at data you could not send to a hosted API.</p>",
      fixes: [
        {
          problem: "It fails offline",
          cause: "Something is still reaching out — most likely a telemetry setting or a model not fully pulled.",
          fix: "Confirm the model is local with <code>ollama list</code>. Set <code>OLLAMA_NOHISTORY=1</code> and check no proxy is configured in your environment.",
        },
      ],
    },
  ],
  after: [
    "Keep <code>triage.py</code>. Projects 02 and 04 extend this exact file rather than starting over.",
    "Commit it with the system prompt in a separate file, versioned — module 04 explains why prompts are detection rules, and starting that habit now costs nothing.",
    "Write down which model you used and its exact tag. When output changes in three months, that line is how you find out why.",
  ],
  enterprise: [
    {
      platform: "Microsoft Sentinel + Security Copilot",
      body: "<p>The equivalent is a <b>promptbook</b> — a saved, parameterised prompt run against incident context Copilot already holds, so there is no equivalent of the paste-the-event step. You get grounding in Sentinel's own data for free, and lose the ability to inspect or version the prompt as a file. Structured output is not exposed the way <code>format=</code> is here; you shape it with the prompt and validate downstream in Logic Apps.</p>",
    },
    {
      platform: "CrowdStrike Charlotte AI",
      body: "<p>Charlotte answers over Falcon telemetry rather than pasted input, so the grounding question changes shape: the data is trustworthy, the interpretation still is not. There is no user-supplied JSON schema — you take the response and parse it, which means the validator in step 7 becomes <i>more</i> important, not less.</p>",
    },
    {
      platform: "Splunk AI Assistant",
      body: "<p>Closest to this project in spirit, because you can call it from SPL and keep the result in a pipeline. The grounding discipline transfers directly — treat the assistant's output as a field to validate, not a verdict to act on.</p>",
    },
  ],
  cloudApi:
    "<p>Anthropic, OpenAI and the rest will do this better — stronger structured output and better refusal calibration. Two things change. First, the event leaves your network, so everything in <b>module 05</b> applies before you paste anything real. Second, you gain a dependency on connectivity you may deliberately cut during an incident. Use hosted models for public and synthetic data; keep a local path for anything else. The code differs by about four lines.</p>",
};

export const AI_SOC_GUIDES: ProjectGuide[] = [
  p01, p02, p03, p04, p05, p06, p07, p08, p09, p10,
];

export function aiSocGuideBySlug(slug: string): ProjectGuide | undefined {
  return AI_SOC_GUIDES.find((g) => g.slug === slug);
}

export function aiSocProjectByNumber(n: number): AiSocProject | undefined {
  return AI_SOC_PROJECTS.find((p) => p.n === n);
}
