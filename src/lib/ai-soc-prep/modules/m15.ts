/**
 * Written content for module 15 — the AI SOC readiness checkpoint.
 *
 * Mirrors the checkpoint modules in the sibling paths: it does not teach new
 * material, it makes you prove you can use what the path taught. The final exam
 * lives on the quiz page (gated behind the 14 module quizzes); this page frames
 * the practical scenario, the self-assessment rubric, and the portfolio
 * checklist that turns the path into an interview answer.
 */
import type { Section } from "../data";

export const M15_SECTIONS: Section[] = [
  {
    heading: "What this checkpoint is for",
    body: "<p>This module teaches nothing new. Its job is to make you <b>demonstrate</b> the one thing the path was built around: that you can build, measure and defend an AI-assisted triage workflow, and explain its limits to a hiring manager. There are three parts — a final exam, a practical scenario, and an honest self-assessment — and then a checklist for turning what you built into a portfolio.</p><p>If you have worked through the modules and projects, none of this should be a stretch. If any part is, it is pointing you at exactly what to revisit — which is the point of a checkpoint.</p>",
    callout: {
      kind: "verified",
      title: "The bar to clear",
      body: "You are ready when you can say, without notes: here is my assistant, here is the golden dataset I measured it on, here is its precision and hallucination rate, and here is exactly where it fails. That sentence is the whole path.",
    },
  },
  {
    heading: "Part 1 — the final exam",
    body: "<p>The 30-question final exam lives on the <a href=\"/ai-soc-prep/quiz\">quiz page</a>, mixed across all fourteen modules, and it is <b>gated</b>: it unlocks only once you have passed each of the fourteen module quizzes at 60% or better. That gate is deliberate — the exam is meant to test retention across the whole path, not to be sat cold.</p><p>Pass mark is 70%. The questions lean on scenario and verification rather than recall, because recall is not what the job needs. If you fall short, the result screen points you at the modules to re-read; the explanations after each answer are the fastest way back.</p>",
    callout: {
      kind: "review",
      title: "Why the exam is gated",
      body: "Sitting a final cold measures your test-taking, not your understanding. Working through the fourteen module quizzes first means the final exam measures what survived — which is the number that actually tells you whether you are ready.",
    },
  },
  {
    heading: "Part 2 — the practical scenario",
    body: "<p>This is the real test, and it is not multiple choice. Take an <b>unlabelled alert bundle</b> — one you have not seen, ideally from a dataset you did not build — and produce a full triage verdict using your own assistant: a verdict, a confidence, evidence with citations you have verified, and a clear statement of what you could not determine.</p><p>Then do the thing the whole path is about: <b>state how you know the model did not make it up</b>. Which citations did you check? What did the grounding validator confirm? Where did you overrule the model, and why? A verdict you cannot defend this way is not finished, however confident the model was.</p>",
    code: {
      lang: "text",
      label: "The self-check every scenario verdict must pass",
      code: "[ ] Verdict, confidence, and evidence[] are all present\n[ ] Every citation is a literal quote from the bundle - I checked\n[ ] I stated what the bundle does NOT let me determine\n[ ] I named at least one point where I did not simply trust the model\n[ ] A colleague could re-run my reasoning from the bundle alone\n[ ] If I could not evidence a verdict, I returned insufficient_evidence",
    },
    callout: {
      kind: "verified",
      title: "This is the interview, rehearsed",
      body: "A hiring manager will hand you an alert and watch how you reason. Doing this scenario until it is second nature means that conversation is a demonstration, not an ambush.",
    },
  },
  {
    heading: "Part 3 — self-assessment across the fourteen modules",
    body: "<p>Rate yourself honestly against the path's spine. For each, the bar is not 'I read it' but 'I could explain it to someone else and act on it'. Anywhere you cannot, the module and its project are where to go back.</p>",
    table: {
      headers: ["Area", "You are ready when you can…"],
      rows: [
        ["Where AI belongs (M1)", "Name the four decisions AI must never own, and defend the accountability line"],
        ["LLM mechanics (M2)", "Explain hallucination as a technical property and why temperature 0 for verdicts"],
        ["Classical ML (M3)", "Compute precision and recall by hand and read the matrix as a cost model"],
        ["Prompting (M4)", "Turn a bad prompt into a grounded, schema-constrained, refusable one"],
        ["Governance (M5)", "Route data through the local / redact / never-send tree and stamp an audit trail"],
        ["Vendor layer (M6)", "Tell a genuine feature from a wrapper with the three questions"],
        ["Build-your-own (M7)", "Stand up the local stack and pass the structured-output gate"],
        ["Normalisation (M8)", "Explain why schema comes before AI, in tokens, attention and correlation"],
        ["Triage assist (M9)", "Describe the six-step loop and why only one step is the model"],
        ["NL→detection (M10)", "Catch an invented field before a generated query runs"],
        ["Static malware (M11)", "Build the lab, ground a brief in CAPA, and goodware-check a YARA rule"],
        ["Dynamic & RE (M12)", "Verify an AI function summary against a second independent source"],
        ["Defending AI (M13)", "Spot an indirect injection and name the control that stops it"],
        ["AI-enabled attacks (M14)", "Build a phishing detection case using no content signal"],
      ],
    },
    callout: {
      kind: "warn",
      title: "Be honest here",
      body: "A generous self-assessment helps nobody. A row you cannot honestly tick is not a failure — it is the single most useful piece of information on this page, because it tells you exactly what to revisit before an interview does it for you.",
    },
  },
  {
    heading: "Part 4 — the portfolio checklist",
    body: "<p>The path is worth little if it stays on your machine. Turn it into evidence a stranger can assess. For each artefact, the rule is the same: publish the thing <i>and</i> the honest account of its limits, because the limits are what prove you understand it.</p><ul><li><b>The eval harness and its results (project 10)</b> — the golden dataset (synthesised if sensitive), the precision/recall/hallucination numbers, the prompt A/B, and the written failure analysis. This is the centrepiece; give it the most polished writeup.</li><li><b>One grounded tool</b> — the phishing analyzer (02) or the triage copilot (04) — with its validator visible, so a reader sees you check the model, not just call it.</li><li><b>The MCP agent (08)</b> — with the injection test and the gate holding, because a demonstrated control beats a described one.</li><li><b>A rendered incident report (09)</b> — showing the citations and the gaps section, which demonstrates the discipline better than prose.</li></ul>",
    callout: {
      kind: "verified",
      title: "The sentence this all builds to",
      body: "\"I measured my triage assistant at 82% precision with a 6% hallucination rate on a 50-alert labelled set, the grounded prompt beat the naive one by nine points, and here is exactly where it still fails.\" Anyone can say they use AI for triage. This is the sentence that gets the job.",
    },
  },
  {
    heading: "Where to go from here",
    body: "<p>You have finished the path. The natural next steps: run the <a href=\"/ai-soc-prep/quiz\">final exam</a> if you have not, publish the portfolio artefacts, and keep the eval harness — re-run it whenever you change a model or a prompt, because a metric with a date is how you catch a regression before production does.</p><p>The two sibling paths connect here too. If you came in without solid L1 fundamentals, <a href=\"/soc-prep\">/soc-prep</a> is the ground this stands on; if your environment is cloud-heavy, <a href=\"/cloud-security-prep\">/cloud-security-prep</a> is the other half. The AI layer sits on top of both.</p>",
  },
];
