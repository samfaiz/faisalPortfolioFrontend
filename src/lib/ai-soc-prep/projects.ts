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

export const AI_SOC_GUIDES: ProjectGuide[] = [p01];

export function aiSocGuideBySlug(slug: string): ProjectGuide | undefined {
  return AI_SOC_GUIDES.find((g) => g.slug === slug);
}

export function aiSocProjectByNumber(n: number): AiSocProject | undefined {
  return AI_SOC_PROJECTS.find((p) => p.n === n);
}
