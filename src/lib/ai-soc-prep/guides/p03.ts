/**
 * Project 03 — Windows authentication log anomaly hunter.
 *
 * The load-bearing lesson: steps 4 to 6 contain no model at all. Baselining is
 * statistics, scoring is arithmetic, clustering is linear algebra. The model
 * appears once, at step 7, on roughly twenty clusters out of a hundred thousand
 * events — and a reader who notices that has understood the path's whole thesis.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p03: ProjectGuide = {
  slug: "windows-auth-anomaly-hunter",
  projectId: 3,
  intro:
    "<p>You are going to take a hundred thousand Windows authentication events, work out what normal looks like for each account, score everything that deviates, collapse the repetition, and have a model write the hunt narrative for the twenty clusters that survive.</p>" +
    "<p>Count the model calls in that sentence. One, at the very end. <b>Everything that reduces a hundred thousand events to twenty is ordinary code</b> — a groupby, a z-score, a clustering algorithm. If you fed all hundred thousand to a language model instead, you would spend roughly forty dollars, wait an hour, and get a worse answer, because a model has no concept of how often something normally happens.</p>" +
    "<p>That is the point of the project, and it is the answer to the interview question you will eventually be asked: <i>where does AI actually belong in a detection pipeline?</i> At the end, on the small set, doing interpretation. Not at the start, on the big set, doing arithmetic.</p>",
  dataset: {
    name: "Your own Security log, plus EVTX-ATTACK-SAMPLES",
    url: "https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES",
    note:
      "<p>You need two things that are hard to get from one source: <b>enough normal to build a baseline</b>, and <b>something genuinely malicious to find</b>.</p>" +
      "<p><b>Normal</b> comes from your own Windows machine. Its Security log holds weeks of real 4624/4625 events with real timing and real irregularity — far better material than anything synthetic, because your actual logon pattern has all the awkward edges a generator would smooth out.</p>" +
      "<p><b>Malicious</b> comes from <a href=\"https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES\" target=\"_blank\" rel=\"noopener noreferrer\">EVTX-ATTACK-SAMPLES</a> — a free, well-known collection of EVTX files captured while real techniques were executed. Grab the lateral movement and credential access folders.</p>" +
      "<p>No Windows machine? The attack samples parse fine on macOS and Linux with <code>python-evtx</code>, and OTRF's <a href=\"https://github.com/OTRF/Security-Datasets\" target=\"_blank\" rel=\"noopener noreferrer\">Security-Datasets</a> ships pre-parsed JSON with enough background activity to baseline against. Step 1 covers both routes.</p>",
  },
  glossary: [
    {
      term: "Logon type",
      plain:
        "A number on event 4624 saying how the logon happened. 2 is someone at the keyboard, 3 is over the network (a file share), 10 is RDP, 5 is a service starting. The type is often more interesting than the logon itself — the same account logging on as type 3 instead of its usual type 2 is a real change.",
    },
    {
      term: "Baseline",
      plain:
        "A record of what is normal for a specific thing — this account usually signs in from these two hosts, on weekdays, between 08:00 and 18:00. Without one, “unusual” has no meaning, and every alert is guesswork.",
    },
    {
      term: "Z-score",
      plain:
        "How many standard deviations a value sits from the average. A z of 3 means it is further out than about 99.7% of normal observations. Plain arithmetic — no model involved, and it is reproducible in a way a model is not.",
    },
    {
      term: "Embedding",
      plain:
        "A list of numbers representing the meaning of a piece of text, such that similar text produces nearby numbers. It lets you group “the same thing happening again” without exact string matching.",
    },
    {
      term: "DBSCAN",
      plain:
        "A clustering algorithm that groups nearby points and, importantly, is allowed to say a point belongs to no group. For log analysis that is exactly right — the ungrouped ones are the interesting ones.",
    },
  ],
  before: [
    "<b>Projects 01 and 02 finished.</b> You will reuse the local model and the grounding validator without changes.",
    "<b>Module 03 read</b> — the sparse-account guard in step 4 comes straight from it, and skipping it produces a baseline that flags every new starter.",
    "<b>Module 08 read</b> — step 3 is that module's normalisation, applied.",
    "A Windows machine with at least a couple of weeks of Security log history, or the Linux/macOS route in step 1.",
    "8 GB RAM. This one is mostly pandas, and pandas is not the expensive part.",
  ],
  steps: [
    {
      title: "Get the data out of Windows",
      time: "20 min",
      why: "EVTX is a binary format designed for Windows tooling, not analysis. Getting to a flat table early means every later step is pandas rather than log-parsing.",
      body:
        "<p>Export your own Security log first. You need Administrator for this — reading the Security log is privileged, which is correct and not something to work around.</p>" +
        "<p>The PowerShell below pulls 4624 (successful logon), 4625 (failed), 4648 (explicit credentials — the one that catches <code>runas</code> and much lateral movement) and 4672 (special privileges assigned, i.e. an admin-equivalent logon) and flattens each event's XML properties into named columns.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows, as Administrator",
          label: "Export your own Security log to JSON",
          code: String.raw`mkdir auth-hunter; cd auth-hunter
mkdir data

# 4624 logon, 4625 failed logon, 4648 explicit creds, 4672 special privs
$ids = 4624, 4625, 4648, 4672

Get-WinEvent -FilterHashtable @{
    LogName   = 'Security'
    Id        = $ids
    StartTime = (Get-Date).AddDays(-30)
} -ErrorAction Stop |
ForEach-Object {
    $x = [xml]$_.ToXml()
    $d = @{}
    foreach ($p in $x.Event.EventData.Data) { $d[$p.Name] = $p.'#text' }

    [pscustomobject]@{
        TimeCreated       = $_.TimeCreated.ToUniversalTime().ToString('o')
        EventID           = $_.Id
        Computer          = $_.MachineName
        TargetUserName    = $d['TargetUserName']
        TargetDomainName  = $d['TargetDomainName']
        SubjectUserName   = $d['SubjectUserName']
        LogonType         = $d['LogonType']
        IpAddress         = $d['IpAddress']
        WorkstationName   = $d['WorkstationName']
        ProcessName       = $d['ProcessName']
        Status            = $d['Status']
        SubStatus         = $d['SubStatus']
    }
} | ConvertTo-Json -Depth 3 | Out-File -Encoding utf8 data\baseline.json

(Get-Content data\baseline.json | ConvertFrom-Json).Count`,
        },
        {
          lang: "bash",
          label: "The attack samples — every platform",
          code: String.raw`git clone --depth 1 https://github.com/sbousseaden/EVTX-ATTACK-SAMPLES.git
pip install evtx pandas scikit-learn ollama pydantic rich`,
        },
        {
          lang: "python",
          label: "evtx_to_json.py — convert the samples",
          code: String.raw`import json, sys
from pathlib import Path
from evtx import PyEvtxParser

FIELDS = ["TargetUserName", "TargetDomainName", "SubjectUserName",
          "LogonType", "IpAddress", "WorkstationName", "ProcessName",
          "Status", "SubStatus"]

def convert(evtx_dir: str, out: str) -> None:
    rows = []
    for f in Path(evtx_dir).rglob("*.evtx"):
        try:
            parser = PyEvtxParser(str(f))
        except Exception as e:                 # a few samples are truncated
            print(f"skip {f.name}: {e}", file=sys.stderr)
            continue

        for rec in parser.records_json():
            ev = json.loads(rec["data"])["Event"]
            eid = ev.get("System", {}).get("EventID")
            eid = eid.get("#text") if isinstance(eid, dict) else eid
            if int(eid or 0) not in (4624, 4625, 4648, 4672):
                continue

            d = ev.get("EventData") or {}
            rows.append({
                "TimeCreated": ev["System"]["TimeCreated"]["#attributes"]["SystemTime"],
                "EventID": int(eid),
                "Computer": ev["System"].get("Computer"),
                "source_file": f.name,          # keep provenance for citations
                **{k: d.get(k) for k in FIELDS},
            })

    Path(out).write_text(json.dumps(rows, indent=1))
    print(f"{len(rows)} auth events -> {out}")

if __name__ == "__main__":
    convert("EVTX-ATTACK-SAMPLES", "data/attack.json")`,
        },
      ],
      expect:
        "<p>Two JSON files. Your own export should hold thousands of events over 30 days; the attack conversion typically yields a few hundred. Both numbers matter — you want far more normal than malicious, because that ratio is what makes the base-rate problem from module 03 real rather than theoretical.</p>",
      expectCode: String.raw`PS> (Get-Content data\baseline.json | ConvertFrom-Json).Count
41883

$ python evtx_to_json.py
skip Empire_uac_bypass.evtx: incomplete chunk header
612 auth events -> data/attack.json`,
      fixes: [
        {
          problem: "Get-WinEvent: No events were found that match the specified selection criteria",
          cause:
            "Either the console is not elevated, or your log has rolled. The default Security log is 20 MB and on a busy machine that can be less than a day.",
          fix:
            "Run PowerShell as Administrator. If it is elevated and still empty, reduce <code>AddDays(-30)</code> to <code>-3</code> and check <code>Get-WinEvent -ListLog Security</code> for the actual record count and retention.",
        },
        {
          problem: "The JSON file is one object rather than an array",
          cause:
            "<code>ConvertTo-Json</code> unwraps a single-element collection. It bites when a narrow time window returns one event.",
          fix:
            "Widen the window, or wrap the pipeline: <code>@(...) | ConvertTo-Json</code>. The <code>@()</code> forces an array.",
        },
        {
          problem: "Out-File wrote UTF-16 and Python chokes",
          cause:
            "Windows PowerShell 5.1 defaults <code>Out-File</code> to UTF-16LE unless told otherwise.",
          fix:
            "The <code>-Encoding utf8</code> above handles it. If you already wrote the file, re-run or read it in Python with <code>encoding='utf-16'</code>.",
        },
        {
          problem: "pip install evtx fails to build",
          cause: "It is a Rust extension; older Python versions may have no prebuilt wheel.",
          fix:
            "Use Python 3.11 or 3.12, where wheels exist. Failing that, install the standalone <code>evtx_dump</code> binary from the same project's releases and pipe its JSON output in.",
        },
      ],
    },
    {
      title: "Load and look before you analyse",
      time: "15 min",
      why: "Every analysis mistake in this project traces back to not knowing what is in the data. Ten minutes of looking now saves an hour of explaining a wrong result later.",
      body:
        "<p>Load both files, then answer four questions before writing any detection logic: what date range do you actually have, which event IDs dominate, how many distinct accounts exist, and <b>what fraction of the volume is machine accounts</b>.</p>" +
        "<p>That last one surprises people. On a domain-joined machine, accounts ending in <code>$</code> and <code>ANONYMOUS LOGON</code> frequently make up more than 80% of authentication events. If you baseline without deciding what to do about them, you are baselining Windows talking to itself.</p>",
      commands: [
        {
          lang: "python",
          label: "explore.py",
          code: String.raw`import pandas as pd

def load(path: str, label: str) -> pd.DataFrame:
    df = pd.read_json(path)
    df["ts"] = pd.to_datetime(df["TimeCreated"], utc=True, format="mixed")
    df["dataset"] = label
    return df

base   = load("data/baseline.json", "baseline")
attack = load("data/attack.json",   "attack")
df     = pd.concat([base, attack], ignore_index=True)

print(f"rows          {len(df):,}")
print(f"range         {df.ts.min()}  ->  {df.ts.max()}")
print(f"\nby event id\n{df.EventID.value_counts()}")
print(f"\ndistinct accounts   {df.TargetUserName.nunique()}")

machine = df.TargetUserName.fillna("").str.endswith("$")
anon    = df.TargetUserName.isin(["ANONYMOUS LOGON", "SYSTEM", "-"])
print(f"machine accounts    {machine.mean():.0%} of rows")
print(f"anonymous/system    {anon.mean():.0%} of rows")
print(f"human-ish remainder {(~machine & ~anon).sum():,} rows")`,
        },
      ],
      expect:
        "<p>Look hard at the last three lines. On a typical corporate laptop the human-attributable share of authentication events is somewhere under 20%, and that is the data your baseline should be built from.</p>",
      expectCode: String.raw`rows          42,495
range         2026-07-04 11:02:19+00:00  ->  2026-08-03 07:41:55+00:00

by event id
4624    31204
4672     8113
4625     2410
4648      768

distinct accounts   47
machine accounts    71% of rows
anonymous/system    9% of rows
human-ish remainder 8,492 rows`,
      fixes: [
        {
          problem: "ValueError parsing TimeCreated",
          cause:
            "The two sources format timestamps differently — PowerShell writes ISO 8601 with an offset, the EVTX parser writes a slightly different variant.",
          fix:
            "<code>format=\"mixed\"</code> above handles it. On older pandas use <code>pd.to_datetime(..., utc=True, errors='coerce')</code> and then check for NaT — a few unparseable rows are fine, a column of them is not.",
        },
        {
          problem: "The attack samples have timestamps from 2019",
          cause: "They do. They were captured years ago and that is not a problem.",
          fix:
            "Baseline per-account, not globally, and never use absolute dates in the scoring. Step 4 uses hour-of-day and day-of-week, both of which survive the gap. If you want them interleaved for realism, shift the attack timestamps forward by a fixed offset and say so in a comment.",
        },
      ],
    },
    {
      title: "Normalise — module 08, applied",
      time: "20 min",
      why: "Two sources, two spellings of everything. Without this step your baseline treats ACME\\jbell and jbell as different people, and both look anomalous because each has half the history.",
      body:
        "<p>Reuse <code>canonical_user</code> from module 08 and add the same treatment for hosts. Then translate logon types from numbers to names — not cosmetic, because the model in step 7 reads these and “LogonType 10” means considerably less to it than “RemoteInteractive (RDP)”.</p>" +
        "<p>The failure-reason mapping matters just as much. <code>SubStatus 0xC0000064</code> (the account does not exist) and <code>0xC000006A</code> (the account exists, wrong password) look identical in a count of 4625s and mean completely different things: the first is enumeration, the second is a password attack against a known account.</p>",
      commands: [
        {
          lang: "python",
          label: "normalise.py",
          code: String.raw`import re
import pandas as pd

LOGON_TYPES = {
    2:  "Interactive (console)",
    3:  "Network (share, RPC)",
    4:  "Batch (scheduled task)",
    5:  "Service",
    7:  "Unlock",
    8:  "NetworkCleartext",
    9:  "NewCredentials (runas /netonly)",
    10: "RemoteInteractive (RDP)",
    11: "CachedInteractive",
}

FAILURE_REASONS = {
    "0xC0000064": "user name does not exist",
    "0xC000006A": "correct user name, bad password",
    "0xC0000234": "account locked out",
    "0xC0000072": "account disabled",
    "0xC000006F": "logon outside permitted hours",
    "0xC0000070": "logon from unauthorised workstation",
    "0xC0000193": "account expired",
    "0xC0000071": "password expired",
    "0xC0000133": "clock skew between client and DC",
}

def canonical_user(raw) -> str | None:
    """Same function as module 08. One representation per identity."""
    if not isinstance(raw, str) or not raw.strip():
        return None
    v = raw.strip().lower()
    if m := re.match(r"^cn=([^,]+)", v):
        v = m.group(1)
    if "\\" in v:
        v = v.split("\\", 1)[1]
    if "@" in v:
        v = v.split("@", 1)[0]
    return v or None

def normalise(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["user"] = out.TargetUserName.map(canonical_user)
    out["actor"] = out.SubjectUserName.map(canonical_user)
    out["host"] = out.Computer.fillna("").str.lower().str.split(".").str[0]

    lt = pd.to_numeric(out.LogonType, errors="coerce")
    out["logon_type"] = lt
    out["logon_name"] = lt.map(LOGON_TYPES).fillna("Unknown")

    sub = out.SubStatus.fillna("").str.upper().str.strip()
    out["failure_reason"] = sub.map(FAILURE_REASONS)

    # Classify the identity. Machine and service accounts need their own
    # baselines - a service account signing in at 03:00 is its job.
    out["is_machine"] = out.user.fillna("").str.endswith("$")
    out["is_system"]  = out.user.isin(["system", "anonymous logon", "-", "local service",
                                       "network service"])
    out["is_human"]   = ~out.is_machine & ~out.is_system & out.user.notna()

    # Time features. Local hour would be better; UTC is honest and consistent.
    out["hour"] = out.ts.dt.hour
    out["dow"]  = out.ts.dt.dayofweek          # 0 = Monday
    out["is_weekend"] = out.dow >= 5

    # Source IP: drop the placeholders Windows uses for local logons
    ip = out.IpAddress.fillna("-")
    out["src_ip"] = ip.where(~ip.isin(["-", "::1", "127.0.0.1", "0.0.0.0"]))
    out["is_remote"] = out.src_ip.notna()

    return out`,
        },
      ],
      expect:
        "<p>Named columns you can read without a lookup table. Sanity-check by printing <code>df.logon_name.value_counts()</code> — if <code>Unknown</code> dominates, <code>LogonType</code> did not survive the conversion and step 4 will produce nonsense.</p>",
      expectCode: String.raw`>>> df.logon_name.value_counts()
Network (share, RPC)         18442
Interactive (console)         6021
Service                       4180
RemoteInteractive (RDP)       1893
NewCredentials (runas)         214
Unknown                         12

>>> df[df.EventID == 4625].failure_reason.value_counts()
correct user name, bad password    1902
user name does not exist            388
account locked out                   77`,
      fixes: [
        {
          problem: "logon_name is almost entirely Unknown",
          cause:
            "<code>LogonType</code> arrived as a nested object rather than a scalar, which happens with some EVTX parsers.",
          fix:
            "<code>print(df.LogonType.head(20))</code>. If you see dicts, the field is under a <code>#text</code> key — extract it in the converter rather than patching downstream.",
        },
        {
          problem: "failure_reason is empty for every 4625",
          cause:
            "Some sources populate <code>Status</code> and leave <code>SubStatus</code> as <code>0x0</code>. Both fields exist and different producers use them differently.",
          fix:
            "Fall back: <code>sub = out.SubStatus.where(out.SubStatus.ne('0x0'), out.Status)</code> before the mapping.",
        },
      ],
    },
    {
      title: "Build the baseline — no model, and this is the point",
      time: "30 min",
      why: "This is the heart of the project. Everything an anomaly means is defined here, and there is not a single line of AI in it.",
      body:
        "<p>For each human account, record what it normally does: which hosts, which logon types, which hours, how many failures a day, whether it ever authenticates remotely.</p>" +
        "<p><b>The sparse-account guard is mandatory.</b> Module 03 covers why: an account with four logons in its history has no meaningful distribution, so every subsequent logon is “unusual”. Without the guard your top anomalies will be, in order, every new starter, every contractor, and every account that came back from parental leave. That is not a hunt, it is an HR report.</p>" +
        "<p>Note also that the baseline is built from the <b>baseline period only</b>. Fitting it over data containing the attack teaches the model that the attack is normal — the classic contaminated-training-set mistake, and it is easy to make by accident when both datasets are in one dataframe.</p>",
      commands: [
        {
          lang: "python",
          label: "baseline.py",
          code: String.raw`import numpy as np
import pandas as pd

MIN_EVENTS = 30      # below this, no distribution worth the name
MIN_DAYS   = 7       # and it must span real time, not one busy afternoon

def build_baseline(df: pd.DataFrame) -> tuple[dict, list[str]]:
    """Per-account profile of normal. Statistics, not inference.

    Returns the profiles plus the accounts excluded as too sparse - the
    exclusion list is not a footnote, it is what stops this flagging
    every new joiner.
    """
    humans = df[df.is_human]
    profiles, sparse = {}, []

    for user, g in humans.groupby("user"):
        span_days = (g.ts.max() - g.ts.min()).total_seconds() / 86400

        if len(g) < MIN_EVENTS or span_days < MIN_DAYS:
            sparse.append(user)
            continue

        ok = g[g.EventID == 4624]
        daily_fail = (g[g.EventID == 4625]
                      .groupby(g.ts.dt.date).size()
                      .reindex(pd.date_range(g.ts.min(), g.ts.max(), freq="D").date,
                               fill_value=0))

        profiles[user] = {
            "events": len(g),
            "span_days": round(span_days, 1),
            "hosts": set(ok.host.dropna()),
            "logon_types": set(ok.logon_type.dropna().astype(int)),
            "src_ips": set(ok.src_ip.dropna()),
            "hour_mean": ok.hour.mean(),
            "hour_std": max(ok.hour.std(), 1.0),   # floor: a std of 0 makes
                                                    # every z-score infinite
            "hours_seen": set(ok.hour.unique()),
            "weekend_rate": ok.is_weekend.mean(),
            "remote_rate": ok.is_remote.mean(),
            "fail_mean": daily_fail.mean(),
            "fail_std": max(daily_fail.std(), 1.0),
        }

    return profiles, sparse

# CRITICAL: fit on the baseline period only.
train = df[(df.dataset == "baseline") & (df.ts < df.ts.max() - pd.Timedelta(days=3))]
profiles, sparse = build_baseline(train)

print(f"profiled  {len(profiles)} accounts")
print(f"excluded  {len(sparse)} as too sparse: {sparse[:8]}")
print(f"\nexample - {list(profiles)[0]}")
for k, v in profiles[list(profiles)[0]].items():
    print(f"  {k:14} {v}")`,
        },
      ],
      expect:
        "<p>A profile per account and an explicit exclusion list. Read one profile carefully — <code>hour_mean</code> 13.4 with <code>hour_std</code> 3.1 says a working day; <code>remote_rate</code> 0.02 says this account almost never authenticates from off-box, which makes the exceptions worth looking at.</p>",
      expectCode: String.raw`profiled  19 accounts
excluded  9 as too sparse: ['contractor.mk', 'svc_backup_new', 'jdoe']

example - jbell
  events         3182
  span_days      27.0
  hosts          {'wks-4471'}
  logon_types    {2, 3, 7}
  src_ips        {'10.14.2.88'}
  hour_mean      13.42
  hour_std       3.11
  hours_seen     {7,8,9,10,11,12,13,14,15,16,17,18,19}
  weekend_rate   0.04
  remote_rate    0.02
  fail_mean      0.9
  fail_std       1.4`,
      fixes: [
        {
          problem: "Every account is excluded as sparse",
          cause: "Your export covers less than 7 days, or the log rolled.",
          fix:
            "Lower <code>MIN_DAYS</code> to match what you actually have and note it in a comment. Do not lower <code>MIN_EVENTS</code> below about 20 — the thresholds are what make the scores mean anything, and quietly weakening them to get output is how a hunt becomes theatre.",
        },
        {
          problem: "hour_std is 0 for some accounts",
          cause:
            "A service-like account that only ever authenticates at one hour. Division by zero makes every z-score infinite.",
          fix:
            "The <code>max(..., 1.0)</code> floor above handles it. It is worth understanding rather than copying: it says “treat perfectly regular accounts as having at least an hour of natural variation”, which is a judgement, and a defensible one.",
        },
      ],
    },
    {
      title: "Score the deviations — arithmetic, still no model",
      time: "25 min",
      why: "Each signal on its own is noisy. Combined, and with the account's own history as the reference rather than a global average, they get useful — and every score decomposes into reasons a human can read.",
      body:
        "<p>Six signals, weighted, with a reason string attached to each. The reason strings are not for display: they become the model's input in step 7, which is why the score is <b>explainable by construction</b> rather than a number you have to trust.</p>" +
        "<p>Weights are judgement, not science. A new host is weighted higher than an odd hour because in practice it is a stronger signal; if your environment disagrees, change it and record why. Someone will ask.</p>",
      commands: [
        {
          lang: "python",
          label: "score.py",
          code: String.raw`import numpy as np
import pandas as pd

WEIGHTS = {
    "new_host":       3.0,   # strongest single signal in most environments
    "new_logon_type": 2.5,   # esp. 10 (RDP) or 9 (runas) on a type-2 account
    "new_src_ip":     2.0,
    "odd_hour":       1.5,
    "weekend":        1.0,
    "failure_spike":  2.0,
}

def score_events(df: pd.DataFrame, profiles: dict) -> pd.DataFrame:
    rows = []

    for _, e in df[df.is_human].iterrows():
        p = profiles.get(e.user)
        if p is None:
            continue          # unprofiled: excluded above, not scored here

        s, why = 0.0, []

        if e.host and e.host not in p["hosts"]:
            s += WEIGHTS["new_host"]
            why.append(f"host {e.host} never seen for this account "
                       f"(known: {sorted(p['hosts'])})")

        if pd.notna(e.logon_type) and int(e.logon_type) not in p["logon_types"]:
            s += WEIGHTS["new_logon_type"]
            why.append(f"logon type {int(e.logon_type)} "
                       f"({e.logon_name}) never used by this account")

        if e.src_ip and e.src_ip not in p["src_ips"]:
            s += WEIGHTS["new_src_ip"]
            why.append(f"source IP {e.src_ip} not in this account's history")

        z = abs(e.hour - p["hour_mean"]) / p["hour_std"]
        if z > 2.5 and e.hour not in p["hours_seen"]:
            s += WEIGHTS["odd_hour"]
            why.append(f"hour {e.hour:02d}:00 UTC is {z:.1f} sigma from this "
                       f"account's mean of {p['hour_mean']:.1f}")

        if e.is_weekend and p["weekend_rate"] < 0.05:
            s += WEIGHTS["weekend"]
            why.append(f"weekend activity; this account is on a weekday "
                       f"pattern ({p['weekend_rate']:.0%} weekend historically)")

        rows.append({
            "ts": e.ts, "user": e.user, "host": e.host,
            "event_id": e.EventID, "logon_name": e.logon_name,
            "src_ip": e.src_ip, "failure_reason": e.failure_reason,
            "source_file": getattr(e, "source_file", None),
            "score": round(s, 1),
            "reasons": why,
        })

    out = pd.DataFrame(rows)
    return out[out.score > 0].sort_values("score", ascending=False)

scored = score_events(df, profiles)

print(f"scored events above zero : {len(scored):,} of {df.is_human.sum():,}")
print(f"score >= 5               : {(scored.score >= 5).sum():,}")
print(f"score >= 7               : {(scored.score >= 7).sum():,}")
print("\ntop 5:")
for _, r in scored.head(5).iterrows():
    print(f"\n  {r.score}  {r.user}@{r.host}  {r.ts:%Y-%m-%d %H:%M}  {r.logon_name}")
    for w in r.reasons:
        print(f"      - {w}")`,
        },
      ],
      expect:
        "<p>A ranked list where every score decomposes into readable reasons. Note the reduction: tens of thousands of human events down to a few hundred with any score at all, and a few dozen above 5. That funnel is the project.</p>",
      expectCode: String.raw`scored events above zero : 1,204 of 8,492
score >= 5               : 88
score >= 7               : 31

top 5:

  9.5  jbell@dc-01  2026-08-01 03:12  RemoteInteractive (RDP)
      - host dc-01 never seen for this account (known: ['wks-4471'])
      - logon type 10 (RemoteInteractive (RDP)) never used by this account
      - source IP 10.14.9.203 not in this account's history
      - hour 03:00 UTC is 3.3 sigma from this account's mean of 13.4

  8.5  msmith@srv-file02  2026-08-01 03:14  Network (share, RPC)
      - host srv-file02 never seen for this account (known: ['wks-2210'])
      - logon type 3 (Network (share, RPC)) never used by this account
      - source IP 10.14.9.203 not in this account's history`,
      fixes: [
        {
          problem: "Thousands of events score above 5",
          cause:
            "Almost always a contaminated baseline — the training slice included the attack window, or it is too short to have seen normal variety.",
          fix:
            "Print <code>train.ts.min()</code> and <code>train.ts.max()</code> and confirm the attack period is genuinely outside it. Second most common cause: your own machine legitimately changed, e.g. you started using a new laptop mid-window.",
        },
        {
          problem: "The known attack events score zero",
          cause:
            "The account performing them is not in <code>profiles</code> — often because the attack samples use accounts that appear nowhere in your baseline.",
          fix:
            "Real and important. An account with no history cannot be scored against its history, and the answer is a different control: alert on <b>first-ever authentication</b> for an unknown account. Add that as a separate rule rather than bending the baseline, and note that you found the gap — it is a good thing to have found.",
        },
        {
          problem: "iterrows() is slow on a large dataframe",
          cause: "It is. Row-wise iteration in pandas is the slow path, deliberately used here for readability.",
          fix:
            "Fine up to a few hundred thousand rows. Beyond that, vectorise the set-membership checks with <code>.map()</code> and merges. Get it correct first; the readable version is what you will still understand in six months.",
        },
      ],
    },
    {
      title: "Cluster the survivors — embeddings, still no LLM",
      time: "20 min",
      why: "One lateral movement burst produces forty near-identical scored events. Sending forty to a model wastes context and gets you a summary of forty things rather than an analysis of one.",
      body:
        "<p>Module 09's dedup, applied. Build a signature per scored event that captures <i>what happened</i> and deliberately omits what always varies — timestamp, PID, session ID — then cluster on the embeddings of those signatures.</p>" +
        "<p>Worth being clear about what an embedding model is: it produces vectors, not text. It is a neural network but it is not a language model in the sense the rest of this path means, and it does not hallucinate, because it never generates anything. This step is still firmly on the deterministic side of the line.</p>",
      commands: [
        {
          lang: "python",
          label: "cluster.py",
          code: String.raw`import numpy as np, ollama
from sklearn.cluster import DBSCAN

def signature(r) -> str:
    """What happened, with the always-varying parts removed."""
    return (f"{r.user} {r.host} {r.logon_name} "
            f"{r.failure_reason or 'success'} {' '.join(r.reasons)}")

def cluster(scored, threshold: float = 5.0, eps: float = 0.12):
    hot = scored[scored.score >= threshold].copy()
    if hot.empty:
        return hot

    sigs = [signature(r) for _, r in hot.iterrows()]
    vecs = np.array([
        ollama.embeddings(model="nomic-embed-text", prompt=s)["embedding"]
        for s in sigs
    ])

    hot["cluster"] = DBSCAN(eps=eps, min_samples=2,
                            metric="cosine").fit_predict(vecs)
    return hot

hot = cluster(scored)

# -1 is DBSCAN's noise label: events like nothing else. Often the best ones.
groups = []
for cid, g in hot.groupby("cluster"):
    if cid == -1:
        for _, r in g.iterrows():            # singletons stay individual
            groups.append({"kind": "singleton", "n": 1,
                           "max_score": r.score, "events": [r]})
    else:
        groups.append({"kind": "cluster", "n": len(g),
                       "max_score": g.score.max(),
                       "events": [r for _, r in g.iterrows()]})

groups.sort(key=lambda x: (-x["max_score"], -x["n"]))
print(f"{len(hot)} scored events -> {len(groups)} things to look at")
for gr in groups[:6]:
    e = gr["events"][0]
    print(f"  [{gr['kind']:9}] n={gr['n']:<3} max={gr['max_score']:<5} "
          f"{e.user}@{e.host} {e.logon_name}")`,
        },
      ],
      expect:
        "<p>The final reduction. On my run, 88 scored events became 21 things to look at — and those 21 are what the model sees. Everything before this step ran on your CPU in seconds and cost nothing.</p>",
      expectCode: String.raw`88 scored events -> 21 things to look at
  [cluster  ] n=14  max=9.5   jbell@dc-01 RemoteInteractive (RDP)
  [cluster  ] n=9   max=8.5   msmith@srv-file02 Network (share, RPC)
  [singleton] n=1   max=7.5   svc_sql@srv-app01 NewCredentials (runas)
  [cluster  ] n=6   max=6.0   jbell@wks-4471 Interactive (console)
  [singleton] n=1   max=5.5   admin.fk@dc-01 RemoteInteractive (RDP)`,
      fixes: [
        {
          problem: "Every event is a singleton (cluster -1)",
          cause: "<code>eps</code> too tight, or the signatures include something unique per event.",
          fix:
            "Print a few signatures and check no timestamp or session ID leaked in. Then raise <code>eps</code> to 0.2 and re-run. Module 09's advice applies: tune by reading the clusters, not by theory.",
        },
        {
          problem: "Everything collapses into one cluster",
          cause: "<code>eps</code> far too loose. This is the dangerous direction — distinct incidents merge and you analyse one instead of three.",
          fix:
            "Drop to 0.08 and check that events you would triage differently are in different clusters. When in doubt, err tight: over-clustering hides things, under-clustering only costs you tokens.",
        },
        {
          problem: "ollama.embeddings raises model not found",
          cause: "The embedding model is a separate pull from the chat model.",
          fix: "<code>ollama pull nomic-embed-text</code>. It is about 270 MB.",
        },
      ],
    },
    {
      title: "Now the model — one call, on twenty things",
      time: "25 min",
      why: "This is the only inference in the project, and by the time it runs the hard work is done. Its job is to say what these clusters mean together, which is the one thing the arithmetic cannot do.",
      body:
        "<p>Give it the clusters with their scores and reasons — not the raw events. Same contract as before, with one addition specific to hunting: <code>attack_hypothesis</code>, which asks it to name what this would be <i>if</i> it were malicious, explicitly as a hypothesis rather than a verdict.</p>" +
        "<p>That framing matters. A hunt does not produce verdicts, it produces leads. A model asked for a verdict on ambiguous data will manufacture certainty; a model asked for a hypothesis and its disconfirming evidence produces something an analyst can actually use.</p>",
      commands: [
        {
          lang: "python",
          label: "narrate.py — schema",
          code: String.raw`from typing import Literal
from pydantic import BaseModel, Field

class Finding(BaseModel):
    title: str
    severity: Literal["informational", "low", "medium", "high"]
    what_happened: str = Field(
        description="Plain-English account of the observed activity")
    why_unusual: list[str] = Field(
        description="Copied EXACTLY from the cluster's reasons list")
    attack_hypothesis: str | None = Field(
        default=None,
        description="What this WOULD be if malicious. A hypothesis, not a verdict.")
    benign_explanation: str | None = Field(
        default=None,
        description="The most likely innocent explanation. Always attempt one.")
    disconfirming_check: str = Field(
        description="One specific check that would rule the hypothesis OUT")
    next_steps: list[str]

class HuntReport(BaseModel):
    summary: str = Field(description="Two sentences for a shift handover")
    findings: list[Finding]
    correlations: list[str] = Field(
        default_factory=list,
        description="Links BETWEEN findings - the thing per-alert triage misses")
    unsupported_observations: list[str] = Field(default_factory=list)`,
        },
        {
          lang: "python",
          label: "narrate.py — the call",
          code: String.raw`import json, ollama

SYSTEM = """You are a threat hunter reviewing anomaly clusters from Windows
authentication logs.

Each cluster was scored by deterministic code against a per-account
baseline of normal behaviour. The "reasons" are facts computed from that
baseline, not opinions. Do not re-derive them and do not contradict them.

For every entry in "why_unusual", copy a string from that cluster's
"reasons" list EXACTLY. Do not paraphrase.

You are hunting, not adjudicating. For each finding give an attack
hypothesis AND the most plausible benign explanation, then one specific
check that would DISCONFIRM the hypothesis. A finding with no
disconfirming check is not a finding.

Pay particular attention to correlations between clusters: the same
source IP across accounts, or a sequence of accounts on one host, is
more significant than any single cluster."""

def to_payload(groups, limit=20):
    out = []
    for i, gr in enumerate(groups[:limit]):
        e = gr["events"][0]
        out.append({
            "cluster_id": i,
            "event_count": gr["n"],
            "max_score": float(gr["max_score"]),
            "user": e.user, "host": e.host,
            "logon_type": e.logon_name,
            "src_ip": e.src_ip,
            "first_seen": str(min(x.ts for x in gr["events"])),
            "last_seen": str(max(x.ts for x in gr["events"])),
            "failure_reason": e.failure_reason,
            "reasons": list(e.reasons),
        })
    return out

payload = to_payload(groups)

resp = ollama.chat(
    model="llama3.1:8b",
    format=HuntReport.model_json_schema(),
    options={"temperature": 0},
    messages=[
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": "ANOMALY CLUSTERS:\n" +
                                    json.dumps(payload, indent=2)},
    ],
)
report = HuntReport.model_validate_json(resp["message"]["content"])`,
        },
        {
          lang: "python",
          label: "narrate.py — grounding, adapted for lists",
          code: String.raw`class GroundingError(Exception):
    pass

def assert_grounded(report: HuntReport, payload: list[dict]) -> None:
    """Every why_unusual must be a verbatim reason from some cluster."""
    allowed = {r for c in payload for r in c["reasons"]}

    for f in report.findings:
        for w in f.why_unusual:
            if w.strip() not in {a.strip() for a in allowed}:
                raise GroundingError(
                    f"Finding {f.title!r} cites a reason that no cluster "
                    f"produced:\n  {w!r}\n"
                    f"The model wrote its own justification. Reject.")

assert_grounded(report, payload)
print(f"grounded - {sum(len(f.why_unusual) for f in report.findings)} "
      f"citations verified across {len(report.findings)} findings")`,
        },
      ],
      expect:
        "<p>A hunt report. The <code>correlations</code> field is where the value is — noticing that two accounts on different hosts share a source IP within two minutes is exactly the connection per-alert triage cannot make and a human reviewing 88 rows would probably miss.</p>",
      expectCode: String.raw`{
  "summary": "Two accounts authenticated to systems neither has used before,
              from a single source IP, within a three-minute window at 03:12
              UTC. The pattern is consistent with lateral movement using
              harvested credentials.",
  "findings": [
    {
      "title": "jbell RDP to a domain controller outside all baselines",
      "severity": "high",
      "what_happened": "The account jbell authenticated to dc-01 over RDP at
                        03:12 UTC. This account has only ever used one host,
                        only interactive and network logons, and its activity
                        centres on the working day.",
      "why_unusual": [
        "host dc-01 never seen for this account (known: ['wks-4471'])",
        "logon type 10 (RemoteInteractive (RDP)) never used by this account",
        "hour 03:00 UTC is 3.3 sigma from this account's mean of 13.4"
      ],
      "attack_hypothesis": "Credential theft followed by interactive lateral
                            movement to a domain controller.",
      "benign_explanation": "jbell was granted administrative duties recently
                             and performed scheduled out-of-hours maintenance.",
      "disconfirming_check": "Check for a change ticket covering dc-01 in the
                              03:00-04:00 window, and confirm whether jbell was
                              added to an administrative group in the preceding
                              7 days.",
      "next_steps": [
        "Pull 4688 process creation on dc-01 for this session",
        "Check 4672 for which privileges were assigned",
        "Confirm the source 10.14.9.203 is an expected jump host"
      ]
    }
  ],
  "correlations": [
    "10.14.9.203 is the source for both the jbell and msmith clusters, two
     minutes apart, and appears in neither account's history. One host
     authenticating as multiple users in quick succession is the strongest
     signal in this dataset."
  ],
  "unsupported_observations": [
    "03:12 UTC is outside working hours, but no timezone for this account's
     location was available so this may be a local working hour"
  ]
}`,
      fixes: [
        {
          problem: "GroundingError on a why_unusual that reads almost right",
          cause:
            "The model tidied the string — dropped the bracket list, or rewrote sigma as σ. Exactly the paraphrasing project 01 was built to catch.",
          fix:
            "Do not loosen the check. Add “copy the string character for character, including punctuation and brackets” to the prompt. If it persists on your model, that is a finding worth recording.",
        },
        {
          problem: "It returns no correlations at all",
          cause: "Cross-cluster reasoning is harder than per-cluster and smaller models often skip it.",
          fix:
            "Two options, and both are legitimate. Precompute the obvious correlations in code — shared source IP, shared host, overlapping time window — and put them in the payload as facts. Or make a second, dedicated call whose only job is correlation. The first is cheaper and more reliable; the second is more interesting.",
        },
        {
          problem: "Every finding is severity high",
          cause: "Uncalibrated, and the default failure mode. Everything you handed it was already anomalous.",
          fix:
            "Anchor the scale in the prompt as module 09 describes, and include a few <b>low-scoring</b> clusters in the payload. Given only outliers, a model has no contrast to calibrate against.",
        },
      ],
    },
    {
      title: "Check it against the attack samples, and against yourself",
      time: "30 min",
      why: "You have two ground truths available, and using both is what turns this from a script into an evaluated system.",
      body:
        "<p><b>Did it find the known attacks?</b> The EVTX-ATTACK-SAMPLES events carry their <code>source_file</code>, which names the technique. Check whether those events reached the model's input at all — recall matters more than the narrative quality, because a beautiful report on the wrong twenty clusters is worthless.</p>" +
        "<p><b>What did it flag on your own machine?</b> You know the ground truth for your own laptop. Every finding there is a false positive by definition, and reading them tells you what your baseline is missing.</p>",
      commands: [
        {
          lang: "python",
          label: "evaluate.py",
          code: String.raw`# Recall: how much of the known-malicious set survived the funnel?
attack_events = df[df.dataset == "attack"]
attack_scored = scored[scored.source_file.notna()]
reached_model = {e.source_file for gr in groups[:20] for e in gr["events"]
                 if getattr(e, "source_file", None)}

print("RECALL")
print(f"  attack events in data      {len(attack_events)}")
print(f"  scored above zero          {len(attack_scored)}")
print(f"  technique files present    {attack_events.source_file.nunique()}")
print(f"  technique files surfaced   {len(reached_model)}")
for f in sorted(set(attack_events.source_file) - reached_model):
    print(f"    MISSED: {f}")

# Precision proxy: findings on your own machine, where you know the truth
print("\nFALSE POSITIVES (your own machine)")
own = [gr for gr in groups[:20]
       if all(getattr(e, "source_file", None) is None for e in gr["events"])]
print(f"  {len(own)} of the top 20 clusters are from your own baseline data")
for gr in own:
    e = gr["events"][0]
    print(f"    {e.score}  {e.user}@{e.host} {e.logon_name} @ {e.ts:%H:%M}")
    for r in e.reasons[:2]:
        print(f"        {r}")`,
        },
      ],
      expect:
        "<p>Two numbers you can defend in an interview. Misses are not failures — they are the honest boundary of what a baseline approach detects, and being able to name that boundary is the senior version of this answer.</p>",
      expectCode: String.raw`RECALL
  attack events in data      612
  scored above zero          104
  technique files present    23
  technique files surfaced   11
    MISSED: 4624_TGT_Kerberos_pass_the_ticket.evtx
    MISSED: 4776_NTLM_relay.evtx

FALSE POSITIVES (your own machine)
  4 of the top 20 clusters are from your own baseline data
    6.0  jbell@wks-4471 Interactive (console) @ 22:41
        hour 22:00 UTC is 2.8 sigma from this account's mean of 13.4
    5.5  jbell@wks-4471 Network (share, RPC) @ 08:02
        source IP 10.14.7.12 not in this account's history`,
      fixes: [
        {
          problem: "Recall is under 50%",
          cause:
            "Usually structural rather than a bug: the attack accounts have no baseline, so nothing could score them. Sometimes the technique simply is not visible in 4624/4625/4648 at all.",
          fix:
            "Diagnose which. Check whether the missed accounts appear in <code>profiles</code>. If they do not, you have found the first-authentication gap from step 5's fixes — a real limitation to state rather than hide. Kerberos-specific techniques often need 4768/4769/4771, which this project does not collect, and saying so is a better answer than a higher number.",
        },
        {
          problem: "Your own late-night logon is flagged",
          cause: "You worked late. The baseline is correct and the alert is correct; the disposition is benign.",
          fix:
            "This is the difference between an anomaly and a threat, and it is worth internalising rather than tuning away. Two useful responses: require two or more signals before an event enters the top clusters, or weight time-based signals lower than host and logon-type signals. Try both and compare recall — you will lose some, and knowing how much is the point.",
        },
      ],
    },
  ],
  after: [
    "Write down the funnel with your own numbers: events in, scored, clustered, sent to the model. It is a single line and it is the most quotable thing you will produce on this path.",
    "Keep the baseline as a pickle or Parquet file, dated. Re-fitting it every run means it slowly absorbs the anomalies, which is how these systems quietly stop working.",
    "Add 4768/4769/4771 to the collection and re-measure recall. The Kerberos misses from step 9 should partly close, and you will have a before-and-after.",
    "Project 04 replaces the hand-written reasons with retrieved runbook context. Project 10 turns the evaluation in step 9 into a real harness with a golden dataset.",
  ],
  enterprise: [
    {
      platform: "Microsoft Sentinel UEBA",
      body:
        "<p>Does the baselining for you — <code>BehaviorAnalytics</code> gives per-entity scores and <code>IdentityInfo</code> supplies the context you built by hand. You gain scale and lose visibility: the score is a number whose derivation you cannot inspect. Having built this by hand is exactly what lets you ask the right question of it, which is “what does this score actually measure?” — module 03's internal annex.</p>",
    },
    {
      platform: "Splunk UBA / Enterprise Security",
      body:
        "<p>ES risk-based alerting is the same funnel with different vocabulary: risk rules attach scores to entities, and you alert when accumulated risk crosses a threshold. Your weighted signals map almost one-to-one onto risk rules. The transferable insight is that RBA is not magic — it is this, with a UI and someone else's weights.</p>",
    },
    {
      platform: "CrowdStrike Identity Protection",
      body:
        "<p>Baselines authentication at the identity layer including Kerberos, which covers exactly the techniques step 9 shows this project missing. Worth naming that gap explicitly in an interview — “my baseline approach missed pass-the-ticket because I collected the wrong event IDs, which is the class of problem identity-layer products exist for” is a much stronger answer than a clean recall number.</p>",
    },
  ],
  cloudApi:
    "<p>The economics here are unusually clear, and worth stating precisely. Sending 42,000 events to a hosted API at roughly 300 tokens each is about 12.6 million tokens — tens of dollars per run, minutes of latency, and a worse answer, because a model has no notion of how often something normally happens. Sending 20 clusters is about 4,000 tokens, well under a cent.</p><p>That is not an argument against hosted models. It is an argument for <b>where in the pipeline they go</b>. If you want better narrative quality at step 7, use a frontier model there — the clusters contain usernames and hostnames but no credentials or content, so the module 05 conversation is short and winnable. Steps 4 to 6 should never go near an API regardless of budget, because arithmetic does not need inference.</p>",
};
