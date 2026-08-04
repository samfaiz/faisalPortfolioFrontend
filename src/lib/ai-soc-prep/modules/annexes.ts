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

  6: [
    {
      heading: "What we are already licensed for",
      body:
        "<p>The most common failure here is buying a capability twice. Before evaluating anything, establish what is already paid for and sitting unused — E5 in particular carries a great deal that nobody switched on.</p><ul><li>Every security product on the estate, with tier and renewal date</li><li>Which AI features that tier already includes, switched on or not</li><li>Which are metered separately (Security Compute Units and the like) and what the unit costs</li><li>The gap list — what we would still need to buy after using everything we own</li></ul>" +
        TODO,
    },
    {
      heading: "Our answer to the six questions",
      body:
        "<p>The public module gives six questions to put to any vendor AI feature. Run them against each product we actually run and record the answers, dated, with who gave them. Vendor answers drift between releases and the sales engineer will not volunteer that.</p><ul><li>What model, whose infrastructure?</li><li>Does our data train it?</li><li>What is metered, and what is the unit?</li><li>Deterministic or generative — and what does it do twice on the same input?</li><li>What happens when it is wrong, and who is accountable?</li><li>Can we export what it produced if we leave?</li></ul>" +
        TODO,
    },
  ],

  7: [
    {
      heading: "Our sanctioned toolchain",
      body:
        "<p>The public module gives a runnable local stack. Internally the constraint is what is <i>permitted</i>, which is a different list and usually a shorter one.</p><ul><li>Which model runtimes are approved on managed endpoints, and by whom</li><li>Whether local model weights count as software requiring approval — a real question, and the answer is often yes</li><li>Approved Python distribution and package source (internal mirror or public PyPI)</li><li>Where analysis notebooks may run, and where the outputs may be stored</li><li>Which enrichment APIs we hold keys for, and where those keys live</li></ul>" +
        TODO,
    },
    {
      heading: "Hardware we actually have",
      body:
        "<p>Model sizing is a hardware question before it is a quality question. Record what exists rather than what would be ideal, because the sizing decision follows from it.</p><ul><li>Analyst workstation spec — RAM, and GPU/VRAM if any</li><li>Whether a shared inference box exists, and who administers it</li><li>Measured tokens/sec for the model we standardised on, on that hardware</li><li>The practical ceiling — the largest model that returns a verdict inside the time an analyst will actually wait</li></ul>" +
        TODO,
    },
  ],

  8: [
    {
      heading: "Our field map, source by source",
      body:
        "<p>This is the highest-value annex on the path and the most tedious to produce. Every downstream query, prompt and correlation depends on it, and it cannot be inferred — it has to be written down once.</p><ul><li>Every log source in the SIEM, with its native schema</li><li>Which normalised schema we target (ASIM, ECS, OCSF) — one, not three</li><li>Per source: the mapping for user, host, source IP, destination IP, process, parent process, timestamp</li><li>Sources with no mapping for a given concept, marked explicitly — a blank is information, a guess is a bug</li></ul>" +
        TODO,
    },
    {
      heading: "Measured ingest lag, per source",
      body:
        "<p>Run the lag query in the public module against our own estate and record the result, because “the logs are live” is an assumption that fails during exactly the incidents where it matters.</p><ul><li>p50, p95 and worst-case lag per source, measured on a normal day</li><li>Sources that batch rather than stream, and their batch interval</li><li>Anything above five minutes at p95, with the reason</li><li>What we tell an analyst about how far back “now” actually is</li></ul>" +
        TODO,
    },
    {
      heading: "Our account naming conventions",
      body:
        "<p>Entity resolution needs the local rules, and these are always undocumented tribal knowledge until someone writes them down.</p><ul><li>Service account convention (prefix, suffix, OU)</li><li>Admin account convention, and whether admins hold a separate identity</li><li>Machine account patterns beyond the trailing <code>$</code></li><li>Break-glass accounts, named, and the alert that must fire when they authenticate</li><li>Shared and generic accounts that still exist, with their owners</li></ul>" +
        TODO,
    },
  ],

  9: [
    {
      heading: "Our top ten alert clusters",
      body:
        "<p>Before building anything, know what the queue is actually made of. Run the dedup clustering over 30 days of closed alerts and record the result — it usually shows that two or three rules generate most of the volume, and tuning those beats any assistant.</p><ul><li>The ten largest clusters, with volume and typical disposition</li><li>Which are tuning problems rather than triage problems, named as such</li><li>Median analyst minutes per cluster — where the time actually goes</li><li>The chosen <code>eps</code>, and the two clusters that made us settle on it</li></ul>" +
        TODO,
    },
    {
      heading: "Our human gate, and who staffs it",
      body:
        "<p>The public module lists three properties of a real gate. Ours needs names and thresholds attached.</p><ul><li>Which verdicts may be actioned by an L1, and which require L2 sign-off</li><li>Where the override is recorded, and who reviews the overrides weekly</li><li>The baseline override rate, measured before we trust any trend in it</li><li>What happens out of hours when nobody is at the gate — queue, or degrade to the current process?</li></ul>" +
        TODO,
    },
  ],

  10: [
    {
      heading: "Our schema export, and how it stays current",
      body:
        "<p>Schema grounding is only as good as the schema. A stale export reintroduces exactly the invented-field problem it was there to prevent, and it fails silently.</p><ul><li>The command or job that produces the export, and where the output lives</li><li>Refresh cadence, and what triggers an off-cycle refresh (new source, parser change)</li><li>Tables deliberately excluded, and why</li><li>Who notices when a source is onboarded and the export is not refreshed</li></ul>" +
        TODO,
    },
    {
      heading: "Our deployment gate for generated detections",
      body:
        "<p>The public module proposes a backtest threshold of two fires a day. That number should be ours, derived from what our analysts can absorb, not borrowed.</p><ul><li>The agreed fires-per-day ceiling, and the arithmetic behind it</li><li>Backtest window — 30 days, or longer if our seasonality demands it</li><li>Who reviews a generated rule before it is enabled, and against what checklist</li><li>Where the rule, the prompt, the schema version and the backtest result are stored together</li><li>The kill switch — how a misfiring rule is disabled out of hours, and by whom</li></ul>" +
        TODO,
    },
  ],

  11: [
    {
      heading: "Our malware lab, specified",
      body:
        "<p>The public module gives the principles of isolation. Ours needs the actual build documented, because “isolated VM” means nothing until someone can rebuild it identically and prove it is safe.</p><ul><li>Hypervisor, base image, and where the golden snapshot lives</li><li>How network is removed (adapter detached, host-only, or a controlled INetSim/FakeNet setup) and who verified it</li><li>Sample intake path — where samples land, who may download them, and the storage that is off-limits to everything else</li><li>The revert-after-every-sample rule, and how we know it was followed</li><li>Our MalwareBazaar / VT account terms — what our licence permits us to submit, and what must never leave the estate</li></ul>" +
        TODO,
    },
    {
      heading: "Our YARA goodware corpus",
      body:
        "<p>A YARA rule is only validated against the goodware we actually run. A generic corpus misses the line-of-business software that is our real false-positive risk.</p><ul><li>What is in the corpus — System32, a clean software mirror, and our own LOB binaries</li><li>Where it lives and how it is kept current as software is onboarded</li><li>The pass bar — zero hits, or a reviewed exception list</li><li>Who signs off a rule for deployment after the goodware scan</li></ul>" +
        TODO,
    },
  ],

  12: [
    {
      heading: "Our sandbox decision, and what may be submitted",
      body:
        "<p>Which sandbox we use is a data-governance decision before it is a technical one, because a public sandbox makes the sample — and anything embedded in it — public.</p><ul><li>Sanctioned sandbox(es), and the tier/contract</li><li>What may be submitted to a public sandbox and what may never be (customer data, targeted samples, anything under legal hold)</li><li>Whether we self-host detonation, and if so, who owns the isolation of that host</li><li>Retention — how long reports and extracted files are kept, and where</li></ul>" +
        TODO,
    },
    {
      heading: "Our escalation path to a reverse engineer",
      body:
        "<p>The public module says escalate to a human RE past a point. Ours needs to name that human and that point.</p><ul><li>Who our reverse-engineering escalation is — internal, a retainer, or a vendor</li><li>The triggers that mandate escalation (custom family, attribution, legal, model/verification disagreement)</li><li>What we hand over — sample, hashes, our triage notes, the AI-assisted findings clearly marked as unverified</li><li>Turnaround expectation, and what we do while we wait</li></ul>" +
        TODO,
    },
  ],

  13: [
    {
      heading: "Our LLM application inventory",
      body:
        "<p>You cannot defend LLM apps you do not know exist, and shadow AI is the norm. Before writing a single detection, establish what is deployed.</p><ul><li>Every LLM application on the estate — sanctioned and discovered — with its owner</li><li>Per app: what data it can reach, what tools it can call, and whether any tool has side effects</li><li>Which read attacker-influenceable content (tickets, email, uploads, web) — the indirect-injection surfaces</li><li>What each currently logs, measured against the module's minimum log line</li></ul>" +
        TODO,
    },
    {
      heading: "Our LLM-app detections and the approval gates",
      body:
        "<p>Once the logging exists, the detections and the human gates need naming and ownership.</p><ul><li>The detections we run on LLM-app logs — anomalous tool calls, out-of-scope retrieval, output quoting the system prompt</li><li>Which agent actions require human approval, and who staffs that approval</li><li>The read-only-by-default position, and every documented exception with its justification</li><li>Our ATLAS mapping for the apps that matter, and who maintains it</li></ul>" +
        TODO,
    },
  ],

  14: [
    {
      heading: "Which of our detections still lean on content",
      body:
        "<p>The module says content signals are dead. The uncomfortable annex is auditing our own rules and awareness training for the ones that still depend on them.</p><ul><li>Detection rules keyed on message content, phrasing, or template — the ones to reweight or retire</li><li>Awareness training that still teaches “look for bad grammar” — now actively misleading</li><li>The durable-signal detections we have, and the gaps where we have none</li><li>Our SPF/DKIM/DMARC posture as a detection input, not just a mail-hygiene setting</li></ul>" +
        TODO,
    },
    {
      heading: "Our out-of-band verification controls",
      body:
        "<p>The countermeasure to deepfake fraud is a process control that lives in finance and HR, not in the SOC. Record where it exists, where it does not, and what we alert on.</p><ul><li>The callback / second-approver / cooling-off rules for transfers and sensitive changes, and the thresholds</li><li>Which of those are enforced versus aspirational</li><li>What the SOC alerts on when a control is bypassed — a large transfer on a single voice authorisation</li><li>Who owns closing the gaps, since most of them are not the SOC's to fix alone</li></ul>" +
        TODO,
    },
  ],
};
