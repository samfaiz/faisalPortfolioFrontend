/**
 * Cloud Security prep kit content. Multi-cloud (AWS / Azure / GCP), tiered by
 * seniority (Associate / Engineer / Architect), and tagged to certifications
 * (AWS Security Specialty, Azure AZ-500, GCP PCSE, CCSP).
 *
 * Each fundamental has a provider-neutral `concept` plus per-provider specifics
 * in `providers`. String fields may contain inline HTML rendered via
 * dangerouslySetInnerHTML inside .soc-prose containers.
 */

export type Tier = "associate" | "engineer" | "architect";
export type Provider = "aws" | "azure" | "gcp";
export type Cert = "aws-scs" | "az-500" | "gcp-pcse" | "ccsp";

export const TIER_NAMES: Record<Tier, string> = {
  associate: "Associate",
  engineer: "Engineer",
  architect: "Architect",
};

export const PROVIDER_NAMES: Record<Provider, string> = {
  aws: "AWS",
  azure: "Azure",
  gcp: "GCP",
};

export const CERT_NAMES: Record<Cert, string> = {
  "aws-scs": "AWS SCS",
  "az-500": "AZ-500",
  "gcp-pcse": "GCP PCSE",
  ccsp: "CCSP",
};

export const PROVIDER_ORDER: Provider[] = ["aws", "azure", "gcp"];

export interface Fundamental {
  tier: Tier;
  category: string;
  certs: Cert[];
  title: string;
  /** Provider-neutral plain-English explanation. */
  concept: string;
  /** Per-provider specifics (services, controls). */
  providers: Partial<Record<Provider, string>>;
}

export interface Role {
  tier: Tier;
  title: string;
  range: string;
  items: string[];
  kpi: string;
}

const ALL_CERTS: Cert[] = ["aws-scs", "az-500", "gcp-pcse", "ccsp"];

