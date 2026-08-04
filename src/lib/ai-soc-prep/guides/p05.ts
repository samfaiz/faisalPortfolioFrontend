/**
 * Project 05 — NL→KQL assistant with a validator that refuses to run
 * unvalidated output.
 *
 * The generation is the easy, uninteresting half. The validator — schema
 * grounding, a static field check, a bounded dry run, a row-count sanity gate —
 * is the whole project, and it is built first, before the model is allowed to
 * produce anything. Module 10 is the theory; this is the reject loop made real.
 *
 * Code blocks use String.raw. No backtick inside a String.raw block; where a
 * Markdown backtick must be emitted, chr(96) is used.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p05: ProjectGuide = {
  slug: "nl-to-kql-validator",
  projectId: 5,
  intro:
    "<p>You are going to build an assistant that turns a plain-English hunt idea into a KQL query — and then <b>refuses to hand it over until it has passed a validator</b>. The generation is a few lines. The validator is everything: it checks every field against a real schema, parses the query, runs it against a bounded time window, and sanity-checks the row count before a human ever sees it.</p>" +
    "<p>The reason this ordering matters is the lesson of module 10. A model will write syntactically perfect KQL that references a column your table does not have, and in Sentinel that specific mistake returns <i>zero rows with no error</i> — which reads as “nothing found” rather than “broken query”. An analyst acts on “nothing found”. So the deliverable is not a query generator; it is a generator wrapped in a machine that will not let an unvalidated query out.</p>" +
    "<p>You build the validator first, before the model. That is deliberate — it forces you to define what “valid” means before you have a fluent, confident query tempting you to skip the check.</p>",
  dataset: {
    name: "A schema export (provided) and a local sample event table",
    note:
      "<p><b>No SIEM licence required.</b> The schema is the important input, and step 1 gives you a realistic Sentinel <code>SecurityEvent</code> / <code>SigninLogs</code> schema as JSON to ground against. That is enough to build and test the static validation that catches most errors.</p>" +
      "<p><b>For the dry-run rungs</b>, step 5 loads a few thousand synthetic events into DuckDB and translates the KQL core to SQL, so you can actually execute and row-count without Azure. The concepts — bounded window, row-count sanity — transfer unchanged to a real Log Analytics workspace; the enterprise callout covers the live version.</p>" +
      "<p>Everything is local and synthetic. Nothing here connects to a production SIEM, which is the whole point of rung 3.</p>",
  },
  glossary: [
    {
      term: "KQL (Kusto Query Language)",
      plain:
        "The query language for Microsoft Sentinel, Defender and Azure Data Explorer. Reads left to right as a pipeline: a table, then a series of operators separated by the pipe character, each transforming the rows.",
    },
    {
      term: "Schema grounding",
      plain:
        "Giving the model the exact list of tables and columns it may use, and forbidding anything else. Without it, a model invents plausible column names, which is the failure this project exists to catch.",
    },
    {
      term: "Dry run",
      plain:
        "Executing a query over a deliberately tiny time window to prove it runs and returns a sane amount of data, before anyone runs it for real over ninety days.",
    },
    {
      term: "The reject loop",
      plain:
        "When validation fails, the error is fed back to the model to regenerate, rather than the bad query being shown to a human. The loop is bounded — a few attempts, then it gives up and says so.",
    },
    {
      term: "Blind execution",
      plain:
        "Running generated code without checking it first. Against a production SIEM this is, at best, an expensive scan and at worst a denial of service against your own tooling. The validator exists to make it impossible.",
    },
  ],
  before: [
    "<b>Module 10 read.</b> This project is that module's validation ladder, built into working code. The four rungs there are the four checks here.",
    "<b>Project 01 finished.</b> The schema-constrained call and temperature-0 discipline carry straight over.",
    "Python 3.11+, Ollama running with <code>llama3.1:8b</code>.",
    "<code>pip install duckdb</code> for the executable dry-run rungs. No Azure account needed.",
  ],
  steps: [
    {
      title: "Write the schema down first — it is the ground truth",
      time: "15 min",
      why: "The validator checks generated fields against this schema, and the model is grounded in it. Everything downstream depends on it being accurate, so it is step one, not an afterthought.",
      body:
        "<p>Save the tables and columns your assistant is allowed to touch as structured data. In a real deployment you generate this from the platform (module 10 shows how); here it is provided. Treat it as the contract: a field not in this file does not exist.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows",
          code: String.raw`mkdir kql-assistant; cd kql-assistant
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install ollama pydantic rich duckdb`,
        },
        {
          lang: "python",
          label: "schema.py — the single source of truth",
          code: String.raw`# In production: generate with 'search * | getschema' per table, cache it,
# regenerate when sources change. Here it is provided.
SCHEMA = {
    "SecurityEvent": {
        "TimeGenerated", "Computer", "EventID", "Account",
        "TargetUserName", "SubjectUserName", "IpAddress", "LogonType",
        "NewProcessName", "ParentProcessName", "CommandLine",
    },
    "SigninLogs": {
        "TimeGenerated", "UserPrincipalName", "IPAddress", "ResultType",
        "AppDisplayName", "ClientAppUsed", "Location",
    },
}

def schema_prompt() -> str:
    lines = ["Available tables and columns. Use ONLY these. If a query needs "
             "a field not listed, return needs_missing_field instead of "
             "inventing one.\n"]
    for table, cols in SCHEMA.items():
        lines.append(f"{table}: {', '.join(sorted(cols))}")
    return "\n".join(lines)`,
        },
      ],
      expect:
        "<p>A <code>schema.py</code> whose <code>SCHEMA</code> dict is the authority for what exists. Every later check imports it. If it is wrong, the validator is wrong — so this is the file to get right.</p>",
      fixes: [],
    },
    {
      title: "Build rung 1 — the static field check — before the model exists",
      time: "35 min",
      why: "This single check catches the most common and most dangerous failure: invented column names. Building it before the generator means you never trust a query just because it reads well.",
      body:
        "<p>Extract every identifier the query uses in a comparison or projection, and confirm each one is in the schema for the table being queried. An unknown field means the query is rejected — no execution, regenerate. This is fifteen lines and it is the highest-value rung.</p>",
      commands: [
        {
          lang: "python",
          label: "validate.py — rung 1",
          code: String.raw`import re
from schema import SCHEMA

# KQL operators and functions that look like identifiers but are not fields
KQL_KEYWORDS = {
    "where", "project", "summarize", "extend", "order", "by", "asc", "desc",
    "count", "dcount", "ago", "bin", "let", "union", "join", "on", "and",
    "or", "not", "in", "has", "contains", "startswith", "endswith", "between",
    "datetime", "dynamic", "tolower", "tostring", "split", "strcat", "iff",
    "TimeGenerated",
}

class ValidationError(Exception):
    pass

def check_fields(kql: str, table: str) -> None:
    if table not in SCHEMA:
        raise ValidationError(f"unknown table {table!r}")
    # Capitalised identifiers are the field-name shape in these tables
    used = set(re.findall(r"\b([A-Z][A-Za-z0-9_]{2,})\b", kql))
    unknown = used - SCHEMA[table] - KQL_KEYWORDS - set(SCHEMA)
    if unknown:
        raise ValidationError(
            f"fields not in {table} schema: {sorted(unknown)} - "
            f"regenerate, do not run"
        )

# Prove it works before the model can fool you:
check_fields("SecurityEvent | where EventID == 4625", "SecurityEvent")  # ok
try:
    check_fields("SecurityEvent | where SourceIP == '10.0.0.1'", "SecurityEvent")
except ValidationError as e:
    print(f"caught: {e}")   # SourceIP is not a column - IpAddress is`,
        },
      ],
      expect:
        "<p>The valid query passes silently; the one referencing <code>SourceIP</code> is caught, because the real column is <code>IpAddress</code>. That is precisely the mistake module 10 warns returns zero rows in Sentinel — and you have caught it before it ever ran.</p>",
      expectCode:
        "caught: fields not in SecurityEvent schema: ['SourceIP'] - regenerate, do not run",
      fixes: [
        {
          problem: "It flags a legitimate KQL function as an unknown field",
          cause: "Your query uses an operator not in <code>KQL_KEYWORDS</code>.",
          fix: "Add it to the keyword set. The list is not exhaustive by design — extend it as you meet real queries. Over-flagging is the safe direction; it triggers a regenerate, not a bad run.",
        },
      ],
    },
    {
      title: "Generate — grounded, and only now",
      time: "25 min",
      why: "With the field check already standing, the generator can be simple, because its output is about to be checked rather than trusted. Ground it in the schema so it invents fewer fields in the first place.",
      body:
        "<p>Hand the model the schema and the hunt idea, and ask for the query plus the table it targets, as structured output. Schema grounding reduces invention; the validator handles what slips through. Note the <code>needs_missing_field</code> escape — the model is told to say when the schema genuinely cannot express the request, rather than forcing it.</p>",
      commands: [
        {
          lang: "python",
          label: "generate.py",
          code: String.raw`from typing import Literal
from pydantic import BaseModel, Field
import ollama
from schema import schema_prompt

class Generated(BaseModel):
    status: Literal["ok", "needs_missing_field"]
    table: str = Field(description="The single table this query targets")
    kql: str = Field(description="The KQL query, or empty if needs_missing_field")
    missing: list[str] = Field(default_factory=list)

SYSTEM = ("You write KQL for Microsoft Sentinel. Use ONLY the schema given. "
          "Target exactly one table. Always bound time with 'where "
          "TimeGenerated > ago(...)'. If the request needs a field not in the "
          "schema, set status needs_missing_field and list it - do not invent.")

def generate(idea: str, feedback: str = "") -> Generated:
    user = f"{schema_prompt()}\n\nHUNT IDEA: {idea}"
    if feedback:
        user += f"\n\nYour previous attempt was rejected: {feedback}\nFix it."
    resp = ollama.chat(
        model="llama3.1:8b",
        format=Generated.model_json_schema(),
        options={"temperature": 0},
        messages=[{"role": "system", "content": SYSTEM},
                  {"role": "user", "content": user}],
    )
    return Generated.model_validate_json(resp["message"]["content"])

print(generate("failed logons followed by a success from the same IP").kql)`,
        },
      ],
      expect:
        "<p>A KQL query targeting <code>SecurityEvent</code>, filtering on <code>EventID</code> and bounding time with <code>ago()</code>. It may still contain a subtle field error — that is expected and is what the validator is for. Do not eyeball it and trust it; that instinct is the thing this project trains out of you.</p>",
      fixes: [
        {
          problem: "It ignores the one-table rule and joins two",
          cause: "The idea genuinely spans tables, or the model over-reached.",
          fix: "For this project, keep queries single-table to make validation tractable. If the idea needs a join, that is a legitimate limit to note — multi-table validation is a stretch goal, and forcing a join through an unvalidated path is exactly what you are building this to prevent.",
        },
      ],
    },
    {
      title: "Assemble the full ladder and the reject loop",
      time: "30 min",
      why: "The rungs only matter wired together with a loop. Generate, validate, and on failure feed the error back to regenerate — bounded, so a model that cannot get it right does not spin forever.",
      body:
        "<p>Chain rung 1 (and the syntax check) into a loop of at most three attempts. Each rejection's reason goes back to the model as feedback. If it still fails after three tries, the assistant refuses and says why — which is a correct outcome, not a bug.</p>",
      commands: [
        {
          lang: "python",
          label: "assistant.py — generate/validate/reject",
          code: String.raw`from generate import generate
from validate import check_fields, ValidationError

def basic_syntax_check(kql: str) -> None:
    if kql.count("(") != kql.count(")"):
        raise ValidationError("unbalanced parentheses")
    if "ago(" not in kql:
        raise ValidationError("query is not time-bounded - add ago()")

def assisted_kql(idea: str, max_attempts: int = 3):
    feedback = ""
    for attempt in range(1, max_attempts + 1):
        gen = generate(idea, feedback)
        if gen.status == "needs_missing_field":
            return {"ok": False,
                    "reason": f"schema cannot express this: {gen.missing}"}
        try:
            check_fields(gen.kql, gen.table)
            basic_syntax_check(gen.kql)
            return {"ok": True, "kql": gen.kql, "table": gen.table,
                    "attempts": attempt}
        except ValidationError as e:
            feedback = str(e)
            print(f"  attempt {attempt} rejected: {e}")
    return {"ok": False, "reason": f"failed validation after {max_attempts} "
                                   f"attempts. Last error: {feedback}"}

print(assisted_kql("processes where Word or Excel launched an interpreter"))`,
        },
      ],
      expect:
        "<p>Either a validated query with the attempt count, or an honest refusal. When you watch a first attempt get rejected for an invented field and the second attempt fix it from the feedback, you are seeing the reject loop do its job — the model corrected because the machine made it, not because it knew better.</p>",
      expectCode: String.raw`  attempt 1 rejected: fields not in SecurityEvent schema: ['ProcessName']
{'ok': True, 'kql': 'SecurityEvent | where TimeGenerated > ago(24h) ...',
 'table': 'SecurityEvent', 'attempts': 2}`,
      fixes: [
        {
          problem: "It never converges and always exhausts the attempts",
          cause: "The feedback is too vague for the model to act on, or the idea truly needs a missing field.",
          fix: "Make the error message name the exact bad field and the closest valid one. If it still fails, that is the honest answer — the assistant refusing beats it handing over a query you would have run against production.",
        },
      ],
    },
    {
      title: "Rungs 3 and 4 — bounded dry run and row-count sanity",
      time: "35 min",
      why: "Static checks catch invented fields; they cannot catch a query that is valid and wrong — one that returns nothing, or four million rows. Only execution over a bounded window catches those, and you never run unbounded.",
      body:
        "<p>Load synthetic events into DuckDB, translate the KQL core to SQL, and run it over a <b>15-minute</b> window rather than the query's full range. Then sanity-check the count: zero rows or an absurd count both fail, because both signal a query that parses but does not mean what was asked.</p>" +
        "<p>The KQL→SQL translation here is deliberately minimal — enough to execute the common triage shapes locally. The discipline, not the translator, is the transferable part.</p>",
      commands: [
        {
          lang: "python",
          label: "dryrun.py",
          code: String.raw`import duckdb, random

con = duckdb.connect()
con.execute("""
    CREATE TABLE SecurityEvent (
        TimeGenerated TIMESTAMP, Computer VARCHAR, EventID INTEGER,
        TargetUserName VARCHAR, IpAddress VARCHAR, LogonType INTEGER,
        NewProcessName VARCHAR, ParentProcessName VARCHAR, CommandLine VARCHAR
    )""")
# Seed a few thousand plausible events (abbreviated)
rows = []
for i in range(5000):
    rows.append((f"2026-08-03 {random.randint(0,23):02d}:00:00",
                 f"WKS-{random.randint(1,50)}",
                 random.choice([4624, 4625, 4688]),
                 random.choice(["jbell", "msmith", "svc-backup"]),
                 f"10.14.{random.randint(0,20)}.{random.randint(1,254)}",
                 random.choice([2, 3, 10]),
                 "C:\\\\Windows\\\\System32\\\\cmd.exe",
                 "C:\\\\...\\\\winword.exe", "cmd /c whoami"))
con.executemany("INSERT INTO SecurityEvent VALUES (?,?,?,?,?,?,?,?,?)", rows)

def dry_run(sql_core: str) -> int:
    """Run the query's WHERE over a 15-min window only, return row count."""
    bounded = (f"SELECT count(*) FROM SecurityEvent "
               f"WHERE {sql_core} "
               f"AND TimeGenerated >= '2026-08-03 12:00:00' "
               f"AND TimeGenerated <  '2026-08-03 12:15:00'")
    return con.execute(bounded).fetchone()[0]

def sanity(count: int) -> str:
    if count == 0:
        return "REJECT: zero rows - valid query, but likely wrong fields/logic"
    if count > 1000:
        return f"REJECT: {count} rows in 15 min - far too broad, tighten it"
    return f"OK: {count} rows in the bounded window - proceed to review"

n = dry_run("EventID = 4625")
print(sanity(n))`,
        },
      ],
      expect:
        "<p>A row count from the 15-minute window and a verdict on it. A well-formed hunt returns a handful; a query that secretly matches everything trips the upper bound; a query with a logic error returns zero and is rejected rather than presented as “no threats found”.</p>",
      expectCode: "OK: 42 rows in the bounded window - proceed to review",
      fixes: [
        {
          problem: "Everything returns zero rows",
          cause: "The synthetic timestamps do not fall in your 15-minute window, or the field logic does not match the seeded data.",
          fix: "Widen the window to match the seed data's range, or print a few sample rows first. The point is the zero-row <i>rejection behaviour</i>, not this specific synthetic set.",
        },
        {
          problem: "The KQL does not translate to your SQL core cleanly",
          cause: "KQL has operators SQL does not, and the minimal translator only covers common shapes.",
          fix: "For triage queries — filters on EventID, process names, IPs, time — the translation is mechanical. Anything exotic is out of scope here and belongs against a real Log Analytics dry run, per the enterprise callout.",
        },
      ],
    },
    {
      title: "Refuse to emit until every rung has passed",
      time: "20 min",
      why: "The contract that names the project: the assistant returns a query only when static, syntax, dry-run and sanity checks all pass. Anything short of that is a refusal with a reason. This is where you enforce that no unvalidated query ever leaves.",
      body:
        "<p>Wrap generation, static validation, dry run and sanity into one function whose only two possible outputs are a fully validated query or a refusal. There is no third path where a query escapes with a warning — that path is the vulnerability, and it does not exist here.</p>",
      commands: [
        {
          lang: "python",
          label: "assistant.py — the gate",
          code: String.raw`def validated_query(idea: str) -> dict:
    result = assisted_kql(idea)          # rungs 1-2 + reject loop
    if not result["ok"]:
        return {"emitted": False, "reason": result["reason"]}

    sql_core = kql_where_to_sql(result["kql"])   # your minimal translator
    count = dry_run(sql_core)                     # rung 3, bounded
    verdict = sanity(count)                       # rung 4
    if verdict.startswith("REJECT"):
        return {"emitted": False, "reason": verdict, "kql_for_debug": result["kql"]}

    return {"emitted": True, "kql": result["kql"], "rows_in_window": count,
            "attempts": result["attempts"]}

out = validated_query("failed logons then a success from one source IP")
print("EMITTED" if out["emitted"] else "REFUSED:", out.get("reason", ""))`,
        },
      ],
      expect:
        "<p>A single boolean and a reason. Run it across a batch of ideas — some emit, some refuse — and confirm nothing ever comes back with an unchecked query. The refusals are the feature. An assistant that never refuses has no validator worth the name.</p>",
      expectCode: "EMITTED  (rows_in_window=42, attempts=1)",
      fixes: [
        {
          problem: "You are tempted to return the query anyway when only the sanity rung fails",
          cause: "A zero-row result feels harmless, so returning it 'for the analyst to decide' is seductive.",
          fix: "Resist it. Zero rows from a query that should match something means the logic is wrong, and handing it over relabels a bug as a finding. If you must expose it, put it behind an explicit <code>debug=True</code> flag that is off by default — never on the main path.",
        },
      ],
    },
    {
      title: "Show the SPL equivalent — the discipline is dialect-independent",
      time: "20 min",
      why: "The validator, not the language, is the point. Seeing the same four rungs in Splunk proves the pattern transfers and stops it reading as a KQL trick.",
      body:
        "<p>The ladder is identical in SPL: ground in the field list, static-check generated fields against it, run over a bounded <code>earliest</code> window, sanity-check the event count. Only the syntax of the checks changes. Both dialects in full, because a half-translated example teaches the wrong lesson.</p>",
      commands: [
        {
          lang: "python",
          label: "The same bounded dry run, expressed for each engine",
          code: String.raw`# KQL: bound the window before the first real execution
KQL_DRYRUN = (
    "SecurityEvent "
    "| where TimeGenerated between (ago(15m) .. now()) "
    "| where EventID == 4625 "
    "| summarize n = count()"
)

# SPL: the identical idea, Splunk syntax
SPL_DRYRUN = (
    "index=main sourcetype=WinEventLog:Security EventCode=4625 "
    "earliest=-15m latest=now "
    "| stats count as n"
)
# Both: run this FIRST, read n, apply the sanity gate, and only then let a
# human see the full-range query. Never run the 90-day version blind.`,
        },
      ],
      expect:
        "<p>Two bounded dry-run queries that do the same job in two engines. The takeaway to be able to say out loud: “I validate generated detection queries the same way in either dialect — ground, static-check, bounded dry run, row-count sanity — because the risk is the language-independent one of running unvalidated generated code.”</p>",
      fixes: [],
    },
  ],
  after: [
    "Write down one sentence: how many of a batch of ten hunt ideas emitted a validated query, and what the refusals were for. That ratio is the honest description of the assistant.",
    "Version the schema file with a date. A stale schema reintroduces the invented-field problem silently — module 10's internal annex is about exactly this.",
    "Keep the reject-loop logs. Which fields the model most often invents is real signal about the model and about which parts of your schema are confusingly named.",
    "Project 07 chains generation steps and shows error compounding; project 10 measures how often the validator caught a bad query versus how often a bad query slipped through — the number that proves the validator earns its place.",
  ],
  enterprise: [
    {
      platform: "Microsoft Sentinel + Security Copilot",
      body:
        "<p>Copilot generates KQL grounded in your real schema, which reduces invented fields at the source — but it does not stop you running the result unbounded, and it does not row-count-sanity-check for you. The validator you built is the missing half: wrap Copilot's output in the same static check and bounded dry run against a 15-minute slice of your Log Analytics workspace before enabling anything as an analytics rule.</p>",
    },
    {
      platform: "Splunk AI Assistant for SPL",
      body:
        "<p>Generates SPL you can run inline, which makes blind execution one click away — so the discipline matters more, not less. Point the generated search at a <code>| head</code> and a short <code>earliest</code> window first, check the count, and only then widen it. Same four rungs, Splunk syntax.</p>",
    },
    {
      platform: "Elastic AI Assistant / ES|QL",
      body:
        "<p>ES|QL generation has the same invented-field risk against ECS. The transferable control is to validate generated field names against the ECS mapping before execution — the exact rung 1 you built, pointed at a different schema.</p>",
    },
  ],
  cloudApi:
    "<p>A frontier model generates cleaner KQL and invents fewer fields, which lifts the first-attempt pass rate and shortens the reject loop. It does not remove the need for the validator — a better model still occasionally produces a valid-but-wrong query, and only the dry run catches those. The data-handling story here is unusually easy: you send the model a <i>schema</i> and a <i>hunt idea</i>, neither of which is sensitive log data, so this is one of the safer places on the path to use a hosted model. Keep the execution local and bounded regardless of which model wrote the query.</p>",
};
