/**
 * Project 06 — Malware static triage assistant.
 *
 * The lab-safety page is linked prominently and the intro refuses to proceed
 * without it. Everything here is static: hashes, PE structure, strings, CAPA,
 * deobfuscation, YARA drafting — and every AI claim is checked against the
 * deterministic evidence that produced it. Defensive analysis only.
 *
 * Code blocks use String.raw. No backtick inside a String.raw block; where a
 * Markdown backtick must be emitted, chr(96) is used.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p06: ProjectGuide = {
  slug: "malware-static-triage-assistant",
  projectId: 6,
  intro:
    "<p><b>Read the <a href=\"/ai-soc-prep/lab-safety\">lab safety page</a> before you do anything else.</b> This project handles real malware samples, and while every step is static — nothing is executed — the rules there (no-network VM, clean snapshots, password-protected intake) are not optional. If your lab is not built, stop and build it. The rest of this guide assumes it is.</p>" +
    "<p>You are going to build a static triage assistant. It takes a sample, runs the deterministic tools — hashing, PE parsing, strings, CAPA — and uses a local model to turn that mechanical output into an analyst-readable brief and a first-draft YARA rule. The model never touches the raw bytes and never decides anything; it summarises evidence that a tool already proved, and every claim it makes is checked back against that evidence.</p>" +
    "<p>The discipline is the whole point. CAPA finds a capability and cites the address where it found it; the model explains that capability in plain English; and a validator confirms the model's brief did not invent a capability CAPA never reported. Then the YARA rule it drafts is scanned against a goodware corpus before it is called done — because a rule that alerts on Notepad is worse than no rule.</p>",
  dataset: {
    name: "MalwareBazaar (abuse.ch) — real samples, defanged, password 'infected'",
    url: "https://bazaar.abuse.ch/",
    note:
      "<p><b>Source: MalwareBazaar.</b> Free, real samples indexed by hash and family. Download only inside your isolated VM. Every archive uses the password <code>infected</code> so nothing extracts by accident.</p>" +
      "<p><b>Pick a benign-family sample to start</b> — a well-documented commodity loader like a known Emotet or AgentTesla sample — so you can check the assistant's output against public analysis. You are learning the pipeline, not hunting novel threats.</p>" +
      "<p><b>If you do not want live samples yet:</b> step 1 shows how to build the same pipeline against a deliberately-obfuscated but harmless test script and a benign PE (a copy of a System32 binary), which exercises every step without a live sample. Do that first if there is any doubt about your lab.</p>",
  },
  glossary: [
    {
      term: "Static analysis",
      plain:
        "Examining a file without running it — reading its structure, strings and metadata. Safer than dynamic analysis, and the whole of this project. It still requires an isolated environment, because 'reading' a file can trigger handlers you did not intend.",
    },
    {
      term: "PE (Portable Executable)",
      plain:
        "The file format of Windows executables and DLLs. Its headers record when it was compiled, what code sections it has, and which Windows functions it imports — all of which are evidence before anything is run.",
    },
    {
      term: "Entropy",
      plain:
        "A measure of randomness from 0 to 8. A code section near 8.0 is compressed or encrypted, which is the fingerprint of a packer hiding the real payload. High entropy is a clue to unpack, not a verdict of malicious.",
    },
    {
      term: "CAPA",
      plain:
        "A Mandiant tool that maps what a binary can do to a library of capability rules — 'communicates over HTTP', 'persists via registry' — and cites the address where it found each one. Its addressed, structured output is the ideal thing to hand a model.",
    },
    {
      term: "FLOSS",
      plain:
        "An enhanced strings tool that also recovers strings the malware obfuscated or built at runtime, which plain 'strings' misses. Useful because obfuscated strings are often the interesting ones.",
    },
    {
      term: "YARA",
      plain:
        "A rule language for identifying files by their content — strings and byte patterns plus a boolean condition. A YARA rule is only as good as its false-positive rate against legitimate software.",
    },
  ],
  before: [
    "<b>The <a href=\"/ai-soc-prep/lab-safety\">lab safety page</a> read and your lab built.</b> No-network VM, clean snapshot, password-protected intake. This is the prerequisite that is not negotiable.",
    "<b>Module 11 read.</b> This project is that module made executable.",
    "<b>Project 01 finished.</b> The grounding validator returns, pointed at CAPA output.",
    "Inside the VM: Python 3.11+, <code>pip install pefile</code>, CAPA and FLOSS binaries (from the Mandiant releases), Ollama with <code>llama3.1:8b</code>, and the <code>yara</code> CLI.",
  ],
  steps: [
    {
      title: "Confirm the lab, then acquire and identify the sample",
      time: "20 min",
      warn: "Only proceed if your analysis VM has no network adapter and a clean snapshot. Everything below happens inside that VM.",
      why: "The identity of the sample — its hash and true file type — is the first evidence and the key to everything you look up about it. And the extension lies, so you check the real type.",
      body:
        "<p>Inside the isolated VM, extract the sample and establish what it is. The SHA-256 is its name everywhere — VirusTotal, MalwareBazaar, threat reports. Never trust the file extension; read the actual type from the bytes.</p>",
      commands: [
        {
          lang: "bash",
          where: "Inside the analysis VM (no network)",
          code: String.raw`# Archive password is always 'infected'
7z x sample.zip -pinfected

sha256sum suspect.bin
file suspect.bin
#  -> suspect.bin: PE32 executable (GUI) Intel 80386, for MS Windows`,
        },
      ],
      expect:
        "<p>A SHA-256 hash and a confirmed file type. If <code>file</code> reports something other than the extension suggests — a .pdf that is actually a PE — that mismatch is itself a finding worth recording.</p>",
      expectCode: String.raw`suspect.bin: PE32 executable (GUI) Intel 80386, for MS Windows`,
      fixes: [
        {
          problem: "You are unsure the VM is truly isolated",
          cause: "Adapter set to 'disconnected' rather than removed, or a shared folder still mounted.",
          fix: "Go back to the <a href=\"/ai-soc-prep/lab-safety\">lab safety page</a>. Remove the adapter entirely, unmount shared folders, and take a fresh clean snapshot. Isolation you are 'pretty sure' about is not isolation.",
        },
      ],
    },
    {
      title: "Build the deterministic evidence picture",
      time: "35 min",
      why: "This is the ground truth. Every claim the model later makes is checked against this. It is measurement, not inference, so it is trustworthy in a way the model's output is not.",
      body:
        "<p>Parse the PE for its structure, compute per-section entropy, and list the imports. Then run FLOSS for strings, including the obfuscated ones. This produces a structured evidence bundle — the same normalise-before-the-model move as module 08, applied to a binary.</p>",
      commands: [
        {
          lang: "python",
          label: "static.py — the measured picture",
          code: String.raw`import pefile, math, json, subprocess

pe = pefile.PE("suspect.bin")

def entropy(data: bytes) -> float:
    if not data:
        return 0.0
    counts = [data.count(b) for b in range(256)]
    probs = [c / len(data) for c in counts if c]
    return -sum(p * math.log2(p) for p in probs)

sections = [
    {"name": s.Name.rstrip(b"\\x00").decode(errors="replace"),
     "entropy": round(entropy(s.get_data()), 2),
     "packed_hint": entropy(s.get_data()) > 7.2}
    for s in pe.sections
]

imports = []
if hasattr(pe, "DIRECTORY_ENTRY_IMPORT"):
    for dll in pe.DIRECTORY_ENTRY_IMPORT:
        for imp in dll.imports:
            if imp.name:
                imports.append(f"{dll.dll.decode()}:{imp.name.decode()}")

# FLOSS recovers obfuscated strings plain 'strings' misses
floss = subprocess.run(["floss", "-j", "suspect.bin"],
                       capture_output=True, text=True)
strings = json.loads(floss.stdout) if floss.stdout else {}

bundle = {"sections": sections, "imports": imports[:60],
          "notable_strings": []}   # filled from FLOSS output below
json.dump(bundle, open("evidence.json", "w"), indent=2)
print(json.dumps(sections, indent=2))`,
        },
      ],
      expect:
        "<p>A section table with entropy values, an import list, and recovered strings written to <code>evidence.json</code>. A <code>.text</code> section near 7.9 and an import list containing <code>VirtualAlloc</code>, <code>WriteProcessMemory</code> and <code>CreateRemoteThread</code> together is process injection spelled out — note it, but let CAPA confirm it in the next step.</p>",
      expectCode: String.raw`[
  {"name": ".text", "entropy": 6.41, "packed_hint": false},
  {"name": ".rdata", "entropy": 5.02, "packed_hint": false},
  {"name": ".data", "entropy": 7.86, "packed_hint": true}
]`,
      fixes: [
        {
          problem: "pefile raises PEFormatError",
          cause: "The file is not actually a PE, or it is corrupt/truncated.",
          fix: "Re-check <code>file suspect.bin</code>. If it is a script or document rather than a PE, skip PE parsing and go to the deobfuscation step — this pipeline handles both.",
        },
        {
          problem: "floss is not installed or is slow",
          cause: "FLOSS is a separate Mandiant binary and its string recovery is compute-heavy.",
          fix: "Download the FLOSS release and put it on PATH. If it is too slow on your sample, fall back to plain <code>strings -n 8</code> for a first pass; you lose the obfuscated strings but the pipeline still runs.",
        },
      ],
    },
    {
      title: "Run CAPA — capability, addressed and structured",
      time: "20 min",
      why: "CAPA is the input the model is genuinely good at summarising, because every capability it reports comes with the address where it was found. That address is the evidence anchor that makes the model's brief checkable.",
      body:
        "<p>Run CAPA with JSON output. The result is a list of capabilities, each tied to an ATT&CK technique and the address(es) in the binary that triggered the match. This is the structured, addressed evidence you hand the model — not the raw bytes.</p>",
      commands: [
        {
          lang: "bash",
          where: "Inside the analysis VM",
          code: String.raw`capa -j suspect.bin > capa.json

# Peek at what it found (capability names only)
python -c "import json; d=json.load(open('capa.json')); \
print('\n'.join(sorted(r['meta']['name'] for r in d['rules'].values())))" | head -20`,
        },
      ],
      expect:
        "<p>A list of capabilities like “allocate RWX memory”, “create a process”, “persist via Run registry key”, each backed in the JSON by an address. If CAPA finds little, the sample may be packed — which the entropy from step 2 already hinted, and which is itself a finding.</p>",
      expectCode: String.raw`allocate or change RWX memory
communicate over HTTP
contain a resource (.rsrc) section
persist via Run registry key
read and send data to a C2 server`,
      fixes: [
        {
          problem: "CAPA reports almost no capabilities",
          cause: "The sample is packed, so CAPA sees only the unpacking stub, not the real payload.",
          fix: "This is a legitimate result, not a failure. Record 'packed — static capability limited' as the finding. Unpacking is beyond static scope and the honest brief says so rather than inventing capabilities the packer hid.",
        },
      ],
    },
    {
      title: "Summarise into an analyst brief — grounded in CAPA",
      time: "30 min",
      why: "This is where AI adds real value: turning thirty terse capability lines into a paragraph an analyst can act on. The constraint is that it summarises only what CAPA found, with the technique names attached.",
      body:
        "<p>Hand the model the CAPA capabilities (with their ATT&CK tags) and the evidence bundle, and ask for a structured brief: a one-line assessment, the notable capabilities, and the ATT&CK techniques — each citing the CAPA capability it rests on. The model is explicitly forbidden from adding capabilities CAPA did not report.</p>",
      commands: [
        {
          lang: "python",
          label: "brief.py",
          code: String.raw`from pydantic import BaseModel, Field
import json, ollama

class Finding(BaseModel):
    capability: str = Field(description="Copied from CAPA's capability list")
    attack_technique: str
    plain_english: str

class Brief(BaseModel):
    one_line: str
    likely_family_or_type: str
    findings: list[Finding]
    caveats: list[str] = Field(
        description="What static analysis cannot determine here")

capa = json.load(open("capa.json"))
capabilities = sorted(r["meta"]["name"] for r in capa["rules"].values())

SYSTEM = ("You are a malware analyst writing a triage brief. Summarise ONLY "
          "the capabilities listed. Every finding's 'capability' MUST be copied "
          "from the list. Do NOT add capabilities that are not listed. If the "
          "sample looks packed and capabilities are sparse, say so in caveats "
          "rather than guessing what the payload does.")

resp = ollama.chat(
    model="llama3.1:8b",
    format=Brief.model_json_schema(),
    options={"temperature": 0},
    messages=[{"role": "system", "content": SYSTEM},
              {"role": "user",
               "content": "CAPA CAPABILITIES:\n" + "\n".join(capabilities)}],
)
brief = Brief.model_validate_json(resp["message"]["content"])
print(json.dumps(brief.model_dump(), indent=2))`,
        },
      ],
      expect:
        "<p>A readable brief whose every finding names a capability that appears in CAPA's list. A good brief also populates <code>caveats</code> honestly — 'static analysis cannot confirm the C2 domain is live' — which is the model correctly stating its own limits.</p>",
      fixes: [
        {
          problem: "The brief mentions a capability CAPA never reported",
          cause: "The model added general malware knowledge — exactly what the next step catches.",
          fix: "Do not fix in the prompt alone. The validator in step 5 is the enforcement. Strengthening 'ONLY the listed capabilities, NEVER add others' and moving it to the end of the system prompt reduces it.",
        },
      ],
    },
    {
      title: "Validate the brief against CAPA — reject invented capabilities",
      time: "20 min",
      why: "The model's brief is only trustworthy if every capability it cites is one CAPA actually found. This check is the project's grounding gate, identical in spirit to project 01.",
      body:
        "<p>For every finding, confirm its <code>capability</code> string genuinely appears in CAPA's capability list. If it does not, the model invented a capability, and the brief is rejected — not shown with a disclaimer. An invented capability in a malware brief is how a benign file gets escalated or a dangerous one gets a false reassurance.</p>",
      commands: [
        {
          lang: "python",
          label: "brief.py — the grounding gate",
          code: String.raw`class GroundingError(Exception):
    pass

def assert_capabilities_real(brief: Brief, capa_list: list[str]) -> None:
    known = {c.lower() for c in capa_list}
    for i, f in enumerate(brief.findings):
        # Accept an exact match or a clear substring of a real capability
        cap = f.capability.lower()
        if cap not in known and not any(cap in k or k in cap for k in known):
            raise GroundingError(
                f"finding {i} cites capability {f.capability!r}, which CAPA "
                f"did not report. Fabricated - reject the brief."
            )

try:
    assert_capabilities_real(brief, capabilities)
    print(f"OK - {len(brief.findings)} findings all backed by CAPA")
except GroundingError as e:
    print(f"REJECTED\n{e}")`,
        },
      ],
      expect:
        "<p>Either confirmation that every finding is CAPA-backed, or a rejection naming the invented capability. Both outcomes are the validator working. This is what lets you trust the brief enough to put your name on it.</p>",
      expectCode: "OK - 5 findings all backed by CAPA",
      fixes: [
        {
          problem: "A finding is rejected that seems reasonable",
          cause: "The model paraphrased a capability name rather than copying it.",
          fix: "Tighten the prompt to copy capability names verbatim. Do not loosen the matcher to accept paraphrases — the whole value is that the brief's vocabulary maps exactly onto CAPA's evidence.",
        },
      ],
    },
    {
      title: "Deobfuscate any embedded script — and verify the IOCs",
      time: "30 min",
      why: "Where the sample carries an obfuscated script (a macro, a dropper stage), deobfuscation is where the model excels — and where it will occasionally, confidently, mis-decode. So every extracted IOC is verified against the raw bytes.",
      body:
        "<p>If FLOSS or CAPA surfaced an embedded script or a base64 blob, hand it to the model to deobfuscate and explain — analysis only, never execution. Then, for every domain, IP or path it extracts, confirm the value actually appears once you decode the blob yourself. The model proposes; deterministic code disposes.</p>",
      commands: [
        {
          lang: "python",
          label: "verify_iocs.py — prove or kill each extracted IOC",
          code: String.raw`import base64, re

# The raw obfuscated content (from FLOSS, a macro dump, or a strings hit)
raw = open("embedded_script.txt", encoding="utf-8", errors="replace").read()

# Decode base64-looking blobs yourself - reversible arithmetic, no execution
decoded_all = ""
for blob in re.findall(r"[A-Za-z0-9+/]{40,}={0,2}", raw):
    for enc in ("utf-16-le", "utf-8"):
        try:
            decoded_all += base64.b64decode(blob).decode(enc, errors="replace")
        except Exception:
            pass

def verify(ioc: str) -> str:
    # Compare defanged and refanged forms against raw and decoded content
    needle = ioc.replace("[.]", ".").replace("hxxp", "http").lower()
    hay = (raw + decoded_all).lower()
    return "CONFIRMED" if needle in hay else "NOT FOUND - model may have invented it"

for ioc in model_extracted_iocs:      # from the deobfuscation brief
    print(f"{verify(ioc):>32}  {ioc}")`,
        },
      ],
      expect:
        "<p>Each model-claimed IOC marked CONFIRMED (it appears in the raw or self-decoded content) or NOT FOUND (the model invented it — delete that line). This is module 11's verify-it exercise in code: an IOC you cannot reproduce from the bytes is not an IOC.</p>",
      expectCode: String.raw`                       CONFIRMED  hxxps://cdn-update[.]example/gate.php
        NOT FOUND - model may have invented it  185.220.101.5`,
      fixes: [
        {
          problem: "An IOC you believe is real shows NOT FOUND",
          cause: "It was built at runtime by string concatenation, so it never appears whole in the bytes.",
          fix: "This is a genuine limit of static verification, and the honest brief says 'assembled at runtime, not statically confirmable' rather than asserting it. That caveat is a stronger finding than a false certainty.",
        },
      ],
    },
    {
      title: "Draft a YARA rule — then scan it against goodware",
      time: "30 min",
      why: "The rule is not the deliverable; the rule proven clean against legitimate software is. A model has no idea what else on your estate matches the strings it chose, so you check.",
      body:
        "<p>Ask the model to draft a YARA rule from the confirmed strings and the brief. Then — the step that matters — scan the rule against a goodware corpus (System32, a clean software mirror). Any hit on legitimate software is a false positive to fix before the rule is called done.</p>",
      commands: [
        {
          lang: "python",
          label: "Draft the rule (model), then the goodware scan (deterministic)",
          code: String.raw`# 1. Model drafts YARA from CONFIRMED strings only (not invented ones)
DRAFT_SYSTEM = ("Write a YARA rule using ONLY the confirmed strings provided. "
                "Prefer specific, long strings over short generic ones. Include "
                "a meta section with the sha256. Condition should require "
                "several strings, not any single one.")
# ... ollama.chat(...) producing suspect.yar`,
        },
        {
          lang: "bash",
          where: "Inside the analysis VM",
          code: String.raw`# 2. The gate: scan the draft against known-good binaries
yara -r suspect.yar /mnt/goodware/system32/
yara -r suspect.yar /mnt/goodware/program-files/

# 3. Confirm it still matches the sample it was built for
yara suspect.yar suspect.bin
#  -> suspect_bin_loader suspect.bin   (matches its own sample: good)
#  -> (no output from the goodware scans: also good)`,
        },
      ],
      expect:
        "<p>Zero hits against goodware, one hit against the original sample. If the rule fires on a signed Microsoft DLL, it keyed on something too generic — go back and require more, longer, sample-specific strings. A rule that is clean against System32 and still catches its sample is one you could actually deploy.</p>",
      expectCode: String.raw`# goodware scans: (no output - clean)
suspect_bin_loader suspect.bin`,
      fixes: [
        {
          problem: "The rule hits legitimate software",
          cause: "The model chose a short or common string — an API name, a generic error message.",
          fix: "Remove short/common strings, keep the long sample-specific ones, and raise the condition to require several. Re-scan goodware. This tighten-and-rescan loop is the actual craft of writing a deployable YARA rule.",
        },
        {
          problem: "The rule no longer matches its own sample after tightening",
          cause: "You removed too much and the remaining strings are not all present.",
          fix: "Loosen the condition from 'all of them' to 'N of them', keeping the strings specific. Balance is: specific enough to miss goodware, loose enough to catch variants.",
        },
      ],
    },
  ],
  after: [
    "Keep the evidence bundle, the brief, the confirmed IOCs and the goodware-clean YARA rule together — that package is a triage artefact you can show, and it demonstrates the discipline, not just the output.",
    "Write one sentence naming what static analysis could NOT determine about this sample. Knowing your method's blind spot is the senior signal.",
    "Revert the VM snapshot. Every sample, every time — the habit is the safety.",
    "Project 07 picks up where static ends: it takes a dynamic sandbox report and chains it into IOCs, an ATT&CK map and a Sigma rule, and shows how errors compound across that chain.",
  ],
  enterprise: [
    {
      platform: "Microsoft Defender for Endpoint + Security Copilot",
      body:
        "<p>Defender does the detonation and reputation work, and Copilot can summarise the resulting analysis. You lose the addressed, inspectable CAPA evidence you grounded against here — Copilot's summary is harder to verify claim-by-claim. Having built the grounding check is what lets you ask 'show me the evidence for that' rather than accepting the narrative.</p>",
    },
    {
      platform: "CrowdStrike Falcon + Charlotte AI",
      body:
        "<p>Falcon's static and behavioural analysis is strong, and Charlotte narrates it. The transferable discipline is the same: treat the narration as blue-dashed and confirm any specific claim (a capability, a C2) against the underlying detection data before acting on it.</p>",
    },
    {
      platform: "VirusTotal + Intelligence",
      body:
        "<p>VT aggregates engine verdicts, CAPA output, and crowd-sourced YARA in one place, and its AI summaries are improving. The habit to carry over is the goodware check — VT's retrohunt tells you how broadly a YARA rule matches across its corpus, which is the same false-positive question you answered locally against System32.</p>",
    },
  ],
  cloudApi:
    "<p>This is the place on the path where the data-handling rule is sharpest: <b>never send a malware sample, or strings extracted from one, to a hosted API</b> unless you are certain of the provider's handling and the sample is already public. A sample can contain victim data, credentials, and the attacker's own infrastructure. The local model is not a convenience here — it is the correct control. If you want a stronger model for the summarisation step specifically, send it the CAPA capability <i>names</i> only (which are generic technique labels, not sample content), never the bytes, the strings, or the extracted IOCs. Module 05, and the module 11 internal annex on sandbox submission, are the relevant reading.</p>",
};
