/** Written content for modules 03, 04 and 05. */
import type { Section } from "../data";

/* -------------------------------------------------------------------------- */
/* 03 — The classical ML you still need                                        */
/* -------------------------------------------------------------------------- */

export const M03_SECTIONS: Section[] = [
  {
    heading: "Two different things are both called AI",
    body: "<p>When a vendor says their SIEM has AI, they usually mean one of two quite different families, and conflating them is how people end up asking a language model to do statistics.</p><p><b>Statistical / classical ML</b> has been in security products for a decade. It scores, ranks and groups. It is deterministic, cheap, explainable to a degree, and it does not invent anything — an anomaly score is a measurement.</p><p><b>Generative models</b> arrived recently. They read and write language. They are expensive, non-deterministic, and they fabricate.</p><p>The practical rule: if the question has a numerical answer, it is almost certainly a classical ML problem, and reaching for an LLM is both worse and more expensive.</p>",
    table: {
      headers: ["Question", "Right tool", "Why"],
      rows: [
        ["Is 340 logons in an hour unusual for this account?", "Statistics", "It is arithmetic against a baseline. A model would guess."],
        ["Which of today's 900 alerts are about the same thing?", "Embeddings / clustering", "Similarity is measurable. No generation needed."],
        ["Is this PowerShell command line malicious?", "Classifier, then LLM", "Score it, then use the model to explain the score in words."],
        ["Summarise this incident for the CISO", "LLM", "Genuinely a language task."],
        ["Did the attacker move laterally?", "Human, evidence-led", "A judgement with consequences. Both tools assist; neither decides."],
      ],
    },
  },
  {
    heading: "Baselining and UEBA, without the acronym",
    body: "<p>User and Entity Behaviour Analytics is a grand name for a simple idea: learn what normal looks like per entity, then flag departures from it. The subtlety that matters is <b>per entity</b> — a global threshold is almost always wrong, because a service account making 4,000 authentications an hour is fine and a finance user doing the same is not.</p><p>The usual approach is a rolling window (say 30 days), a per-entity mean and standard deviation, and a z-score for the current value. It is unglamorous and it works.</p>",
    queries: {
      note: "Per-entity baselining, both dialects. Note the guard against low-volume accounts — a user with three historical logons will produce a huge z-score from one extra, and that is noise, not signal.",
      kql: "let lookback = 30d;\nlet baseline =\n    SecurityEvent\n    | where TimeGenerated between (ago(lookback) .. ago(1d))\n    | where EventID == 4624\n    | summarize daily = count() by TargetUserName, bin(TimeGenerated, 1d)\n    | summarize mean = avg(daily), sd = stdev(daily), days = count()\n           by TargetUserName\n    | where days >= 14 and mean >= 5;   // ignore sparse accounts\nSecurityEvent\n| where TimeGenerated > ago(1d)\n| where EventID == 4624\n| summarize today = count() by TargetUserName\n| join kind=inner baseline on TargetUserName\n| extend z = iff(sd > 0, (today - mean) / sd, 0.0)\n| where z > 3\n| project TargetUserName, today, mean = round(mean, 1), z = round(z, 2)\n| order by z desc",
      spl: "index=main EventCode=4624 earliest=-30d@d latest=@d\n| bin _time span=1d\n| stats count as daily by Account_Name, _time\n| stats avg(daily) as mean, stdev(daily) as sd, count as days\n     by Account_Name\n| where days >= 14 AND mean >= 5\n| join type=inner Account_Name\n    [ search index=main EventCode=4624 earliest=-1d@d\n      | stats count as today by Account_Name ]\n| eval z = if(sd > 0, (today - mean) / sd, 0)\n| where z > 3\n| eval mean = round(mean, 1), z = round(z, 2)\n| table Account_Name, today, mean, z\n| sort - z",
    },
    callout: {
      kind: "review",
      title: "What an interviewer is listening for",
      body: "The guard clause. Anyone can write a z-score; noticing that sparse entities generate garbage scores, and excluding them, is the difference between someone who has read about baselining and someone who has deployed it and been paged by it.",
    },
  },
  {
    heading: "Precision, recall, and why 1% is catastrophic",
    body: "<p>These two numbers decide whether a detection is deployable, and most people can define them but cannot feel them. So do the arithmetic once, properly.</p><p><b>Precision</b> — of the alerts you raised, what share were real? <b>Recall</b> — of the real events, what share did you catch?</p><p>Now take a realistic environment: 100,000 events a day, of which 10 are genuinely malicious. A detection with 99% accuracy sounds excellent. Work it through:</p>",
    table: {
      headers: ["Metric", "Value", "Meaning"],
      rows: [
        ["Events/day", "100,000", "Ordinary mid-size estate"],
        ["True malicious", "10", "What you are hunting"],
        ["False positive rate", "1%", "The “99% accurate” detector"],
        ["False positives/day", "≈1,000", "0.01 × 99,990"],
        ["Precision", "≈1%", "10 real out of ~1,010 alerts"],
        ["Analyst cost", "~100 hours/day", "At 6 minutes per alert"],
      ],
    },
    callout: {
      kind: "warn",
      title: "The base rate is the whole story",
      body: "When the thing you are looking for is rare, even a very low false positive rate produces overwhelming noise, because the FP rate multiplies against the enormous benign population. This is why “our model is 99% accurate” is close to meaningless in security without the base rate alongside it.",
    },
  },
  {
    heading: "The confusion matrix as a cost model",
    body: "<p>Stop reading a confusion matrix as a grid of counts and start reading it as a budget. Each cell has a different price, and the prices are wildly asymmetric.</p>",
    table: {
      headers: ["Cell", "What it is", "What it costs"],
      rows: [
        ["True positive", "Caught a real one", "The analyst time you wanted to spend"],
        ["False positive", "Cried wolf", "6 minutes, plus a slice of the team's trust in the rule"],
        ["True negative", "Correctly ignored", "Nothing"],
        ["False negative", "Missed it", "The incident. Possibly the breach. Unbounded."],
      ],
    },
    callout: {
      kind: "verified",
      title: "How to say this in an interview",
      body: "“I tune toward recall on high-severity detections and toward precision on high-volume ones, because a missed ransomware precursor and a noisy informational rule have completely different costs. The threshold is a business decision, not a statistical one.”",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 04 — Prompt engineering for security work                                   */
/* -------------------------------------------------------------------------- */

export const M04_SECTIONS: Section[] = [
  {
    heading: "Free text is unusable downstream",
    body: "<p>The first thing to unlearn is chatting. A prompt that returns a paragraph is fine for a human reading one alert and useless for anything else — you cannot filter it, count it, route it, or measure it. The moment you want to know “what was our precision last month”, prose is a dead end.</p><p>Everything in a security workflow should return <b>structured, schema-constrained output</b>. Not because JSON is elegant, but because it is the only form you can validate, and validation is the difference between an assistant and a novelty.</p>",
    code: {
      lang: "json",
      label: "The output contract used throughout this path",
      code: "{\n  \"verdict\": \"benign | suspicious | malicious | insufficient_evidence\",\n  \"confidence\": 0.0,\n  \"evidence\": [\n    {\n      \"claim\": \"what you are asserting\",\n      \"source_line\": \"the RAW log line, copied verbatim\",\n      \"field\": \"which field supports it\"\n    }\n  ],\n  \"recommended_next_steps\": [\"...\"],\n  \"unsupported_observations\": [\"anything you suspect but cannot evidence\"]\n}",
    },
    callout: {
      kind: "verified",
      title: "The two fields that do the real work",
      body: "`source_line` forces the model to copy the raw evidence rather than describe it — which makes fabrication visible, because a line that does not appear in the input is instantly checkable. And `unsupported_observations` gives the model somewhere legitimate to put a hunch, so it stops smuggling hunches into `evidence`.",
    },
  },
  {
    heading: "Evidence grounding — a citation for every claim",
    body: "<p>This is the single highest-leverage technique in the module, and it is almost embarrassingly simple: <b>require the model to quote the raw log line behind every statement it makes.</b></p><p>It works for a structural reason rather than a magical one. A claim without a citation is unverifiable in principle. A claim with a citation is checkable in seconds — you search the input for that line, and either it is there or the model invented it. You have converted an open-ended trust problem into a string comparison.</p>",
    code: {
      lang: "text",
      label: "The grounding instruction, close to verbatim",
      code: "For every claim in `evidence`, `source_line` MUST be an exact\nsubstring of the INPUT LOGS block. Do not paraphrase, do not\nreformat, do not correct typos. Copy the line.\n\nIf you cannot support a claim with an exact line, do not make\nthe claim. Put it in `unsupported_observations` instead.\n\nIf fewer than two claims can be evidenced, set verdict to\n`insufficient_evidence` and return an empty `evidence` array.",
    },
    callout: {
      kind: "model",
      title: "And then actually check it",
      body: "The instruction alone is not the control — the model can still ignore it. The control is the ten lines of validation code that assert every `source_line` really is a substring of the input, and reject the response if not. An instruction you do not enforce is a suggestion.",
    },
  },
  {
    heading: "Teaching the model to refuse",
    body: "<p>A model's default behaviour is to answer. Handed three ambiguous log lines it will produce a verdict, because producing a verdict is what the shape of the request implies — not because the evidence supports one.</p><p>You have to make refusal an explicit, named, legitimate outcome. That is what <code>insufficient_evidence</code> is for, and it needs three things to work: a defined trigger condition, a place in the schema, and — critically — a workflow that treats it as a success rather than a failure. If refusing gets the assistant marked down, whoever tunes it will tune the refusal away.</p>",
    callout: {
      kind: "review",
      title: "Measure the refusal rate",
      body: "In project 10 you will track it as a metric in its own right. A triage assistant that never returns insufficient_evidence is not confident — it is miscalibrated, and it is guessing on the hard cases where you most needed it to stop.",
    },
  },
  {
    heading: "Chain-of-thought, and when it is theatre",
    body: "<p>Asking a model to reason step by step genuinely improves multi-step problems: correlating events across sources, working through a timeline, weighing competing explanations.</p><p>It is theatre when the task is really a lookup. “Think step by step about whether this hash is malicious” produces paragraphs of plausible reasoning about a fact the model either knows or does not. You have bought tokens and latency and a more convincing wrapper around a possible fabrication.</p><p>The rule: reason where there is genuinely something to reason <i>about</i>; look up where there is something to look up. Module 02's tool calling is how you tell the difference in practice.</p>",
    callout: {
      kind: "warn",
      title: "Visible reasoning is not verified reasoning",
      body: "A chain of thought that reads convincingly can still reach a wrong conclusion, and its plausibility makes reviewers less likely to check. Treat the reasoning as model output — blue and dashed — exactly like the verdict.",
    },
  },
  {
    heading: "Prompts are detection rules — version them like it",
    body: "<p>A prompt in production has every property of a detection rule. It has a false positive rate. It degrades when the environment changes. It breaks when the underlying model is updated. Someone needs to know why it says what it says, and someone needs to be able to roll it back at 3am.</p><p>Which means it belongs in git, with a version, an owner, a test set and a changelog — not pasted into a chat window and lost.</p>",
    code: {
      lang: "yaml",
      label: "prompts/triage-v3.yml",
      code: "id: triage-alert\nversion: 3\nowner: faisal\nmodel: llama3.1:8b-instruct-q5_K_M\ntemperature: 0\nchanged: |\n  v3 — added unsupported_observations after v2 smuggled\n       unevidenced hunches into evidence[] on 6/50 golden cases\n  v2 — enforced exact-substring source_line\n  v1 — initial\nevaluated_on: golden/alerts-50.jsonl\nmetrics:\n  precision: 0.82\n  recall: 0.78\n  hallucination_rate: 0.06\n  refusal_rate: 0.10\nsystem: |\n  You are a Tier-1 triage assistant. You do not close alerts;\n  you prepare them for an analyst who does...",
    },
    callout: {
      kind: "verified",
      title: "This file is the portfolio artefact",
      body: "A prompt with a version, a changelog explaining what failed in v2, and measured metrics is evidence that you engineer these rather than tinker with them. It is worth more in an interview than the assistant itself.",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 05 — Data handling, governance, and the accountability trail                */
/* -------------------------------------------------------------------------- */

export const M05_SECTIONS: Section[] = [
  {
    heading: "The question that comes before every prompt",
    body: "<p>Before any log reaches any model, one question has to have an answer: <b>what class of data is this, and where is it allowed to go?</b></p><p>Answer it once, as a policy, and encode it as a decision tree your tooling enforces. Answer it per-incident, in the moment, under time pressure, and it will eventually be answered wrongly — and the version that gets answered wrongly is the one that ends up in a breach notification.</p>",
    table: {
      headers: ["Data class", "Examples", "Where it may go"],
      rows: [
        ["Public / synthetic", "Public datasets, sanitised samples, your own lab", "Anywhere, including hosted APIs"],
        ["Internal, non-personal", "Infrastructure logs, hostnames, internal IPs", "Local model, or a hosted API under contract with no training rights"],
        ["Personal data", "Usernames, email, endpoint identifiers tied to a person", "Local model, or redact first"],
        ["Special category / regulated", "Health, biometric, financial account data", "Local only. Usually not at all."],
        ["Credentials and secrets", "Passwords, tokens, keys — even in a log line", "Never. Redact before anything reads it, including your own tooling."],
        ["Case data under legal hold", "Anything in an active matter", "Never. See the boundaries page."],
      ],
    },
    callout: {
      kind: "warn",
      title: "The one people get wrong",
      body: "“It is just an internal hostname, it is not personal data.” Endpoint identifiers are routinely linkable to an individual — WKS-4471 is Jane's laptop and the asset register says so. Linkability is what matters, not whether the field is called “name”.",
    },
  },
  {
    heading: "Redact before inference, not after",
    body: "<p>Redaction has to happen before the data leaves your process. Once a hosted model has received a token, asking it to forget is not a control.</p><p>Presidio is the usual open-source answer: it detects entities, and you replace them with stable placeholders. <b>Stable</b> is the important word — if the same user becomes <code>&lt;PERSON_1&gt;</code> everywhere in the bundle, the model can still reason about “the same account appearing on three hosts”, which is exactly the correlation you needed. Random replacement destroys that.</p>",
    code: {
      lang: "python",
      label: "Consistent pseudonymisation, so correlation survives redaction",
      code: "from presidio_analyzer import AnalyzerEngine\nfrom presidio_anonymizer import AnonymizerEngine\nfrom presidio_anonymizer.entities import OperatorConfig\n\nanalyzer, anonymizer = AnalyzerEngine(), AnonymizerEngine()\n_seen: dict[str, str] = {}\n\ndef stable(entity_type: str):\n    \"\"\"Same input -> same placeholder, so entity resolution still works.\"\"\"\n    def op(value: str) -> str:\n        key = f\"{entity_type}:{value}\"\n        if key not in _seen:\n            _seen[key] = f\"<{entity_type}_{len(_seen) + 1}>\"\n        return _seen[key]\n    return op\n\ndef redact(text: str) -> str:\n    results = analyzer.analyze(\n        text=text, language=\"en\",\n        entities=[\"PERSON\", \"EMAIL_ADDRESS\", \"IP_ADDRESS\", \"CREDIT_CARD\"],\n    )\n    return anonymizer.anonymize(\n        text=text, analyzer_results=results,\n        operators={\n            e: OperatorConfig(\"custom\", {\"lambda\": stable(e)})\n            for e in (\"PERSON\", \"EMAIL_ADDRESS\", \"IP_ADDRESS\", \"CREDIT_CARD\")\n        },\n    ).text",
    },
    callout: {
      kind: "review",
      title: "Do not redact internal IPs reflexively",
      body: "RFC1918 addresses are usually the analytical content of the alert — strip them and you have handed the model a puzzle with the answer removed. Redact public IPs that identify a person, keep the internal topology. This is a judgement call worth writing down as policy rather than making per-alert.",
    },
  },
  {
    heading: "Local versus hosted — the actual decision",
    body: "<p>The default in this path is a local model, and the reason is data handling rather than cost. A local model means the question “did our data leave the building?” has a one-word answer, which is the answer your DPO wants.</p><p>Hosted APIs are better at structured output and reasoning, and for public or synthetic data there is no reason to avoid them. The decision is per data class, not per organisation.</p>",
    table: {
      headers: ["", "Local (Ollama)", "Hosted API"],
      rows: [
        ["Data leaves your network", "No", "Yes"],
        ["Quality on structured output", "Good with a well-chosen model", "Better"],
        ["Cost", "Hardware, once", "Per token, forever"],
        ["Latency", "Depends on your GPU", "Usually lower"],
        ["Available offline / in an incident", "Yes", "Needs the internet you may have just isolated"],
        ["Vendor trains on your data", "N/A", "Read the terms. Then read them again at renewal."],
      ],
    },
    callout: {
      kind: "verified",
      title: "The incident-response argument",
      body: "Worth raising because few candidates think of it: during a serious incident you may deliberately cut internet egress. An assistant that needs a hosted API is unavailable precisely when you need it most. That alone justifies a local fallback.",
    },
  },
  {
    heading: "The accountability trail",
    body: "<p>If AI touched a decision, the record has to show what it touched, what it said, and who checked it. Not because a regulator will definitely ask, but because when they do, reconstructing it afterwards is impossible.</p><p>Log these fields alongside the ticket, every time:</p>",
    code: {
      lang: "json",
      label: "The minimum viable audit record",
      code: "{\n  \"ticket_id\": \"INC-2026-0412\",\n  \"timestamp\": \"2026-07-31T09:14:22Z\",\n  \"model\": \"llama3.1:8b-instruct-q5_K_M\",\n  \"model_sha\": \"sha256:8eeb1c...\",\n  \"prompt_id\": \"triage-alert\",\n  \"prompt_version\": 3,\n  \"temperature\": 0,\n  \"input_redacted\": true,\n  \"redaction_profile\": \"pii-v2\",\n  \"model_output\": { \"verdict\": \"suspicious\", \"confidence\": 0.71 },\n  \"human_reviewer\": \"faisal.khan\",\n  \"human_verdict\": \"benign\",\n  \"human_overrode_model\": true,\n  \"override_reason\": \"Scheduled vulnerability scan, change CHG-8821\"\n}",
    },
    callout: {
      kind: "verified",
      title: "The override fields are the valuable ones",
      body: "`human_overrode_model` and `override_reason` are your disagreement rate — the single best signal of whether the assistant is actually helping. A rising override rate is the earliest warning that a prompt has drifted or a model update has changed behaviour, and you will see it weeks before anyone complains.",
    },
  },
  {
    heading: "Residency, and the questions your DPO will ask",
    body: "<p>Where the inference physically happens is a legal question, not a technical one. Under GDPR, sending personal data to a model hosted outside the adequacy area is a transfer and needs a lawful basis. UAE's PDPL has its own cross-border rules, and sector regulators may add more on top.</p><p>You do not need to be a lawyer. You need to be able to answer these five, because they are what you will be asked:</p><ul><li><b>Where does inference physically run?</b> Which region, which legal entity operates it.</li><li><b>What classes of data can reach it?</b> Point at the decision tree, not at a policy in someone's head.</li><li><b>Does the provider train on our inputs?</b> Quote the contract clause and its date.</li><li><b>What is retained, and for how long?</b> Prompts and outputs are usually retained for abuse monitoring — that is a copy of your data on their disk.</li><li><b>Can we produce the record of an AI-assisted decision?</b> If not, the honest answer is that AI should not be in that workflow yet.</li></ul>",
    callout: {
      kind: "warn",
      title: "“It is only for triage” is not an exemption",
      body: "The obligation attaches to the personal data, not to how important you consider the use case. A triage prompt containing a username and an IP is processing personal data whether or not the output is ever read.",
    },
  },
];
