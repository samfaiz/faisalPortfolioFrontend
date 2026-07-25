/**
 * Sequential learning paths for the Cloud Security prep kit.
 *
 * The rest of the page is organised by *type* (fundamentals, scenarios, deep
 * dives) — ideal for reference, poor for studying. A path puts the same
 * material in the order you should learn it, and each step expands in place so
 * you never lose your position.
 *
 * `refs` point at existing cards by id; nothing here duplicates content.
 */
import type { Tier } from "./data";

/** Which section a step lives in — matches the DOM ids `item-{kind}-{id}`. */
export type CloudRefKind = "cf" | "cs" | "ap" | "pb" | "ta";

export interface CloudPathRef {
  kind: CloudRefKind;
  /** Fundamentals use the array index; the rest use their own id. */
  id: string | number;
  label: string;
}

export interface CloudPathModule {
  id: number;
  title: string;
  goal: string;
  minutes: number;
  covers: string[];
  refs: CloudPathRef[];
  checkpoint: string;
  image?: string;
  imageAlt?: string;
}

export interface CloudLearningPath {
  tier: Tier;
  title: string;
  intro: string;
  modules: CloudPathModule[];
}

const ASSOCIATE_MODULES: CloudPathModule[] = [
  {
    id: 1,
    title: "How cloud security is different — shared responsibility",
    goal: "Say exactly where the provider's job ends and yours begins, for any service.",
    minutes: 30,
    covers: [
      "What the provider secures vs what you secure",
      "How the line moves across IaaS, PaaS, SaaS and serverless",
      "Why identity and data are always yours",
      "Why almost every cloud breach is a customer misconfiguration",
    ],
    refs: [
      { kind: "cf", id: 0, label: "The shared responsibility model — who secures what?" },
      { kind: "cf", id: 12, label: "Service models — where the responsibility line moves" },
    ],
    checkpoint:
      "Pick any three services you use. For each, say in one sentence what you are responsible for.",
    image: "/cloud-prep/diagrams/01-shared-responsibility.webp",
    imageAlt: "Shared responsibility matrix across IaaS, PaaS, SaaS and serverless",
  },
  {
    id: 2,
    title: "Identity is the perimeter",
    goal: "Explain how cloud permissions work and what least privilege means in practice.",
    minutes: 45,
    covers: [
      "How IAM is structured in AWS, Azure and GCP",
      "Least privilege: scope to resources and conditions, then review",
      "Locking down the root / global-admin account",
      "MFA everywhere, and phishing-resistant MFA for admins",
    ],
    refs: [
      { kind: "cf", id: 1, label: "Least privilege and how cloud permissions are structured" },
      { kind: "cf", id: 13, label: "Protecting the root / global-admin account" },
      { kind: "cf", id: 14, label: "MFA and phishing-resistant authentication" },
    ],
    checkpoint:
      "Name the IAM building block in each cloud (AWS policy, Azure RBAC assignment, GCP binding) and one thing you would lock down on day one.",
    image: "/cloud-prep/diagrams/02-iam-three-clouds.webp",
    imageAlt: "Identity and access management compared across AWS, Azure and GCP",
  },
  {
    id: 3,
    title: "Kill static keys — workload identity and secrets",
    goal: "Explain why long-lived keys are the top cloud risk, and what replaces them.",
    minutes: 45,
    covers: [
      "Why a leaked key is found by scrapers within minutes",
      "Secrets managers vs hardcoded credentials",
      "Workload identity: short-lived credentials bound to the workload",
      "What actually has to happen after a key leaks",
    ],
    refs: [
      { kind: "cf", id: 8, label: "Secrets management — no hardcoded credentials" },
      { kind: "cf", id: 16, label: "Workload identity — credentials for machines" },
      { kind: "ap", id: 2, label: "Attack path: leaked long-lived credentials" },
      { kind: "cs", id: 1, label: "Scenario: access key leaked to GitHub → crypto-mining" },
    ],
    checkpoint:
      "A key is committed to a public repo and the developer deletes the commit. Explain why that is not enough.",
    image: "/cloud-prep/diagrams/03-static-keys-vs-workload-identity.webp",
    imageAlt: "Static access keys compared with short-lived workload identity credentials",
  },
  {
    id: 4,
    title: "Public exposure — the most common finding",
    goal: "Find and close anything reachable from the internet that should not be.",
    minutes: 45,
    covers: [
      "Public storage: buckets, containers, snapshots and images",
      "Preventive blocks at account/org level, not per-resource fixes",
      "Classifying data so you know what is actually at risk",
      "Why data-plane logging decides whether you can prove access",
    ],
    refs: [
      { kind: "cf", id: 18, label: "Finding and closing public exposure" },
      { kind: "cf", id: 21, label: "Data classification and storage security" },
      { kind: "ap", id: 1, label: "Attack path: public object storage" },
      { kind: "cs", id: 3, label: "Scenario: public S3 bucket with customer PII" },
      { kind: "cs", id: 10, label: "Scenario: public blob container leaking documents" },
    ],
    checkpoint:
      "A researcher reports a public bucket. Say what you do in the first hour, and what determines whether you must notify.",
    image: "/cloud-prep/diagrams/04-public-exposure.webp",
    imageAlt: "Public exposure surfaces across the three clouds and the preventive control for each",
  },
  {
    id: 5,
    title: "Network basics and management ports",
    goal: "Read a security group / NSG / firewall rule and spot the dangerous one.",
    minutes: 40,
    covers: [
      "Private networks, subnets and default-deny inbound",
      "Why 0.0.0.0/0 on 22 or 3389 is the classic finding",
      "Bastion, just-in-time and identity-aware proxy instead of public admin ports",
      "Reaching managed services privately",
    ],
    refs: [
      { kind: "cf", id: 4, label: "Network segmentation and the perimeter" },
      { kind: "ap", id: 7, label: "Attack path: exposed management ports" },
      { kind: "cs", id: 13, label: "Scenario: RDP open to the internet → brute force" },
    ],
    checkpoint:
      "An engineer needs SSH to debug production right now. Give them a safe answer instead of opening port 22.",
    image: "/cloud-prep/diagrams/05-network-exposure.webp",
    imageAlt: "Exposed versus hardened cloud network showing bastion and private endpoints",
  },
  {
    id: 6,
    title: "Encryption and key management",
    goal: "Explain encryption at rest and in transit, and who really controls the keys.",
    minutes: 40,
    covers: [
      "Default encryption vs customer-managed keys — the difference that matters",
      "Envelope encryption and what a KMS actually does",
      "TLS everywhere and managed certificates",
      "Why disabling a key is an instant revocation lever",
    ],
    refs: [
      { kind: "cf", id: 3, label: "Encryption and key management" },
      { kind: "cf", id: 22, label: "Encryption in transit and certificate management" },
    ],
    checkpoint:
      "Everything is encrypted by default. Explain why an interviewer still asks about customer-managed keys.",
    image: "/cloud-prep/diagrams/06-encryption-keys.webp",
    imageAlt: "Encryption at rest and in transit with the key management service in the middle",
  },
  {
    id: 7,
    title: "Logging — what to turn on before you need it",
    goal: "Name the audit log in each cloud and know what it will and will not answer.",
    minutes: 40,
    covers: [
      "Control-plane vs data-plane logging, and why the gap matters",
      "CloudTrail / Activity Log / Cloud Audit Logs",
      "Centralising logs and making them tamper-proof",
      "Why disabling logging is itself an incident",
    ],
    refs: [
      { kind: "cf", id: 5, label: "Audit logging and threat detection" },
      { kind: "cf", id: 28, label: "Log integrity and centralization" },
      { kind: "ap", id: 9, label: "Attack path: disabling or deleting audit logs" },
      { kind: "cs", id: 5, label: "Scenario: CloudTrail stopped in one region" },
    ],
    checkpoint:
      "You must prove whether a file in cloud storage was downloaded. Say which log answers it and what happens if it was off.",
    image: "/cloud-prep/diagrams/07-cloud-logging.webp",
    imageAlt: "Control plane versus data plane logging across AWS, Azure and GCP",
  },
  {
    id: 8,
    title: "Posture management and benchmarks",
    goal: "Explain what CSPM does and how a misconfiguration gets found and fixed.",
    minutes: 35,
    covers: [
      "CSPM: continuous configuration scanning against a baseline",
      "The CIS Benchmarks as the standard baseline",
      "Detecting drift — and alerting on the guardrail change itself",
      "Turning findings into tickets people actually close",
    ],
    refs: [
      { kind: "cf", id: 6, label: "Cloud Security Posture Management (CSPM)" },
      { kind: "cf", id: 29, label: "CIS Benchmarks and compliance scanning" },
      { kind: "cs", id: 19, label: "Scenario: org policy drift — external IPs re-enabled" },
    ],
    checkpoint:
      "Name the posture tool in each cloud, and say why alerting on a policy change beats detecting the resulting risk.",
    image: "/cloud-prep/diagrams/08-cspm-loop.webp",
    imageAlt: "Cloud security posture management loop from scan to finding to remediation to drift detection",
  },
  {
    id: 9,
    title: "The attack paths you must recognise",
    goal: "Describe how attackers actually get in and move, in cloud terms.",
    minutes: 50,
    covers: [
      "SSRF to instance metadata — the credential-theft chain",
      "IAM privilege escalation through permission combinations",
      "Identity attacks: MFA fatigue and token theft",
      "Resource hijacking, and why crypto-mining is usually a symptom",
    ],
    refs: [
      { kind: "cf", id: 10, label: "Instance metadata and the SSRF credential-theft path" },
      { kind: "ap", id: 3, label: "Attack path: SSRF to instance metadata" },
      { kind: "ap", id: 4, label: "Attack path: IAM privilege escalation chains" },
      { kind: "ap", id: 10, label: "Attack path: resource hijacking (crypto-mining)" },
      { kind: "cs", id: 11, label: "Scenario: MFA fatigue → account takeover" },
    ],
    checkpoint:
      "Explain the SSRF-to-metadata chain, and name the one setting that breaks it.",
    image: "/cloud-prep/diagrams/09-attack-paths.webp",
    imageAlt: "The main cloud attack paths from initial access through escalation to impact",
  },
  {
    id: 10,
    title: "Cloud incident response",
    goal: "Say how you contain a cloud incident when you cannot unplug a server.",
    minutes: 40,
    covers: [
      "Containment through the API: isolate, revoke, rotate",
      "Why revoking tokens matters more than resetting a password",
      "Evidence: snapshots and logs, collected before containment destroys them",
      "Immutable backups as the control that survives an admin-level attacker",
    ],
    refs: [
      { kind: "cf", id: 11, label: "Incident response in the cloud" },
      { kind: "cf", id: 37, label: "Backup, resilience and ransomware readiness" },
      { kind: "cs", id: 7, label: "Scenario: ransomware attempt against data and backups" },
    ],
    checkpoint:
      "An attacker has admin. Say which of your controls still holds, and why immutability is the answer.",
    image: "/cloud-prep/diagrams/10-cloud-ir.webp",
    imageAlt: "Cloud incident response flow showing isolate, revoke, snapshot and rebuild through the API",
  },
  {
    id: 11,
    title: "Governance, guardrails and compliance",
    goal: "Explain how you stop misconfiguration at scale instead of fixing it one account at a time.",
    minutes: 40,
    covers: [
      "Preventive guardrails vs detective controls",
      "Resource hierarchy and multi-account strategy for blast radius",
      "Landing zones — environments that start secure",
      "Mapping controls to SOC 2 / ISO / PCI and evidencing them",
    ],
    refs: [
      { kind: "cf", id: 7, label: "Governance guardrails and policy-as-code" },
      { kind: "cf", id: 31, label: "Landing zones and multi-account strategy" },
      { kind: "cf", id: 32, label: "Mapping controls to compliance frameworks" },
      { kind: "pb", id: "governance", label: "Playbook: governance & compliance hardening" },
    ],
    checkpoint:
      "Explain to a manager why one preventive guardrail beats a hundred remediated findings.",
    image: "/cloud-prep/diagrams/11-guardrails.webp",
    imageAlt: "Preventive guardrails versus detective controls across an account hierarchy",
  },
  {
    id: 12,
    title: "Associate checkpoint — mixed exam",
    goal: "Prove it under exam conditions, then close the gaps.",
    minutes: 30,
    covers: [
      "Set the tier filter to ASSOCIATE and run the full quiz",
      "Use 'practise the ones I missed' until you clear them",
      "Re-read the module behind every wrong answer",
      "Say three scenarios out loud in STAR form, one per cloud",
    ],
    refs: [],
    checkpoint:
      "Score 90%+ on the Associate quiz, and deliver one AWS, one Azure and one GCP scenario from memory.",
    image: "/cloud-prep/diagrams/12-associate-readiness.webp",
    imageAlt: "Associate readiness checklist summarising the eleven preceding modules",
  },
];

export const CLOUD_LEARNING_PATHS: CloudLearningPath[] = [
  {
    tier: "associate",
    title: "Associate — Cloud Security Analyst",
    intro:
      "Eleven modules plus an exam, about 8 hours of focused work. Each step expands right here, so you never lose your place. Do them in order — every module assumes the one before it. Use the provider toggle above to focus one cloud, or leave it on ALL to learn the mapping.",
    modules: ASSOCIATE_MODULES,
  },
];

export const CLOUD_PATH_TOTAL_MINUTES = ASSOCIATE_MODULES.reduce((a, m) => a + m.minutes, 0);
