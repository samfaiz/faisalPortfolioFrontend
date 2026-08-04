/**
 * Project 09 — AI incident report writer.
 *
 * The highest-value, lowest-risk use of AI in a SOC: drafting, not deciding. A
 * verified timeline goes in; a grounded executive summary and technical writeup
 * come out, stamped with the module 05 audit trail, with the model forbidden
 * from adding a fact the timeline does not contain.
 *
 * Code blocks use String.raw. No backtick inside a String.raw block; where a
 * Markdown backtick must be emitted, chr(96) is used.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p09: ProjectGuide = {
  slug: "ai-incident-report-writer",
  projectId: 9,
  intro:
    "<p>You are going to build the most immediately useful thing on this path: a report writer that takes a verified incident timeline and produces two documents from it — an executive summary and a technical writeup — that differ in altitude but never in facts. It is the highest-value, lowest-risk place to use AI in a SOC, because writing up what happened is drafting, and drafting is exactly what models are for. The judgement already happened; you are formatting it.</p>" +
    "<p>Two disciplines make it safe. First, <b>the model may not add a fact the timeline does not contain</b> — every sentence traces to a timeline entry, and a validator enforces it, so the report cannot invent an event to make the story flow. Second, every generated report carries the <b>audit trail from module 05</b>: the prompt, the model, its version, the human reviewer, and a timestamp. That boring stamp is what lets an AI-assisted writeup survive an auditor asking how it was produced — which is the difference between a clever tool and one you can actually use at work.</p>",
  dataset: {
    name: "A structured incident timeline — from project 03, or the sample in the guide",
    note:
      "<p><b>Primary: a timeline you already built.</b> Project 03's auth-anomaly hunt produces exactly the entity timeline this project consumes. Feeding your own output in is the neatest way to see the path connect.</p>" +
      "<p><b>Or use the provided sample:</b> step 1 includes a realistic timeline JSON — a phishing-to-lateral-movement incident across email, endpoint and identity logs — with a deliberate gap, so you can see the report state the gap rather than paper over it.</p>" +
      "<p>Everything is local. An incident timeline is among the most sensitive things you hold — named people, internal hosts, business impact — which is exactly why module 05 governs whether any of it may reach a hosted model.</p>",
  },
  glossary: [
    {
      term: "Incident timeline",
      plain:
        "The ordered sequence of what happened during an incident — each entry a timestamped, sourced fact. It is the verified input; the report is a retelling of it for a specific audience.",
    },
    {
      term: "Grounding (here)",
      plain:
        "Every claim in the report must trace to a timeline entry. The model retells the timeline; it does not add to it. A validator checks that nothing in the report lacks a supporting entry.",
    },
    {
      term: "Audit trail",
      plain:
        "The record of how an AI-assisted document was produced — the prompt, model, version, reviewer and timestamp — stored with the output so the decision can be reconstructed and defended later.",
    },
    {
      term: "Altitude",
      plain:
        "How high-level a document is. An executive summary flies high (impact, scope, what was done); a technical writeup flies low (event IDs, hosts, indicators). Same facts, different altitude.",
    },
    {
      term: "Executive summary",
      plain:
        "A short, non-technical account for people who decide things — impact, scope, status, next steps. It omits detail but must never contradict the technical record beneath it.",
    },
  ],
  before: [
    "<b>Module 09</b> — the entity timeline is this project's input.",
    "<b>Module 05</b> — the audit-trail fields are the deliverable, not decoration.",
    "<b>Projects 01 and 04</b> — grounding and (optionally) retrieval of past tickets carry over.",
    "Python 3.11+, Ollama with <code>llama3.1:8b</code>, and <code>pip install jinja2</code> for templating.",
  ],
  steps: [
    {
      title: "Structure the timeline as the single source of truth",
      time: "20 min",
      why: "Both reports are generated from this one object. If a fact is not in the timeline, it must not appear in either report — so the timeline's structure is what makes grounding checkable.",
      body:
        "<p>Represent the incident as a list of timeline entries, each with a timestamp, a source, an actor, an action, and an identifier you can cite. Give each entry a stable id — the reports will reference entries by id, which is how the validator confirms every claim is grounded.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows",
          code: String.raw`mkdir report-writer; cd report-writer
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install ollama pydantic rich jinja2`,
        },
        {
          lang: "python",
          label: "timeline.py — the provided sample, or your project 03 output",
          code: String.raw`import json

# A phishing -> lateral movement incident. Note the gap between E4 and E5:
# no timeline entry explains how the attacker got from the workstation to the
# server. A good report STATES that gap rather than inventing a bridge.
TIMELINE = [
    {"id": "E1", "ts": "2026-08-03T08:14:00Z", "source": "email",
     "actor": "external", "action": "Phishing email delivered to jbell with "
     "a macro-enabled attachment invoice_aug.docm"},
    {"id": "E2", "ts": "2026-08-03T08:31:00Z", "source": "endpoint",
     "actor": "jbell@WKS-4471", "action": "WINWORD.EXE spawned powershell.exe "
     "with an encoded command"},
    {"id": "E3", "ts": "2026-08-03T08:31:20Z", "source": "endpoint",
     "actor": "jbell@WKS-4471", "action": "powershell.exe made an outbound "
     "connection to update-checkin.example (185.220.101.5)"},
    {"id": "E4", "ts": "2026-08-03T08:47:00Z", "source": "endpoint",
     "actor": "jbell@WKS-4471", "action": "New service svhost created from "
     "%APPDATA%, persistence established"},
    {"id": "E5", "ts": "2026-08-03T11:02:00Z", "source": "identity",
     "actor": "jbell", "action": "Successful sign-in to FILESRV-02 from "
     "WKS-4471, first time this account accessed that server"},
    {"id": "E6", "ts": "2026-08-03T11:40:00Z", "source": "endpoint",
     "actor": "SOC", "action": "WKS-4471 isolated by analyst msmith, "
     "account jbell disabled"},
]
json.dump(TIMELINE, open("timeline.json", "w"), indent=2)
print(f"{len(TIMELINE)} timeline entries, ids E1..E{len(TIMELINE)}")`,
        },
      ],
      expect:
        "<p>A <code>timeline.json</code> of ordered, id'd entries. Notice there is no entry explaining the jump from persistence on the workstation (E4) to a sign-in on the file server (E5) — a real gap. The report must name it, not smooth it, and step 4 tests exactly that.</p>",
      expectCode: "6 timeline entries, ids E1..E6",
      fixes: [],
    },
    {
      title: "Generate the technical writeup — grounded, id-cited",
      time: "35 min",
      why: "The technical report is the low-altitude retelling for other analysts. Every claim cites the timeline entry behind it, which makes it both trustworthy and checkable.",
      body:
        "<p>Ask the model to write a technical narrative where every sentence of fact is tagged with the entry id(s) it rests on. The system prompt forbids adding events and requires the model to flag gaps explicitly rather than bridge them with plausible invention.</p>",
      commands: [
        {
          lang: "python",
          label: "report.py — technical writeup with citations",
          code: String.raw`from pydantic import BaseModel, Field
import json, ollama

class Claim(BaseModel):
    text: str = Field(description="One factual sentence")
    entry_ids: list[str] = Field(description="Timeline ids supporting it")

class TechnicalReport(BaseModel):
    summary_line: str
    narrative: list[Claim]
    gaps: list[str] = Field(
        description="What the timeline does NOT explain - state, do not fill")
    indicators: list[str]

timeline = json.load(open("timeline.json"))
SYSTEM = ("You are writing a technical incident writeup. Use ONLY the timeline "
          "entries. Every claim's entry_ids MUST reference real entry ids that "
          "support it. Do NOT invent events, times, or hosts. If the timeline "
          "does not explain a transition, add it to 'gaps' - never bridge a gap "
          "with an assumed event.")

resp = ollama.chat(model="llama3.1:8b",
    format=TechnicalReport.model_json_schema(), options={"temperature": 0},
    messages=[{"role": "system", "content": SYSTEM},
              {"role": "user", "content": json.dumps(timeline)}])
tech = TechnicalReport.model_validate_json(resp["message"]["content"])
print(json.dumps(tech.model_dump(), indent=2))`,
        },
      ],
      expect:
        "<p>A technical report whose claims each cite entry ids, and whose <code>gaps</code> list names the unexplained E4→E5 jump. If the narrative asserts <i>how</i> lateral movement happened when no entry shows it, that is a fabrication the next step catches.</p>",
      fixes: [
        {
          problem: "It invents a plausible bridge for the gap",
          cause: "Narrative models abhor a gap and fill it — 'the attacker likely used stolen credentials' with nothing behind it.",
          fix: "That belongs in <code>gaps</code> as a hypothesis, not in the narrative as a fact. The validator in step 4 flags any claim whose entry_ids do not support it; strengthen 'never bridge a gap' in the prompt too.",
        },
      ],
    },
    {
      title: "Generate the executive summary — same facts, higher altitude",
      time: "25 min",
      why: "Executives need impact and scope, not event IDs. The summary must be readable by a non-technical decision-maker and must never contradict the technical record beneath it.",
      body:
        "<p>Generate the exec summary from the <i>same timeline</i>, not from the technical report — so both derive from the single source of truth and cannot drift apart. Constrain it to impact, scope, current status and recommended next steps, in plain language, and forbid new facts just as strictly.</p>",
      commands: [
        {
          lang: "python",
          label: "report.py — the executive summary",
          code: String.raw`class ExecSummary(BaseModel):
    what_happened: str = Field(description="2-3 plain sentences, no jargon")
    impact: str
    scope: str = Field(description="Who and what was affected")
    status: str = Field(description="Contained / ongoing / resolved")
    next_steps: list[str]
    entry_ids_used: list[str] = Field(
        description="Every timeline id this summary rests on")

SYSTEM_EXEC = ("Write an executive summary for a non-technical leader. Plain "
               "language, no event IDs or tool names. Cover impact, scope, "
               "status, next steps. Use ONLY facts from the timeline; list the "
               "entry ids you relied on. Do not overstate or understate - a "
               "leader will make decisions on this.")

resp = ollama.chat(model="llama3.1:8b",
    format=ExecSummary.model_json_schema(), options={"temperature": 0},
    messages=[{"role": "system", "content": SYSTEM_EXEC},
              {"role": "user", "content": json.dumps(timeline)}])
execs = ExecSummary.model_validate_json(resp["message"]["content"])
print(json.dumps(execs.model_dump(), indent=2))`,
        },
      ],
      expect:
        "<p>A jargon-free summary that a manager could act on — “a finance user opened a phishing attachment; the workstation was isolated and the account disabled within four hours; one server was accessed and is under review”. It should read as the same incident as the technical report, one altitude up.</p>",
      fixes: [
        {
          problem: "The exec summary contradicts the technical report",
          cause: "They were generated from different inputs, or the model rounded a fact differently.",
          fix: "Generate both from the timeline, never one from the other. Step 5 cross-checks that the entry ids used by both are consistent — same facts, different detail, is the invariant.",
        },
      ],
    },
    {
      title: "Validate grounding — no claim without a supporting entry",
      time: "25 min",
      why: "This is the project's control. A report that reads perfectly and contains one invented fact is more dangerous than an obviously rough one, because the invention hides in fluent prose. The validator makes fabrication impossible to ship silently.",
      body:
        "<p>Check that every cited entry id actually exists, and — the stronger test — that the claim's content is genuinely supported by the entries it cites, by confirming key terms from the claim appear in those entries. A claim citing E2 must share substance with E2. Anything ungrounded is flagged and the report is rejected pending correction.</p>",
      commands: [
        {
          lang: "python",
          label: "report.py — the grounding validator",
          code: String.raw`class GroundingError(Exception):
    pass

def index_timeline(tl: list[dict]) -> dict:
    return {e["id"]: (e["action"] + " " + e["actor"]).lower() for e in tl}

def assert_grounded(claims, tl_index: dict) -> None:
    for i, c in enumerate(claims):
        # 1. Every cited id must exist
        for eid in c.entry_ids:
            if eid not in tl_index:
                raise GroundingError(f"claim {i} cites {eid}, which does not exist")
        if not c.entry_ids:
            raise GroundingError(f"claim {i} has NO supporting entry: {c.text!r}")
        # 2. Content check: a distinctive word from the claim should appear
        #    in at least one cited entry (weak but catches free invention)
        supporting = " ".join(tl_index[e] for e in c.entry_ids)
        words = [w for w in c.text.lower().split() if len(w) > 5]
        if words and not any(w in supporting for w in words):
            raise GroundingError(
                f"claim {i} shares no substance with its cited entries - "
                f"possible fabrication: {c.text!r}")

try:
    assert_grounded(tech.narrative, index_timeline(timeline))
    print(f"OK - all {len(tech.narrative)} claims grounded")
except GroundingError as e:
    print(f"REJECTED\n{e}")`,
        },
      ],
      expect:
        "<p>Either confirmation that every claim is grounded, or a rejection naming the unsupported one. The content check is deliberately conservative — it will not catch every subtle paraphrase, but it reliably catches a claim invented whole, which is the failure that matters most in a document someone acts on.</p>",
      expectCode: "OK - all 7 claims grounded",
      fixes: [
        {
          problem: "A legitimate claim is flagged as ungrounded",
          cause: "The claim summarises several entries and shares vocabulary with none of them exactly.",
          fix: "Tune the distinctive-word check, or have the model quote a key phrase from the entry in each claim. Over-flagging is the safe direction — it triggers review, not a bad ship.",
        },
      ],
    },
    {
      title: "Stamp the audit trail — the module 05 record",
      time: "20 min",
      why: "An AI-assisted report without provenance is a liability. The audit trail is what lets you answer 'how was this produced?' months later, in front of an auditor or a regulator. It is the field that makes the whole thing usable at work.",
      body:
        "<p>Attach the module 05 record to every report: the exact prompt (or its versioned reference), the model and its tag, the timestamp, and — critically — the human reviewer who signed off. The model drafts; a named person reviews and owns it. Store the stamp with the report so the two never separate.</p>",
      commands: [
        {
          lang: "python",
          label: "audit.py — provenance stamped on every report",
          code: String.raw`import json, hashlib
from datetime import datetime, timezone

def stamp(report: dict, *, prompt: str, model: str, reviewer: str) -> dict:
    """The module 05 audit record. reviewer is a NAMED human who signed off."""
    return {
        "report": report,
        "audit": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": model,                       # exact tag, e.g. llama3.1:8b
            "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest()[:16],
            "prompt_ref": "prompts/incident-writeup.md@v1",
            "human_reviewer": reviewer,           # not "AI", not blank
            "grounding_validated": True,
        },
    }

final = stamp(tech.model_dump(),
              prompt=SYSTEM, model="llama3.1:8b", reviewer="msmith")
json.dump(final, open("report_A-1002.json", "w"), indent=2)
print(json.dumps(final["audit"], indent=2))`,
        },
      ],
      expect:
        "<p>Every stored report carries a provenance block naming the model, the prompt version, the timestamp, and a human reviewer. The <code>human_reviewer</code> field is the load-bearing one — it records that a person, not the model, owns the report, which is the accountability line the whole path insists on.</p>",
      expectCode: String.raw`{
  "generated_at": "2026-08-03T12:05:00+00:00",
  "model": "llama3.1:8b",
  "prompt_sha256": "a1b2c3d4e5f60718",
  "prompt_ref": "prompts/incident-writeup.md@v1",
  "human_reviewer": "msmith",
  "grounding_validated": true
}`,
      fixes: [
        {
          problem: "It is tempting to auto-fill reviewer with the model name",
          cause: "Convenience — the report was AI-drafted, so why not.",
          fix: "Never. The reviewer must be a human who read and approved it. 'The model wrote it' is not accountability; a named person who checked it against the timeline is. Leave the field empty and block publishing until a human fills it.",
        },
      ],
    },
    {
      title: "Render to Markdown and prove the gap survived",
      time: "20 min",
      why: "The deliverable is a readable document, and the final test is that the honest gap made it all the way through to the rendered report rather than being smoothed away by generation.",
      body:
        "<p>Render both reports and the audit stamp to a single Markdown document with Jinja2. Then read it and confirm the E4→E5 gap is stated plainly in the technical report's gaps section — 'no logged event explains how the account reached FILESRV-02' — rather than replaced by a confident invention. That surviving gap is the sign the grounding discipline held end to end.</p>",
      commands: [
        {
          lang: "python",
          label: "render.py",
          code: String.raw`from jinja2 import Template

TPL = Template("""# Incident Report {{ aid }}

_Generated {{ audit.generated_at }} - model {{ audit.model }} -
reviewed by **{{ audit.human_reviewer }}**_

## Executive summary
{{ execs.what_happened }}

**Impact:** {{ execs.impact }}
**Scope:** {{ execs.scope }}
**Status:** {{ execs.status }}

## Technical narrative
{% for c in tech.narrative %}- {{ c.text }}  _[{{ c.entry_ids | join(", ") }}]_
{% endfor %}

## Known gaps (not inferred)
{% for g in tech.gaps %}- {{ g }}
{% endfor %}

## Indicators
{% for i in tech.indicators %}- {{ i }}
{% endfor %}
""")

md = TPL.render(aid="A-1002", audit=final["audit"], execs=execs, tech=tech)
open("report_A-1002.md", "w", encoding="utf-8").write(md)
print(md[:600])`,
        },
      ],
      expect:
        "<p>A clean Markdown report with the reviewer named at the top, claims tagged with their entry ids, and a “Known gaps” section that honestly states the unexplained lateral-movement step. A report that shows its citations and admits what it does not know is worth more than a seamless one that quietly guessed.</p>",
      fixes: [
        {
          problem: "The gaps section is empty but the timeline clearly has a gap",
          cause: "The model bridged the gap in the narrative instead of listing it.",
          fix: "Re-run step 2 with a stronger gap instruction, and confirm the grounding validator flags the bridging claim. The gap being visible in the final document is the whole point of the exercise.",
        },
      ],
    },
  ],
  after: [
    "Keep a rendered report as a portfolio artefact — with the citations and the gaps section visible. It demonstrates the discipline better than any description: a report that shows its work and admits its limits.",
    "Version the prompts in git and reference them by version in the audit stamp, as module 04 argued. The prompt is part of how the report was produced, so it belongs in the provenance.",
    "Feed a project 03 timeline in and generate a real report from your own hunt output — the two projects connecting is worth showing.",
    "Project 10 measures whether the grounded reports actually contain fewer unsupported claims than an ungrounded baseline — the number that proves the validator earns its place here too.",
  ],
  enterprise: [
    {
      platform: "Microsoft Sentinel + Security Copilot",
      body:
        "<p>Copilot generates incident summaries from Sentinel's own incident data, which grounds them in the platform's record automatically. What it does not give you by default is the explicit gaps section and the versioned audit stamp — so the habits to carry over are to ask 'what does the data not show?' and to record the reviewer alongside the generated summary before it goes anywhere.</p>",
    },
    {
      platform: "Defender XDR incident narratives",
      body:
        "<p>Defender writes an incident narrative automatically — the closest built-in analogue. Treat it as blue-dashed: a strong first draft to review against the raw alerts, not a final report. The grounding instinct you built here — every claim traces to an event — is exactly how you review a Defender narrative before putting your name on it.</p>",
    },
    {
      platform: "ServiceNow / Jira SOAR writeups",
      body:
        "<p>Ticketing platforms increasingly offer AI writeup generation. The transferable requirement is the audit trail: whatever generates the writeup, store the prompt, model and reviewer with the ticket. A regulated environment will ask how an incident record was produced, and 'a human reviewed the AI draft, here is the record' is the answer that holds.</p>",
    },
  ],
  cloudApi:
    "<p>A frontier model writes noticeably better prose and follows the no-new-facts rule more reliably — report writing is where hosted models most clearly outperform local ones. But the incident timeline is among the most sensitive data you hold: named individuals, internal hostnames, business impact, sometimes an ongoing investigation. Module 05 is not optional here. The defensible pattern is to <b>redact the timeline before it leaves</b> — replace names and hostnames with stable tokens (Presidio does this) — generate the report on the redacted version, and re-hydrate the tokens locally. If the incident touches HR, legal, or a regulated determination, keep it entirely local: the <a href=\"/ai-soc-prep/when-not-to-use-ai\">when-not-to-use-AI</a> boundaries apply to the writeup as much as to the decision.</p>",
};
