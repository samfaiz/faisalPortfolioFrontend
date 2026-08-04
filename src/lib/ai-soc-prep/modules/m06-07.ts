/** Written content for modules 06 and 07 — the Tech Stack block. */
import type { Section } from "../data";

/* -------------------------------------------------------------------------- */
/* 06 — The vendor layer                                                       */
/* -------------------------------------------------------------------------- */

export const M06_SECTIONS: Section[] = [
  {
    heading: "How to read any vendor's AI feature",
    body: "<p>Every platform now has an AI feature, the marketing is close to identical, and the differences are real but buried. Three questions cut through it, and they work on a product you have never heard of.</p><ol><li><b>What is it grounded in?</b> Its own telemetry, your documents, or the model's training data? The last one is the weakest and the most commonly implied.</li><li><b>Can you inspect and version the prompt?</b> If not, you cannot debug it, test a change, or roll one back — and it is therefore not a detection you own.</li><li><b>What does it cost per invocation?</b> Some are included; some meter per query and get expensive at triage volume.</li></ol><p>Everything below is those three questions applied.</p>",
    callout: {
      kind: "review",
      title: "The fourth question, for the room",
      body: "“What happens when it is wrong?” Ask a vendor this and watch carefully. A good answer describes the human gate and the audit trail. A poor one talks about accuracy percentages, which is a different question entirely.",
    },
  },
  {
    heading: "Microsoft Sentinel + Security Copilot",
    body: "<p>The most complete offering, and the one most likely to be in front of you in a Microsoft-centric shop.</p><p><b>Promptbooks</b> are saved, parameterised prompt chains run against incident context Copilot already holds. That grounding is genuine and it is the main value — you are not pasting data in, it is already there. KQL generation works well because the model is given the actual table schema, which is precisely the technique module 10 teaches.</p><p>The limitation worth knowing: you cannot treat a promptbook the way you treat a detection rule. Version control, diffs, a test set, a rollback — none of that exists in the way it does for a file in git. That is a real constraint on maturity, not a nitpick.</p>",
    table: {
      headers: ["", "Assessment"],
      rows: [
        ["Grounded in", "Sentinel and Defender data. Genuine, and the strongest part."],
        ["Prompt inspectable", "Partially. Promptbooks are editable; the system layer is not."],
        ["Cost model", "Security Compute Units, provisioned. Predictable, not cheap."],
        ["Best at", "Incident summarisation and KQL generation."],
        ["Weakest at", "Anything needing measured, versioned, reproducible behaviour."],
      ],
    },
  },
  {
    heading: "Defender XDR incident narratives",
    body: "<p>Distinct from Copilot and often confused with it. Defender generates a written narrative of an incident automatically — the story of what happened across the alerts it correlated.</p><p>It is genuinely useful for the first sixty seconds of triage, and it is one of the clearest examples in the industry of the summariser role from module 01: it compresses, and compression is lossy. Read the narrative to orient, then read the alerts. Analysts who stop at the narrative miss the event it chose to leave out.</p>",
    callout: {
      kind: "warn",
      title: "The failure that matters here",
      body: "A narrative reads as authoritative because it is fluent and it comes from the platform rather than a chatbot. That combination makes people less likely to check it, not more. Treat it as blue-dashed.",
    },
  },
  {
    heading: "CrowdStrike, Splunk, Elastic, Google",
    body: "<p>Shorter assessments, same three questions.</p>",
    table: {
      headers: ["Platform", "What it is", "The honest note"],
      rows: [
        [
          "CrowdStrike Charlotte AI",
          "Natural-language questions over Falcon telemetry, plus guided response.",
          "Strong grounding in excellent endpoint data. No user-supplied output schema, so you validate downstream or not at all.",
        ],
        [
          "Splunk AI Assistant",
          "SPL generation and explanation, callable from a search.",
          "The most pipeline-friendly of the group — output stays in a search you can act on. SPL generation quality depends heavily on how well your data is normalised.",
        ],
        [
          "Elastic AI Assistant",
          "Chat over Elastic data with a connector to a model of your choosing.",
          "Notable for letting you bring your own model, including a local one. That is a real data-handling advantage nobody else offers so cleanly.",
        ],
        [
          "Google SecOps + Gemini",
          "Summarisation, search generation, and detection authoring over Chronicle data.",
          "Strong at scale-heavy retrieval. Most useful if you are already committed to the Google stack; little reason to move for it.",
        ],
      ],
    },
  },
  {
    heading: "Wrapper, feature, or platform",
    body: "<p>A useful three-way classification when you are being sold something, because the price and the lock-in differ enormously.</p><ul><li><b>Wrapper</b> — a chat box that forwards your text to a general model with a system prompt. Little grounding in your data. You could build it in an afternoon, and after this path you could.</li><li><b>Feature</b> — genuinely integrated with the platform's data and permissions model. Cannot be replicated externally because the value is the integration.</li><li><b>Platform</b> — the AI is the product and everything else is plumbing. Rare, and usually a startup.</li></ul><p>The test: <b>ask what it knows that a general model does not.</b> If the answer is nothing, you are looking at a wrapper.</p>",
    callout: {
      kind: "verified",
      title: "Why this matters commercially",
      body: "Wrappers are priced like features. Knowing the difference in a procurement conversation is one of the more immediately valuable things on this path, and it is the sort of judgement that gets a junior invited to those conversations.",
    },
  },
  {
    heading: "Lock-in and the exit question",
    body: "<p>Prompts, promptbooks and tuned detections written inside a vendor's console are, in practice, not portable. Nothing exports cleanly, and the semantics differ even where the syntax survives.</p><p>The mitigation is not to avoid vendor AI — it is genuinely useful — but to keep the artefacts you can own in a form you own. Prompt text in git. Golden datasets as files. Metric definitions written down. Then a platform migration costs re-implementation rather than starting from nothing.</p><p>This is the same argument as detection-as-code, applied one layer up, and it is why module 04 insists on prompt versioning before you have anything worth versioning.</p>",
  },
];

