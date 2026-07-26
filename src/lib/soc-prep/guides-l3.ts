/**
 * SOC-prep L3 guides, projects 09–12. These are programme-level rather than
 * tool-level: the deliverable is usually a document, a process, or a pipeline
 * rather than a single working script.
 */
import type { ProjectGuide } from "@/lib/guides/types";

/* -------------------------------------------------------------------------- */
/* 09 — Purple team exercise and coverage map                                  */
/* -------------------------------------------------------------------------- */

export const g09: ProjectGuide = {
  slug: "purple-team-coverage-map",
  projectId: 9,
  intro:
    "<p>Everyone claims their detections work. A purple team exercise is how you find out. You run a known attack technique deliberately, and check whether your tooling saw it — and then you fix what did not.</p><p>&ldquo;Purple&rdquo; because it merges red (attack) and blue (defend) into one loop instead of two competing teams. The output is not a pass/fail grade. It is a <b>coverage map</b>: a table showing, technique by technique, whether you have data, whether you have a detection, and whether that detection actually fired.</p><p>This is the single most senior-looking artefact in the whole kit. Most SOCs have never built one properly, and being able to describe how you would is a strong signal.</p>",
  glossary: [
    {
      term: "Purple team",
      plain:
        "Attack and defence working together in the same room, with the explicit goal of improving detection rather than proving a point.",
    },
    {
      term: "Atomic Red Team",
      plain:
        "A free library of small, single-technique attack tests mapped to MITRE ATT&CK. Each one is a few commands with a documented cleanup step.",
    },
    {
      term: "Coverage",
      plain:
        "Has three levels, and conflating them is the classic mistake. <b>Data coverage</b>: are the logs even collected? <b>Detection coverage</b>: does a rule exist? <b>Validated coverage</b>: has it been proven to fire?",
    },
    {
      term: "Detection gap",
      plain:
        "A technique an attacker could use that you would not see. Every environment has them; mature teams know what theirs are.",
    },
    {
      term: "Telemetry",
      plain: "The raw log and event data your detections read. No telemetry, no detection — ever.",
    },
  ],
  before: [
    "<b>Projects 01, 02 and 05 finished.</b> You need a lab, a working detection, and a Sigma rule set.",
    "Snapshots of every VM. Atomic tests deliberately modify systems.",
    "About 8 hours, best split across two sessions.",
  ],
  steps: [
    {
      title: "Choose what you are testing, and write it down first",
      time: "40 min",
      why: "An exercise without a defined scope becomes an afternoon of running random tools. Choosing the techniques in advance is what makes the results measurable.",
      body: "<p>Pick 10–12 techniques covering the whole attack lifecycle rather than a dozen variations of one thing. A reasonable starter set:</p><ul><li><b>Initial Access</b> — T1566.001 Spearphishing Attachment</li><li><b>Execution</b> — T1059.001 PowerShell, T1059.003 Windows Command Shell</li><li><b>Persistence</b> — T1547.001 Registry Run Key, T1053.005 Scheduled Task</li><li><b>Privilege Escalation</b> — T1548.002 Bypass UAC</li><li><b>Defense Evasion</b> — T1070.001 Clear Windows Event Logs, T1027 Obfuscated Files</li><li><b>Credential Access</b> — T1003.001 LSASS Memory, T1110.001 Password Guessing</li><li><b>Discovery</b> — T1087.002 Domain Account Discovery, T1018 Remote System Discovery</li><li><b>Lateral Movement</b> — T1021.002 SMB/Admin Shares</li></ul><p>Create your tracking sheet <b>before</b> you run anything, with a row per technique and columns for: data source expected, log present (Y/N), detection exists (Y/N), detection fired (Y/N), time to detect, notes.</p>",
      expect:
        "<p>An empty coverage matrix. Filling it in honestly is the entire project — including the rows that come back N/N/N.</p>",
      expectCode:
        "Technique   Name                    Data?  Rule?  Fired?  TTD    Notes\nT1059.001   PowerShell              ?      ?      ?       ?\nT1547.001   Registry Run Key        ?      ?      ?       ?\nT1070.001   Clear Event Logs        ?      ?      ?       ?",
    },
    {
      title: "Install Atomic Red Team",
      time: "30 min",
      warn: "Only on lab machines with a snapshot. These tests genuinely modify the system — that is the point.",
      body: "<p>Atomic Red Team gives you a documented, repeatable test per technique, which is what makes results comparable across runs.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim, as Administrator",
          label: "Install the framework and the atomics",
          code: "Set-ExecutionPolicy Bypass -Scope Process -Force\n\nIEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing)\n\nInstall-AtomicRedTeam -getAtomics -Force\nImport-Module invoke-atomicredteam -Force",
        },
        {
          lang: "powershell",
          label: "See what a test does BEFORE running it",
          code: "Invoke-AtomicTest T1059.001 -ShowDetailsBrief\n\n# Full detail, including the cleanup command:\nInvoke-AtomicTest T1059.001 -ShowDetails",
        },
      ],
      expect:
        "<p>A list of numbered tests for the technique with a one-line description of each. Always read this before executing — some atomics are far more invasive than others, and a few will disable security tooling.</p>",
      expectCode:
        "PathToAtomicsFolder = C:\\AtomicRedTeam\\atomics\n\nT1059.001-1 Mimikatz\nT1059.001-2 Run BloodHound from local disk\nT1059.001-3 Run Bloodhound from memory using download cradle",
      fixes: [
        {
          problem: "The install script fails with a TLS error",
          cause: "Older Windows defaults to TLS 1.0, which GitHub rejects.",
          fix: "Run <code>[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12</code> first, then retry.",
        },
        {
          problem: "Defender deletes the atomics folder",
          cause: "Working as intended — many atomics are genuinely malicious techniques.",
          fix: "Add an exclusion for <code>C:\\AtomicRedTeam</code>, or disable real-time protection <b>on this lab VM only</b>. Note in your results that you did, because it affects what your detections would have caught.",
        },
      ],
    },
    {
      title: "Check data coverage before running anything",
      time: "45 min",
      why: "This is the step that reorders most people's priorities. There is no point tuning a detection for a technique whose logs you do not collect — and you will usually find several.",
      body: "<p>For each technique, work out which log source would record it, then verify that source is actually reaching Splunk.</p>",
      commands: [
        {
          lang: "spl",
          label: "What data do you have at all?",
          code: "index=main earliest=-24h\n| stats count by sourcetype, host\n| sort - count",
        },
        {
          lang: "spl",
          label: "Do you have the specific events each technique needs?",
          code: "index=main earliest=-7d\n| eval capability = case(\n    EventCode==4688, \"T1059 — process creation\",\n    EventCode==4657, \"T1547 — registry modification\",\n    EventCode==1102, \"T1070 — log clearing\",\n    EventCode==4698, \"T1053 — scheduled task\",\n    EventCode==4624 OR EventCode==4625, \"T1110 — logon events\",\n    EventCode==7045, \"T1021 — service install\",\n    1==1, null())\n| search capability=*\n| stats count, latest(_time) as last_seen by capability\n| convert ctime(last_seen)",
        },
      ],
      expect:
        "<p>Gaps appear immediately. Almost every home lab is missing Sysmon, which means no detailed process, network, or file-creation telemetry. Record each gap as a row in the matrix with <b>Data? = N</b> — you have just found your highest-priority work, before running a single attack.</p>",
      fixes: [
        {
          problem: "Almost nothing appears in the capability list",
          cause: "Only basic Windows auditing is on.",
          fix: "Install Sysmon with a good config — it is the single highest-value change you can make to a lab: <code>Invoke-WebRequest https://download.sysinternals.com/files/Sysmon.zip -OutFile s.zip; Expand-Archive s.zip; .\\Sysmon\\Sysmon64.exe -accepteula -i sysmonconfig.xml</code> using SwiftOnSecurity's public config. Then forward <code>WinEventLog://Microsoft-Windows-Sysmon/Operational</code>.",
        },
      ],
    },
    {
      title: "Run the tests one at a time, and record the clock",
      time: "90 min",
      why: "One at a time, with the exact timestamp noted, is what makes attribution possible. Run five tests together and you cannot tell which alert belongs to which.",
      body: "<p>For every technique, follow the same loop: note the time, run the test, wait two minutes, search for evidence, record the result, run the cleanup.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "The loop, for one technique",
          code: "$t = 'T1547.001'\n$start = Get-Date\nWrite-Host \"=== $t started at $start ===\" -ForegroundColor Cyan\n\nInvoke-AtomicTest $t -TestNumbers 1\n\nStart-Sleep -Seconds 120\nWrite-Host \"=== search Splunk from $start ===\" -ForegroundColor Cyan\n\n# Always clean up before the next test\nInvoke-AtomicTest $t -TestNumbers 1 -Cleanup",
        },
        {
          lang: "spl",
          label: "Did anything land? (adjust the time to your test)",
          code: "index=main earliest=\"07/26/2026:15:00:00\" latest=\"07/26/2026:15:05:00\"\n| stats count by EventCode, host\n| sort - count",
        },
        {
          lang: "spl",
          label: "Did your Sigma rules from project 05 fire?",
          code: "index=_audit action=alert_fired earliest=-1h\n| table _time, ss_name, severity\n| sort - _time",
        },
      ],
      expect:
        "<p>Three outcomes per technique, and all three are useful findings: the event is logged and the rule fired (green), the event is logged but no rule exists (amber — write one), or nothing was logged at all (red — fix telemetry first).</p>",
      fixes: [
        {
          problem: "A test appears to do nothing",
          cause: "Some atomics need specific prerequisites.",
          fix: "Run <code>Invoke-AtomicTest T1234 -CheckPrereqs</code> and then <code>-GetPrereqs</code> to satisfy them. Record any test you could not run — an untested technique is not a covered technique.",
        },
        {
          problem: "You lose track of which alert belongs to which test",
          cause: "Tests were run too close together.",
          fix: "Leave at least two minutes between tests, and log every start time. If it gets confusing, stop and restart the sequence — the discipline is the deliverable.",
        },
      ],
    },
    {
      title: "Close the biggest gap immediately",
      time: "60 min",
      why: "A purple team exercise that only produces a report has failed. The loop closes when you fix something and re-test.",
      body: "<p>Pick the highest-impact red row — usually credential access or defense evasion — and build the detection now, while the attack is fresh.</p><p>Log clearing (T1070.001) is a good first choice: it is unambiguous, high-severity, and almost never legitimate.</p>",
      commands: [
        {
          lang: "spl",
          label: "Detection — someone cleared the Security log",
          code: "index=main EventCode=1102\n| table _time, host, Account_Name, Subject_Account_Name\n| eval severity=\"CRITICAL — audit log cleared\"",
        },
        {
          lang: "yaml",
          label: "The same thing as a Sigma rule",
          code: "title: Windows Security Event Log Cleared\nid: 6b1e2a44-8c9d-4e0f-b1a2-3c4d5e6f7a8b\nstatus: experimental\ndescription: >\n  The Security event log was cleared. Outside of a documented\n  maintenance window this is almost always an attacker destroying\n  evidence, and it should be treated as critical.\nreferences:\n  - https://attack.mitre.org/techniques/T1070/001/\ntags:\n  - attack.defense_evasion\n  - attack.t1070.001\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 1102\n  condition: selection\nfalsepositives:\n  - Documented maintenance during an approved change window\nlevel: critical",
        },
        {
          lang: "powershell",
          label: "Re-test to prove the fix works",
          code: "Invoke-AtomicTest T1070.001 -TestNumbers 1\n# then re-run the Splunk search — it must return the event now",
        },
      ],
      expect:
        "<p>The technique moves from red to green in your matrix, with a timestamp proving the re-test. That before/after pair is the most persuasive thing in the whole report.</p>",
    },
    {
      title: "Build the coverage map",
      time: "60 min",
      why: "The matrix is the artefact. It turns a day of testing into something a manager can budget against.",
      body: "<p>Fill in every row honestly, then produce two summary numbers: <b>data coverage</b> (how many techniques you can see at all) and <b>validated detection coverage</b> (how many you have actually proven you detect). The gap between those two is the interesting part.</p><p>Then use the ATT&amp;CK Navigator to make it visual — go to <a href=\"https://mitre-attack.github.io/attack-navigator/\" target=\"_blank\" rel=\"noopener noreferrer\">mitre-attack.github.io/attack-navigator</a>, create a new layer, and colour each technique you tested.</p>",
      commands: [
        {
          lang: "bash",
          label: "A Navigator layer you can import directly",
          code: "cat > coverage-layer.json <<'EOF'\n{\n  \"name\": \"Home lab coverage — July 2026\",\n  \"versions\": {\"attack\": \"14\", \"navigator\": \"4.9.1\", \"layer\": \"4.5\"},\n  \"domain\": \"enterprise-attack\",\n  \"description\": \"Validated via Atomic Red Team. Green = detection fired.\",\n  \"gradient\": {\"colors\": [\"#ff6666\", \"#ffe766\", \"#8ec843\"], \"minValue\": 0, \"maxValue\": 2},\n  \"techniques\": [\n    {\"techniqueID\": \"T1059.001\", \"score\": 2, \"comment\": \"4688 + Sigma rule fired in 45s\"},\n    {\"techniqueID\": \"T1547.001\", \"score\": 1, \"comment\": \"logged via Sysmon 13, no rule yet\"},\n    {\"techniqueID\": \"T1070.001\", \"score\": 2, \"comment\": \"1102 detected after remediation\"},\n    {\"techniqueID\": \"T1003.001\", \"score\": 0, \"comment\": \"NO TELEMETRY — needs Sysmon 10\"},\n    {\"techniqueID\": \"T1110.001\", \"score\": 2, \"comment\": \"project 02 rule fired\"}\n  ]\n}\nEOF",
        },
      ],
      expect:
        "<p>Import the JSON into Navigator and you get the ATT&amp;CK matrix with your tested techniques coloured red, amber, and green. This single image is the most useful thing you can put in a portfolio for a detection-focused role.</p>",
      expectCode:
        "Data coverage:                9 / 12 techniques (75%)\nValidated detection coverage: 5 / 12 techniques (42%)\n\nGap: 4 techniques are logged but have no rule\n     3 techniques produce no telemetry at all",
    },
    {
      title: "Write the report a manager would act on",
      time: "45 min",
      why: "The report is what turns findings into funded work. Write it for someone who will not read past page one.",
      body: "<p>Structure it in this order — most senior reader first:</p><ol><li><b>One-paragraph summary.</b> What you tested, what fraction you detect, and the single most important gap.</li><li><b>The coverage map image.</b></li><li><b>Top three gaps</b>, each with: the technique, what an attacker gains from it, why you cannot see it, and what it would take to fix.</li><li><b>What you fixed during the exercise</b> — with the before/after evidence.</li><li><b>Method</b>, so someone can reproduce it: tool versions, test numbers, dates.</li></ol><p>Quantify wherever you can. &ldquo;We detect 42% of tested techniques, and the three gaps all relate to credential access&rdquo; is actionable. &ldquo;Our coverage could be better&rdquo; is not.</p>",
      expect:
        "<p>A report whose first paragraph tells a busy reader everything they need to make a decision. Everything after page one is supporting evidence.</p>",
    },
  ],
  after: [
    "<b>Restore your snapshots.</b> Atomic tests leave real persistence behind.",
    "Re-run the same techniques in three months. Coverage decays as systems change, and a trend line is far more persuasive than a snapshot.",
    "Read Red Canary's annual Threat Detection Report — it tells you which techniques actually appear in real intrusions, which is how you prioritise the next round.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 10 — Hypothesis-driven threat hunting programme                             */
/* -------------------------------------------------------------------------- */

export const g10: ProjectGuide = {
  slug: "threat-hunting-programme",
  projectId: 10,
  intro:
    "<p>Threat hunting is looking for attackers your alerts missed. The word gets used loosely — a lot of what is called hunting is really just browsing dashboards until something looks odd.</p><p>Real hunting is <b>hypothesis-driven</b>: you state a specific, falsifiable claim about how an attacker might be operating, you decide in advance what evidence would prove or disprove it, and then you go and look. The discipline matters because it makes hunts repeatable, reviewable, and honest — including the ones that find nothing, which is most of them.</p><p>You are going to run three complete hunts and build the programme structure around them.</p>",
  glossary: [
    {
      term: "Hypothesis",
      plain:
        "A specific testable statement, like &ldquo;an attacker is using scheduled tasks for persistence on our servers&rdquo;. Not &ldquo;let's look at scheduled tasks&rdquo;.",
    },
    {
      term: "Stacking / frequency analysis",
      plain:
        "Counting how often each distinct value appears and looking at the rarest. Attacker artefacts are almost always rare; normal ones are common.",
    },
    {
      term: "Long tail",
      plain:
        "The rare values at the end of a sorted frequency list. Most hunting happens here.",
    },
    {
      term: "Enrichment",
      plain:
        "Adding context so a rare thing can be judged — is this unusual binary signed, where did it come from, who ran it.",
    },
    {
      term: "Negative result",
      plain:
        "A hunt that found nothing. Valuable and worth documenting: it tells you the technique is not present, and it usually improves your data coverage on the way.",
    },
  ],
  before: [
    "<b>Projects 01, 02 and 09 finished.</b> The coverage map from project 09 is what tells you where hunting is even possible.",
    "Sysmon installed on the Windows VM — without it most of these hunts have no data.",
    "At least a week of logs in Splunk. Hunting needs history.",
    "About 8 hours.",
  ],
  steps: [
    {
      title: "Write hypotheses before you touch the data",
      time: "45 min",
      why: "If you look first and form the hypothesis afterwards, you will find whatever you were already inclined to see. Writing it down first is what keeps the exercise honest.",
      body: "<p>A usable hypothesis has four parts: the claim, the data you will use, what a positive result looks like, and what a negative result looks like. Without the fourth part you can never declare the hunt finished.</p><p>Write three, drawn from the gaps in your project 09 coverage map — hunt where your detections are weakest, since that is where an attacker would actually survive.</p>",
      expect:
        "<p>Three written hypotheses. If you cannot state what would <i>disprove</i> one, it is not specific enough yet.</p>",
      expectCode:
        "H1  An attacker is persisting via scheduled tasks that run from user-writable paths.\n    Data:     Sysmon 1, Windows 4698\n    Positive: a task whose action points at %TEMP%, %APPDATA% or a user profile\n    Negative: every task action resolves under Program Files or System32\n\nH2  An attacker is using LOLBins to proxy execution and evade allowlisting.\n    Data:     Sysmon 1 (process creation with parent + command line)\n    Positive: certutil/mshta/rundll32/regsvr32 with a URL or unusual argument\n    Negative: those binaries appear only with known-good arguments\n\nH3  Credentials are being accessed from LSASS by non-security tooling.\n    Data:     Sysmon 10 (process access)\n    Positive: any process other than known AV/EDR opening lsass.exe with 0x1010\n    Negative: only expected security products appear",
    },
    {
      title: "Hunt 1 — scheduled task persistence",
      time: "60 min",
      why: "Scheduled tasks are one of the most common persistence mechanisms in real intrusions, and they are easy to hunt because legitimate ones are so predictable.",
      body: "<p>The technique is <b>stacking</b>: list every task, count how common each path is, and look at the rare end.</p>",
      commands: [
        {
          lang: "spl",
          label: "Stack scheduled task actions",
          code: "index=main (EventCode=4698 OR (EventCode=1 Image=\"*schtasks.exe\"))\nearliest=-7d\n| rex field=_raw \"(?<task_cmd>[A-Za-z]:\\\\\\\\[^\\\"<>|]+\\.(exe|dll|ps1|vbs|bat|js))\"\n| eval location = case(\n    match(task_cmd, \"(?i)\\\\\\\\Windows\\\\\\\\System32\"), \"system32\",\n    match(task_cmd, \"(?i)Program Files\"),             \"program files\",\n    match(task_cmd, \"(?i)\\\\\\\\Users\\\\\\\\\"),               \"USER PROFILE — suspicious\",\n    match(task_cmd, \"(?i)\\\\\\\\Temp\\\\\\\\|AppData\"),        \"TEMP/APPDATA — suspicious\",\n    1==1, \"other\")\n| stats count, values(host) as hosts by location, task_cmd\n| sort count",
        },
        {
          lang: "powershell",
          where: "On soc-victim — plant one so the hunt has something to find",
          label: "Create a test task from a user-writable path",
          code: "Copy-Item C:\\Windows\\System32\\calc.exe $env:APPDATA\\updater.exe\n\nschtasks /create /tn \"WindowsUpdateCheck\" /tr \"$env:APPDATA\\updater.exe\" `\n  /sc daily /st 09:00 /f\n\n# Cleanup afterwards:\n# schtasks /delete /tn \"WindowsUpdateCheck\" /f\n# Remove-Item $env:APPDATA\\updater.exe",
        },
      ],
      expect:
        "<p>Sorting <b>ascending</b> puts the rare items first — that is deliberate, and it is the core hunting technique. Your planted task appears in the suspicious bucket with a count of 1, while genuine Windows tasks cluster with high counts in system32.</p>",
      expectCode:
        "location                   task_cmd                                    count  hosts\nTEMP/APPDATA — suspicious  C:\\Users\\labuser\\AppData\\Roaming\\updater.exe  1     soc-victim\nsystem32                   C:\\Windows\\System32\\sihost.exe                47    soc-victim",
      fixes: [
        {
          problem: "The rex extracts nothing",
          cause: "Backslash escaping in SPL regex is genuinely painful — you need four backslashes to match one.",
          fix: "Test the pattern in isolation first: <code>| makeresults | eval t=\"C:\\\\Users\\\\x\\\\a.exe\" | rex field=t \"(?&lt;p&gt;[A-Za-z]:\\\\\\\\\\\\\\\\.*)\"</code>. Or sidestep it with <code>| search task_cmd=\"*\\\\Users\\\\*\"</code>.",
        },
      ],
    },
    {
      title: "Hunt 2 — living-off-the-land binaries",
      time: "60 min",
      why: "LOLBins are signed Microsoft executables that attackers abuse precisely because they are trusted. You cannot block them, so you have to hunt them.",
      body: "<p>The signal is never the binary — it is the <i>arguments</i> and the <i>parent process</i>. <code>certutil.exe</code> is legitimate; <code>certutil.exe -urlcache -f http://…</code> spawned by Word is not.</p>",
      commands: [
        {
          lang: "spl",
          label: "Hunt suspicious LOLBin usage",
          code: "index=main EventCode=1 earliest=-7d\n| eval bin = lower(mvindex(split(Image, \"\\\\\"), -1))\n| search bin IN (\"certutil.exe\",\"mshta.exe\",\"rundll32.exe\",\"regsvr32.exe\",\n                 \"bitsadmin.exe\",\"wmic.exe\",\"msbuild.exe\",\"installutil.exe\")\n| eval suspicious = case(\n    match(CommandLine, \"(?i)https?://\"),        \"downloads from a URL\",\n    match(CommandLine, \"(?i)-urlcache|-decode\"), \"certutil download/decode\",\n    match(CommandLine, \"(?i)javascript:|vbscript:\"), \"script protocol handler\",\n    match(CommandLine, \"(?i)\\\\\\\\Temp\\\\\\\\|AppData\"), \"runs from temp\",\n    1==1, null())\n| search suspicious=*\n| table _time, host, bin, suspicious, ParentImage, CommandLine\n| sort - _time",
        },
        {
          lang: "spl",
          label: "Parent-child stacking — the more general version",
          code: "index=main EventCode=1 earliest=-7d\n| eval parent = lower(mvindex(split(ParentImage, \"\\\\\"), -1)),\n       child  = lower(mvindex(split(Image, \"\\\\\"), -1))\n| stats count by parent, child\n| sort count\n| head 30",
        },
      ],
      expect:
        "<p>The second search is the one worth internalising. Rare parent-child pairs are where intrusions hide — <code>winword.exe → powershell.exe</code> appearing once in a week is far more interesting than any single indicator.</p>",
      expectCode:
        "parent            child             count\nwinword.exe       powershell.exe    1      <- investigate this\nexplorer.exe      certutil.exe      1      <- and this\nsvchost.exe       taskhostw.exe     284    <- normal",
      fixes: [
        {
          problem: "No Sysmon event ID 1 data",
          cause: "Sysmon is not installed or not forwarded.",
          fix: "Install it (see project 09 step 3) and forward <code>WinEventLog://Microsoft-Windows-Sysmon/Operational</code>. Windows 4688 is a weaker substitute — it lacks the parent process path.",
        },
      ],
    },
    {
      title: "Hunt 3 — credential access from LSASS",
      time: "50 min",
      why: "LSASS holds credentials in memory. Anything reading it that is not a security product is a serious finding, and this hunt has a very low false positive rate.",
      body: "<p>Sysmon event 10 records one process opening a handle to another. The access mask <code>0x1010</code> or <code>0x1410</code> against <code>lsass.exe</code> is the classic credential-dumping signature.</p>",
      commands: [
        {
          lang: "spl",
          label: "Who is touching LSASS?",
          code: "index=main EventCode=10 TargetImage=\"*\\\\lsass.exe\" earliest=-7d\n| eval src = lower(mvindex(split(SourceImage, \"\\\\\"), -1))\n| search NOT src IN (\"msmpeng.exe\",\"wmiprvse.exe\",\"csrss.exe\",\"services.exe\",\n                     \"svchost.exe\",\"taskmgr.exe\")\n| stats count, values(GrantedAccess) as access, values(host) as hosts by src\n| sort count",
        },
        {
          lang: "spl",
          label: "Narrow to the dangerous access masks",
          code: "index=main EventCode=10 TargetImage=\"*\\\\lsass.exe\"\n  GrantedAccess IN (\"0x1010\",\"0x1410\",\"0x143a\",\"0x1fffff\")\n| table _time, host, SourceImage, GrantedAccess, SourceUser",
        },
      ],
      expect:
        "<p>In a clean lab this returns nothing beyond the expected system processes — a negative result, and a good one. Document it: &ldquo;no evidence of LSASS access by non-security processes over seven days&rdquo; is a real finding, and it also confirms your Sysmon 10 telemetry works.</p>",
      fixes: [
        {
          problem: "No event ID 10 at all",
          cause: "Most Sysmon configs disable ProcessAccess because it is extremely noisy.",
          fix: "Enable it narrowly — filter to <code>TargetImage</code> ending in <code>lsass.exe</code> only. SwiftOnSecurity's config has a commented-out section for exactly this.",
        },
      ],
    },
    {
      title: "Document each hunt, including the empty ones",
      time: "45 min",
      why: "Undocumented hunts cannot be repeated, reviewed, or handed over — and a negative result you did not write down will be re-hunted by someone else in three months.",
      body: "<p>Use the same template every time. Consistency is what makes a set of hunts into a programme.</p>",
      commands: [
        {
          lang: "yaml",
          label: "hunt-template.yml",
          code: "hunt_id: HUNT-2026-003\ntitle: LSASS access by non-security processes\ndate: 2026-07-26\nanalyst: Your Name\n\nhypothesis: >\n  An attacker with local admin is dumping credentials from LSASS\n  memory using a tool that is not an approved security product.\n\nattack_mapping:\n  - T1003.001\n\ndata_sources:\n  - Sysmon Event ID 10 (ProcessAccess)\n  - timeframe: last 7 days\n  - scope: all Windows hosts forwarding to Splunk (n=2)\n\nmethod: |\n  Filtered Sysmon 10 to TargetImage=lsass.exe, excluded the known\n  security and system processes, then stacked by source process.\n\nresult: NEGATIVE\nfindings: >\n  No non-allowlisted process accessed LSASS in the period. Telemetry\n  confirmed working by generating a control event with Task Manager.\n\nlimitations: >\n  Only covers hosts running Sysmon (2 of 3 — the DC is not yet covered).\n  A driver-based dumper operating in kernel mode would not appear here.\n\nactions:\n  - Deploy Sysmon to soc-dc  (owner: me, due: next session)\n  - Promote this query to a scheduled detection — FP rate was zero\n\nnext_hunt: >\n  Same hypothesis via a different data source: look for handle\n  duplication and for minidump files written to disk.",
        },
      ],
      expect:
        "<p>Three completed hunt records. Note how much of the value sits in <code>limitations</code> and <code>actions</code> — that is what makes the difference between a hunt and a search.</p>",
    },
    {
      title: "Turn successful hunts into detections",
      time: "40 min",
      why: "A hunt you have to remember to repeat is wasted. Anything you found with a low false-positive rate should become automated, so you never hunt for it again.",
      body: "<p>Apply one rule: <b>if the hunt query produced few or no false positives, promote it to a scheduled detection.</b> Then the next hunt can go somewhere new.</p><p>Promote the LSASS query and the scheduled-task query using the Sigma workflow from project 05, and record the promotion in the hunt document. Over time your hunts migrate up into detections, and that migration <i>is</i> the programme maturing.</p>",
      expect:
        "<p>Two new scheduled alerts, each traceable back to the hunt that produced it. Being able to describe that pipeline — hunt, validate, promote, move on — is a senior-level answer.</p>",
    },
    {
      title: "Build the programme around the hunts",
      time: "45 min",
      why: "Three hunts is an activity. A backlog, a cadence, and a metric is a programme — and that distinction is exactly what an L3 interview probes.",
      body: "<p>Create three things:</p><ol><li><b>A hunt backlog</b> — a prioritised list of hypotheses, ranked by the technique's prevalence in real intrusions (Red Canary's report is the best free source) crossed with your own coverage gaps.</li><li><b>A cadence</b> — for example one hunt per fortnight, timeboxed to a day. Timeboxing matters; hunts expand to fill whatever time they are given.</li><li><b>Metrics</b> — hunts run, detections promoted, new data sources onboarded, and mean time from hypothesis to conclusion. Deliberately <i>not</i> &ldquo;threats found&rdquo;, because that incentivises inventing findings.</li></ol>",
      expect:
        "<p>A one-page programme document plus your three hunt records. That package is the deliverable, and it is unusual enough to be memorable.</p>",
    },
  ],
  after: [
    "Clean up anything you planted — the scheduled task and the copied binary from hunt 1.",
    "Read the PEAK threat hunting framework (Splunk, free) and the TaHiTI methodology. Both formalise what you just did.",
    "Run one hunt a fortnight. The backlog is more valuable than any individual hunt.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 11 — Detection-as-code pipeline                                             */
/* -------------------------------------------------------------------------- */

export const g11: ProjectGuide = {
  slug: "detection-as-code-pipeline",
  projectId: 11,
  intro:
    "<p>Most SOCs manage detections by editing them directly in the SIEM's web UI. There is no version history, no review, no test, and no way to answer &ldquo;who changed this rule and why?&rdquo;. When a rule breaks at 3am, nobody knows what it used to look like.</p><p><b>Detection-as-code</b> applies ordinary software engineering to detection rules: they live in git, changes go through pull requests, automated tests run on every commit, and deployment is a pipeline rather than a person clicking Save.</p><p>You are going to build that pipeline. It is the most transferable thing in this kit — the same structure works for Splunk, Sentinel, Elastic, or Panther.</p>",
  glossary: [
    {
      term: "CI/CD",
      plain:
        "Continuous Integration / Continuous Deployment. Automation that runs on every code change — tests first, then deployment if the tests pass.",
    },
    {
      term: "GitHub Actions",
      plain:
        "GitHub's built-in CI. You describe jobs in a YAML file under <code>.github/workflows/</code> and they run automatically on push.",
    },
    {
      term: "Pull request",
      plain:
        "A proposed change that someone else reviews before it merges. For detections, this is where the &ldquo;what would this false-positive on?&rdquo; conversation happens.",
    },
    {
      term: "Unit test",
      plain:
        "An automated check of one specific thing. For a detection: given this log line, does the rule match — and given this benign one, does it correctly not match?",
    },
    {
      term: "Idempotent deployment",
      plain:
        "Running the deploy twice produces the same result as running it once. Essential, because pipelines get re-run.",
    },
  ],
  before: [
    "<b>Project 05 finished</b> — you need Sigma rules to put in the pipeline.",
    "A free GitHub account.",
    "Basic git familiarity: <code>clone</code>, <code>add</code>, <code>commit</code>, <code>push</code>. The guide explains the rest.",
    "About 6 hours.",
  ],
  steps: [
    {
      title: "Structure the repository",
      time: "30 min",
      why: "Structure decided up front is structure you do not have to migrate later. This layout is close to what most detection teams converge on.",
      body: "<p>Separate rules, tests, pipeline configuration, and documentation from the start.</p>",
      commands: [
        {
          lang: "bash",
          label: "Create the layout",
          code: "mkdir -p detection-as-code/{rules/{windows,linux,network},tests/{data,expected},pipelines,docs,.github/workflows}\ncd detection-as-code\ngit init\n\n# Bring in the rules you wrote in project 05\ncp ~/my-sigma/*.yml rules/windows/\ncp ~/my-sigma/splunk-lab-pipeline.yml pipelines/\n\nfind . -type f -not -path './.git/*' | sort",
        },
      ],
      expect: "<p>A clean tree with your existing rules already in it.</p>",
      expectCode:
        "./pipelines/splunk-lab-pipeline.yml\n./rules/windows/brute_force_smb.yml\n./rules/windows/suspicious_powershell.yml",
    },
    {
      title: "Write tests for your rules",
      time: "60 min",
      why: "This is what makes the pipeline worth building. A test proves a rule matches what it should — and, just as importantly, does <b>not</b> match benign activity.",
      body: "<p>For each rule, write two fixtures: one event that must match, and one that must not. The negative test is the one that catches over-broad rules, which are the ones that get muted in production.</p>",
      commands: [
        {
          lang: "json",
          label: "tests/data/brute_force_positive.json",
          code: "{\n  \"EventID\": 4625,\n  \"LogonType\": 3,\n  \"TargetUserName\": \"labuser\",\n  \"IpAddress\": \"192.168.56.10\",\n  \"WorkstationName\": \"ATTACKER\"\n}",
        },
        {
          lang: "json",
          label: "tests/data/brute_force_negative.json  (a machine account — must NOT match)",
          code: "{\n  \"EventID\": 4625,\n  \"LogonType\": 3,\n  \"TargetUserName\": \"SOC-VICTIM$\",\n  \"IpAddress\": \"192.168.56.30\",\n  \"WorkstationName\": \"SOC-DC\"\n}",
        },
        {
          lang: "python",
          label: "tests/test_rules.py",
          code: "\"\"\"Validate every Sigma rule: it must parse, convert, and behave.\"\"\"\nimport json\nimport pathlib\nimport subprocess\n\nimport pytest\nimport yaml\n\nRULES = sorted(pathlib.Path('rules').rglob('*.yml'))\n\n\n@pytest.mark.parametrize('rule', RULES, ids=lambda p: p.name)\ndef test_rule_is_valid_yaml(rule):\n    with open(rule) as f:\n        doc = yaml.safe_load(f)\n    assert doc is not None, f'{rule} is empty'\n\n\n@pytest.mark.parametrize('rule', RULES, ids=lambda p: p.name)\ndef test_rule_has_required_metadata(rule):\n    doc = yaml.safe_load(open(rule))\n    for field in ('title', 'id', 'status', 'logsource', 'detection', 'level'):\n        assert field in doc, f'{rule.name} is missing \"{field}\"'\n\n\n@pytest.mark.parametrize('rule', RULES, ids=lambda p: p.name)\ndef test_rule_documents_false_positives(rule):\n    \"\"\"A rule nobody has thought about the FPs for is not ready to deploy.\"\"\"\n    doc = yaml.safe_load(open(rule))\n    fps = doc.get('falsepositives')\n    assert fps, f'{rule.name} does not document any false positives'\n    assert fps != ['Unknown'], f'{rule.name} has a placeholder falsepositives'\n\n\n@pytest.mark.parametrize('rule', RULES, ids=lambda p: p.name)\ndef test_rule_is_mapped_to_attack(rule):\n    doc = yaml.safe_load(open(rule))\n    tags = doc.get('tags', [])\n    assert any(t.startswith('attack.t') for t in tags), \\\n        f'{rule.name} has no ATT&CK technique tag'\n\n\n@pytest.mark.parametrize('rule', RULES, ids=lambda p: p.name)\ndef test_rule_converts_to_splunk(rule):\n    result = subprocess.run(\n        ['sigma', 'convert', '-t', 'splunk',\n         '-p', 'pipelines/splunk-lab-pipeline.yml', str(rule)],\n        capture_output=True, text=True)\n    assert result.returncode == 0, f'conversion failed:\\n{result.stderr}'\n    assert result.stdout.strip(), 'conversion produced an empty query'",
        },
        {
          lang: "bash",
          label: "Run them",
          code: "pip install pytest pyyaml\npytest tests/ -v",
        },
      ],
      expect:
        "<p>All tests pass. If <code>test_rule_documents_false_positives</code> fails, that is the test doing its job — go and fill in the section rather than deleting the test.</p>",
      expectCode:
        "tests/test_rules.py::test_rule_is_valid_yaml[brute_force_smb.yml] PASSED\ntests/test_rules.py::test_rule_has_required_metadata[brute_force_smb.yml] PASSED\ntests/test_rules.py::test_rule_documents_false_positives[brute_force_smb.yml] PASSED\ntests/test_rules.py::test_rule_is_mapped_to_attack[brute_force_smb.yml] PASSED\ntests/test_rules.py::test_rule_converts_to_splunk[brute_force_smb.yml] PASSED\n\n========================= 10 passed in 3.42s =========================",
      fixes: [
        {
          problem: "test_rule_converts_to_splunk fails with 'sigma: command not found'",
          cause: "The virtual environment from project 05 is not active.",
          fix: "<code>source ~/sigma-env/bin/activate</code>, or install sigma-cli into this project's environment so CI can find it too.",
        },
      ],
    },
    {
      title: "Add the CI pipeline",
      time: "45 min",
      why: "Tests only help if they run automatically. CI is what makes it impossible to merge a broken rule.",
      body: "<p>GitHub Actions runs on every push and pull request, free for public repositories.</p>",
      commands: [
        {
          lang: "yaml",
          label: ".github/workflows/validate.yml",
          code: "name: Validate detections\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'\n\n      - name: Install tooling\n        run: |\n          python -m pip install --upgrade pip\n          pip install sigma-cli pytest pyyaml\n          sigma plugin install splunk\n\n      - name: Lint every rule\n        run: sigma check rules/\n\n      - name: Run the test suite\n        run: pytest tests/ -v\n\n      - name: Convert all rules and publish the queries\n        run: |\n          mkdir -p build\n          sigma convert -t splunk -p pipelines/splunk-lab-pipeline.yml \\\n            rules/ > build/splunk-queries.txt\n          echo '--- generated queries ---'\n          cat build/splunk-queries.txt\n\n      - uses: actions/upload-artifact@v4\n        with:\n          name: splunk-queries\n          path: build/",
        },
        {
          lang: "bash",
          label: "Push and watch it run",
          code: "cat > .gitignore <<'EOF'\n__pycache__/\n*.pyc\nbuild/\n.venv/\nEOF\n\ngit add -A\ngit commit -m \"Detection-as-code: rules, tests and CI\"\ngit branch -M main\ngit remote add origin https://github.com/YOURNAME/detection-as-code.git\ngit push -u origin main",
        },
      ],
      expect:
        "<p>On GitHub, the <b>Actions</b> tab shows a run with a green tick. Click into it to see each step's output, including the generated SPL — that artefact is downloadable, which is how the deploy step gets its input.</p>",
      fixes: [
        {
          problem: "The workflow does not run at all",
          cause: "The file is in the wrong place. It must be exactly <code>.github/workflows/*.yml</code>.",
          fix: "Check with <code>git ls-files .github</code>. A common cause is <code>.github</code> being caught by a broad gitignore rule.",
        },
        {
          problem: "sigma plugin install fails in CI",
          cause: "Transient network failure reaching the plugin index.",
          fix: "Add <code>continue-on-error: false</code> and re-run the job. If it persists, pin the version: <code>pip install pysigma-backend-splunk</code> directly.",
        },
      ],
    },
    {
      title: "Require review before merge",
      time: "25 min",
      why: "This is the control that actually prevents bad detections reaching production. CI catches syntax; a human catches &ldquo;this will fire on every domain controller at 6am&rdquo;.",
      body: "<p>On GitHub go to <b>Settings → Branches → Add branch protection rule</b> for <code>main</code>:</p><ul><li>Require a pull request before merging</li><li>Require status checks to pass — select the <code>validate</code> job</li><li>Require branches to be up to date before merging</li></ul><p>Then add a PR template so every change answers the same questions:</p>",
      commands: [
        {
          lang: "bash",
          label: ".github/pull_request_template.md",
          code: "cat > .github/pull_request_template.md <<'EOF'\n## What does this rule detect?\n\n\n## ATT&CK technique(s)\n\n\n## Testing performed\n- [ ] Rule converts cleanly to the target backend\n- [ ] Positive test: confirmed it fires on the intended activity\n- [ ] Negative test: confirmed it does NOT fire on benign activity\n- [ ] Backtested over at least 7 days of production-like data\n\n**Backtest result:** _n_ alerts over _n_ days (_n_ per day)\n\n## Expected false positives\n\n\n## What should an analyst do when this fires?\n\nEOF",
        },
      ],
      expect:
        "<p>Pushing directly to <code>main</code> is now rejected. Every change goes through a PR that prompts for a backtest result and a response action — which is exactly the discipline the whole project is trying to instil.</p>",
    },
    {
      title: "Automate deployment to Splunk",
      time: "60 min",
      why: "Manual deployment is where drift starts — someone edits a rule in the UI, and the repository no longer reflects reality.",
      body: "<p>Write a deploy script that reads the converted queries and creates or updates saved searches over Splunk's REST API. It must be idempotent: running it twice must not create duplicates.</p>",
      commands: [
        {
          lang: "python",
          label: "deploy.py",
          code: "#!/usr/bin/env python3\n\"\"\"Deploy converted Sigma rules to Splunk as scheduled saved searches.\n\nIdempotent: existing searches are updated in place, not duplicated.\n\"\"\"\nimport os\nimport pathlib\nimport sys\n\nimport requests\nimport urllib3\nimport yaml\n\nurllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)\n\nHOST = os.environ['SPLUNK_HOST']\nUSER = os.environ['SPLUNK_USER']\nPASS = os.environ['SPLUNK_PASS']\nBASE = f'https://{HOST}:8089/servicesNS/{USER}/search/saved/searches'\n\nCRON = {'critical': '*/5 * * * *', 'high': '*/10 * * * *',\n        'medium': '0 * * * *',     'low': '0 */6 * * *'}\n\n\ndef deploy(name: str, query: str, level: str) -> None:\n    payload = {\n        'search': query,\n        'cron_schedule': CRON.get(level, '0 * * * *'),\n        'dispatch.earliest_time': '-15m',\n        'dispatch.latest_time': 'now',\n        'is_scheduled': '1',\n        'alert_type': 'number of events',\n        'alert_comparator': 'greater than',\n        'alert_threshold': '0',\n        'alert.severity': {'critical': '5', 'high': '4',\n                           'medium': '3'}.get(level, '2'),\n    }\n\n    # Does it already exist?\n    existing = requests.get(f'{BASE}/{name}', auth=(USER, PASS), verify=False)\n\n    if existing.status_code == 200:\n        r = requests.post(f'{BASE}/{name}', auth=(USER, PASS),\n                          data=payload, verify=False)\n        action = 'updated'\n    else:\n        payload['name'] = name\n        r = requests.post(BASE, auth=(USER, PASS), data=payload, verify=False)\n        action = 'created'\n\n    if r.status_code in (200, 201):\n        print(f'  {action}: {name}')\n    else:\n        print(f'  FAILED  {name}: HTTP {r.status_code} {r.text[:200]}',\n              file=sys.stderr)\n        sys.exit(1)\n\n\nif __name__ == '__main__':\n    for rule_path in sorted(pathlib.Path('rules').rglob('*.yml')):\n        rule = yaml.safe_load(open(rule_path))\n        query_file = pathlib.Path('build') / f'{rule_path.stem}.spl'\n        if not query_file.exists():\n            print(f'  skipped (no converted query): {rule_path.name}')\n            continue\n        deploy(f\"sigma_{rule_path.stem}\",\n               query_file.read_text().strip(),\n               rule.get('level', 'medium'))",
        },
        {
          lang: "yaml",
          label: "Add a deploy job to the workflow",
          code: "  deploy:\n    needs: validate\n    if: github.ref == 'refs/heads/main'\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'\n      - run: pip install sigma-cli requests pyyaml && sigma plugin install splunk\n      - name: Convert rules individually\n        run: |\n          mkdir -p build\n          for f in $(find rules -name '*.yml'); do\n            sigma convert -t splunk -p pipelines/splunk-lab-pipeline.yml \"$f\" \\\n              > \"build/$(basename \"${f%.yml}\").spl\"\n          done\n      - name: Deploy\n        env:\n          SPLUNK_HOST: ${{ secrets.SPLUNK_HOST }}\n          SPLUNK_USER: ${{ secrets.SPLUNK_USER }}\n          SPLUNK_PASS: ${{ secrets.SPLUNK_PASS }}\n        run: python deploy.py",
        },
      ],
      warn: "Add SPLUNK_HOST, SPLUNK_USER and SPLUNK_PASS under Settings → Secrets and variables → Actions. Never put credentials in the workflow file.",
      expect:
        "<p>Merging to <code>main</code> deploys. Check Splunk under <b>Settings → Searches, reports and alerts</b> — your rules appear as scheduled searches prefixed <code>sigma_</code>. Run the deploy twice and confirm you still have one of each, not two.</p>",
      fixes: [
        {
          problem: "GitHub Actions cannot reach your lab Splunk",
          cause: "It is on a private network, which is correct and expected.",
          fix: "Run the deploy locally with the same script: <code>SPLUNK_HOST=192.168.56.10 SPLUNK_USER=admin SPLUNK_PASS=… python deploy.py</code>. In the write-up, note that a real environment would use a self-hosted runner inside the network.",
        },
        {
          problem: "HTTP 409 Conflict",
          cause: "The saved search exists but the update path was not taken.",
          fix: "The existence check handles this. If it still occurs, the name contains characters Splunk rejects — restrict names to letters, numbers, and underscores.",
        },
      ],
    },
    {
      title: "Add coverage reporting",
      time: "40 min",
      why: "The pipeline should tell you what it covers, automatically, on every run. Manually maintained coverage documents are always out of date.",
      body: "<p>Generate the ATT&amp;CK Navigator layer from the rules themselves, so it can never drift from reality.</p>",
      commands: [
        {
          lang: "python",
          label: "coverage.py",
          code: "#!/usr/bin/env python3\n\"\"\"Generate an ATT&CK Navigator layer from the rule set.\"\"\"\nimport json\nimport pathlib\nimport re\n\nimport yaml\n\nTECH = re.compile(r'attack\\.(t\\d{4}(?:\\.\\d{3})?)', re.I)\nSCORE = {'critical': 100, 'high': 75, 'medium': 50, 'low': 25}\n\ntechniques = {}\nfor path in pathlib.Path('rules').rglob('*.yml'):\n    rule = yaml.safe_load(open(path))\n    score = SCORE.get(rule.get('level', 'medium'), 50)\n    for tag in rule.get('tags', []):\n        m = TECH.match(tag)\n        if not m:\n            continue\n        tid = m.group(1).upper()\n        entry = techniques.setdefault(tid, {'score': 0, 'rules': []})\n        entry['score'] = max(entry['score'], score)\n        entry['rules'].append(rule['title'])\n\nlayer = {\n    'name': 'Detection coverage (generated)',\n    'versions': {'attack': '14', 'navigator': '4.9.1', 'layer': '4.5'},\n    'domain': 'enterprise-attack',\n    'description': f'Generated from {len(list(pathlib.Path(\"rules\").rglob(\"*.yml\")))} rules',\n    'techniques': [\n        {'techniqueID': tid,\n         'score': v['score'],\n         'comment': '; '.join(v['rules'])}\n        for tid, v in sorted(techniques.items())\n    ],\n}\n\npathlib.Path('build').mkdir(exist_ok=True)\npathlib.Path('build/coverage-layer.json').write_text(json.dumps(layer, indent=2))\nprint(f'{len(techniques)} techniques covered by {sum(len(v[\"rules\"]) for v in techniques.values())} rules')\nfor tid, v in sorted(techniques.items()):\n    print(f'  {tid}: {len(v[\"rules\"])} rule(s)')",
        },
      ],
      expect:
        "<p>A Navigator layer regenerated on every CI run. Add it as an uploaded artefact and your coverage map is always current — which is something most real teams do not manage.</p>",
      expectCode:
        "2 techniques covered by 2 rules\n  T1059.001: 1 rule(s)\n  T1110.001: 1 rule(s)",
    },
    {
      title: "Document the whole thing",
      time: "30 min",
      why: "The README is what a hiring manager reads. Make it explain the <i>system</i>, not just the commands.",
      body: "<p>Write a README covering: the problem detection-as-code solves, the repository layout, how to add a rule (a numbered contributor workflow), what CI checks and why each check exists, how deployment works, and the current coverage.</p><p>Include a diagram, even a plain-text one — a reviewer who understands the flow in ten seconds will look at the rest.</p>",
      commands: [
        {
          lang: "bash",
          label: "The flow, for the README",
          code: "cat >> README.md <<'EOF'\n\n## Flow\n\n    write rule  ──▶  pull request  ──▶  CI validates\n     (Sigma)                             ├─ sigma check\n                                         ├─ metadata present\n                                         ├─ falsepositives documented\n                                         ├─ ATT&CK tag present\n                                         └─ converts to target backend\n                                                  │\n                                          human review\n                                          (backtest + response action)\n                                                  │\n                                            merge to main\n                                                  │\n                                         auto-deploy to Splunk\n                                                  │\n                                         coverage layer regenerated\nEOF",
        },
      ],
      expect:
        "<p>A repository someone could contribute a rule to without asking you a question. That is the bar.</p>",
    },
  ],
  after: [
    "Add a second backend — convert to Elastic as well as Splunk. Multi-platform is where Sigma earns its keep.",
    "Add a scheduled CI job that backtests every rule weekly and opens an issue when one gets noisy. Rules decay; catching it automatically is a genuinely senior idea.",
    "Read Palantir's public alerting-and-detection-strategy framework — it is the best free writing on how to structure a detection as a document.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 12 — Full incident response simulation                                      */
/* -------------------------------------------------------------------------- */

export const g12: ProjectGuide = {
  slug: "incident-response-simulation",
  projectId: 12,
  intro:
    "<p>Everything else in this kit builds a piece. This project uses all of them at once, under time pressure, the way a real incident does.</p><p>You will stage a multi-stage intrusion in your lab, then work it from the first alert to a written post-incident report — following the SANS lifecycle: preparation, identification, containment, eradication, recovery, and lessons learned.</p><p>The hard part is not technical. It is doing the process properly while you want to skip ahead: taking notes as you go, preserving evidence before you destroy it, deciding when to contain, and resisting the urge to reimage before you understand what happened.</p>",
  glossary: [
    {
      term: "Incident response lifecycle",
      plain:
        "The six SANS phases. Real incidents loop back — containment often reveals new identification work — but the order is what stops you skipping steps.",
    },
    {
      term: "Order of volatility",
      plain:
        "Collect evidence from the most fragile source first: memory, then network connections, then disk. Reboot a machine and the memory evidence is gone forever.",
    },
    {
      term: "Containment",
      plain:
        "Stopping the spread without destroying evidence. Isolating a host is containment; wiping it is eradication, and doing them in the wrong order loses the investigation.",
    },
    {
      term: "Patient zero",
      plain: "The first compromised system. Finding it is what tells you how they got in.",
    },
    {
      term: "Dwell time",
      plain:
        "How long the attacker was present before detection. The single most quoted metric in incident reporting.",
    },
    {
      term: "Chain of custody",
      plain:
        "A record of who handled which evidence, when. Matters enormously if anything becomes a legal matter.",
    },
  ],
  before: [
    "<b>Every previous project.</b> This one uses the lab, the detections, the enrichment tool, and the hunting queries.",
    "Snapshots of all VMs — you will deliberately compromise them.",
    "A stopwatch or a clock. Timing your own response is most of the lesson.",
    "About 8 hours across two sessions: stage the attack, then respond to it.",
  ],
  steps: [
    {
      title: "Prepare — write the plan before the incident",
      time: "45 min",
      why: "The preparation phase is the one people skip, and it is the one that determines how the other five go. Writing this while calm is the entire point.",
      body: "<p>Produce three documents before you attack anything:</p><ol><li><b>An incident response plan</b> — severity definitions, who decides to contain, when you escalate, and how you communicate.</li><li><b>An evidence collection checklist</b> — in order of volatility, with the exact command for each item.</li><li><b>A blank incident log</b> — a table of timestamp, action, who, and result. You will fill this in <i>as you go</i>, not afterwards.</li></ol><p>The log is non-negotiable. Every real responder has reconstructed a timeline from memory once and then never done it again.</p>",
      commands: [
        {
          lang: "bash",
          label: "The evidence checklist, most volatile first",
          code: "cat > evidence-checklist.md <<'EOF'\n# Collect in this order. Each step destroys some of what is below it.\n\n## 1. Memory  (lost on power-off)\n- [ ] Full memory image     — winpmem_mini_x64.exe mem.raw\n- [ ] Running processes     — Get-Process | Export-Csv procs.csv\n- [ ] Loaded DLLs           — listdlls.exe -accepteula\n\n## 2. Network state  (lost within seconds)\n- [ ] Active connections    — netstat -anob > netstat.txt\n- [ ] ARP cache             — arp -a > arp.txt\n- [ ] DNS cache             — ipconfig /displaydns > dns.txt\n\n## 3. System state  (lost on reboot)\n- [ ] Logged-on users       — query user > users.txt\n- [ ] Scheduled tasks       — schtasks /query /v /fo csv > tasks.csv\n- [ ] Services              — Get-Service | Export-Csv services.csv\n- [ ] Autoruns              — autorunsc.exe -accepteula -a * -c > autoruns.csv\n\n## 4. Disk  (persists)\n- [ ] Event logs            — wevtutil epl Security sec.evtx\n- [ ] Prefetch              — copy C:\\Windows\\Prefetch\\*.pf\n- [ ] Suspicious binaries   — hash first, then copy\n\n## Chain of custody\n| Item | Collected (UTC) | By | SHA256 | Stored |\n|------|-----------------|----|--------|--------|\nEOF",
        },
      ],
      expect:
        "<p>Three documents ready. If you find yourself writing any of them <i>during</i> the incident, the preparation phase failed — note that as your first lesson learned.</p>",
    },
    {
      title: "Stage the intrusion",
      time: "60 min",
      warn: "Lab only, snapshots taken. Then step away for at least an hour — ideally do the response in a separate session — so you are not responding to something you can still remember perfectly.",
      why: "A multi-stage attack is what makes this realistic. A single alert teaches nothing about scoping.",
      body: "<p>Run a chain that touches several stages of the lifecycle, and record the ground truth in a sealed file you do not look at until the end.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "Stage 1 — initial access and execution",
          code: "# Simulated macro dropping a payload\n$p = \"$env:APPDATA\\Microsoft\\Windows\\wupdate.exe\"\nCopy-Item C:\\Windows\\System32\\notepad.exe $p\n\n# Encoded PowerShell — the execution stage\n$c = \"Start-Process '$p' -WindowStyle Hidden\"\n$e = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($c))\npowershell.exe -w hidden -enc $e",
        },
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "Stage 2 — persistence and discovery",
          code: "New-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' `\n  -Name 'WindowsUpdate' -Value $p -PropertyType String -Force\n\nschtasks /create /tn 'MicrosoftEdgeUpdateTaskUser' /tr $p /sc hourly /f\n\n# Discovery — noisy on purpose\nwhoami /groups; net user /domain; net group \"Domain Admins\" /domain\nnltest /dclist:soclab.local",
        },
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Stage 3 — credential access and lateral movement",
          code: "impacket-GetUserSPNs soclab.local/alice:'UserPass123!' \\\n  -dc-ip 192.168.56.30 -request -outputfile roast.txt\n\nimpacket-psexec soclab.local/svc_sql:'Summer2024'@192.168.56.20",
        },
        {
          lang: "bash",
          label: "Seal the ground truth — do not open until step 8",
          code: "cat > ground-truth.txt <<'EOF'\n(record every command you ran, with timestamps)\nEOF\n\nzip -e ground-truth.zip ground-truth.txt   # password-protect it\nrm ground-truth.txt",
        },
      ],
      expect:
        "<p>The attack chain has run and left traces across process creation, registry, scheduled tasks, Kerberos, and service installation. Now leave it alone.</p>",
    },
    {
      title: "Identify — start the clock",
      time: "60 min",
      why: "This is where response actually begins, and where most of the skill lives. Start your incident log with the first entry before you do anything else.",
      body: "<p>Begin from the alert, exactly as you would at work. Check your triggered alerts and work outward.</p><p><b>Log every action with a timestamp as you take it.</b> Not afterwards.</p>",
      commands: [
        {
          lang: "spl",
          label: "What fired?",
          code: "index=_audit action=alert_fired earliest=-24h\n| table _time, ss_name, severity\n| sort - _time",
        },
        {
          lang: "spl",
          label: "Scope it — what else did that host do?",
          code: "index=main host=soc-victim earliest=-24h\n| stats count by EventCode\n| sort - count",
        },
        {
          lang: "spl",
          label: "Build the process timeline",
          code: "index=main (EventCode=1 OR EventCode=4688) host=soc-victim earliest=-24h\n| table _time, ParentImage, Image, CommandLine, User\n| sort _time",
        },
      ],
      expect:
        "<p>A timeline forming. Resist the urge to fix anything yet — you are establishing scope, and containing before you understand the scope is how attackers get to keep a foothold you never found.</p>",
      expectCode:
        "_time                ParentImage      Image             CommandLine\n2026-07-26 16:02:11  explorer.exe     powershell.exe    powershell.exe -w hidden -enc SQBlAHgA...\n2026-07-26 16:02:14  powershell.exe   wupdate.exe       \"C:\\Users\\labuser\\AppData\\...\\wupdate.exe\"\n2026-07-26 16:02:31  cmd.exe          schtasks.exe      schtasks /create /tn MicrosoftEdgeUpdate...",
      fixes: [
        {
          problem: "No alerts fired at all",
          cause: "A genuine finding — your detection coverage has a gap.",
          fix: "Record it as your most important lesson learned, then proceed by hunting rather than alerting. Discovering the gap this way is worth more than the alert would have been.",
        },
      ],
    },
    {
      title: "Collect evidence before you break anything",
      time: "45 min",
      why: "Every containment action destroys evidence. Order of volatility exists because you only get one chance at memory.",
      body: "<p>Work down your checklist from step 1, hashing each artefact as you collect it and recording it in the chain of custody table.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "Volatile first",
          code: "mkdir C:\\evidence -Force; cd C:\\evidence\n\nGet-Process | Select-Object Id,ProcessName,Path,StartTime |\n  Export-Csv processes.csv -NoTypeInformation\nnetstat -anob > netstat.txt\nipconfig /displaydns > dns_cache.txt\nquery user > logged_on.txt\n\nschtasks /query /v /fo csv > tasks.csv\nGet-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' |\n  Out-File run_keys.txt",
        },
        {
          lang: "powershell",
          label: "Then disk, and hash everything",
          code: "wevtutil epl Security C:\\evidence\\security.evtx\nwevtutil epl System   C:\\evidence\\system.evtx\n\nGet-FileHash \"$env:APPDATA\\Microsoft\\Windows\\wupdate.exe\" -Algorithm SHA256\n\n# Chain of custody for the whole collection\nGet-ChildItem C:\\evidence -File |\n  Get-FileHash -Algorithm SHA256 |\n  Select-Object Hash, Path |\n  Export-Csv C:\\evidence\\MANIFEST.csv -NoTypeInformation",
        },
      ],
      expect:
        "<p>An evidence folder with a hash manifest. Copy it off the host <b>before</b> containment — an isolated machine is one you cannot easily retrieve files from.</p>",
    },
    {
      title: "Contain — and decide deliberately",
      time: "40 min",
      why: "Containment is a judgement call with real trade-offs, and being able to articulate the trade-off is what an interviewer is listening for.",
      body: "<p>Two options, and the choice is genuinely situational:</p><ul><li><b>Isolate immediately</b> — stops the spread, but tips off the attacker, who may burn their access or deploy ransomware in response.</li><li><b>Monitor first</b> — you learn their full toolkit and objectives, at the risk of further damage while you watch.</li></ul><p>For this exercise, isolate. But write down <i>why</i>, and what would have made you choose differently. That reasoning is the deliverable, not the action.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "Network isolation that preserves remote access",
          code: "# Block everything except your investigation path\nNew-NetFirewallRule -DisplayName 'IR-Block-Outbound' `\n  -Direction Outbound -Action Block -Enabled True\n\nNew-NetFirewallRule -DisplayName 'IR-Allow-Splunk' `\n  -Direction Outbound -Action Allow -RemoteAddress 192.168.56.10 `\n  -Enabled True -Priority 1",
        },
        {
          lang: "powershell",
          label: "Contain the identity too — this is the step people forget",
          code: "# The compromised service account is the real risk, not the host\nDisable-ADAccount -Identity svc_sql\n\n# Force new Kerberos tickets by resetting the password twice\n$new = ConvertTo-SecureString (\n  -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})\n) -AsPlainText -Force\nSet-ADAccountPassword -Identity svc_sql -Reset -NewPassword $new\nSet-ADAccountPassword -Identity svc_sql -Reset -NewPassword $new",
        },
      ],
      expect:
        "<p>The host cannot reach anything but Splunk, and the compromised credential is dead. Note in your log that isolating the host alone would have been insufficient — the attacker had a domain credential usable from anywhere.</p>",
      fixes: [
        {
          problem: "You lose access to the VM after applying the rules",
          cause: "The block rule also caught your management path.",
          fix: "Use the VirtualBox console, which does not traverse the guest firewall. Remove the rules with <code>Remove-NetFirewallRule -DisplayName 'IR-*'</code>.",
        },
      ],
    },
    {
      title: "Eradicate and recover",
      time: "45 min",
      why: "Eradication that misses one persistence mechanism means the attacker is back tomorrow. This is where your hunting queries from project 10 earn their keep.",
      body: "<p>Enumerate persistence exhaustively before removing any of it — remove one and you may lose the trail to the others.</p>",
      commands: [
        {
          lang: "powershell",
          label: "Find every persistence mechanism first",
          code: ".\\autorunsc.exe -accepteula -a * -c -h > autoruns.csv\n\nGet-ScheduledTask | Where-Object {\n  $_.Actions.Execute -match 'AppData|Temp|Users\\\\'\n} | Select-Object TaskName, @{N='Cmd';E={$_.Actions.Execute}}\n\nGet-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',\n                 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'\n\nGet-CimInstance Win32_Service |\n  Where-Object { $_.PathName -match 'AppData|Temp' } |\n  Select-Object Name, PathName",
        },
        {
          lang: "powershell",
          label: "Then remove all of it",
          code: "Remove-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' `\n  -Name 'WindowsUpdate' -ErrorAction SilentlyContinue\n\nUnregister-ScheduledTask -TaskName 'MicrosoftEdgeUpdateTaskUser' `\n  -Confirm:$false -ErrorAction SilentlyContinue\n\nRemove-Item \"$env:APPDATA\\Microsoft\\Windows\\wupdate.exe\" -Force -ErrorAction SilentlyContinue\n\n# Verify — re-run the enumeration and confirm it is clean\nGet-ScheduledTask | Where-Object { $_.Actions.Execute -match 'AppData|Temp' }",
        },
      ],
      expect:
        "<p>The verification search returns nothing. In a real incident with a genuine malware infection the correct answer is usually to reimage rather than clean — note that in your report, and note why you chose otherwise here.</p>",
    },
    {
      title: "Reconstruct the full timeline",
      time: "60 min",
      why: "The timeline is the report. It answers the three questions leadership always asks: how did they get in, what did they do, and how long were they there.",
      body: "<p>Merge every source into one chronological narrative — Splunk events, your incident log, the evidence artefacts.</p>",
      commands: [
        {
          lang: "spl",
          label: "One merged timeline",
          code: "index=main earliest=\"07/26/2026:15:55:00\" latest=\"07/26/2026:17:00:00\"\n(EventCode=1 OR EventCode=4688 OR EventCode=4624 OR EventCode=4769\n OR EventCode=7045 OR EventCode=4698)\n| eval activity = case(\n    EventCode==1    OR EventCode==4688, \"process: \" . Image,\n    EventCode==4624, \"logon: \" . Account_Name . \" type \" . Logon_Type,\n    EventCode==4769, \"kerberos ticket: \" . Service_Name,\n    EventCode==7045, \"service installed: \" . Service_Name,\n    EventCode==4698, \"scheduled task: \" . Task_Name)\n| table _time, host, activity\n| sort _time",
        },
      ],
      expect:
        "<p>A readable narrative. Compute the dwell time — first attacker action to first detection — and note where your visibility was weakest.</p>",
      expectCode:
        "16:02:11  soc-victim  process: powershell.exe (encoded)     <- initial execution\n16:02:14  soc-victim  process: wupdate.exe                  <- payload\n16:02:31  soc-victim  scheduled task: MicrosoftEdgeUpdate   <- persistence\n16:04:02  soc-dc      kerberos ticket: svc_sql (RC4)        <- credential access\n16:09:47  soc-victim  service installed: BTOBTO             <- lateral movement\n\nDwell time: 7 min 36 s from first execution to first alert",
    },
    {
      title: "Write the post-incident report and check your work",
      time: "60 min",
      why: "The report is the only artefact that outlives the incident. Now — and only now — open the ground truth file and find out what you missed.",
      body: "<p>Write the report first, then unseal <code>ground-truth.zip</code> and compare. Whatever you missed is the most valuable output of the entire project.</p><p>Structure:</p><ol><li><b>Executive summary</b> — five sentences: what happened, what was affected, whether it is contained, what it cost, what you are changing.</li><li><b>Timeline</b> — the merged one, in a table.</li><li><b>Root cause</b> — how they got in, and why that was possible.</li><li><b>Impact</b> — systems, accounts, data.</li><li><b>Response actions</b> — what you did, when, and why.</li><li><b>Detection gaps</b> — what you did not see, and the honest list from the ground-truth comparison.</li><li><b>Recommendations</b> — prioritised, each with an owner and a rough effort estimate.</li></ol>",
      expect:
        "<p>The comparison against ground truth is the moment of truth. Most people miss at least one stage on their first attempt — that is normal, and finding out in a lab is exactly the point.</p>",
      expectCode:
        "GROUND TRUTH vs FINDINGS\n\n✓ initial execution (encoded PowerShell)  — detected, 7m36s\n✓ payload dropped to AppData             — found during evidence collection\n✓ Run key persistence                    — found\n✗ scheduled task persistence             — MISSED, no 4698 telemetry\n✓ Kerberoasting                          — detected via RC4 rule\n✗ discovery commands (net user, nltest)   — MISSED, no detection exists\n✓ lateral movement via PsExec            — detected via 7045\n\n5 of 7 stages detected. Two gaps, both now on the backlog.",
    },
    {
      title: "Run the lessons-learned session",
      time: "40 min",
      why: "The phase everyone skips, and the only one that improves the next incident.",
      body: "<p>Answer four questions honestly, in writing:</p><ol><li><b>What worked?</b> Name the specific detections and tools that helped.</li><li><b>What did not?</b> Every gap from the ground-truth comparison.</li><li><b>What was slow?</b> Where did minutes go — looking up a command, finding a credential, deciding who to ask?</li><li><b>What changes?</b> Concrete, assigned, dated actions.</li></ol><p>Then actually do one of them before you close the project. A lessons-learned document with no completed action is theatre.</p>",
      expect:
        "<p>An action list with at least one item marked done. That closes the loop, and the loop closing is what the whole lifecycle is for.</p>",
      expectCode:
        "ACTIONS\n[done]     Write detection for 4698 scheduled task creation from user paths\n[open]     Enable Sysmon on soc-dc                        due: next session\n[open]     Build discovery-command detection (net/nltest)  due: 2 weeks\n[open]     Add IR runbook link to every high-severity alert",
    },
  ],
  after: [
    "Restore every snapshot. This lab currently contains a compromised domain.",
    "Re-run the same scenario in a month without re-reading your notes. Your dwell time should drop sharply — that improvement is the number worth quoting.",
    "Read a real published incident report — CISA advisories and the Mandiant M-Trends report are both free and excellent models for structure.",
    "Keep the report. \"Walk me through an incident you handled\" is the most common L3 interview question there is.",
  ],
};
