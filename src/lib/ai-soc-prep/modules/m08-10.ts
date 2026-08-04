/**
 * Written content for modules 08, 09 and 10 — the Log Analysis block.
 *
 * This is where dual KQL/SPL is heaviest. Both dialects are complete and
 * runnable rather than one being a footnote: a reader arriving from /soc-prep
 * knows SPL, a reader working in Sentinel knows KQL, and a half-translated
 * query is worse than none because it looks usable.
 */
import type { Section } from "../data";

/* -------------------------------------------------------------------------- */
/* 08 — Normalisation first                                                    */
/* -------------------------------------------------------------------------- */

export const M08_SECTIONS: Section[] = [
  {
    heading: "Why schema comes before AI",
    body: "<p>The instinct is to point a model at raw logs and let it figure things out. It cannot, for three separate reasons that compound.</p><p><b>Cost.</b> A raw Windows 4688 event runs 400–600 tokens. The same event reduced to the eight fields triage actually uses runs about 60. That is the difference between eight events of context and sixty, and context is where correlation lives.</p><p><b>Attention.</b> Models weight what is present. A raw event is 80% boilerplate — schema URIs, GUIDs, keyword bitmasks — and every one of those tokens competes with the command line you cared about.</p><p><b>Correlation.</b> A firewall calls it <code>src_ip</code>, Windows calls it <code>IpAddress</code>, the proxy calls it <code>c-ip</code>. A model asked to correlate across all three is doing schema mapping by inference, and it will be confidently inconsistent about it.</p>",
    callout: {
      kind: "verified",
      title: "The one-line version",
      body: "Normalisation is not tidying. It is what makes the problem fit in the context window and stops the model doing field mapping by guesswork.",
    },
  },
  {
    heading: "The three schemas worth knowing",
    body: "<p>You do not need to memorise field lists. You need to know which one your platform speaks and that a mapping exists.</p>",
    table: {
      headers: ["Schema", "Whose", "Where you meet it"],
      rows: [
        ["OCSF", "Open, vendor-neutral (AWS, Splunk, IBM and others)", "The direction the industry is moving. Worth learning if you are picking one fresh."],
        ["ASIM", "Microsoft", "Sentinel. Normalised parsers over raw tables — query ASIM, not SecurityEvent, where one exists."],
        ["ECS", "Elastic", "Elastic stack, and widely borrowed elsewhere because it was first to be good."],
      ],
    },
    callout: {
      kind: "review",
      title: "The interview answer",
      body: "“I normalise to whichever schema the platform already speaks — ASIM in Sentinel, ECS in Elastic — rather than inventing a third. The value is having one field name per concept, not having the perfect field name.”",
    },
  },
  {
    heading: "Timestamps — the silent killer",
    body: "<p>More correlation work is broken by time than by anything else, and it fails quietly: the query returns rows, they are just the wrong rows.</p><p>Three specific traps. Windows event logs are local time unless you are reading the XML. Many appliances emit no timezone at all. And your SIEM has both an ingest time and an event time, which diverge under load — sometimes by hours during an incident, which is exactly when you are querying.</p><p><b>Normalise to UTC at ingest, and always query on event time, not ingest time.</b> If you take one operational habit from this module, take that one.</p>",
    queries: {
      note: "Checking your own ingest lag. Worth running once on a normal day so you know what normal looks like, because during an incident is the wrong moment to discover it is four hours.",
      kql: "SecurityEvent\n| where TimeGenerated > ago(24h)\n| extend lag_seconds = datetime_diff('second', ingestion_time(), TimeGenerated)\n| summarize p50 = percentile(lag_seconds, 50),\n            p95 = percentile(lag_seconds, 95),\n            worst = max(lag_seconds)\n         by Computer\n| where p95 > 300          // more than 5 minutes behind\n| order by p95 desc",
      spl: "index=main earliest=-24h\n| eval lag_seconds = _indextime - _time\n| stats p50(lag_seconds) as p50,\n        p95(lag_seconds) as p95,\n        max(lag_seconds) as worst\n     by host\n| where p95 > 300\n| sort - p95",
    },
  },
  {
    heading: "Entity resolution — one user across five sources",
    body: "<p>The same person appears as <code>jbell</code>, <code>ACME\\jbell</code>, <code>jbell@acme.com</code>, <code>CN=James Bell,OU=Finance</code> and a UPN GUID, depending on which log you are reading.</p><p>A model handed all five will sometimes treat them as one person and sometimes as five. Not because it is stupid — because nothing in the input says they are the same, and it is guessing. Resolve identity in code before inference, not in the prompt.</p>",
    code: {
      lang: "python",
      label: "Deterministic, boring, and correct",
      code: "import re\n\ndef canonical_user(raw: str) -> str:\n    \"\"\"Reduce every representation to one lowercase sAMAccountName.\n\n    Deliberately not a model's job. This is a lookup table and three\n    regexes, and it is right every time.\n    \"\"\"\n    v = raw.strip().lower()\n\n    if m := re.match(r\"^cn=([^,]+)\", v):        # LDAP DN\n        v = m.group(1)\n    if \"\\\\\" in v:                                 # DOMAIN\\user\n        v = v.split(\"\\\\\", 1)[1]\n    if \"@\" in v:                                  # UPN\n        v = v.split(\"@\", 1)[0]\n\n    return v\n\nassert canonical_user(\"ACME\\\\jbell\") == \"jbell\"\nassert canonical_user(\"jbell@acme.com\") == \"jbell\"\nassert canonical_user(\"CN=jbell,OU=Finance,DC=acme\") == \"jbell\"",
    },
    callout: {
      kind: "warn",
      title: "Where this bites hardest",
      body: "Machine accounts end in $ and service accounts often follow a naming convention. Canonicalise those too, or your baseline in module 03 treats WKS-4471$ and wks-4471$ as different entities and both look anomalous.",
    },
  },
  {
    heading: "Measure the reduction",
    body: "<p>Do not take the 5–10× claim on trust. Measure it on your own data once, because the number determines how many events fit in a bundle and therefore what the assistant can reason about.</p>",
    code: {
      lang: "python",
      label: "The before-and-after that justifies the whole module",
      code: "import json, tiktoken\n\nenc = tiktoken.get_encoding(\"cl100k_base\")\nn = lambda s: len(enc.encode(s if isinstance(s, str) else json.dumps(s)))\n\nraw = open(\"sample_4688.json\").read()\n\ndef normalise(evt: dict) -> dict:\n    \"\"\"Only the fields triage uses. Everything else is noise.\"\"\"\n    return {\n        \"ts\":     evt[\"TimeCreated\"],\n        \"host\":   evt[\"Computer\"],\n        \"user\":   canonical_user(evt[\"SubjectUserName\"]),\n        \"parent\": evt[\"ParentProcessName\"].rsplit(\"\\\\\", 1)[-1],\n        \"proc\":   evt[\"NewProcessName\"].rsplit(\"\\\\\", 1)[-1],\n        \"cmd\":    evt[\"CommandLine\"][:200],\n    }\n\nsmall = normalise(json.loads(raw))\nprint(f\"raw        {n(raw):>5} tokens\")\nprint(f\"normalised {n(small):>5} tokens\")\nprint(f\"reduction  {n(raw) / n(small):>5.1f}x\")\nprint(f\"events in an 8k window: {8000 // n(raw)} raw -> {8000 // n(small)} normalised\")",
    },
    callout: {
      kind: "verified",
      title: "That last line is the point",
      body: "Going from 13 events of context to 130 is not an efficiency saving. It is the difference between seeing one moment and seeing the sequence — and sequence is what triage is.",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 09 — Triage assist                                                          */
/* -------------------------------------------------------------------------- */

export const M09_SECTIONS: Section[] = [
  {
    heading: "The loop, in order",
    body: "<p>A triage assistant is six steps, and the order is not negotiable. Most failed implementations have reordered them or skipped one.</p><ol><li><b>Normalise</b> — module 08. Without it the rest is guesswork on noise.</li><li><b>Dedup and cluster</b> — collapse the forty alerts about one thing into one thing.</li><li><b>Retrieve</b> — pull the runbook section, prior tickets, asset context.</li><li><b>Infer</b> — one model call, structured output, temperature 0.</li><li><b>Validate</b> — schema, then grounding. Reject rather than repair.</li><li><b>Human gate</b> — an analyst decides, and the decision is logged.</li></ol><p>Note that only step 4 is a model. Five of the six are ordinary code, and that ratio is roughly right for a system that works.</p>",
    callout: {
      kind: "review",
      title: "The most common mistake",
      body: "Skipping step 2 and letting the model deduplicate. Forty near-identical alerts eat the context window, and the model summarises rather than deduplicates — you get one paragraph about forty alerts instead of one alert. Dedup is embedding arithmetic and belongs in code.",
    },
  },
  {
    heading: "Dedup by embedding, not by string",
    body: "<p>String matching fails because alerts differ in exactly the fields that vary — timestamp, PID, session ID. Embeddings collapse them because the <i>meaning</i> is identical.</p>",
    code: {
      lang: "python",
      label: "Cluster a day of alerts, triage the clusters",
      code: "import numpy as np, ollama\nfrom sklearn.cluster import DBSCAN\n\ndef embed(texts: list[str]) -> np.ndarray:\n    out = [ollama.embeddings(model=\"nomic-embed-text\", prompt=t)[\"embedding\"]\n           for t in texts]\n    return np.array(out)\n\n# Strip the fields that always differ, so similarity reflects meaning\ndef signature(a: dict) -> str:\n    return f\"{a['rule']} {a['host']} {a['proc']} {a['user']}\"\n\nvecs = embed([signature(a) for a in alerts])\n\n# cosine distance; eps tuned by looking at the result, not by theory\nlabels = DBSCAN(eps=0.15, min_samples=2, metric=\"cosine\").fit_predict(vecs)\n\nfor cluster in set(labels):\n    members = [a for a, l in zip(alerts, labels) if l == cluster]\n    if cluster == -1:\n        print(f\"{len(members)} singletons — triage individually\")\n    else:\n        print(f\"cluster {cluster}: {len(members)} alerts -> triage once\")",
    },
    callout: {
      kind: "warn",
      title: "Tune eps by looking, not by theory",
      body: "Too tight and nothing clusters; too loose and genuinely different alerts merge, which is the dangerous direction. Start at 0.15, print the clusters, and read them. If two things you would triage differently are in one cluster, tighten it.",
    },
  },
  {
    heading: "The entity timeline",
    body: "<p>The single most useful thing an assistant can assemble, and it is mostly a query rather than a model. Give the model a clean chronological timeline for the entity and its job becomes reading; make it assemble one from raw events and its job becomes guessing.</p>",
    queries: {
      note: "One entity, all sources, one timeline. This is the input to the model — not the raw alert.",
      kql: "let target = \"jbell\";\nlet window = 2h;\nlet t0 = datetime(2026-08-03 09:00:00);\nunion isfuzzy=true\n  (SecurityEvent\n   | where TargetUserName =~ target or SubjectUserName =~ target\n   | project TimeGenerated, src = \"windows\",\n             what = strcat(\"EventID \", EventID),\n             detail = strcat(Computer, \" \", NewProcessName)),\n  (SigninLogs\n   | where UserPrincipalName startswith target\n   | project TimeGenerated, src = \"entra\",\n             what = strcat(\"signin \", ResultType),\n             detail = strcat(IPAddress, \" \", AppDisplayName)),\n  (DeviceNetworkEvents\n   | where InitiatingProcessAccountName =~ target\n   | project TimeGenerated, src = \"network\",\n             what = \"connection\",\n             detail = strcat(RemoteUrl, \" \", RemoteIP))\n| where TimeGenerated between (t0 - window .. t0 + window)\n| order by TimeGenerated asc\n| project TimeGenerated, src, what, detail",
      spl: "index=* (Account_Name=\"jbell\" OR user=\"jbell\" OR src_user=\"jbell\")\n  earliest=\"08/03/2026:07:00:00\" latest=\"08/03/2026:11:00:00\"\n| eval src = case(\n    sourcetype==\"WinEventLog:Security\", \"windows\",\n    sourcetype==\"azure:aad:signin\",     \"entra\",\n    sourcetype==\"pan:traffic\",          \"network\",\n    true(), sourcetype)\n| eval what = coalesce(EventCode, ResultType, action)\n| eval detail = coalesce(New_Process_Name, app, dest)\n| sort 0 _time\n| table _time, src, what, detail",
    },
    callout: {
      kind: "verified",
      title: "Why this is the highest-value query on the path",
      body: "It answers “what else was this account doing?” — the question a human asks first and a raw alert never answers. Getting it right in code means the model never has to infer chronology, which is one of the things it is worst at.",
    },
  },
  {
    heading: "The output contract, and confidence calibration",
    body: "<p>Same contract as module 04: verdict, confidence, evidence with citations, next steps, unsupported observations. The addition here is what to do with <code>confidence</code>, because models are systematically overconfident and the raw number is not usable as-is.</p><p>Two things make it useful. First, define what the bands <i>mean</i> in the prompt rather than leaving the model to invent a scale. Second, and more importantly, <b>check the calibration empirically</b> — of the verdicts returned at 0.9, what share were actually right? That is a project 10 measurement, and until you have it, treat confidence as an ordering hint rather than a probability.</p>",
    code: {
      lang: "text",
      label: "Anchoring the scale in the prompt",
      code: "confidence must follow this scale:\n  0.9-1.0  multiple independent pieces of evidence agree, and you\n           would stake the verdict on the log lines you cited\n  0.7-0.9  clear evidence, one plausible benign explanation remains\n  0.4-0.7  suggestive, materially incomplete\n  below 0.4 do not return a verdict; return insufficient_evidence",
    },
    callout: {
      kind: "model",
      title: "Do not route on confidence until you have measured it",
      body: "Auto-closing everything below 0.3 as benign is the obvious next step and it is how you miss things. Measure the calibration first. If 0.3 verdicts are right 40% of the time, that threshold is closing real incidents.",
    },
  },
  {
    heading: "The human gate, made concrete",
    body: "<p>“Human in the loop” is easy to say and usually means a screen someone clicks through. Three properties make it real.</p><ul><li><b>The evidence is on the same screen as the verdict.</b> If checking requires opening the SIEM in another tab, most people will not, most of the time.</li><li><b>Disagreeing is one click and it is recorded.</b> The override rate from module 05 is your best signal, and you only get it if disagreeing is easy.</li><li><b>The default is not accept.</b> A pre-ticked box is not a gate.</li></ul>",
    callout: {
      kind: "verified",
      title: "The measurement that tells you if it is working",
      body: "Time-to-triage is the metric everyone reaches for. The better one is the override rate, tracked over time. Falling means trust is growing; a sudden rise means something changed — a model update, a prompt edit, a shift in the alert mix — and you will see it before anyone complains.",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* 10 — NL→query and AI-assisted detection engineering                         */
/* -------------------------------------------------------------------------- */

export const M10_SECTIONS: Section[] = [
  {
    heading: "Why an ungrounded model invents field names",
    body: "<p>Ask a model for a KQL query and it will write one. The syntax will usually be right — it has seen a great deal of KQL. The <b>field names will be plausible and frequently wrong</b>, because it is producing the most probable field name rather than looking one up.</p><p><code>SecurityEvent | where SourceIP == ...</code> reads perfectly and fails, because the column is <code>IpAddress</code>. Worse, in Sentinel that specific mistake returns a syntax-valid query with zero rows, which looks like “no results” rather than “broken query”.</p><p>The fix is schema grounding: give the model the actual table and column list, and instruct it to use nothing else.</p>",
    code: {
      lang: "python",
      label: "Ground it in the real schema",
      code: "SCHEMA = \"\"\"\nAvailable tables and columns. Use ONLY these. If the query needs a\nfield that is not listed, say so instead of inventing one.\n\nSecurityEvent: TimeGenerated, Computer, EventID, Account,\n  TargetUserName, SubjectUserName, IpAddress, LogonType,\n  NewProcessName, ParentProcessName, CommandLine\n\nSigninLogs: TimeGenerated, UserPrincipalName, IPAddress, ResultType,\n  AppDisplayName, ClientAppUsed, Location\n\"\"\"\n\nprompt = f\"{SCHEMA}\\n\\nWrite a KQL query that: {question}\"",
    },
    callout: {
      kind: "review",
      title: "Where to get the schema list",
      body: "Do not type it by hand. Sentinel: `search * | getschema` per table, or the Log Analytics API. Splunk: `| fieldsummary` on a representative search. Generate it, cache it, and regenerate when your sources change — a stale schema reintroduces exactly the problem it was solving.",
    },
  },
  {
    heading: "The validation ladder",
    body: "<p>Grounding reduces invention; it does not eliminate it. Every generated query goes up four rungs before it runs on anything that matters, and each is cheap.</p>",
    table: {
      headers: ["Rung", "Check", "Catches"],
      rows: [
        ["1. Static", "Every field named appears in the schema list", "Invented columns — the most common failure"],
        ["2. Syntax", "Parse or dry-run against the engine", "Malformed pipelines"],
        ["3. Bounded", "Run over 15 minutes, not 90 days", "Expensive mistakes, before they are expensive"],
        ["4. Sanity", "Row count within an expected order of magnitude", "Queries that are valid and wrong — 0 rows or 4 million"],
      ],
    },
    code: {
      lang: "python",
      label: "Rung 1 is fifteen lines and catches most of it",
      code: "import re\n\nKNOWN = {\n    \"SecurityEvent\": {\"TimeGenerated\", \"Computer\", \"EventID\", \"Account\",\n                      \"TargetUserName\", \"SubjectUserName\", \"IpAddress\",\n                      \"LogonType\", \"NewProcessName\", \"ParentProcessName\",\n                      \"CommandLine\"},\n}\n\nclass InventedField(Exception):\n    pass\n\ndef check_fields(kql: str, table: str) -> None:\n    # Identifiers used in comparisons and projections\n    used = set(re.findall(r\"\\b([A-Z][A-Za-z0-9_]{2,})\\b\", kql))\n    kql_keywords = {\"TimeGenerated\", \"Computer\"}  # extend as needed\n    unknown = used - KNOWN[table] - kql_keywords\n    if unknown:\n        raise InventedField(\n            f\"Not in the {table} schema: {sorted(unknown)}. \"\n            f\"Regenerate rather than running this.\"\n        )",
    },
    callout: {
      kind: "warn",
      title: "Never blind-execute",
      body: "A generated query run unbounded against production is, at best, an expensive scan and at worst a denial of service against your own SIEM. Rung 3 is not a formality — bound the window before the first execution, always.",
    },
  },
  {
    heading: "The same hunt in both dialects",
    body: "<p>Here is a realistic hunt — Office spawning a script interpreter — generated and then hardened. Both dialects in full, because a half-translated query looks usable and is not.</p>",
    queries: {
      note: "Note what the hardening adds: bounded time, an explicit allow-list of the parents that matter, and a summarised output rather than raw rows. A generated first draft rarely includes any of the three.",
      kql: "let lookback = 24h;\nlet office = dynamic([\"winword.exe\",\"excel.exe\",\"powerpnt.exe\",\"outlook.exe\"]);\nlet interpreters = dynamic([\"powershell.exe\",\"pwsh.exe\",\"cmd.exe\",\n                            \"wscript.exe\",\"cscript.exe\",\"mshta.exe\"]);\nSecurityEvent\n| where TimeGenerated > ago(lookback)\n| where EventID == 4688\n| extend parent = tolower(tostring(split(ParentProcessName, \"\\\\\")[-1])),\n         child  = tolower(tostring(split(NewProcessName, \"\\\\\")[-1]))\n| where parent in (office) and child in (interpreters)\n| extend encoded = CommandLine matches regex @\"(?i)\\s-e(nc|ncodedcommand)?\\s\"\n| summarize hits = count(),\n            hosts = dcount(Computer),\n            sample = any(CommandLine)\n         by parent, child, encoded\n| order by hits desc",
      spl: "index=main EventCode=4688 earliest=-24h\n| eval parent = lower(mvindex(split(Parent_Process_Name, \"\\\\\"), -1)),\n       child  = lower(mvindex(split(New_Process_Name, \"\\\\\"), -1))\n| search parent IN (\"winword.exe\",\"excel.exe\",\"powerpnt.exe\",\"outlook.exe\")\n         child  IN (\"powershell.exe\",\"pwsh.exe\",\"cmd.exe\",\n                    \"wscript.exe\",\"cscript.exe\",\"mshta.exe\")\n| eval encoded = if(match(Process_Command_Line, \"(?i)\\s-e(nc|ncodedcommand)?\\s\"), 1, 0)\n| stats count as hits,\n        dc(host) as hosts,\n        values(Process_Command_Line) as sample\n     by parent, child, encoded\n| sort - hits",
    },
  },
  {
    heading: "Sigma drafting, and the backtest that gates it",
    body: "<p>A model is genuinely good at turning a report or an IOC into a Sigma rule — the format is regular and well represented in training data. What it cannot do is tell you whether the rule is deployable in <i>your</i> environment.</p><p>That is a backtest, and it is the same measurement as module 03: run the rule over historical data and count what it would have fired on.</p>",
    queries: {
      note: "Backtest before enabling. If this returns 400 rows a day, the rule is not deployable however elegant it is — and you have learned that for free rather than by paging someone.",
      kql: "// Backtest: what would this have fired on over 30 days?\nSecurityEvent\n| where TimeGenerated > ago(30d)\n| where EventID == 4688\n| extend parent = tolower(tostring(split(ParentProcessName, \"\\\\\")[-1])),\n         child  = tolower(tostring(split(NewProcessName, \"\\\\\")[-1]))\n| where parent in (\"winword.exe\",\"excel.exe\") and child == \"powershell.exe\"\n| summarize fires = count() by bin(TimeGenerated, 1d)\n| summarize per_day = avg(fires), worst_day = max(fires), days = count()\n| extend verdict = iff(per_day <= 2, \"deployable\", \"tune before enabling\")",
      spl: "index=main EventCode=4688 earliest=-30d@d\n| eval parent = lower(mvindex(split(Parent_Process_Name, \"\\\\\"), -1)),\n       child  = lower(mvindex(split(New_Process_Name, \"\\\\\"), -1))\n| search parent IN (\"winword.exe\",\"excel.exe\") child=\"powershell.exe\"\n| bin _time span=1d\n| stats count as fires by _time\n| stats avg(fires) as per_day, max(fires) as worst_day, count as days\n| eval verdict = if(per_day <= 2, \"deployable\", \"tune before enabling\")",
    },
    callout: {
      kind: "verified",
      title: "This is the whole difference",
      body: "“I used AI to write detection rules” is a sentence anyone can say. “I used AI to draft them, backtested every one over 30 days, and rejected the ones above two fires a day” is a process — and the second sentence is what a detection engineering interview is actually asking about.",
    },
  },
  {
    heading: "Detection-as-code, with prompts in the repo",
    body: "<p>The generated rule goes in git. So does the prompt that generated it, the schema it was grounded in, and the backtest result that justified enabling it.</p><p>That bundle is what makes the rule reviewable six months later, when it starts misfiring and nobody remembers why the threshold is two. Module 04 argued prompts are detection rules; this is where the two literally live in the same directory.</p>",
    code: {
      lang: "yaml",
      label: "detections/office-spawns-interpreter.yml",
      code: "title: Office application spawned a script interpreter\nid: 7c1a9f30-2b4e-4d18-9a55-3f0c8e2b1d44\nstatus: production\nlevel: high\ntags: [attack.execution, attack.t1059, attack.t1566.001]\n\ngenerated_by:\n  prompt: prompts/sigma-from-behaviour.md@v2\n  model: llama3.1:8b\n  schema: schemas/sentinel-securityevent-2026-08.json\n  reviewed_by: faisal\n\nbacktest:\n  window: 30d\n  fires_per_day: 1.4\n  worst_day: 6\n  verdict: deployable\n  known_fp:\n    - \"Finance macro workbook on WKS-2210, weekly, change CHG-7742\"\n\nfalsepositives:\n  - Legitimate Office macros that shell out\n  - Software deployment tooling launched from a document\n\nresponse:\n  - Decode the command line before anything else\n  - Check the parent document's origin — email attachment or share\n  - If encoded and outbound, escalate rather than closing",
    },
  },
];
