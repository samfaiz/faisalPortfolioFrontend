/**
 * Multiple-choice practice questions for the SOC-prep kit. One correct option
 * per question; `answer` is the 0-based index into `options`. `explanation`
 * may contain inline HTML and is rendered inside a .soc-prose container.
 * Explanations are written in plain English — short sentences, jargon glossed
 * on first use — so they teach, not just confirm.
 * Categories and levels mirror the FUNDAMENTALS taxonomy so the same tier and
 * topic filters apply.
 */
import type { Level } from "./data";

export interface MCQ {
  id: number;
  level: Level;
  category: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const MCQS: MCQ[] = [
  /* ---------------- Networking ---------------- */
  {
    id: 1,
    level: "l1",
    category: "Networking",
    question: "What is the correct order of the TCP three-way handshake?",
    options: ["SYN → ACK → SYN-ACK", "SYN → SYN-ACK → ACK", "ACK → SYN → SYN-ACK", "SYN-ACK → SYN → ACK"],
    answer: 1,
    explanation:
      "<p>Think of it like starting a phone call. The client says <code>SYN</code> (“can we talk?”), the server replies <code>SYN-ACK</code> (“yes — can you hear me?”), and the client answers <code>ACK</code> (“yes, let’s go”).</p><p>Why you care: if you see lots of <code>SYN</code>s with no reply coming back, someone is knocking on many doors at once — that’s the classic look of a <b>port scan</b>.</p>",
  },
  {
    id: 2,
    level: "l1",
    category: "Networking",
    question: "You see heavy east-west traffic on TCP/3389 between two workstations. What is it, and why care?",
    options: [
      "DNS — normal name resolution",
      "SMB file sharing — usually benign",
      "RDP — workstation-to-workstation RDP is a lateral-movement indicator",
      "HTTPS — encrypted web browsing",
    ],
    answer: 2,
    explanation:
      "<p>Port 3389 is <b>Remote Desktop (RDP)</b> — taking control of another computer’s screen. Normal staff don’t remote into each other’s PCs, so RDP going sideways between two workstations usually means an attacker is hopping from machine to machine. (For reference: 445 is file sharing, 53 is DNS, 443 is normal web traffic.)</p>",
  },
  {
    id: 3,
    level: "l2",
    category: "Networking",
    question: "Which single indicator is the strongest sign of DNS tunnelling?",
    options: [
      "A high count of unique subdomains under one parent domain",
      "Occasional queries to well-known public resolvers",
      "A single A record with a long TTL",
      "DNS traffic only during business hours",
    ],
    answer: 0,
    explanation:
      "<p>To smuggle data out quietly, attackers hide it inside the made-up front part of web addresses (the bit before the main domain). So one computer suddenly asking about <b>hundreds of different odd-looking subdomains under the same domain</b> is the clearest sign. DNS is almost never blocked, which is why they abuse it.</p>",
  },
  {
    id: 4,
    level: "l1",
    category: "Networking",
    question: "Which class of attack most favours UDP?",
    options: [
      "Interactive command-and-control",
      "Amplification DDoS",
      "SMB lateral movement",
      "RDP brute forcing",
    ],
    answer: 1,
    explanation:
      "<p>UDP doesn’t check who’s really asking, so an attacker can send a tiny request but fake the “reply-to” address to be a victim — and the much bigger answer floods that victim. That’s an <b>amplification DDoS</b>. The other three (C2, SMB, RDP) all run over TCP.</p>",
  },
  {
    id: 5,
    level: "l2",
    category: "Networking",
    question: "You suspect a host is beaconing. Which measurement confirms it best?",
    options: [
      "Total bytes transferred in a day",
      "The number of distinct destination ports",
      "Low standard deviation of the time gaps between connections",
      "Whether the destination uses HTTPS",
    ],
    answer: 2,
    explanation:
      "<p>Malware “phones home” on a timer. Even when it adds a little randomness, the gaps between check-ins stay fairly <b>even</b> — measuring how steady those gaps are (a low standard deviation) is what confirms it. Then use your endpoint tool (EDR) to see which program is making the calls.</p>",
  },
  {
    id: 6,
    level: "l1",
    category: "Networking",
    question: "What does a proxy log give you that a firewall log does not?",
    options: [
      "The source and destination IP",
      "The authenticated username and full URL requested",
      "The number of bytes transferred",
      "Whether the connection was allowed or denied",
    ],
    answer: 1,
    explanation:
      "<p>A firewall log only shows that two computers talked. A proxy log shows the <b>full web address</b> and — most useful — the <b>actual person’s username</b> behind it. In a phishing case, the proxy is what tells you who really clicked the link and what they downloaded.</p>",
  },
  {
    id: 7,
    level: "l1",
    category: "Networking",
    question: "Which port pair is most associated with SMB and is a prime lateral-movement channel?",
    options: ["22 / SSH", "445 / SMB", "25 / SMTP", "161 / SNMP"],
    answer: 1,
    explanation:
      "<p>Port <b>445 is SMB</b> — Windows file sharing. Attackers love it for spreading from one machine to the next using admin shares and tools like PsExec. (Ports 137–139 are the older version of the same thing.)</p>",
  },

  /* ---------------- Windows & AD ---------------- */
  {
    id: 8,
    level: "l1",
    category: "Windows & AD",
    question: "Which Windows Event ID records process creation and is the backbone of most execution detections?",
    options: ["4624", "4688", "4769", "1102"],
    answer: 1,
    explanation:
      "<p><b>4688 means “a program started,”</b> and it usually records the full command that was run — so it’s the foundation of most “what ran on this machine?” detections. (Quick reference: 4624 = login, 4769 = Kerberos ticket, 1102 = logs cleared.)</p>",
  },
  {
    id: 9,
    level: "l1",
    category: "Windows & AD",
    question: "Event ID 1102 is generated. What does it mean and how should you treat it?",
    options: [
      "A user logged off — routine, no action",
      "The security audit log was cleared — investigate every time",
      "A scheduled task ran — usually benign",
      "A service was installed — low priority",
    ],
    answer: 1,
    explanation:
      "<p><b>1102 means someone wiped the security log.</b> Real admins almost never do this; attackers do it to hide their tracks. Treat every single one as suspicious until you’ve proven it was legitimate.</p>",
  },
  {
    id: 10,
    level: "l1",
    category: "Windows & AD",
    question: "A service account shows a 4624 with LogonType 10. Why is that a red flag?",
    options: [
      "Type 10 is a batch job and service accounts should not run batch jobs",
      "Type 10 is RDP (RemoteInteractive), and service accounts should never RDP",
      "Type 10 means cleartext credentials",
      "Type 10 is a normal service start",
    ],
    answer: 1,
    explanation:
      "<p>“LogonType” tells you <i>how</i> someone logged in. <b>Type 10 is Remote Desktop.</b> Service accounts (the behind-the-scenes accounts that programs run under) should only ever show types 4 or 5 — never RDP. So a type 10 usually means someone stole the account’s password and is using it in person.</p>",
  },
  {
    id: 11,
    level: "l2",
    category: "Windows & AD",
    question: "In an AES-enabled domain, which detail in event 4769 most suggests Kerberoasting?",
    options: [
      "TicketEncryptionType 0x12 (AES256)",
      "TicketEncryptionType 0x17 (RC4) — an encryption downgrade",
      "A logon from the domain controller itself",
      "A ticket lifetime of 10 hours",
    ],
    answer: 1,
    explanation:
      "<p>Attacker tools ask for login “tickets” using the older, weaker <b>RC4</b> encryption (shown as <code>0x17</code>) because it’s easier to crack open offline. If your network normally uses the stronger AES, seeing RC4 requests — especially lots of them at once — is the giveaway.</p>",
  },
  {
    id: 12,
    level: "l2",
    category: "Windows & AD",
    question: "A Golden Ticket is forged using which secret?",
    options: [
      "The target service account's password hash",
      "The krbtgt account's password hash",
      "The local administrator's NTLM hash",
      "The user's own TGT",
    ],
    answer: 1,
    explanation:
      "<p>A <b>Golden Ticket</b> is a forged “master key” made using the <code>krbtgt</code> account’s password — it lets the attacker pretend to be anyone in the whole network. (A Silver Ticket is a smaller forgery for just one service.) Cleaning up means changing the krbtgt password <b>twice</b>.</p>",
  },
  {
    id: 13,
    level: "l3",
    category: "Windows & AD",
    question: "DCSync is dangerous partly because…",
    options: [
      "it drops a file on the domain controller that AV can catch",
      "it abuses the AD replication API, so no code runs on the DC",
      "it only works from the physical console",
      "it requires the attacker to reboot the DC",
    ],
    answer: 1,
    explanation:
      "<p>Domain controllers normally copy password data to each other to stay in sync. <b>DCSync tricks a domain controller into handing over that password data by pretending to be another one.</b> Nothing gets installed, so antivirus sees nothing — you have to spot the specific request in the logs (event 4662).</p>",
  },
  {
    id: 14,
    level: "l2",
    category: "Windows & AD",
    question: "Pass-the-Hash authenticates using which credential material?",
    options: ["A Kerberos TGT", "An NTLM hash", "A plaintext password", "An OAuth token"],
    answer: 1,
    explanation:
      "<p>A “hash” is a scrambled version of a password. <b>Pass-the-Hash reuses that stolen hash to log in — the attacker never needs the real password.</b> It shows up as a network login (type 3) using NTLM from a machine it shouldn’t be coming from. Pass-the-Ticket is the same trick but with Kerberos tickets instead.</p>",
  },
  {
    id: 15,
    level: "l1",
    category: "Windows & AD",
    question: "Which Event ID is a successful logon?",
    options: ["4625", "4624", "4634", "4648"],
    answer: 1,
    explanation:
      "<p><b>4624 = a successful login.</b> (4625 = a failed login, 4634/4647 = logoff, and 4648 = someone used a different account’s credentials — often a sign of moving sideways through the network.)</p>",
  },

  /* ---------------- Linux ---------------- */
  {
    id: 16,
    level: "l1",
    category: "Linux",
    question: "Where would an attacker most likely plant a backdoor SSH key?",
    options: ["/etc/hostname", "~/.ssh/authorized_keys", "/var/log/syslog", "/etc/motd"],
    answer: 1,
    explanation:
      "<p>Adding their own key to <code>~/.ssh/authorized_keys</code> lets an attacker log back in any time — no password needed. Always compare this file (for every user) against a known-good copy to spot extra keys.</p>",
  },
  {
    id: 17,
    level: "l2",
    category: "Linux",
    question: "LD_PRELOAD / /etc/ld.so.preload abuse is characteristic of which technique?",
    options: [
      "A userland rootkit hooking library calls",
      "A cron-based persistence job",
      "A kernel driver signing bypass",
      "A SUID privilege escalation",
    ],
    answer: 0,
    explanation:
      "<p><code>LD_PRELOAD</code> forces a sneaky add-on library to load first, so the attacker’s code can quietly hide files, processes, and connections. It’s a classic <b>rootkit</b> (hiding) trick — check <code>/etc/ld.so.preload</code> for anything that shouldn’t be there.</p>",
  },
  {
    id: 18,
    level: "l2",
    category: "Linux",
    question: "Which command enumerates SUID binaries to compare against a baseline?",
    options: [
      "find / -perm -4000 -type f",
      "grep -r suid /etc",
      "ss -tulpn",
      "systemctl list-timers",
    ],
    answer: 0,
    explanation:
      "<p><code>find / -perm -4000 -type f</code> lists programs that run with their <b>owner’s</b> powers (usually root) instead of yours. An unexpected one — especially in a folder anyone can write to — is a common way attackers keep root access.</p>",
  },
  {
    id: 19,
    level: "l1",
    category: "Linux",
    question: "Which log primarily records authentication, sudo, and SSH activity?",
    options: ["/var/log/auth.log (or secure)", "/var/log/cron", "/var/log/dmesg", "/var/log/apt/history.log"],
    answer: 0,
    explanation:
      "<p><code>/var/log/auth.log</code> (called <code>secure</code> on Red Hat systems) records logins, <code>sudo</code> use, and SSH activity. Send a copy to your central logging right away — the first thing an intruder does is edit the local copy.</p>",
  },

  /* ---------------- SIEM ---------------- */
  {
    id: 20,
    level: "l1",
    category: "SIEM",
    question: "A rule fires on a sysadmin legitimately running PsExec during authorised maintenance. How is this classified?",
    options: [
      "True positive",
      "False positive",
      "Benign true positive",
      "False negative",
    ],
    answer: 2,
    explanation:
      "<p>The activity <b>really happened</b>, but it was allowed — an admin doing their job. That’s a <b>benign true positive</b>. The fix is a small, targeted exception, not rewriting the rule. (A false positive is different: that’s when the thing never actually happened.)</p>",
  },
  {
    id: 21,
    level: "l1",
    category: "SIEM",
    question: "Which outcome is the most dangerous and hardest to see?",
    options: [
      "False positive",
      "Benign true positive",
      "False negative",
      "True positive",
    ],
    answer: 2,
    explanation:
      "<p>A <b>false negative</b> is real attacker activity that <i>no alert caught</i> — so you never see it unless you go looking. That’s exactly why threat hunting exists, and why “things we found without an alert” is a real measure of how good a team is.</p>",
  },
  {
    id: 22,
    level: "l2",
    category: "SIEM",
    question: "You must tune a noisy rule caused by one backup service account. What is the correct exclusion?",
    options: [
      "Exclude the entire service account everywhere",
      "Exclude the whole technique from the rule",
      "Exclude the specific combination (that account, from those hosts, doing that action)",
      "Disable the rule and rely on EDR",
    ],
    answer: 2,
    explanation:
      "<p>Only exclude the <b>exact combination</b> causing the noise — that account, from those machines, doing that one thing. Muting the whole account or the whole technique leaves a gap an attacker can walk straight through. Then re-test with a known attack to make sure the rule still catches the real thing.</p>",
  },
  {
    id: 23,
    level: "l1",
    category: "SIEM",
    question: "What is the purpose of normalisation in a SIEM?",
    options: [
      "To compress logs and save storage",
      "To map different vendors' fields into one common schema",
      "To encrypt logs at rest",
      "To delete duplicate events",
    ],
    answer: 1,
    explanation:
      "<p>Different products name the same thing differently (one calls it “src_ip,” another “SourceAddress”). Normalisation renames them all to <b>one standard</b>, so a single query works everywhere instead of writing it three times for three vendors.</p>",
  },
  {
    id: 24,
    level: "l3",
    category: "SIEM",
    question: "Which practice is central to detection-as-code?",
    options: [
      "Editing rules directly in the SIEM console for speed",
      "Version-controlling rules in Git with peer review and automated testing",
      "Keeping rules undocumented so attackers cannot learn them",
      "Deploying every proposed rule without validation",
    ],
    answer: 1,
    explanation:
      "<p>Treat detection rules like real software: keep them in version control (Git), have a teammate review each change, and auto-test that every rule <b>fires on a real attack sample and stays quiet on a safe one</b>. That gives you history, easy undo, and an honest map of what you cover.</p>",
  },
  {
    id: 25,
    level: "l2",
    category: "SIEM",
    question: "On the Pyramid of Pain, which indicator type is most painful for an adversary to change?",
    options: ["Hash values", "IP addresses", "Domain names", "TTPs (behaviours)"],
    answer: 3,
    explanation:
      "<p>The higher up the pyramid, the more it hurts the attacker to change. Swapping a file fingerprint takes seconds and a new server costs a few dollars — but changing <b>how they actually operate</b> (their behaviour) is expensive and slow. So aim your detections at behaviour, not just blocklists.</p>",
  },

  /* ---------------- Incident Response ---------------- */
  {
    id: 26,
    level: "l1",
    category: "Incident Response",
    question: "How many phases are in the NIST SP 800-61 incident response lifecycle?",
    options: ["Three", "Four", "Six", "Seven"],
    answer: 1,
    explanation:
      "<p>NIST uses <b>four</b>: Prepare; Detect &amp; Analyse; Contain, Eradicate &amp; Recover; then Review afterwards. (SANS splits it into six, remembered as PICERL — same overall flow.)</p>",
  },
  {
    id: 27,
    level: "l2",
    category: "Incident Response",
    question: "Following the order of volatility, which evidence should you collect first?",
    options: [
      "Disk image",
      "CPU registers and RAM",
      "Archival backups",
      "Off-host log server data",
    ],
    answer: 1,
    explanation:
      "<p>Grab the stuff that vanishes fastest first: <b>memory (RAM)</b> before the hard drive, and the hard drive before backups. Everything you do — even the act of collecting — slowly destroys the most fragile data, so collect it in that order.</p>",
  },
  {
    id: 28,
    level: "l2",
    category: "Incident Response",
    question: "You find a live host mid-ransomware. Should you power it off to stop the encryption?",
    options: [
      "Yes — pull the power immediately",
      "No — isolate via EDR and capture memory; powering off can destroy keys and volatile evidence",
      "Yes — but only after deleting the malware",
      "No — leave it fully online and untouched",
    ],
    answer: 1,
    explanation:
      "<p>Don’t pull the plug. Memory often holds the only copy of the <b>encryption keys</b> and other live evidence, and powering off loses it all. Instead, cut the machine off the network with your EDR tool, capture its memory, then investigate.</p>",
  },
  {
    id: 29,
    level: "l3",
    category: "Incident Response",
    question: "In the first hour of a ransomware incident, which action protects the most value?",
    options: [
      "Rebuilding the first encrypted workstation",
      "Verifying and isolating backups (offline/immutable)",
      "Drafting the customer communication",
      "Running a full AV scan across the estate",
    ],
    answer: 1,
    explanation:
      "<p><b>Protect the backups first.</b> They’re your way home, and attackers deliberately hunt and delete them. Make sure they’re offline or can’t be changed before anything else — losing them is what turns a bad day into a disaster.</p>",
  },
  {
    id: 30,
    level: "l2",
    category: "Incident Response",
    question: "What preserves the integrity of collected evidence for chain of custody?",
    options: [
      "Analysing the original disk directly for speed",
      "Hashing the evidence on acquisition and working only on verified copies",
      "Renaming files to remove attacker artifacts",
      "Storing evidence on the compromised host",
    ],
    answer: 1,
    explanation:
      "<p>Take a digital fingerprint (a <b>hash</b>) of the evidence the moment you collect it, then only ever work on copies. If the fingerprints still match later, you’ve proven nothing was tampered with — which is what makes the evidence hold up.</p>",
  },
  {
    id: 31,
    level: "l2",
    category: "Incident Response",
    question: "Which situation most clearly calls for immediate isolation rather than continued monitoring?",
    options: [
      "A single low-severity alert on a lab VM",
      "Active file encryption or observed lateral spread",
      "A user reporting a suspicious email",
      "A routine failed-logon spike overnight",
    ],
    answer: 1,
    explanation:
      "<p>Cut the machine off straight away when harm is happening <b>right now</b> — files being encrypted, data leaving, or the attacker spreading to other machines. Watching and waiting is only okay when things are contained and you still need to learn the full picture.</p>",
  },

  /* ---------------- Malware & EDR ---------------- */
  {
    id: 32,
    level: "l2",
    category: "Malware & EDR",
    question: "A PE section shows Shannon entropy of 7.9. What does that most likely indicate?",
    options: [
      "The file is digitally signed",
      "The section is packed or encrypted",
      "The file is a plain-text script",
      "The file is corrupted and won't run",
    ],
    answer: 1,
    explanation:
      "<p>Entropy is a measure of randomness, on a scale up to 8. Normal program code is fairly predictable (around 5.5–6.5). A score near 8 means the file is scrambled — <b>packed or encrypted</b> — so what you can see on the surface is hidden, and you’ll need to run it or unpack it to learn more.</p>",
  },
  {
    id: 33,
    level: "l2",
    category: "Malware & EDR",
    question: "Across the many process-injection variants, what is the most reliable universal detection?",
    options: [
      "The presence of the word 'inject' in strings",
      "Executable memory regions not backed by a file on disk",
      "A process using more than 100 MB of RAM",
      "Any use of PowerShell",
    ],
    answer: 1,
    explanation:
      "<p>Normal running code comes from a file on disk. Injected attacker code runs from a chunk of memory with <b>no file behind it</b>. Spotting that “code with no file” is the reliable catch, no matter which specific injection trick was used.</p>",
  },
  {
    id: 34,
    level: "l2",
    category: "Malware & EDR",
    question: "Which is a LOLBin commonly abused to download a payload?",
    options: ["notepad.exe", "certutil.exe", "calc.exe", "mspaint.exe"],
    answer: 1,
    explanation:
      "<p>A “LOLBin” is a trusted, built-in Windows tool that attackers turn against you. <code>certutil</code> is meant for certificates, but attackers use it to <b>download files</b> — sailing past antivirus because the tool itself is trusted. The clue is the odd command it’s given, not the program name.</p>",
  },
  {
    id: 35,
    level: "l2",
    category: "Malware & EDR",
    question: "Why is a mutex name often a durable detection artifact?",
    options: [
      "It is unique to each infected machine",
      "It rarely changes between builds because malware uses it to avoid double-infecting",
      "It is stored encrypted and cannot be read",
      "It changes on every execution",
    ],
    answer: 1,
    explanation:
      "<p>Malware sets a unique “flag” (a mutex) so it doesn’t infect the same PC twice — which means the attacker has a <b>reason to keep that flag the same</b> across versions. That stability makes it a great, reliable thing to hunt for.</p>",
  },
  {
    id: 36,
    level: "l3",
    category: "Malware & EDR",
    question: "Fileless malware leaves nothing on disk. Where is the investigation?",
    options: [
      "Deleted-file recovery on disk",
      "Memory (RAM) analysis",
      "The Windows prefetch folder only",
      "The router logs",
    ],
    answer: 1,
    explanation:
      "<p>Fileless malware only lives in <b>memory</b>, so there’s nothing on the disk to find. The whole investigation happens in a memory capture — which is why you grab RAM <i>before</i> you disconnect or shut down the machine.</p>",
  },
  {
    id: 37,
    level: "l1",
    category: "Malware & EDR",
    question: "What is 'double extortion' in modern ransomware?",
    options: [
      "Encrypting the files twice with two keys",
      "Exfiltrating data before encrypting, then threatening to publish it",
      "Demanding payment in two different cryptocurrencies",
      "Attacking two organisations at once",
    ],
    answer: 1,
    explanation:
      "<p>The attacker <b>copies your data out first</b>, then encrypts it. So even if you restore cleanly from backup, they still threaten to leak what they stole. Assume any ransomware case also involved data theft, and check for large uploads in the days before.</p>",
  },
  {
    id: 38,
    level: "l2",
    category: "Malware & EDR",
    question: "Which is the tell-tale of process hollowing?",
    options: [
      "The process has an unusually long command line",
      "The on-disk image differs from the in-memory image",
      "The process is digitally signed",
      "The process has no network connections",
    ],
    answer: 1,
    explanation:
      "<p>The attacker starts a normal program, scoops out its insides, and secretly stuffs their own code in. So the program <b>on disk no longer matches what’s actually running in memory</b> — and that mismatch is the giveaway.</p>",
  },
  {
    id: 39,
    level: "l1",
    category: "Malware & EDR",
    question: "What defining property separates a worm from a virus?",
    options: [
      "A worm self-propagates with no user action",
      "A worm needs a user to open a file",
      "A worm cannot spread across a network",
      "A worm only affects Linux",
    ],
    answer: 0,
    explanation:
      "<p>A <b>worm spreads by itself</b>, with nobody clicking anything (like WannaCry jumping across the network) — so it spreads fast, and you contain it first. A virus needs a person to open the file before it can run.</p>",
  },

  /* ---------------- Cloud ---------------- */
  {
    id: 40,
    level: "l2",
    category: "Cloud",
    question: "Which AWS log records every API call and is the single most important source for investigations?",
    options: ["VPC Flow Logs", "CloudTrail", "S3 access logs", "GuardDuty findings"],
    answer: 1,
    explanation:
      "<p><b>CloudTrail</b> records every action taken in an AWS account — who did what, and when. The other logs are useful too, but this is the main one you reach for in an investigation.</p>",
  },
  {
    id: 41,
    level: "l2",
    category: "Cloud",
    question: "In Azure AD SigninLogs, which pattern best indicates account compromise?",
    options: [
      "A sign-in from the user's usual city on a corporate device",
      "Impossible travel plus a hosting/VPN ASN rather than a residential ISP",
      "A successful MFA prompt from the registered device",
      "A sign-in during normal business hours",
    ],
    answer: 1,
    explanation:
      "<p>Two logins too far apart for the same person to have travelled between them (“impossible travel”), coming from a data-centre or VPN address instead of a normal home internet provider — that combination strongly suggests a <b>stolen account</b>. Always check what happened next: new mail rules, new MFA setup, files downloaded.</p>",
  },
  {
    id: 42,
    level: "l2",
    category: "Cloud",
    question: "Which sign-in detail most suggests session-token replay (AiTM) rather than a normal login?",
    options: [
      "MFA was satisfied without any prompt to the user",
      "The user entered the correct password",
      "The sign-in used a modern browser",
      "Conditional Access was evaluated",
    ],
    answer: 0,
    explanation:
      "<p>If MFA shows as “passed” but the user was <b>never actually asked to approve it</b>, someone is replaying a stolen login session (an attacker-in-the-middle phish). The fix is to kill the active sessions/tokens — just resetting the password isn’t enough.</p>",
  },
  {
    id: 43,
    level: "l2",
    category: "Cloud",
    question: "What is the most common cloud logging gap SOCs discover?",
    options: [
      "Control-plane logging is enabled but data-plane (object-level) logging is not",
      "Too many logs are collected",
      "Logs are encrypted and unreadable",
      "Sign-in logs are duplicated",
    ],
    answer: 0,
    explanation:
      "<p>Teams often log the <b>settings changes</b> (you can see the permission being changed) but not the <b>actual data access</b> (you can’t see which files were opened). So you spot the misconfiguration but miss the theft that followed.</p>",
  },

  /* ---------------- Frameworks ---------------- */
  {
    id: 44,
    level: "l1",
    category: "Frameworks",
    question: "How many tactics (the 'why') does MITRE ATT&CK for Enterprise define?",
    options: ["7", "10", "14", "20"],
    answer: 2,
    explanation:
      "<p>ATT&amp;CK lists <b>14 tactics</b> — the attacker’s goals, like “get in,” “steal passwords,” “move sideways” — and each one holds many specific techniques. Tag your alerts with technique IDs so you can measure what you do and don’t cover.</p>",
  },
  {
    id: 45,
    level: "l1",
    category: "Frameworks",
    question: "What is the key structural difference between the Cyber Kill Chain and MITRE ATT&CK?",
    options: [
      "The Kill Chain is a granular matrix; ATT&CK is linear",
      "The Kill Chain is a linear seven-stage narrative; ATT&CK is a non-linear matrix of techniques",
      "They are identical models with different names",
      "ATT&CK only covers cloud; the Kill Chain only covers on-prem",
    ],
    answer: 1,
    explanation:
      "<p>The <b>Kill Chain</b> is a simple straight-line story of an attack — great for explaining things to managers. <b>ATT&amp;CK</b> is a big grid of specific techniques that attackers mix and match — great for building detections. Use the first to explain, the second to engineer.</p>",
  },
  {
    id: 46,
    level: "l1",
    category: "Frameworks",
    question: "What is the first stage of the Cyber Kill Chain?",
    options: ["Exploitation", "Reconnaissance", "Command & Control", "Actions on Objectives"],
    answer: 1,
    explanation:
      "<p>It starts with <b>Reconnaissance</b> — the attacker doing their homework on the target. Then comes Weaponization, Delivery, Exploitation, Installation, Command &amp; Control, and finally Actions on Objectives.</p>",
  },
  {
    id: 47,
    level: "l2",
    category: "Frameworks",
    question: "Why block hashes and IPs at all, given they sit at the bottom of the Pyramid of Pain?",
    options: [
      "They stop the most sophisticated adversaries",
      "They are cheap and immediate, even though they are not a strategy",
      "They force adversaries to redesign tradecraft",
      "They are the only detection worth building",
    ],
    answer: 1,
    explanation:
      "<p>Blocking known-bad file fingerprints and IP addresses is worth doing because it’s <b>quick and free</b> — but it barely slows a real attacker (a new file or a new server and they’re back). So do it, but don’t rely on it; build behaviour-based detections too.</p>",
  },

  /* ---------------- Process ---------------- */
  {
    id: 48,
    level: "l1",
    category: "Process",
    question: "Twenty alerts land at once. What should drive your triage order?",
    options: [
      "Arrival order — oldest first",
      "Whichever is quickest to close",
      "Impact × confidence × urgency (asset criticality, attack stage, blast radius)",
      "Alphabetical by rule name",
    ],
    answer: 2,
    explanation:
      "<p>Sort by <b>how much damage it could do, how sure you are, and how urgent it is</b> — a domain controller or finance system beats a test machine, and an attacker stealing passwords beats one just looking around. Also notice when 20 alerts are really one incident on one machine.</p>",
  },
  {
    id: 49,
    level: "l2",
    category: "Process",
    question: "You closed an alert as a false positive; it turns out it was a real breach. What is the right first move?",
    options: [
      "Quietly reopen it and hope no one notices",
      "Wait until you have full details before telling anyone",
      "Disclose immediately and re-scope from the original alert timestamp",
      "Delete your original notes to avoid blame",
    ],
    answer: 2,
    explanation:
      "<p><b>Own up right away</b> and reopen the case, counting the clock from the <i>original</i> alert, not from when you noticed. Good teams treat this as a process gap to fix — missing context, an unclear playbook — not a person to blame. Trying to hide it is the only truly wrong move.</p>",
  },
  {
    id: 50,
    level: "l3",
    category: "Process",
    question: "Which best measures whether a SOC is actually effective?",
    options: [
      "Total number of alerts processed per day",
      "Number of tickets closed per analyst",
      "Dwell time and validated detection coverage",
      "Volume of logs ingested",
    ],
    answer: 2,
    explanation:
      "<p>Counting alerts or closed tickets just measures how <i>busy</i> you are. What actually matters is <b>how long attackers go unnoticed</b> (“dwell time”) and whether your detections really fire when you test them. Those tell you if the team is effective, not just active.</p>",
  },
];

export const MCQ_COUNT = MCQS.length;
