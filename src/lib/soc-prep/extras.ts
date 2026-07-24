/**
 * Enrichment content for the SOC-prep kit: a crisp, recitable definition and a
 * concrete real-life implementation for every fundamentals topic, plus a
 * definition opener for every malware topic (those already end with a real
 * case). Keyed by the exact question/title string in data.ts. Strings may
 * contain inline HTML, rendered inside .soc-prose containers.
 */

export interface FundamentalExtra {
  definition: string;
  realWorld: string;
}

export const FUNDAMENTAL_EXTRAS: Record<string, FundamentalExtra> = {
  /* ---------------- Networking ---------------- */
  "Walk me through the TCP three-way handshake and why it matters in a SOC.": {
    definition:
      "<p>The three-packet sequence that establishes every TCP connection: the client sends <code>SYN</code> (synchronise), the server answers <code>SYN-ACK</code>, the client confirms with <code>ACK</code>. Both sides agree starting sequence numbers so data can be ordered, acknowledged, and retransmitted — that agreement is what makes TCP <b>reliable</b>.</p>",
    realWorld:
      "<p>In firewall and NetFlow triage you rarely see payloads — you see <b>handshake outcomes</b>, and that is enough. A real case: one internal host generating thousands of lone <code>SYN</code>s to sequential ports across a server VLAN, almost none completing. No payload, no signature — the half-open pattern alone identified an internal port scan from a compromised jump box. The reverse matters too: a <i>completed</i> handshake to a newly registered domain proves two-way conversation happened, which moves an alert from \"maybe blocked\" to \"pivot on this host now.\"</p>",
  },
  "TCP vs UDP — and which attacks favour each?": {
    definition:
      "<p><b>TCP</b> is connection-oriented: handshake first, then ordered, acknowledged delivery — used where completeness matters (HTTP/S, SMB, RDP, SSH). <b>UDP</b> is connectionless fire-and-forget: no session, no delivery guarantee, minimal overhead — used where speed matters (DNS, DHCP, NTP, syslog, streaming).</p>",
    realWorld:
      "<p>This is the first pivot on any network alert. On a TCP alert I ask: <b>did the session establish, and how many bytes moved each way?</b> Bytes-out ≫ bytes-in on a long-lived session is an exfil shape. On a UDP alert I ask: <b>does the traffic match the protocol this port claims to be?</b> UDP/53 packets carrying 800-byte TXT answers at machine-regular intervals are not web browsing DNS — that exact mismatch is how our DNS-tunnelling hunt caught a red-team implant before any signature did.</p>",
  },
  "Which ports should a Tier 1 analyst know cold?": {
    definition:
      "<p>A port is the 16-bit number that tells a host <b>which service</b> a connection is for — the address of the application, where the IP is the address of the machine. Knowing the common mappings cold is what lets you read a firewall line and instantly know what was attempted.</p>",
    realWorld:
      "<p>The practical use is <b>mismatch spotting</b>, in seconds, without lookups: 445 or 3389 moving <i>east-west</i> between workstations means lateral movement until proven otherwise; 88/389 from a non-domain host means someone is talking Kerberos/LDAP who should not be; 22 outbound from a Windows finance workstation is an anomaly regardless of verdict. In one incident the entire early signal was RDP (3389) from a workstation to a server it had never touched in 90 days of baseline — the port plus the novelty was the detection.</p>",
  },
  "What does a proxy log give you that a firewall log does not?": {
    definition:
      "<p>A firewall logs the <b>connection</b> at layer 3/4 — source, destination, port, verdict, byte counts. A proxy logs the <b>request</b> at layer 7 — full URL, HTTP method, user agent, content type, response code, and crucially the <b>authenticated username</b> behind the traffic.</p>",
    realWorld:
      "<p>Phishing response runs on this difference. Message trace tells me who <i>received</i> the lure; the proxy tells me who <b>clicked</b> — and what happened next. A <code>GET</code> to the harvester with a 200 then a <code>POST</code> means credentials were submitted: immediate reset and session revocation. A block page or 403 means no action needed. Same alert, opposite responses, and only layer 7 can tell them apart. It is also where you find the downloaded filename when EDR only shows the process that opened it.</p>",
  },
  "How do you detect DNS tunnelling?": {
    definition:
      "<p>DNS tunnelling encodes data or C2 tasking inside DNS queries and answers — payload out in long subdomain labels, payload back in TXT/NULL records — so traffic rides a protocol that is almost never blocked outbound and rarely inspected.</p>",
    realWorld:
      "<p>We run the unique-subdomain hunt (the query here) as a <b>scheduled analytic</b>, not an ad-hoc one: weekly over <code>DnsEvents</code>, with an allowlist for the legitimate high-cardinality parents every estate has — CDNs, telemetry, antivirus cloud lookups. Tuning that allowlist honestly took longer than writing the query. It paid for itself when a red-team engagement started <code>dnscat2</code>: the rule fired inside the hour, which is exactly the validation loop you want — if a paid adversary emulation does not trip your rule, the rule was decoration.</p>",
  },
  "A host is beaconing. How do you confirm it?": {
    definition:
      "<p>Beaconing is an implant's <b>heartbeat</b>: short, regular outbound check-ins to its C2 asking for tasking. The defining properties are periodicity (usually with deliberate jitter), small consistent payloads, and persistence regardless of user activity.</p>",
    realWorld:
      "<p>Confirmation is <b>time-delta analysis</b> plus <b>process attribution</b>. In KQL I group the traffic by source and destination, compute the gaps between connections with <code>prev()</code>, and look at the standard deviation — human browsing is bursty and chaotic, implants cluster tightly around an interval even with jitter. Then EDR answers the only question that matters: <b>which process owns the socket</b>, and is its parent chain sane. A real find: 60-second interval ±20% to a CDN-fronted domain, owned by a signed binary sideloaded from <code>%APPDATA%</code> — the cadence found it, the process tree convicted it.</p>",
  },

  /* ---------------- Windows & AD ---------------- */
  "Which Windows Event IDs must a SOC analyst know?": {
    definition:
      "<p>Security Event IDs are the numeric codes Windows writes to the Security log for every auditable action — logons, process creation, account and group changes, policy edits. They are the raw material most endpoint detections are built from.</p>",
    realWorld:
      "<p>Fluency here is speed: most rules in the queue are <b>compositions</b> of these IDs, and knowing them cold means you can read the raw events instead of trusting the rule's one-line summary. Daily examples: a 4625 burst resolving into a 4624 is the brute-force shape; 4720 (account created) followed by 4732 (added to admins) inside an hour is a rogue-admin play; 4688 process creation is the backbone of nearly every execution detection; and <b>1102 — audit log cleared — is a case on its own, every time</b>, because legitimate admins almost never do it and attackers almost always want to.</p>",
  },
  "What are the Windows logon types and why do they matter?": {
    definition:
      "<p>The <code>LogonType</code> field in 4624/4625 records <b>how</b> a credential was used — console (2), network (3), batch (4), service (5), RDP (10) — not merely that it was used. It is the difference between \"the account logged on\" and \"the account logged on in a way it never should.\"</p>",
    realWorld:
      "<p>We baseline logon types <b>per account class</b>: service accounts should only ever produce types 4 and 5; a type 10 from one is an alert regardless of source or time. That exact rule gave us the earliest signal in a real incident — a service account RDP'ing to a server after its password was lifted from a config file. The account was valid, the host was valid, the hour was plausible; <b>the logon type was the only anomaly</b>, and it was enough. Type 9 (<code>runas /netonly</code>) gets the same treatment as a pivot indicator on workstations.</p>",
  },
  "Explain Kerberoasting and how you detect it.": {
    definition:
      "<p>Kerberoasting exploits a by-design Kerberos behaviour: <b>any authenticated user</b> can request a service ticket for any account with an SPN, and that ticket is encrypted with the service account's password hash. The attacker takes the tickets offline and cracks them — no failed logons, no lockouts, nothing ever touches the target service.</p>",
    realWorld:
      "<p>Detection is only half the implementation. On the detection side we run the RC4-downgrade analytic (4769 with <code>0x17</code> in an AES domain) plus a <b>honeypot SPN</b> — a decoy account with a deliberately interesting name that no legitimate process ever requests, wired to a high-severity alert. It is the closest thing we have to a zero-false-positive rule. On the prevention side, the durable fix: inventory every SPN-bearing account, migrate what you can to <b>gMSAs</b> (managed 120-char passwords rotate themselves), and force the rest to 25+ character passphrases. A cracked ticket is worthless if the hash never cracks.</p>",
  },
  "Pass-the-Hash vs Pass-the-Ticket?": {
    definition:
      "<p>Both are credential-replay attacks that skip the plaintext password entirely. <b>Pass-the-Hash</b> replays a stolen NTLM hash to authenticate directly. <b>Pass-the-Ticket</b> replays — or with Golden/Silver tickets, <b>forges</b> — Kerberos tickets. The material differs; the effect is the same: the attacker <i>is</i> the account.</p>",
    realWorld:
      "<p>Where this lives day-to-day: the <b>post-LSASS sweep</b>. After any credential-dump alert, the standing playbook hunts for exactly these two follow-ons — new NTLM type-3 logons <i>sourced from the victim host</i>, and 4769 service-ticket activity with no matching 4768 TGT request. The other place it matters is containment: teams reset the user's password and think they are done, but <b>a password reset does not invalidate Kerberos tickets already issued</b>, and a Golden Ticket survives until krbtgt is rotated twice. Knowing the mechanism is what stops you declaring victory early.</p>",
  },
  "How would you hunt for DCSync activity?": {
    definition:
      "<p>DCSync abuses AD's own replication protocol (DRSUAPI): an account holding <i>Replicating Directory Changes</i> rights asks a domain controller to \"replicate\" secrets, and the DC obligingly hands over password hashes — including <code>krbtgt</code>. No malware runs on the DC; it is a legitimate API doing exactly its job for the wrong caller.</p>",
    realWorld:
      "<p>Two implementations, and the second matters more. First, the standing analytic on 4662 with the replication GUIDs (this query), excluding the legitimate sync accounts — in practice <b>Azure AD Connect is both your noisiest false positive and one of the most attractive real targets</b>, so it gets excluded by exact account <i>and</i> source host, never by name alone. Second, the quarterly rights audit: enumerate who actually holds replication rights and challenge every entry. An alert that never fires because no rogue account ever gains the right beats a detection that fires after krbtgt is already gone.</p>",
  },

  /* ---------------- Linux ---------------- */
  "Which Linux logs and locations matter?": {
    definition:
      "<p>The core Linux evidence set: <code>auth.log</code>/<code>secure</code> for authentication and sudo, <code>auditd</code> for syscall-level detail, cron and systemd for scheduled execution, <code>wtmp/btmp</code> for session history, and per-user artifacts — <code>.bash_history</code>, <code>authorized_keys</code> — for what an account actually did and how it can get back in.</p>",
    realWorld:
      "<p>On a suspect web-facing box the triage order is fixed: <code>last</code>/<code>lastb</code> for who got in and from where, <code>auth.log</code> for accepted keys and new sudo activity, cron plus <code>systemctl list-timers</code> for persistence, <code>ss -tulpn</code> for listeners that should not exist, then histories — knowing attackers edit them, which is itself a finding. The implementation that matters most, though, happens before the incident: <b>ship auth.log and auditd off-host to the SIEM</b>. The first thing a competent intruder does is clean local logs; the copy that already left the box is the one that convicts them.</p>",
  },
  "Where does a Linux attacker hide persistence?": {
    definition:
      "<p>Linux persistence is the set of autostart and re-entry mechanisms an attacker plants to survive reboots and evictions: cron entries, systemd units and timers, SSH keys, shell profile hooks, <code>LD_PRELOAD</code> userland rootkits, kernel modules, SUID binaries, and quietly privileged accounts.</p>",
    realWorld:
      "<p>We turned this list into a single triage script run against any suspect host: dump all crontabs and <code>/etc/cron.*</code>, enumerate systemd units and timers, diff <code>authorized_keys</code> everywhere, list SUID binaries, and <b>compare every result against a golden-image baseline</b> — because the question is never \"is there a cron job\" but \"is there a cron job that was not there before.\" In one incident that diff surfaced a second <code>sshd</code> on port 2222 and an <code>@reboot</code> cron entry within minutes; the same check by hand used to take an hour, which in practice meant it was skipped.</p>",
  },

  /* ---------------- SIEM ---------------- */
  "What is a SIEM and what are its core functions?": {
    definition:
      "<p>A SIEM (Security Information and Event Management) is the platform that <b>centralises</b> logs from across the estate, <b>normalises</b> them into a common schema, <b>correlates</b> events from different sources into alerts, and <b>retains</b> everything for hunting and compliance. It is the SOC's working surface.</p>",
    realWorld:
      "<p>What the textbook list looks like in practice, using Sentinel: normalisation (ASIM) means one query shape works across three firewall vendors — without it every hunt is written three times. Correlation is what turns \"4625 burst\" and \"4624 success\" from two boring events into one brute-force incident. And <b>retention is secretly a detection decision</b>: our split of hot 90 days / archive one year means any retro-hunt for a newly published IOC dies at the archive boundary unless we budget a restore. Cost engineering — which tables, which tier, what sampling — is real SOC work, not admin overhead.</p>",
  },
  "True positive, false positive, benign true positive — the difference?": {
    definition:
      "<p>The four triage verdicts: <b>TP</b> — the alert fired on genuinely malicious activity. <b>FP</b> — the logic fired on something that did not happen as described. <b>BTP</b> — the activity happened exactly as described but is authorised. <b>FN</b> — malicious activity that produced no alert at all. The FP/BTP distinction matters because the fixes differ: change the logic vs. scope an exclusion.</p>",
    realWorld:
      "<p>We made the verdict a <b>required, structured field</b> on every closure — not free text — and that single process choice powers the whole tuning loop. Weekly, closures are grouped per rule: a rule closing 90% FP gets its logic rewritten; one closing 90% BTP gets narrow, change-ticket-correlated exclusions; and the hunt programme exists to surface the FNs no queue will ever show you. Without verdict discipline, \"tuning\" is guessing. With it, every closed alert is a data point that makes next week's queue slightly more honest.</p>",
  },
  "How do you tune a noisy rule without creating a blind spot?": {
    definition:
      "<p>Tuning is reshaping a detection's logic or scope so it still fires on the attack while ignoring known-good activity. The failure mode to avoid is the lazy exclusion — silencing an entire account, host, or technique to make the noise stop, which quietly deletes coverage.</p>",
    realWorld:
      "<p>A concrete run of the method: our PsExec rule fired ~40 times a day — 30 days of data showed 96% was one SCCM deployment account from two site servers. The exclusion we shipped was the exact <b>combination</b> — that account, from those hosts, to managed targets — plus a compensating rule that fires if the excluded account ever acts outside that pattern (new source host, odd hours, unmanaged target). Firings dropped to roughly two a week, all worth reading. Final step, never skipped: <b>replay a known true positive</b> through the tuned rule to prove the attack still fires. Tuning without that test is faith, not engineering.</p>",
  },
  "Write a KQL query for brute force followed by a successful logon.": {
    definition:
      "<p>Brute force is a burst of failed authentications against an account; the incident-worthy variant is the burst that <b>ends in a success</b>. The query's job is a time-windowed join: failure spike per account/host, joined to a subsequent 4624 within the window — because failures alone are weather, failure-then-success is a breach.</p>",
    realWorld:
      "<p>This exact join runs in production as a scheduled analytic, with two implementation details that matter more than the syntax. First, the <b>spray variant</b>: invert the grouping to one source IP touching many accounts with only two or three attempts each — that pattern defeats naive per-account thresholds and is the more common real attack. Second, enrichment before a human sees it: an automation rule stamps the incident with the account's privilege level and the host's asset tier, so \"15 failures then success on a domain admin\" pages immediately while the same shape on a lab VM waits its turn in the queue.</p>",
  },
  "Explain detection-as-code and how you would implement it.": {
    definition:
      "<p>Detection-as-code manages detection rules the way mature teams manage software: rules live in Git, changes go through peer-reviewed pull requests, CI validates and tests them against known-bad and known-good samples, and a pipeline — not console clicks — deploys them.</p>",
    realWorld:
      "<p>The working shape: Sentinel analytics as YAML in a repo, deployed by Terraform. A PR triggers schema lint, KQL compilation, and replay tests — the rule must fire on the attack sample and stay silent on the benign one, or the merge is blocked. What you actually buy with the ceremony: <b>rollback</b> when a tuning change breaks a rule at 2am (revert the commit, pipeline redeploys); a <b>reviewable history</b> of every logic change with who and why — which auditors and post-incident reviews both love; and a MITRE coverage heatmap <b>generated from rule metadata</b>, so the coverage claim is derived from what is actually deployed rather than remembered from a spreadsheet.</p>",
  },

  /* ---------------- Incident Response ---------------- */
  "What are the phases of the incident response lifecycle?": {
    definition:
      "<p>NIST SP 800-61's structure for handling incidents: <b>Preparation</b>; <b>Detection & Analysis</b>; <b>Containment, Eradication & Recovery</b>; <b>Post-Incident Activity</b>. It is a loop, not a line — lessons from the last phase are the input to the first.</p>",
    realWorld:
      "<p>The phases are not paperwork; they do real work <b>on the bridge</b>. Our playbooks are physically organised by phase, and during a live incident saying \"we are still in scoping, not eradication\" has concretely stopped the classic mistake: reimaging patient zero before anyone knows how the attacker got in — which destroys the evidence <i>and</i> leaves the door open. The other phase that earns its keep is the one teams skip: post-incident review produced our inbox-rule detection, our backup immutability check, and half the tuning backlog. Preparation is where incidents are actually won.</p>",
  },
  "What belongs in a proper escalation to Tier 2?": {
    definition:
      "<p>An escalation is a structured investigative handoff: what fired, the entities involved, what was already checked, the specific evidence that makes it look real, scope so far, and actions taken. The test of a good one — the receiving analyst can <b>continue</b> the investigation instead of restarting it.</p>",
    realWorld:
      "<p>We stopped treating escalation quality as a soft skill and <b>built it into the ticket form</b>: entities, checks performed, evidence, and scope are required structured fields, not an optional prose box. Two measurable effects: Tier 2 kickbacks (\"what did you actually check?\") dropped visibly, and triage-to-containment time improved because L2 starts from minute one instead of re-running L1's first hour. It also quietly improves L1 work itself — a form that demands \"why it looks real\" forces the analyst to have a reason before escalating a feeling.</p>",
  },
  "Isolate the machine or leave it running?": {
    definition:
      "<p>The core containment trade-off: isolating a host <b>stops damage</b> but tips off the attacker and can destroy volatile evidence; monitoring <b>preserves intelligence</b> and scope but accepts ongoing risk while you watch. Neither is the default — the incident decides.</p>",
    realWorld:
      "<p>We encoded the decision into the playbook so it is not re-argued at 3am: active encryption, observed exfil, lateral spread, a DC or crown-jewel asset, or an interactive attacker → <b>isolate now</b>; contained low-risk activity where scope is still unknown → watch, with a named IC owning that call and a time-box on it. Implementation details that matter: EDR network isolation instead of a cable pull, because the management channel stays up — which is how we captured memory from an isolated host <i>before</i> the attacker knew we were there. And the decision gets written down with a name and timestamp, because \"why was this host still online for two hours\" is a question someone will ask later.</p>",
  },
  "What is the order of volatility?": {
    definition:
      "<p>The forensic principle that evidence must be collected <b>most-perishable first</b>: CPU state and RAM before swap, swap before disk, disk before off-host logs and backups — because every action you take, including collection itself, destroys some of what sits above it.</p>",
    realWorld:
      "<p>Our collection runbook is this list turned into tooling order: EDR-triggered memory capture first, then a KAPE triage image (registry, event logs, prefetch, browser artifacts), then full disk only if the incident justifies it — each artifact hashed on acquisition, originals never analysed directly. The runbook exists because of a real failure: a well-meaning admin powered off a ransomware host \"to stop it,\" and the in-memory encryption keys — which for that family were recoverable — went with it. One shutdown, one unrecoverable share. That mistake wrote the first line of the runbook: <b>nobody powers off a live compromised host</b>.</p>",
  },
  "You are IC on a ransomware incident. First two hours?": {
    definition:
      "<p>Incident command for ransomware is a structured first two hours: establish command and comms, contain spread, protect backups <i>before</i> anything else is negotiated, scope initial access and exfiltration, and trigger executive, legal, and insurer notification in parallel — with every decision timestamped.</p>",
    realWorld:
      "<p>The implementation is rehearsal: we tabletop this quarterly with the <b>actual people</b> who would hold the roles — IC, technical lead, comms, scribe — not stand-ins, so the first time someone runs a bridge is never during the real thing. Two drills earned their cost many times over: proving backups actually restore (an untested backup is a hope, not a control) and verifying immutability settings before an attacker tests them for you. When a real event came, the scribe's timestamped decision log went to the insurer almost verbatim — the document you keep during the fire is the one every stakeholder wants after it.</p>",
  },

  /* ---------------- Malware & EDR ---------------- */
  "Virus, worm, trojan, ransomware — the differences?": {
    definition:
      "<p>Malware classes are defined by <b>how they spread and what they are for</b>: a virus attaches to a host file and needs execution; a worm self-propagates with no user action; a trojan masquerades as something legitimate; ransomware encrypts and extorts; a RAT gives interactive control; a rootkit hides presence; fileless malware lives in memory and native tooling.</p>",
    realWorld:
      "<p>Classification is not taxonomy for its own sake — <b>it selects the playbook</b>. A worm-shaped alert (SMB spread pattern) means containment first and questions later, because the cost of an hour's hesitation compounds across the estate. A trojan means the interesting question is the lure — who else received it. Ransomware means assume exfiltration already happened and put someone on backups immediately. And an infostealer means the credentials <i>and active sessions</i> are gone — so the response is resets plus token revocation, not just an AV clean-up. We tag incidents by class precisely so response times can be compared like-for-like in the ops review.</p>",
  },
  "What is a process tree and why do you always check it?": {
    definition:
      "<p>The process tree is the parent–child chain of execution — which process spawned which, with what command line — reconstructed from event 4688 or EDR telemetry. It matters because malicious execution almost always produces <b>improbable parentage</b>, and lineage is faster to judge than payload.</p>",
    realWorld:
      "<p>It is the first pivot on every endpoint alert, before any hash lookup: in Defender's device timeline the chain is one click, and the abnormal patterns are memorised so the judgement is instant. <code>WINWORD.EXE → powershell.exe</code> with an encoded command line went from alert to confirmed-TP-and-isolated in minutes, entirely on lineage — no sandbox, no reversing. The tree also scopes: walking <i>up</i> from the alerted process finds the delivery (which document, which browser download), walking <i>down</i> finds what it did next. Half of triage is genuinely just reading this tree well.</p>",
  },
  "What is LOLBin abuse and how do you detect it?": {
    definition:
      "<p>Living-off-the-land binaries: signed, Microsoft-shipped executables — <code>certutil</code>, <code>mshta</code>, <code>regsvr32</code>, <code>rundll32</code>, <code>bitsadmin</code> — repurposed to download and execute payloads. Because the binary is trusted and already present, allowlisting and signature AV see nothing land and nothing foreign run.</p>",
    realWorld:
      "<p>Detection is entirely <b>arguments and context</b>, so implementation starts with a baseline: 30 days of how each binary is legitimately used in <i>your</i> estate. In ours, <code>certutil</code> did genuine certificate work on a handful of servers and nothing else — so <code>-urlcache</code> or <code>-decode</code> anywhere became a clean, quiet rule. Same method per binary, with LOLBAS as the reference for which arguments matter. It caught an <code>mshta</code> fetching an HTA from an IP-literal URL within weeks. The rules are deliberately per-binary and per-pattern rather than one mega-rule — small rules tune independently and die independently.</p>",
  },

  /* ---------------- Cloud ---------------- */
  "What cloud log sources does a SOC need?": {
    definition:
      "<p>The minimum cloud telemetry set covers three planes: <b>identity</b> (sign-ins and directory audit — Entra <code>SigninLogs</code>/<code>AuditLogs</code>), <b>control plane</b> (resource operations — <code>AzureActivity</code>, CloudTrail), and <b>data plane</b> (what was actually read or written — <code>OfficeActivity</code>, S3 access logs). Identity is the primary perimeter now, but data-plane is where impact lives.</p>",
    realWorld:
      "<p>The implementation habit is a <b>quarterly connector audit</b>: diff what is actually flowing against this list, because cloud logging silently regresses — licence changes, new subscriptions, new tenants. Two real gaps we closed that way: mailbox auditing enabled only for E5 users, leaving most of the estate's inbox-rule activity invisible (the exact telemetry the AiTM scenario depends on); and no data-plane logging on the finance SharePoint site — we could see permission changes but not a mass download. A tabletop exposed that one; better a tabletop than a breach notification letter.</p>",
  },
  "How do you investigate a suspicious Azure AD sign-in?": {
    definition:
      "<p>Sign-in triage reads <code>SigninLogs</code> for the full context of an authentication — location and ASN, client app, legacy vs modern auth, MFA and Conditional Access outcome, risk score — and then, critically, checks what the session <b>did after</b> logging in.</p>",
    realWorld:
      "<p>This runs as a playbook, not an ad-hoc query. Enrichment does the first pass: is the ASN residential or hosting, is the geography plausible against the user's own 30-day history (impossible travel computed per user, not globally), was MFA satisfied by a <i>prompt</i> or by a token that never prompted — the token-replay tell. Then the mandatory <b>aftermath sweep</b>: new inbox rules, new MFA method registrations, OAuth consent grants, mass file access. The AiTM incident in the scenarios section is this exact playbook firing in production — the sign-in looked \"MFA-satisfied,\" and it was the aftermath sweep that proved compromise.</p>",
  },

  /* ---------------- Frameworks ---------------- */
  "What is MITRE ATT&CK and how do you use it day to day?": {
    definition:
      "<p>MITRE ATT&CK is a curated knowledge base of adversary behaviour from real intrusions, organised as <b>tactics</b> (the attacker's goal, 14 of them), <b>techniques</b> (how the goal is achieved), and <b>procedures</b> (specific observed implementations). Its power is being a <i>common language</i> — \"T1003\" means the same thing to every analyst, tool, and report.</p>",
    realWorld:
      "<p>Three daily uses. Every detection rule carries technique tags in metadata, so the coverage heatmap is <b>generated</b>, not asserted — and the grey cells become the purple team's shopping list. During investigations the matrix predicts forward: credential access confirmed → immediately hunt the lateral-movement techniques that usually follow it, instead of waiting for the next alert. And in reporting, \"we lack coverage for T1558.003 on these domain controllers\" gets budget approved in a way \"we should improve AD security\" never has.</p>",
  },
  "Cyber Kill Chain vs ATT&CK?": {
    definition:
      "<p>Two models at different altitudes: the <b>Kill Chain</b> is seven linear stages of a single intrusion (recon → weaponise → deliver → exploit → install → C2 → actions); <b>ATT&CK</b> is a non-linear matrix of hundreds of concrete techniques. The Kill Chain narrates; ATT&CK measures.</p>",
    realWorld:
      "<p>We use both, deliberately, for different audiences on the <i>same</i> incident. The executive summary is written in Kill Chain language — \"we broke this at delivery for four of five waves; the fifth reached exploitation\" — because a linear story lands with people who will never read a technique ID. The engineering artefacts from that incident — detection gaps, tuning actions, purple-team targets — are filed as ATT&CK techniques, because that is the level at which coverage can actually be tracked. One incident, two lenses, zero contradiction.</p>",
  },
  "Explain the Pyramid of Pain.": {
    definition:
      "<p>David Bianco's model ranking indicator types by <b>how much it costs the adversary when you deny them</b>: hashes are trivial to change, IPs easy, domains simple, artifacts annoying, tools challenging, and TTPs — behaviours — genuinely painful, because evading a behavioural detection means redesigning tradecraft.</p>",
    realWorld:
      "<p>It is our threat-intel <b>resource-allocation policy</b>, not a poster. Hash and IP feeds auto-block with zero analyst time — cheap wins, taken gladly, never mistaken for strategy. Human engineering effort is reserved for the top: behavioural rules on process chains, persistence mechanisms, and credential-access patterns. The loader case proved the model in production: the hash rotated within a week and the C2 within days, while the Sigma rule on the behaviour — <code>rundll32</code> with no arguments spawned by <code>services.exe</code> — kept catching new builds for a month. Cost to us: one rule. Cost to them: their loader design.</p>",
  },

  /* ---------------- Process ---------------- */
  "How do you prioritise when twenty alerts land at once?": {
    definition:
      "<p>Triage priority is <b>impact × confidence × urgency</b>: asset criticality, stage of attack, blast radius, and the rule's track record decide the order — never arrival time, and never whichever alert looks easiest to close.</p>",
    realWorld:
      "<p>We push as much of this as possible <b>into the platform</b> so the human judgement starts from a sorted queue: automation enriches every incident with asset tier (CMDB lookup) and account privilege before an analyst sees it, so \"credential dumping on a domain controller\" physically sits above \"recon on a lab VM.\" The judgement that stays human is <b>clustering</b> — recognising that twenty alerts on one host in ten minutes is one incident mid-execution, not twenty tickets — and the honesty to say the queue exceeds one person and pull in help before SLAs quietly die.</p>",
  },
  "You closed an alert as FP and it was a real breach. What do you do?": {
    definition:
      "<p>This is a missed true positive: an alert wrongly closed as benign, discovered when the breach surfaces later. The correct handling is immediate disclosure, re-scoping the incident from the <b>original timestamp</b> — dwell time starts at the first alert, not the discovery — and fixing whatever made the wrong call look right.</p>",
    realWorld:
      "<p>Two process implementations turn this from a career fear into a system property. First, <b>closed-alert sampling</b>: a peer re-reviews a random slice of closed alerts weekly, which catches misjudgements while they are still cheap and — just as importantly — makes \"someone will look at my closures\" a normal, blameless fact of the job. Second, closure friction where it counts: closing as FP requires citing the specific evidence checked, not picking a dropdown value. After a real near-miss, the review focused on why the wrong call was <i>reasonable</i> — the missing context became a new enrichment, not a disciplinary note. That is the difference between a SOC that learns and one that hides.</p>",
  },
  "How do you measure whether a SOC is actually effective?": {
    definition:
      "<p>Effectiveness is measured by <b>outcomes, not activity</b>: dwell time, detection coverage validated by emulation, escalation accuracy, hunt yield, and log-source health — not alert counts or tickets closed, which measure only how busy the queue is.</p>",
    realWorld:
      "<p>The implementation is a monthly ops review built on exactly these numbers: MTTD/MTTR trended <i>per incident class</i> (a global average hides everything interesting), coverage claims backed by scheduled Atomic Red Team runs — if the emulation does not fire the rule, the heatmap cell goes back to grey regardless of what the metadata says — and log-source health on the same dashboard, because a silent connector is a blind spot wearing a green tick. We also track analyst attrition and time-per-alert honestly: they are the leading indicators, and every downstream metric follows them within two quarters.</p>",
  },
  "Why do you want to work in a SOC?": {
    definition:
      "<p>A screening question about motivation — but what it actually tests is whether you know what the work <i>is</i> (methodical triage, documentation discipline, occasional intensity) and whether your interest has produced anything concrete yet.</p>",
    realWorld:
      "<p>What a credible answer looks like in practice: name real things. A home lab you can describe in one breath — \"Sentinel free tier ingesting my own Windows VMs; I wrote a brute-force detection, attacked myself with Hydra, and tuned out my own false positives.\" A CTF or TryHackMe/HTB track with a specific challenge that taught you something. A cert framed by what it changed — \"SC-200 taught me KQL well enough to stop copying queries.\" Then close the loop honestly: you know the job is 80% disciplined triage and you want the 20% enough to do the 80% well. Interviewers hire evidence, not enthusiasm.</p>",
  },
};

