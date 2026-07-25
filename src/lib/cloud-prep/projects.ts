/**
 * Hands-on projects for the Cloud Security prep kit — the things you actually
 * build in a real cloud account, so you have something concrete to show.
 *
 * Every project runs on a provider free tier. `providers` says which clouds it
 * applies to, so the provider filter narrows the list.
 *
 * IMPORTANT: unlike a local lab, a cloud account can cost real money. Every
 * project assumes you have set a budget alert first — see project 01.
 */
import type { Provider, Tier } from "./data";

export interface CloudProjectStep {
  title: string;
  detail: string;
}

export interface CloudProject {
  id: number;
  tier: Tier;
  category: string;
  /** Which clouds this project can be done on. */
  providers: Provider[];
  title: string;
  tagline: string;
  outcome: string;
  proves: string;
  hours: string;
  cost: string;
  stack: string[];
  prerequisites: string[];
  steps: CloudProjectStep[];
  validation: string[];
  pitch: string;
  stretch: string[];
}

const ALL_CLOUDS: Provider[] = ["aws", "azure", "gcp"];

export const CLOUD_PROJECTS: CloudProject[] = [
  /* ================= ASSOCIATE ================= */
  {
    id: 1,
    tier: "associate",
    category: "Lab Build",
    providers: ALL_CLOUDS,
    title: "Build a safe multi-cloud lab (with a spend guardrail first)",
    tagline: "A free-tier account in each cloud, logging enabled, and a budget alert so it can never surprise you.",
    outcome:
      "<p>A working account in at least one cloud with <b>audit logging on, MFA enforced, a budget alert set</b>, and the CLI authenticated. This is the foundation for every other project here.</p>",
    proves:
      "That you can stand up and secure a cloud environment from scratch — and that you think about cost control, which is a real security-adjacent responsibility.",
    hours: "3–4 hours",
    cost: "Free tier — but set a budget alert before anything else",
    stack: ["AWS / Azure / GCP free tier", "AWS CLI, Azure CLI, or gcloud", "A password manager", "A hardware key or authenticator app"],
    prerequisites: [
      "A payment card (free tiers require one — you will not be charged if you stay in limits)",
      "<b>Do the budget alert step FIRST.</b> Cloud is not like a home lab; a mistake can cost money",
      "Never reuse a personal password on the root account",
    ],
    steps: [
      {
        title: "Set a budget alert before you build anything",
        detail:
          "<p>Genuinely do this first. <b>AWS</b>: Billing → Budgets → create a $1 and $10 alert. <b>Azure</b>: Cost Management → Budgets. <b>GCP</b>: Billing → Budgets & alerts. Set email notification at 50% / 90% / 100%. This one step is the difference between a fun lab and a bad month.</p>",
      },
      {
        title: "Lock down the root / global-admin account",
        detail:
          "<p>Enable <b>MFA on the root account</b> (hardware key if you have one), delete any root access keys, and then <b>stop using it</b>. Create a separate admin identity for daily work — AWS IAM Identity Center user, Azure user with a role assignment, GCP user with the right IAM role.</p>",
      },
      {
        title: "Turn on audit logging",
        detail:
          "<p><b>AWS</b>: create a CloudTrail trail — multi-region, log-file validation enabled. <b>Azure</b>: Activity Log is on, but add a diagnostic setting shipping to a Log Analytics workspace. <b>GCP</b>: Admin Activity logs are on by default; explicitly <b>enable Data Access logs</b>, which are not.</p>",
      },
      {
        title: "Install and authenticate the CLI",
        detail:
          "<p>Install the CLI and log in with a short-lived session, not a static key:</p><pre>aws configure sso        # AWS — SSO, not access keys\naz login                 # Azure\ngcloud auth login        # GCP</pre><p>Verify with <code>aws sts get-caller-identity</code>, <code>az account show</code>, or <code>gcloud auth list</code>.</p>",
      },
      {
        title: "Deploy something small to generate telemetry",
        detail:
          "<p>Create a storage bucket/container and a tiny VM (free-tier eligible only). You need real resources so later projects have something to scan, misconfigure, and detect.</p>",
      },
      {
        title: "Prove you can read your own audit log",
        detail:
          "<p>Perform an action (create then delete a bucket), then <b>find that exact event in the audit log</b>. Note who, what, when, and source IP. If you cannot find it, your logging is not actually working — fix that before moving on.</p>",
      },
      {
        title: "Write down a teardown procedure",
        detail:
          "<p>List every resource you created and how to delete it. Run it at the end of each session. Orphaned resources are how free-tier labs generate bills.</p>",
      },
    ],
    validation: [
      "A budget alert exists and you have tested it fires (set a $0.01 threshold temporarily).",
      "Root/global-admin has MFA and no access keys.",
      "You can find one of your own actions in the audit log with full detail.",
      "The CLI authenticates with a <b>short-lived</b> session, not a stored key.",
    ],
    pitch:
      "\"I run labs in all three clouds' free tiers. The first thing I do in any new account is set a budget alert and lock the root account with MFA — then enable audit logging and prove I can find my own actions in it. On GCP that step matters more than people expect, because Data Access logs are off by default.\"",
    stretch: [
      "Repeat in a second cloud and compare how each names the same concepts.",
      "Automate the whole setup with Terraform so it is reproducible.",
      "Add a second account/subscription and practise cross-account access properly.",
    ],
  },
  {
    id: 2,
    tier: "associate",
    category: "Data Exposure",
    providers: ALL_CLOUDS,
    title: "Expose it, detect it, then make it impossible",
    tagline: "Deliberately create the most common cloud finding — then close it preventively.",
    outcome:
      "<p>Hands-on proof that you can find public storage, prove whether it was read, and then apply the <b>account-level control that makes it impossible to recreate</b>.</p>",
    proves:
      "Public storage is the single most common cloud breach. Knowing the preventive control — not just the fix — is the difference between an analyst and an engineer.",
    hours: "2–3 hours",
    cost: "Free tier",
    stack: ["Your lab account", "Cloud CLI", "Prowler or the native posture tool"],
    prerequisites: ["Project 01 complete", "<b>Never put real data in the bucket</b> — use a dummy text file"],
    steps: [
      {
        title: "Create the misconfiguration on purpose",
        detail:
          "<p>Create a bucket with a harmless dummy file, then make it publicly readable. <b>AWS</b>: disable Block Public Access on that bucket and add a public bucket policy. <b>Azure</b>: set container access level to Blob. <b>GCP</b>: grant <code>allUsers</code> the Storage Object Viewer role.</p>",
      },
      {
        title: "Confirm it is genuinely public",
        detail:
          "<p>Open the object URL in a private browser window with no credentials — or better, <code>curl</code> it. If it downloads, it is public to the entire internet. This is exactly what a researcher's scanner sees.</p>",
      },
      {
        title: "Detect it the way a SOC would",
        detail:
          "<p>Run <b>Prowler</b> (<code>prowler aws</code> / <code>prowler azure</code> / <code>prowler gcp</code>) or check the native tool — Security Hub, Defender for Cloud, or Security Command Center. Find your bucket in the findings and read how the check is described.</p>",
      },
      {
        title: "Try to answer the question Legal asks",
        detail:
          "<p>Now try to determine <b>whether anyone actually read the object</b>. Unless you enabled data-plane logging, you cannot. Enable it (S3 data events / storage diagnostic logs / GCP Data Access logs), re-download the file, and confirm the read now appears. <b>This lesson is the whole point of the project.</b></p>",
      },
      {
        title: "Fix it preventively, not per-resource",
        detail:
          "<p>Don't just flip the bucket private. Apply the <b>account/org-level</b> control: AWS <b>S3 Block Public Access at account level</b> (plus an SCP if you have an org), Azure <b>'Allow blob anonymous access' = disabled</b> plus an Azure Policy deny, GCP <b>public access prevention</b> enforced by org policy.</p>",
      },
      {
        title: "Prove the fix holds",
        detail:
          "<p>Try to make a <b>new</b> bucket public. It should now be refused. That refusal is what a real preventive guardrail looks like — write down the exact error message, it makes a great interview detail.</p>",
      },
    ],
    validation: [
      "You confirmed public access with an unauthenticated request.",
      "Your posture tool flagged the bucket.",
      "You can now see object <b>reads</b> in the data-plane log.",
      "Creating a new public bucket is <b>refused</b> by policy.",
    ],
    pitch:
      "\"I deliberately made a bucket public in my lab to walk the full lifecycle. The lesson that stuck was the second half: with only control-plane logging I could see the bucket was made public but had no way to prove whether anything was read — which is exactly why an organisation ends up doing a conservative breach notification. Now I enable data-plane logging on anything sensitive, and I fix exposure at the account level so it can't be recreated.\"",
    stretch: [
      "Do the same for public disk snapshots and machine images.",
      "Write a detection that alerts on the ACL/policy change itself.",
      "Automate the guardrail with Terraform so new accounts inherit it.",
    ],
  },
  {
    id: 3,
    tier: "associate",
    category: "IAM",
    providers: ALL_CLOUDS,
    title: "Least-privilege audit — find and fix over-permissive identities",
    tagline: "Discover who can do what, then cut it down without breaking anything.",
    outcome:
      "<p>An access review of your own account: unused permissions identified, at least one identity right-sized, and static keys replaced with something short-lived.</p>",
    proves:
      "Over-privileged identities are the number-one cloud attack path. Doing a real review — not just describing one — is a strong signal.",
    hours: "3–4 hours",
    cost: "Free tier",
    stack: ["Cloud CLI", "AWS IAM Access Analyzer / Azure PIM / GCP IAM Recommender", "Prowler"],
    prerequisites: ["Project 01 complete", "A few identities and resources to review"],
    steps: [
      {
        title: "Inventory every identity",
        detail:
          "<p>List all users, roles, service accounts and app registrations. For each, note: what is it for, who owns it, when was it last used. <b>Anything you cannot explain is a finding.</b></p>",
      },
      {
        title: "Find the over-permissive ones",
        detail:
          "<p>Look for wildcard permissions and broad built-in roles: AWS policies with <code>\"Action\": \"*\"</code>, Azure <b>Owner</b> or <b>Contributor</b> at subscription scope, GCP <b>Editor</b> (which is close to admin). Run the native recommender — AWS Access Analyzer unused-access, GCP IAM Recommender, Azure PIM access reviews.</p>",
      },
      {
        title: "Hunt static credentials",
        detail:
          "<p>Find every long-lived key: AWS access keys (check <b>last used</b> date), Azure app registration client secrets, GCP service-account JSON keys. Each one is a leak waiting to happen. Record the age of the oldest — it is usually shocking.</p>",
      },
      {
        title: "Right-size one identity properly",
        detail:
          "<p>Pick an over-privileged identity and reduce it to only what it has actually used in the last 90 days. <b>Test that its workload still works afterwards</b> — least privilege that breaks production gets reverted, which teaches you nothing.</p>",
      },
      {
        title: "Replace a static key with short-lived credentials",
        detail:
          "<p>Take one static key and eliminate it: attach an IAM role to the compute instead, use a Managed Identity, or enable Workload Identity. Then <b>delete the key</b> and confirm the workload still functions.</p>",
      },
      {
        title: "Set a ceiling",
        detail:
          "<p>Apply something that limits maximum privilege regardless of policy drift — an AWS <b>permission boundary</b> or SCP, an Azure Policy, a GCP org policy constraint. This is what stops the review from being undone next month.</p>",
      },
    ],
    validation: [
      "You have a written inventory with an owner and purpose for every identity.",
      "At least one identity is right-sized and its workload still works.",
      "At least one static key has been eliminated, not just rotated.",
      "A ceiling control is in place.",
    ],
    pitch:
      "\"I ran a least-privilege review on my own lab account and the finding that surprised me was how many service-account keys existed that had never been used. I right-sized one role down to the actions it had actually called in 90 days, verified the workload still ran, then replaced its static key with workload identity so there was nothing left to leak. I finished by adding a permission boundary, because otherwise the review just gets undone by the next change.\"",
    stretch: [
      "Map privilege-escalation paths with PMapper (AWS) or BloodHound-style tooling.",
      "Set up federation/SSO so there are no local users at all.",
      "Automate a monthly unused-access report.",
    ],
  },
  {
    id: 4,
    tier: "associate",
    category: "Logging",
    providers: ALL_CLOUDS,
    title: "Cloud logging pipeline and your first detections",
    tagline: "Centralise audit logs, then write the alerts every cloud SOC needs.",
    outcome:
      "<p>Audit logs flowing into a queryable store, plus working alerts for the three things you always want to know: <b>root login, logging disabled, and a public-access change</b>.</p>",
    proves:
      "It's the cloud equivalent of building a SIEM. Knowing which three alerts matter most shows judgement, not just tooling.",
    hours: "4–5 hours",
    cost: "Free tier — watch log ingestion volume",
    stack: ["CloudTrail + Athena / Sentinel / Cloud Logging + BigQuery", "EventBridge / Azure Monitor alerts / Log-based alerts", "SNS / email for notification"],
    prerequisites: ["Project 01 complete with audit logging enabled"],
    steps: [
      {
        title: "Centralise the logs",
        detail:
          "<p><b>AWS</b>: CloudTrail → S3, then query with Athena. <b>Azure</b>: diagnostic settings → Log Analytics workspace (Sentinel free trial if you want the SIEM experience). <b>GCP</b>: a log sink → BigQuery or a dedicated logging bucket.</p>",
      },
      {
        title: "Learn to query it",
        detail:
          "<p>Write queries that answer real questions: all actions by one identity, all activity from one IP, everything in a region you don't use. Get comfortable — this is what an investigation actually looks like.</p>",
      },
      {
        title: "Alert 1 — root / global-admin sign-in",
        detail:
          "<p>Nobody should be using the top-level account. Alert on <b>any</b> sign-in to it. In AWS that's a CloudTrail event with <code>userIdentity.type = Root</code>; in Entra it's a sign-in by a Global Administrator; in GCP it's org-admin activity.</p>",
      },
      {
        title: "Alert 2 — logging disabled or deleted",
        detail:
          "<p>Alert on <code>StopLogging</code>, <code>DeleteTrail</code>, diagnostic-setting deletion, or log-sink modification. This is a <b>defence-evasion step</b>, and it should be high severity every single time.</p>",
      },
      {
        title: "Alert 3 — something made public",
        detail:
          "<p>Alert on bucket policy / ACL changes granting public access, security-group or firewall rules opening <code>0.0.0.0/0</code>, and new public IPs. Catching the <b>change</b> beats catching the resulting risk.</p>",
      },
      {
        title: "Test every alert by triggering it",
        detail:
          "<p>Deliberately perform each action and confirm the alert fires and reaches you. <b>An untested alert is not a control.</b> Note the time from action to notification — that's your MTTD.</p>",
      },
      {
        title: "Document the response for each",
        detail:
          "<p>For each alert write three lines: what it means, what to check first, what to do. That runbook is what makes the alert useful to someone who isn't you.</p>",
      },
    ],
    validation: [
      "You can query the audit log and answer 'what did this identity do?'",
      "All three alerts fire when triggered, and reach you.",
      "You know your time-to-notify for each.",
      "Each alert has a written response runbook.",
    ],
    pitch:
      "\"I centralised CloudTrail into S3 and query it with Athena, and I built three alerts I'd argue every cloud environment needs: root sign-in, logging being disabled, and anything being made public. I tested each by triggering it deliberately — the logging-disabled one matters most to me because it's a defence-evasion step, so if it fires I treat it as an incident rather than an admin action.\"",
    stretch: [
      "Add managed threat detection (GuardDuty / Defender / SCC) and compare its findings to your own rules.",
      "Make the log store immutable with Object Lock or a retention lock.",
      "Ship logs to a separate account so a compromise can't erase them.",
    ],
  },

  /* ================= ENGINEER ================= */
  {
    id: 5,
    tier: "engineer",
    category: "Posture",
    providers: ALL_CLOUDS,
    title: "Run a full CSPM assessment and remediate it",
    tagline: "Scan against the CIS Benchmark, triage the findings like a real backlog, and prove the score moved.",
    outcome:
      "<p>A before/after posture report: initial scan, triaged findings with risk decisions, remediations applied, and a re-scan showing the improvement.</p>",
    proves:
      "Posture management is core cloud security work. Showing you can triage findings — not just generate them — is what separates useful from noisy.",
    hours: "5–7 hours",
    cost: "Free (Prowler is open source)",
    stack: ["Prowler", "ScoutSuite", "Native tool (Security Hub / Defender / SCC)", "CIS Benchmark PDF"],
    prerequisites: ["Project 01 complete", "Read-only credentials for the scan"],
    steps: [
      {
        title: "Run the baseline scan",
        detail:
          "<p>Install Prowler and run the CIS checks:</p><pre>prowler aws --compliance cis_2.0_aws\nprowler azure --compliance cis_2.0_azure\nprowler gcp  --compliance cis_2.0_gcp</pre><p>Export to HTML/JSON. <b>Record the pass/fail count — that's your baseline.</b></p>",
      },
      {
        title: "Do not try to fix everything",
        detail:
          "<p>A first scan produces hundreds of findings. Triage by <b>exploitability and blast radius</b>, not by the tool's severity label. Public exposure and identity findings first; informational cosmetics last.</p>",
      },
      {
        title: "Investigate before remediating",
        detail:
          "<p>For your top 10, verify each one is real and understand <i>why</i> the control exists. Some will be false positives or accepted risks in your lab — <b>record the reasoning</b>, because 'we accepted this risk knowingly' is a valid and mature outcome.</p>",
      },
      {
        title: "Remediate in priority order",
        detail:
          "<p>Fix the top findings. Where possible fix them <b>preventively</b> (a policy that stops recurrence) rather than reactively (changing the one resource).</p>",
      },
      {
        title: "Re-scan and quantify",
        detail:
          "<p>Run the same scan again and compare. <b>'I took the CIS pass rate from 61% to 88%'</b> is a far stronger interview line than 'I used Prowler'.</p>",
      },
      {
        title: "Compare tools",
        detail:
          "<p>Run ScoutSuite and the native tool on the same account. Note what each finds that the others miss — that comparison is genuinely useful knowledge and shows independent thinking.</p>",
      },
      {
        title: "Write the report",
        detail:
          "<p>Executive summary (score before/after, top risks, what you need), then the technical detail. Include your accepted risks with justification.</p>",
      },
    ],
    validation: [
      "You have before and after scan numbers.",
      "Your top-10 triage has a written rationale per finding.",
      "At least three fixes are preventive, not per-resource.",
      "You can name something the native tool found that Prowler missed, or vice versa.",
    ],
    pitch:
      "\"I ran Prowler's CIS benchmark against my lab account and took the pass rate from 61% to 88%. The important part wasn't the scanning — it was triage: a first scan gives you hundreds of findings and you have to sort by exploitability and blast radius rather than the tool's severity label. I also documented two findings as accepted risks with reasoning, because pretending everything gets fixed isn't realistic.\"",
    stretch: [
      "Schedule Prowler in CI and track the score over time.",
      "Write a custom Prowler check for an org-specific policy.",
      "Map your findings to a compliance framework like SOC 2.",
    ],
  },
  {
    id: 6,
    tier: "engineer",
    category: "Attack & Detect",
    providers: ALL_CLOUDS,
    title: "Cloud attack lab — exploit it, then detect it",
    tagline: "Run CloudGoat / AzureGoat / GCPGoat, then build the detection for every step you took.",
    outcome:
      "<p>A completed attack scenario plus a detection for each stage, with evidence each one fired. The offensive half teaches you what the defensive half needs to catch.</p>",
    proves:
      "Understanding attacks from the attacker's side is what makes detections good. This is the most fun project here and the most convincing to talk about.",
    hours: "8–10 hours",
    cost: "Free tier — <b>tear down after each scenario</b>",
    stack: ["CloudGoat / AzureGoat / GCPGoat", "Pacu (AWS exploitation)", "Terraform", "Your logging pipeline from project 04"],
    prerequisites: [
      "Projects 01 and 04 complete",
      "<b>A dedicated throwaway account.</b> Never deploy vulnerable-by-design infrastructure into an account you care about",
      "Terraform installed",
    ],
    steps: [
      {
        title: "Deploy into an isolated account",
        detail:
          "<p>Use a separate account/subscription/project with a hard budget cap. <b>These environments are deliberately vulnerable and internet-exposed</b> — never put them alongside anything real. Deploy CloudGoat with <code>./cloudgoat.py create &lt;scenario&gt;</code>.</p>",
      },
      {
        title: "Attack it without reading the answer",
        detail:
          "<p>Work the scenario yourself first. Enumerate, find the misconfiguration, escalate. Start with <code>iam_privesc_by_rollback</code> or <code>ec2_ssrf</code> — both map directly to real attack paths on this page.</p>",
      },
      {
        title: "Record everything you did",
        detail:
          "<p>Keep a log of every command and API call, with timestamps. <b>This list is your detection requirements document</b> — you now know exactly what an attacker's trail looks like.</p>",
      },
      {
        title: "Find your own footprints in the logs",
        detail:
          "<p>Go into CloudTrail/Activity Log/Audit Logs and locate every action you took. Some will be obvious, some surprisingly quiet. Note which actions left <b>no useful trace</b> — that's a collection gap.</p>",
      },
      {
        title: "Write a detection per stage",
        detail:
          "<p>Build alerts for: the reconnaissance burst, the privilege escalation, and the impact. Good ones: many AccessDenied errors from one identity (permission probing), <code>CreateAccessKey</code>/credential addition, role assignment by a non-admin, and workload credentials used from outside the cloud.</p>",
      },
      {
        title: "Re-run the attack and verify",
        detail:
          "<p>Destroy, redeploy, and attack again — this time confirming each detection fires. <b>Tune anything that missed.</b></p>",
      },
      {
        title: "Tear it down",
        detail:
          "<p><code>./cloudgoat.py destroy &lt;scenario&gt;</code> or <code>terraform destroy</code>. Verify in the console that nothing is left running, and check your budget.</p>",
      },
    ],
    validation: [
      "You completed the scenario without following the walkthrough.",
      "You can trace every action you took in the audit log.",
      "A detection fires for each stage on a repeat run.",
      "The environment is fully destroyed and your bill is $0.",
    ],
    pitch:
      "\"I work CloudGoat scenarios in a throwaway account and then build detections for everything I just did. The SSRF-to-metadata one changed how I think — attacking it myself made obvious that the highest-fidelity signal isn't the SSRF, it's the instance role credentials being used from an IP outside AWS. I wrote that detection, re-ran the attack, and confirmed it fired.\"",
    stretch: [
      "Do the equivalent scenario in a second cloud and compare the telemetry.",
      "Use Stratus Red Team for individual technique emulation.",
      "Map every step to MITRE ATT&CK Cloud and build a coverage map.",
    ],
  },
  {
    id: 7,
    tier: "engineer",
    category: "DevSecOps",
    providers: ALL_CLOUDS,
    title: "Secure the pipeline — IaC scanning and keyless deploys",
    tagline: "Block misconfigurations before they deploy, and remove the deployment secret entirely.",
    outcome:
      "<p>A GitHub repo where Terraform is scanned on every PR and deployment uses <b>OIDC federation with no stored credentials</b>.</p>",
    proves:
      "Shift-left plus keyless CI is modern practice. Most candidates can describe it; far fewer have built it.",
    hours: "6–8 hours",
    cost: "Free",
    stack: ["Terraform", "Checkov / tfsec / Trivy", "GitHub Actions", "OIDC federation to your cloud"],
    prerequisites: ["Project 01 complete", "Basic Terraform and Git"],
    steps: [
      {
        title: "Write deliberately insecure Terraform",
        detail:
          "<p>Create a repo with a bucket that's public, a security group open to <code>0.0.0.0/0</code>, and an unencrypted volume. You need real findings to prove the scanner works.</p>",
      },
      {
        title: "Scan locally first",
        detail:
          "<p>Run <code>checkov -d .</code> and read the output properly — each finding names the control and links to the rationale. Fix them and watch the scan go green.</p>",
      },
      {
        title: "Add scanning to CI",
        detail:
          "<p>Create a GitHub Actions workflow that runs Checkov on every pull request and <b>fails the build</b> on high-severity findings. Open a PR with an insecure resource and watch it get blocked — screenshot that, it's a great portfolio artifact.</p>",
      },
      {
        title: "Set up OIDC federation",
        detail:
          "<p>Now remove the secret entirely. Configure a trust between GitHub and your cloud: an <b>AWS IAM role with a GitHub OIDC trust policy</b>, an Azure federated credential on an app registration, or GCP Workload Identity Federation. <b>No access key is stored anywhere.</b></p>",
      },
      {
        title: "Scope the trust tightly",
        detail:
          "<p>Restrict the trust condition to your specific <b>repo and branch</b> (<code>repo:user/repo:ref:refs/heads/main</code>). Without this, any repo could assume your role — test it by trying to deploy from a branch that shouldn't be allowed.</p>",
      },
      {
        title: "Deploy from the pipeline",
        detail:
          "<p>Have the workflow run <code>terraform plan</code> on PR and <code>terraform apply</code> on merge, authenticating purely via OIDC. Confirm in the audit log that the deployment was performed by the federated identity.</p>",
      },
      {
        title: "Add a secret scanner",
        detail:
          "<p>Enable push protection / gitleaks so a committed credential is blocked at push time. Test it with a fake key.</p>",
      },
    ],
    validation: [
      "A PR with an insecure resource fails CI.",
      "<b>No cloud credential is stored in GitHub secrets.</b>",
      "The audit log shows deploys by the federated identity.",
      "A deploy attempt from an unauthorised branch is refused.",
    ],
    pitch:
      "\"I built a pipeline where Checkov fails the PR if the Terraform introduces a public bucket or an open security group, and deployment uses GitHub OIDC federated into an IAM role scoped to that repo and branch — so there's no stored access key to leak at all. Scoping the trust condition matters: without the branch restriction, any fork could assume the role.\"",
    stretch: [
      "Add drift detection that alerts when deployed state diverges from code.",
      "Add policy-as-code with OPA/Conftest for org-specific rules.",
      "Sign your artifacts and add build provenance (SLSA).",
    ],
  },
  {
    id: 8,
    tier: "engineer",
    category: "Workload Security",
    providers: ALL_CLOUDS,
    title: "Container and Kubernetes hardening",
    tagline: "Break out of a badly-configured pod, then make that impossible at admission.",
    outcome:
      "<p>A managed Kubernetes cluster where privileged pods are <b>rejected at admission</b>, every workload has its own cloud identity, and you have demonstrated the escape that hardening prevents.</p>",
    proves:
      "Containers are where a lot of cloud compromise actually happens, and pod-level identity is a control most people can only describe.",
    hours: "8–10 hours",
    cost: "<b>Costs money</b> — managed K8s is not free tier. Budget a few dollars and destroy it same-day",
    stack: ["EKS / AKS / GKE", "kubectl", "Kubernetes Goat", "Kyverno or Gatekeeper / Azure Policy / Binary Authorization", "Trivy"],
    prerequisites: [
      "Project 01 complete",
      "<b>Set a low budget alert and tear the cluster down the same day</b> — this is the one project that will bill you",
      "Basic kubectl familiarity",
    ],
    steps: [
      {
        title: "Create a small managed cluster",
        detail:
          "<p>Use the smallest node size available. Note the hourly cost before you start, and <b>set a calendar reminder to destroy it</b>.</p>",
      },
      {
        title: "Demonstrate the escape",
        detail:
          "<p>Deploy a pod with <code>privileged: true</code> and a <code>hostPath</code> mount of <code>/</code>. From inside it, read files from the host filesystem and reach the node's metadata endpoint to obtain the <b>node's cloud credentials</b>. This is what 'a container is not a security boundary' actually means.</p>",
      },
      {
        title: "Check what the node identity can do",
        detail:
          "<p>Using those stolen node credentials, see what cloud API calls succeed. If the node role is broad, one compromised pod just gained all of it — that's the blast radius you're about to fix.</p>",
      },
      {
        title: "Give each workload its own identity",
        detail:
          "<p>Enable <b>IRSA</b> (EKS), <b>Entra Workload Identity</b> (AKS), or <b>Workload Identity</b> (GKE), and bind a least-privilege cloud identity to a specific Kubernetes service account. Verify the pod now gets only its own permissions.</p>",
      },
      {
        title: "Block the escape at admission",
        detail:
          "<p>Install Kyverno or enable Azure Policy for AKS / Pod Security Standards. Write policies that <b>deny</b> privileged containers, hostPath mounts, host networking, and running as root. Then try to redeploy your escape pod — it should be rejected.</p>",
      },
      {
        title: "Block untrusted images",
        detail:
          "<p>Scan images with Trivy and require signed/attested images (Binary Authorization on GKE, or a Kyverno image-verification policy). Try deploying an unsigned image and confirm it's refused.</p>",
      },
      {
        title: "Destroy the cluster",
        detail:
          "<p>Delete the cluster and node group, verify in the console, and check your bill. <b>Do this today, not tomorrow.</b></p>",
      },
    ],
    validation: [
      "You successfully escaped to the host from the misconfigured pod.",
      "After hardening, that same manifest is <b>rejected at admission</b>.",
      "A pod now receives its own identity, not the node's.",
      "The cluster is destroyed and the bill is what you expected.",
    ],
    pitch:
      "\"I built a GKE cluster and deployed a privileged pod with a hostPath mount, escaped to the node, and pulled the node's credentials from the metadata endpoint — which made 'a container isn't a security boundary' concrete rather than theoretical. Then I fixed it properly: Workload Identity so each pod gets its own least-privilege identity, and a Kyverno policy that rejects privileged pods at admission. Redeploying the same manifest afterwards gets refused.\"",
    stretch: [
      "Add runtime detection with Falco and catch the escape live.",
      "Practise secrets management so nothing sensitive sits in a K8s Secret unencrypted.",
      "Enforce network policies for east-west isolation.",
    ],
  },

  /* ================= ARCHITECT ================= */
  {
    id: 9,
    tier: "architect",
    category: "Governance",
    providers: ALL_CLOUDS,
    title: "Build a landing zone with real guardrails",
    tagline: "A multi-account structure where the insecure path is refused, not detected.",
    outcome:
      "<p>An organisation hierarchy with preventive guardrails applied centrally, and proof that a privileged user in a child account <b>cannot</b> bypass them.</p>",
    proves:
      "Designing environments that are secure by default is architect-level work — and the demo of an admin being refused is genuinely memorable.",
    hours: "8–10 hours",
    cost: "Free tier (organisations/management groups cost nothing)",
    stack: ["AWS Organizations + SCPs / Control Tower", "Azure Management Groups + Azure Policy", "GCP Folders + Org Policy", "Terraform"],
    prerequisites: ["Project 01 complete", "Ability to create a second account/subscription/project"],
    steps: [
      {
        title: "Design the hierarchy before building it",
        detail:
          "<p>Sketch it: an organisation root, then environment groupings (Prod / Non-Prod / Sandbox / Security). Decide <b>what each level is for</b> — the hierarchy exists to limit blast radius and to be the place guardrails attach.</p>",
      },
      {
        title: "Create the structure",
        detail:
          "<p>AWS: Organizations with OUs. Azure: Management Groups. GCP: Folders. Move your existing account into the right place and create one more for the sandbox.</p>",
      },
      {
        title: "Write your first preventive guardrail",
        detail:
          "<p>Something unambiguous: <b>deny disabling audit logging</b>. AWS SCP denying <code>cloudtrail:StopLogging</code> and <code>DeleteTrail</code>; Azure Policy denying diagnostic-setting deletion; GCP org policy plus IAM restrictions.</p>",
      },
      {
        title: "Prove an admin cannot bypass it",
        detail:
          "<p>Log into the child account <b>as an administrator</b> and try to stop logging. It must fail. <b>This is the moment the concept lands</b> — a guardrail above the account applies even to that account's admins. Screenshot the denial.</p>",
      },
      {
        title: "Add the guardrails that matter most",
        detail:
          "<p>Region restriction (reduces attack surface and helps residency), deny public storage, require encryption, prevent deletion of security tooling, and block root/global-admin usage.</p>",
      },
      {
        title: "Separate the security account",
        detail:
          "<p>Create a dedicated logging/security account and centralise audit logs there, with <b>write-only access from workload accounts</b>. Now a compromised workload account cannot erase its own history.</p>",
      },
      {
        title: "Codify and document",
        detail:
          "<p>Put the whole thing in Terraform, and write a one-page design doc: the hierarchy, each guardrail and why, and the <b>exception process with mandatory expiry</b>.</p>",
      },
    ],
    validation: [
      "An admin in a child account is <b>refused</b> when trying to disable logging.",
      "Logs land in a separate account the workload account cannot delete from.",
      "The whole structure is reproducible from Terraform.",
      "There's a written exception process with expiry.",
    ],
    pitch:
      "\"I built a landing zone with an org hierarchy and preventive guardrails — the demo I like is logging into a child account as a full administrator and being refused when I try to stop CloudTrail, because the SCP sits above the account. I paired it with a separate log-archive account so a compromised workload account can't erase its own evidence, and codified all of it in Terraform with an exception process that forces expiry dates.\"",
    stretch: [
      "Add automated account vending so new environments start compliant.",
      "Add drift detection and alert on guardrail modification.",
      "Map your guardrails to CIS or SOC 2 control IDs.",
    ],
  },
  {
    id: 10,
    tier: "architect",
    category: "Detection Engineering",
    providers: ALL_CLOUDS,
    title: "Cloud detection engineering programme",
    tagline: "Build, test and continuously validate detections across the ATT&CK Cloud matrix.",
    outcome:
      "<p>A tested detection library mapped to ATT&CK Cloud, with an <b>evidence-backed coverage map</b> and automated validation.</p>",
    proves:
      "Owning detection strategy — with validated rather than claimed coverage — is exactly what a senior cloud security role does.",
    hours: "10–12 hours",
    cost: "Free tier",
    stack: ["Stratus Red Team", "Sigma / native rule formats", "ATT&CK Navigator", "Git + CI", "Your logging pipeline"],
    prerequisites: ["Projects 04 and 06 complete", "A working log pipeline with query access"],
    steps: [
      {
        title: "Pick your target techniques",
        detail:
          "<p>Open the <b>ATT&CK Cloud matrix</b> and choose 12–15 techniques relevant to your environment — credential access, persistence via added credentials, defense evasion via log tampering, exfiltration, resource hijacking.</p>",
      },
      {
        title: "Predict before you test",
        detail:
          "<p>For each technique write down, in advance, whether you think you'd detect it and with what. <b>Predicting first is what makes the result honest</b> rather than a post-hoc rationalisation.</p>",
      },
      {
        title: "Emulate with Stratus Red Team",
        detail:
          "<p>Stratus is purpose-built for cloud technique emulation:</p><pre>stratus detonate aws.credential-access.ec2-get-password-data\nstratus detonate aws.defense-evasion.cloudtrail-stop\nstratus cleanup --all</pre><p>Run one at a time and record the result.</p>",
      },
      {
        title: "Classify every gap",
        detail:
          "<p>Each miss is <b>no telemetry</b> (collection gap), <b>telemetry but no rule</b> (detection gap), or <b>rule exists but didn't fire</b> (broken rule — the most dangerous, because the map claimed coverage).</p>",
      },
      {
        title: "Write the missing detections",
        detail:
          "<p>Build rules for the gaps, each with metadata: ATT&CK ID, data source, severity, expected false positives, and an owner. Deploy them.</p>",
      },
      {
        title: "Version-control and automate validation",
        detail:
          "<p>Put rules in Git. Add scheduled Stratus runs that re-detonate the techniques and <b>alert if a rule that should fire doesn't</b>. This catches the silent-failure mode where a log source quietly stops.</p>",
      },
      {
        title: "Generate the coverage map",
        detail:
          "<p>Emit an ATT&CK Navigator layer from your rule metadata, colour-coded by <b>validated</b> vs claimed. Show before/after.</p>",
      },
    ],
    validation: [
      "Every chosen technique has a tested detected/not-detected result.",
      "Gaps are classified into the three categories.",
      "Scheduled validation runs and alerts on silent failure.",
      "The coverage map is generated from metadata, not maintained by hand.",
    ],
    pitch:
      "\"I run cloud detection engineering as a loop: pick techniques from the ATT&CK Cloud matrix, predict the outcome, emulate with Stratus Red Team, then classify each miss as a collection gap, a detection gap, or a broken rule. The third category is the one that scares me — the rule exists so the heatmap says you're covered, but the log source stopped forwarding. That's why I run scheduled re-detonation rather than trusting the map.\"",
    stretch: [
      "Add detection-as-code CI that replays tests on every rule change.",
      "Track mean time-to-detect per tactic.",
      "Extend coverage to identity telemetry across all three clouds.",
    ],
  },
  {
    id: 11,
    tier: "architect",
    category: "Incident Response",
    providers: ALL_CLOUDS,
    title: "Cloud incident response simulation",
    tagline: "Compromise an identity, then respond entirely through the API — as incident commander.",
    outcome:
      "<p>A complete IR package for a cloud incident: timeline from audit logs, containment decisions with rationale, evidence with chain of custody, and a post-incident review.</p>",
    proves:
      "Cloud IR is genuinely different from on-prem, and being able to lead it — and write it up for executives — is senior work.",
    hours: "8–10 hours",
    cost: "Free tier",
    stack: ["Your lab account", "Cloud CLI", "Automated snapshot/collection scripts", "Stratus Red Team or manual attack"],
    prerequisites: ["Projects 04 and 06 complete", "Audit logging fully enabled"],
    steps: [
      {
        title: "Stage a realistic compromise",
        detail:
          "<p>Simulate a leaked key: create an identity, 'leak' its credential to yourself, then act as the attacker — enumerate, create a second identity for persistence, add a credential to an existing principal, spin up compute, and stage 'data' in a bucket. <b>Wait a day before investigating.</b></p>",
      },
      {
        title: "Declare and run command",
        detail:
          "<p>Open a decision log. Assign IC / technical / comms / scribe roles even if that's all you. <b>Every decision gets a timestamp and a name.</b></p>",
      },
      {
        title: "Scope from the audit log only",
        detail:
          "<p>Using only CloudTrail/Activity Log/Audit Logs, answer: which identity, from where, what did it do, what did it create, and what data could it reach. Resist using your knowledge of what you staged.</p>",
      },
      {
        title: "Contain through the API",
        detail:
          "<p>There is no cable to pull. Attach a deny-all policy or disable the identity, <b>revoke active sessions and tokens</b> (not just reset the password), rotate keys, and isolate compute with a security-group swap. Record the order and the rationale.</p>",
      },
      {
        title: "Collect evidence properly",
        detail:
          "<p>Snapshot affected disks into an isolated forensics location, export the relevant log slice, and hash everything on acquisition. <b>Do this before eradication destroys it.</b></p>",
      },
      {
        title: "Hunt the persistence",
        detail:
          "<p>The hard part. Look for what survives a password reset: added access keys, new identities, certificates added to service principals, OAuth grants, cross-account trust changes, and modified guardrails. <b>Assume there is a second way back and go find it.</b></p>",
      },
      {
        title: "Write the three documents",
        detail:
          "<p>Technical report with timeline, one-page executive brief (impact, cost, what you need), and a blameless post-incident review listing concrete control changes with owners.</p>",
      },
    ],
    validation: [
      "Your reconstructed timeline matches what you actually staged.",
      "You found the persistence identity you planted.",
      "Containment revoked <b>tokens</b>, not just credentials.",
      "Evidence was collected before eradication, with hashes.",
    ],
    pitch:
      "\"I run cloud IR simulations where I stage a leaked-credential compromise, wait a day, then work it purely from audit logs as incident commander. The habit it built is hunting persistence properly — the attacker's mining was noisy, but the real risk was the second access key they created, and a credential added to an existing identity survives every password reset you do.\"",
    stretch: [
      "Automate evidence collection so containment doesn't destroy it.",
      "Simulate a ransomware scenario and test restoring from immutable backups.",
      "Run it as a tabletop with someone playing Legal and an executive.",
    ],
  },
  {
    id: 12,
    tier: "architect",
    category: "Data Protection",
    providers: ALL_CLOUDS,
    title: "Build a data perimeter against exfiltration",
    tagline: "Make stolen credentials insufficient — data cannot leave the boundary even with valid access.",
    outcome:
      "<p>A working data perimeter where an identity with legitimate read access <b>cannot</b> copy data to an outside account — demonstrated with a blocked attempt in the logs.</p>",
    proves:
      "This is one of the most advanced controls in cloud, and it directly answers the hardest question: 'the credentials were valid — what stops them?'",
    hours: "8–10 hours",
    cost: "Free tier",
    stack: ["GCP VPC Service Controls", "AWS SCPs + VPC endpoint policies", "Azure Private Link + storage firewall", "Terraform"],
    prerequisites: ["Projects 01 and 09 complete", "An org/folder structure to attach policies to"],
    steps: [
      {
        title: "Define what you're protecting",
        detail:
          "<p>Pick the data that matters and write down the perimeter: which projects/accounts are inside, which identities and networks may access it, and where it is legitimately allowed to go. <b>You cannot enforce a boundary you haven't defined.</b></p>",
      },
      {
        title: "Demonstrate the problem first",
        detail:
          "<p>With valid credentials, copy an object from your bucket to a bucket in a <b>different</b> account you control. It works — which is the point. Valid credentials plus a legitimate API is all exfiltration needs.</p>",
      },
      {
        title: "Build the perimeter",
        detail:
          "<p><b>GCP</b>: VPC Service Controls service perimeter around the storage/BigQuery services — the strongest native control. <b>AWS</b>: SCPs restricting principals and resources plus VPC endpoint policies pinning access to your own org. <b>Azure</b>: storage firewall + Private Link with public access disabled.</p>",
      },
      {
        title: "Retry the exfiltration",
        detail:
          "<p>Run the exact same copy command with the exact same valid credentials. <b>It must now be denied.</b> Find the violation in the logs — that denial event is your detection as well as your control.</p>",
      },
      {
        title: "Control egress too",
        detail:
          "<p>Restrict where workloads can send data: allow-list egress destinations, force traffic through inspected paths, and deny direct internet egress from data-handling subnets.</p>",
      },
      {
        title: "Alert on perimeter violations",
        detail:
          "<p>A blocked attempt is high-signal — legitimate work rarely triggers it. Alert on every violation and treat it as a potential insider or compromise indicator.</p>",
      },
      {
        title: "Handle the exceptions honestly",
        detail:
          "<p>Real perimeters break legitimate workflows. Document the exception process: who approves, how it's scoped, and <b>when it expires</b>. This is where most perimeter projects fail in practice.</p>",
      },
    ],
    validation: [
      "The same copy command that worked before is now <b>denied</b>.",
      "The denial appears in the logs as a violation event.",
      "An alert fires on the violation.",
      "There is a documented, expiring exception process.",
    ],
    pitch:
      "\"I built a data perimeter with VPC Service Controls and proved it by running the exact same export command with the exact same valid credentials before and after — it succeeded, then it was denied. That's the answer to the hardest question in cloud security: when the credentials are legitimate and the API call is normal, IAM alone can't help you, but a perimeter means stolen credentials aren't sufficient. The violation events are also excellent detections, because legitimate work almost never trips them.\"",
    stretch: [
      "Add DLP scanning to classify what's inside the perimeter.",
      "Extend the perimeter to a second cloud and compare the models.",
      "Simulate an insider attempt and measure detection and response time.",
    ],
  },
];

export const CLOUD_PROJECT_COUNT = CLOUD_PROJECTS.length;
export const CLOUD_PROJECT_CATS = [...new Set(CLOUD_PROJECTS.map((p) => p.category))];
