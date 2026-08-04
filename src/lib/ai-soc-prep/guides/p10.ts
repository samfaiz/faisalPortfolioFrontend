/**
 * Project 10 — Eval harness (capstone).
 *
 * The differentiator. It converts every earlier project from "I made a chatbot"
 * into "I engineered and measured a system": a labelled golden dataset, a
 * labelling protocol, precision/recall/hallucination measurement, a prompt A/B,
 * a results table, and an honest written account of where the assistant fails.
 * This is the most polished page on the path, deliberately.
 *
 * Code blocks use String.raw. No backtick inside a String.raw block; where a
 * Markdown backtick must be emitted, chr(96) is used.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p10: ProjectGuide = {
  slug: "eval-harness-capstone",
  projectId: 10,
  intro:
    "<p>This is the project nobody builds, which is exactly why it is the one worth building. Everything before it produced an assistant. This produces the <b>measurement of that assistant</b> — precision, recall, and the number that actually matters, the hallucination rate — against a labelled golden dataset, with a prompt A/B to prove a change helped rather than assume it, and an honest written account of where it fails.</p>" +
    "<p>The reason it is the differentiator is a single sentence you will be able to say afterwards. Anyone can claim “I use AI for triage.” Very few can say “I measured mine at 82% precision with a 6% hallucination rate on a 50-alert labelled set, the grounded prompt beat the naive one by nine points, and here is exactly where it still fails.” The first is a claim. The second is engineering, and it is what a hiring manager is actually listening for.</p>" +
    "<p>Give this the time it deserves. The labelling is tedious and it is the point — a golden dataset built carelessly measures nothing. Everything downstream is only as trustworthy as the labels, so the protocol comes first.</p>",
  dataset: {
    name: "A 50-alert golden dataset you build and label — from the earlier projects' data",
    note:
      "<p><b>You build this.</b> Fifty alerts, each with a raw event bundle and a human-assigned ground-truth label. Draw them from the data you already have: EVTX-ATTACK-SAMPLES and your own machine (project 03), phishing samples (project 02), the synthetic events (project 05). A realistic mix is roughly 20% true malicious, 80% benign — because that imbalance is what makes precision and recall behave the way they do in a real SOC.</p>" +
      "<p><b>The labelling protocol is part of the dataset</b>, not a preamble to it. Step 1 gives you the protocol; the labels are only defensible if you followed one.</p>" +
      "<p>All local, all from data you already gathered under the earlier projects' data-handling rules. Nothing new leaves your machine.</p>",
  },
  glossary: [
    {
      term: "Golden dataset",
      plain:
        "A set of examples with trusted, human-assigned correct answers, used to measure a system. 'Golden' means the labels are the reference truth — so building them carefully is the whole foundation.",
    },
    {
      term: "Precision",
      plain:
        "Of the alerts the assistant called malicious, what share actually were. Low precision means false alarms — analyst time wasted on benign alerts the assistant flagged.",
    },
    {
      term: "Recall",
      plain:
        "Of the alerts that actually were malicious, what share the assistant caught. Low recall means misses — real threats the assistant called benign, which is the dangerous failure.",
    },
    {
      term: "Hallucination rate (here)",
      plain:
        "How often the assistant cited evidence that is not actually in the input. Distinct from being wrong about the verdict — a hallucination is inventing the supporting fact, which is the failure this whole path is built to prevent.",
    },
    {
      term: "Prompt A/B",
      plain:
        "Running two prompts against the same golden dataset and comparing their metrics, so you can prove one is better rather than believe it. It is how a prompt change stops being a guess.",
    },
    {
      term: "Confusion matrix",
      plain:
        "The 2x2 table of true/false positives and negatives. Read as a cost model (module 03): each cell has a different price in analyst hours or missed incidents.",
    },
  ],
  before: [
    "<b>The earlier projects.</b> This measures the assistant they built; project 01's grounded triage is the system under test.",
    "<b>Module 03</b> — precision, recall, F1, and the confusion matrix as a cost model.",
    "<b>Module 09</b> — the assistant and its confidence calibration.",
    "Python 3.11+, Ollama, <code>pip install pandas matplotlib</code>, and the patience to label 50 alerts honestly.",
  ],
  steps: [
    {
      title: "Write the labelling protocol before you label anything",
      time: "40 min",
      why: "A golden dataset is only as good as its labelling rules. Decide what each label means, and how you resolve the hard cases, before you start — or your labels drift and the metrics measure nothing.",
      body:
        "<p>Write down, in advance: the exact definition of each label, what evidence is required to assign it, and how you handle an ambiguous alert. Ambiguity is not a nuisance to suppress — it is data. An alert you genuinely cannot label from its bundle alone gets <code>insufficient_evidence</code>, and the assistant is later judged against that too.</p>",
      commands: [
        {
          lang: "python",
          label: "protocol.py — the rules, committed before labelling starts",
          code: String.raw`PROTOCOL = {
    "labels": {
        "malicious": "The bundle contains sufficient evidence of malicious "
                     "activity to justify escalation. You can name the evidence.",
        "benign":    "The bundle shows normal activity, or activity with a "
                     "clear benign explanation you can state.",
        "insufficient_evidence": "You cannot label this from the bundle alone. "
                     "This is a valid, expected label - not a cop-out.",
    },
    "rules": [
        "Label from the BUNDLE ONLY. Do not use outside knowledge of the "
        "sample. The assistant sees only the bundle; so do you.",
        "If two reasonable analysts would disagree, it is insufficient_evidence.",
        "Record a one-line justification for every label. No justification, "
        "no label.",
        "Second-opinion rule: re-label a 10% sample a day later. Disagreements "
        "with your own earlier self are the label-noise floor - measure it.",
    ],
    "target_mix": "~20% malicious, ~80% benign - a realistic SOC base rate",
}
# Commit this file FIRST. The labels that follow are only trustworthy because
# this existed before them.`,
        },
      ],
      expect:
        "<p>A written protocol you commit before touching the data. It feels like bureaucracy and it is the difference between a golden dataset and a pile of opinions. The second-opinion rule in particular gives you a label-noise floor — you cannot expect the assistant to beat your own self-consistency.</p>",
      fixes: [],
    },
    {
      title: "Assemble and label the 50 alerts",
      time: "120 min",
      why: "This is the long, unglamorous heart of the project. Fifty honestly-labelled alerts are worth more than five hundred careless ones, because every metric downstream inherits the label quality.",
      body:
        "<p>Pull 50 alert bundles from your earlier projects' data, aiming for the target mix, and label each against the protocol with a one-line justification. Store them as a single dataset. Include hard cases deliberately — the alerts where you had to think — because those are where the assistant's real behaviour shows.</p>",
      commands: [
        {
          lang: "python",
          label: "build_golden.py",
          code: String.raw`import json

# Each record: the bundle the assistant will see, plus your label + reason.
# Build 50 of these from project 02/03/05 data. Two shown.
golden = [
    {"id": "G01",
     "bundle": {"event": "4688", "parent": "winword.exe",
                "proc": "powershell.exe", "cmd": "powershell -enc SQBFAF..."},
     "label": "malicious",
     "reason": "Office spawning encoded PowerShell; classic maldoc execution"},
    {"id": "G02",
     "bundle": {"event": "4624", "user": "svc-backup", "logon_type": 5,
                "host": "BKP-01", "time": "02:00"},
     "label": "benign",
     "reason": "Service account, logon type 5, scheduled backup window"},
    # ... 48 more, following the protocol, ~10 malicious total
]
json.dump(golden, open("golden.json", "w"), indent=2)

from collections import Counter
mix = Counter(g["label"] for g in golden)
print(f"{len(golden)} alerts labelled: {dict(mix)}")
assert all(g.get("reason") for g in golden), "every label needs a justification"`,
        },
      ],
      expect:
        "<p>A <code>golden.json</code> of 50 labelled alerts with a justification each, roughly matching the target mix. The <code>assert</code> enforces the protocol's no-justification-no-label rule. This file is the most valuable artefact on the whole path — it is what turns opinions about the assistant into measurements.</p>",
      expectCode: "50 alerts labelled: {'benign': 39, 'malicious': 9, 'insufficient_evidence': 2}",
      fixes: [
        {
          problem: "You keep wanting to label from what you know about the sample",
          cause: "You recognise the EVTX sample and know it is malicious, even though the bundle is thin.",
          fix: "Resist it — label from the bundle only, because that is all the assistant gets. If the bundle is thin, the honest label is insufficient_evidence, and the assistant returning that too is correct behaviour, not a miss.",
        },
      ],
    },
    {
      title: "Run the assistant across the golden set",
      time: "30 min",
      why: "Now you generate the assistant's verdicts on all 50, capturing not just the verdict but the cited evidence — because you will measure hallucination against that evidence, not just verdict accuracy.",
      body:
        "<p>Run project 01's grounded triage over every bundle, recording the verdict, the confidence, and the evidence citations. Keep the raw output — the hallucination measurement in step 5 needs the citations, and the calibration analysis needs the confidences.</p>",
      commands: [
        {
          lang: "python",
          label: "run_assistant.py",
          code: String.raw`import json, ollama
from triage import triage_bundle   # your project 01 grounded call

golden = json.load(open("golden.json"))
results = []
for g in golden:
    verdict = triage_bundle(g["bundle"])     # returns verdict, confidence, evidence
    results.append({
        "id": g["id"],
        "truth": g["label"],
        "pred": verdict["verdict"],
        "confidence": verdict["confidence"],
        "evidence": verdict["evidence"],      # list of {claim, source_line}
        "bundle_text": json.dumps(g["bundle"]),
    })
json.dump(results, open("results.json", "w"), indent=2)
print(f"ran assistant over {len(results)} alerts")`,
        },
      ],
      expect:
        "<p>A <code>results.json</code> pairing each alert's truth label with the assistant's prediction, confidence and cited evidence. This is the raw material for every metric that follows. If the assistant errored or returned off-schema output on any alert, that is itself a finding worth recording — reliability is part of the evaluation.</p>",
      fixes: [],
    },
    {
      title: "Compute precision, recall, and the confusion matrix",
      time: "35 min",
      why: "These are the headline numbers, and computing them by hand from the confusion matrix (module 03) means you understand what they say rather than trusting a library's summary.",
      body:
        "<p>Build the confusion matrix treating <code>malicious</code> as the positive class, then compute precision, recall and F1. Read each number as a cost: a false positive is wasted analyst time; a false negative is a missed incident. The matrix is a cost model, not a scorecard.</p>",
      commands: [
        {
          lang: "python",
          label: "metrics.py",
          code: String.raw`import json

results = json.load(open("results.json"))

def confusion(rows, positive="malicious"):
    tp = fp = tn = fn = 0
    for r in rows:
        pred_pos = r["pred"] == positive
        true_pos = r["truth"] == positive
        if pred_pos and true_pos: tp += 1
        elif pred_pos and not true_pos: fp += 1
        elif not pred_pos and not true_pos: tn += 1
        else: fn += 1
    return tp, fp, tn, fn

tp, fp, tn, fn = confusion(results)
precision = tp / (tp + fp) if tp + fp else 0
recall    = tp / (tp + fn) if tp + fn else 0
f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0

print(f"           predicted+   predicted-")
print(f"actual+       {tp:3}         {fn:3}     <- misses (missed incidents)")
print(f"actual-       {fp:3}         {tn:3}     <- false alarms")
print(f"\nprecision {precision:.0%}   recall {recall:.0%}   F1 {f1:.2f}")
print(f"\nRead: {fn} real threats called benign, {fp} benign alerts flagged.")`,
        },
      ],
      expect:
        "<p>A confusion matrix and the three headline metrics. On a grounded 8B assistant against a clean-ish set, precision in the 75–90% range and recall a bit lower is a realistic, honest result. The point is not a high number — it is a defensible one you can explain, including which cell you would most want to improve and why.</p>",
      expectCode: String.raw`           predicted+   predicted-
actual+         8           2     <- misses (missed incidents)
actual-         2          38     <- false alarms

precision 80%   recall 80%   F1 0.80

Read: 2 real threats called benign, 2 benign alerts flagged.`,
      fixes: [
        {
          problem: "Recall looks great but precision is poor (or vice versa)",
          cause: "The assistant is trigger-happy or too cautious — a real, common characteristic.",
          fix: "This is a finding, not a bug. State the trade: a cautious assistant misses less but cries wolf; a conservative one is quiet but lets things through. Which you want depends on the base rate and your analyst capacity — module 03's cost model is the argument.",
        },
      ],
    },
    {
      title: "Measure the hallucination rate — the number that matters most",
      time: "35 min",
      why: "Verdict accuracy is table stakes. The distinctive measurement — the one that proves you understand this path — is how often the assistant cited evidence that is not actually in the input. That is the failure grounding exists to prevent, and now you count it.",
      body:
        "<p>For every citation the assistant made, check whether its <code>source_line</code> is genuinely a substring of the bundle it triaged — the project 01 grounding check, run as a measurement across all 50. The hallucination rate is the share of verdicts containing at least one fabricated citation. This is distinct from getting the verdict wrong; a model can reach the right verdict via invented evidence, and that is still a hallucination.</p>",
      commands: [
        {
          lang: "python",
          label: "hallucination.py",
          code: String.raw`import json

results = json.load(open("results.json"))

def norm(s: str) -> str:
    return " ".join(s.split()).lower()

fabricated_verdicts = 0
total_citations = 0
fabricated_citations = 0

for r in results:
    hay = norm(r["bundle_text"])
    verdict_has_fabrication = False
    for ev in r["evidence"]:
        total_citations += 1
        if norm(ev["source_line"]) not in hay:
            fabricated_citations += 1
            verdict_has_fabrication = True
    if verdict_has_fabrication:
        fabricated_verdicts += 1

hallucination_rate = fabricated_verdicts / len(results)
citation_error_rate = fabricated_citations / total_citations if total_citations else 0

print(f"verdicts with >=1 fabricated citation: "
      f"{fabricated_verdicts}/{len(results)} = {hallucination_rate:.0%}")
print(f"individual citations fabricated:        "
      f"{fabricated_citations}/{total_citations} = {citation_error_rate:.0%}")`,
        },
      ],
      expect:
        "<p>Two rates: the share of verdicts containing any fabricated citation, and the share of individual citations that were invented. A grounded assistant should score low here — that is what the grounding was for — and being able to state the number is the sentence that sets your portfolio apart from every 'I use AI for triage' claim.</p>",
      expectCode: String.raw`verdicts with >=1 fabricated citation: 3/50 = 6%
individual citations fabricated:        4/120 = 3%`,
      fixes: [
        {
          problem: "The hallucination rate is higher than you expected",
          cause: "The model paraphrases evidence rather than quoting it, so the substring check fails.",
          fix: "That is the measurement working. It tells you the grounding prompt needs strengthening (or the model is weak at verbatim quoting) - a real, actionable finding. A high hallucination rate you can see beats a low one you assumed.",
        },
      ],
    },
    {
      title: "Run the prompt A/B — prove a change helped",
      time: "40 min",
      why: "This is where you stop guessing about prompts. Run two versions against the same golden set and compare, so a prompt change is proven better on the metrics rather than believed to be.",
      body:
        "<p>Take two prompts — for example the naive one from project 01 step 5 versus the grounded, schema-constrained one — and run each across all 50 alerts. Compare precision, recall and hallucination rate side by side. The whole value is that the comparison is on identical data, so any difference is the prompt, not the sample.</p>",
      commands: [
        {
          lang: "python",
          label: "ab_test.py",
          code: String.raw`import json

def evaluate(prompt_fn, golden) -> dict:
    rows = [{"truth": g["label"], **prompt_fn(g["bundle"]),
             "bundle_text": json.dumps(g["bundle"])} for g in golden]
    tp, fp, tn, fn = confusion(rows)
    prec = tp / (tp + fp) if tp + fp else 0
    rec  = tp / (tp + fn) if tp + fn else 0
    halluc = sum(any(norm(e["source_line"]) not in norm(r["bundle_text"])
                     for e in r.get("evidence", []))
                 for r in rows) / len(rows)
    return {"precision": prec, "recall": rec, "hallucination": halluc}

golden = json.load(open("golden.json"))
A = evaluate(triage_naive,    golden)   # project 01 step 5, no grounding
B = evaluate(triage_grounded, golden)   # project 01 final, grounded

print(f"{'metric':14}{'A naive':>10}{'B grounded':>12}{'delta':>8}")
for k in ("precision", "recall", "hallucination"):
    d = B[k] - A[k]
    print(f"{k:14}{A[k]:>9.0%}{B[k]:>11.0%}{d:>+8.0%}")`,
        },
      ],
      expect:
        "<p>A side-by-side table. The grounded prompt should show a lower hallucination rate and usually better precision — the concrete, measured payoff of everything this path argued about grounding. A change that does not help is also a valid result; knowing it did not is the point of measuring.</p>",
      expectCode: String.raw`metric          A naive  B grounded   delta
precision            71%         82%     +11%
recall               78%         80%      +2%
hallucination        18%          6%     -12%`,
      fixes: [
        {
          problem: "The grounded prompt is not clearly better",
          cause: "Either the naive prompt was already decent on this set, or the difference is within noise on 50 examples.",
          fix: "State it honestly — 'grounding cut hallucination from 18% to 6% but barely moved precision on this set'. Fifty alerts is small; note the sample size as a limit. An honest null result is more credible than an inflated win.",
        },
      ],
    },
    {
      title: "Produce the results table and the honest failure account",
      time: "40 min",
      why: "The deliverable is not a number, it is a document a hiring manager can read: the metrics, the A/B, and — the part nobody writes — a clear account of where the assistant fails and why. That last section is the whole differentiator.",
      body:
        "<p>Render a one-page results table and write the failure analysis: which alerts the assistant got wrong, what they have in common, and what you would do about it. Be specific — 'it misses low-and-slow logon anomalies because a single bundle lacks the baseline' is worth more than any headline percentage. Optionally plot the confidence calibration to show whether high-confidence verdicts were actually more reliable.</p>",
      commands: [
        {
          lang: "python",
          label: "report_card.py",
          code: String.raw`import json

results = json.load(open("results.json"))
misses = [r for r in results if r["pred"] != r["truth"]]

print("=== ASSISTANT REPORT CARD ===\n")
print(f"golden set:        {len(results)} alerts")
print(f"precision:         82%")
print(f"recall:            80%")
print(f"hallucination:     6%")
print(f"grounded vs naive: hallucination 18% -> 6%\n")

print("=== WHERE IT FAILS (the part that matters) ===")
for r in misses:
    print(f"  {r['id']}: truth={r['truth']} pred={r['pred']} "
          f"conf={r['confidence']}")
# Then, by hand, group the misses and write the honest paragraph:
print("""
Failure pattern: the misses cluster on alerts needing context a single
bundle does not carry - a logon that is only anomalous against this
account's baseline. The assistant sees one event and cannot know it is
unusual. This is a DESIGN limit, not a prompt bug: fixing it needs the
baseline from project 03 fed in as context, which is the next iteration.
""")`,
        },
      ],
      expect:
        "<p>A report card and a written failure analysis that names the pattern behind the misses. This document is the capstone's real output. The sentence you can now say — precision, hallucination rate, what the A/B proved, and exactly where it still fails — is the one that ends the interview in your favour, because it demonstrates you engineered and measured a system rather than wired up a chatbot.</p>",
      expectCode: String.raw`=== ASSISTANT REPORT CARD ===

golden set:        50 alerts
precision:         82%
recall:            80%
hallucination:     6%
grounded vs naive: hallucination 18% -> 6%`,
      fixes: [
        {
          problem: "The failure analysis feels thin — the misses have no pattern",
          cause: "Either the set is too small to show a pattern, or you have not looked hard enough at the wrong ones.",
          fix: "Read every miss in full, including the assistant's reasoning. Patterns are usually there — a shared logon type, a missing-baseline problem, a bundle that was genuinely ambiguous. If there truly is no pattern, that itself is worth stating, alongside a note that 50 alerts limits what you can conclude.",
        },
      ],
    },
  ],
  after: [
    "Publish the golden dataset (with any sensitive data synthesised), the harness, the results table and the failure analysis together. That package IS the portfolio piece — it is the evidence behind the one sentence that sets you apart.",
    "Re-run the harness whenever you change the assistant, a prompt, or the model. A metric with a date is how you catch a regression from a model update before it reaches production.",
    "Measure calibration next: of the verdicts returned at 0.9 confidence, what share were right? Overconfidence is the default, and demonstrating you checked it is a senior signal.",
    "This capstone closes the loop the whole path opened: module 01 promised AI as an evidence-processing layer a human stays accountable for. The harness is how you prove your layer actually works, and how you know its limits well enough to defend them.",
  ],
  enterprise: [
    {
      platform: "Microsoft Security Copilot evaluation",
      body:
        "<p>Microsoft is building evaluation tooling around Copilot, but the discipline you built transfers whatever the vendor ships: a golden set with a labelling protocol, precision/recall/hallucination measured on it, and an A/B before adopting a prompt or promptbook change. The vendor gives you the model; you still owe the measurement, and having built the harness by hand is what lets you judge theirs.</p>",
    },
    {
      platform: "Splunk / Elastic ML model evaluation",
      body:
        "<p>Both platforms have model-evaluation features for their classical ML. The bridge is that a generative assistant deserves the same rigour a supervised classifier gets — a held-out labelled set and reported metrics — and most teams skip it for GenAI precisely because it is newer. Applying classical-ML discipline to the LLM is the whole point of this project.</p>",
    },
    {
      platform: "Promptfoo / LLM eval frameworks",
      body:
        "<p>Open-source eval frameworks (promptfoo, DeepEval and similar) automate the A/B and metric computation you did by hand. Build it by hand once, as here, so you understand what the framework is measuring — then adopt the framework for scale. A metric you cannot compute yourself is one you cannot trust a tool to compute for you.</p>",
    },
  ],
  cloudApi:
    "<p>The harness is model-agnostic, which makes it the natural place to answer the local-vs-hosted question with data instead of opinion: run the same golden set through your local 8B and a frontier API and compare precision, recall and hallucination directly. Often the honest finding is that the local model is close enough on your data to not justify sending alerts off-box — and now you can prove it rather than assert it. The data-handling rule still governs which alerts may leave: build the golden set from synthetic or already-public data if you intend to test hosted models on it, because a golden dataset is, by construction, a curated collection of your most interesting security events — exactly what module 05 says to think hard about before it leaves the network.</p>",
};
