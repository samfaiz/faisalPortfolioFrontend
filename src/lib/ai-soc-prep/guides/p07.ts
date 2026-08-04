/**
 * Project 07 — Sandbox report to Sigma generator.
 *
 * Chains three AI steps — IOC extraction, ATT&CK mapping, Sigma drafting — and
 * makes the error compounding visible by verifying at each hop instead of only
 * at the end. Builds on module 12. Reads sandbox reports; does not detonate
 * anything.
 *
 * Code blocks use String.raw. No backtick inside a String.raw block; where a
 * Markdown backtick must be emitted, chr(96) is used.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p07: ProjectGuide = {
  slug: "sandbox-report-to-sigma",
  projectId: 7,
  intro:
    "<p>You are going to build a chain: a sandbox report goes in, and out come extracted IOCs, an ATT&CK mapping, and a draft Sigma rule — three AI steps, each feeding the next. It is a genuinely useful workflow, and it is also the clearest lesson on the path about <b>error compounding</b>, because an error in step one is inherited, elaborated, and made to look authoritative by steps two and three.</p>" +
    "<p>Concretely: if step one mis-reads a benign CDN domain as C2, step two maps it to a Command-and-Control technique, and step three writes a Sigma rule to alert on legitimate traffic — and the final rule looks exactly as trustworthy as a correct one. So the design principle here is the opposite of convenience: you <b>verify at every hop</b>, not at the end, because by the end the original mistake is buried under two layers of plausible elaboration.</p>" +
    "<p>You are reading a sandbox report, not detonating a sample — but the lab discipline from <a href=\"/ai-soc-prep/lab-safety\">lab safety</a> still applies to any sample you obtained the report from.</p>",
  dataset: {
    name: "A sandbox report JSON — a public Hybrid Analysis / Any.Run report, or the sample in the guide",
    url: "https://www.hybrid-analysis.com/",
    note:
      "<p><b>Source: a public sandbox report.</b> Hybrid Analysis and Any.Run both let you download or view detonation reports for known samples without running anything yourself. Pick a well-documented family so you can check the chain's output against published analysis.</p>" +
      "<p><b>If you prefer not to fetch a live report:</b> step 1 includes a trimmed, realistic sandbox report JSON — contacted hosts, dropped files, registry writes, process tree, sandbox signatures — that exercises the whole chain. It deliberately contains one benign-looking domain among the malicious ones, so the verification steps have something real to catch.</p>" +
      "<p>The report is data about a detonation someone else ran safely. Nothing here executes a sample.</p>",
  },
  glossary: [
    {
      term: "Sandbox report",
      plain:
        "The structured output a sandbox produces after detonating a sample in isolation — every file written, registry key set, process spawned and network connection attempted. It is how you learn a packed sample's real behaviour without running it yourself.",
    },
    {
      term: "IOC (Indicator of Compromise)",
      plain:
        "A concrete artefact that signals the malware — a domain, IP, file hash, registry key, mutex. IOCs are what detections are built from, so extracting the right ones (and only the right ones) is the foundation of the chain.",
    },
    {
      term: "ATT&CK mapping",
      plain:
        "Labelling observed behaviour with MITRE ATT&CK technique IDs (e.g. T1059 for command execution). It gives detections a shared vocabulary and connects them to known adversary tradecraft.",
    },
    {
      term: "Sigma",
      plain:
        "A portable YAML rule format for log detections that compiles to KQL, SPL and other query languages. A model drafts Sigma well because the format is regular; whether the rule is deployable is a separate, measured question.",
    },
    {
      term: "Error compounding",
      plain:
        "In a chain of AI steps, a mistake early on is not just carried forward — it is elaborated and dressed up by later steps until it looks like a confident, well-formatted conclusion. Verifying only at the end hides it.",
    },
  ],
  before: [
    "<b>Module 12 read.</b> This project is that module's report→detection chain, built and instrumented to show the compounding.",
    "<b>Projects 01 and 06 finished.</b> The grounding validator and the extract-then-summarise shape both return.",
    "Python 3.11+, Ollama with <code>llama3.1:8b</code>.",
    "One sandbox report JSON — public, or the sample provided in step 1.",
  ],
  steps: [
    {
      title: "Load the report and extract the facts deterministically",
      time: "25 min",
      why: "Before any AI, pull the structured facts out with code. The sandbox's own signatures and network log are deterministic evidence — the ground truth every later AI step is checked against.",
      body:
        "<p>Parse the report and separate the trustworthy structured facts (contacted hosts, dropped file hashes, registry writes, the sandbox's own signature detections) from anything that needs interpretation. This is module 08 again: give the model facts, not the raw 4,000-line report.</p>",
      commands: [
        {
          lang: "python",
          label: "load.py — includes the sample report if you have none",
          code: String.raw`import json

# A trimmed but realistic report. Note cdn-static.example - it looks like a
# CDN and is the benign decoy the verification steps must catch.
SAMPLE_REPORT = {
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "hosts": [
        {"domain": "update-checkin.example", "ip": "185.220.101.5"},
        {"domain": "cdn-static.example", "ip": "104.18.2.1"},
        {"domain": "", "ip": "45.9.148.99"},
    ],
    "extracted_files": [
        {"name": "svhost.exe", "sha256": "aa11bb22...", "path": "%APPDATA%"},
    ],
    "registry": [
        {"op": "write",
         "key": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\svhost",
         "value": "%APPDATA%\\svhost.exe"},
    ],
    "processes": [
        {"pid": 1200, "name": "suspect.exe", "parent": "explorer.exe"},
        {"pid": 1840, "name": "powershell.exe", "parent": "suspect.exe",
         "cmdline": "powershell -enc SQBFAFgA..."},
    ],
    "signatures": [
        "Writes to the Run registry key for persistence",
        "Spawns PowerShell with an encoded command",
        "Contacts a host with low reputation",
    ],
}

report = SAMPLE_REPORT   # or json.load(open("your_report.json"))

facts = {
    "contacted": [h for h in report["hosts"]],
    "dropped": report["extracted_files"],
    "registry_writes": report["registry"],
    "process_tree": report["processes"],
    "sandbox_signatures": report["signatures"],   # deterministic - trustworthy
}
json.dump(facts, open("facts.json", "w"), indent=2)
print(json.dumps(facts["contacted"], indent=2))`,
        },
      ],
      expect:
        "<p>A <code>facts.json</code> of extracted structured evidence. The three contacted hosts include one that looks like an ordinary CDN — hold that thought; whether the chain correctly excludes it or wrongly flags it as C2 is the entire demonstration of this project.</p>",
      fixes: [
        {
          problem: "Your real report has a different structure",
          cause: "Every sandbox names fields differently (Hybrid Analysis, Any.Run, CAPE all differ).",
          fix: "Adjust the extraction keys to your report's schema. The principle holds: pull the network, dropped-files, registry, process and signatures sections into a flat facts bundle before the model sees anything.",
        },
      ],
    },
    {
      title: "Step 1 of the chain — extract IOCs, and verify them immediately",
      time: "30 min",
      why: "This is where a compounding error is born. If a benign domain gets classified as malicious here, everything downstream inherits it. So you verify this step before running the next one — not after the whole chain.",
      body:
        "<p>Ask the model to classify each contacted host as malicious, suspicious or benign, citing the sandbox signature or reputation reason. Then verify: every host it calls malicious must be traceable to a fact in the report — a low-reputation signature, a connection the process tree confirms. A domain flagged with no supporting fact is the model guessing, and you catch it here.</p>",
      commands: [
        {
          lang: "python",
          label: "chain.py — IOC extraction with an immediate check",
          code: String.raw`from pydantic import BaseModel, Field
from typing import Literal
import json, ollama

class IOC(BaseModel):
    value: str
    kind: Literal["domain", "ip", "hash", "registry", "mutex"]
    assessment: Literal["malicious", "suspicious", "benign"]
    reason: str = Field(description="The report fact supporting this - quote it")

class IOCSet(BaseModel):
    iocs: list[IOC]

facts = json.load(open("facts.json"))
SYSTEM = ("Extract IOCs from the sandbox facts. Assess each. Your 'reason' MUST "
          "reference a specific fact from the report - a signature, a process, "
          "a registry write. A host with NO supporting fact is 'benign'. Do not "
          "assume a domain is malicious because it appears in a malware report.")

resp = ollama.chat(model="llama3.1:8b", format=IOCSet.model_json_schema(),
    options={"temperature": 0},
    messages=[{"role": "system", "content": SYSTEM},
              {"role": "user", "content": json.dumps(facts)}])
ioc_set = IOCSet.model_validate_json(resp["message"]["content"])

# VERIFY NOW, not at the end of the chain:
signatures_text = " ".join(facts["sandbox_signatures"]).lower()
for ioc in ioc_set.iocs:
    if ioc.assessment == "malicious":
        # Is there any report fact that actually supports 'malicious'?
        supported = (ioc.value.lower() in json.dumps(facts).lower()
                     and any(w in signatures_text
                             for w in ["reputation", "c2", "persist", "encoded"]))
        flag = "" if supported else "  <-- UNSUPPORTED: recheck before chaining"
        print(f"{ioc.assessment:10} {ioc.value}{flag}")`,
        },
      ],
      expect:
        "<p>A verdict per host. The low-reputation domain should be malicious with a signature-backed reason; the CDN-looking domain should be benign (no supporting fact). If the model flags the CDN as malicious with no backing fact, the UNSUPPORTED flag fires — and you have caught the seed error before it could compound.</p>",
      expectCode: String.raw`malicious   update-checkin.example
benign      cdn-static.example
malicious   45.9.148.99`,
      fixes: [
        {
          problem: "The CDN domain is flagged malicious and the check does not catch it",
          cause: "The model wrote a plausible-sounding reason that happens to contain a trigger word.",
          fix: "Tighten verification: require the reason to quote an actual signature string verbatim, and check that quote is a substring of the signatures list. A reason the model composed is not evidence; a quoted signature is.",
        },
      ],
    },
    {
      title: "Step 2 — map to ATT&CK, on the verified IOCs only",
      time: "25 min",
      why: "Mapping is only as good as its input. Feeding it the verified IOC set — not the raw model output — is what stops a mislabelled benign domain becoming a C2 technique in the map.",
      body:
        "<p>Pass only the IOCs that survived step 1's verification into the mapping step. Ask for ATT&CK techniques justified by a specific behaviour from the report. Then verify again: each mapped technique must correspond to a real observed behaviour, not a technique the model associates with the family in general.</p>",
      commands: [
        {
          lang: "python",
          label: "chain.py — mapping with a behaviour check",
          code: String.raw`class Mapping(BaseModel):
    technique_id: str = Field(description="ATT&CK ID, e.g. T1059.001")
    technique_name: str
    observed_behaviour: str = Field(
        description="The exact report fact showing this technique - quote it")

class AttackMap(BaseModel):
    mappings: list[Mapping]

verified = [i for i in ioc_set.iocs if i.assessment in ("malicious", "suspicious")]

SYSTEM = ("Map ONLY behaviours actually observed in the report to ATT&CK. Every "
          "mapping's 'observed_behaviour' MUST quote a report fact (a signature "
          "or a process cmdline). Do NOT add techniques the family is 'known "
          "for' but that were not observed here.")

resp = ollama.chat(model="llama3.1:8b", format=AttackMap.model_json_schema(),
    options={"temperature": 0},
    messages=[{"role": "system", "content": SYSTEM},
              {"role": "user", "content": json.dumps(
                  {"verified_iocs": [i.model_dump() for i in verified],
                   "signatures": facts["sandbox_signatures"],
                   "processes": facts["process_tree"]})}])
amap = AttackMap.model_validate_json(resp["message"]["content"])

# VERIFY: each technique's quoted behaviour is really in the report
report_text = json.dumps(facts).lower()
for m in amap.mappings:
    ok = m.observed_behaviour.lower()[:30] in report_text or \
         any(m.observed_behaviour.lower()[:20] in s.lower()
             for s in facts["sandbox_signatures"])
    print(f"{m.technique_id} {m.technique_name}"
          f"{'' if ok else '  <-- behaviour not in report'}")`,
        },
      ],
      expect:
        "<p>A short ATT&CK map — Persistence (Run key), Command and Scripting Interpreter (encoded PowerShell), likely a C2 technique for the low-reputation host. Each should trace to a signature or a process cmdline. A technique with no observed behaviour behind it is the compounding you are hunting; the check flags it.</p>",
      expectCode: String.raw`T1547.001 Registry Run Keys / Startup Folder
T1059.001 Command and Scripting Interpreter: PowerShell
T1071.001 Application Layer Protocol: Web`,
      fixes: [
        {
          problem: "It maps a technique the family is famous for but that is not in this report",
          cause: "The model reached for training knowledge about the family instead of the observed facts.",
          fix: "This is textbook compounding. The behaviour check catches it — drop any mapping whose quoted behaviour is not in the report. State in the output that the map reflects <i>this detonation</i>, not the family's full repertoire.",
        },
      ],
    },
    {
      title: "Step 3 — draft the Sigma rule from the verified map",
      time: "25 min",
      why: "The final step is only trustworthy because the two before it were verified. Now the model drafts a rule from behaviours you have confirmed were actually observed — so the rule targets real activity, not an inherited mistake.",
      body:
        "<p>Ask the model to draft a Sigma rule keyed on the strongest verified behaviours — the encoded PowerShell under a suspicious parent, the Run-key persistence. Require the standard Sigma structure and mark it <code>experimental</code> with the backtest fields blank, exactly as module 12 insists.</p>",
      commands: [
        {
          lang: "python",
          label: "chain.py — Sigma drafting, experimental by default",
          code: String.raw`DRAFT = ("Draft a Sigma rule from the verified ATT&CK map and observed "
         "behaviours. Use standard Sigma fields. Key on the STRONGEST observed "
         "behaviour. Set status: experimental and leave backtest fires_per_day "
         "blank - it is not deployable until measured. Include the tags from the "
         "verified map only.")

resp = ollama.chat(model="llama3.1:8b", options={"temperature": 0},
    messages=[{"role": "system", "content": DRAFT},
              {"role": "user", "content": json.dumps(
                  {"map": [m.model_dump() for m in amap.mappings],
                   "processes": facts["process_tree"]})}])
print(resp["message"]["content"])`,
        },
      ],
      expect:
        "<p>A Sigma rule in YAML, marked <code>status: experimental</code>, tagged with the verified techniques, keyed on the encoded-PowerShell-under-suspicious-parent behaviour. Because you verified each hop, this rule targets activity the report actually showed — not a benign CDN the chain might otherwise have enshrined in a detection.</p>",
      expectCode: String.raw`title: Encoded PowerShell spawned by non-shell parent (sandbox-derived)
status: experimental
tags: [attack.t1059.001, attack.t1547.001]
detection:
  selection:
    ParentImage|endswith: '\\suspect.exe'
    Image|endswith: '\\powershell.exe'
    CommandLine|contains: '-enc'
  condition: selection
backtest:
  fires_per_day: null   # MUST measure before status: production`,
      fixes: [
        {
          problem: "The rule keys on the domain instead of the behaviour",
          cause: "Domain-based rules are brittle — the attacker rotates infrastructure daily.",
          fix: "Prefer behavioural conditions (process lineage, command patterns) over IOC-based ones. IOCs age out in days; behaviour is durable. Steer the draft toward the process tree, not the host list.",
        },
      ],
    },
    {
      title: "Backtest the rule — the gate before it is anything but experimental",
      time: "25 min",
      why: "Module 12's rule: a drafted Sigma rule is a hypothesis until backtested. A rule that fires 400 times a day is not deployable however well the chain produced it, and you learn that for free rather than by paging someone.",
      body:
        "<p>Run the rule's logic over a window of historical (or synthetic) process events and count fires per day. Apply the same sanity gate as project 05: a rate your analysts can absorb is deployable; anything above your threshold goes back for tuning. Only then does <code>status</code> change from experimental.</p>",
      commands: [
        {
          lang: "python",
          label: "backtest.py",
          code: String.raw`import duckdb, random

con = duckdb.connect()
con.execute("""CREATE TABLE proc (ts TIMESTAMP, parent VARCHAR,
               image VARCHAR, cmdline VARCHAR)""")
# Seed 30 days of mostly-benign process events, a few matching the rule
rows = []
for d in range(30):
    for _ in range(random.randint(0, 3)):   # a few true matches per day
        rows.append((f"2026-07-{d+1:02d} 10:00:00", "suspect.exe",
                     "powershell.exe", "powershell -enc AAA"))
    for _ in range(200):                     # benign noise
        rows.append((f"2026-07-{d+1:02d} 09:00:00", "explorer.exe",
                     "chrome.exe", "chrome.exe"))
con.executemany("INSERT INTO proc VALUES (?,?,?,?)", rows)

fires = con.execute("""
    SELECT count(*) FROM proc
    WHERE image LIKE '%powershell.exe'
      AND cmdline LIKE '%-enc%'
      AND parent LIKE '%suspect.exe'""").fetchone()[0]
per_day = fires / 30
verdict = "deployable" if per_day <= 2 else "tune before enabling"
print(f"fires: {fires} over 30d  ->  {per_day:.1f}/day  ->  {verdict}")`,
        },
      ],
      expect:
        "<p>A fires-per-day figure and a verdict. Under your threshold, you fill the backtest fields and promote the rule out of experimental. Over it, the rule goes back for tuning. Either way the decision is measured, which is the difference between 'I used AI to write a rule' and 'I generated, verified and backtested one'.</p>",
      expectCode: "fires: 51 over 30d  ->  1.7/day  ->  deployable",
      fixes: [
        {
          problem: "Fires per day is enormous",
          cause: "The rule condition is too broad — it matches common legitimate activity.",
          fix: "Add specificity: a narrower parent, a required encoded-command flag, an exclusion for known-good tooling. Re-backtest. This tune-and-remeasure loop is detection engineering, and it is the same gate project 05 applied to generated queries.",
        },
      ],
    },
    {
      title: "Make the compounding visible — run the chain without the checks",
      time: "20 min",
      why: "The lesson lands hardest when you see it fail. Run the chain once with verification removed and watch the benign CDN survive into the final Sigma rule.",
      body:
        "<p>Temporarily skip the verification in steps 2–4 and let each step trust the previous one's raw output. On a report with a benign decoy domain, you will often see it classified as suspicious, mapped to a C2 technique, and baked into the rule — a confident, well-formatted detection for legitimate traffic. Then turn the checks back on and watch it get caught at step 1.</p>",
      commands: [
        {
          lang: "python",
          label: "Contrast the two runs",
          code: String.raw`# UNCHECKED: pass raw model output straight down the chain
iocs_raw = extract_iocs(facts)                 # no verification
amap_raw = map_attack(iocs_raw.iocs)           # trusts everything
rule_raw = draft_sigma(amap_raw)               # inherits any error

# CHECKED: the pipeline you built, verifying each hop
iocs_ok = [i for i in extract_iocs(facts).iocs if supported(i, facts)]
amap_ok = [m for m in map_attack(iocs_ok).mappings if observed(m, facts)]
rule_ok = draft_sigma(amap_ok)

print("UNCHECKED flagged hosts:", [i.value for i in iocs_raw.iocs
                                   if i.assessment != "benign"])
print("CHECKED   flagged hosts:", [i.value for i in iocs_ok])`,
        },
      ],
      expect:
        "<p>The unchecked run often carries the benign CDN all the way into the rule; the checked run drops it at step 1. Seeing the same chain produce a clean rule or a contaminated one depending only on whether you verified each hop is the entire teaching point of the project.</p>",
      expectCode: String.raw`UNCHECKED flagged hosts: ['update-checkin.example', 'cdn-static.example', '45.9.148.99']
CHECKED   flagged hosts: ['update-checkin.example', '45.9.148.99']`,
      fixes: [
        {
          problem: "The unchecked run also excludes the CDN, so there is nothing to show",
          cause: "Your model happened to get step 1 right this time — it is non-deterministic even at temperature 0.",
          fix: "Run it a few times, or make the decoy more tempting (give it a slightly odd path). The point stands regardless: without the checks you are relying on the model being right every hop, and it will not be.",
        },
      ],
    },
  ],
  after: [
    "Keep both chain outputs — checked and unchecked — side by side. That contrast is one of the most compelling things you can show, because it demonstrates you understand why the checks exist, not just that they do.",
    "Write one sentence: which step in your chain is most error-prone, and why. For most people it is step 1, because everything inherits it.",
    "Promote a rule out of experimental only after a real backtest fills the fields. A Sigma rule with blank backtest fields is honest; one marked production with no measurement is not.",
    "Project 09 turns a verified timeline into an incident report; project 10 measures the chain's accuracy end to end — how often a benign IOC survived to the final rule — which is the number that proves the per-hop verification was worth it.",
  ],
  enterprise: [
    {
      platform: "Microsoft Sentinel + Security Copilot",
      body:
        "<p>Copilot can summarise a Defender detonation and suggest analytics rules, compressing this chain into one prompt. The risk is that compression hides the hops — you get a rule without seeing the IOC assessment that produced it. The discipline to carry over is to ask Copilot for the evidence behind each element of the rule and to backtest before enabling, which is the verification you built here made into a review habit.</p>",
    },
    {
      platform: "Any.Run / Joe Sandbox export to Sigma",
      body:
        "<p>Both increasingly offer IOC export and rule suggestions directly from a report. Treat their output as the unchecked chain: a useful first draft that still needs the benign-decoy check and a backtest before it is a detection. The tools generate; you verify and measure.</p>",
    },
    {
      platform: "MISP + threat intel platforms",
      body:
        "<p>MISP stores IOCs and can export detection formats. The transferable point is provenance: an IOC in MISP carries where it came from and how confident the source is, which is the structured version of the per-hop verification you did by hand. Confidence and source travel with the indicator, so a low-confidence extraction does not silently become a high-confidence rule.</p>",
    },
  ],
  cloudApi:
    "<p>A frontier model chains more reliably — fewer benign domains misclassified at step 1, so less to catch downstream. But it does not remove the need for per-hop verification, because 'less often wrong' still compounds when it is wrong. On data handling: a sandbox report can contain the sample's C2 infrastructure and, occasionally, victim artefacts, so treat it like the sample itself — public reports are fine to send, your own detonations of internal samples are not. The module 12 internal annex on sandbox submission is the relevant reading, and the safe default is to run the chain locally.</p>",
};
