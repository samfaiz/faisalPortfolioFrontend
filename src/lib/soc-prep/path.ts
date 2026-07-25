/**
 * Sequential learning paths for the SOC-prep kit.
 *
 * The rest of the kit is organised by *type* (fundamentals, logs, scenarios),
 * which is ideal for reference but poor for studying. A path puts the same
 * material in the order you should actually learn it: module 01, then 02, then
 * 03 — each with a goal, the exact cards to read, and a checkpoint.
 *
 * Nothing here duplicates content: `refs` point at existing cards by id, and
 * the UI opens and scrolls to them.
 */
import type { Level } from "./data";

/** Which section a step lives in — matches the DOM ids `item-{kind}-{id}`. */
export type RefKind = "qa" | "lg" | "sc" | "ma";

export interface PathRef {
  kind: RefKind;
  /** Fundamentals use the array index; logs/scenarios/malware use their id. */
  id: string | number;
  label: string;
}

export interface PathModule {
  id: number;
  title: string;
  /** One line — what you can do after this module. */
  goal: string;
  minutes: number;
  /** The concrete things this module teaches. */
  covers: string[];
  /** The exact cards to work through, in order. */
  refs: PathRef[];
  /** How you know you've actually got it. */
  checkpoint: string;
  /** Optional diagram in /public/soc-prep/diagrams/ — rendered when present. */
  image?: string;
  imageAlt?: string;
}

export interface LearningPath {
  level: Level;
  title: string;
  intro: string;
  modules: PathModule[];
}

