/**
 * Written content for modules 01 and 02.
 *
 * Kept out of data.ts so the module map stays readable — data.ts owns the
 * structure, these files own the prose.
 */
import type { Section } from "../data";

/* -------------------------------------------------------------------------- */
/* 01 — What AI actually changes in the SOC                                    */
/* -------------------------------------------------------------------------- */

export const M01_SECTIONS: Section[] = [
  {
    heading: "The Tier-1 day, before and after",
    body: "<p>A Tier-1 analyst on a normal shift does not spend their day thinking. They spend it <b>fetching</b>. An alert arrives with an IP, a username and an event ID. Before any judgement is possible, someone has to look up whether that IP has a reputation, whether that user normally logs in at that hour, what else happened on that host in the surrounding ten minutes, and whether a ticket already exists for it.</p><p>That fetching is perhaps 70% of the clock, and almost none of it is the part a human is uniquely good at. It is copy, paste, wait, read, copy again.</p><p>What AI changes is that fetching layer. A well-built assistant arrives at the analyst with the reputation already looked up, the surrounding events already pulled, the user's baseline already stated, and the whole thing summarised into a paragraph with the raw evidence attached.</p><p>What it does <b>not</b> change is the last step. Somebody still has to decide, and that decision still carries consequences.</p>",
    callout: {
      kind: "warn",
      title: "The number that gets quoted wrong",
      body: "You will read that AI cuts triage time by 60–80%. Treat every such figure as marketing until you see the methodology. What is usually measured is time-to-first-summary, not time-to-closed-ticket, and the two are very different numbers. Project 10 in this path exists so you can quote your own measurement instead.",
    },
  },
  {
    heading: "The four roles AI actually plays",
    body: "<p>Strip away the product names and there are only four things a language model does in a SOC. Every feature you will be sold is one of these, or a chain of them.</p>",
    table: {
      headers: ["Role", "What it does", "Failure mode when it is wrong"],
      rows: [
        [
          "Summariser",
          "Compresses 40 events into a paragraph a human can read in ten seconds",
          "Omits the one event that mattered. Compression is lossy and the model chooses what to lose.",
        ],
        [
          "Enricher",
          "Adds context: reputation, asset owner, prior tickets, ATT&CK mapping",
          "Invents context that sounds right. A fabricated ASN or a plausible-but-wrong technique ID.",
        ],
        [
          "Correlator",
          "Links events across sources into one narrative",
          "Draws a causal line between two unrelated events because they are near each other in time.",
        ],
        [
          "Drafter",
          "Writes the ticket, the report, the customer comms",
          "Writes confidently about something that did not happen, in prose good enough that nobody re-reads it.",
        ],
      ],
    },
    callout: {
      kind: "model",
      title: "Notice what is missing from that table",
      body: "There is no “decider” row. Not because a model cannot output the word “malicious” — it will do that all day — but because a verdict is an accountable act and accountability cannot be delegated to something that cannot be held responsible.",
    },
  },
  {
    heading: "Alert fatigue maths — why summarisation is not fewer alerts",
    body: "<p>This is the most common misunderstanding in the field, and it is worth doing the arithmetic.</p><p>Say you receive 1,000 alerts a day and each takes 6 minutes to triage. That is 100 analyst-hours a day, which is why you are drowning.</p><p>Now add an assistant that halves per-alert time to 3 minutes. You are at 50 hours. Genuinely better — and you still have 1,000 alerts. The queue has not shortened, the context switches have not reduced, and the analyst is still making 1,000 decisions a day. Decision fatigue is not a function of how long each decision takes.</p><p>The lever that actually shortens the queue is <b>suppression and correlation</b> — collapsing 40 alerts about one incident into one alert about one incident. That is closer to the clustering work in module 03 than to anything generative.</p>",
    callout: {
      kind: "review",
      title: "The interview version of this point",
      body: "“Summarisation reduces time per alert. It does not reduce alert count, and alert count is what causes fatigue. If you want fewer alerts you need deduplication, correlation and tuning — and only the first of those is helped much by a model.” That answer separates you from the candidates who have read a vendor page.",
    },
  },
  {
    heading: "The accountability line",
    body: "<p>Here is the sentence the whole path is built around: <b>the analyst signs the ticket, not the model.</b></p><p>That is not a philosophical position, it is an operational one with four hard edges. There are decisions an assistant must never be permitted to make on its own, and they are not arbitrary — each one is a place where being wrong is expensive, irreversible, or legally consequential.</p>",
    table: {
      headers: ["Decision", "Why a model must not own it"],
      rows: [
        [
          "Verdict ownership",
          "Closing an alert as benign is a decision to stop looking. If it was wrong, nobody finds out until much later, and there is no second reviewer.",
        ],
        [
          "Escalation",
          "Escalating wakes people up and spends political capital. Not escalating when you should have is how a small incident becomes a large one.",
        ],
        [
          "Containment authority",
          "Isolating a host or disabling an account has immediate business cost. A model has no idea what that server does at 09:00 on a Monday.",
        ],
        [
          "Legal hold",
          "Once evidence is under hold, the chain has to survive a lawyer. A model that paraphrases a log line has altered evidence.",
        ],
      ],
    },
    callout: {
      kind: "verified",
      title: "The general form",
      body: "If the answer to “who is accountable if this is wrong?” is anything other than a named human who has seen the raw evidence, the model does not belong in that step. Everything else on this path is a technique. That is the principle the techniques serve.",
    },
  },
  {
    heading: "What “AI SOC analyst” means on a job description",
    body: "<p>The title is new enough that it means different things at different companies. In practice, postings cluster into three shapes, and knowing which one you are reading changes how you prepare.</p>",
    table: {
      headers: ["Shape", "What they actually want", "Tell in the posting"],
      rows: [
        [
          "Analyst who uses AI tooling",
          "A competent Tier-1/2 who is fluent with Security Copilot or an equivalent. The AI is a tool, not the job.",
          "Lists a SIEM and a named vendor AI feature. No Python.",
        ],
        [
          "Detection engineer with AI in the loop",
          "Someone who builds and measures assistants: prompts in version control, evals, false-positive budgets.",
          "Mentions Python, evaluation, prompt engineering, detection-as-code.",
        ],
        [
          "Security engineer for AI systems",
          "Defending the LLM applications the business is shipping — prompt injection, agent abuse, model supply chain.",
          "Mentions OWASP LLM Top 10, MITRE ATLAS, or “securing our AI products”.",
        ],
      ],
    },

  },
];

