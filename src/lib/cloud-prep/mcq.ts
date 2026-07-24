/**
 * Multiple-choice practice questions for the Cloud Security prep kit.
 * `answer` is the 0-based index into `options`. `provider` is omitted for
 * cloud-agnostic questions (they show under every provider filter).
 * Explanations are plain English — they teach, not just confirm.
 */
import type { Cert, Provider, Tier } from "./data";

export interface CloudMCQ {
  id: number;
  tier: Tier;
  provider?: Provider;
  category: string;
  certs: Cert[];
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const ALL: Cert[] = ["aws-scs", "az-500", "gcp-pcse", "ccsp"];

export const CLOUD_MCQS: CloudMCQ[] = [
  /* ---------------- Shared Responsibility ---------------- */
  {
    id: 1,
    tier: "associate",
    category: "Shared Responsibility",
    certs: ALL,
    question: "Under the shared responsibility model, which is ALWAYS the customer's responsibility?",
    options: [
      "Physical security of the data centre",
      "Your data, identities, and access configuration",
      "Patching the hypervisor",
      "Maintaining the provider's global network",
    ],
    answer: 1,
    explanation:
      "<p>The provider secures the cloud itself — buildings, hardware, the hypervisor. <b>You always own your data, who can access it, and how you configure things</b>, in every service model. That is exactly where nearly all cloud breaches happen.</p>",
  },
  {
    id: 2,
    tier: "associate",
    category: "Shared Responsibility",
    certs: ALL,
    question: "Moving from IaaS to SaaS changes your responsibility how?",
    options: [
      "You take on more responsibility, including the hypervisor",
      "You take on less — but identity and data stay yours",
      "Responsibility becomes entirely the provider's",
      "Nothing changes at all",
    ],
    answer: 1,
    explanation:
      "<p>The further you move toward SaaS, the more the provider runs for you (OS, runtime, platform). But <b>identity and data never transfer</b> — you still decide who can log in and what they can reach.</p>",
  },

  /* ---------------- IAM & Identity ---------------- */
  {
    id: 3,
    tier: "associate",
    category: "IAM & Identity",
    certs: ALL,
    question: "What is the safest way to give an application running on a cloud VM access to storage?",
    options: [
      "Store an access key in an environment variable",
      "Attach a least-privilege role/managed identity to the VM",
      "Hardcode credentials in the application config",
      "Use the root/global-admin account credentials",
    ],
    answer: 1,
    explanation:
      "<p>Attach an identity to the VM itself. The cloud then hands the app <b>short-lived credentials that rotate automatically</b>, so there is no static key to leak, copy, or forget to rotate.</p>",
  },
  {
    id: 4,
    tier: "engineer",
    provider: "aws",
    category: "IAM & Identity",
    certs: ["aws-scs"],
    question: "Which AWS permission pair is a classic privilege-escalation path?",
    options: [
      "s3:GetObject + s3:ListBucket",
      "iam:PassRole + lambda:CreateFunction",
      "ec2:DescribeInstances + ec2:DescribeTags",
      "cloudwatch:GetMetricData + logs:FilterLogEvents",
    ],
    answer: 1,
    explanation:
      "<p>Being able to <b>pass a powerful role to a service you control</b> means you can create a Lambda that runs as that role — and then do anything it can do. Neither permission looks dangerous alone; the combination is the problem.</p>",
  },
  {
    id: 5,
    tier: "associate",
    category: "IAM & Identity",
    certs: ALL,
    question: "Why is a hardware security key (FIDO2) better than an app push notification for admins?",
    options: [
      "It is cheaper to deploy",
      "It is phishing-resistant and cannot be approved by mistake or fatigue",
      "It works without any user interaction",
      "It replaces the need for a password entirely in all systems",
    ],
    answer: 1,
    explanation:
      "<p>Push approvals can be phished or simply worn down — spam someone at 3am and eventually they tap 'approve'. A security key is <b>bound to the real website</b>, so it cannot be tricked into approving a fake login.</p>",
  },
  {
    id: 6,
    tier: "engineer",
    provider: "azure",
    category: "IAM & Identity",
    certs: ["az-500"],
    question: "Which Azure role should be treated as equivalent to full admin in reviews?",
    options: ["Reader", "User Access Administrator", "Backup Operator", "Monitoring Contributor"],
    answer: 1,
    explanation:
      "<p><b>User Access Administrator can grant any role to anyone</b> — including making itself Owner. If you can assign permissions, you effectively have every permission, so review it as if it were admin.</p>",
  },
  {
    id: 7,
    tier: "engineer",
    provider: "gcp",
    category: "IAM & Identity",
    certs: ["gcp-pcse"],
    question: "What is the recommended way to eliminate service-account keys in GCP?",
    options: [
      "Rotate the JSON key files every 30 days",
      "Use Workload Identity / Workload Identity Federation",
      "Store the key files in Cloud Storage",
      "Base64-encode the keys before committing them",
    ],
    answer: 1,
    explanation:
      "<p>Workload Identity lets a workload prove who it is and get <b>short-lived tokens</b> — no key file exists at all. You can even set an org policy that blocks anyone from creating SA keys.</p>",
  },
  {
    id: 8,
    tier: "engineer",
    category: "IAM & Identity",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    question: "A vendor asks you to create a cross-account role. What must you include?",
    options: [
      "A wildcard principal so their tooling works",
      "A specific account ID plus a unique external ID condition",
      "Admin permissions to avoid support issues",
      "A shared static access key",
    ],
    answer: 1,
    explanation:
      "<p>Pin the trust to <b>their account ID and a secret external ID</b>. Without it, anyone who guesses the role name could assume it — the 'confused deputy' problem the external ID exists to prevent.</p>",
  },
  {
    id: 9,
    tier: "associate",
    category: "IAM & Identity",
    certs: ALL,
    question: "What should you do with the root / global-admin account?",
    options: [
      "Use it for daily administration so actions are consistent",
      "Lock it with hardware MFA, remove its keys, and alert on any sign-in",
      "Share it with the whole platform team",
      "Create access keys for automation to use",
    ],
    answer: 1,
    explanation:
      "<p>The top-level account can do anything and bypass most guardrails. Lock it away with a hardware key, delete any access keys, never use it day-to-day, and <b>alert immediately if it ever signs in</b>.</p>",
  },
  {
    id: 10,
    tier: "engineer",
    category: "IAM & Identity",
    certs: ALL,
    question: "An attacker added their own certificate to an existing app identity. Why is a password reset insufficient?",
    options: [
      "Because certificates expire on their own anyway",
      "Because the credential is attached to the identity, not the user's password",
      "Because passwords are not used in cloud at all",
      "Because the certificate only works from inside the network",
    ],
    answer: 1,
    explanation:
      "<p>They planted a <b>second key on the identity itself</b>. Resetting a user password does nothing to it — you must find and remove that added credential, then audit every other identity for the same trick.</p>",
  },

  /* ---------------- Network Security ---------------- */
  {
    id: 11,
    tier: "associate",
    category: "Network Security",
    certs: ALL,
    question: "Which finding should you treat as most urgent?",
    options: [
      "A dev VM with an outdated tag",
      "RDP (3389) open to 0.0.0.0/0 on a production server",
      "A load balancer using TLS 1.2",
      "An S3 bucket with versioning disabled",
    ],
    answer: 1,
    explanation:
      "<p>Remote-desktop open to the entire internet gets found by automated scanners within hours and brute-forced. It is one of the <b>most common ways attackers get their first foothold</b> in cloud.</p>",
  },
  {
    id: 12,
    tier: "engineer",
    category: "Network Security",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    question: "What is the main purpose of private endpoints / PrivateLink?",
    options: [
      "To make traffic faster by compressing it",
      "To reach managed services over the private network instead of the internet",
      "To encrypt data at rest",
      "To replace the need for IAM permissions",
    ],
    answer: 1,
    explanation:
      "<p>They give a managed service a private address inside your network, so traffic <b>never crosses the public internet</b> — and you can then block the public endpoint entirely.</p>",
  },
  {
    id: 13,
    tier: "architect",
    provider: "gcp",
    category: "Network Security",
    certs: ["gcp-pcse"],
    question: "Which GCP control is designed specifically to prevent data exfiltration even with valid credentials?",
    options: ["Cloud Armor", "VPC Service Controls", "Cloud NAT", "Identity-Aware Proxy"],
    answer: 1,
    explanation:
      "<p><b>VPC Service Controls</b> draws a perimeter around your services, so even someone holding legitimate credentials cannot copy data to a project outside that boundary.</p>",
  },
  {
    id: 14,
    tier: "engineer",
    category: "Network Security",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    question: "An engineer needs SSH access to debug a production VM. What is the best answer?",
    options: [
      "Temporarily open port 22 to their home IP",
      "Use a bastion, just-in-time access, or identity-aware proxy",
      "Open port 22 to 0.0.0.0/0 for an hour",
      "Give them the private key by email",
    ],
    answer: 1,
    explanation:
      "<p>Give access through a controlled, logged path that expires. 'Temporary' firewall rules are famous for becoming permanent — the whole class of problem disappears if <b>public admin ports simply are not possible</b>.</p>",
  },
  {
    id: 15,
    tier: "engineer",
    category: "Network Security",
    certs: ALL,
    question: "Why does egress (outbound) filtering matter for cloud security?",
    options: [
      "It speeds up downloads",
      "It stops a compromised workload from shipping your data anywhere it likes",
      "It is required to use TLS",
      "It replaces the need for a WAF",
    ],
    answer: 1,
    explanation:
      "<p>Most controls focus on who gets <i>in</i>. Egress control limits where your workloads can send data <b>out</b> — which is what actually stops exfiltration after something is compromised.</p>",
  },

  /* ---------------- Data Protection ---------------- */
  {
    id: 16,
    tier: "associate",
    category: "Data Protection",
    certs: ALL,
    question: "What is the single most effective control against accidental public storage?",
    options: [
      "Weekly manual reviews of bucket permissions",
      "An account/org-level 'block public access' setting enforced by policy",
      "Renaming buckets to hard-to-guess names",
      "Turning on versioning",
    ],
    answer: 1,
    explanation:
      "<p>Block it centrally so an individual engineer <b>cannot</b> make something public, even by accident. Preventing it beats detecting it later — and hard-to-guess names are not security, since scanners find them anyway.</p>",
  },
  {
    id: 17,
    tier: "engineer",
    category: "Data Protection",
    certs: ALL,
    question: "You need to prove whether files in a storage bucket were actually downloaded. What must have been enabled?",
    options: [
      "Control-plane / management audit logging",
      "Data-plane (object-level) access logging",
      "Encryption at rest",
      "Versioning",
    ],
    answer: 1,
    explanation:
      "<p>Control-plane logs show the bucket <i>settings</i> changing. Only <b>data-plane logs record individual object reads</b>. Without them you cannot disprove access — which usually forces an expensive, conservative breach assumption.</p>",
  },
  {
    id: 18,
    tier: "engineer",
    category: "Data Protection",
    certs: ALL,
    question: "What is the main advantage of customer-managed keys (CMK/CMEK) over provider-managed keys?",
    options: [
      "They are faster",
      "You control rotation and can revoke access by disabling the key",
      "They are free",
      "They remove the need for access policies",
    ],
    answer: 1,
    explanation:
      "<p>Data is encrypted either way. With your own key <b>you hold the off switch</b> — disable it and everything it protects becomes unreadable instantly, which is powerful for revocation and for proving control to auditors.</p>",
  },
  {
    id: 19,
    tier: "architect",
    category: "Data Protection",
    certs: ["ccsp", "aws-scs", "az-500", "gcp-pcse"],
    question: "Why is encrypting snapshots with an unshared key valuable?",
    options: [
      "It makes snapshots smaller",
      "If a snapshot is accidentally shared publicly, it is useless without the key",
      "It speeds up restores",
      "It removes the need for IAM controls",
    ],
    answer: 1,
    explanation:
      "<p>A public snapshot can be restored by anyone into their own account — bypassing all your network controls. If it is encrypted with a key you never shared, <b>the data stays unreadable</b>.</p>",
  },
  {
    id: 20,
    tier: "engineer",
    category: "Data Protection",
    certs: ALL,
    question: "Where should application secrets live?",
    options: [
      "In environment variables committed to the repo",
      "In a managed secrets store, accessed via workload identity",
      "In the container image so they deploy together",
      "In the CI/CD pipeline definition file",
    ],
    answer: 1,
    explanation:
      "<p>Use a secrets manager and let the workload's own identity fetch what it needs at runtime. Anything baked into <b>code, images, or pipeline files leaks</b> — image layers keep deleted files, and repos get shared.</p>",
  },

  /* ---------------- Compute & Workload ---------------- */
  {
    id: 21,
    tier: "engineer",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    question: "Which pod configuration most increases the risk of a container escape?",
    options: [
      "Running with a read-only root filesystem",
      "privileged: true with a hostPath mount",
      "Setting CPU and memory limits",
      "Using a non-root user ID",
    ],
    answer: 1,
    explanation:
      "<p>A privileged container with access to the host filesystem is barely isolated at all — it is the standard route to <b>break out onto the node</b> and steal its identity and secrets.</p>",
  },
  {
    id: 22,
    tier: "engineer",
    provider: "aws",
    category: "Compute & Workload",
    certs: ["aws-scs"],
    question: "What does enforcing IMDSv2 protect against?",
    options: [
      "Cross-site scripting in the app",
      "SSRF being used to steal the instance's credentials",
      "Brute-force attacks on SSH",
      "Denial of service",
    ],
    answer: 1,
    explanation:
      "<p>IMDSv2 requires a session token obtained by a PUT request, which a simple SSRF bug usually cannot perform. <b>That one setting breaks the whole credential-theft chain</b> — it is the fix behind the famous Capital One breach.</p>",
  },
  {
    id: 23,
    tier: "engineer",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    question: "Why should each pod have its own cloud identity rather than using the node's?",
    options: [
      "It is faster to authenticate",
      "So one compromised pod does not inherit permissions meant for everything on the node",
      "Because nodes cannot have identities",
      "To reduce cluster costs",
    ],
    answer: 1,
    explanation:
      "<p>If every pod shares the node's identity, compromising the weakest app gives an attacker <b>the permissions of all of them</b>. Per-pod identity keeps the blast radius to that one workload.</p>",
  },
  {
    id: 24,
    tier: "engineer",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    question: "What does Binary Authorization / admission control enforce?",
    options: [
      "That only trusted, attested images can be deployed",
      "That containers restart automatically",
      "That images are compressed",
      "That secrets are encrypted at rest",
    ],
    answer: 0,
    explanation:
      "<p>It checks images at deploy time and <b>refuses anything unsigned or unscanned</b> — so a malicious or unvetted image cannot reach production even if someone pushes it to the registry.</p>",
  },
  {
    id: 25,
    tier: "engineer",
    category: "Compute & Workload",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    question: "In serverless, what is the primary security boundary you control?",
    options: [
      "The host operating system patch level",
      "The function's IAM role, its code/dependencies, and who can invoke it",
      "The hypervisor configuration",
      "The physical network topology",
    ],
    answer: 1,
    explanation:
      "<p>The provider handles the OS entirely. Your risk moves to <b>the permissions you attach, the code and packages you ship, and who is allowed to call the function</b> — a publicly invokable function is running your code for strangers.</p>",
  },

  /* ---------------- Logging & Detection ---------------- */
  {
    id: 26,
    tier: "associate",
    category: "Logging & Detection",
    certs: ALL,
    question: "An attacker disables audit logging in an unused region. How should this be treated?",
    options: [
      "As routine admin housekeeping",
      "As a high-severity intrusion indicator, investigated every time",
      "As a cost optimisation",
      "As a low-priority ticket for next sprint",
    ],
    answer: 1,
    explanation:
      "<p>Legitimate admins almost never turn logging off. It is a classic <b>defence-evasion step</b> — usually done right before something worse, and often in a quiet region hoping nobody watches.</p>",
  },
  {
    id: 27,
    tier: "engineer",
    category: "Logging & Detection",
    certs: ALL,
    question: "Why should logs be delivered to a separate, locked-down account or project?",
    options: [
      "To reduce storage costs",
      "So a compromised workload account cannot delete its own evidence",
      "To improve query performance",
      "Because logs cannot be stored locally",
    ],
    answer: 1,
    explanation:
      "<p>If the logs live in the same account the attacker controls, they can erase them. A separate account with <b>immutable, retention-locked storage</b> means the evidence survives the compromise.</p>",
  },
  {
    id: 28,
    tier: "associate",
    provider: "aws",
    category: "Logging & Detection",
    certs: ["aws-scs"],
    question: "Which AWS service records API calls and is the primary investigation source?",
    options: ["CloudWatch", "CloudTrail", "Config", "Inspector"],
    answer: 1,
    explanation:
      "<p><b>CloudTrail</b> is the who-did-what-and-when log for every API call. Enable it organisation-wide and multi-region — it is the first place you look in any AWS investigation.</p>",
  },
  {
    id: 29,
    tier: "engineer",
    category: "Logging & Detection",
    certs: ALL,
    question: "What is the highest-fidelity signal that workload credentials have been stolen?",
    options: [
      "High CPU usage on the instance",
      "The workload's role credentials being used from an IP outside your cloud",
      "A failed login to the console",
      "An unusually large log file",
    ],
    answer: 1,
    explanation:
      "<p>A VM's identity should only ever be used <i>by that VM</i>, inside the cloud. Seeing it used from somewhere else is almost never legitimate — it is <b>the clearest sign the credentials were exfiltrated</b>.</p>",
  },

  /* ---------------- Posture Management ---------------- */
  {
    id: 30,
    tier: "associate",
    category: "Posture Management",
    certs: ALL,
    question: "What does CSPM primarily do?",
    options: [
      "Blocks malware at runtime",
      "Continuously checks cloud configuration against benchmarks and flags misconfigurations",
      "Encrypts data in transit",
      "Manages user passwords",
    ],
    answer: 1,
    explanation:
      "<p>CSPM answers 'is anything misconfigured right now?' across all your accounts — public storage, open ports, missing encryption — measured against standards like the <b>CIS Benchmarks</b>.</p>",
  },
  {
    id: 31,
    tier: "architect",
    category: "Posture Management",
    certs: ALL,
    question: "What does CIEM add beyond CSPM?",
    options: [
      "Runtime malware scanning",
      "Analysis of identities, entitlements, and excess permissions",
      "Network packet capture",
      "Backup management",
    ],
    answer: 1,
    explanation:
      "<p>CSPM looks at <i>configuration</i>; <b>CIEM looks at who can do what</b> — unused permissions, escalation paths, and over-privileged identities. A CNAPP bundles both plus workload protection.</p>",
  },
  {
    id: 32,
    tier: "associate",
    category: "Posture Management",
    certs: ALL,
    question: "Which is the industry-standard secure-configuration baseline for cloud platforms?",
    options: ["OWASP Top 10", "CIS Benchmarks", "RFC 1918", "ITIL"],
    answer: 1,
    explanation:
      "<p>The <b>CIS Benchmarks</b> give a prescriptive, control-by-control baseline for each cloud. Most posture tools score you directly against them. (OWASP Top 10 is about application risks.)</p>",
  },

  /* ---------------- Governance & Compliance ---------------- */
  {
    id: 33,
    tier: "architect",
    category: "Compliance & Governance",
    certs: ALL,
    question: "Why are preventive guardrails preferred over detective controls?",
    options: [
      "They are cheaper to license",
      "They stop the risky change from happening instead of reporting it afterwards",
      "They generate more alerts",
      "They remove the need for logging",
    ],
    answer: 1,
    explanation:
      "<p>A detective control tells you a bucket went public — after it went public. A preventive guardrail means the change is <b>refused outright</b>, so the risk window never opens.</p>",
  },
  {
    id: 34,
    tier: "architect",
    provider: "aws",
    category: "Compliance & Governance",
    certs: ["aws-scs"],
    question: "What is the purpose of an AWS Service Control Policy (SCP)?",
    options: [
      "To grant permissions to users",
      "To set the maximum permissions available in an account, even for admins",
      "To encrypt S3 objects",
      "To route network traffic",
    ],
    answer: 1,
    explanation:
      "<p>SCPs are a <b>ceiling, not a grant</b>. They cap what anyone in an account can do — including the account's own administrators — which is why they are the strongest AWS guardrail.</p>",
  },
  {
    id: 35,
    tier: "architect",
    category: "Compliance & Governance",
    certs: ["ccsp", "aws-scs", "az-500", "gcp-pcse"],
    question: "Why use many accounts/subscriptions/projects instead of one large one?",
    options: [
      "It reduces the monthly bill automatically",
      "It isolates blast radius and lets guardrails apply per environment",
      "It is required by all providers",
      "It removes the need for IAM",
    ],
    answer: 1,
    explanation:
      "<p>Separation means a compromise or mistake in one environment <b>cannot reach the others</b>, and you can apply different guardrails to prod, dev, and regulated workloads.</p>",
  },

  /* ---------------- DevSecOps & IaC ---------------- */
  {
    id: 36,
    tier: "engineer",
    category: "DevSecOps & IaC",
    certs: ["aws-scs", "az-500", "gcp-pcse"],
    question: "What is the benefit of scanning Terraform in the pipeline?",
    options: [
      "It makes deployments faster",
      "Misconfigurations are caught before they ever reach the cloud",
      "It replaces the need for CSPM entirely",
      "It encrypts the state file",
    ],
    answer: 1,
    explanation:
      "<p>'Shift left' — a public bucket blocked at the pull request never becomes a real finding. It is far cheaper to fix <b>one template than thirty deployed resources</b>.</p>",
  },
  {
    id: 37,
    tier: "engineer",
    category: "DevSecOps & IaC",
    certs: ["aws-scs", "az-500", "gcp-pcse", "ccsp"],
    question: "How should a CI/CD pipeline authenticate to the cloud?",
    options: [
      "A long-lived access key stored as a CI secret",
      "Short-lived credentials via OIDC federation, scoped to repo and branch",
      "The root account credentials",
      "A shared key committed to the repository",
    ],
    answer: 1,
    explanation:
      "<p>With OIDC federation <b>there is no stored secret at all</b> — the pipeline proves its identity and gets a short-lived token. Scoping it to a repo and branch means even a valid token cannot deploy from a fork.</p>",
  },
  {
    id: 38,
    tier: "engineer",
    category: "DevSecOps & IaC",
    certs: ALL,
    question: "A key was leaked in a public repo. The developer deleted the commit. Is that enough?",
    options: [
      "Yes, the commit is gone",
      "No — the key must be rotated; it stays in git history and in scrapers' databases",
      "Yes, if the repo is made private afterwards",
      "Only if fewer than 24 hours have passed",
    ],
    answer: 1,
    explanation:
      "<p>Automated scrapers grab public keys <b>within minutes</b> and keep them forever. The secret still exists in git history too. Rotating the credential is the only real fix — deleting the commit is cosmetic.</p>",
  },

  /* ---------------- Incident Response ---------------- */
  {
    id: 39,
    tier: "engineer",
    category: "Incident Response",
    certs: ALL,
    question: "What makes cloud incident response different from on-premises?",
    options: [
      "Evidence is collected by physically imaging disks",
      "Identity is the perimeter, and containment and evidence collection happen through the API",
      "Logs are always retained forever by default",
      "Attackers cannot use valid credentials",
    ],
    answer: 1,
    explanation:
      "<p>You cannot walk up and unplug a server. You <b>isolate, revoke, and snapshot via the API</b>, and your evidence is whatever logging you enabled beforehand — which is why preparation matters so much.</p>",
  },
  {
    id: 40,
    tier: "architect",
    category: "Incident Response",
    certs: ALL,
    question: "Your attacker has full admin. Which backup control still protects you?",
    options: [
      "Backups protected only by IAM permissions",
      "Immutable backups with a vault/retention lock",
      "Backups in the same account with versioning",
      "Nightly snapshots tagged 'do-not-delete'",
    ],
    answer: 1,
    explanation:
      "<p>Anything protected only by permissions can be deleted by someone holding those permissions. <b>Immutability means even an admin cannot remove it</b> until the lock expires — that is what survives ransomware.</p>",
  },
];

export const CLOUD_MCQ_COUNT = CLOUD_MCQS.length;