/** One-line recitable definition per malware topic, keyed by topic id. */
export const MALWARE_DEFINITIONS: Record<string, string> = {
  "01": "<p>Malware analysis is a staged <b>pipeline</b> — automated triage, static properties, dynamic detonation, manual reversal — where each stage costs more and answers deeper questions than the last, and a good analyst stops at the cheapest stage that answers the question that matters.</p>",
  "02": "<p>Static analysis is everything a file tells you <b>without being executed</b>: hashes, entropy, imports, strings, headers, and signature. It is free and risk-free, and its real job is deciding how much further effort the sample deserves.</p>",
  "03": "<p>Dynamic analysis is <b>controlled detonation</b>: run the sample in an isolated, instrumented lab and record its behaviour — processes, files, registry, network. Behaviour is the durable indicator; it survives recompiles that change every hash.</p>",
  "04": "<p>Packing wraps the real payload in compression or encryption behind a small stub that unpacks it <b>in memory at runtime</b>. It defeats static signatures and inflates entropy — but the payload must decrypt itself to execute, which is why memory is where packing always loses.</p>",
  "05": "<p>Process injection executes attacker code <b>inside a legitimate process's memory</b>, so network connections and file access are attributed to a trusted binary. The variants differ in how the code gets in; nearly all share one tell — executable memory with no backing file on disk.</p>",
  "06": "<p>Anti-analysis is the malware's own counter-forensics: checks for VMs, sandboxes, debuggers, analyst tools, and environment keys (domain, locale, geography) that gate execution. Its consequence is the trap in the title — a clean verdict from an unhardened lab can be a false negative.</p>",
  "07": "<p>Memory forensics is acquiring and analysing RAM to recover what never touches disk — injected code, unpacked payloads, live connections, credentials, hidden processes — typically with Volatility. For fileless malware, memory is not a supplement to the investigation; it <i>is</i> the investigation.</p>",
  "08": "<p>An IOC is a forensic footprint of one specific campaign — a hash, IP, or domain — cheap to consume and cheap for the adversary to change. Behavioural detection targets the <b>technique itself</b>. The Pyramid of Pain ranks indicators by what it costs the attacker when you take them away.</p>",
  "09": "<p>YARA is a pattern-matching language for identifying malware in files, memory, and process dumps — rules combine strings, hex code sequences with wildcards, and structural conditions. It is how one analysed sample becomes estate-wide, family-level detection.</p>",
  "10": "<p>Modern ransomware is a <b>human-operated intrusion sequence</b> — access, persistence, recon, credential theft, lateral movement, exfiltration, backup destruction — with encryption only as the final act. Every stage before the last one is a detection opportunity, and most are noisy.</p>",
  "11": "<p>A field guide to malware classes and what each implies about <b>intent and urgency</b> — because the classification changes the response: a RAT means a human is interactive right now, a wiper means recovery not negotiation, a miner means the access was probably sold.</p>",
  "12": "<p>The end-to-end analyst workflow from sample receipt to estate-wide assurance: preserve and contain, automated triage, static, dynamic, reversal only if a question survives all of that — then extract detections, retro-hunt the estate, and document. The deliverable is the detection and the hunt, not the analysis itself.</p>",
};

