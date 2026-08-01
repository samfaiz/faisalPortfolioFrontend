/**
 * Internal annexes, served only behind the shared-password gate.
 *
 * These are deliberately NOT invented specifics about anyone's environment.
 * Writing "our tenant uses X" when nobody told me X would be worse than useless
 * — it would look authoritative and be wrong, which is the exact failure mode
 * the whole path warns about.
 *
 * So each annex is the set of questions that have to be answered for a specific
 * environment, with the answer left blank and marked. Faisal fills them in; the
 * structure is the contribution.
 *
 * Keyed by module number.
 */

export interface Annex {
  heading: string;
  body: string;
}

const TODO =
  '<p class="rounded-md border border-(--ai-review) bg-(--ai-review)/10 px-3 py-2 font-mono text-[12px] text-(--ai-review)">TO FILL IN — this is a template, not an answer.</p>';

export const ANNEXES: Record<number, Annex[]> = {
  1: [
    {
      heading: "Our four accountability lines, named",
      body:
        "<p>The public module lists verdict ownership, escalation, containment and legal hold as the four decisions a model must not make. For our environment, each needs a <b>named owner</b> and a documented threshold, otherwise the principle is decorative.</p><ul><li><b>Verdict ownership</b> — who can close an alert, and at which severity does closure need a second pair of eyes?</li><li><b>Escalation</b> — who is woken, at what threshold, and via which channel out of hours?</li><li><b>Containment authority</b> — who may isolate a host or disable an account without prior approval, and what is the standing exception list (domain controllers, EPOS, anything customer-facing)?</li><li><b>Legal hold</b> — who declares one, and what is the immediate stop-work instruction to the SOC?</li></ul>" +
        TODO,
    },
    {
      heading: "Our current alert volume and per-alert cost",
      body:
        "<p>The public module does the fatigue arithmetic with round numbers. Redo it with ours — the conclusion may be different, and if the queue is short then summarisation is worth far less to us than deduplication.</p><ul><li>Alerts/day, by severity</li><li>Median minutes to triage, by severity</li><li>What fraction close as benign without action — the honest ceiling on what automation could save</li><li>Top three alert sources by volume, which is where tuning beats AI</li></ul>" +
        TODO,
    },
  ],

  2: [
    {
      heading: "Which local model we standardise on, and why",
      body:
        "<p>The public module stays vendor-neutral. Internally we should pick one and stop re-litigating it. Record the decision and the evidence:</p><ul><li>Model and quantisation, with the exact tag</li><li>Hardware it runs on, and the tokens/sec measured — not the marketing figure</li><li>Structured-output reliability on our own golden set (see project 10)</li><li>What we tried and rejected, so nobody re-tries it in six months</li></ul>" +
        TODO,
    },
    {
      heading: "Context budget for our actual events",
      body:
        "<p>Token counts for the log sources we genuinely run, measured rather than estimated. This decides how many events fit in one triage bundle, which is the single most load-bearing number in the assistant design.</p><ul><li>Raw vs normalised token count per source</li><li>Events per bundle at our chosen context window</li><li>Where we truncate, and what we lose when we do</li></ul>" +
        TODO,
    },
  ],

  3: [
    {
      heading: "What our SIEM's anomaly scores actually mean",
      body:
        "<p>Every platform has an opaque score. Before trusting one in a workflow, we need to know what it is computing — and the vendor documentation is usually vague enough that this needs testing rather than reading.</p><ul><li>Which scores appear in our alerts, and their ranges</li><li>What the vendor says the algorithm is</li><li>What we observed when we tested it against known-benign spikes</li><li>Score thresholds we actually act on, and how they were chosen</li></ul>" +
        TODO,
    },
    {
      heading: "Our real base rate",
      body:
        "<p>The public module uses 10 malicious in 100,000. Ours will be different, and the base rate is what decides whether a given false-positive rate is survivable. Compute it from the last quarter of closed tickets.</p>" +
        TODO,
    },
  ],

  4: [
    {
      heading: "Where our prompts live and who reviews them",
      body:
        "<p>The public module argues prompts are detection rules. Internally that needs an actual home and an actual process:</p><ul><li>Repository and path</li><li>Who reviews a prompt change, and against what checklist</li><li>The golden set a change must be evaluated against before merge</li><li>Rollback procedure, and who can execute it out of hours</li></ul>" +
        TODO,
    },
  ],

  5: [
    {
      heading: "Our data classification, mapped to the decision tree",
      body:
        "<p>The public module gives a generic tree. Ours must name the actual systems and the actual classes, because the generic version will not survive a DPO conversation.</p><ul><li>Log sources, each mapped to a data class</li><li>Which may reach a hosted model, under which contract, and the clause reference</li><li>Which are local-only</li><li>Which are never sent, to anything, including internal tooling</li></ul>" +
        TODO,
    },
    {
      heading: "The five DPO answers, written down",
      body:
        "<p>Where inference runs, what can reach it, whether the provider trains on inputs, what is retained and for how long, and whether we can produce the record of an AI-assisted decision. Written once, dated, and re-checked at contract renewal — because the answers change and nobody re-reads the terms.</p>" +
        TODO,
    },
    {
      heading: "Residency position for UAE and EU data",
      body:
        "<p>Our specific position, with the legal basis and who signed it off. The public module explains the shape of the question; this records our answer to it.</p>" +
        TODO,
    },
  ],
};