export const FUNDAMENTALS: Fundamental[] = [
  {
    tier: "associate",
    category: "Shared Responsibility",
    certs: ALL_CERTS,
    title: "The shared responsibility model — who secures what?",
    concept:
      "<p>The provider secures the cloud <b>itself</b> — data centres, hardware, the hypervisor, the core network. <b>You</b> secure what you put <i>in</i> it: your configuration, data, identities, and access. The line moves with the service model — with IaaS almost everything above the hypervisor is yours; with SaaS you mostly own identity, data, and settings.</p><p>Most cloud breaches are not the provider being hacked — they're a customer misconfiguration (a public bucket, an over-permissive role). Knowing exactly where your responsibility starts is the whole game.</p>",
    providers: {
      aws: "<p><b>AWS Shared Responsibility Model.</b> AWS secures regions, AZs, and the hypervisor; you own the guest OS and patching (EC2), security groups, IAM, S3 bucket policies, and encryption choices.</p>",
      azure:
        "<p><b>Microsoft's split.</b> Microsoft secures the physical hosts, network, and datacentre; you always own identities (Entra ID), data, and endpoints, plus the OS and NSGs for IaaS VMs.</p>",
      gcp: "<p><b>Google 'shared fate'.</b> Google goes a step further with secure-by-default blueprints and Assured Workloads, but you still own IAM, VPC firewall rules, and your data.</p>",
    },
  },
  {
    tier: "associate",
    category: "IAM & Identity",
    certs: ALL_CERTS,
    title: "Least privilege and how cloud permissions are structured",
    concept:
      "<p>Grant only the permissions actually needed, scoped to specific resources and conditions — then review and remove what goes unused. Prefer short-lived <b>roles/identities</b> over long-lived keys, because a leaked static key is a standing invitation.</p><p>Over-privileged identities are the number-one cloud attack path: compromise one, and excess permissions let the attacker pivot and escalate.</p>",
    providers: {
      aws: "<p><b>IAM policies</b> (JSON: Effect / Action / Resource / Condition). Use <b>IAM roles + STS temporary credentials</b>, not access keys. <b>Permission boundaries</b> and <b>SCPs</b> cap the maximum privilege; <b>IAM Access Analyzer</b> flags public or cross-account access.</p>",
      azure:
        "<p><b>Azure RBAC</b> role assignments (scope: management group → subscription → resource group → resource). Use <b>Managed Identities</b> instead of secrets, <b>PIM</b> for just-in-time elevation, and <b>Conditional Access</b> to gate sign-ins.</p>",
      gcp: "<p><b>Cloud IAM</b> bindings (member + role on a resource). Prefer predefined roles, <b>service accounts + Workload Identity Federation</b> over SA keys. <b>IAM Recommender</b> flags excess permissions; <b>Org Policy</b> sets guardrails.</p>",
    },
  },
  {
    tier: "engineer",
    category: "IAM & Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Identity federation and single sign-on",
    concept:
      "<p>Keep human identity in <b>one</b> identity provider and federate into each cloud via SSO (SAML/OIDC) — no local per-cloud users. MFA everywhere, and deprovisioning happens in one place when someone leaves.</p><p>Local cloud users with long-lived passwords/keys are how orphaned access lingers after someone leaves. Federation makes the leaver process one switch.</p>",
    providers: {
      aws: "<p><b>IAM Identity Center</b> (formerly AWS SSO) federated to your IdP, with permission sets per account. Avoid standalone IAM users entirely.</p>",
      azure:
        "<p><b>Entra ID</b> is the IdP: Conditional Access + MFA, B2B for guests, and app registrations for workload identity.</p>",
      gcp: "<p><b>Cloud Identity / Workspace</b> as the IdP, or federate an external IdP; <b>Workforce Identity Federation</b> for human SSO without Google accounts.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Data Protection",
    certs: ALL_CERTS,
    title: "Encryption and key management",
    concept:
      "<p>Encrypt data <b>at rest and in transit</b>. Manage keys centrally, and separate <i>who can use a key</i> from <i>who can read the data</i>. Customer-managed keys give you control over rotation and the ability to revoke access by disabling the key.</p><p>Default encryption is usually on, so the interview question is really about <b>key control</b>: who holds the keys, how they rotate, and whether you can prove it.</p>",
    providers: {
      aws: "<p><b>KMS</b> (AWS-managed vs customer-managed CMKs), envelope encryption, key policies + grants. S3 SSE-KMS, EBS/RDS encryption. <b>Secrets Manager</b> / SSM Parameter Store for secrets; <b>CloudHSM</b> for FIPS 140-2 Level 3.</p>",
      azure:
        "<p><b>Key Vault</b> (keys / secrets / certs) and <b>Managed HSM</b>; customer-managed keys (CMK) for storage and disk encryption. Reach Key Vault via Managed Identity, never a stored secret.</p>",
      gcp: "<p><b>Cloud KMS</b> with <b>CMEK</b> (customer-managed encryption keys), <b>Secret Manager</b>, and Cloud HSM / External Key Manager. Everything is encrypted at rest by default; CMEK adds control.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Network Security",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Network segmentation and the perimeter",
    concept:
      "<p>Put workloads in <b>private networks</b>, restrict traffic (north-south and east-west) to least privilege, avoid public exposure, and reach managed services over <b>private connectivity</b> instead of the internet.</p><p>The classic finding is <code>0.0.0.0/0</code> on SSH/RDP or a database — anything world-open on an admin or data port is an incident waiting to happen.</p>",
    providers: {
      aws: "<p><b>VPC</b> + subnets, <b>security groups</b> (stateful) vs <b>NACLs</b> (stateless). <b>PrivateLink / VPC endpoints</b> to reach AWS services privately. <b>WAF + Shield</b> at the edge. Never leave SSH/RDP open to the world.</p>",
      azure:
        "<p><b>VNets</b> + <b>NSGs</b>, <b>Azure Firewall</b>, <b>Private Endpoints / Private Link</b>, Application Gateway <b>WAF</b>, and DDoS Protection. Just-in-time VM access for admin ports.</p>",
      gcp: "<p><b>VPC</b> + firewall rules and hierarchical firewall policies, <b>Private Google Access</b>, <b>Private Service Connect</b>, and <b>Cloud Armor</b> (WAF/DDoS). <b>VPC Service Controls</b> build a perimeter against data exfiltration.</p>",
    },
  },
  {
    tier: "associate",
    category: "Logging & Detection",
    certs: ALL_CERTS,
    title: "Audit logging and threat detection",
    concept:
      "<p>Turn on <b>control-plane</b> (API) audit logging and, where it matters, <b>data-plane</b> logging; centralise it; then layer threat detection on top. You cannot investigate what you never logged — and the first thing an attacker often does is try to disable or delete logs.</p>",
    providers: {
      aws: "<p><b>CloudTrail</b> for API audit — enable org-wide, multi-region, with log-file validation. <b>GuardDuty</b> (threat detection), <b>Security Hub</b> (findings aggregation), <b>VPC Flow Logs</b>, CloudWatch.</p>",
      azure:
        "<p><b>Activity Log</b> + resource/diagnostic logs into <b>Log Analytics</b>. <b>Microsoft Defender for Cloud</b> (CSPM/CWPP) and <b>Microsoft Sentinel</b> (SIEM). Entra sign-in and audit logs for identity.</p>",
      gcp: "<p><b>Cloud Audit Logs</b> (Admin Activity is always on; enable Data Access). <b>Security Command Center</b> for findings/threats, <b>Chronicle</b> SIEM, and VPC Flow Logs.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Posture Management",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Cloud Security Posture Management (CSPM)",
    concept:
      "<p>Continuously scan your cloud configuration against benchmarks (like the <b>CIS Benchmarks</b>) to catch misconfigurations — public storage, open ports, unencrypted data, over-privileged identities — and to detect drift from a known-good state.</p><p>CSPM answers 'is anything misconfigured right now?' across hundreds of accounts, which no human can check by hand.</p>",
    providers: {
      aws: "<p><b>Security Hub</b> (CIS/AWS Foundational standards) + <b>AWS Config</b> rules and conformance packs for drift and compliance.</p>",
      azure:
        "<p><b>Defender for Cloud</b> — secure score plus the regulatory compliance dashboard mapped to CIS/PCI/ISO.</p>",
      gcp: "<p><b>Security Command Center Premium</b> (Security Health Analytics) plus <b>Org Policy</b> for preventive guardrails.</p>",
    },
  },
  {
    tier: "architect",
    category: "Compliance & Governance",
    certs: ALL_CERTS,
    title: "Governance guardrails and policy-as-code",
    concept:
      "<p>Enforce guardrails <b>centrally</b> so individual accounts/projects can't drift out of policy — deny risky actions, require encryption or tags, restrict regions. Codify controls instead of relying on manual review, and prefer <b>preventive</b> guardrails (block it) over purely <b>detective</b> ones (alert after).</p>",
    providers: {
      aws: "<p><b>Organizations + SCPs</b> (preventive), <b>Control Tower</b> (landing zone/guardrails), and <b>Config</b> (detective). Tag policies enforce tagging.</p>",
      azure:
        "<p><b>Management Groups + Azure Policy</b> (deny / audit / deployIfNotExists), Blueprints, and Landing Zones.</p>",
      gcp: "<p>Resource hierarchy (Org → Folder → Project) + <b>Organization Policy Service</b> constraints, and <b>Assured Workloads</b> for regulated data.</p>",
    },
  },
  {
    tier: "associate",
    category: "DevSecOps & IaC",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Secrets management — no hardcoded credentials",
    concept:
      "<p>Never hardcode credentials in code, container images, or IaC. Use a <b>secrets store</b> and short-lived, workload-bound identities, and <b>scan</b> repos and images for leaked secrets before they ship.</p><p>Leaked keys in a public repo get found by automated scrapers in minutes — this is one of the most common real cloud incidents.</p>",
    providers: {
      aws: "<p><b>Secrets Manager</b> (with rotation) or SSM Parameter Store; <b>IAM roles</b> for EC2/Lambda/ECS so no key is stored; git-secrets and Access Analyzer to catch leaks.</p>",
      azure:
        "<p><b>Key Vault + Managed Identity</b> so apps hold no secret; keep secrets out of App Settings; Defender for DevOps scans repos/pipelines.</p>",
      gcp: "<p><b>Secret Manager + Workload Identity</b>; avoid service-account keys entirely; enable Secret Manager rotation.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Container and Kubernetes security basics",
    concept:
      "<p>Secure four layers: the <b>image</b> (scan, minimal base, don't run as root), the <b>registry</b>, the <b>cluster</b> (RBAC, network policy, no privileged pods), and the <b>runtime</b> (admission control, runtime threat detection). Give each pod its own least-privilege cloud identity rather than sharing the node's.</p>",
    providers: {
      aws: "<p><b>EKS</b>: IRSA (IAM Roles for Service Accounts) for pod identity, ECR image scanning, security groups for pods, and GuardDuty EKS Protection.</p>",
      azure:
        "<p><b>AKS</b>: Entra + Azure RBAC, <b>Defender for Containers</b>, Azure Policy for AKS, and private clusters.</p>",
      gcp: "<p><b>GKE</b>: Workload Identity, <b>Binary Authorization</b>, Autopilot hardening, Shielded/Confidential nodes, and SCC container findings.</p>",
    },
  },
  {
    tier: "engineer",
    category: "IAM & Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Instance metadata and the SSRF credential-theft path",
    concept:
      "<p>Cloud VMs expose an <b>instance metadata endpoint</b> (<code>169.254.169.254</code>) that hands out the instance's temporary credentials. If your app has a <b>Server-Side Request Forgery (SSRF)</b> bug, an attacker can make the app fetch those credentials — a top cloud attack path (famously behind the 2019 Capital One breach). Enforce the hardened metadata mode and keep the instance's role least-privilege.</p>",
    providers: {
      aws: "<p>Enforce <b>IMDSv2</b> (session-token required) and block IMDSv1 — this alone defeats most SSRF credential theft. Keep the instance profile scoped tightly.</p>",
      azure:
        "<p>Azure <b>IMDS</b> requires the <code>Metadata:true</code> header, which blocks trivial SSRF; still keep the Managed Identity least-privilege.</p>",
      gcp: "<p>The GCP metadata server requires the <code>Metadata-Flavor: Google</code> header; disable legacy/v1 metadata endpoints that don't.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Incident Response",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    title: "Incident response in the cloud",
    concept:
      "<p>Cloud IR is different from on-prem: <b>identities and API keys are the perimeter</b>, containment is done through the <b>API</b> (isolate, rotate, revoke), and your evidence lives in <b>logs and snapshots</b>, not a disk you can pull. Preparation = audit logging on, a break-glass account, and runbooks — because you can't collect evidence you never enabled.</p>",
    providers: {
      aws: "<p>Isolate by swapping the security group, <b>revoke IAM sessions</b> (revoke-older-than), and snapshot the EBS volume. CloudTrail is your timeline; use a separate forensics account for detonation.</p>",
      azure:
        "<p>Isolate via NSG, <b>revoke Entra sessions/tokens</b>, snapshot the disk. Sentinel builds the timeline; Defender for Cloud playbooks (SOAR) automate response.</p>",
      gcp: "<p>Isolate with firewall rules, <b>disable/rotate service-account keys</b>, snapshot the disk. Cloud Audit Logs + Chronicle reconstruct the timeline.</p>",
    },
  },

  /* ---------------- Shared Responsibility ---------------- */
  {
    tier: "associate",
    category: "Shared Responsibility",
    certs: ALL_CERTS,
    title: "Service models — where the responsibility line moves",
    concept:
      "<p>How much you secure depends on the service model. With <b>IaaS</b> you own the OS, runtime, app, and data; with <b>PaaS</b> the provider runs the platform and you own the app config, data, and identity; with <b>SaaS</b> you mostly own identity, data, and sharing settings; with <b>serverless</b> you own the code, its IAM role, and the event triggers.</p><p>Identity and data are <b>always yours</b>, in every model. The first step in securing a service is knowing which model it is.</p>",
    providers: {
      aws: "<p>EC2 (IaaS) → RDS / Elastic Beanstalk (PaaS) → Lambda (serverless). The more AWS manages, the less patching is yours — but IAM and data always are.</p>",
      azure:
        "<p>Virtual Machines (IaaS) → App Service / Azure SQL (PaaS) → Functions (serverless) → M365 (SaaS). Entra identity and data stay with you throughout.</p>",
      gcp: "<p>Compute Engine (IaaS) → Cloud SQL / App Engine (PaaS) → Cloud Functions / Cloud Run (serverless). Cloud IAM and data are always your responsibility.</p>",
    },
  },

  /* ---------------- IAM & Identity ---------------- */
  {
    tier: "associate",
    category: "IAM & Identity",
    certs: ALL_CERTS,
    title: "Protecting the root / global-admin account",
    concept:
      "<p>The top-level account can do <b>anything</b> and bypass most guardrails — a compromise is game over. Lock it away: hardware MFA, no daily use, no long-lived access keys, and an alert on any sign-in.</p>",
    providers: {
      aws: "<p><b>Root user</b> — attach hardware MFA, delete any root access keys, never use it for daily work, and alert on root sign-in via CloudTrail.</p>",
      azure:
        "<p><b>Global Administrator / root-scope Owner</b> — keep the count tiny, gate with PIM, and keep a monitored break-glass account outside Conditional Access.</p>",
      gcp: "<p><b>Organization Admin / super admin</b> — hardware security keys, minimal count, and separate from any daily-use account.</p>",
    },
  },
  {
    tier: "associate",
    category: "IAM & Identity",
    certs: ALL_CERTS,
    title: "MFA and phishing-resistant authentication",
    concept:
      "<p>Passwords alone fail; require <b>MFA everywhere</b>. For privileged users, prefer <b>phishing-resistant</b> methods (FIDO2 / passkeys), because push approvals and one-time codes can be phished or worn down by MFA-fatigue bombing.</p>",
    providers: {
      aws: "<p>Require MFA on all identities via IAM Identity Center; hardware FIDO2 keys for administrators.</p>",
      azure:
        "<p>Conditional Access enforcing MFA, Authenticator <b>number-matching</b>, and FIDO2 / passkeys for privileged roles.</p>",
      gcp: "<p>Enforce 2-Step Verification org-wide, Titan / FIDO2 keys for admins, and context-aware access.</p>",
    },
  },
  {
    tier: "engineer",
    category: "IAM & Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "IAM privilege-escalation paths",
    concept:
      "<p>Even without admin, some permissions let an identity <b>grant itself more</b> — attaching policies, passing a privileged role to a service it controls, editing a function's role, or creating credentials for another identity. Hunt for these 'toxic combinations', not just for the admin role.</p>",
    providers: {
      aws: "<p><code>iam:PassRole</code> + a service that assumes it (Lambda/EC2), <code>iam:CreatePolicyVersion</code>, <code>iam:AttachUserPolicy</code>, and <code>sts:AssumeRole</code> chains. Map them with Access Analyzer or PMapper.</p>",
      azure:
        "<p><b>Owner</b> and <b>User Access Administrator</b> can grant roles; watch Managed Identity abuse and custom roles holding <code>Microsoft.Authorization/*</code>.</p>",
      gcp: "<p><code>iam.serviceAccounts.actAs</code> + deploy, <code>setIamPolicy</code> on a project, and service-account impersonation chains. Use Policy Analyzer / IAM Recommender.</p>",
    },
  },
  {
    tier: "engineer",
    category: "IAM & Identity",
    certs: ALL_CERTS,
    title: "Workload identity — credentials for machines",
    concept:
      "<p>Apps and pipelines need cloud access too. Give each <b>workload its own short-lived, auto-rotated identity</b> bound to that workload — never a static key baked into code, an image, or an environment variable.</p>",
    providers: {
      aws: "<p>IAM roles for EC2/Lambda/ECS (instance profiles) and <b>IRSA</b> (IAM Roles for Service Accounts) for EKS pods.</p>",
      azure:
        "<p><b>Managed Identities</b> (system- or user-assigned) for App Service/VM/AKS, and workload identity federation for external CI.</p>",
      gcp: "<p>Service accounts attached to resources + <b>Workload Identity</b> for GKE, and Workload Identity Federation for GitHub Actions and other external CI.</p>",
    },
  },
  {
    tier: "engineer",
    category: "IAM & Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Cross-account and cross-tenant access",
    concept:
      "<p>Share access between accounts with <b>roles and resource policies scoped by a condition</b> (like an external ID) — never shared static keys. An over-broad trust policy that allows any principal is a common finding and a ready-made lateral-movement path.</p>",
    providers: {
      aws: "<p>Cross-account IAM roles with <code>sts:ExternalId</code>, and resource policies (S3 bucket policy, KMS key policy). Never leave <code>Principal: *</code>.</p>",
      azure:
        "<p>Cross-tenant via Entra <b>B2B</b> or <b>Lighthouse</b> (delegated) — audit every delegated MSP/partner grant.</p>",
      gcp: "<p>Grant roles to members in another org/project sparingly, and use <b>VPC Service Controls</b> to stop cross-perimeter data access.</p>",
    },
  },

  /* ---------------- Network Security ---------------- */
  {
    tier: "associate",
    category: "Network Security",
    certs: ALL_CERTS,
    title: "Finding and closing public exposure",
    concept:
      "<p>The first question in any cloud review: <b>what is reachable from the internet?</b> Public IPs, security groups open on admin or database ports, public storage, and public disk snapshots/images. Inventory it, then close it.</p>",
    providers: {
      aws: "<p>Security Hub + Access Analyzer for public S3 and EBS snapshots; check security groups for <code>0.0.0.0/0</code> on 22/3389/DB ports.</p>",
      azure:
        "<p>Defender for Cloud exposure findings, NSG rules with an <i>Any</i> source, and public blob containers.</p>",
      gcp: "<p>SCC public-resource findings, firewall rules open to <code>0.0.0.0/0</code>, and public buckets or external IPs.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Network Security",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Private connectivity to managed services",
    concept:
      "<p>Reach managed services over the provider's <b>private backbone</b> instead of the public internet, so traffic never leaves the private network and you can block the public endpoint entirely.</p>",
    providers: {
      aws: "<p><b>VPC endpoints</b> — Gateway endpoints for S3/DynamoDB, Interface endpoints (PrivateLink) for the rest.</p>",
      azure: "<p><b>Private Endpoints / Private Link</b>, and service endpoints for supported services.</p>",
      gcp: "<p><b>Private Google Access</b> and <b>Private Service Connect</b>.</p>",
    },
  },
  {
    tier: "architect",
    category: "Network Security",
    certs: ALL_CERTS,
    title: "Preventing data exfiltration",
    concept:
      "<p>Even with private networking, a compromised workload can copy data out to attacker-controlled storage. Build a <b>data perimeter</b> and control egress so an identity can only reach approved resources — not any bucket on the internet.</p>",
    providers: {
      aws: "<p>SCPs + VPC endpoint policies to pin access to your own resources, plus Network Firewall for egress control.</p>",
      azure:
        "<p>Azure Firewall egress rules, Private Link, and the storage-account firewall.</p>",
      gcp: "<p><b>VPC Service Controls</b> service perimeters — the strongest native control against data exfiltration.</p>",
    },
  },

  /* ---------------- Data Protection ---------------- */
  {
    tier: "associate",
    category: "Data Protection",
    certs: ALL_CERTS,
    title: "Data classification and storage security",
    concept:
      "<p>Know what data you hold and where it lives — the classic cloud breach is sensitive data in a world-readable bucket. Classify it, restrict access, <b>block public access at the account level</b>, and scan for sensitive data you didn't know was there.</p>",
    providers: {
      aws: "<p><b>S3 Block Public Access</b> (account-wide), <b>Macie</b> for PII discovery, and least-privilege bucket policies.</p>",
      azure:
        "<p>Storage account 'disallow public access', <b>Purview</b> for classification, and private endpoints.</p>",
      gcp: "<p>Uniform bucket-level access + <b>public access prevention</b>, and Sensitive Data Protection (DLP) for discovery.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Data Protection",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Encryption in transit and certificate management",
    concept:
      "<p>Encrypt data <b>in transit</b> with TLS everywhere — between clients, services, and even inside the network. Manage certificates centrally with automatic renewal so nothing expires silently or falls back to plaintext.</p>",
    providers: {
      aws: "<p><b>ACM</b> for certificates (auto-renew), TLS on load balancers/CloudFront, and enforce HTTPS via policy.</p>",
      azure:
        "<p>App Service / Front Door managed certificates, Key Vault-backed certs, and TLS enforcement.</p>",
      gcp: "<p><b>Google-managed SSL certificates</b> on load balancers, and Certificate Manager.</p>",
    },
  },
  {
    tier: "architect",
    category: "Data Protection",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    title: "Key lifecycle — rotation, BYOK and HYOK",
    concept:
      "<p>Owning the key means owning the data's fate: rotate keys on a schedule, and for the highest assurance bring your own key (<b>BYOK</b>) or hold your own key externally (<b>HYOK</b>) so the provider can never decrypt without you. Disabling a key instantly revokes access to everything it protects.</p>",
    providers: {
      aws: "<p>KMS automatic key rotation, imported key material (BYOK), and External Key Store (XKS) for keys you host.</p>",
      azure:
        "<p>Key Vault / Managed HSM rotation, BYOK import, and Azure Key Vault-managed HSM for FIPS 140-2 L3.</p>",
      gcp: "<p>Cloud KMS rotation schedules, and <b>External Key Manager (EKM)</b> to keep keys outside Google entirely.</p>",
    },
  },

  /* ---------------- Compute & Workload ---------------- */
  {
    tier: "associate",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "VM hardening and patch management",
    concept:
      "<p>IaaS VMs are yours to patch and harden — start from a golden image, remove unneeded services, run a host firewall, and automate patching. An unpatched internet-facing VM is one of the most common ways attackers get their first foothold.</p>",
    providers: {
      aws: "<p>Systems Manager <b>Patch Manager</b>, hardened AMIs, and Inspector for vulnerability scanning.</p>",
      azure:
        "<p><b>Update Manager</b>, an image gallery for golden images, and Defender vulnerability assessment.</p>",
      gcp: "<p><b>OS Config</b> patch management, hardened images, and VM Manager.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Serverless security",
    concept:
      "<p>Serverless shrinks the OS attack surface but shifts risk to your <b>code, dependencies, IAM role, and event sources</b>. Least-privilege the function's role, validate event input, watch third-party packages, and remember that anyone who can invoke the function runs your code.</p>",
    providers: {
      aws: "<p>Least-privilege the <b>Lambda execution role</b>, use resource policies to control who can invoke, and scan layers/dependencies.</p>",
      azure:
        "<p>Functions with a least-privilege Managed Identity, strict input validation, and Defender coverage.</p>",
      gcp: "<p>A per-function service account for Cloud Functions / Cloud Run, ingress controls, and Binary Authorization for Run.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    title: "Image and supply-chain security",
    concept:
      "<p>A container image and its dependencies are code you're choosing to trust. <b>Scan</b> for vulnerabilities and secrets, use minimal <b>signed</b> base images, and enforce at admission that only trusted, attested images can deploy.</p>",
    providers: {
      aws: "<p>ECR image scanning, image signing, and EKS admission control (e.g. Kyverno).</p>",
      azure: "<p>ACR + Defender for Containers scanning and image signing.</p>",
      gcp: "<p>Artifact Registry scanning + <b>Binary Authorization</b> with attestations.</p>",
    },
  },

  /* ---------------- Logging & Detection ---------------- */
  {
    tier: "engineer",
    category: "Logging & Detection",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Managed cloud threat detection",
    concept:
      "<p>Beyond raw audit logs, each cloud has a <b>managed threat-detection service</b> that flags anomalies — unusual API calls, credential exfiltration, crypto-mining, known-bad IPs. Turn it on org-wide and route findings into your response workflow.</p>",
    providers: {
      aws: "<p><b>GuardDuty</b> (with EKS/Lambda/S3/Malware protection) feeding Security Hub.</p>",
      azure:
        "<p><b>Microsoft Defender for Cloud</b> plans, with Sentinel for SIEM/SOAR.</p>",
      gcp: "<p><b>Security Command Center</b> (Event Threat Detection) and Chronicle.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Logging & Detection",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    title: "Log integrity and centralization",
    concept:
      "<p>Attackers delete logs, so protect them: centralize to a <b>separate, locked-down account/project</b>, make them tamper-evident or immutable, and alert the moment logging is disabled or a log store is touched.</p>",
    providers: {
      aws: "<p>CloudTrail to a dedicated log-archive account, log-file validation, and S3 <b>Object Lock</b>.</p>",
      azure:
        "<p>Diagnostic settings to a central Log Analytics workspace / immutable storage, with alerts on log deletion.</p>",
      gcp: "<p>Aggregated <b>log sinks</b> to a locked project/bucket with retention locks.</p>",
    },
  },

  /* ---------------- Posture Management ---------------- */
  {
    tier: "associate",
    category: "Posture Management",
    certs: ALL_CERTS,
    title: "CIS Benchmarks and compliance scanning",
    concept:
      "<p>The <b>CIS Benchmarks</b> are the de-facto secure-configuration baseline for each cloud. Posture tools score you against them continuously, so you measure and close gaps instead of guessing whether you're configured correctly.</p>",
    providers: {
      aws: "<p>Security Hub CIS standard and Config conformance packs.</p>",
      azure: "<p>Defender for Cloud regulatory-compliance dashboard (CIS).</p>",
      gcp: "<p>SCC + Security Health Analytics mapped to CIS.</p>",
    },
  },
  {
    tier: "architect",
    category: "Posture Management",
    certs: ALL_CERTS,
    title: "The CNAPP / CWPP / CIEM landscape",
    concept:
      "<p>Cloud security tools are converging. <b>CSPM</b> checks configuration, <b>CWPP</b> protects running workloads, <b>CIEM</b> analyses identities and entitlements, plus IaC and container scanning — a <b>CNAPP</b> unifies them into one platform. Know the acronyms and the problem each one solves.</p>",
    providers: {
      aws: "<p>Native building blocks: Security Hub + GuardDuty + Inspector; or a third-party CNAPP spanning all accounts.</p>",
      azure:
        "<p><b>Defender for Cloud</b> is Microsoft's CNAPP — CSPM + CWPP + CIEM in one.</p>",
      gcp: "<p><b>Security Command Center Enterprise</b> is Google's CNAPP direction.</p>",
    },
  },

  /* ---------------- Compliance & Governance ---------------- */
  {
    tier: "architect",
    category: "Compliance & Governance",
    certs: ALL_CERTS,
    title: "Landing zones and multi-account strategy",
    concept:
      "<p>Don't put everything in one account. Use <b>many accounts/subscriptions/projects</b> to isolate blast radius, organised in a hierarchy with guardrails applied centrally. A 'landing zone' is the pre-secured, ready-to-use starting template for new environments.</p>",
    providers: {
      aws: "<p>AWS Organizations + <b>Control Tower</b> landing zone; OUs with SCPs.</p>",
      azure:
        "<p>Management-group hierarchy + <b>Azure Landing Zones</b> (Cloud Adoption Framework).</p>",
      gcp: "<p>Org → Folders → Projects hierarchy + the <b>security foundations</b> blueprint.</p>",
    },
  },
  {
    tier: "architect",
    category: "Compliance & Governance",
    certs: ["ccsp", "aws-scs", "az-500", "gcp-pcse"],
    title: "Mapping controls to compliance frameworks",
    concept:
      "<p>Regulated orgs must map their controls to frameworks (<b>SOC 2, ISO 27001, PCI DSS, HIPAA, FedRAMP</b>) and produce evidence. Use the provider's compliance offerings and audit artifacts, and remember shared responsibility applies control-by-control.</p>",
    providers: {
      aws: "<p><b>Artifact</b> (audit reports), Config compliance, and Audit Manager.</p>",
      azure:
        "<p>Service Trust Portal, Defender regulatory compliance, and Purview Compliance Manager.</p>",
      gcp: "<p>Compliance Reports Manager, <b>Assured Workloads</b>, and SCC compliance.</p>",
    },
  },

  /* ---------------- DevSecOps & IaC ---------------- */
  {
    tier: "engineer",
    category: "DevSecOps & IaC",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Infrastructure-as-Code security scanning",
    concept:
      "<p>Catch misconfigurations <b>before deploy</b> by scanning Terraform / CloudFormation / ARM / Bicep in the pipeline — a public bucket blocked in code never reaches production. This is 'shift left': fix it where it's cheapest.</p>",
    providers: {
      aws: "<p><b>cfn-guard</b> and CloudFormation hooks; third-party scanners like Checkov, tfsec, Trivy.</p>",
      azure:
        "<p>ARM/Bicep with <b>Defender for DevOps</b> and PSRule; Checkov.</p>",
      gcp: "<p>Terraform validator / policy library; Checkov.</p>",
    },
  },
  {
    tier: "engineer",
    category: "DevSecOps & IaC",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    title: "CI/CD pipeline and supply-chain security",
    concept:
      "<p>The pipeline holds powerful cloud credentials and ships your artifacts, so it's a prime target. Use <b>short-lived OIDC credentials</b> (no stored keys), least-privilege deploy roles, signed artifacts, and build provenance (SLSA).</p>",
    providers: {
      aws: "<p>GitHub <b>OIDC → IAM role</b> (no long-lived keys), least-privilege CodePipeline, and signed artifacts.</p>",
      azure:
        "<p>Workload identity federation for pipelines and Defender for DevOps.</p>",
      gcp: "<p>Workload Identity Federation for CI, Binary Authorization, and SLSA provenance.</p>",
    },
  },
  {
    tier: "engineer",
    category: "DevSecOps & IaC",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Policy-as-code",
    concept:
      "<p>Express security rules as <b>code</b> that automatically gates deploys and cloud changes — consistent, testable, and versioned. It complements the provider's built-in guardrails with your own custom organisational rules.</p>",
    providers: {
      aws: "<p>SCPs + Config rules (Guard); OPA/Conftest in pipelines.</p>",
      azure:
        "<p><b>Azure Policy</b> (deny/audit) plus OPA <b>Gatekeeper</b> for AKS.</p>",
      gcp: "<p>Org Policy constraints + OPA Gatekeeper; Config Validator.</p>",
    },
  },

  /* ---------------- Incident Response ---------------- */
  {
    tier: "architect",
    category: "Incident Response",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    title: "Cloud forensics and evidence acquisition",
    concept:
      "<p>Cloud forensics means collecting <b>snapshots, memory captures, and logs via API</b> into an isolated forensics account, preserving chain of custody. You can't image a disk you don't physically own, so automate acquisition <i>before</i> containment destroys the evidence.</p>",
    providers: {
      aws: "<p>Automated EBS snapshot + memory capture into a dedicated forensics account; CloudTrail and VPC Flow Logs as the timeline.</p>",
      azure:
        "<p>Disk snapshot + capture into a dedicated forensics subscription; Sentinel builds the timeline.</p>",
      gcp: "<p>Disk snapshot into a forensics project; Cloud Audit Logs + Chronicle reconstruct events.</p>",
    },
  },
  {
    tier: "engineer",
    category: "Incident Response",
    certs: ALL_CERTS,
    title: "Backup, resilience and ransomware readiness",
    concept:
      "<p>An attacker with the right permissions can encrypt or delete your cloud data. Keep <b>immutable, isolated backups</b>, separate the backup identity from production, enable versioning/soft-delete, and actually test restores — an untested backup is a hope, not a control.</p>",
    providers: {
      aws: "<p>AWS Backup with <b>Vault Lock</b> (immutable), S3 versioning + MFA delete, in a separate account.</p>",
      azure:
        "<p>Azure Backup with <b>immutable vaults</b> + soft delete, under separate RBAC.</p>",
      gcp: "<p>Backup and DR, bucket versioning + retention lock, in a separate project.</p>",
    },
  },
];

export const ROLES: Role[] = [
  {
    tier: "associate",
    title: "Cloud Security Analyst / Associate",
    range: "Entry · 0–2 yrs · posture, monitoring, hygiene",
    items: [
      "<b>Review cloud posture</b> — triage CSPM/Security Hub/Defender findings and misconfigurations.",
      "<b>Monitor cloud logs and alerts</b> (CloudTrail, Activity Log, Audit Logs) and escalate real issues.",
      "<b>Enforce baseline hygiene</b> — public storage, open security groups, unencrypted volumes, missing MFA.",
      "<b>Run access reviews</b> — flag unused IAM users, stale keys, over-broad roles.",
      "<b>Follow runbooks</b> for common findings; open tickets with clear remediation steps.",
      "<b>Document</b> exceptions and track remediation to closure.",
    ],
    kpi: "MEASURED ON: FINDING TRIAGE · TIME-TO-REMEDIATE · POSTURE SCORE · FALSE-POSITIVE RATE",
  },
  {
    tier: "engineer",
    title: "Cloud Security Engineer",
    range: "Mid · 2–5 yrs · builds and automates controls",
    items: [
      "<b>Build and automate guardrails</b> — SCPs / Azure Policy / Org Policy, Config/Policy-as-code.",
      "<b>Secure IAM at scale</b> — federation/SSO, permission boundaries, break-glass, key elimination.",
      "<b>Engineer detections</b> — GuardDuty/Defender/SCC tuning, custom SIEM rules, IaC and image scanning.",
      "<b>Harden workloads</b> — VM/container/Kubernetes baselines, secrets management, network segmentation.",
      "<b>Lead cloud incident response</b> — contain via API, collect logs/snapshots, eradicate, report.",
      "<b>Embed security in CI/CD</b> — IaC scanning, supply-chain checks, secret detection in pipelines.",
      "<b>Mentor associates</b> and improve runbooks from real incidents.",
    ],
    kpi: "MEASURED ON: CONTROL COVERAGE · MTTR · DETECTION EFFICACY · AUTOMATION IMPACT",
  },
  {
    tier: "architect",
    title: "Cloud Security Architect / Lead",
    range: "Senior · 5+ yrs · design, governance, strategy",
    items: [
      "<b>Design secure-by-default architectures</b> — landing zones, multi-account/subscription strategy, network topology.",
      "<b>Own the guardrail and governance model</b> across the org (preventive first, detective second).",
      "<b>Threat-model</b> new platforms and services; define security requirements and reference patterns.",
      "<b>Set the identity strategy</b> — central IdP, least-privilege model, workload identity, JIT elevation.",
      "<b>Drive compliance</b> — map controls to CIS / SOC 2 / ISO 27001 / PCI and evidence them.",
      "<b>Lead major cloud incidents</b> and post-incident architecture changes.",
      "<b>Advise leadership</b> — risk, cloud security roadmap, build-vs-buy for CNAPP/tooling, cost/coverage balance.",
    ],
    kpi: "MEASURED ON: ARCHITECTURE RISK · GUARDRAIL COVERAGE · COMPLIANCE POSTURE · MATURITY",
  },
];

export type Severity = "high" | "med" | "low";

/**
 * A real-world cloud incident told as a STAR answer. `plain` is the beginner
 * "what actually happened" summary shown before the technical breakdown;
 * `provider` is the cloud it happened on, so the provider filter applies.
 */
export interface Scenario {
  id: number;
  tier: Tier;
  provider: Provider;
  category: string;
  severity: Severity;
  certs: Cert[];
  title: string;
  plain: string;
  situation: string;
  task: string;
  actions: string[];
  result: string;
  lessons: string[];
  attack: string[];
  followUp: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    tier: "associate",
    provider: "aws",
    category: "Identity & Keys",
    severity: "high",
    certs: ["aws-scs", "ccsp"],
    title: "Access key leaked in a public GitHub repo → crypto-mining",
    plain:
      "<p>A developer accidentally pushed an AWS access key to a public GitHub repo. Bots scan GitHub constantly, so within minutes an attacker had the key and started spinning up expensive GPU servers to mine cryptocurrency. The team killed the key, deleted what the attacker created, and learned that <b>deleting the commit is not enough — the key must be rotated</b>.</p>",
    situation:
      "GuardDuty raised <b>UnauthorizedAccess:IAMUser/MaliciousIPCaller</b> plus a billing spike alert. API calls were coming from a region we never use, 9 minutes after a public commit.",
    task: "Contain immediately — leaked keys are found by automated scrapers in minutes — then determine everything the key touched.",
    actions: [
      "Deactivated the access key within 4 minutes of the alert (deactivate first, investigate second — the key is still live while you read logs).",
      "CloudTrail showed the attacker ran <code>GetCallerIdentity</code>, then <code>DescribeRegions</code>, then launched <b>p3 GPU instances</b> in three unused regions.",
      "They also called <b>CreateUser</b> and <b>CreateAccessKey</b> to plant a second identity for persistence — the mining was noisy cover.",
      "Confirmed the key was in the repo's <b>git history</b>, not just the latest commit — the developer had 'fixed' it by deleting the file.",
      "Checked whether the key could reach data: it had <code>s3:*</code>, so we reviewed S3 data-events for reads in the window.",
    ],
    result:
      "Key deactivated in 4 minutes, attacker IAM user and keys deleted, instances terminated, ~$6k of compute stopped before it grew. No data access was found. Rotated everything the key could reach and purged the git history.",
    lessons: [
      "<b>Rotating the key is mandatory; deleting the commit is not sufficient</b> — the secret lives in git history and in the scraper's database forever.",
      "Always look for <b>persistence</b> after a key leak — the mining is often a decoy for a second identity.",
      "Moved developers onto short-lived IAM Identity Center credentials and enabled secret scanning with push protection on every repo.",
    ],
    attack: ["T1552.001", "T1078.004", "T1496", "T1136.003"],
    followUp: "The key is deactivated. Why is the incident not over?",
  },
  {
    id: 2,
    tier: "engineer",
    provider: "aws",
    category: "Identity & Keys",
    severity: "high",
    certs: ["aws-scs"],
    title: "SSRF on EC2 → IMDSv1 credential theft → S3 access",
    plain:
      "<p>A web app had a bug that let an attacker make the <b>server</b> fetch any URL. They pointed it at the special internal address that hands out the server's own cloud credentials, stole those credentials, and used them to read an S3 bucket. Turning on the hardened metadata mode (IMDSv2) would have blocked the whole chain.</p>",
    situation:
      "GuardDuty fired <b>UnauthorizedAccess:EC2/InstanceCredentialExfiltration</b> — the EC2 instance role's credentials were being used from an IP outside AWS.",
    task: "Prove how the role credentials left the instance, and scope what was read with them.",
    actions: [
      "ALB logs showed repeated requests to an image-preview endpoint with a URL parameter pointing at <code>169.254.169.254</code> — a classic <b>SSRF</b>.",
      "The instance still allowed <b>IMDSv1</b>, so a single GET returned the role's temporary credentials, no session token needed.",
      "CloudTrail confirmed those credentials were then used from an external IP for <code>s3:ListBucket</code> and <code>GetObject</code>.",
      "The instance role was far broader than the app needed — it had read access to buckets unrelated to the service.",
      "Checked whether the same SSRF pattern appeared in other services and whether any other instance still had IMDSv1 enabled.",
    ],
    result:
      "Patched the SSRF (allow-list of destinations), enforced <b>IMDSv2-required</b> fleet-wide, scoped the instance role to the one bucket it needed, and revoked the exposed session. Data read was limited to non-sensitive assets.",
    lessons: [
      "<b>Enforcing IMDSv2 breaks this attack chain by itself</b> — a session-token PUT is required, which SSRF usually cannot perform.",
      "The blast radius was set by the instance role, not the app bug — least privilege turned a breach into an inconvenience.",
      "Added a detection for instance-role credentials used from a non-AWS IP, which is the highest-fidelity signal for this attack.",
    ],
    attack: ["T1190", "T1552.005", "T1530"],
    followUp: "Which single control would you enforce estate-wide to stop this, and why does it work?",
  },
  {
    id: 3,
    tier: "associate",
    provider: "aws",
    category: "Data Exposure",
    severity: "high",
    certs: ["aws-scs", "ccsp"],
    title: "Public S3 bucket with customer PII reported externally",
    plain:
      "<p>An outside security researcher emailed to say one of our storage buckets was readable by anyone on the internet — and it held customer data. We locked it immediately, then tried to work out how long it had been open and whether anyone had downloaded from it.</p>",
    situation:
      "A researcher reported a publicly readable bucket containing exported customer records. It had been created for a one-off migration two years earlier.",
    task: "Lock it down, then answer the question Legal will ask: was the data actually accessed?",
    actions: [
      "Applied a bucket policy denial and enabled <b>S3 Block Public Access</b>, then turned it on at the <b>account level</b> so it cannot recur.",
      "Reviewed CloudTrail: only management events were logged, so we could see the bucket ACL change but <b>not object reads</b>.",
      "Enabled S3 <b>data-plane logging</b> and server access logs — then had to state honestly that historic reads were unprovable.",
      "Used Macie to classify exactly what was in the bucket so the notification assessment was based on facts, not guesses.",
      "Swept every account for other public buckets and public EBS snapshots.",
    ],
    result:
      "Bucket locked in under an hour; Block Public Access enforced org-wide via SCP. Because we could not disprove access, Legal ran a breach-notification assessment — the expensive outcome of a missing log.",
    lessons: [
      "<b>Control-plane logging alone cannot answer 'was it read?'</b> — enable data-plane logging on sensitive stores before you need it.",
      "Preventive beats detective: an account-level Block Public Access plus an SCP means a future engineer cannot make a bucket public at all.",
      "'Temporary' migration buckets outlive their purpose — added lifecycle expiry and ownership tagging.",
    ],
    attack: ["T1530", "T1580"],
    followUp: "How would you prove whether the data was actually downloaded?",
  },
  {
    id: 4,
    tier: "engineer",
    provider: "aws",
    category: "IAM Privilege Escalation",
    severity: "high",
    certs: ["aws-scs"],
    title: "Privilege escalation via iam:PassRole and Lambda",
    plain:
      "<p>A user account with fairly ordinary permissions was able to make itself an administrator. It could create a Lambda function and <b>attach a powerful role to it</b> — so it created a function running as admin, and had that function do whatever it wanted. No admin permission was ever granted directly.</p>",
    situation:
      "A quarterly entitlement review flagged a CI user with <code>lambda:CreateFunction</code> and <code>iam:PassRole</code> — individually unremarkable, together an escalation path.",
    task: "Prove the path was exploitable, check whether it had been used, and remove it without breaking the pipeline.",
    actions: [
      "Reproduced it safely in a sandbox account: create a Lambda, <b>pass the privileged deployment role</b> to it, invoke it, and the function's code runs with that role's permissions.",
      "Searched CloudTrail for <code>CreateFunction</code> events where the passed role differed from the expected deploy role — no malicious use found.",
      "Mapped the account with an IAM path-analysis tool and found two more toxic combinations, including <code>iam:CreatePolicyVersion</code>.",
      "Constrained <code>iam:PassRole</code> with a condition limiting it to a specific role ARN and <code>iam:PassedToService</code>.",
      "Added a <b>permission boundary</b> so the CI identity can never exceed its intended ceiling.",
    ],
    result:
      "Escalation paths closed with no pipeline downtime, permission boundaries applied to all automation identities, and a scheduled IAM path analysis added so new toxic combinations get caught within a week.",
    lessons: [
      "<b>Privilege escalation is about combinations, not single permissions</b> — reviewing permissions one at a time misses it entirely.",
      "<code>iam:PassRole</code> without a resource condition is effectively 'become that role'.",
      "Permission boundaries are the durable fix; individual policy edits drift back over time.",
    ],
    attack: ["T1098.003", "T1078.004"],
    followUp: "Which two permissions would you hunt for first in an unfamiliar AWS account, and why?",
  },
  {
    id: 5,
    tier: "engineer",
    provider: "aws",
    category: "Logging & Evasion",
    severity: "med",
    certs: ["aws-scs"],
    title: "CloudTrail stopped in one region to hide activity",
    plain:
      "<p>An attacker turned off audit logging in a single, unused region before doing anything else — hoping nobody would notice a gap in a place we never look. The alert on 'logging was disabled' is what caught them.</p>",
    situation:
      "An EventBridge rule alerted on <code>StopLogging</code> for a trail in ap-southeast-2, a region with no workloads.",
    task: "Treat log tampering as an intrusion indicator, not an admin mistake — find out who and what followed.",
    actions: [
      "Because the trail was <b>organization-wide and multi-region</b>, the management account still captured events — the attacker only blinded a copy.",
      "Identified the calling identity: a developer role whose long-lived key had been leaked in a third-party breach.",
      "Reconstructed what happened after the log stop from the org trail: reconnaissance calls and an attempt to create an IAM user.",
      "Verified log-file integrity validation to prove no historical logs were altered.",
      "Rotated the credential, revoked sessions, and re-enabled the trail.",
    ],
    result:
      "The attacker got roughly 20 minutes of unlogged activity in an empty region and no further. Trails moved to an SCP that <b>denies StopLogging and DeleteTrail</b> for everyone except the security account.",
    lessons: [
      "<b>Disabling logs is an attack step</b> — alert on it at high severity, every time.",
      "An org-level trail delivering to a separate locked account means a compromised workload account cannot erase its own history.",
      "Log-file validation turns 'we think logs are intact' into something you can prove.",
    ],
    attack: ["T1562.008", "T1078.004"],
    followUp: "How do you make audit logs tamper-proof rather than just tamper-evident?",
  },
  {
    id: 6,
    tier: "engineer",
    provider: "aws",
    category: "Compute & Containers",
    severity: "high",
    certs: ["aws-scs"],
    title: "Crypto-mining in EKS after a container escape",
    plain:
      "<p>A vulnerable app running in Kubernetes let an attacker run commands inside a container. Because that container was allowed to run as <b>privileged</b>, they broke out onto the underlying server, stole its cloud identity, and started mining cryptocurrency across the cluster.</p>",
    situation:
      "GuardDuty EKS Protection flagged crypto-mining DNS lookups from worker nodes; node CPU was pinned at 100%.",
    task: "Determine whether the attacker was confined to the container or had reached the node and the cloud account.",
    actions: [
      "Traced entry to an exposed app endpoint with an RCE — the pod ran as <b>root with privileged: true</b> and a hostPath mount.",
      "That combination let them <b>escape to the host</b>, read the kubelet credentials, and query the node's instance metadata.",
      "The node role was over-broad (a shared role for all workloads), so the stolen identity could list several unrelated services.",
      "Killed the workload, cordoned and replaced the affected nodes rather than cleaning them, and rotated the node role.",
      "Reviewed the cluster for any other pod running privileged or with hostPath — found four.",
    ],
    result:
      "Mining stopped within the hour, nodes rebuilt from a clean AMI, and <b>Pod Security Standards</b> enforced to block privileged pods and hostPath mounts at admission. Moved pod identity to IRSA so no workload uses the node role.",
    lessons: [
      "<b>A container is not a security boundary when it runs privileged</b> — admission control is what actually enforces isolation.",
      "Per-pod cloud identity (IRSA) means a container compromise does not hand over the node's permissions.",
      "Crypto-mining is usually the visible symptom — always ask what else the access was used for.",
    ],
    attack: ["T1190", "T1611", "T1496", "T1552.005"],
    followUp: "Why is 'the app was patched' an incomplete answer here?",
  },
  {
    id: 7,
    tier: "architect",
    provider: "aws",
    category: "Ransomware & Resilience",
    severity: "high",
    certs: ["aws-scs", "ccsp"],
    title: "Ransomware attempt against S3 data and backups",
    plain:
      "<p>An attacker with stolen admin-level credentials tried to encrypt our data and <b>delete the backups first</b> so we could not recover. Immutable backups meant the deletions failed, and we restored without paying.</p>",
    situation:
      "Alerts fired on mass <code>DeleteObjectVersion</code> and <code>PutObject</code> calls with a customer-supplied key, plus attempted <code>DeleteBackupVault</code> calls.",
    task: "Act as incident commander: stop the destruction, protect recovery, then scope how they got admin.",
    actions: [
      "Revoked all sessions for the compromised role and applied a deny-all policy to it immediately.",
      "Confirmed <b>Backup Vault Lock</b> rejected every deletion attempt — the backups were immutable and could not be removed even by an admin.",
      "S3 <b>versioning plus MFA delete</b> meant the 'encrypted' objects were new versions; the originals were still there.",
      "Traced initial access to a stale IAM user key belonging to a departed contractor that was never deprovisioned.",
      "Ran the recovery into a rebuilt account, not the compromised one, and kept a timestamped decision log throughout.",
    ],
    result:
      "No ransom paid, no permanent data loss, ~3 hours of degraded service. The controls that saved us were configured a year earlier: vault lock, versioning, and separation of the backup identity.",
    lessons: [
      "<b>Immutability is the control that matters</b> — an attacker with admin can delete anything that is merely 'protected by permissions'.",
      "Backups must be under a separate identity and account from production, or one compromise takes both.",
      "Joiner-mover-leaver failures show up as cloud incidents months later — the contractor key was the root cause.",
    ],
    attack: ["T1078.004", "T1485", "T1486"],
    followUp: "Your attacker has full admin. Which of your controls still holds?",
  },
  {
    id: 8,
    tier: "engineer",
    provider: "aws",
    category: "IAM Privilege Escalation",
    severity: "med",
    certs: ["aws-scs"],
    title: "Cross-account role trusting any principal",
    plain:
      "<p>A role meant for one vendor was configured so that <b>anyone with any AWS account</b> could assume it. It was found in a review before anyone abused it — but it was effectively a public door into our account.</p>",
    situation:
      "IAM Access Analyzer flagged a role whose trust policy used <code>Principal: \"*\"</code> with no condition, created during a vendor integration.",
    task: "Assess exploitability, check for abuse, and fix the pattern rather than the single role.",
    actions: [
      "Confirmed the trust policy allowed <code>sts:AssumeRole</code> from any AWS principal — no external ID, no account restriction.",
      "The role carried read access to a data bucket, so successful assumption meant data exposure.",
      "Searched CloudTrail for <code>AssumeRole</code> events with an unexpected source account — none found, so no known abuse.",
      "Rewrote the trust to the vendor's account ID plus a unique <b>sts:ExternalId</b> condition.",
      "Added an Access Analyzer finding-to-ticket automation and an SCP blocking wildcard-principal trust policies.",
    ],
    result:
      "Closed before exploitation, pattern eliminated org-wide by policy, and third-party integrations now go through a reviewed template requiring an external ID.",
    lessons: [
      "<b>Third-party integration instructions are a common source of over-permissive trust</b> — vendors optimise for 'it works', not least privilege.",
      "The external ID exists specifically to prevent the confused-deputy problem; omitting it is not a formality.",
      "Access Analyzer is cheap and catches exactly this class of finding — wire it to tickets, not a dashboard nobody reads.",
    ],
    attack: ["T1078.004", "T1199"],
    followUp: "What is the confused-deputy problem, and how does an external ID solve it?",
  },
  {
    id: 9,
    tier: "engineer",
    provider: "azure",
    category: "Identity & Keys",
    severity: "high",
    certs: ["az-500"],
    title: "Compromised service principal with certificate persistence",
    plain:
      "<p>An app identity was doing strange things at 2am. The attacker had <b>added their own certificate</b> to it — a backdoor that a password reset would not remove, and that reimaging servers would not touch, because the backdoor lives in the cloud identity itself.</p>",
    situation:
      "Unusual Microsoft Graph activity from a service principal outside business hours, reading mailboxes it had never touched before.",
    task: "Investigate identity-based persistence that infrastructure rebuilds cannot fix.",
    actions: [
      "Entra audit logs showed <b>'Add service principal credential'</b> — the attacker uploaded their own certificate to an existing app registration.",
      "That credential let them request tokens as the app indefinitely, independent of any user password.",
      "The app had been granted <code>Mail.Read</code> application permission tenant-wide — far more than its function required.",
      "Removed the attacker certificate, then <b>audited every credential on every service principal</b> in the tenant and found two more unexplained.",
      "Reduced the app to least privilege and moved it to a workload identity with federated credentials.",
    ],
    result:
      "Backdoor removed, all service principal credentials inventoried and rotated, and alerting added on credential additions to any service principal — a low-volume, high-signal detection.",
    lessons: [
      "<b>Cloud identity persistence survives everything you rebuild</b> — always check app credentials, not just user accounts.",
      "Tenant-wide application permissions are a standing risk; they bypass per-user consent and conditional access.",
      "'Add credential' events should be alerted on, because legitimate ones are rare and planned.",
    ],
    attack: ["T1098.001", "T1550.001", "T1078.004"],
    followUp: "You reset every user password in the tenant. Why is the attacker still in?",
  },
  {
    id: 10,
    tier: "associate",
    provider: "azure",
    category: "Data Exposure",
    severity: "med",
    certs: ["az-500", "ccsp"],
    title: "Public blob container leaking internal documents",
    plain:
      "<p>A storage container had been set to public so a marketing tool could read one file — which also made every other file in it readable by anyone with the link.</p>",
    situation:
      "Defender for Cloud flagged a storage account permitting anonymous blob access; the container held internal documents alongside the intended public asset.",
    task: "Close the exposure without breaking the dependent tool, and determine what was exposed.",
    actions: [
      "Confirmed the container access level was <b>Blob (anonymous read)</b> — set 18 months earlier for one image.",
      "Storage analytics logging was off, so anonymous reads could not be enumerated historically.",
      "Moved the genuinely public asset to a dedicated CDN-fronted container, then set the original to private.",
      "Disabled <b>'Allow Blob anonymous access'</b> at the storage-account level and applied an Azure Policy denying it subscription-wide.",
      "Enabled diagnostic logging on all storage accounts going forward.",
    ],
    result:
      "Exposure closed the same day, the marketing tool kept working via a purpose-built public container, and the misconfiguration became impossible by policy.",
    lessons: [
      "<b>Public access is usually enabled for one legitimate file</b> — the fix is separation, not a blanket setting.",
      "Without data-plane logging you cannot scope the exposure, which forces conservative (expensive) assumptions.",
      "Deny-by-policy at the subscription level beats fixing accounts one at a time.",
    ],
    attack: ["T1530"],
    followUp: "The business needs one file public. How do you allow that safely?",
  },
  {
    id: 11,
    tier: "associate",
    provider: "azure",
    category: "Identity & Keys",
    severity: "high",
    certs: ["az-500"],
    title: "MFA fatigue → Entra account takeover → inbox rules",
    plain:
      "<p>The attacker already had the password and spammed the user with approval prompts until, at 3am, they tapped 'approve' to make it stop. Then they set up a hidden mail rule to quietly file away replies while they targeted our suppliers.</p>",
    situation:
      "Entra risk detection flagged an anomalous sign-in; the user had received 40+ MFA push notifications overnight and approved one.",
    task: "Confirm compromise, find what happened post-login, and stop supplier-facing damage.",
    actions: [
      "Sign-in logs showed dozens of failed MFA challenges then a success from a hosting-provider ASN — the classic <b>MFA fatigue</b> pattern.",
      "Unified audit log showed a <b>New-InboxRule</b> moving anything matching 'invoice' or 'payment' to a rarely-used folder, marked read.",
      "The attacker registered an <b>additional MFA method</b> to keep access after any password reset.",
      "Outbound mail to suppliers was already queued; message trace identified recipients for recall and warning.",
      "Revoked all refresh tokens — a password reset alone leaves existing sessions valid.",
    ],
    result:
      "Account recovered, attacker MFA method and inbox rule removed, suppliers warned before any payment was redirected. Rolled out <b>number matching</b> and moved finance and privileged roles to FIDO2.",
    lessons: [
      "<b>Having MFA is not the same as MFA being effective</b> — push approval is phishable and can be worn down.",
      "Always revoke tokens; the session outlives the password.",
      "MFA-method registration from a new location is one of the earliest reliable signals of takeover.",
    ],
    attack: ["T1621", "T1078.004", "T1098.001", "T1114.003"],
    followUp: "The user has MFA enabled. How did the attacker get in anyway?",
  },
  {
    id: 12,
    tier: "engineer",
    provider: "azure",
    category: "IAM Privilege Escalation",
    severity: "high",
    certs: ["az-500"],
    title: "Managed Identity abuse escalating to subscription Owner",
    plain:
      "<p>A compromised VM had an attached cloud identity that was allowed to <b>grant roles</b>. The attacker used the VM's own identity to make themselves Owner of the whole subscription.</p>",
    situation:
      "Defender for Cloud alerted on a role assignment created by a Managed Identity that had never performed one before.",
    task: "Establish how a workload identity gained the ability to escalate, and contain before it spread.",
    actions: [
      "The VM's system-assigned Managed Identity held <b>User Access Administrator</b> at subscription scope — granted during an automation project.",
      "That role can assign any role, so the attacker assigned <b>Owner</b> to a newly created service principal they controlled.",
      "Initial access was an unpatched internet-facing service on the VM; from there the metadata endpoint issued Managed Identity tokens.",
      "Removed the rogue assignments and the service principal, isolated the VM via NSG, and rebuilt it.",
      "Re-scoped the Managed Identity to a specific resource group with only the permissions its automation needed.",
    ],
    result:
      "Escalation reversed within the hour, subscription-scope role assignments audited across the tenant, and <b>PIM</b> introduced so standing Owner/UAA assignments no longer exist.",
    lessons: [
      "<b>A workload identity is as dangerous as the role attached to it</b> — a compromised VM inherits every permission you gave it.",
      "User Access Administrator is effectively Owner; treat it as such in reviews.",
      "Standing privileged assignments should be replaced with just-in-time elevation.",
    ],
    attack: ["T1078.004", "T1098.003", "T1552.005"],
    followUp: "Why is 'the VM was patched and rebuilt' not the end of this incident?",
  },
  {
    id: 13,
    tier: "associate",
    provider: "azure",
    category: "Network Exposure",
    severity: "high",
    certs: ["az-500"],
    title: "RDP open to the internet → brute force → lateral movement",
    plain:
      "<p>Someone opened remote-desktop access to the whole internet 'temporarily' for troubleshooting. Automated scanners found it within hours and guessed a weak local password.</p>",
    situation:
      "Defender alerted on a successful RDP sign-in after thousands of failures on a VM whose NSG allowed 3389 from <b>Any</b>.",
    task: "Contain the host, determine whether the attacker moved further, and remove the exposure class.",
    actions: [
      "Confirmed the NSG rule was added 3 days earlier with a 'temp' comment and never removed.",
      "Sign-in logs showed a sustained brute force from multiple IPs, then success against a local admin account with a reused password.",
      "Checked for lateral movement: the attacker enumerated the domain and attempted credential dumping, caught by Defender for Endpoint.",
      "Isolated the VM, snapshotted the disk for forensics, and rebuilt rather than cleaned.",
      "Removed all Any-source management rules across subscriptions and enabled <b>Just-in-Time VM access</b>.",
    ],
    result:
      "Contained within 90 minutes with no data access confirmed. Azure Policy now denies NSG rules exposing 3389/22 to the internet, so the 'temporary' fix is no longer possible.",
    lessons: [
      "<b>'Temporary' exposure becomes permanent</b> — the only reliable fix is a policy that refuses the change.",
      "Management ports should be reached via bastion or JIT, never a public NSG rule.",
      "Brute force succeeding means password hygiene failed too — treat both root causes.",
    ],
    attack: ["T1110", "T1078.004", "T1021.001"],
    followUp: "An engineer needs RDP to debug right now. What do you offer them instead?",
  },
  {
    id: 14,
    tier: "architect",
    provider: "azure",
    category: "Supply Chain",
    severity: "high",
    certs: ["az-500", "ccsp"],
    title: "MSP delegated access abused via Azure Lighthouse",
    plain:
      "<p>Our managed service provider was breached, and the attacker used the provider's <b>legitimate delegated access</b> to walk straight into our tenant. Nothing looked stolen — the access was real, it was just being used by the wrong people.</p>",
    situation:
      "Unusual activity arrived through an Azure Lighthouse delegation from a partner tenant, at hours the MSP does not work.",
    task: "Investigate an attacker operating with valid, expected credentials — where 'is this authorised?' is the whole question.",
    actions: [
      "Correlated Lighthouse-delegated operations against the MSP's documented change windows and ticket references — no matching tickets.",
      "The delegation granted <b>Contributor at subscription scope</b>, far beyond what the support contract required.",
      "Reviewed everything performed through the delegation across the full retention window, including reads.",
      "Suspended the Lighthouse delegation, then notified the MSP that they were compromised.",
      "Rebuilt the relationship with least-privilege, scoped, time-bound delegation and per-action approval.",
    ],
    result:
      "Access cut within hours, all delegated actions reviewed and credentials rotated on everything touched, and the MSP relationship re-established on a least-privilege model with monitoring.",
    lessons: [
      "<b>Your security posture includes your providers'</b> — delegated access is a supply-chain risk with a direct path to production.",
      "Delegated permissions drift toward convenience; they need the same reviews as internal roles.",
      "Baseline your partners' normal working hours and change process, or you cannot spot abuse of legitimate access.",
    ],
    attack: ["T1199", "T1078.004"],
    followUp: "How do you detect misuse of access that is supposed to be there?",
  },
  {
    id: 15,
    tier: "engineer",
    provider: "azure",
    category: "Compute & Containers",
    severity: "high",
    certs: ["az-500"],
    title: "AKS cluster compromise through a privileged pod",
    plain:
      "<p>A build agent running in Kubernetes was configured with far too much power. When it was compromised, the attacker used it to take over the cluster's control plane permissions.</p>",
    situation:
      "Defender for Containers alerted on suspicious <code>kubectl</code> activity from inside a pod — service-account enumeration and secret listing.",
    task: "Determine the blast radius of a pod compromise in a shared cluster.",
    actions: [
      "The build pod ran with a service account bound to <b>cluster-admin</b> — a shortcut taken to 'make the pipeline work'.",
      "With that token the attacker listed all namespace secrets, including database credentials for unrelated services.",
      "The pod also mounted the Docker socket, giving it effective control of the node.",
      "Rotated every secret the token could read (treat them all as compromised), deleted the workload, and replaced the nodes.",
      "Introduced namespace isolation, dropped the binding to a narrowly-scoped Role, and enabled Azure Policy for AKS.",
    ],
    result:
      "Blast radius contained to the cluster; all reachable secrets rotated within a day. Cluster-admin bindings for workloads eliminated, with admission policy preventing privileged pods and socket mounts.",
    lessons: [
      "<b>Kubernetes secrets are readable by anything with the right RBAC</b> — a single over-bound service account exposes the lot.",
      "Convenience bindings made during onboarding are the most common cluster-security failure.",
      "Assume every secret a compromised token could read <i>was</i> read.",
    ],
    attack: ["T1610", "T1552.007", "T1078.004"],
    followUp: "A pod is compromised. What decides how bad that is?",
  },
  {
    id: 16,
    tier: "engineer",
    provider: "gcp",
    category: "Identity & Keys",
    severity: "high",
    certs: ["gcp-pcse"],
    title: "Service account key baked into a container image",
    plain:
      "<p>A service account key file was copied into a container image during the build. Anyone who could pull that image — including from a registry that turned out to be readable too widely — got long-lived credentials to our project.</p>",
    situation:
      "SCC flagged anomalous API activity authenticating as a service account from an IP outside our environment.",
    task: "Find the credential source and eliminate the class of problem, not just the key.",
    actions: [
      "Traced the identity to a JSON key added in a Dockerfile <code>COPY</code> step and present in an image layer.",
      "The key was long-lived and never rotated; the image had been pushed to a registry with broad read access.",
      "Disabled the key immediately and reviewed Cloud Audit Logs for everything it had done.",
      "Scanned all images for embedded credentials and found two more in older builds.",
      "Replaced key-based auth with <b>Workload Identity</b> for GKE and Workload Identity Federation for external CI.",
    ],
    result:
      "Key disabled and rotated, historic images purged and rebuilt, and an org policy applied to <b>disable service-account key creation</b> so the pattern cannot return.",
    lessons: [
      "<b>Deleting a file in a later layer does not remove it from the image</b> — the layer still contains it.",
      "Service-account keys are the GCP equivalent of long-lived access keys; the goal is to have none at all.",
      "Image scanning must include secret detection, not just CVEs.",
    ],
    attack: ["T1552.001", "T1078.004", "T1525"],
    followUp: "How would you run a workload in GCP with no service-account key at all?",
  },
  {
    id: 17,
    tier: "engineer",
    provider: "gcp",
    category: "Data Exposure",
    severity: "high",
    certs: ["gcp-pcse", "ccsp"],
    title: "Public bucket plus BigQuery export used for exfiltration",
    plain:
      "<p>An attacker with limited access exported a large analytics dataset into a storage bucket, then made that bucket public and downloaded it from outside — turning our own data pipeline into the exfiltration route.</p>",
    situation:
      "SCC raised a public-bucket finding minutes after an unusually large BigQuery export job by a service account.",
    task: "Stop the exfiltration in progress and understand how a low-privilege identity managed it.",
    actions: [
      "Removed public access and applied <b>public access prevention</b> at the org level while the download was still running.",
      "Audit logs showed the sequence: <code>bigquery.jobs.create</code> export → bucket create → IAM policy change adding <code>allUsers</code>.",
      "The service account had broad project-level BigQuery and Storage roles from an early prototype.",
      "Confirmed the volume downloaded before the bucket was closed to size the exposure honestly.",
      "Implemented <b>VPC Service Controls</b> so data cannot leave the perimeter even with valid credentials.",
    ],
    result:
      "Exfiltration cut off partway through, credentials revoked, roles reduced to dataset scope, and a service perimeter now blocks this path entirely regardless of IAM.",
    lessons: [
      "<b>Legitimate data-movement features are the exfiltration path</b> — you are watching for unusual use, not malware.",
      "Public access prevention at org level is preventive; a finding is only detective and arrives after the fact.",
      "VPC Service Controls is the control that makes stolen credentials insufficient on their own.",
    ],
    attack: ["T1530", "T1537", "T1567"],
    followUp: "The credentials were valid and the API calls were normal. What stops this?",
  },
  {
    id: 18,
    tier: "engineer",
    provider: "gcp",
    category: "Compute & Containers",
    severity: "high",
    certs: ["gcp-pcse"],
    title: "GKE workload using the default service account",
    plain:
      "<p>Pods were running as the project's <b>default</b> identity, which had Editor rights on everything. One vulnerable app therefore meant access to the entire project.</p>",
    situation:
      "A routine review found production GKE workloads using the Compute Engine default service account with the Editor role.",
    task: "Quantify the risk and migrate to per-workload identity without an outage.",
    actions: [
      "Confirmed pods could reach the node metadata endpoint and obtain default-SA tokens with Editor scope.",
      "Demonstrated in a test namespace that a compromised pod could create resources and read secrets project-wide.",
      "Enabled <b>Workload Identity</b> on the cluster and mapped each Kubernetes service account to a dedicated, least-privilege Google service account.",
      "Enabled metadata concealment / blocked legacy metadata endpoints so pods cannot reach node credentials.",
      "Removed the Editor grant from the default service account once all workloads were migrated.",
    ],
    result:
      "Migrated with zero downtime over two sprints. A pod compromise is now scoped to that workload's own permissions rather than the whole project.",
    lessons: [
      "<b>Default service accounts are over-privileged by default</b> — Editor is close to admin for most purposes.",
      "Workload Identity is the single highest-value GKE hardening step.",
      "Prove the risk in a sandbox — a demonstrated escalation gets migration prioritised far faster than a policy citation.",
    ],
    attack: ["T1552.005", "T1078.004", "T1613"],
    followUp: "Why is the Editor role dangerous if it is not technically admin?",
  },
  {
    id: 19,
    tier: "associate",
    provider: "gcp",
    category: "Posture & Drift",
    severity: "med",
    certs: ["gcp-pcse"],
    title: "Org policy drift — external IPs re-enabled",
    plain:
      "<p>A guardrail that blocked servers from getting public internet addresses was switched off for one project to unblock a deadline — and then quietly stayed off, with new public servers appearing over the following weeks.</p>",
    situation:
      "A weekly posture review showed VMs with external IPs in a project where the <code>constraints/compute.vmExternalIpAccess</code> policy should have prevented it.",
    task: "Find who changed the guardrail and why, and make exceptions safe rather than permanent.",
    actions: [
      "Audit logs showed a project owner had overridden the inherited org policy three weeks earlier for a vendor demo.",
      "Seven VMs had since been created with public IPs, two running management interfaces.",
      "Verified none had been compromised: checked firewall rules, auth logs, and SCC findings for those hosts.",
      "Restored inheritance of the org policy and moved the demo workload behind a load balancer with Cloud Armor.",
      "Added alerting on <b>org policy modification</b> events and a documented, expiring exception process.",
    ],
    result:
      "Drift closed within a day, no compromise found, and policy changes now generate an immediate alert with a required expiry date on any exception.",
    lessons: [
      "<b>Guardrails without change alerting will drift</b> — someone always has a deadline.",
      "Exceptions must expire by default; permanent exceptions are just policy failures with paperwork.",
      "Detecting the drift is good; detecting the <i>policy change</i> is better, because it happens before the risk appears.",
    ],
    attack: ["T1562.007", "T1578"],
    followUp: "How do you allow a legitimate exception without permanently weakening the guardrail?",
  },
  {
    id: 20,
    tier: "engineer",
    provider: "gcp",
    category: "Compute & Containers",
    severity: "med",
    certs: ["gcp-pcse"],
    title: "Unauthenticated Cloud Function abused for resource hijacking",
    plain:
      "<p>A serverless function was left open for anyone on the internet to call. Attackers found it and invoked it millions of times, running up a large bill and using it as a relay.</p>",
    situation:
      "A billing anomaly alert showed function invocations up 400x overnight from a wide range of IPs.",
    task: "Stop the abuse, size the cost impact, and fix the access model.",
    actions: [
      "The function was deployed with <code>allUsers</code> as invoker — a default chosen during testing and never changed.",
      "It accepted a URL parameter and fetched it server-side, so it was also being used as an <b>open proxy</b>.",
      "Removed the public invoker binding immediately and put the function behind API Gateway with authentication.",
      "Reviewed audit logs to confirm the function's service account had not been used for anything beyond the fetches.",
      "Added an org policy restricting public invoker bindings and a budget alert with automated notification.",
    ],
    result:
      "Abuse stopped within 30 minutes, roughly $4k of spend recovered as a service credit, and public invocation now blocked by policy rather than convention.",
    lessons: [
      "<b>Serverless shifts the risk to invocation and code</b>, not the OS — 'who can call this?' is the primary control.",
      "Server-side fetch features become open proxies; validate and allow-list destinations.",
      "Billing alerts are a genuine security signal, often the first sign of abuse.",
    ],
    attack: ["T1496", "T1190"],
    followUp: "What is the first thing you check when a serverless bill spikes?",
  },
  {
    id: 21,
    tier: "architect",
    provider: "gcp",
    category: "Network Exposure",
    severity: "low",
    certs: ["gcp-pcse", "ccsp"],
    title: "VPC Service Controls blocked an insider exfiltration attempt",
    plain:
      "<p>An employee with legitimate access tried to copy a sensitive dataset to a personal cloud project. The data perimeter refused the transfer — a control working exactly as designed, and the resulting log is what exposed the attempt.</p>",
    situation:
      "A VPC Service Controls violation alert showed repeated denied attempts to copy BigQuery data to a project outside the perimeter.",
    task: "Handle a blocked-but-deliberate insider attempt with the correct process, not just a technical response.",
    actions: [
      "Confirmed the perimeter denied every attempt — no data left the boundary.",
      "The identity was a genuine analyst with legitimate read access to the dataset; the access itself was not anomalous.",
      "Escalated immediately to <b>Legal and HR</b> rather than acting unilaterally — insider cases are led by them.",
      "Preserved audit logs and violation records with chain of custody before any account action.",
      "Waited for authorisation before adjusting access, then reviewed who else could export that dataset.",
    ],
    result:
      "Zero data loss. The case was handled as an HR/Legal matter with clean evidence, and the perimeter's value was demonstrated concretely to leadership — which funded extending it to two more datasets.",
    lessons: [
      "<b>Preventive controls generate the best evidence</b> — a blocked attempt is unambiguous intent, cleanly logged.",
      "Insider cases are process-first: preserve evidence and escalate before touching the account.",
      "A control that never appears to 'do anything' is invisible until it stops something — capture those wins for funding.",
    ],
    attack: ["T1537", "T1530"],
    followUp: "The user had legitimate access to the data. What made this detectable?",
  },
  {
    id: 22,
    tier: "engineer",
    provider: "aws",
    category: "Supply Chain",
    severity: "high",
    certs: ["aws-scs", "ccsp"],
    title: "CI/CD credentials leaked through build logs",
    plain:
      "<p>A build pipeline printed its environment variables into a log that anyone in the org could read — including the cloud deployment credentials. Those credentials could deploy to production.</p>",
    situation:
      "A developer noticed cloud credentials in a public-to-the-org build log and reported it.",
    task: "Assume exposure, rotate fast, and remove long-lived credentials from CI entirely.",
    actions: [
      "Treated the credential as compromised regardless of who had read it — exposure duration was over a month.",
      "Rotated it immediately and reviewed CloudTrail for any use from outside the CI provider's IP ranges.",
      "Found the root cause: a debug step running <code>env</code> added while troubleshooting and never removed.",
      "Replaced the static key with <b>GitHub OIDC federation to an IAM role</b>, scoped to the specific repo and branch.",
      "Enabled log-masking for known secret patterns and added secret scanning across pipeline definitions.",
    ],
    result:
      "No unauthorised use detected. Static deployment keys eliminated across all pipelines in favour of short-lived OIDC tokens, so a repeat leak would expose nothing usable.",
    lessons: [
      "<b>Build logs are a credential exposure surface</b> people forget — treat them like any other output.",
      "OIDC federation removes the secret entirely; there is nothing left to leak or rotate.",
      "Scope CI roles to repo and branch, so even a valid token cannot deploy from an attacker's fork.",
    ],
    attack: ["T1552.001", "T1078.004", "T1195.002"],
    followUp: "How do you give a pipeline cloud access without storing a secret?",
  },
  {
    id: 23,
    tier: "engineer",
    provider: "azure",
    category: "Posture & Drift",
    severity: "med",
    certs: ["az-500"],
    title: "Terraform module deployed a publicly reachable database",
    plain:
      "<p>A reusable infrastructure template had an insecure default. Every team that used it unknowingly deployed a database reachable from the internet — one mistake copied into many environments.</p>",
    situation:
      "Defender for Cloud flagged multiple SQL servers with 'Allow Azure services and public access' enabled, all created from the same internal Terraform module.",
    task: "Fix the fleet, then fix the source so it stops reproducing.",
    actions: [
      "Traced all affected resources back to one module version with a permissive firewall default.",
      "Confirmed via logs whether any external connection had succeeded — none had, but the window was open for weeks.",
      "Remediated the deployed resources with private endpoints and firewall restrictions.",
      "Fixed the module default to deny public access and published a new major version with a migration note.",
      "Added <b>IaC scanning</b> (Checkov) to the pipeline so an insecure default fails the build, not the audit.",
    ],
    result:
      "All instances remediated within the week, the module corrected at source, and pipeline scanning now prevents this class of misconfiguration from shipping at all.",
    lessons: [
      "<b>A bad IaC default is a misconfiguration factory</b> — one insecure module multiplies across every consumer.",
      "Fixing deployed resources without fixing the template guarantees the finding returns.",
      "Shift-left scanning is cheapest precisely because it catches the template, not the hundred resources.",
    ],
    attack: ["T1190", "T1526"],
    followUp: "You fixed 30 resources. Why might the finding come back next month?",
  },
  {
    id: 24,
    tier: "architect",
    provider: "gcp",
    category: "Compliance",
    severity: "med",
    certs: ["gcp-pcse", "ccsp"],
    title: "Data residency violation — workloads in the wrong region",
    plain:
      "<p>Regulated customer data was being processed in a region outside the country it was legally required to stay in, because a default region setting was never changed. It was a compliance breach even though there was no attacker.</p>",
    situation:
      "A compliance review found EU customer data being processed and stored in a US region, contrary to contractual data-residency commitments.",
    task: "Establish scope and exposure duration, remediate, and prevent recurrence — this is a regulatory issue, not an intrusion.",
    actions: [
      "Inventoried every resource holding regulated data and its actual location using asset inventory.",
      "Determined the cause: projects created from a template with a default US region, with no location constraint applied.",
      "Assessed duration and data categories with Legal and the DPO to determine notification obligations.",
      "Migrated the affected datasets and workloads to the required region with documented evidence of deletion at source.",
      "Applied the <b>resource location constraint</b> org policy and Assured Workloads for the regulated folder.",
    ],
    result:
      "Remediated and documented for the regulator with a clear timeline. Location is now enforced by policy, so a resource cannot be created in a non-approved region.",
    lessons: [
      "<b>Compliance failures do not need an attacker</b> — a default setting is enough.",
      "Location constraints are preventive and trivial to apply; discovering violations later is expensive.",
      "Sovereignty requirements must be encoded in the landing zone, not left to team discipline.",
    ],
    attack: ["T1530"],
    followUp: "Nobody attacked you. Why is this still a serious security finding?",
  },
];

/* ==================================================================
   DEEP DIVE 1 — Attacks & Misconfigurations
   ================================================================== */

/** An attack path: how it works, the misconfiguration that enables it,
 *  how to detect it, and how to prevent it — with per-cloud specifics. */
export interface AttackPath {
  id: number;
  tier: Tier;
  category: string;
  certs: Cert[];
  title: string;
  how: string;
  enabler: string;
  detect: string;
  fix: string;
  providers: Partial<Record<Provider, string>>;
  attack: string[];
}

export const ATTACK_PATHS: AttackPath[] = [
  {
    id: 1,
    tier: "associate",
    category: "Data Exposure",
    certs: ALL_CERTS,
    title: "Public object storage",
    how: "<p>The attacker enumerates storage buckets — by guessing names, reading them out of a client-side app bundle, or finding them in search engines and public datasets — and downloads anything readable. No exploit is needed; the data is simply served to anyone who asks.</p>",
    enabler:
      "<p>A bucket or container set to allow anonymous read, an over-broad resource policy (<code>Principal: *</code>, <code>allUsers</code>), or public access left on for one legitimate file that also exposes everything beside it.</p>",
    detect:
      "<p>Posture findings for public buckets, plus <b>data-plane access logs</b> showing reads from unauthenticated or unfamiliar sources. Without data-plane logging you can detect the exposure but never prove whether it was read.</p>",
    fix: "<p>Turn on the account/org-level public-access block, use a separate CDN-fronted bucket for genuinely public assets, and enforce it preventively with an SCP or policy so no engineer can re-enable it.</p>",
    providers: {
      aws: "<p><b>S3 Block Public Access</b> at account level + SCP; Access Analyzer for public/cross-account findings; enable S3 data events in CloudTrail.</p>",
      azure:
        "<p>Storage account <b>'Allow Blob anonymous access' = disabled</b> + Azure Policy deny; enable storage diagnostic logging.</p>",
      gcp: "<p><b>Public access prevention</b> + uniform bucket-level access, enforced by org policy; enable Data Access audit logs.</p>",
    },
    attack: ["T1530", "T1580"],
  },
  {
    id: 2,
    tier: "associate",
    category: "Identity",
    certs: ALL_CERTS,
    title: "Leaked long-lived credentials",
    how: "<p>A static key ends up in a public repo, a container image layer, a build log, a mobile app bundle, or a paste site. Automated scrapers find public keys within <b>minutes</b>, then use them for resource hijacking, data theft, or quiet persistence.</p>",
    enabler:
      "<p>The existence of long-lived credentials at all: user access keys, service-account key files, or app secrets stored in code and config instead of a secrets store or short-lived workload identity.</p>",
    detect:
      "<p>Managed threat detection for credential use from anomalous IPs/regions, sudden billing anomalies, and secret-scanning alerts on repos and images. The strongest signal is <b>a credential being used from outside your own cloud</b>.</p>",
    fix: "<p>Eliminate static keys — use short-lived roles, workload identity, and OIDC federation for CI. Where a secret must exist, keep it in a secrets manager with rotation, and enable push protection plus image secret scanning.</p>",
    providers: {
      aws: "<p>IAM Identity Center for humans, IAM roles/IRSA for workloads, GitHub OIDC → role for CI. GuardDuty <code>InstanceCredentialExfiltration</code> / <code>MaliciousIPCaller</code>.</p>",
      azure:
        "<p>Managed Identities and workload identity federation instead of client secrets; Defender alerts on anomalous service-principal use.</p>",
      gcp: "<p>Org policy to <b>disable service-account key creation</b>; Workload Identity (GKE) and Workload Identity Federation (CI); SCC anomalous-credential findings.</p>",
    },
    attack: ["T1552.001", "T1078.004", "T1496"],
  },
  {
    id: 3,
    tier: "engineer",
    category: "Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "SSRF to instance metadata credential theft",
    how: "<p>The attacker abuses a server-side request bug to make your workload fetch the internal metadata endpoint (<code>169.254.169.254</code>), which returns the workload's own cloud credentials. Those credentials are then used from anywhere, with all the permissions you attached to the instance.</p>",
    enabler:
      "<p>An SSRF-able application <b>plus</b> a legacy/unauthenticated metadata service, <b>plus</b> an over-broad instance role. All three are needed — removing any one breaks the chain.</p>",
    detect:
      "<p>Workload-role credentials used from an IP outside your cloud is the highest-fidelity signal. Also watch app logs for outbound requests to link-local addresses.</p>",
    fix: "<p>Enforce the hardened metadata mode fleet-wide, allow-list outbound destinations in the app, and scope the workload role to only what it needs so the stolen identity is nearly useless.</p>",
    providers: {
      aws: "<p>Enforce <b>IMDSv2 required</b> (and set hop limit 1); GuardDuty <code>UnauthorizedAccess:EC2/InstanceCredentialExfiltration</code>.</p>",
      azure:
        "<p>Azure IMDS requires the <code>Metadata:true</code> header, defeating naive SSRF; still least-privilege the Managed Identity.</p>",
      gcp: "<p>Metadata requires <code>Metadata-Flavor: Google</code>; disable legacy metadata endpoints and enable GKE metadata concealment.</p>",
    },
    attack: ["T1190", "T1552.005", "T1078.004"],
  },
  {
    id: 4,
    tier: "engineer",
    category: "Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "IAM privilege escalation chains",
    how: "<p>An identity without admin rights uses a <b>combination</b> of permissions to grant itself more — attaching a policy, passing a privileged role to a compute service it controls, editing a function's identity, or creating credentials for a more privileged principal.</p>",
    enabler:
      "<p>Toxic permission combinations that look harmless individually, and role-assignment rights (like the ability to grant roles) handed out during automation projects.</p>",
    detect:
      "<p>Alert on role/policy assignment events performed by non-admin or workload identities, on new credentials added to an existing identity, and on the creation of compute that runs as a privileged role.</p>",
    fix: "<p>Constrain pass-role style permissions with conditions, apply <b>permission boundaries</b> so an identity can never exceed a ceiling, and run automated IAM path analysis on a schedule rather than reviewing permissions one at a time.</p>",
    providers: {
      aws: "<p><code>iam:PassRole</code> with <code>iam:PassedToService</code> conditions, permission boundaries, SCP ceilings; map paths with Access Analyzer or PMapper.</p>",
      azure:
        "<p>Treat <b>Owner</b> and <b>User Access Administrator</b> as admin; use PIM for JIT; alert on role assignments by Managed Identities.</p>",
      gcp: "<p>Watch <code>iam.serviceAccounts.actAs</code> + deploy, and <code>setIamPolicy</code>; use IAM Recommender and Policy Analyzer.</p>",
    },
    attack: ["T1098.003", "T1078.004"],
  },
  {
    id: 5,
    tier: "engineer",
    category: "Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Over-permissive cross-account and third-party trust",
    how: "<p>A role or delegation intended for one partner accepts <b>any</b> principal, or grants far more than the integration needs. An attacker (or a breached vendor) walks in through a door that was left open on purpose.</p>",
    enabler:
      "<p>Wildcard trust policies, missing external-ID conditions, and vendor setup guides that ask for broad roles because it is simpler than scoping properly.</p>",
    detect:
      "<p>Access-analysis findings for externally-accessible resources, and alerting on assume-role/delegated operations from unexpected source accounts or outside the partner's working hours.</p>",
    fix: "<p>Pin trust to specific account IDs with a unique external ID, scope permissions to the exact resources, time-box delegations, and review third-party access with the same rigour as internal roles.</p>",
    providers: {
      aws: "<p>Cross-account roles with <code>sts:ExternalId</code>; never <code>Principal: \"*\"</code>; SCP to block wildcard trust.</p>",
      azure:
        "<p>Audit <b>Lighthouse</b> delegations and B2B guests; scope to resource groups, not subscriptions.</p>",
      gcp: "<p>Limit cross-org role grants; use <b>VPC Service Controls</b> so external identities still cannot pull data out.</p>",
    },
    attack: ["T1199", "T1078.004"],
  },
  {
    id: 6,
    tier: "engineer",
    category: "Compute",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Container escape to the host node",
    how: "<p>An attacker with code execution inside a container breaks out to the underlying node — via a privileged container, a mounted host path or Docker socket, or excessive Linux capabilities — then steals the node's cloud identity and the cluster's secrets.</p>",
    enabler:
      "<p><code>privileged: true</code>, hostPath or docker.sock mounts, running as root, and workloads sharing an over-privileged node identity instead of having their own.</p>",
    detect:
      "<p>Runtime alerts for unexpected process execution, container breakout patterns, and cluster credentials or node identity used in unusual ways. Sudden crypto-mining is a frequent visible symptom.</p>",
    fix: "<p>Enforce admission policy that blocks privileged pods, host mounts, and root containers; give every workload its own least-privilege cloud identity; and replace compromised nodes rather than cleaning them.</p>",
    providers: {
      aws: "<p>EKS: <b>IRSA</b> for pod identity, Pod Security Standards / Kyverno at admission, GuardDuty EKS Protection.</p>",
      azure:
        "<p>AKS: <b>Azure Policy for AKS</b> (Gatekeeper), Entra workload identity, Defender for Containers runtime alerts.</p>",
      gcp: "<p>GKE: <b>Workload Identity</b>, Autopilot's enforced hardening, Binary Authorization, metadata concealment.</p>",
    },
    attack: ["T1610", "T1611", "T1552.005", "T1496"],
  },
  {
    id: 7,
    tier: "associate",
    category: "Network",
    certs: ALL_CERTS,
    title: "Exposed management ports and admin interfaces",
    how: "<p>Internet-wide scanners find SSH, RDP, database ports, Kubernetes API servers, or admin dashboards within hours of exposure, then brute-force or exploit them. This is one of the most common initial-access routes in cloud breaches.</p>",
    enabler:
      "<p>A firewall/security-group rule allowing <code>0.0.0.0/0</code> on an admin or data port — very often a 'temporary' troubleshooting change that was never reverted.</p>",
    detect:
      "<p>Posture findings for world-open rules, authentication brute-force alerts, and inventory diffs showing new public IPs. Alerting on the <b>rule change itself</b> catches it before the attack.</p>",
    fix: "<p>Reach admin surfaces through bastion/just-in-time access or private connectivity, and make world-open management rules impossible via preventive policy rather than periodic clean-up.</p>",
    providers: {
      aws: "<p>Session Manager instead of SSH/RDP; SCP or Config rules blocking open management ports; no public IP by default.</p>",
      azure:
        "<p><b>Just-in-Time VM access</b> and Azure Bastion; Azure Policy denying Any-source NSG rules on 22/3389.</p>",
      gcp: "<p><b>IAP TCP forwarding</b> instead of public SSH; hierarchical firewall policies; org policy blocking external IPs.</p>",
    },
    attack: ["T1190", "T1110", "T1021.001"],
  },
  {
    id: 8,
    tier: "engineer",
    category: "Identity",
    certs: ["az-500", "aws-scs", "ccsp"],
    title: "Malicious OAuth app / illicit consent grant",
    how: "<p>A user is tricked into approving a third-party application that requests broad permissions to read mail, files, or directory data. The app then accesses data continuously with a legitimate token — and because it is an app grant, <b>a password reset does not remove it</b>.</p>",
    enabler:
      "<p>Allowing end users to consent to unverified applications, and tenant-wide application permissions granted without review.</p>",
    detect:
      "<p>Alert on new consent grants and service-principal credential additions, especially for high-value scopes; watch for bulk mail/file reads by an application identity.</p>",
    fix: "<p>Disable user consent to unverified publishers, require an <b>admin consent workflow</b>, review existing grants, and revoke both the grant and the refresh tokens when responding.</p>",
    providers: {
      azure:
        "<p>Entra: restrict user consent, admin consent workflow, review enterprise applications and their credentials regularly.</p>",
      aws: "<p>Equivalent risk sits with third-party integrations and IAM Identity Center app assignments — review external app trust.</p>",
      gcp: "<p>Workspace: restrict third-party app access via API controls and app allow-listing; review OAuth token grants.</p>",
    },
    attack: ["T1550.001", "T1098.001", "T1114.002"],
  },
  {
    id: 9,
    tier: "engineer",
    category: "Defense Evasion",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Disabling or deleting audit logs",
    how: "<p>Before or during an intrusion the attacker stops logging, deletes a trail, or removes the log store — often starting in an unused region on the assumption nobody watches it. What follows is invisible.</p>",
    enabler:
      "<p>Log configuration that a workload-account identity can modify, logs stored in the same account as the workload, and no alerting on logging changes.</p>",
    detect:
      "<p>High-severity alerts on stop-logging, trail/sink deletion, retention changes, and log-store policy edits. A <b>gap</b> in expected log volume is a secondary signal.</p>",
    fix: "<p>Deliver logs to a separate, locked-down account/project with immutability and retention locks, and deny logging-modification actions org-wide except for the security team.</p>",
    providers: {
      aws: "<p>Org-wide CloudTrail to a log-archive account, log-file validation, S3 <b>Object Lock</b>, SCP denying <code>cloudtrail:StopLogging</code>.</p>",
      azure:
        "<p>Diagnostic settings to a central workspace/immutable storage; alert on diagnostic-setting deletion; RBAC separation.</p>",
      gcp: "<p>Aggregated org <b>log sinks</b> to a locked project with bucket retention lock; alert on sink changes.</p>",
    },
    attack: ["T1562.008", "T1070"],
  },
  {
    id: 10,
    tier: "associate",
    category: "Impact",
    certs: ALL_CERTS,
    title: "Resource hijacking (crypto-mining)",
    how: "<p>With any compute-creating access, the attacker spins up expensive instances — often GPU types, in regions you never use — to mine cryptocurrency. It is noisy and costly, and frequently a cover for quieter persistence.</p>",
    enabler:
      "<p>Leaked credentials or a compromised workload with permission to create compute, combined with no region restrictions, no service quotas, and no billing alerts.</p>",
    detect:
      "<p>Billing anomaly alerts, mining-pool DNS/network detections, and instance launches in unused regions or of unusual instance types.</p>",
    fix: "<p>Restrict usable regions and instance families by policy, set budget alerts as a security signal, and — critically — hunt for persistence after any mining incident.</p>",
    providers: {
      aws: "<p>SCP region/instance-type restrictions, Budgets alerts, GuardDuty <code>CryptoCurrency:EC2/BitcoinTool</code>.</p>",
      azure:
        "<p>Azure Policy allowed-locations and SKU restrictions, Cost Management alerts, Defender mining alerts.</p>",
      gcp: "<p>Org policy resource-locations constraint, budget alerts, SCC/Event Threat Detection mining findings.</p>",
    },
    attack: ["T1496", "T1578.002"],
  },
  {
    id: 11,
    tier: "engineer",
    category: "Data Exposure",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    title: "Public snapshots, images and databases",
    how: "<p>Disk snapshots, machine images, and database backups can be shared publicly or cross-account. An attacker who finds one simply restores it in their own account and reads everything — bypassing every network control you have.</p>",
    enabler:
      "<p>A snapshot/image marked public or shared broadly (often for a legitimate one-off), and unrestricted sharing permissions.</p>",
    detect:
      "<p>Posture findings for public snapshots/images, and alerts on share-permission modification events.</p>",
    fix: "<p>Block public sharing at the account/org level, keep snapshots encrypted with customer-managed keys (an unshared key makes a leaked snapshot useless), and audit sharing regularly.</p>",
    providers: {
      aws: "<p><b>Block public access for EBS snapshots</b>, restrict AMI sharing, encrypt with a CMK that is not shared.</p>",
      azure:
        "<p>Restrict disk/image sharing and SAS token scope; use customer-managed keys for disk encryption.</p>",
      gcp: "<p>Restrict image/snapshot IAM sharing; use CMEK so exported data is unreadable without the key.</p>",
    },
    attack: ["T1580", "T1530"],
  },
  {
    id: 12,
    tier: "engineer",
    category: "Supply Chain",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    title: "CI/CD and IaC supply-chain compromise",
    how: "<p>The pipeline holds credentials that can deploy to production. An attacker who compromises a repo, a build step, a dependency, or a shared IaC module can ship malicious infrastructure or code — and it arrives through your trusted deployment path.</p>",
    enabler:
      "<p>Long-lived deploy credentials stored in CI, unpinned third-party actions/modules, no artifact signing, and IaC defaults that are insecure for every consumer.</p>",
    detect:
      "<p>Deployments outside change windows or from unexpected branches/forks, unreviewed pipeline-definition changes, and drift between IaC state and deployed reality.</p>",
    fix: "<p>Replace stored secrets with short-lived OIDC federation scoped to repo and branch, pin and review dependencies, sign artifacts with provenance, and scan IaC in the pipeline so insecure defaults fail the build.</p>",
    providers: {
      aws: "<p>GitHub OIDC → IAM role scoped by repo/branch; signed artifacts; cfn-guard / Checkov in the pipeline.</p>",
      azure:
        "<p>Workload identity federation for pipelines; <b>Defender for DevOps</b>; PSRule/Checkov on Bicep and ARM.</p>",
      gcp: "<p>Workload Identity Federation for CI; <b>Binary Authorization</b> with attestations; SLSA provenance.</p>",
    },
    attack: ["T1195.002", "T1078.004", "T1552.001"],
  },
];

/* ==================================================================
   DEEP DIVE 2 — MITRE ATT&CK for Cloud
   ================================================================== */

export interface Technique {
  id: string;
  name: string;
  cloud: string;
  detect: string;
}

export interface Tactic {
  id: string;
  name: string;
  goal: string;
  techniques: Technique[];
}

export const TACTICS: Tactic[] = [
  {
    id: "TA0001",
    name: "Initial Access",
    goal: "Get the first foothold in the cloud environment.",
    techniques: [
      {
        id: "T1078.004",
        name: "Valid Accounts: Cloud Accounts",
        cloud: "Using stolen, leaked, or default credentials to sign in legitimately — the most common cloud initial access.",
        detect: "Impossible travel, sign-ins from hosting/VPN ASNs, credential use from outside your cloud, first-seen device.",
      },
      {
        id: "T1190",
        name: "Exploit Public-Facing Application",
        cloud: "Exploiting an internet-exposed app or appliance running in the cloud, often leading straight to workload credentials.",
        detect: "WAF blocks and anomalies, unexpected child processes on web hosts, outbound calls to link-local metadata.",
      },
      {
        id: "T1199",
        name: "Trusted Relationship",
        cloud: "Entering through a partner, MSP, or third-party integration that holds delegated access to your tenant.",
        detect: "Delegated/cross-account operations outside partner working hours or without a matching change ticket.",
      },
      {
        id: "T1566",
        name: "Phishing",
        cloud: "Credential and consent phishing against cloud identities, including adversary-in-the-middle token theft.",
        detect: "Reported phish, sign-ins with MFA satisfied but no prompt, new consent grants after a click.",
      },
    ],
  },
  {
    id: "TA0002",
    name: "Execution",
    goal: "Run attacker-controlled code in the environment.",
    techniques: [
      {
        id: "T1651",
        name: "Cloud Administration Command",
        cloud: "Using the provider's own remote-command tooling to run commands on VMs without touching the network.",
        detect: "Run-command / remote-execution API calls, especially from unusual identities or to many hosts at once.",
      },
      {
        id: "T1610",
        name: "Deploy Container",
        cloud: "Deploying a malicious container or job into a cluster to gain execution.",
        detect: "New workloads from unexpected identities, images from untrusted registries, admission-control denials.",
      },
      {
        id: "T1059",
        name: "Command and Scripting Interpreter",
        cloud: "Serverless functions, build steps, and startup scripts used to execute attacker code.",
        detect: "Function/pipeline definition changes, unusual runtime processes, unexpected outbound connections.",
      },
    ],
  },
  {
    id: "TA0003",
    name: "Persistence",
    goal: "Keep access even after passwords are reset and hosts are rebuilt.",
    techniques: [
      {
        id: "T1098.001",
        name: "Account Manipulation: Additional Cloud Credentials",
        cloud: "Adding a certificate, secret, or access key to an existing identity — a backdoor that survives password resets.",
        detect: "Any credential addition to a user, service principal, or service account. Rare and high-signal.",
      },
      {
        id: "T1136.003",
        name: "Create Account: Cloud Account",
        cloud: "Creating a new user, service account, or app registration to hold quiet long-term access.",
        detect: "Identity-creation events by non-provisioning identities, or outside the joiner process.",
      },
      {
        id: "T1078.004",
        name: "Valid Accounts: Cloud Accounts",
        cloud: "Continuing to use a legitimate compromised identity rather than planting anything new.",
        detect: "Behavioural baselines per identity — new services, regions, or hours for that principal.",
      },
    ],
  },
  {
    id: "TA0004",
    name: "Privilege Escalation",
    goal: "Turn limited access into administrative control.",
    techniques: [
      {
        id: "T1098.003",
        name: "Account Manipulation: Additional Cloud Roles",
        cloud: "Assigning yourself (or a controlled principal) a more powerful role using role-granting permissions.",
        detect: "Role assignment events by non-admin or workload identities; new Owner/admin grants.",
      },
      {
        id: "T1548",
        name: "Abuse Elevation Control Mechanism",
        cloud: "Passing a privileged role to a compute service you control, then running code as that role.",
        detect: "Compute created with a role more privileged than the creator; pass-role events with unexpected targets.",
      },
      {
        id: "T1611",
        name: "Escape to Host",
        cloud: "Breaking out of a container to the node to inherit the node identity and cluster secrets.",
        detect: "Runtime breakout detections, privileged pod admission, node credential use from workload contexts.",
      },
    ],
  },
  {
    id: "TA0005",
    name: "Defense Evasion",
    goal: "Avoid detection and remove evidence.",
    techniques: [
      {
        id: "T1562.008",
        name: "Impair Defenses: Disable or Modify Cloud Logs",
        cloud: "Stopping trails, deleting sinks, or shortening retention so activity is not recorded.",
        detect: "Alert on every logging configuration change at high severity; watch for log-volume gaps.",
      },
      {
        id: "T1578",
        name: "Modify Cloud Compute Infrastructure",
        cloud: "Creating resources in unused regions, modifying snapshots, or reverting configurations to hide activity.",
        detect: "Activity in unusual regions, snapshot sharing changes, infrastructure changes outside IaC.",
      },
      {
        id: "T1070",
        name: "Indicator Removal",
        cloud: "Deleting findings, alerts, or resources used during the intrusion.",
        detect: "Deletion events on security findings and monitoring resources; immutable log storage defeats this.",
      },
    ],
  },
  {
    id: "TA0006",
    name: "Credential Access",
    goal: "Obtain more credentials to expand access.",
    techniques: [
      {
        id: "T1552.005",
        name: "Unsecured Credentials: Cloud Instance Metadata API",
        cloud: "Reading workload credentials from the metadata service, typically via SSRF or code execution.",
        detect: "Workload-role credentials used from outside the cloud; app requests to link-local addresses.",
      },
      {
        id: "T1552.001",
        name: "Unsecured Credentials: Credentials In Files",
        cloud: "Keys in repos, image layers, build logs, environment variables, and IaC state files.",
        detect: "Secret scanning on repos/images/pipelines; alerts on credential use from new sources.",
      },
      {
        id: "T1528",
        name: "Steal Application Access Token",
        cloud: "Stealing OAuth/session tokens — including AiTM phishing — to bypass MFA entirely.",
        detect: "MFA satisfied without a prompt, token use from a different device or ASN than issuance.",
      },
    ],
  },
  {
    id: "TA0007",
    name: "Discovery",
    goal: "Map the environment and find what is worth taking.",
    techniques: [
      {
        id: "T1580",
        name: "Cloud Infrastructure Discovery",
        cloud: "Enumerating instances, buckets, snapshots, and databases via the provider APIs.",
        detect: "Bursts of describe/list calls from one identity, especially soon after first use of that credential.",
      },
      {
        id: "T1087.004",
        name: "Account Discovery: Cloud Account",
        cloud: "Listing users, roles, and permissions to plan escalation.",
        detect: "IAM enumeration by identities that never normally read IAM.",
      },
      {
        id: "T1526",
        name: "Cloud Service Discovery",
        cloud: "Identifying which services, regions, and security tooling are in use.",
        detect: "Region enumeration and service-availability probing; often the first action after credential theft.",
      },
    ],
  },
  {
    id: "TA0008",
    name: "Lateral Movement",
    goal: "Move from the initial foothold to more valuable systems.",
    techniques: [
      {
        id: "T1021.007",
        name: "Remote Services: Cloud Services",
        cloud: "Using cloud consoles, APIs, or remote-management services to reach other accounts and workloads.",
        detect: "Cross-account role assumption, console sign-ins from workload identities, unusual API sources.",
      },
      {
        id: "T1550.001",
        name: "Use Alternate Authentication Material: Application Access Token",
        cloud: "Replaying stolen tokens to access services without re-authenticating.",
        detect: "Token reuse from new IP/device, session anomalies, continuous access evaluation signals.",
      },
      {
        id: "T1021.001",
        name: "Remote Services: Remote Desktop Protocol",
        cloud: "Traditional RDP/SSH movement between cloud VMs after initial access.",
        detect: "East-west admin-port connections, especially workload-to-workload that never normally happens.",
      },
    ],
  },
  {
    id: "TA0010",
    name: "Exfiltration",
    goal: "Get the data out.",
    techniques: [
      {
        id: "T1537",
        name: "Transfer Data to Cloud Account",
        cloud: "Copying data to an attacker-controlled account, or sharing a snapshot/bucket with them — no network egress needed.",
        detect: "Sharing/permission changes on data resources, cross-account copies, large export jobs.",
      },
      {
        id: "T1530",
        name: "Data from Cloud Storage",
        cloud: "Bulk reads from object storage or databases using valid credentials.",
        detect: "Volume anomalies in data-plane logs; reads by identities that normally never read that store.",
      },
      {
        id: "T1567",
        name: "Exfiltration Over Web Service",
        cloud: "Sending data to third-party services that are usually allowed outbound.",
        detect: "Egress volume anomalies; a data perimeter blocks this even with valid credentials.",
      },
    ],
  },
  {
    id: "TA0040",
    name: "Impact",
    goal: "Destroy, encrypt, or hijack resources.",
    techniques: [
      {
        id: "T1486",
        name: "Data Encrypted for Impact",
        cloud: "Re-encrypting objects with attacker keys, or encrypting disks, to extort payment.",
        detect: "Mass write/encrypt operations with unfamiliar keys; KMS usage anomalies.",
      },
      {
        id: "T1485",
        name: "Data Destruction",
        cloud: "Deleting buckets, databases, snapshots, and backups — often backups first.",
        detect: "Mass delete operations, backup-vault deletion attempts; immutability makes them fail loudly.",
      },
      {
        id: "T1496",
        name: "Resource Hijacking",
        cloud: "Running crypto-miners or other workloads at your expense.",
        detect: "Billing anomalies, mining-pool traffic, instance launches in unused regions.",
      },
    ],
  },
];

/* ==================================================================
   DEEP DIVE 3 — Hardening Playbooks
   ================================================================== */

export interface Playbook {
  id: string;
  domain: string;
  tier: Tier;
  certs: Cert[];
  goal: string;
  checklist: string[];
  providers: Partial<Record<Provider, string>>;
}

export const PLAYBOOKS: Playbook[] = [
  {
    id: "iam",
    domain: "Identity & Access",
    tier: "associate",
    certs: ALL_CERTS,
    goal: "Make identity the strongest control, not the weakest — no static keys, no standing admin, least privilege by default.",
    checklist: [
      "<b>Protect the top-level account</b> — hardware MFA, no daily use, no access keys, alert on any sign-in.",
      "<b>Federate humans through one IdP</b> with SSO; no local per-cloud users.",
      "<b>Require MFA everywhere</b>, phishing-resistant (FIDO2/passkeys) for privileged roles.",
      "<b>Eliminate long-lived keys</b> — workload identity for machines, OIDC federation for CI.",
      "<b>No standing admin</b> — use just-in-time elevation with approval and expiry.",
      "<b>Apply permission ceilings</b> (boundaries/SCPs/org policy) so no identity can exceed its intended maximum.",
      "<b>Review access regularly</b> — remove unused permissions, stale identities, and orphaned credentials.",
      "<b>Hunt escalation paths</b> on a schedule, not just individual permissions.",
    ],
    providers: {
      aws: "<p>IAM Identity Center · IAM roles + STS · permission boundaries · SCPs · Access Analyzer · disable root keys.</p>",
      azure:
        "<p>Entra ID + Conditional Access · Managed Identities · <b>PIM</b> for JIT · Azure RBAC scoped low · access reviews.</p>",
      gcp: "<p>Cloud Identity SSO · Workload Identity (Federation) · org policy disabling SA keys · IAM Recommender.</p>",
    },
  },
  {
    id: "network",
    domain: "Network",
    tier: "engineer",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    goal: "Nothing public that does not need to be, private paths to managed services, and controlled egress.",
    checklist: [
      "<b>Inventory public exposure</b> continuously — public IPs, open ports, public endpoints.",
      "<b>No management ports open to the internet</b> — use bastion, JIT, or identity-aware proxy.",
      "<b>Default-deny inbound</b>; allow only required sources, and segment east-west traffic.",
      "<b>Reach managed services privately</b> via private endpoints instead of the public internet.",
      "<b>Control egress</b> — allow-list destinations so a compromised workload cannot ship data anywhere.",
      "<b>Put a WAF and DDoS protection</b> in front of public applications.",
      "<b>Enable flow logs</b> for investigation and anomaly detection.",
      "<b>Build a data perimeter</b> so valid credentials alone cannot move data outside the boundary.",
    ],
    providers: {
      aws: "<p>Security groups + NACLs · PrivateLink/VPC endpoints · Network Firewall egress · WAF + Shield · Session Manager.</p>",
      azure:
        "<p>NSGs + Azure Firewall · Private Endpoints · App Gateway WAF · Bastion + JIT · DDoS Protection.</p>",
      gcp: "<p>VPC firewall + hierarchical policies · Private Service Connect · Cloud Armor · IAP · <b>VPC Service Controls</b>.</p>",
    },
  },
  {
    id: "data",
    domain: "Data Protection",
    tier: "engineer",
    certs: ALL_CERTS,
    goal: "Know where sensitive data is, keep it private and encrypted, and control the keys.",
    checklist: [
      "<b>Block public access</b> to storage at the account/org level, preventively.",
      "<b>Classify and discover</b> sensitive data — you cannot protect what you have not found.",
      "<b>Encrypt at rest with customer-managed keys</b> where control or revocation matters.",
      "<b>Enforce TLS in transit</b> and manage certificates centrally with auto-renewal.",
      "<b>Rotate keys</b> on a schedule and separate key-use permissions from data-read permissions.",
      "<b>Enable data-plane logging</b> on sensitive stores so access can be proven or disproven.",
      "<b>Restrict snapshot/image sharing</b> and keep backups encrypted with unshared keys.",
      "<b>Apply retention and lifecycle</b> so 'temporary' data does not live forever.",
    ],
    providers: {
      aws: "<p>S3 Block Public Access · KMS CMKs · Macie · ACM · S3 data events · EBS snapshot public-access block.</p>",
      azure:
        "<p>Disallow anonymous blob access · Key Vault / Managed HSM CMK · Purview · storage diagnostics.</p>",
      gcp: "<p>Public access prevention · Cloud KMS CMEK (+EKM) · Sensitive Data Protection · Data Access logs.</p>",
    },
  },
  {
    id: "compute",
    domain: "Compute & Containers",
    tier: "engineer",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    goal: "Harden the workload, give it its own least-privilege identity, and make escape and tampering hard.",
    checklist: [
      "<b>Patch automatically</b> and build from hardened golden images.",
      "<b>Enforce hardened instance metadata</b> to break the SSRF credential-theft chain.",
      "<b>Per-workload cloud identity</b> — never share the node or default identity.",
      "<b>Block privileged containers</b>, host mounts, and root users at admission.",
      "<b>Scan images</b> for vulnerabilities and secrets; use minimal, signed base images.",
      "<b>Enforce trusted images only</b> via admission/binary authorization.",
      "<b>Enable runtime threat detection</b> for workloads and clusters.",
      "<b>Rebuild, don't clean</b> compromised nodes and instances.",
    ],
    providers: {
      aws: "<p>SSM Patch Manager · IMDSv2 required · IRSA · Pod Security Standards · ECR scanning · GuardDuty EKS.</p>",
      azure:
        "<p>Update Manager · Managed Identity · Azure Policy for AKS · ACR + Defender for Containers · private clusters.</p>",
      gcp: "<p>OS Config patching · Workload Identity · metadata concealment · Binary Authorization · GKE Autopilot.</p>",
    },
  },
  {
    id: "logging",
    domain: "Logging & Detection",
    tier: "associate",
    certs: ALL_CERTS,
    goal: "Capture what happened, keep it tamper-proof, and detect the things that matter.",
    checklist: [
      "<b>Enable control-plane audit logging</b> across all regions and accounts, organisation-wide.",
      "<b>Enable data-plane logging</b> on sensitive data stores.",
      "<b>Centralise logs</b> into a separate, locked-down security account or project.",
      "<b>Make logs immutable</b> with object lock or retention locks, and validate integrity.",
      "<b>Alert on logging changes</b> — stop, delete, retention reduction — at high severity.",
      "<b>Turn on managed threat detection</b> and route findings into a real response workflow.",
      "<b>Monitor log-source health</b>; a silent source is a blind spot wearing a green tick.",
      "<b>Define retention</b> deliberately — retro-hunts stop at the retention boundary.",
    ],
    providers: {
      aws: "<p>Org CloudTrail → log-archive account · Object Lock · GuardDuty + Security Hub · VPC Flow Logs.</p>",
      azure:
        "<p>Activity + diagnostic logs → Log Analytics · Defender for Cloud · <b>Sentinel</b> · immutable storage.</p>",
      gcp: "<p>Cloud Audit Logs (enable Data Access) · aggregated sinks · SCC + Event Threat Detection · Chronicle.</p>",
    },
  },
  {
    id: "governance",
    domain: "Governance & Compliance",
    tier: "architect",
    certs: ALL_CERTS,
    goal: "Make the secure path the default and the insecure path impossible — centrally, not team by team.",
    checklist: [
      "<b>Use a resource hierarchy</b> with many accounts/subscriptions/projects to limit blast radius.",
      "<b>Apply preventive guardrails</b> centrally — deny risky actions rather than detecting them later.",
      "<b>Standardise with a landing zone</b> so new environments start secure.",
      "<b>Restrict regions</b> to meet residency and reduce attack surface.",
      "<b>Codify policy</b> and version it; review changes like code.",
      "<b>Alert on guardrail changes</b> and require exceptions to expire.",
      "<b>Run CSPM continuously</b> against CIS benchmarks and track the score.",
      "<b>Map controls to frameworks</b> (SOC 2 / ISO / PCI) and keep evidence current.",
    ],
    providers: {
      aws: "<p>Organizations + <b>SCPs</b> · Control Tower · Config conformance packs · Security Hub standards.</p>",
      azure:
        "<p>Management groups + <b>Azure Policy</b> · Landing Zones · Defender regulatory compliance.</p>",
      gcp: "<p>Org → Folder → Project · <b>Org Policy constraints</b> · security foundations blueprint · Assured Workloads.</p>",
    },
  },
];

/* ==================================================================
   Free resources
   ================================================================== */

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

export const RESOURCES: ResourceGroup[] = [
  {
    group: "Hands-on labs — break it to learn it",
    items: [
      {
        name: "flaws.cloud",
        description: "The classic free AWS security challenge — S3, IAM, and metadata mistakes, level by level.",
        url: "http://flaws.cloud/",
        tag: "aws",
      },
      {
        name: "flaws2.cloud",
        description: "Sequel covering both attacker and defender tracks, including container and Lambda paths.",
        url: "http://flaws2.cloud/",
        tag: "aws",
      },
      {
        name: "CloudGoat",
        description: "Rhino Security's deliberately vulnerable AWS environment — deploy real escalation scenarios with Terraform.",
        url: "https://github.com/RhinoSecurityLabs/cloudgoat",
        tag: "aws",
      },
      {
        name: "AzureGoat",
        description: "Vulnerable-by-design Azure environment covering storage, functions, and identity abuse.",
        url: "https://github.com/ine-labs/AzureGoat",
        tag: "azure",
      },
      {
        name: "GCPGoat",
        description: "The GCP equivalent — practise IAM escalation and data exposure safely in your own project.",
        url: "https://github.com/ine-labs/GCPGoat",
        tag: "gcp",
      },
      {
        name: "Kubernetes Goat",
        description: "Interactive Kubernetes security playground — container escape, RBAC abuse, secrets exposure.",
        url: "https://madhuakula.com/kubernetes-goat/",
        tag: "k8s",
      },
      {
        name: "IAM Vulnerable",
        description: "Terraform lab dedicated to AWS IAM privilege-escalation paths — the best way to actually understand them.",
        url: "https://github.com/BishopFox/iam-vulnerable",
        tag: "aws",
      },
      {
        name: "Pwned Labs",
        description: "Free browser-based cloud security labs across AWS, Azure, and GCP with guided walkthroughs.",
        url: "https://pwnedlabs.io/",
        tag: "multi",
      },
    ],
  },
  {
    group: "Official baselines & documentation",
    items: [
      {
        name: "AWS Well-Architected — Security Pillar",
        description: "AWS's own definition of what good looks like. Interviewers reference it constantly.",
        url: "https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html",
        tag: "aws",
      },
      {
        name: "Microsoft Cloud Security Benchmark",
        description: "Azure's control baseline mapped to CIS and NIST, with per-service guidance.",
        url: "https://learn.microsoft.com/en-us/security/benchmark/azure/",
        tag: "azure",
      },
      {
        name: "Google Cloud security best practices",
        description: "Google's security foundations blueprint and hardening guidance for GCP.",
        url: "https://cloud.google.com/security/best-practices",
        tag: "gcp",
      },
      {
        name: "CIS Benchmarks",
        description: "The de-facto secure-configuration standard for AWS, Azure, GCP, and Kubernetes. Free PDFs.",
        url: "https://www.cisecurity.org/cis-benchmarks",
        tag: "standard",
      },
      {
        name: "MITRE ATT&CK — Cloud Matrix",
        description: "The cloud tactics and techniques reference this page's deep dive is built on.",
        url: "https://attack.mitre.org/matrices/enterprise/cloud/",
        tag: "framework",
      },
      {
        name: "NIST Cybersecurity Framework",
        description: "Identify/Protect/Detect/Respond/Recover — the framework most compliance mapping starts from.",
        url: "https://www.nist.gov/cyberframework",
        tag: "framework",
      },
      {
        name: "Cloud Security Alliance — CCM",
        description: "Cloud Controls Matrix: control objectives mapped across standards. Core CCSP reading.",
        url: "https://cloudsecurityalliance.org/research/cloud-controls-matrix",
        tag: "standard",
      },
      {
        name: "OWASP Cloud-Native Security Top 10",
        description: "The most common cloud-native security failures, with practical remediation.",
        url: "https://owasp.org/www-project-cloud-native-application-security-top-10/",
        tag: "framework",
      },
    ],
  },
  {
    group: "Free tools you should be able to name",
    items: [
      {
        name: "Prowler",
        description: "Open-source multi-cloud security assessment — hundreds of CIS checks for AWS, Azure, and GCP.",
        url: "https://github.com/prowler-cloud/prowler",
        tag: "cspm",
      },
      {
        name: "ScoutSuite",
        description: "Multi-cloud auditing tool producing an offline HTML report of misconfigurations.",
        url: "https://github.com/nccgroup/ScoutSuite",
        tag: "cspm",
      },
      {
        name: "Checkov",
        description: "IaC scanner for Terraform, CloudFormation, ARM, and Kubernetes — the standard shift-left tool.",
        url: "https://www.checkov.io/",
        tag: "iac",
      },
      {
        name: "Trivy",
        description: "Scans images, filesystems, and IaC for vulnerabilities and secrets. Fast and everywhere in pipelines.",
        url: "https://trivy.dev/",
        tag: "scanning",
      },
      {
        name: "Pacu",
        description: "AWS exploitation framework — the offensive counterpart that teaches you what to detect.",
        url: "https://github.com/RhinoSecurityLabs/pacu",
        tag: "offensive",
      },
      {
        name: "PMapper",
        description: "Maps AWS IAM privilege-escalation paths as a graph — shows toxic permission combinations.",
        url: "https://github.com/nccgroup/PMapper",
        tag: "iam",
      },
      {
        name: "ROADtools / AzureHound",
        description: "Enumerate and visualise Entra ID relationships and attack paths in Azure.",
        url: "https://github.com/dirkjanm/ROADtools",
        tag: "azure",
      },
      {
        name: "kube-bench",
        description: "Checks Kubernetes clusters against the CIS Kubernetes Benchmark.",
        url: "https://github.com/aquasecurity/kube-bench",
        tag: "k8s",
      },
      {
        name: "Steampipe",
        description: "Query your cloud configuration with SQL — brilliant for ad-hoc posture questions.",
        url: "https://steampipe.io/",
        tag: "cspm",
      },
    ],
  },
  {
    group: "Learn from practitioners",
    items: [
      {
        name: "Hacking the Cloud",
        description: "Encyclopedia of offensive cloud techniques by service. Read it to understand what defenders face.",
        url: "https://hackingthe.cloud/",
        tag: "offensive",
      },
      {
        name: "fwd:cloudsec",
        description: "The leading cloud security conference — all talks are free on YouTube and genuinely deep.",
        url: "https://fwdcloudsec.org/",
        tag: "talks",
      },
      {
        name: "tl;dr sec",
        description: "Clint Gibler's newsletter — the best weekly roundup of cloud and appsec research.",
        url: "https://tldrsec.com/",
        tag: "newsletter",
      },
      {
        name: "Last Week in AWS — Security",
        description: "Corey Quinn's irreverent but sharp coverage of AWS changes, including security ones.",
        url: "https://www.lastweekinaws.com/",
        tag: "newsletter",
      },
      {
        name: "Cloud Security Podcast",
        description: "Interviews with practitioners on real cloud security programmes — great for interview vocabulary.",
        url: "https://cloudsecuritypodcast.tv/",
        tag: "podcast",
      },
      {
        name: "Wiz Cloud Threat Landscape",
        description: "Free database of cloud incidents, threat actors, and techniques — excellent scenario source.",
        url: "https://www.wiz.io/cloud-threat-landscape",
        tag: "intel",
      },
      {
        name: "Rami McCarthy / Securosis writing",
        description: "Practical, opinionated cloud security engineering essays worth reading end to end.",
        url: "https://ramimac.me/",
        tag: "blog",
      },
      {
        name: "SANS Cloud Security posters",
        description: "Free reference posters summarising AWS/Azure/GCP security services side by side.",
        url: "https://www.sans.org/posters/?focus-area=cloud-security",
        tag: "reference",
      },
    ],
  },
  {
    group: "Certification prep (free tiers)",
    items: [
      {
        name: "AWS Skill Builder — Security Specialty",
        description: "Free digital training and the official exam guide for AWS Certified Security – Specialty (SCS).",
        url: "https://skillbuilder.aws/",
        tag: "aws-scs",
      },
      {
        name: "Microsoft Learn — AZ-500",
        description: "Microsoft's complete free learning path for Azure Security Engineer Associate.",
        url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-security-engineer/",
        tag: "az-500",
      },
      {
        name: "Google Cloud Skills Boost",
        description: "Free-tier labs and the learning path for Professional Cloud Security Engineer (PCSE).",
        url: "https://www.cloudskillsboost.google/paths/18",
        tag: "gcp-pcse",
      },
      {
        name: "ISC² CCSP exam outline",
        description: "The official CCSP domain breakdown — use it as a checklist against this page's sections.",
        url: "https://www.isc2.org/certifications/ccsp",
        tag: "ccsp",
      },
      {
        name: "AWS free tier",
        description: "Build the labs yourself — nothing teaches cloud security like your own misconfigured account.",
        url: "https://aws.amazon.com/free/",
        tag: "practice",
      },
      {
        name: "Azure free account",
        description: "Free credits and always-free services for hands-on Entra ID and Defender practice.",
        url: "https://azure.microsoft.com/en-us/free/",
        tag: "practice",
      },
    ],
  },
];

export const RESOURCE_COUNT = RESOURCES.reduce((a, g) => a + g.items.length, 0);