/* -------------------------------------------------------------------------- */
/* 07 — The build-your-own layer                                               */
/* -------------------------------------------------------------------------- */

export const M07_SECTIONS: Section[] = [
  {
    heading: "The stack, and what each layer is for",
    body: "<p>Every project on this path is built from these seven layers. You will not need all of them in project 01 — you need the first three — but seeing the whole shape early makes each addition feel like a step rather than a surprise.</p>",
    table: {
      headers: ["Layer", "Choice here", "Introduced in"],
      rows: [
        ["Model runtime", "Ollama", "Project 01"],
        ["Code", "Python, pandas, DuckDB", "Project 01, 03"],
        ["Schema / validation", "Pydantic", "Project 01"],
        ["Retrieval", "Chroma", "Project 04"],
        ["Tool access", "MCP", "Project 08"],
        ["Guardrails", "Presidio, output validation", "Project 02, 09"],
        ["Orchestration", "Plain Python, then n8n if you want a UI", "Project 08"],
      ],
    },
  },
  {
    heading: "Model sizing — the only numbers you need",
    body: "<p>Parameter count is roughly quality; quantisation is roughly memory. The practical guidance for a security workstation is short.</p>",
    table: {
      headers: ["Size", "RAM needed", "Good for", "Not good for"],
      rows: [
        ["3B", "~4 GB", "Extraction, classification, simple structured output", "Multi-step reasoning. It will produce confident nonsense."],
        ["7–8B", "~6–8 GB", "The sweet spot. Triage verdicts, summarisation, most of this path.", "Long correlation chains across many events."],
        ["14B", "~12 GB", "Noticeably better reasoning and refusal calibration", "Speed on CPU. You will feel it."],
        ["70B", "~40 GB+", "Genuinely strong, needs a GPU or a lot of patience", "A laptop."],
      ],
    },
    callout: {
      kind: "review",
      title: "Pick by structured-output reliability, not by benchmark",
      body: "The benchmarks that get quoted measure reasoning and chat quality. What this path needs is a model that reliably returns valid JSON matching a schema — a narrower and much more testable property. Test it on your own schema and ignore the leaderboard.",
    },
  },
  {
    heading: "Frameworks — and when plain SDK is the right answer",
    body: "<p>The internet will tell you to start with LangChain. For most security work that is wrong, and the reason is debuggability.</p><p>A framework earns its place when you need something genuinely hard: multi-step agent state, retries with backoff across a graph, or streaming through a chain. If what you are doing is <i>prompt → model → validate → act</i>, a framework adds a layer of abstraction between you and the failure, and failures are the entire subject of this path.</p>",
    code: {
      lang: "python",
      label: "The whole thing, without a framework",
      code: "import ollama\nfrom pydantic import BaseModel\n\nclass Verdict(BaseModel):\n    verdict: str\n    confidence: float\n\nresp = ollama.chat(\n    model=\"llama3.1:8b\",\n    format=Verdict.model_json_schema(),\n    options={\"temperature\": 0},\n    messages=[{\"role\": \"user\", \"content\": prompt}],\n)\nverdict = Verdict.model_validate_json(resp[\"message\"][\"content\"])\n\n# When this goes wrong you are four lines from the cause.",
    },
    callout: {
      kind: "verified",
      title: "The rule of thumb",
      body: "Start with the plain SDK. Move to LangGraph when you have a genuine graph — branching, loops, state that persists across steps. Project 08 reaches that point; nothing before it does.",
    },
  },
  {
    heading: "Retrieval — Chroma, and when to outgrow it",
    body: "<p>You need a vector store from project 04 onward, when the assistant starts reading your runbooks. The choice is less consequential than it looks.</p><ul><li><b>Chroma</b> — runs in-process, persists to a directory, no server. Correct choice for everything on this path.</li><li><b>Qdrant</b> — a real server with filtering and payload indexes. Worth it when you need metadata filters at scale.</li><li><b>pgvector</b> — vectors in Postgres. Worth it when you already run Postgres and want one thing to back up.</li></ul><p>Move off Chroma when you have a concrete reason, not in anticipation of one.</p>",
  },
  {
    heading: "MCP — the clean answer to tool access",
    body: "<p>The Model Context Protocol standardises how a model is given tools. Rather than every application inventing its own function-calling glue, a tool is exposed by an MCP server and any MCP-aware client can use it.</p><p>For a SOC this matters because the tools are the same everywhere — query the SIEM, look up a hash, check an IP, read a ticket. Building those once as MCP servers means they work with whatever client you use next, which is a real hedge against the vendor churn module 06 warns about.</p>",
    callout: {
      kind: "warn",
      title: "A tool server is an execution surface",
      body: "The moment a model can call your SIEM, prompt injection stops being a text problem and becomes an access-control one. Read-only, bounded time windows, and an approval gate on anything with side effects. Module 13 is where this gets its own treatment; project 08 builds it.",
    },
  },
  {
    heading: "Guardrails — the two that earn their keep",
    body: "<p>The word covers a lot of marketing. Two are genuinely load-bearing.</p><p><b>Output schema validation.</b> Not optional, and already in project 01. If the response does not match the schema, it is rejected — not repaired, not accepted with a warning.</p><p><b>PII redaction before inference.</b> Presidio, covered in module 05. Required the moment real data is involved and the model is not local.</p><p>Everything else — prompt-injection classifiers, toxicity filters, jailbreak detectors — is worth knowing about and is mostly not what a SOC assistant fails on. It fails on unverified claims, and the control for that is grounding plus a human, not another model checking the first model.</p>",
    callout: {
      kind: "model",
      title: "Be sceptical of the guard-model pattern",
      body: "Using a second LLM to check the first one's output is popular and mostly moves the problem. The checker has the same failure mode as the thing it is checking, and now you have two unverified components. Deterministic checks — schema, substring, row counts — do not have that property.",
    },
  },
  {
    heading: "The environment gate",
    body: "<p>This is where the module stops being reading and becomes a checklist. Nothing else on this path works until every line passes, and it is worth doing now rather than discovering a broken install in the middle of project 04.</p>",
    code: {
      lang: "bash",
      label: "Run all of it. Every line must succeed.",
      code: "# 1. Runtime up\ncurl -s http://127.0.0.1:11434/api/version\n\n# 2. Model present and loadable\nollama list\nollama run llama3.1:8b \"reply with the single word: ready\"\n\n# 3. Python env\npython --version          # 3.11+\npip list | grep -E \"ollama|pydantic\"\n\n# 4. Structured output actually works — the real test\npython - <<'PY'\nimport ollama\nfrom pydantic import BaseModel\nclass T(BaseModel):\n    ok: bool\n    note: str\nr = ollama.chat(model=\"llama3.1:8b\",\n                format=T.model_json_schema(),\n                options={\"temperature\": 0},\n                messages=[{\"role\":\"user\",\"content\":\"Return ok=true, note='gate passed'.\"}])\nprint(T.model_validate_json(r[\"message\"][\"content\"]))\nPY",
    },
    callout: {
      kind: "verified",
      title: "Step 4 is the one that matters",
      body: "The first three prove things are installed. The fourth proves the model does the one job this path depends on — returning valid JSON matching a schema you defined. A model can pass the first three and fail the fourth, and finding that out here costs five minutes rather than an afternoon.",
    },
  },
];
