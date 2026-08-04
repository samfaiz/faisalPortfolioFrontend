/**
 * Written content for modules 11 and 12 — the Malware Analysis block.
 *
 * Scope note carried on both pages and enforced in the prose: defensive
 * analysis only. Static triage, deobfuscation, sandbox-report interpretation,
 * YARA/Sigma authoring. No sample creation, no offensive tooling, no live
 * detonation outside an isolated lab.
 *
 * The through-line of the whole path is sharpest here, because malware analysis
 * is where a confident-but-wrong model does the most damage: it will describe a
 * function it never understood, name a C2 domain that is a decoy, and summarise
 * a capability the binary does not have. Every AI claim in this block is paired
 * with the independent evidence that confirms or kills it.
 */
import type { Section } from "../data";

/* -------------------------------------------------------------------------- */
/* 11 — Static triage with AI                                                  */
/* -------------------------------------------------------------------------- */

export const M11_SECTIONS: Section[] = [
  {
    heading: "Lab safety, before anything else",
    body: "<p>Static analysis reads a file without running it, which feels safe and mostly is — but “mostly” is doing real work in that sentence. A double-click by reflex, a tool that quietly detonates a sample to inspect it, an archive that auto-extracts and triggers a preview handler: any of these turns a static session into an execution you did not intend. So the environment comes first, and it is not optional.</p><p><b>What isolation means, concretely:</b> a virtual machine with no network adapter attached (not merely disconnected — removed), no shared folders with the host, no clipboard sharing, and a clean snapshot you revert to after every sample. The sample enters the VM as a password-protected archive so nothing on the host ever holds a live, double-clickable copy.</p><p>The full build, with the specific failure each rule prevents, is on the <a href=\"/ai-soc-prep/lab-safety\">lab safety page</a> — read it before you download a single byte.</p>",
    callout: {
      kind: "warn",
      title: "Read this as a hard gate, not advice",
      body: "If you cannot say out loud where the sample is, what can reach the internet, and how you get back to a clean state, stop and fix that before you download a single byte. Project 06 links this section for exactly this reason. Everything downstream assumes the lab is right.",
    },
  },
  {
    heading: "Where the sample comes from, and how to handle it",
    body: "<p>The public source for this path is <b>MalwareBazaar</b> (abuse.ch) — free, real samples, indexed by hash and family. Everything is distributed inside a ZIP with the password <code>infected</code>, which is a convention across the industry precisely so nothing extracts by accident.</p><p>The habit that keeps you safe is to treat the sample as data to be measured, never as a program to be opened. You hash it, you read its bytes, you feed those bytes to tools — but the sample itself is never the thing you click.</p>",
    code: {
      lang: "bash",
      label: "Acquire and identify — inside the VM, network still detached",
      code: "# The archive password is always 'infected'. Extract in the isolated VM only.\n7z x sample.zip -pinfected\n\n# Identify before anything else. The hash is the sample's name everywhere.\nsha256sum suspect.bin\n\n# What does the OS think it is? (do NOT trust the extension)\nfile suspect.bin\n#  -> suspect.bin: PE32 executable (GUI) Intel 80386, for MS Windows",
    },
    callout: {
      kind: "review",
      title: "Reputation lookup is the cheapest first move",
      body: "Paste the SHA-256 into VirusTotal or MalwareBazaar before opening anything. If forty engines already call it Emotet, your job is confirmation and detail, not discovery — and you have saved an hour. If nothing knows it, that is information too: either it is fresh, or it is targeted, and both change how carefully you proceed.",
    },
  },
  {
    heading: "The static picture — what the file is made of",
    body: "<p>Before AI touches anything, you assemble a factual picture from deterministic tools. None of this is inference; it is measurement, and it is the evidence every later AI claim gets checked against.</p><ul><li><b>PE headers</b> — compile timestamp, sections, entry point. A timestamp from 1992 or 2038 is tampering; a section named <code>.text</code> that is writable is packing.</li><li><b>Imports</b> — the Windows API functions the binary asks for. <code>VirtualAlloc</code> + <code>WriteProcessMemory</code> + <code>CreateRemoteThread</code> together is process injection, spelled out in the import table.</li><li><b>Sections and entropy</b> — a section with entropy near 8.0 is compressed or encrypted, which is the signature of a packer hiding the real payload.</li><li><b>Strings</b> — the readable text: URLs, registry keys, error messages, and often the packer's name.</li></ul>",
    code: {
      lang: "python",
      label: "The measured picture, in code you can re-run",
      code: "import pefile, math\n\npe = pefile.PE(\"suspect.bin\")\n\ndef entropy(data: bytes) -> float:\n    if not data:\n        return 0.0\n    counts = [data.count(b) for b in range(256)]\n    probs = [c / len(data) for c in counts if c]\n    return -sum(p * math.log2(p) for p in probs)\n\nprint(\"compiled:\", pe.FILE_HEADER.TimeDateStamp)\nfor s in pe.sections:\n    name = s.Name.rstrip(b\"\\\\x00\").decode(errors=\"replace\")\n    e = entropy(s.get_data())\n    flag = \"  <-- packed?\" if e > 7.2 else \"\"\n    print(f\"{name:8} entropy={e:4.2f}{flag}\")\n\n# Imports: the binary's stated intentions\nif hasattr(pe, \"DIRECTORY_ENTRY_IMPORT\"):\n    for dll in pe.DIRECTORY_ENTRY_IMPORT:\n        funcs = [imp.name.decode() for imp in dll.imports if imp.name]\n        print(dll.dll.decode(), \"->\", \", \".join(funcs[:8]))",
    },
    callout: {
      kind: "warn",
      title: "High entropy is a clue, not a verdict",
      body: "Legitimate installers are packed too — UPX is used by plenty of honest software. Entropy near 8.0 says “the real payload is hidden”, not “this is malicious”. It tells you to unpack before you conclude, nothing more.",
    },
  },
  {
    heading: "CAPA — capability, in structured form the model can summarise",
    body: "<p><b>CAPA</b> (from Mandiant) reads a binary and maps what it can <i>do</i> to a library of rules: “communicates over HTTP”, “persists via registry run key”, “injects into another process”. Its output is structured, evidence-backed, and — crucially — it cites the address in the binary where it found each capability. That citation is what makes CAPA the ideal input to an LLM: the model summarises capabilities that a deterministic tool already proved.</p><p>This is the correct division of labour for the whole block. CAPA establishes the facts with addresses attached; the model turns thirty terse capability lines into an analyst-readable brief. The model is never asked to <i>find</i> the capability — only to explain the one CAPA found.</p>",
    code: {
      lang: "bash",
      label: "CAPA emits JSON — the machine-readable form is the one you feed on",
      code: "# Run CAPA against the sample, JSON output\ncapa -j suspect.bin > capa.json\n\n# The JSON carries, per capability: the ATT&CK technique, the matched rule,\n# and the address(es) in the binary. That address is the evidence anchor.",
    },
    callout: {
      kind: "verified",
      title: "Why this pairing is safe when others are not",
      body: "The model's summary is grounded in CAPA's addressed findings, so every claim it makes can be traced to a specific location the tool identified. Contrast with pasting raw bytes and asking “what does this do?” — there, the model has nothing to be right about and every incentive to sound confident.",
    },
  },
  {
    heading: "Deobfuscation — where models are genuinely excellent",
    body: "<p>This is the one place in malware work where an LLM is not just a summariser but a real accelerator, and it is worth understanding why. Obfuscated PowerShell, JavaScript and VBA are <i>deliberately unreadable</i> — base64 blobs, string reversal, character-code arithmetic, split-and-join tricks — but the obfuscation is mechanical, and unwinding mechanical transformations is exactly what a model trained on millions of scripts does well.</p><p>The workflow: extract the script (from a macro with <code>oletools</code>, from a dropper, from a captured command line), hand it to the model, and ask it to <b>deobfuscate and explain, step by step, without executing anything</b>. What comes back is a readable reconstruction — and then, because this is that path, you verify it.</p>",
    code: {
      lang: "python",
      label: "Extract a macro, then deobfuscate — analysis, never execution",
      code: "from oletools.olevba import VBA_Parser\n\nvba = VBA_Parser(\"invoice.docm\")\nmacro_source = \"\\\\n\".join(code for _, _, _, code in vba.extract_all_macros())\n\nimport ollama\nSYSTEM = (\n    \"You are a malware analyst. Deobfuscate the script below. \"\n    \"Do NOT execute it, describe execution, or emit runnable code. \"\n    \"Return: (1) the decoded intent in plain English, (2) each obfuscation \"\n    \"technique used, (3) every URL, domain, IP and file path, DEFANGED. \"\n    \"For every claim, quote the exact line from the input it came from. \"\n    \"If you cannot decode a section, say so — do not guess.\"\n)\nresp = ollama.chat(model=\"llama3.1:8b\", options={\"temperature\": 0},\n    messages=[{\"role\": \"system\", \"content\": SYSTEM},\n              {\"role\": \"user\", \"content\": macro_source}])\nprint(resp[\"message\"][\"content\"])",
    },
    callout: {
      kind: "model",
      title: "Excellent is not the same as trusted",
      body: "The model will decode a base64 blob correctly nine times and, on the tenth, confidently mis-decode one that used an unusual encoding — and the wrong answer looks exactly as fluent as the right ones. The next section is the discipline that catches the tenth.",
    },
  },
  {
    heading: "Verifying a deobfuscation claim",
    body: "<p>The model says the script decodes a base64 string and beacons to <code>hxxps://evil[.]example/gate</code>. Is that real, or is it a plausible sentence? You can settle it deterministically, without running the sample, because base64 is reversible arithmetic and you can do the same decode yourself.</p><p>The rule: <b>every extracted IOC is confirmed against the raw script before it goes in a report.</b> The model proposes; deterministic code disposes.</p>",
    code: {
      lang: "python",
      label: "Prove or kill the model's claim — no execution required",
      code: "import base64, re\n\n# Pull the base64-looking blobs straight from the raw script\nblobs = re.findall(r\"[A-Za-z0-9+/]{40,}={0,2}\", macro_source)\n\nfor b in blobs:\n    try:\n        decoded = base64.b64decode(b).decode(\"utf-16-le\", errors=\"replace\")\n    except Exception:\n        continue\n    # Does the model's claimed domain actually appear once decoded?\n    if \"evil.example\" in decoded.lower():\n        print(\"CONFIRMED — domain present in decoded payload\")\n    print(decoded[:200])\n\n# If the domain the model named never appears in any decoded blob,\n# the model invented it. Reject that line of the report.",
    },
    callout: {
      kind: "verified",
      title: "This is the verify-it exercise, in code",
      body: "The module closes by asking you to prove or disprove that an obfuscated script exfiltrates to a domain the model named. This is how: decode it yourself and check whether the domain is actually there. A model's IOC that you cannot reproduce from the raw bytes is not an IOC — it is a guess to be deleted.",
    },
  },
  {
    heading: "From behaviour to a YARA rule — and the goodware check that gates it",
    body: "<p>Once you understand what the sample is, you want a detection that catches it and its siblings. YARA is the standard: a rule is a set of strings or byte patterns plus a boolean condition. A model drafts a decent YARA rule quickly, because the format is regular and well represented in training data.</p><p>But a YARA rule is only as good as its false-positive rate, and a model has <i>no idea</i> what else on your estate matches the strings it chose. A rule keyed on a common API sequence or a generic error message will alert on Notepad. So the draft is never the deliverable — the <b>draft tested against a goodware corpus</b> is.</p>",
    code: {
      lang: "bash",
      label: "The rule is not done until it is clean against known-good files",
      code: "# Draft rule from the model, saved as suspect.yar.\n# Now scan a corpus of KNOWN-GOOD binaries: system32, Program Files, a\n# clean software mirror. Any hit here is a false positive you must fix.\nyara -r suspect.yar C:/Windows/System32/\nyara -r suspect.yar \"C:/Program Files/\"\n\n# Zero hits against goodware = the rule is specific enough to consider.\n# One hit against a signed Microsoft binary = go back and tighten it.",
    },
    callout: {
      kind: "review",
      title: "The interview-grade version of this",
      body: "“I used AI to write a YARA rule” is a sentence anyone can say. “I used AI to draft it, then scanned it against System32 and a clean software mirror and rejected it because it hit a signed DLL, then tightened the strings until it was clean” is a process — and it is the difference between a rule you can deploy and one that pages the on-call at 3am over Calculator.",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 12 — Dynamic analysis and AI-assisted reverse engineering                   */
/* -------------------------------------------------------------------------- */

export const M12_SECTIONS: Section[] = [
  {
    heading: "What dynamic analysis is, and where AI belongs in it",
    body: "<p>Static analysis reads the file; <b>dynamic analysis runs it</b> in a controlled environment and watches what it actually does — files written, registry keys set, processes spawned, network connections attempted. It answers questions static cannot, because packed and obfuscated samples reveal their real behaviour only when they execute.</p><p>Running malware is the dangerous part — the <a href=\"/ai-soc-prep/lab-safety\">lab safety rules</a> from module 11 apply here even more strictly — so almost nobody should self-host detonation early. The realistic path for a learner is to read <b>sandbox reports</b> — the structured output a sandbox produces after detonating a sample — and that is where AI earns its place: a sandbox report is long, repetitive, and semi-structured, and turning it into IOCs, an ATT&CK mapping and a draft detection is precisely the summarise-and-extract job models are good at.</p>",
    table: {
      headers: ["Sandbox", "Nature", "The honest note"],
      rows: [
        ["Any.Run", "Interactive, cloud, free tier", "You watch it detonate live in a browser. Best for learning; the free tier makes your submissions public."],
        ["Joe Sandbox", "Deep automated report, commercial", "The most detailed reports in the industry. Overkill for triage, excellent for a hard sample."],
        ["Hybrid Analysis", "Free automated, CrowdStrike-backed", "Good default. Reports are downloadable as JSON, which is what you feed the model."],
        ["CAPE", "Self-hosted, open source", "Full control and privacy, but you are now running malware on your own infrastructure — an isolation problem an order of magnitude harder than module 11's."],
      ],
    },
    callout: {
      kind: "warn",
      title: "Self-hosting detonation is not a beginner move",
      body: "CAPE is the right long-term answer for a real SOC that cannot send samples to a public sandbox. It is the wrong first step, because a misconfigured detonation host is malware with a network. Read reports from a hosted sandbox until your lab discipline is beyond question.",
    },
  },
  {
    heading: "Reading a sandbox report — the shape of it",
    body: "<p>A sandbox report is a record of everything the sample did during detonation, and it is overwhelming on first read: hundreds of file operations, registry writes, API calls, and network events, most of them noise from normal Windows activity. The skill is separating signal from that noise, and it is the skill you are about to delegate part of — carefully.</p><p>The sections that matter for triage: <b>network</b> (contacted domains and IPs — your C2 candidates), <b>dropped files</b> (with hashes — secondary payloads), <b>processes</b> (the execution tree — parent/child lineage), and <b>signatures</b> (the sandbox's own behavioural detections, which are deterministic and trustworthy in a way the model's inferences are not).</p>",
    code: {
      lang: "python",
      label: "Extract the signal deterministically before the model sees it",
      code: "import json\n\nreport = json.load(open(\"hybrid_analysis.json\"))\n\n# Pull the structured facts. This is code, not inference — it is exact.\nnetwork = {h[\"domain\"] for h in report.get(\"hosts\", []) if h.get(\"domain\")}\ndropped = [(f[\"name\"], f[\"sha256\"]) for f in report.get(\"extracted_files\", [])]\nsigs    = [s[\"description\"] for s in report.get(\"signatures\", [])]\n\nbundle = {\n    \"contacted_domains\": sorted(network),\n    \"dropped_files\": dropped,\n    \"sandbox_signatures\": sigs,   # the sandbox's own detections — trustworthy\n}\n# `bundle` is the model's input. It is facts, not raw log — module 08 applied\n# to a sandbox report.",
    },
    callout: {
      kind: "verified",
      title: "Feed the model facts, not the raw report",
      body: "The same lesson as module 08: a normalised bundle of extracted facts is a fraction of the tokens and removes the model's opportunity to hallucinate structure. The sandbox's own signatures are deterministic detections — treat them as green, and treat anything the model adds on top as blue-dashed until checked.",
    },
  },
  {
    heading: "The three-step chain — and where error compounds",
    body: "<p>The valuable AI-assisted workflow here is a chain: <b>report → IOC extraction → ATT&CK mapping → Sigma rule</b>. Each step feeds the next, which is what makes it powerful and also what makes it fragile — an error in step one is inherited, elaborated, and made to look authoritative by steps two and three.</p><p>Concretely: if the model mis-extracts a benign CDN domain as C2 in step one, step two maps it to a Command-and-Control technique, and step three writes a Sigma rule to alert on it. You now have a confident, well-formatted detection for legitimate traffic — and it looks exactly as trustworthy as a correct one. The chain does not just carry the error, it dresses it up.</p>",
    callout: {
      kind: "warn",
      title: "Verify at each hop, not only at the end",
      body: "It is tempting to run all three steps and check the Sigma rule at the end. Do not. By the end the original error is buried under two layers of plausible elaboration and is far harder to spot. Confirm the IOC set against the raw report before mapping; confirm the mapping before drafting. Project 07 builds this chain specifically to make the compounding visible.",
    },
  },
  {
    heading: "The Sigma rule, and the backtest that gates it",
    body: "<p><b>Sigma</b> is YARA's equivalent for log detections: a portable YAML rule that describes a suspicious pattern in event data, which then compiles to KQL, SPL or whatever your SIEM speaks. A model drafts Sigma well for the same reason it drafts YARA well — the format is regular.</p><p>And the gate is the same as module 10's: a drafted rule is a hypothesis until you backtest it against historical data and count what it would have fired on. A rule that alerts 400 times a day is not deployable however elegant, and you learn that for free by backtesting rather than by paging someone.</p>",
    code: {
      lang: "yaml",
      label: "A model-drafted Sigma rule — before the backtest decides its fate",
      code: "title: Suspicious child process from sandbox-observed dropper\nid: 2b9d1e77-0c44-4a1b-9f3e-6d21a8c4e550\nstatus: experimental\nlevel: high\ntags: [attack.execution, attack.t1059.001]\n\ngenerated_by:\n  source: hybrid_analysis.json\n  model: llama3.1:8b\n  reviewed_by: faisal          # a human name, always\n\ndetection:\n  selection:\n    ParentImage|endswith: '\\\\winword.exe'\n    Image|endswith: '\\\\powershell.exe'\n    CommandLine|contains: '-enc'\n  condition: selection\n\nbacktest:\n  window: 30d\n  fires_per_day: null          # <-- MUST be filled before status: production\n  verdict: pending             # not deployable until measured",
    },
    callout: {
      kind: "review",
      title: "status: experimental until the backtest says otherwise",
      body: "Note the rule ships marked experimental with the backtest fields blank. That is the honest state of a freshly generated rule. It becomes production only after 30 days of historical data prove it fires at a rate your analysts can absorb. The blank field is a feature — it makes the missing verification impossible to overlook.",
    },
  },
  {
    heading: "AI on decompiler output — the sharpest failure mode on the path",
    body: "<p>A decompiler like <b>Ghidra</b> turns a compiled binary back into approximate C source. It is invaluable and it is ugly — variables named <code>uVar4</code>, control flow that does not match the original, types the tool guessed. Reading it is slow, and the temptation to paste a function into a model and ask “what does this do?” is enormous.</p><p>This is where models fail most confidently. A model will read decompiled code and produce a fluent, specific, <i>wrong</i> explanation — “this function decrypts the config using RC4” — when the function does no such thing. It pattern-matches on the shape of code it has seen and narrates the most probable story, and decompiler output is exactly ambiguous enough to invite a confident wrong answer.</p>",
    callout: {
      kind: "model",
      title: "The tell to watch for",
      body: "The more specific and confident the summary of decompiled code, the more suspicious you should be. “This appears to loop over a buffer and XOR each byte with a constant” is checkable and probably fine. “This implements AES-256 in CBC mode to decrypt C2 configuration from the .rdata section” is a story — and the constants, the mode, and the section are all things the model may have invented.",
    },
  },
  {
    heading: "The verification discipline — a second independent source, always",
    body: "<p>The rule that makes AI usable on reverse-engineering output: <b>every model claim is confirmed against a second, independent source before it is believed.</b> The model is a hypothesis generator. The confirmation comes from something that cannot share its failure mode.</p>",
    table: {
      headers: ["Model claims…", "Confirm with…", "Because…"],
      rows: [
        ["“It uses RC4 encryption”", "The imports and strings — is a crypto library imported? Is a key scheduling constant present?", "Crypto leaves fingerprints in imports and constants. No fingerprint, no crypto."],
        ["“It beacons to evil.com”", "The sandbox network log and the raw strings", "A real C2 domain appears in the traffic or the binary. If neither shows it, the model invented it."],
        ["“It persists via a run key”", "The sandbox registry operations", "Persistence is an action the sandbox recorded. The report either shows the write or it does not."],
        ["“This function is the main loop”", "The call graph and cross-references in Ghidra", "Structure is verifiable from the disassembly. The model's narrative is not evidence; the xrefs are."],
      ],
    },
    callout: {
      kind: "verified",
      title: "This is the module's verify-it exercise",
      body: "The closing exercise gives you an AI function summary that is wrong and asks you to find the contradicting evidence in the decompiled code. This table is the method: take the specific, checkable claim, find the independent source that would confirm it, and look. When the imports show no crypto and the model claimed RC4, you have caught it — and that instinct, applied every time, is what separates using AI on malware from being misled by it.",
    },
  },
  {
    heading: "When to stop and escalate to a human reverse engineer",
    body: "<p>AI-assisted triage has a ceiling, and knowing where it is protects both you and the analysis. Escalate to a real reverse engineer — a person, not a bigger model — when: the sample is custom rather than a known family, when the decision it feeds is high-consequence (attribution, legal, a board briefing), when the model and your independent checks disagree and you cannot resolve it, or when unpacking has stalled and the interesting behaviour is still hidden.</p><p>The maturity signal is not how far you can push the AI. It is knowing the point past which pushing it is how you produce a confident wrong answer with real consequences — and handing it to someone who can read the assembly directly.</p>",
    callout: {
      kind: "review",
      title: "The honest close to the malware block",
      body: "AI accelerates the first 70% of malware triage — identification, deobfuscation, IOC extraction, first-draft detections. It does not replace the reverse engineer for the last 30%, and a candidate who says so is more credible than one who claims the model does it all. Knowing your own ceiling is the finding.",
    },
  },
];