/**
 * Plain-English "what actually happened" summary for each scenario, keyed by
 * scenario id. Written for a beginner — the story in simple terms before the
 * technical STAR breakdown. Jargon is glossed in place.
 */
export const SCENARIO_EXPLAINERS: Record<number, string> = {
  1: "<p>A finance staffer got a fake “DocuSign” email and signed in on the fake page. That handed the attacker their <b>live login session</b>, so even with MFA switched on, the attacker was already inside without needing a code. They set up a hidden mail rule to quietly hide replies while they went after the company’s suppliers. The team killed the stolen session (just resetting the password isn’t enough) and warned the suppliers before any money was lost.</p>",
  2: "<p>A phishing email hid its bad link inside a <b>QR code image</b>, so the email scanner — which only reads text links — saw nothing wrong. People scanned it with their personal phones, off the company network, so it dodged monitoring too. Three accounts were caught and reset.</p>",
  3: "<p>The company almost paid a $180,000 invoice to new bank details. It turned out they weren’t hacked — the <b>supplier</b> was, and the attacker replied inside a real email thread from a near-identical fake domain. The lesson: passing email security checks doesn’t prove an email is trustworthy — a quick phone call to confirm any bank-detail change is what actually stops this.</p>",
  4: "<p>Twelve people reported an email as phishing, but it was actually a genuine message from a business partner’s marketing campaign. The analyst confirmed it was safe <i>before</i> blocking anything, and thanked the reporters instead of brushing them off — you want people to keep reporting.</p>",
  5: "<p>A user was tricked into clicking “Allow” on a malicious app, giving it permission to read all their email and files. Because that permission <b>survives a password reset</b>, the fix was to revoke the app itself, not just reset the account.</p>",
  6: "<p>Emails claimed “you’ll be charged $499 — call this number to cancel.” There was no link or attachment, so nothing technical triggered. When a user rang the number, the scammer talked them into installing <b>remote-control software</b> — the phone call was the attack.</p>",
  7: "<p>A phishing email arrived from a real coworker’s account (already hacked), so it passed every security check and people trusted it. The team disabled the source account and, to be safe, reset everyone who clicked rather than waiting to find out who was truly affected.</p>",
  8: "<p>Attackers replied into genuine email conversations and attached a <b>password-protected ZIP</b>, with the password in the message. The password stops the security sandbox from opening and scanning the file — but a person can open it. The team blocked those file types from unknown senders and hunted the malware across the company.</p>",
  9: "<p>A routine hunt spotted a server quietly “phoning home” every ~5 minutes to a suspicious site — a hacker’s remote-control tool, and often the step right before ransomware. They isolated the affected machines all at once, reset the domain’s master keys, and secured the backups before any damage was done.</p>",
  10: "<p>The endpoint tool flagged suspicious PowerShell, but antivirus found nothing on disk — because the malware lived <b>only in memory</b> and used a built-in Windows feature (WMI) to relaunch itself. The team found and removed the hidden trigger and rebuilt the machines.</p>",
  11: "<p>A real, trusted vendor program was running from an odd folder and making network calls. The trick: attackers placed a poisoned helper file (a DLL) next to the trusted program, which loads it automatically — so the trusted app ends up running the attacker’s code. A detection they wrote found three more infected machines.</p>",
  12: "<p>A developer downloaded pirated software that carried a password-and-cookie stealer. Even though it was blocked, “blocked” doesn’t mean “in time” — so every saved password on that machine was treated as stolen, reset, and the machine was wiped.</p>",
  13: "<p>An unknown program set off an alert but wasn’t blocked, and no scanner recognised it. With no outside help available, the analyst pulled it apart to learn what it did, built a detection from that, and found it sitting (not yet run) on two other machines — caught just in time.</p>",
  14: "<p>An alert fired on <code>certutil</code> — a normal Microsoft tool — being used with a web address, which means it was being abused to <b>download malware</b>. Because the tool itself is trusted, antivirus ignores it; the clue was the unusual command. Caught before the payload ran.</p>",
  15: "<p>A Linux web server was pinned at 100% CPU, but the usual tools showed nothing using it — a <b>rootkit</b> was lying to them. Since you can never trust a machine again after a rootkit, they rebuilt it from scratch rather than trying to clean it.</p>",
  16: "<p>Someone opened a booby-trapped invoice, but nothing happened for two days — it was set to <b>wait</b> before running, to dodge the sandbox and confuse the timeline. Once it fired, the team traced it back and found six more machines quietly waiting to trigger.</p>",
  17: "<p>One account suddenly asked for login “tickets” for 14 different services in 8 minutes — a sign someone was collecting tickets to <b>crack service passwords offline</b>. They reset those service passwords to long random ones and planted a trap account to catch it next time.</p>",
  18: "<p>A hunt caught an ordinary desktop pretending to be a domain controller and asking for password data — meaning the attacker could grab <b>every password in the company</b>. That’s a full domain takeover, so they rotated the core keys twice, reset all admin accounts, and rebuilt the machine.</p>",
  19: "<p>Instead of hammering one account, an attacker tried a few common passwords against 300+ accounts to stay quiet — and <b>two logins actually succeeded</b>, buried in the noise. The real skill was spotting those two genuine break-ins among all the failures.</p>",
  20: "<p>The team saw login tickets being used with <b>no record of them ever being issued</b> — a sign of forged “master-key” tickets. That means the domain’s core secret was stolen, so they rotated it twice and forced everyone to sign in again.</p>",
  21: "<p>A user appeared to log in from Dubai and London 90 minutes apart, which looks impossible. After checking, it was genuinely them (over a VPN/office link), so it was correctly closed as authorised — not every odd-looking event is an attack.</p>",
  22: "<p>A hunt found a server set up in a risky way that, if abused, would let an attacker <b>impersonate anyone</b> — including admins. They fixed the setting everywhere and hardened the admin accounts so they couldn’t be impersonated.</p>",
  23: "<p>An attacker who already had the password spammed a user with 40 MFA prompts until, at 3am, they tapped “approve” just to make it stop. Having MFA isn’t enough if it can be worn down — so they turned on number-matching and moved key staff to phishing-proof security keys.</p>",
  24: "<p>A normal user kept admin powers even after being removed from every admin group. The attacker had planted persistence in a special AD template that quietly keeps re-granting rights. They cleaned the template and reset the protected accounts.</p>",
  25: "<p>A developer accidentally published a cloud access key to a public GitHub repo, and automated bots were using it within 9 minutes. They killed the key in 4 minutes and undid what the attacker created — and learned that deleting the commit isn’t enough; you <b>must</b> rotate the key.</p>",
  26: "<p>An app identity (a “service principal”) was doing odd things after hours — an attacker had added their own certificate to it as a <b>backdoor</b>. Reimaging a PC wouldn’t help, because the backdoor lives in the cloud identity, so they removed the rogue certificate and audited all the others.</p>",
  27: "<p>An outside researcher found a cloud storage bucket full of customer data left open to the public. They locked it, switched on access logging everywhere, and — since they couldn’t prove nobody had grabbed the data — brought in Legal for breach notification.</p>",
  28: "<p>A login succeeded from an odd location with MFA marked “passed” but <b>no prompt ever sent</b> — a replayed, stolen session. They revoked the sessions and tightened the rules so tokens can’t be reused for long.</p>",
  29: "<p>A monitoring tool caught an unexpected program running inside a production container. The worry was whether the attacker had “escaped” the container onto the host machine — so they killed it, rotated all the cluster’s secrets, and locked down risky container settings.</p>",
  30: "<p>An account downloaded 800 files in 30 minutes. Rather than jump to conclusions, the analyst handed it to HR and Legal (who lead insider cases), preserved the evidence properly, then removed access once cleared.</p>",
  31: "<p>Odd activity came in through a trusted IT partner’s remote-access connection — the attacker was riding the partner’s <b>legitimate</b> access. They cut off that access, reviewed everything done through it, and told the partner they’d been hacked.</p>",
  32: "<p>One machine sent 40 times the normal number of DNS lookups, with weirdly long names — data being <b>smuggled out through DNS</b>, which is almost never blocked. They cut it off and forced all DNS through inspected, controlled servers.</p>",
  33: "<p>A public web server’s process suddenly started running command-prompt commands — the sign of a <b>webshell</b>, a hidden backdoor uploaded through the website. They found the entry point, compared the site’s files against the original to spot other planted files, and rebuilt it clean.</p>",
  34: "<p>An internal machine was scanning the network, which looks like an attacker mapping out targets — but it was the company’s own approved vulnerability scanner. Verified first, closed as authorised, with a narrow exception so it won’t re-alert.</p>",
  35: "<p>Identical “new service installed” events popped up on several servers within minutes — a hacker jumping from machine to machine. They mapped the whole path, found the starting point, and isolated all the affected servers together.</p>",
  36: "<p>Some users had patchy connectivity and their traffic was being secretly redirected — someone had plugged in a <b>rogue device</b> handing out bad network settings to intercept traffic. No security tool caught it; they removed the device and hardened the switches.</p>",
  37: "<p>Threat intel warned that a flaw in their internet-facing VPN box was being actively exploited. Before patching, they checked whether they were <b>already</b> broken into, then rebuilt the box from scratch and reset all VPN credentials to be safe.</p>",
  38: "<p>Regular 60-second calls to an external address looked like malware phoning home, but it was just a normal app checking for updates. Correctly closed as safe, and logged as a known-good pattern so it wouldn’t waste anyone’s time again.</p>",
  39: "<p>A data-leak tool flagged a sales engineer uploading files to their personal cloud storage — likely grabbing data before quitting. Insider cases are led by Legal and HR, so the analyst preserved evidence carefully and didn’t touch the account until cleared.</p>",
  40: "<p>An IT admin looked at HR records with no work reason to. Investigating someone who legitimately has access to almost everything is tricky, so it went to HR and Legal — and afterwards they separated duties so infrastructure admins couldn’t read HR data.</p>",
  41: "<p>An inbox rule was quietly forwarding all of someone’s email to a personal address. They worked out whether it was a hack, an insider, or just laziness (it was convenience), removed it, blocked external auto-forwarding company-wide, and gave training rather than punishment.</p>",
  42: "<p>A scheduled task was found set to run under a departed admin’s account — destructive code left behind to trigger later (a “logic bomb”). They removed it, brought in Legal, and fixed the leaver process to check for exactly this.</p>",
  43: "<p>Over 200 staff were using an unapproved file-sharing site that held customer data. Instead of just blocking it (people relied on it), they first provided an approved alternative, then blocked the unsanctioned one.</p>",
  44: "<p>Ransomware began encrypting servers at 2am on a Saturday. Acting as incident commander, the lead coordinated the whole response, stopped it at about 40% of servers, and restored from safe backups into a rebuilt network — no ransom paid.</p>",
  45: "<p>An alert fired on something trying to steal passwords from memory on one PC — a classic step <b>just before</b> ransomware. By recognising that warning sign, they contained it in 90 minutes, and no files were ever encrypted.</p>",
  46: "<p>Failed logins were hitting the backup system. Attackers go after backups first so you can’t recover, so this is a red flag for imminent ransomware. They protected the backups and shut the attack down before any encryption began.</p>",
  47: "<p>A user found a scary ransom note demanding cryptocurrency — but nothing was actually encrypted. After checking carefully, it was a hoax meant to frighten, so they avoided launching a full emergency response and reassured the shaken user.</p>",
  48: "<p>One rule was firing 400 times a day, so analysts were closing them unread — which means a real alert could slip through. They carefully cut it to 12 a day while <b>proving</b> it still catches real attacks, and documented the change.</p>",
  49: "<p>In a practice attack (a “purple team” exercise), 6 of 12 techniques set off <b>no alert at all</b> — detections everyone assumed worked were silently broken. They fixed the gaps and added ongoing testing so it can’t happen unnoticed again.</p>",
  50: "<p>An alert closed as a false positive turned out, weeks later, to be the attacker’s way in. The right move was honesty: own it, re-investigate from the original date, and fix the process — they added a required check before that type of alert can be closed again.</p>",
};