/* -------------------------------------------------------------------------- */
/* 02 — LLM mechanics for defenders                                            */
/* -------------------------------------------------------------------------- */

export const M02_SECTIONS: Section[] = [
  {
    heading: "Tokens and the context window as a budget",
    body: "<p>A model does not read characters or words. It reads <b>tokens</b> — chunks of roughly four characters in English, though log data tokenises worse than prose because it is full of hex, GUIDs and punctuation that do not compress into familiar pieces.</p><p>The context window is the total tokens the model can consider at once: your instructions, the data you pasted, the retrieved documents, the conversation history, and the response it is about to write. All of it competes for the same budget.</p><p>This is why “just paste the logs in” fails at scale. A single verbose Windows 4688 event can run 400–600 tokens raw. Forty of them is 20k tokens before you have written a single instruction — and that is the entire practical working space of many local models.</p>",
    code: {
      lang: "python",
      label: "Measure it rather than guess — token counts surprise people",
      code: "import tiktoken\n\nenc = tiktoken.get_encoding(\"cl100k_base\")\n\nraw_event = open(\"sample_4688.json\").read()\nprint(f\"raw:        {len(enc.encode(raw_event)):>5} tokens\")\n\n# The same event, normalised to the handful of fields triage needs\nnormalised = {\n    \"ts\": \"2026-07-31T09:14:22Z\",\n    \"host\": \"WKS-4471\",\n    \"user\": \"acme\\\\jbell\",\n    \"parent\": \"winword.exe\",\n    \"proc\": \"powershell.exe\",\n    \"cmdline\": \"-w hidden -enc SQBFAFgA...\",\n}\nprint(f\"normalised: {len(enc.encode(str(normalised))):>5} tokens\")",
    },
    callout: {
      kind: "review",
      title: "This is why module 08 comes before the triage projects",
      body: "Normalisation is not housekeeping you do for tidiness. It is what makes the problem fit in the budget at all — typically a 5–10× reduction on Windows events, which is the difference between 8 events of context and 60.",
    },
  },
  {
    heading: "Temperature, and what non-determinism costs a SOC",
    body: "<p>Temperature controls how much randomness goes into choosing each next token. At 0 the model takes the highest-probability option every time; higher values let it sample from further down the distribution.</p><p>For creative writing that variety is the point. For a security verdict it is a liability: the same alert, run twice, returning <code>benign</code> and then <code>suspicious</code> is not a system anyone can operate, audit or trust.</p><p><b>Set temperature to 0 for anything that produces a verdict, a classification or a structured field.</b> Reserve higher values for genuinely generative work like drafting the human-readable narrative of a report, where variation is harmless.</p>",
    callout: {
      kind: "warn",
      title: "Temperature 0 is not determinism",
      body: "Even at 0, floating-point non-associativity on GPUs, batching, and model or quantisation updates all mean you can get different output for identical input. It is far more consistent, not guaranteed. If you need a reproducible audit trail, log the actual output — do not assume you can regenerate it.",
    },
  },
  {
    heading: "Embeddings — similarity as arithmetic",
    body: "<p>An embedding turns a piece of text into a list of numbers positioned so that similar meanings sit close together. That is the whole idea, and it is enormously useful in a SOC for three jobs that have nothing to do with generation.</p><ul><li><b>Deduplication.</b> Forty alerts phrased slightly differently about the same failing service collapse into one cluster.</li><li><b>Clustering.</b> Group a day's alerts by similarity and triage the groups rather than the items.</li><li><b>Retrieval.</b> Find the runbook section relevant to this alert without anyone maintaining a keyword mapping.</li></ul><p>Embeddings are cheap, fast, local, and — importantly — <b>they do not hallucinate</b>. A similarity score is a measurement, not a claim. This is why so much of the reliable value in an AI-assisted SOC comes from the embedding layer rather than the generative one.</p>",
    callout: {
      kind: "verified",
      title: "Worth internalising",
      body: "Nearest-neighbour search returns real documents that genuinely exist. Nothing is invented. When you can solve a problem with embeddings instead of generation, you have removed a class of failure rather than mitigated it.",
    },
  },
  {
    heading: "RAG — the model reads your runbook first",
    body: "<p>Retrieval-Augmented Generation sounds like an architecture. It is closer to a habit: before the model answers, go and fetch the relevant documents and put them in the prompt.</p><p>The value in a SOC is specific. A general model knows what Kerberoasting is; it does not know that <i>your</i> policy is to escalate any 4769 against a service account to Tier 2 within 15 minutes, because that lives in your runbook. RAG is how the model gets your context without retraining anything.</p><p>The order matters: <b>retrieve, then generate</b>. A model asked to answer first and cite second will produce plausible citations to documents that do not exist.</p>",
    callout: {
      kind: "model",
      title: "The failure mode to watch",
      body: "RAG reduces hallucination; it does not eliminate it. A model handed five retrieved chunks can still assert something none of them support. This is why module 04 makes evidence grounding — a citation for every claim — a hard requirement rather than a nicety.",
    },
  },
  {
    heading: "Tool use — query the SIEM instead of guessing",
    body: "<p>Function calling lets the model ask for something rather than invent it. You describe the tools available, and instead of guessing whether an IP is malicious, the model emits a structured request to call <code>lookup_ip</code>, your code runs it, and the real result goes back in.</p><p>This is the single biggest reliability upgrade available, because it converts questions the model would otherwise answer from memory into questions answered from data.</p>",
    queries: {
      note: "The tool that matters most is the one that queries your own logs. Both dialects, because this path treats them as equals.",
      kql: "// Tool: recent_auth_failures(user, hours)\nSecurityEvent\n| where TimeGenerated > ago({hours}h)\n| where EventID == 4625 and TargetUserName == \"{user}\"\n| summarize attempts = count(),\n            sources = make_set(IpAddress, 10)\n         by TargetUserName, bin(TimeGenerated, 1h)\n| order by TimeGenerated desc",
      spl: "``` Tool: recent_auth_failures(user, hours) ```\nindex=main EventCode=4625 Account_Name=\"{user}\"\n  earliest=-{hours}h\n| bucket _time span=1h\n| stats count as attempts,\n        values(Source_Network_Address) as sources\n     by _time, Account_Name\n| sort - _time",
    },
    callout: {
      kind: "warn",
      title: "A tool is an execution path",
      body: "The moment a model can call a function, its mistakes stop being text and start being actions. Read-only tools with bounded time windows are safe; anything that writes, disables or isolates needs the approval gate from module 13. Project 08 builds exactly that.",
    },
  },
  {
    heading: "Agents are loops, and loops need gates",
    body: "<p>An agent is not a distinct technology. It is a model in a <code>while</code> loop with tools: observe, decide, act, observe the result, decide again — until it judges itself finished.</p><p>That loop is genuinely powerful for investigation, where you cannot know in advance which query the third step needs. It is also where small errors compound: a wrong conclusion at step two becomes the premise for steps three through eight, and the model will not notice, because each step looks locally reasonable.</p><p>Two controls make agents operable rather than alarming: an <b>iteration cap</b>, so a confused loop terminates instead of running up a bill, and an <b>approval gate</b> on any action with side effects.</p>",
    callout: {
      kind: "review",
      title: "Sequencing note",
      body: "Do not start with agents. Every project in this path up to number 08 is a single, inspectable inference — because you cannot debug a loop until you can debug one step of it. When an agent misbehaves, the question is always “which iteration went wrong?”, and that is unanswerable if you never learned to read one.",
    },
  },
  {
    heading: "Hallucination as a property, not a bug",
    body: "<p>This is the point of the module, and the reason the whole path is shaped the way it is.</p><p>A language model produces the most probable continuation of its input. It has no separate step where it checks whether that continuation is true, because there is no internal representation of truth to check against. Fluent-and-wrong and fluent-and-right are produced by the identical mechanism.</p><p>That means hallucination is not a defect awaiting a patch in the next release. It is a property of how these systems work. Grounding, retrieval, tools and citations all <b>reduce the rate</b>. None of them removes the category.</p><p>Which leaves exactly one durable control, and it is the one this path repeats fifteen times: <b>verification against the raw evidence, by the human who is accountable for the outcome.</b></p>",
    callout: {
      kind: "verified",
      title: "Why every module ends with a verify-it exercise",
      body: "Not because verification is a nice habit. Because it is the only control that does not itself depend on the model being right.",
    },
  },
];
