/**
 * Hands-on projects for the SOC-prep kit — the things you actually build, so
 * you have something concrete to talk about in an interview.
 *
 * Every project is free to run at home. Each one carries a full step-by-step
 * guide, how to validate it worked, and how to pitch it when asked
 * "tell me about something you've built".
 *
 * String fields may contain inline HTML (<b>, <code>) and render inside
 * .soc-prose containers.
 */
import type { Level } from "./data";

export interface ProjectStep {
  title: string;
  detail: string;
}

export interface Project {
  id: number;
  level: Level;
  category: string;
  title: string;
  /** One line — what this is. */
  tagline: string;
  /** What you physically have when you finish. */
  outcome: string;
  /** What it proves to an interviewer. */
  proves: string;
  hours: string;
  cost: string;
  /** Tools used. */
  stack: string[];
  prerequisites: string[];
  steps: ProjectStep[];
  /** How you know it actually worked. */
  validation: string[];
  /** How to talk about it when asked. */
  pitch: string;
  /** Ways to take it further. */
  stretch: string[];
}

export const PROJECTS: Project[] = [
  /* ================= L1 ================= */
  {
    id: 1,
    level: "l1",
    category: "Lab Build",
    title: "Build your own home SOC lab",
    tagline: "A Windows endpoint shipping rich telemetry into a real SIEM you own.",
    outcome:
      "<p>A working lab: a Windows VM with <b>Sysmon</b> installed, forwarding logs into a free SIEM, where you can search events and build detections. Everything else on this page depends on this — build it first.</p>",
    proves:
      "It moves you from 'I read about SIEM' to 'I run one'. Interviewers ask what your lab looks like; this is the answer.",
    hours: "4–6 hours",
    cost: "Free",
    stack: ["VirtualBox or VMware Workstation Player", "Windows 10/11 eval VM", "Sysmon + SwiftOnSecurity config", "Wazuh (or Elastic / Sentinel free tier)"],
    prerequisites: [
      "A host machine with <b>16 GB RAM</b> ideally (8 GB works with one VM at a time)",
      "~80 GB free disk",
      "Comfort installing software and editing a config file",
    ],
    steps: [
      {
        title: "Install a hypervisor",
        detail:
          "<p>Install <b>VirtualBox</b> (free) or VMware Workstation Player. Create an internal/host-only network so your lab VMs can talk to each other but cannot reach your home network — this matters the moment you start detonating things.</p>",
      },
      {
        title: "Create the Windows victim VM",
        detail:
          "<p>Download a free <b>Windows 10/11 Enterprise evaluation ISO</b> from Microsoft (90 days, renewable) or a ready-made dev VM. Give it 4 GB RAM and 60 GB disk. Take a <b>snapshot</b> as soon as it's installed and clean — you will roll back to this constantly.</p>",
      },
      {
        title: "Install Sysmon with a real config",
        detail:
          "<p>Download Sysmon from Microsoft Sysinternals and <b>SwiftOnSecurity's sysmon-config</b> (or Olaf Hartong's <i>sysmon-modular</i>). Never use the default config — it logs far too much. Install with:</p><pre>sysmon64.exe -accepteula -i sysmonconfig-export.xml</pre><p>Verify events are landing in Event Viewer under <b>Applications and Services Logs → Microsoft-Windows-Sysmon/Operational</b>.</p>",
      },
      {
        title: "Turn on the audit policies Windows leaves off",
        detail:
          "<p>In <code>gpedit.msc</code> enable <b>Audit Process Creation</b>, then enable <b>'Include command line in process creation events'</b> under Administrative Templates → System → Audit Process Creation. Also enable <b>PowerShell Script Block Logging</b>. Without these, 4688 and 4104 are far less useful.</p>",
      },
      {
        title: "Stand up the SIEM",
        detail:
          "<p>Pick one: <b>Wazuh</b> (all-in-one OVA, easiest), <b>Elastic Security</b> (free tier, great UI), or <b>Microsoft Sentinel</b> (free trial + free data tiers, and the most in-demand skill). Deploy it as a second VM or in the cloud free tier.</p>",
      },
      {
        title: "Ship the logs",
        detail:
          "<p>Install the agent on the Windows VM (Wazuh agent / Elastic Agent / Azure Monitor Agent) and point it at your SIEM. Configure it to collect <b>Security</b>, <b>System</b>, <b>Sysmon/Operational</b>, and <b>PowerShell/Operational</b> channels.</p>",
      },
      {
        title: "Prove ingestion end to end",
        detail:
          "<p>On the VM, open a command prompt and run <code>whoami</code> and <code>ipconfig</code>. Then search your SIEM for those process-creation events. If you can find them with the full command line, your pipeline works. <b>Do not move on until this works</b> — everything else builds on it.</p>",
      },
      {
        title: "Write your first detection",
        detail:
          "<p>Create a rule that fires when a process is created with an <b>encoded PowerShell command line</b> (matching <code>-enc</code> or <code>-EncodedCommand</code>). Then trigger it yourself with a harmless encoded command and confirm the alert fires.</p>",
      },
    ],
    validation: [
      "You can search a process-creation event <b>with its command line</b> in the SIEM.",
      "Sysmon Event ID 1 and 3 appear for activity you generate.",
      "Your first custom rule fires on demand and stays quiet otherwise.",
      "You can revert the VM to a clean snapshot in under a minute.",
    ],
    pitch:
      "\"I run a home lab with a Windows endpoint shipping Sysmon and Security logs into Wazuh. I built it specifically so I could write detections and then attack myself to test them — the first one I wrote was for encoded PowerShell, and tuning out my own false positives taught me more than any course.\"",
    stretch: [
      "Add a Linux VM and forward <code>auth.log</code> and auditd.",
      "Add a domain controller and practise AD attacks (see project 06).",
      "Version-control your detection rules in Git from day one.",
    ],
  },
  {
    id: 2,
    level: "l1",
    category: "Detection",
    title: "Detect a brute force — then the one that succeeded",
    tagline: "Attack your own lab, then build the detection that catches it.",
    outcome:
      "<p>A working brute-force detection, plus the more valuable one: <b>failures followed by a success</b>. You'll have the query, the alert, and screenshots of it firing.</p>",
    proves:
      "That you understand the difference between noise (failures) and an incident (failures then success) — the single most common L1 triage decision.",
    hours: "2–3 hours",
    cost: "Free",
    stack: ["Your lab from project 01", "Hydra or Crowbar (or a simple PowerShell loop)", "Your SIEM's query language"],
    prerequisites: [
      "Project 01 complete and ingesting logs",
      "RDP or SMB enabled on the victim VM (lab network only)",
    ],
    steps: [
      {
        title: "Baseline first",
        detail:
          "<p>Before attacking, query for <b>4625</b> (failed logon) over the last 24 hours. Note how many you normally get — usually near zero in a lab. This baseline is what makes the spike meaningful.</p>",
      },
      {
        title: "Run the attack against yourself",
        detail:
          "<p>From a Kali VM (or just a PowerShell loop) attempt logins with wrong passwords, then finish with the <b>correct</b> one. <b>Only ever against your own isolated lab VM.</b> A simple version:</p><pre>1..20 | ForEach-Object {\n  net use \\\\10.0.0.5\\C$ /user:labuser \"wrong$_\"\n}\nnet use \\\\10.0.0.5\\C$ /user:labuser \"TheRealPassword\"</pre>",
      },
      {
        title: "Find the failures",
        detail:
          "<p>Query 4625 grouped by target account and source. Confirm you can see the burst, and note the <b>LogonType</b> and <b>Source Network Address</b> fields — these are what you'd pivot on in a real investigation.</p>",
      },
      {
        title: "Find the success hiding in the noise",
        detail:
          "<p>Now write the query that matters: 4625 failures above a threshold, <b>joined</b> to a subsequent 4624 for the same account within a time window. This is the difference between an alert people ignore and one that means something.</p>",
      },
      {
        title: "Build the spray variant",
        detail:
          "<p>Invert it: <b>one source IP, many different accounts, few attempts each</b>. Password spray defeats per-account lockout thresholds, so a naive brute-force rule misses it entirely. Write this as a separate rule.</p>",
      },
      {
        title: "Turn it into an alert and document it",
        detail:
          "<p>Save both as scheduled rules. Write a short doc for each: what it detects, why the threshold is what it is, expected false positives, and what an analyst should do when it fires. <b>That doc is the part that impresses interviewers.</b></p>",
      },
    ],
    validation: [
      "The failures-then-success rule fires on your simulated attack.",
      "It does <b>not</b> fire when you generate failures alone.",
      "The spray rule catches the many-accounts pattern the brute-force rule misses.",
      "Each rule has a written FP note and a response step.",
    ],
    pitch:
      "\"I wrote a detection for brute force in my lab, but the useful version was joining failures to a subsequent success — failures alone are weather. Then I built a second rule for password spray, because spray keeps attempts below the lockout threshold and my first rule would never have seen it.\"",
    stretch: [
      "Add geo/ASN enrichment and alert on success from an unfamiliar country.",
      "Simulate the same attack against Entra ID free tier and detect it in SigninLogs.",
      "Measure how long your rule takes to fire — that's MTTD.",
    ],
  },
  {
    id: 3,
    level: "l1",
    category: "Phishing",
    title: "Phishing analysis workflow",
    tagline: "Take a real phishing email apart safely, end to end.",
    outcome:
      "<p>A repeatable phishing triage workflow and a written analysis of at least three real samples — headers, URLs, attachments, and a verdict with evidence.</p>",
    proves:
      "Phishing is the highest-volume L1 ticket. This shows you can work one methodically instead of guessing.",
    hours: "3–4 hours",
    cost: "Free",
    stack: ["PhishTool (free tier)", "MXToolbox header analyser", "URLScan.io", "VirusTotal", "CyberChef", "Any.run (free tier)"],
    prerequisites: [
      "Real phishing samples — use your own spam folder or a public corpus",
      "<b>Never open attachments on your host machine.</b> Use the lab VM or an online sandbox",
    ],
    steps: [
      {
        title: "Get safe samples",
        detail:
          "<p>Export a few real phishing emails from your own spam folder as <code>.eml</code>. Public corpora also work. Handle them on the lab VM only, and never click links from your host.</p>",
      },
      {
        title: "Read the headers properly",
        detail:
          "<p>Paste the full headers into MXToolbox or PhishTool. Trace the <b>Received</b> chain from the bottom up to find the true origin. Check <b>SPF, DKIM and DMARC</b> results — and note whose domain they passed for. Passing for <code>micros0ft-verify.co</code> is not the same as passing for <code>microsoft.com</code>.</p>",
      },
      {
        title: "Compare display name against the real sender",
        detail:
          "<p>Write down the display name, the <code>From:</code> address, the <code>Reply-To:</code>, and the <code>Return-Path:</code>. Mismatches between these are the most common giveaway. Look for lookalike domains — <code>rn</code> for <code>m</code>, <code>0</code> for <code>o</code>.</p>",
      },
      {
        title: "Detonate the URL safely",
        detail:
          "<p>Submit the link to <b>URLScan.io</b> and look at the screenshot and the domain age. Never visit it directly. Check whether it redirects, and whether the landing page mimics a login form — that's a credential harvester.</p>",
      },
      {
        title: "Analyse the attachment without opening it",
        detail:
          "<p>Hash it and check <b>VirusTotal</b> first. If it's a document, use <code>oleid</code>/<code>olevba</code> (from oletools) on the lab VM to check for macros without executing. For a full picture, detonate in <b>Any.run</b> and watch what it spawns.</p>",
      },
      {
        title: "Write the verdict like an analyst",
        detail:
          "<p>Produce a short report: verdict (malicious / benign / benign true positive), the <b>evidence</b> behind it, extracted IOCs (sender domain, URL, file hash), and recommended actions (block domain, purge from mailboxes, reset any user who submitted credentials). Repeat for three samples.</p>",
      },
    ],
    validation: [
      "You can state, with evidence, whether each sample is malicious.",
      "You correctly identified at least one that <b>passed SPF/DKIM/DMARC and was still malicious</b>.",
      "You extracted IOCs in a form someone could block.",
      "Nothing was ever opened on your host machine.",
    ],
    pitch:
      "\"I built a repeatable phishing workflow — headers, sender mismatch, URL detonation in URLScan, attachment analysis in a sandbox — and wrote it up for a few real samples. The one that stuck with me passed SPF, DKIM and DMARC: it was the attacker's own lookalike domain, which taught me authentication proves domain control, not trust.\"",
    stretch: [
      "Automate IOC extraction from <code>.eml</code> files with a Python script.",
      "Build a detection for inbox rules that hide or forward mail.",
      "Document the response difference between 'clicked' and 'submitted credentials'.",
    ],
  },
  {
    id: 4,
    level: "l1",
    category: "Log Analysis",
    title: "Log analysis from raw files — no SIEM",
    tagline: "Find the intrusion in a real log set using nothing but the command line.",
    outcome:
      "<p>A written timeline of an intrusion reconstructed from raw logs, built with <code>grep</code>, <code>awk</code> and <code>jq</code> — proving you can work without a SIEM doing it for you.</p>",
    proves:
      "SIEMs abstract the data. Knowing what the raw log actually looks like is what separates an analyst from a dashboard-watcher.",
    hours: "3–4 hours",
    cost: "Free",
    stack: ["Free log datasets (Boss of the SOC, Security Datasets project)", "grep / awk / sort / uniq", "jq for JSON logs", "Timeline Explorer or a spreadsheet"],
    prerequisites: ["Basic command-line comfort", "A Linux VM or WSL"],
    steps: [
      {
        title: "Get a real dataset",
        detail:
          "<p>Download a public dataset — <b>Security Datasets</b> (formerly Mordor) has labelled attack telemetry, and <b>Splunk Boss of the SOC</b> datasets are excellent. Pick one with a documented attack so you can check your work afterwards.</p>",
      },
      {
        title: "Orient yourself before searching",
        detail:
          "<p>Find out what you have: how many events, what time range, which hosts, which log sources. <code>jq '.Hostname' data.json | sort | uniq -c | sort -rn</code>. <b>Never start searching before you know the shape of the data.</b></p>",
      },
      {
        title: "Find the initial access",
        detail:
          "<p>Look for the earliest anomaly — an unusual parent process, a logon from a new source, a download. Work forward from the earliest suspicious event rather than backwards from the loudest one.</p>",
      },
      {
        title: "Follow the process tree",
        detail:
          "<p>Pivot on ProcessGuid / ParentProcessGuid to reconstruct the execution chain. Build it out as a tree on paper or in a text file. This is the same pivot you'd do in an EDR console, done by hand.</p>",
      },
      {
        title: "Build the timeline",
        detail:
          "<p>Put every relevant event into a spreadsheet with <b>timestamp (in UTC), host, user, event, evidence</b>. Sort by time. This artifact <i>is</i> the investigation — an incident report is mostly a narrated timeline.</p>",
      },
      {
        title: "Check your answer and write it up",
        detail:
          "<p>Compare against the dataset's documented attack. Note what you missed and <b>why</b> — that reflection is the actual learning. Write a one-page report: what happened, how you know, what you'd have needed to detect it sooner.</p>",
      },
    ],
    validation: [
      "Your timeline matches the documented attack chain.",
      "You can name the initial access vector and cite the log line proving it.",
      "You wrote down what you missed on the first pass.",
      "Every timestamp is in a single timezone.",
    ],
    pitch:
      "\"I worked a public attack dataset with just grep and jq to force myself to understand the raw telemetry instead of relying on a SIEM's UI. I rebuilt the process tree by pivoting on ProcessGuid and produced a timeline, then compared it to the documented attack — I'd missed the persistence step, which is exactly why I now check scheduled tasks and WMI on every case.\"",
    stretch: [
      "Ingest the same dataset into your SIEM and compare how much faster it is.",
      "Write a Sigma rule for the technique you missed.",
      "Practise the same workflow on Linux auth.log and web server logs.",
    ],
  },

  /* ================= L2 ================= */
  {
    id: 5,
    level: "l2",
    category: "Detection Engineering",
    title: "Detection engineering with Sigma",
    tagline: "Write portable detections, test them against real telemetry, and tune them.",
    outcome:
      "<p>A small Git repo of <b>Sigma rules</b> you wrote, each with metadata, ATT&CK mapping, test evidence, and a documented false-positive profile.</p>",
    proves:
      "Detection engineering is the main L1→L2 differentiator. A repo of tested rules is portfolio gold.",
    hours: "6–8 hours",
    cost: "Free",
    stack: ["Sigma + sigma-cli", "Your lab SIEM", "Atomic Red Team", "Git/GitHub"],
    prerequisites: ["Project 01 lab running", "Basic YAML comfort"],
    steps: [
      {
        title: "Learn the Sigma format",
        detail:
          "<p>Read the SigmaHQ spec and a few community rules. A rule is <b>logsource</b> + <b>detection</b> (selection + condition) + metadata. The value of Sigma is portability — one rule converts to KQL, SPL, or Elastic DSL.</p>",
      },
      {
        title: "Pick techniques worth detecting",
        detail:
          "<p>Choose 5–8 ATT&CK techniques with real signal. Good starters: <b>T1059.001</b> encoded PowerShell, <b>T1218</b> LOLBin abuse, <b>T1053.005</b> scheduled task creation, <b>T1003.001</b> LSASS access, <b>T1562.008</b> log clearing.</p>",
      },
      {
        title: "Write the rules",
        detail:
          "<p>One YAML file per technique. Fill in <b>every</b> metadata field — title, id, status, description, references, author, date, tags (the ATT&CK ID), falsepositives, level. Six months later that metadata is why the rule is maintainable.</p>",
      },
      {
        title: "Convert and deploy",
        detail:
          "<p>Use <code>sigma convert -t &lt;backend&gt; rule.yml</code> to generate the query for your SIEM. Deploy each as a scheduled rule.</p>",
      },
      {
        title: "Attack yourself with Atomic Red Team",
        detail:
          "<p>Install <b>Invoke-AtomicRedTeam</b> in the lab and execute the matching atomic test for each technique:</p><pre>Invoke-AtomicTest T1059.001 -TestNumbers 1</pre><p>Confirm each rule fires. <b>A rule you have not tested is a hope, not a detection.</b></p>",
      },
      {
        title: "Tune against benign activity",
        detail:
          "<p>Now use the machine normally — install software, run admin tasks, update things. Anything that fires is a false positive. Tune with a <b>narrow, specific exclusion</b>, never a blanket one, and record why in the rule's <code>falsepositives</code> field.</p>",
      },
      {
        title: "Publish the repo",
        detail:
          "<p>Push to GitHub with a README explaining your methodology: how you pick techniques, how you test, how you tune. <b>Link this repo on your CV.</b></p>",
      },
    ],
    validation: [
      "Every rule fires on its Atomic Red Team test.",
      "Every rule stays silent during an hour of normal use.",
      "Each has an ATT&CK tag and a written FP note.",
      "The repo has a README a stranger could follow.",
    ],
    pitch:
      "\"I keep a Sigma repo of detections I've written and tested. My process is: pick the technique, write the rule, prove it fires with Atomic Red Team, then use the machine normally for an hour and tune out whatever it catches. The tuning is the real work — my LOLBin rule fired on a legitimate installer, so I scoped the exclusion to that specific parent and path rather than muting the binary.\"",
    stretch: [
      "Add a GitHub Action that lints and validates every rule on push.",
      "Generate an ATT&CK coverage heatmap from your rule metadata.",
      "Contribute a rule upstream to SigmaHQ.",
    ],
  },
  {
    id: 6,
    level: "l2",
    category: "Active Directory",
    title: "AD attack lab — Kerberoasting and lateral movement",
    tagline: "Build a domain, attack it, and detect every step.",
    outcome:
      "<p>A working AD lab plus detections for Kerberoasting, password spray, PsExec lateral movement, and credential dumping — each with proof it fired.</p>",
    proves:
      "Most enterprise intrusions are AD intrusions. This is the single most relevant lab for a real SOC.",
    hours: "8–10 hours",
    cost: "Free",
    stack: ["Windows Server eval", "GOAD or BadBlood for realistic AD", "Rubeus / Impacket / CrackMapExec", "Your SIEM"],
    prerequisites: [
      "Project 01 complete",
      "<b>Isolated lab network only</b> — never point these tools at anything you don't own",
    ],
    steps: [
      {
        title: "Build the domain",
        detail:
          "<p>Install Windows Server evaluation, promote to a domain controller, and join your Windows 10 VM. To get realistic mess quickly, run <b>BadBlood</b> to populate thousands of users/groups, or deploy <b>GOAD</b> (Game of Active Directory) for a full vulnerable-by-design environment.</p>",
      },
      {
        title: "Collect DC logs",
        detail:
          "<p>Point your SIEM agent at the DC's <b>Security</b> log. This is essential — <b>4768/4769/4662 only exist on domain controllers</b>, and a SIEM collecting only workstations is blind to AD attacks.</p>",
      },
      {
        title: "Create a Kerberoastable account",
        detail:
          "<p>Create a service account and register an SPN for it, with a deliberately weak password:</p><pre>setspn -a MSSQLSvc/sql01.lab.local:1433 lab\\svc_sql</pre>",
      },
      {
        title: "Kerberoast it",
        detail:
          "<p>From a normal domain user, request the ticket with Rubeus (<code>Rubeus.exe kerberoast</code>) or Impacket's <code>GetUserSPNs.py</code>, then crack it offline with hashcat mode <b>13100</b>. Notice there are <b>no failed logons and no lockouts</b> — that's why it's dangerous.</p>",
      },
      {
        title: "Detect it",
        detail:
          "<p>Write a rule on <b>4769 with TicketEncryptionType 0x17</b> (RC4) in an AES domain, and a second on one account requesting many distinct SPNs in a short window. Then add a <b>honeypot SPN</b> — a decoy account nobody should ever request — and alert on any ticket request for it.</p>",
      },
      {
        title: "Move laterally and detect that",
        detail:
          "<p>Use PsExec or CrackMapExec to move to another host. Watch for <b>7045</b> (service installed) with a random name, and <b>4624 Type 3</b> from an unusual source. Write detections for both.</p>",
      },
      {
        title: "Dump credentials and detect it",
        detail:
          "<p>Run Mimikatz against LSASS in the lab. Detect it with <b>Sysmon Event 10 (ProcessAccess)</b> targeting <code>lsass.exe</code> with <code>GrantedAccess 0x1010</code>. This is the highest-value detection in the whole lab.</p>",
      },
      {
        title: "Write it up as an attack chain",
        detail:
          "<p>Document the full chain — initial access → Kerberoast → crack → lateral movement → credential dump — with the detection for each stage and which ones would have stopped it earliest.</p>",
      },
    ],
    validation: [
      "The RC4-downgrade rule fires on your Kerberoast.",
      "The honeypot SPN rule fires with zero false positives.",
      "LSASS access detection catches Mimikatz.",
      "You can explain which single detection would have stopped the chain earliest.",
    ],
    pitch:
      "\"I built an AD lab with BadBlood, Kerberoasted a service account I'd deliberately weakened, and cracked the ticket offline — which drove home that there are no failed logons to alert on. So I detected the RC4 downgrade instead, and added a honeypot SPN, which is about as close to a zero-false-positive rule as you get.\"",
    stretch: [
      "Add DCSync and detect it via 4662 replication GUIDs.",
      "Practise Golden Ticket and detect anomalous ticket lifetimes.",
      "Run BloodHound to see the attack paths your lab exposes.",
    ],
  },
  {
    id: 7,
    level: "l2",
    category: "Malware",
    title: "Malware triage lab",
    tagline: "Static, then dynamic — a full analysis pipeline on a real sample.",
    outcome:
      "<p>A malware analysis report on a real sample, with static properties, dynamic behaviour, extracted IOCs, and a <b>YARA rule you wrote</b> from the unpacked payload.</p>",
    proves:
      "Analysis is escalated to L2. Showing you know when to stop escalating effort is as important as the analysis itself.",
    hours: "6–8 hours",
    cost: "Free",
    stack: ["REMnux + FLARE-VM", "INetSim or FakeNet-NG", "PEStudio, Detect It Easy, CyberChef", "Procmon, Process Hacker, Wireshark", "YARA"],
    prerequisites: [
      "<b>A fully isolated VM with no host shared folders and no network bridge.</b> This is non-negotiable",
      "Snapshots configured before every run",
    ],
    steps: [
      {
        title: "Build the analysis environment",
        detail:
          "<p>Deploy <b>FLARE-VM</b> (Windows analysis) and <b>REMnux</b> (Linux tooling). Put them on a host-only network with REMnux running <b>INetSim</b> so the malware gets plausible responses and proceeds instead of exiting.</p>",
      },
      {
        title: "Get a safe sample",
        detail:
          "<p>Use MalwareBazaar or theZoo. Start with a well-documented commodity family so you can check your work. <b>Snapshot before you copy the sample in.</b></p>",
      },
      {
        title: "Static analysis first — never execute yet",
        detail:
          "<p>Hash it and check VirusTotal. Then look at <b>entropy</b> (Detect It Easy) — above 7.2 means packed. Check the <b>import table</b> in PEStudio: <code>VirtualAllocEx + WriteProcessMemory + CreateRemoteThread</code> means injection; <code>CryptEncrypt + FindFirstFile</code> means ransomware. Pull strings. Decide: packed or not?</p>",
      },
      {
        title: "Detonate and watch",
        detail:
          "<p>Start Procmon, Process Hacker and Wireshark, then run the sample. Record: child processes, files dropped, registry keys written (Run keys, services), and network connections. Stop after a few minutes and <b>revert the snapshot</b>.</p>",
      },
      {
        title: "Dump the unpacked payload from memory",
        detail:
          "<p>If it was packed, let it unpack itself in memory, then dump the process with Process Hacker or PE-sieve. <b>The malware must decrypt itself to run</b>, so memory always wins. Re-run strings on the dump — this is where the real C2 and mutex appear.</p>",
      },
      {
        title: "Write a YARA rule that survives",
        detail:
          "<p>Build a rule from the <b>unpacked</b> content: a distinctive mutex, a code sequence with wildcards, a PDB path. Use <code>2 of them</code> rather than <code>all of them</code>, anchor with <code>uint16(0) == 0x5A4D</code>, and <b>test it against a clean corpus</b> before you'd ever deploy it.</p>",
      },
      {
        title: "Write the report",
        detail:
          "<p>Structure it: summary, static findings, dynamic behaviour, persistence mechanism, IOCs (hash / C2 / mutex / paths), detection opportunities, and the YARA rule. Note explicitly <b>where you chose to stop and why</b>.</p>",
      },
    ],
    validation: [
      "You determined packed vs unpacked <b>before</b> executing anything.",
      "You captured C2 and persistence from dynamic analysis.",
      "Your YARA rule matches the sample and not a clean corpus.",
      "The host machine was never at risk at any point.",
    ],
    pitch:
      "\"I analyse samples in an isolated FLARE-VM/REMnux setup with INetSim. My habit is static first — entropy and imports tell me whether the strings I can see are lies before I waste an hour on them. On one sample the packer had no public unpacker, so I let it unpack in memory and dumped the process; the mutex and C2 fell straight out, and I built a YARA rule on the unpacked code rather than the packed file.\"",
    stretch: [
      "Analyse a sample that uses anti-analysis and defeat the checks.",
      "Do memory forensics with Volatility on a capture from the detonation.",
      "Write a Sigma rule for the behaviour, not just YARA for the file.",
    ],
  },
  {
    id: 8,
    level: "l2",
    category: "Automation",
    title: "Automated alert enrichment",
    tagline: "Stop doing the same five lookups by hand on every alert.",
    outcome:
      "<p>A script or SOAR playbook that takes an alert and automatically enriches it — reputation, geo/ASN, asset criticality, user privilege, prior alerts — and writes the result back to the case.</p>",
    proves:
      "Automation is what moves a SOC from reactive to scalable, and it's a very visible efficiency win to talk about.",
    hours: "5–7 hours",
    cost: "Free",
    stack: ["Python", "VirusTotal / AbuseIPDB / URLScan free APIs", "Shuffle SOAR (free) or plain scripts", "Your SIEM's API"],
    prerequisites: ["Basic Python", "Free API keys (all have free tiers)"],
    steps: [
      {
        title: "Time yourself doing it manually",
        detail:
          "<p>Work five alerts by hand and <b>record how long the lookups take</b>. That number is your baseline and your business case — 'I saved 4 minutes per alert' is far stronger than 'I wrote a script'.</p>",
      },
      {
        title: "Design the enrichment set",
        detail:
          "<p>Decide exactly what context an analyst always wants: IP reputation, geo + ASN (residential vs hosting), domain age, file hash verdict, whether the user is privileged, asset criticality, and how many alerts this entity had in 30 days.</p>",
      },
      {
        title: "Build the API clients",
        detail:
          "<p>Write small functions for VirusTotal, AbuseIPDB and URLScan. <b>Handle rate limits and failures gracefully</b> — free tiers are strict, and an enrichment that crashes on a 429 is worse than none.</p>",
      },
      {
        title: "Pull the alert and extract entities",
        detail:
          "<p>Query your SIEM's API for new alerts and parse out IPs, domains, hashes, users and hosts. Normalise them — deduplicate, strip ports, defang/refang consistently.</p>",
      },
      {
        title: "Score and summarise",
        detail:
          "<p>Don't just dump raw API output — that's more noise. Produce a <b>short verdict block</b>: 'IP: hosting provider (DigitalOcean), 14 AbuseIPDB reports, first seen 3 days ago.' Add a simple risk score so alerts can be ordered.</p>",
      },
      {
        title: "Write it back and measure",
        detail:
          "<p>Post the enrichment as a comment on the case, or into a Slack/Teams channel. Then re-time triage on five alerts and compare with your baseline.</p>",
      },
    ],
    validation: [
      "Running it on a real alert produces useful context in under 30 seconds.",
      "It survives an API failure or rate limit without crashing.",
      "You can state the time saved per alert with a number.",
      "The output is a readable summary, not raw JSON.",
    ],
    pitch:
      "\"I noticed I was doing the same five lookups on every alert, so I timed it — about four minutes each. I wrote an enrichment script that pulls reputation, ASN, domain age and the entity's 30-day alert history and posts a short verdict block to the case. It cut triage to under a minute and, more importantly, made the context consistent instead of dependent on which analyst picked it up.\"",
    stretch: [
      "Add auto-containment for high-confidence cases, with an approval step.",
      "Build a daily digest of the top entities seen across alerts.",
      "Rebuild it as a proper SOAR playbook in Shuffle.",
    ],
  },

  /* ================= L3 ================= */
  {
    id: 9,
    level: "l3",
    category: "Purple Team",
    title: "Purple team exercise and coverage map",
    tagline: "Emulate a full attack chain, measure what you actually detect, and close the gaps.",
    outcome:
      "<p>An ATT&CK coverage heatmap backed by <b>evidence</b> — every technique emulated, with the detection result recorded — plus a remediation plan for the gaps.</p>",
    proves:
      "Senior work is measuring and improving the programme, not just working alerts. Validated coverage is the strongest artifact you can show.",
    hours: "10–12 hours",
    cost: "Free",
    stack: ["Atomic Red Team / CALDERA", "MITRE ATT&CK Navigator", "VECTR (free) for tracking", "Your lab + SIEM"],
    prerequisites: ["Projects 01, 05 and 06 complete", "A lab with detections already deployed"],
    steps: [
      {
        title: "Pick a real adversary to emulate",
        detail:
          "<p>Choose a threat actor relevant to a sector you care about and pull their techniques from ATT&CK. Emulating a <b>real, documented chain</b> is far more meaningful than firing off random atomics.</p>",
      },
      {
        title: "Build the emulation plan",
        detail:
          "<p>Map their techniques across the kill chain: initial access → execution → persistence → privilege escalation → defense evasion → credential access → lateral movement → exfiltration. Write down, <b>in advance</b>, what you expect to detect for each. Predicting first is what makes the result honest.</p>",
      },
      {
        title: "Execute one technique at a time",
        detail:
          "<p>Run each technique separately and record: did an alert fire? Was the telemetry present but unalerted? Or was there no data at all? Those three outcomes need three different fixes.</p>",
      },
      {
        title: "Record results rigorously",
        detail:
          "<p>Track in VECTR or a spreadsheet: technique, tool, timestamp, detected (Y/N), alert name, data source, notes. <b>Timestamps matter</b> — they let you compute time-to-detect.</p>",
      },
      {
        title: "Classify every gap",
        detail:
          "<p>Each miss is one of: <b>no log source</b> (collection gap), <b>logs present but no rule</b> (detection gap), or <b>rule exists but didn't fire</b> (a broken rule — the most dangerous, because the heatmap claimed coverage). Fix each differently.</p>",
      },
      {
        title: "Close the gaps and re-test",
        detail:
          "<p>Write the missing detections, onboard the missing log sources, repair the broken rules. Then <b>re-run the entire exercise</b> and show the before/after coverage.</p>",
      },
      {
        title: "Report to two audiences",
        detail:
          "<p>A technical report (techniques, rules, evidence) and a one-page executive summary (coverage before/after, risk reduced, what you need next). Being able to write both is a senior skill.</p>",
      },
    ],
    validation: [
      "Every technique has a recorded detected/not-detected result.",
      "Each gap is classified as collection / detection / broken-rule.",
      "You have before-and-after coverage numbers.",
      "The heatmap is backed by evidence, not assertion.",
    ],
    pitch:
      "\"I ran a purple team exercise emulating a documented actor and predicted the outcome for each technique before executing. Six of twelve produced no alert — and the uncomfortable finding was that the rules existed, but the log source they depended on had silently stopped forwarding weeks earlier. That's why I now monitor log-source health as a detection control in its own right.\"",
    stretch: [
      "Automate the emulation on a schedule so coverage is continuously validated.",
      "Add detection-as-code CI that replays these tests on every rule change.",
      "Compute mean time-to-detect per tactic and trend it.",
    ],
  },
  {
    id: 10,
    level: "l3",
    category: "Threat Hunting",
    title: "Hypothesis-driven threat hunting programme",
    tagline: "Go looking for what your alerts never caught — and prove it's repeatable.",
    outcome:
      "<p>A documented hunt programme: a hypothesis backlog, three completed hunts with findings, and <b>new detections created from what you found</b>.</p>",
    proves:
      "Hunting is explicitly measuring your false negatives. Doing it methodically — not just poking around — is what makes it senior work.",
    hours: "8–10 hours",
    cost: "Free",
    stack: ["Your lab + real or public datasets", "PEAK or TaHiTI hunting framework", "Jupyter notebooks (optional but impressive)"],
    prerequisites: ["A SIEM with a decent volume of data", "Comfort writing complex queries"],
    steps: [
      {
        title: "Write hypotheses, not searches",
        detail:
          "<p>A hunt starts with a testable statement: <b>'An attacker is using DNS tunnelling for C2 in our environment.'</b> Not 'let me look at DNS'. Build a backlog of 10 hypotheses drawn from threat intel, ATT&CK gaps, and your own crown jewels.</p>",
      },
      {
        title: "Pick a framework and stick to it",
        detail:
          "<p>Use <b>PEAK</b> (Prepare, Execute, Act with Knowledge) or TaHiTI. The framework is what turns hunting from a hobby into something repeatable and reportable.</p>",
      },
      {
        title: "Define the data and the abnormal",
        detail:
          "<p>For each hypothesis, state <b>before searching</b>: which log source, what time range, and what 'abnormal' looks like numerically. For DNS tunnelling: unique subdomain count per parent domain per host, above some threshold.</p>",
      },
      {
        title: "Hunt, and expect nothing",
        detail:
          "<p>Run the analysis. <b>Most hunts find nothing malicious — that is a valid, valuable result.</b> Record it. What you almost always find instead is misconfiguration, shadow IT, and broken logging, all of which are worth reporting.</p>",
      },
      {
        title: "Turn findings into detections",
        detail:
          "<p>Every hunt should end with an artifact: a new detection rule, a tuning change, a new log source onboarded, or a documented baseline. <b>A hunt that produces no artifact was entertainment.</b></p>",
      },
      {
        title: "Document so someone else can re-run it",
        detail:
          "<p>Write each hunt up: hypothesis, data sources, method, queries, findings, actions taken, and how long it took. A Jupyter notebook with the queries embedded is a genuinely impressive portfolio piece.</p>",
      },
    ],
    validation: [
      "Three hunts completed and written up.",
      "Each ended in a concrete artifact, including the ones that found nothing.",
      "Someone else could re-run your hunt from the documentation.",
      "You can state your hunt yield — findings no alert produced.",
    ],
    pitch:
      "\"I run hunts against hypotheses rather than browsing data. One was 'an attacker is tunnelling C2 over DNS' — I defined abnormal as unique subdomain count per parent domain per host, and found no attacker but did find a misconfigured appliance generating enormous DNS volume. The artifact was a scheduled analytic plus an allowlist I had to tune honestly, and it fired for real during a later red team engagement.\"",
    stretch: [
      "Build hunts as reusable Jupyter notebooks with parameterised queries.",
      "Track hunt yield as a metric over time.",
      "Hunt across cloud telemetry — identity and control-plane logs.",
    ],
  },
  {
    id: 11,
    level: "l3",
    category: "Detection Engineering",
    title: "Detection-as-code pipeline",
    tagline: "Treat detections like software: versioned, reviewed, tested, deployed by CI.",
    outcome:
      "<p>A Git repo where a pull request lints a rule, tests it against known-bad and known-good telemetry, and deploys it automatically on merge.</p>",
    proves:
      "This is a genuinely senior capability that most SOCs don't have. It demonstrates engineering maturity, not just security knowledge.",
    hours: "10–14 hours",
    cost: "Free",
    stack: ["Git + GitHub Actions", "Sigma + sigma-cli", "Terraform or the SIEM API", "Test telemetry (Security Datasets)"],
    prerequisites: ["Project 05 complete", "Comfort with Git and basic CI"],
    steps: [
      {
        title: "Structure the repo",
        detail:
          "<p>Lay it out clearly: <code>/rules</code> (Sigma YAML), <code>/tests</code> (known-bad and known-good samples), <code>/docs</code>, <code>/.github/workflows</code>. Every rule carries full metadata including ATT&CK mapping and an owner.</p>",
      },
      {
        title: "Add schema and syntax validation",
        detail:
          "<p>First CI step: validate every rule against the Sigma schema and confirm it <b>compiles to your backend's query language</b>. This alone catches most broken merges.</p>",
      },
      {
        title: "Build the test harness",
        detail:
          "<p>The important step. For each rule, keep a small telemetry sample that <b>should</b> trigger it and one that <b>should not</b>. CI replays both and fails the build if the rule misses the true positive or fires on the benign sample.</p>",
      },
      {
        title: "Require review",
        detail:
          "<p>Protect <code>main</code>. Every change needs a PR and an approving review — including tuning changes. <b>No silent tuning</b> is the single biggest cultural win here.</p>",
      },
      {
        title: "Automate deployment",
        detail:
          "<p>On merge, push rules to the SIEM via API or Terraform. Now deploys are reproducible and, crucially, <b>revertible</b> — a bad tuning change at 2am is a <code>git revert</code>, not an archaeology exercise.</p>",
      },
      {
        title: "Generate coverage from metadata",
        detail:
          "<p>Add a job that reads the ATT&CK tags across all rules and emits an ATT&CK Navigator layer. Coverage is now <b>derived from what's deployed</b> rather than remembered from a spreadsheet.</p>",
      },
      {
        title: "Add continuous validation",
        detail:
          "<p>Schedule Atomic Red Team runs against the lab and alert if a rule that should have fired didn't. This catches the silent-failure mode from project 09.</p>",
      },
    ],
    validation: [
      "A PR with a broken rule fails CI.",
      "A rule that doesn't catch its true positive fails CI.",
      "Merging deploys to the SIEM automatically.",
      "The coverage map is generated, not hand-maintained.",
    ],
    pitch:
      "\"I built a detection-as-code pipeline: rules live in Git as Sigma, every PR is peer-reviewed, and CI replays a known-bad and a known-good sample so a rule that doesn't fire on the attack can't merge. Deployment is automated on merge, which means a bad tuning change is a git revert instead of an incident. The coverage heatmap is generated from rule metadata, so it reflects what's actually deployed.\"",
    stretch: [
      "Add a canary deployment stage that watches FP rate before full rollout.",
      "Auto-open a ticket when a rule's FP rate crosses a threshold.",
      "Publish a sanitised version of the repo as a public portfolio piece.",
    ],
  },
  {
    id: 12,
    level: "l3",
    category: "Incident Response",
    title: "Full incident response simulation",
    tagline: "Run a major incident end to end — as the incident commander.",
    outcome:
      "<p>A complete incident package: timeline, evidence with chain of custody, containment decisions with rationale, an executive brief, and a post-incident review with concrete control changes.</p>",
    proves:
      "Leading an incident is the defining L3 skill. The written artifacts are what people actually judge you on.",
    hours: "10–12 hours",
    cost: "Free",
    stack: ["Your lab (multi-host)", "Atomic Red Team / CALDERA for the intrusion", "Velociraptor or KAPE for collection", "Volatility 3"],
    prerequisites: ["Projects 01, 06 and 09 complete", "A lab with at least 3 hosts and a DC"],
    steps: [
      {
        title: "Stage a realistic intrusion",
        detail:
          "<p>Execute a full chain across multiple hosts: phishing-style initial access → persistence → credential access → lateral movement → staged 'exfiltration'. Then <b>wait a day</b> before investigating, so you work from logs rather than memory — exactly like a real case.</p>",
      },
      {
        title: "Declare and set up command",
        detail:
          "<p>Practise the ceremony properly: declare the incident, assign IC / technical lead / comms / scribe (even if that's all you), and open a decision log. <b>Every decision gets a timestamp and a name.</b></p>",
      },
      {
        title: "Detect and scope",
        detail:
          "<p>Work only from your SIEM and endpoint telemetry. Determine: patient zero, initial access vector, what the attacker touched, and dwell time. Resist the urge to use your knowledge of what you planted.</p>",
      },
      {
        title: "Collect evidence in the right order",
        detail:
          "<p>Follow order of volatility: <b>memory first</b> (Velociraptor/WinPmem), then triage collection (KAPE), then disk if warranted. Hash everything on acquisition and record a chain of custody. Analyse the memory image with Volatility — <code>malfind</code>, <code>pstree</code>, <code>netscan</code>.</p>",
      },
      {
        title: "Contain, then eradicate",
        detail:
          "<p>Make the isolate-vs-monitor call and <b>write down why</b>. Then eradicate: remove persistence, reset credentials, revoke sessions. Verify the attacker is actually out rather than assuming.</p>",
      },
      {
        title: "Recover properly",
        detail:
          "<p>Rebuild from clean images rather than cleaning in place. Restore, verify integrity, and monitor for re-entry — attackers commonly leave a second way back.</p>",
      },
      {
        title: "Write the three documents",
        detail:
          "<p>An <b>incident report</b> (timeline, impact, root cause, actions), a <b>one-page executive brief</b> (what happened, business impact, what you need), and a <b>post-incident review</b> listing concrete control changes with owners. Blameless — focus on the system, not the person.</p>",
      },
    ],
    validation: [
      "Your reconstructed timeline matches what you actually staged.",
      "Memory was captured before containment.",
      "Every containment decision has a documented rationale and timestamp.",
      "The PIR lists specific control changes, not 'improve monitoring'.",
    ],
    pitch:
      "\"I run full IR simulations in my lab — I stage a multi-host intrusion, wait a day, then work it from logs as incident commander with a proper decision log. The habit that stuck is capturing memory before containment: the first time I did it in the wrong order I isolated the host and lost the injected payload entirely, which is exactly the mistake you only want to make in a lab.\"",
    stretch: [
      "Run a ransomware scenario and test restoring from immutable backups.",
      "Add a cloud dimension — compromise an identity and respond via API.",
      "Run it as a tabletop with friends playing Legal, Comms and an executive.",
    ],
  },
];

export const PROJECT_COUNT = PROJECTS.length;
export const PROJECT_CATS = [...new Set(PROJECTS.map((p) => p.category))];