const L1_MODULES: PathModule[] = [
  {
    id: 1,
    title: "What a SOC is, and what L1 actually owns",
    goal: "Explain the job, the tiers, and where your responsibility starts and stops.",
    minutes: 25,
    covers: [
      "What a SOC does and how L1 / L2 / L3 divide the work",
      "What a SIEM is and the six things it does",
      "How to prioritise when the queue floods",
      "How to answer 'why do you want this job' with something concrete",
    ],
    refs: [
      { kind: "qa", id: 34, label: "Why do you want to work in a SOC?" },
      { kind: "qa", id: 13, label: "What is a SIEM and its core functions?" },
      { kind: "qa", id: 31, label: "Prioritising twenty alerts at once" },
    ],
    checkpoint:
      "Say out loud, in 60 seconds: what an L1 owns, what you escalate, and how you decide what to look at first.",
    image: "/soc-prep/diagrams/01-soc-tiers.webp",
    imageAlt: "SOC tier structure showing L1, L2 and L3 responsibilities and escalation flow",
  },
  {
    id: 2,
    title: "Networking foundations you use every shift",
    goal: "Read a firewall or flow log line and know what it means.",
    minutes: 40,
    covers: [
      "The TCP three-way handshake and what a half-open pattern looks like",
      "TCP vs UDP, and which attacks favour each",
      "The ports that matter security-wise: 445, 3389, 53, 88/389, 5985",
    ],
    refs: [
      { kind: "qa", id: 0, label: "TCP three-way handshake" },
      { kind: "qa", id: 1, label: "TCP vs UDP" },
      { kind: "qa", id: 2, label: "Ports an L1 must know cold" },
    ],
    checkpoint:
      "Given 'many SYN, no SYN-ACK', say what it is. Given east-west 3389, say why it matters.",
    image: "/soc-prep/diagrams/02-tcp-handshake-ports.webp",
    imageAlt: "TCP three-way handshake sequence and a map of security-relevant ports",
  },
  {
    id: 3,
    title: "Windows logs, part 1 — logons",
    goal: "Read a 4624 and judge whether the logon is normal.",
    minutes: 45,
    covers: [
      "The Event IDs every analyst knows by heart",
      "Logon types 2 / 3 / 4 / 5 / 9 / 10 and what each implies",
      "Where the Security log lives and how to query it",
      "Spotting brute force that succeeded (4625 burst → 4624)",
    ],
    refs: [
      { kind: "qa", id: 6, label: "Windows Event IDs you must know" },
      { kind: "qa", id: 7, label: "Windows logon types" },
      { kind: "lg", id: 1, label: "Security log — logons (4624 / 4625)" },
    ],
    checkpoint:
      "A service account shows LogonType 10. Explain in one sentence why that is a red flag.",
    image: "/soc-prep/diagrams/03-windows-logon-types.webp",
    imageAlt: "Anatomy of a Windows 4624 event with the logon type table and red flags",
  },
  {
    id: 4,
    title: "Windows logs, part 2 — process execution",
    goal: "Judge a process from its parent chain, before analysing any payload.",
    minutes: 45,
    covers: [
      "Event 4688 and why the command line matters",
      "Reading a process tree: parent → child",
      "The abnormal parents that mean 'investigate now'",
      "LOLBins: trusted binaries doing untrusted things",
    ],
    refs: [
      { kind: "lg", id: 2, label: "Security log — process creation (4688)" },
      { kind: "qa", id: 24, label: "What is a process tree?" },
      { kind: "qa", id: 25, label: "LOLBin abuse and how to detect it" },
    ],
    checkpoint:
      "Explain why WINWORD.EXE → powershell.exe is an incident but cmd.exe alone is not.",
    image: "/soc-prep/diagrams/04-process-tree.webp",
    imageAlt: "Process tree diagram showing a malicious Office macro chain versus a benign chain",
  },
  {
    id: 5,
    title: "Linux logs",
    goal: "Triage a suspect Linux host from its logs.",
    minutes: 35,
    covers: [
      "Which files matter: auth.log/secure, syslog, cron, wtmp",
      "Reading SSH success and failure lines",
      "Spotting sudo abuse and planted SSH keys",
      "Where attackers hide persistence on Linux",
    ],
    refs: [
      { kind: "qa", id: 11, label: "Which Linux logs and locations matter" },
      { kind: "lg", id: 10, label: "auth.log / secure — authentication and sudo" },
      { kind: "lg", id: 12, label: "syslog, cron and login records" },
    ],
    checkpoint:
      "Given a burst of 'Failed password' followed by 'Accepted publickey', say what happened.",
    image: "/soc-prep/diagrams/05-linux-log-map.webp",
    imageAlt: "Map of Linux log file locations and what each one answers during triage",
  },
  {
    id: 6,
    title: "Alert triage — TP, FP and benign true positive",
    goal: "Close alerts correctly and know which fix each verdict needs.",
    minutes: 30,
    covers: [
      "The four verdicts and why FP vs BTP changes the remediation",
      "Verifying before escalating (and before blocking)",
      "Why closing everything as FP is the most dangerous habit in a SOC",
    ],
    refs: [
      { kind: "qa", id: 14, label: "TP / FP / benign true positive" },
      { kind: "sc", id: 34, label: "Port scan that was an authorised scanner" },
      { kind: "sc", id: 38, label: "Beaconing that was legitimate software" },
      { kind: "sc", id: 21, label: "Impossible travel that was benign" },
    ],
    checkpoint:
      "For each of those three scenarios, state the verdict and the correct fix (logic change vs scoped exclusion).",
    image: "/soc-prep/diagrams/06-triage-decision-tree.webp",
    imageAlt: "Alert triage decision tree leading to true positive, false positive or benign true positive",
  },
  {
    id: 7,
    title: "Phishing triage — your most common ticket",
    goal: "Work a reported phish end to end and scope who is affected.",
    minutes: 50,
    covers: [
      "Reading email headers and why SPF/DKIM/DMARC passing proves nothing about trust",
      "Using the proxy log to tell clicked from credentials-entered",
      "Message trace to find every other recipient",
      "Phish types that bypass technical controls: QR, callback, legitimate-looking",
    ],
    refs: [
      { kind: "lg", id: 25, label: "Email gateway & message trace" },
      { kind: "qa", id: 3, label: "What a proxy log gives you that a firewall does not" },
      { kind: "lg", id: 15, label: "Proxy / web gateway logs" },
      { kind: "sc", id: 2, label: "QR code phishing (quishing)" },
      { kind: "sc", id: 6, label: "Callback phishing — no link, no attachment" },
      { kind: "sc", id: 4, label: "Reported phish that was legitimate marketing" },
    ],
    checkpoint:
      "Given 12 reports, describe how you'd find who actually submitted credentials — and what you'd do differently for those users.",
    image: "/soc-prep/diagrams/07-phishing-triage-flow.webp",
    imageAlt: "Phishing triage flow from report through delivered, clicked, credentials submitted, to response",
  },
  {
    id: 8,
    title: "Malware basics and EDR",
    goal: "Classify malware correctly, because the class decides the response.",
    minutes: 40,
    covers: [
      "Virus, worm, trojan, RAT, infostealer, ransomware, wiper — and what each implies",
      "Reading an EDR detection and its process tree",
      "Why 'blocked' does not mean 'no impact'",
      "The four types of malware analysis and when to stop",
    ],
    refs: [
      { kind: "qa", id: 23, label: "Virus, worm, trojan, ransomware" },
      { kind: "ma", id: "11", label: "Malware families and what each implies" },
      { kind: "lg", id: 24, label: "EDR / antivirus telemetry" },
      { kind: "sc", id: 12, label: "Infostealer from cracked software" },
      { kind: "ma", id: "01", label: "The four analysis types" },
    ],
    checkpoint:
      "EDR blocked an infostealer. Explain why you still reset credentials and reimage.",
    image: "/soc-prep/diagrams/08-malware-families.webp",
    imageAlt: "Malware family taxonomy showing each type and the response it implies",
  },
  {
    id: 9,
    title: "Network telemetry — which log answers which question",
    goal: "Pick the right log source instead of searching everything.",
    minutes: 40,
    covers: [
      "Firewall vs proxy vs DNS vs flow — what each can and cannot tell you",
      "Spotting beaconing by its rhythm",
      "Recognising exfiltration by bytes-out vs bytes-in",
      "Why DNS is both a great detection source and a covert channel",
    ],
    refs: [
      { kind: "lg", id: 14, label: "Firewall logs" },
      { kind: "lg", id: 16, label: "DNS logs" },
      { kind: "lg", id: 19, label: "VPN logs" },
      { kind: "qa", id: 5, label: "A host is beaconing — how do you confirm it?" },
    ],
    checkpoint:
      "You must prove a user downloaded a file. Say which log you open and why the firewall log cannot answer it.",
    image: "/soc-prep/diagrams/09-network-log-comparison.webp",
    imageAlt: "Comparison of firewall, proxy, DNS and flow logs showing which question each one answers",
  },
  {
    id: 10,
    title: "Identity attacks",
    goal: "Tell spray, brute force and token theft apart from the logs.",
    minutes: 40,
    covers: [
      "Password spray vs brute force — and why spray defeats lockout thresholds",
      "Reading Entra ID sign-in logs: ASN, impossible travel, MFA outcome",
      "MFA satisfied without a prompt = stolen token, not a stolen password",
      "Account and group change events that signal escalation",
    ],
    refs: [
      { kind: "lg", id: 20, label: "Entra ID / Azure AD sign-in logs" },
      { kind: "lg", id: 7, label: "Account & group changes" },
      { kind: "sc", id: 19, label: "Password spray with two successes in the noise" },
      { kind: "sc", id: 21, label: "Impossible travel that was benign" },
    ],
    checkpoint:
      "Explain why revoking tokens is required after token theft, and a password reset alone is not enough.",
    image: "/soc-prep/diagrams/10-identity-attacks.webp",
    imageAlt: "Comparison of password spray, brute force and token replay with their log signatures",
  },
  {
    id: 11,
    title: "Escalation, IR basics and documentation",
    goal: "Hand off an incident so L2 can start investigating in the first minute.",
    minutes: 35,
    covers: [
      "The IR lifecycle and which phase you are in",
      "What a complete escalation contains",
      "Why log tampering (1102) is always an incident",
      "Documenting actions and timestamps as you go",
    ],
    refs: [
      { kind: "qa", id: 18, label: "Phases of the incident response lifecycle" },
      { kind: "qa", id: 19, label: "What belongs in an escalation to Tier 2" },
      { kind: "lg", id: 8, label: "Audit log cleared (1102) & log tampering" },
      { kind: "sc", id: 41, label: "Mass email forwarding rule" },
      { kind: "sc", id: 47, label: "Ransom note with no encryption — a hoax" },
    ],
    checkpoint:
      "Write a five-line escalation for one of those scenarios: what fired, entities, what you checked, why it looks real, actions taken.",
    image: "/soc-prep/diagrams/11-ir-lifecycle-escalation.webp",
    imageAlt: "NIST incident response lifecycle with an escalation template showing required fields",
  },
  {
    id: 12,
    title: "L1 checkpoint — mixed exam",
    goal: "Prove it under exam conditions, then fix what you missed.",
    minutes: 30,
    covers: [
      "Set the tier filter to L1 and run the full quiz",
      "Use 'practise the ones I missed' until you clear them",
      "Re-read the module behind every wrong answer",
      "Say three scenarios out loud from memory in STAR form",
    ],
    refs: [],
    checkpoint:
      "Score 90%+ on the L1 quiz, and deliver three scenarios out loud without reading them.",
    image: "/soc-prep/diagrams/12-l1-readiness.webp",
    imageAlt: "L1 readiness checklist summarising the eleven preceding modules",
  },
];

export const LEARNING_PATHS: LearningPath[] = [
  {
    level: "l1",
    title: "L1 — Alert Triage Analyst",
    intro:
      "Twelve modules in order, about 8 hours of focused work. Each one links straight to the exact cards to read, then gives you a checkpoint to say out loud. Do them in sequence — every module assumes the one before it.",
    modules: L1_MODULES,
  },
];

export const PATH_TOTAL_MINUTES = L1_MODULES.reduce((a, m) => a + m.minutes, 0);
