/**
 * Cloud-prep Architect guides, projects 09–12. These are design-and-governance
 * projects: the deliverable is usually a policy set, a pipeline, or a written
 * decision record rather than a single running thing.
 */
import type { ProjectGuide } from "@/lib/guides/types";

/* -------------------------------------------------------------------------- */
/* 09 — Landing zone with guardrails                                           */
/* -------------------------------------------------------------------------- */

export const c09: ProjectGuide = {
  slug: "landing-zone-guardrails",
  projectId: 9,
  intro:
    "<p>Everything so far has secured a single account after the fact. That does not scale. Once an organisation has twenty accounts, per-account fixes are a treadmill nobody wins.</p><p>A <b>landing zone</b> is the alternative: a pre-secured structure that every new account is born into. Guardrails apply from the first second, centrally, and individual account administrators cannot switch them off.</p><p>You are going to build one — an organisation, an account structure, service control policies that cannot be overridden, and centralised logging. Then you will prove the guardrails hold by trying to break them from inside a member account.</p>",
  glossary: [
    {
      term: "Organisation",
      plain:
        "A container for multiple accounts under one billing and policy umbrella. AWS Organizations, Azure Management Groups, GCP Folders.",
    },
    {
      term: "Organisational Unit (OU)",
      plain:
        "A folder for accounts inside an organisation. Policies attach to OUs, so accounts inherit them by where they sit.",
    },
    {
      term: "Service Control Policy (SCP)",
      plain:
        "A guardrail that sets the <b>maximum</b> permission any identity in an account may have — including that account's own administrator. This is what makes it a guardrail rather than a suggestion.",
    },
    {
      term: "Preventive vs detective guardrail",
      plain:
        "An SCP is preventive — the API call fails. A config rule is detective — it tells you afterwards. Landing zones use both, but preventive for anything that must never happen.",
    },
    {
      term: "Blast radius",
      plain:
        "How much damage one compromise can do. Separate accounts per environment is primarily a blast-radius control.",
    },
  ],
  before: [
    "<b>Projects 01–05 finished.</b>",
    "<b>An account that is not already in an organisation.</b> Your project 01 account works — it becomes the management account.",
    "About 6 hours.",
  ],
  steps: [
    {
      title: "Understand what this costs and what it locks in",
      time: "15 min",
      warn: "AWS Organizations itself is free, and so are SCPs. But creating member accounts is effectively permanent — closing an AWS account takes 90 days. Create at most two, and use them.",
      why: "This is the one project with decisions that are hard to reverse. Knowing that before you start is the point of this step.",
      body: "<p>Two things to be clear about before you begin.</p><p>First, the management account becomes special. It should hold no workloads — its job is organisation policy and nothing else. SCPs do not apply to it, which is exactly why nothing should run there.</p><p>Second, member accounts need unique email addresses. Gmail's <code>+</code> addressing works: <code>you+lab-prod@gmail.com</code> and <code>you+lab-dev@gmail.com</code> both deliver to your inbox.</p>",
      expect: "<p>Two email addresses ready, and a clear picture of what is about to become permanent.</p>",
    },
    {
      title: "Create the organisation",
      time: "20 min",
      body: "<p>Enable all features — consolidated billing alone does not permit SCPs, which are the entire point.</p>",
      commands: [
        {
          lang: "bash",
          code: "aws organizations create-organization --feature-set ALL\n\naws organizations describe-organization \\\n  --query 'Organization.[Id,MasterAccountEmail,FeatureSet]' --output table",
        },
      ],
      expect: "<p>An organisation ID and <code>FeatureSet: ALL</code>. If it says <code>CONSOLIDATED_BILLING</code>, SCPs will not work.</p>",
      expectCode: "|  o-a1b2c3d4e5  |  you@example.com  |  ALL  |",
      fixes: [
        {
          problem: "AlreadyInOrganizationException",
          cause: "The account is already a member of an organisation.",
          fix: "Check with <code>aws organizations describe-organization</code>. If it is a member rather than the management account, you cannot create policies from here — use a different account.",
        },
      ],
    },
    {
      title: "Design and build the OU structure",
      time: "35 min",
      why: "The structure determines which policies apply where. Getting it roughly right up front saves painful account moves later.",
      body: "<p>A conventional starting structure separates by <b>function</b> and <b>environment</b>, because those are the two axes policy actually varies along:</p><pre>Root\n├── Security      ← log archive, audit tooling. Most restricted.\n├── Infrastructure ← shared networking, CI/CD\n└── Workloads\n    ├── Production ← strictest workload guardrails\n    └── Development ← more permissive, still guardrailed\n</pre>",
      commands: [
        {
          lang: "bash",
          label: "Build it",
          code: "ROOT=$(aws organizations list-roots --query 'Roots[0].Id' --output text)\n\nSEC=$(aws organizations create-organizational-unit --parent-id \"$ROOT\" \\\n      --name Security --query 'OrganizationalUnit.Id' --output text)\nINF=$(aws organizations create-organizational-unit --parent-id \"$ROOT\" \\\n      --name Infrastructure --query 'OrganizationalUnit.Id' --output text)\nWL=$(aws organizations create-organizational-unit --parent-id \"$ROOT\" \\\n     --name Workloads --query 'OrganizationalUnit.Id' --output text)\n\nPROD=$(aws organizations create-organizational-unit --parent-id \"$WL\" \\\n       --name Production --query 'OrganizationalUnit.Id' --output text)\nDEV=$(aws organizations create-organizational-unit --parent-id \"$WL\" \\\n      --name Development --query 'OrganizationalUnit.Id' --output text)\n\necho \"Security=$SEC  Infra=$INF  Workloads=$WL  Prod=$PROD  Dev=$DEV\"",
        },
        {
          lang: "bash",
          label: "Create one member account to test against",
          code: "aws organizations create-account \\\n  --email \"you+lab-dev@example.com\" \\\n  --account-name \"lab-development\" \\\n  --role-name OrganizationAccountAccessRole\n\n# Creation is asynchronous — poll until it succeeds\naws organizations list-create-account-status \\\n  --query 'CreateAccountStatuses[].[AccountName,State,AccountId]' --output table",
        },
      ],
      expect:
        "<p>Five OUs and one new member account. Note the <code>OrganizationAccountAccessRole</code> — that is how you get into the new account from the management account, and it is worth understanding because it is also a lateral movement path.</p>",
      expectCode:
        "|  lab-development  |  SUCCEEDED  |  210987654321  |",
      fixes: [
        {
          problem: "State stays IN_PROGRESS for a long time",
          cause: "Account creation can take several minutes.",
          fix: "Keep polling. If it moves to FAILED, the reason is in <code>FailureReason</code> — usually a duplicate email address.",
        },
      ],
    },
    {
      title: "Write the guardrails",
      time: "60 min",
      why: "This is the substance of a landing zone. Each SCP should encode something that must be true in every account, forever.",
      body: "<p>Write four, each addressing a different class of risk.</p>",
      commands: [
        {
          lang: "bash",
          label: "SCP 1 — audit logging cannot be disabled",
          code: "cat > scp-protect-logging.json <<'EOF'\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Sid\": \"ProtectAuditTrail\",\n    \"Effect\": \"Deny\",\n    \"Action\": [\n      \"cloudtrail:StopLogging\",\n      \"cloudtrail:DeleteTrail\",\n      \"cloudtrail:UpdateTrail\",\n      \"cloudtrail:PutEventSelectors\",\n      \"config:DeleteConfigurationRecorder\",\n      \"config:StopConfigurationRecorder\"\n    ],\n    \"Resource\": \"*\"\n  }]\n}\nEOF\n\naws organizations create-policy --name ProtectAuditLogging \\\n  --type SERVICE_CONTROL_POLICY \\\n  --description \"Audit logging cannot be disabled by anyone\" \\\n  --content file://scp-protect-logging.json",
        },
        {
          lang: "bash",
          label: "SCP 2 — no public buckets, anywhere, ever",
          code: "cat > scp-no-public-s3.json <<'EOF'\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Sid\": \"DenyDisablingPublicAccessBlock\",\n    \"Effect\": \"Deny\",\n    \"Action\": [\n      \"s3:PutAccountPublicAccessBlock\",\n      \"s3:DeleteAccountPublicAccessBlock\"\n    ],\n    \"Resource\": \"*\"\n  }]\n}\nEOF\n\naws organizations create-policy --name NoPublicS3 \\\n  --type SERVICE_CONTROL_POLICY \\\n  --description \"The account-level public access block cannot be removed\" \\\n  --content file://scp-no-public-s3.json",
        },
        {
          lang: "bash",
          label: "SCP 3 — region restriction, which is also a cost control",
          code: "cat > scp-region-lock.json <<'EOF'\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Sid\": \"DenyOutsideApprovedRegions\",\n    \"Effect\": \"Deny\",\n    \"NotAction\": [\n      \"iam:*\", \"organizations:*\", \"route53:*\", \"cloudfront:*\",\n      \"support:*\", \"sts:*\", \"budgets:*\", \"waf:*\"\n    ],\n    \"Resource\": \"*\",\n    \"Condition\": {\n      \"StringNotEquals\": {\n        \"aws:RequestedRegion\": [\"us-east-1\", \"eu-west-1\"]\n      }\n    }\n  }]\n}\nEOF\n\naws organizations create-policy --name RegionLock \\\n  --type SERVICE_CONTROL_POLICY \\\n  --description \"Resources may only be created in approved regions\" \\\n  --content file://scp-region-lock.json",
        },
        {
          lang: "bash",
          label: "SCP 4 — no root usage in member accounts",
          code: "cat > scp-deny-root.json <<'EOF'\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Sid\": \"DenyRootUser\",\n    \"Effect\": \"Deny\",\n    \"Action\": \"*\",\n    \"Resource\": \"*\",\n    \"Condition\": {\n      \"StringLike\": { \"aws:PrincipalArn\": \"arn:aws:iam::*:root\" }\n    }\n  }]\n}\nEOF\n\naws organizations create-policy --name DenyRootUser \\\n  --type SERVICE_CONTROL_POLICY \\\n  --description \"Root cannot be used for API calls in member accounts\" \\\n  --content file://scp-deny-root.json",
        },
      ],
      expect:
        "<p>Four policies created but not yet attached. The <code>NotAction</code> in the region lock is worth understanding: global services like IAM report a home region of <code>us-east-1</code>, so without those exclusions you would lock yourself out of IAM entirely.</p>",
      fixes: [
        {
          problem: "PolicyTypeNotEnabledException",
          cause: "SCPs are not enabled on the root.",
          fix: "<code>aws organizations enable-policy-type --root-id $ROOT --policy-type SERVICE_CONTROL_POLICY</code>, then retry.",
        },
      ],
    },
    {
      title: "Attach them and prove they work",
      time: "45 min",
      why: "An unattached policy protects nothing, and an untested one is a guess. Testing from inside a member account is the only proof that counts.",
      body: "<p>Attach to OUs so accounts inherit by placement, then try to violate each one from the member account.</p>",
      commands: [
        {
          lang: "bash",
          label: "Attach",
          code: "for p in ProtectAuditLogging NoPublicS3 RegionLock DenyRootUser; do\n  PID=$(aws organizations list-policies --filter SERVICE_CONTROL_POLICY \\\n        --query \"Policies[?Name=='$p'].Id\" --output text)\n  aws organizations attach-policy --policy-id \"$PID\" --target-id \"$WL\"\n  echo \"attached $p to Workloads\"\ndone\n\naws organizations list-policies-for-target --target-id \"$WL\" \\\n  --filter SERVICE_CONTROL_POLICY --query 'Policies[].Name' --output table",
        },
        {
          lang: "bash",
          label: "Get into the member account",
          code: "MEMBER=210987654321   # the account ID from step 3\n\nCREDS=$(aws sts assume-role \\\n  --role-arn \"arn:aws:iam::$MEMBER:role/OrganizationAccountAccessRole\" \\\n  --role-session-name guardrail-test \\\n  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' --output text)\n\nexport AWS_ACCESS_KEY_ID=$(echo \"$CREDS\" | cut -f1)\nexport AWS_SECRET_ACCESS_KEY=$(echo \"$CREDS\" | cut -f2)\nexport AWS_SESSION_TOKEN=$(echo \"$CREDS\" | cut -f3)\n\naws sts get-caller-identity",
        },
        {
          lang: "bash",
          label: "Now try to break each guardrail — every one must FAIL",
          code: "echo '--- region lock: create a bucket in a banned region ---'\naws s3api create-bucket --bucket guardrail-test-$RANDOM \\\n  --region ap-southeast-2 \\\n  --create-bucket-configuration LocationConstraint=ap-southeast-2 2>&1 | tail -2\n\necho '--- public access block: try to remove it ---'\naws s3control delete-public-access-block --account-id \"$MEMBER\" 2>&1 | tail -2\n\necho '--- logging: try to stop a trail ---'\naws cloudtrail stop-logging --name any-trail 2>&1 | tail -2",
        },
      ],
      expect:
        "<p>Every attempt denied with an explicit SCP message. This is the crucial demonstration: you assumed the account's <b>administrator</b> role and still could not do these things. That is what makes it a guardrail rather than a policy.</p>",
      expectCode:
        "An error occurred (AccessDenied) when calling the CreateBucket operation:\nUser: arn:aws:sts::210987654321:assumed-role/OrganizationAccountAccessRole/...\nis not authorized to perform: s3:CreateBucket ... with an explicit deny in a\nservice control policy",
      fixes: [
        {
          problem: "The action succeeds when it should be denied",
          cause: "SCPs take a few minutes to propagate, or the policy is attached to the wrong OU.",
          fix: "Wait five minutes. Verify the account's placement with <code>aws organizations list-parents --child-id $MEMBER</code> and confirm that OU has the policy attached.",
        },
        {
          problem: "You locked yourself out of the member account entirely",
          cause: "An SCP that is too broad — usually a region lock without the global-service exclusions.",
          fix: "SCPs never apply to the management account, so you can always detach from there: <code>aws organizations detach-policy --policy-id PID --target-id OU</code>. This is precisely why the management account holds no workloads.",
        },
      ],
    },
    {
      title: "Centralise the logs",
      time: "45 min",
      why: "Logs stored in the account being attacked can be deleted by whoever compromised it. A separate, write-only archive is the whole point of the Security OU.",
      body: "<p>Create an organisation trail from the management account. It covers every member account automatically, including accounts created later, and members cannot disable it.</p>",
      commands: [
        {
          lang: "bash",
          label: "Back to the management account first",
          code: "unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN\naws sts get-caller-identity    # confirm you are back",
        },
        {
          lang: "bash",
          label: "Organisation-wide trail",
          code: "ACCT=$(aws sts get-caller-identity --query Account --output text)\nBUCKET=\"org-cloudtrail-$ACCT\"\n\naws s3api create-bucket --bucket \"$BUCKET\" --region us-east-1\naws s3api put-public-access-block --bucket \"$BUCKET\" \\\n  --public-access-block-configuration \\\n  \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"\n\n# Object Lock or versioning so logs cannot be quietly deleted\naws s3api put-bucket-versioning --bucket \"$BUCKET\" \\\n  --versioning-configuration Status=Enabled\n\naws cloudtrail create-trail --name org-trail \\\n  --s3-bucket-name \"$BUCKET\" \\\n  --is-organization-trail --is-multi-region-trail\n\naws cloudtrail start-logging --name org-trail",
        },
      ],
      expect:
        "<p>One trail covering every account. Verify by doing something in the member account and finding it in the management account's bucket — that cross-account visibility is the deliverable.</p>",
      fixes: [
        {
          problem: "InsufficientS3BucketPolicyException",
          cause: "An organisation trail needs a bucket policy allowing every member account to write.",
          fix: "Create the trail in the console instead — it writes the correct policy including the organisation condition — then manage it from the CLI afterwards.",
        },
      ],
    },
    {
      title: "Write the decision record",
      time: "40 min",
      why: "A landing zone is a set of decisions. Undocumented, they get reversed by the next person who finds one inconvenient.",
      body: "<p>Write an architecture decision record for each significant choice: the OU structure, each SCP, and the logging design. For each — the decision, the alternatives considered, why you chose this one, and the trade-off you accepted.</p>",
      commands: [
        {
          lang: "yaml",
          label: "adr-002-region-restriction.yml",
          code: "id: ADR-002\ntitle: Restrict resource creation to us-east-1 and eu-west-1\nstatus: accepted\ndate: 2026-07-26\n\ncontext: >\n  Resources created in unused regions are invisible in day-to-day\n  operations, are frequently missed by monitoring, and are a known\n  pattern in cryptomining abuse of compromised accounts. They also\n  make cost attribution difficult.\n\ndecision: >\n  An SCP denies resource creation outside us-east-1 and eu-west-1 for\n  all accounts in the Workloads OU. Global services (IAM, Route53,\n  CloudFront, STS, Support, Budgets, WAF) are excluded via NotAction\n  because they report a home region of us-east-1 and would otherwise\n  be blocked.\n\nalternatives:\n  - id: detective\n    what: A Config rule alerting on out-of-region resources.\n    rejected_because: >\n      Detects after creation. For cryptomining, minutes of compute in\n      an unwatched region is already the damage.\n  - id: no-restriction\n    what: Rely on cost alerts.\n    rejected_because: >\n      Cost alerts lag by hours and do not address the visibility problem.\n\nconsequences:\n  positive:\n    - Cryptomining in unused regions is prevented, not merely detected\n    - Cost and monitoring both simplify to two regions\n  negative:\n    - A genuine need for a third region requires an SCP change\n    - Teams may hit confusing AccessDenied errors before learning why\n  mitigation: >\n    Documented exception process, and the denial message names the SCP.\n\nreview: 2027-01-26",
        },
      ],
      expect:
        "<p>An ADR per decision. The <code>alternatives</code> and <code>negative consequences</code> sections are what make it credible — a document that lists only benefits reads as advocacy, not architecture.</p>",
    },
    {
      title: "Decide what to keep",
      time: "20 min",
      warn: "Closing an AWS account takes 90 days and cannot be rushed. Think before you create more.",
      body: "<p>The organisation, OUs, SCPs, and organisation trail all cost nothing — keep them. If you want to remove the member account, start now because of the delay.</p>",
      commands: [
        {
          lang: "bash",
          code: "aws organizations list-accounts \\\n  --query 'Accounts[].[Name,Id,Status]' --output table\n\n# To close a member account:\n# aws organizations close-account --account-id 210987654321\n\n# Confirm the org trail is still running\naws cloudtrail get-trail-status --name org-trail --query IsLogging",
        },
      ],
      expect:
        "<p>The organisation intact, guardrails attached, logging centralised. This is a genuinely production-shaped structure and it costs nothing to leave in place.</p>",
    },
  ],
  after: [
    "Read the AWS Well-Architected Security Pillar and the Control Tower documentation — Control Tower automates what you just built by hand, and having built it manually makes the automation legible.",
    "Add a detective layer with AWS Config conformance packs for things SCPs cannot express.",
    "The equivalents are Azure Management Groups with Azure Policy, and GCP Folders with Organization Policy. Same idea, different nouns.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 10 — Detection engineering at scale                                         */
/* -------------------------------------------------------------------------- */

export const c10: ProjectGuide = {
  slug: "cloud-detection-engineering",
  projectId: 10,
  intro:
    "<p>Project 04 built three detections by hand in one account. That approach does not survive twenty accounts, and it certainly does not survive an auditor asking which detections you have and when each was last tested.</p><p>This project applies the detection-as-code discipline to cloud: detections defined in version-controlled files, deployed to every account by pipeline, tested automatically against synthetic events, and reported as ATT&amp;CK coverage.</p><p>The interesting design question is where detection runs. You will build it so that changing platforms — CloudWatch to a SIEM — means changing the deployer, not rewriting every rule.</p>",
  glossary: [
    {
      term: "Detection as code",
      plain:
        "Detections stored as files in git, reviewed and deployed like software rather than clicked into a console.",
    },
    {
      term: "Rule schema",
      plain:
        "A shared structure every rule follows, so tooling can process them all the same way. You will define your own.",
    },
    {
      term: "Synthetic event",
      plain:
        "A fabricated log record used to test that a rule matches. Lets you validate a detection without performing the attack.",
    },
    {
      term: "EventBridge",
      plain:
        "AWS's event router. It can match CloudTrail events in near real time and route them onward — more expressive than a metric filter.",
    },
    {
      term: "Coverage drift",
      plain:
        "The slow divergence between what you think you detect and what you actually detect. Automated coverage reporting is the antidote.",
    },
  ],
  before: [
    "<b>Projects 04, 05 and 09 finished.</b>",
    "Python 3.9+, and a GitHub repository.",
    "About 7 hours.",
  ],
  steps: [
    {
      title: "Define the rule schema",
      time: "45 min",
      why: "Everything downstream depends on this. A schema that captures the response guidance alongside the logic is what stops your rules becoming undocumented queries.",
      body: "<p>Design the format before writing rules. Include the operational fields — severity, response, false positives — not just the matching logic.</p>",
      commands: [
        {
          lang: "yaml",
          label: "detections/schema.yml — the contract every rule follows",
          code: "# Every rule file must provide these fields.\n#\n# id           unique, stable, kebab-case\n# title        human readable, imperative\n# severity     critical | high | medium | low\n# attack       list of MITRE ATT&CK technique IDs\n# description  what it detects and why it matters\n# source       which log source (cloudtrail, vpcflow, guardduty)\n# detection    the matching logic, in a platform-neutral form\n# thresholds   count and window, when the rule is an aggregation\n# falsepositives  documented, non-empty\n# response     ordered list of what an analyst should do\n# status       experimental | testing | production\n# tests        synthetic events that must match, and must not",
        },
        {
          lang: "yaml",
          label: "detections/cloudtrail/root-account-usage.yml",
          code: "id: cloud-root-account-usage\ntitle: Root account used for an API call\nseverity: high\nstatus: production\nattack:\n  - T1078.004\nsource: cloudtrail\n\ndescription: >\n  The account root user made an API call. After initial account setup\n  root should be used only for the small set of tasks that require it,\n  each of which should be pre-announced.\n\ndetection:\n  all:\n    - field: userIdentity.type\n      equals: Root\n    - field: eventType\n      not_equals: AwsServiceEvent\n\nfalsepositives:\n  - Announced root-only tasks such as changing the support plan\n  - AWS service-linked events, excluded above\n\nresponse:\n  - Confirm with the account owner whether this was intentional\n  - If unexpected, rotate the root password and re-register MFA\n  - Review every root action in the surrounding hour\n  - Verify no root access key exists\n\ntests:\n  should_match:\n    - userIdentity: { type: Root }\n      eventType: AwsApiCall\n      eventName: CreateUser\n  should_not_match:\n    - userIdentity: { type: IAMUser, userName: lab-admin }\n      eventType: AwsApiCall\n      eventName: CreateUser\n    - userIdentity: { type: Root }\n      eventType: AwsServiceEvent\n      eventName: SomeServiceEvent",
        },
      ],
      expect:
        "<p>A schema and one rule following it. The <code>tests</code> block is what makes the rest of the pipeline possible — a rule that carries its own test cases can be validated without touching a cloud account.</p>",
    },
    {
      title: "Write the validator",
      time: "50 min",
      why: "The validator turns the schema from documentation into an enforced contract.",
      body: "<p>It should check structure and then actually evaluate the detection logic against the rule's own test events.</p>",
      commands: [
        {
          lang: "python",
          label: "validate.py",
          code: "#!/usr/bin/env python3\n\"\"\"Validate detection rules: structure, metadata, and behaviour.\"\"\"\nimport pathlib\nimport sys\n\nimport yaml\n\nREQUIRED = ['id', 'title', 'severity', 'status', 'attack', 'source',\n            'description', 'detection', 'falsepositives', 'response', 'tests']\nSEVERITIES = {'critical', 'high', 'medium', 'low'}\n\n\ndef get_field(event: dict, path: str):\n    \"\"\"Resolve a dotted path like userIdentity.type against an event.\"\"\"\n    cur = event\n    for part in path.split('.'):\n        if not isinstance(cur, dict) or part not in cur:\n            return None\n        cur = cur[part]\n    return cur\n\n\ndef matches(detection: dict, event: dict) -> bool:\n    \"\"\"Evaluate the platform-neutral detection logic.\"\"\"\n    conditions = detection.get('all', [])\n    for cond in conditions:\n        value = get_field(event, cond['field'])\n        if 'equals' in cond and value != cond['equals']:\n            return False\n        if 'not_equals' in cond and value == cond['not_equals']:\n            return False\n        if 'contains' in cond and (value is None or cond['contains'] not in str(value)):\n            return False\n    return bool(conditions)\n\n\ndef validate(path: pathlib.Path) -> list[str]:\n    errors = []\n    rule = yaml.safe_load(open(path))\n\n    for field in REQUIRED:\n        if field not in rule:\n            errors.append(f'missing required field: {field}')\n    if errors:\n        return errors\n\n    if rule['severity'] not in SEVERITIES:\n        errors.append(f\"severity must be one of {SEVERITIES}\")\n    if not rule['falsepositives']:\n        errors.append('falsepositives must not be empty')\n    if not rule['response']:\n        errors.append('response must not be empty')\n    if not any(str(t).upper().startswith('T') for t in rule['attack']):\n        errors.append('attack must contain at least one ATT&CK technique ID')\n\n    # Behavioural tests — the part that actually catches broken logic\n    for i, ev in enumerate(rule['tests'].get('should_match', [])):\n        if not matches(rule['detection'], ev):\n            errors.append(f'should_match[{i}] did NOT match')\n    for i, ev in enumerate(rule['tests'].get('should_not_match', [])):\n        if matches(rule['detection'], ev):\n            errors.append(f'should_not_match[{i}] DID match — rule is too broad')\n\n    return errors\n\n\nif __name__ == '__main__':\n    rules = sorted(pathlib.Path('detections').rglob('*.yml'))\n    rules = [r for r in rules if r.name != 'schema.yml']\n\n    failed = 0\n    for r in rules:\n        errs = validate(r)\n        if errs:\n            failed += 1\n            print(f'FAIL  {r}')\n            for e in errs:\n                print(f'        {e}')\n        else:\n            print(f'ok    {r.stem}')\n\n    print(f'\\n{len(rules) - failed}/{len(rules)} rules valid')\n    sys.exit(1 if failed else 0)",
        },
        {
          lang: "bash",
          code: "pip install pyyaml\npython3 validate.py",
        },
      ],
      expect:
        "<p>Every rule validated, including its behaviour. Deliberately break a rule — change <code>equals: Root</code> to <code>equals: IAMUser</code> — and confirm the <code>should_not_match</code> test catches it. That is the check earning its place.</p>",
      expectCode: "ok    root-account-usage\n\n1/1 rules valid",
    },
    {
      title: "Write the deployer",
      time: "60 min",
      why: "Keeping the rule format platform-neutral and putting all the platform knowledge in the deployer is the design decision that matters. Change SIEM, rewrite one file.",
      body: "<p>Translate the neutral detection logic into a CloudWatch Logs metric filter pattern, then create the filter and alarm.</p>",
      commands: [
        {
          lang: "python",
          label: "deploy_cloudwatch.py",
          code: "#!/usr/bin/env python3\n\"\"\"Deploy neutral detection rules to CloudWatch Logs metric filters.\n\nAll platform-specific knowledge lives here. Rules stay portable.\n\"\"\"\nimport pathlib\nimport sys\n\nimport boto3\nimport yaml\n\nLOG_GROUP = '/aws/cloudtrail/lab'\nNAMESPACE = 'SecurityDetections'\nPERIOD = {'critical': 60, 'high': 300, 'medium': 300, 'low': 3600}\n\nlogs = boto3.client('logs')\ncw = boto3.client('cloudwatch')\nsns = boto3.client('sns')\n\n\ndef to_filter_pattern(detection: dict) -> str:\n    \"\"\"Neutral logic -> CloudWatch Logs JSON filter pattern.\"\"\"\n    parts = []\n    for cond in detection.get('all', []):\n        field = '$.' + cond['field']\n        if 'equals' in cond:\n            parts.append(f'({field} = \"{cond[\"equals\"]}\")')\n        elif 'not_equals' in cond:\n            parts.append(f'({field} != \"{cond[\"not_equals\"]}\")')\n        elif 'contains' in cond:\n            parts.append(f'({field} = \"*{cond[\"contains\"]}*\")')\n    return '{ ' + ' && '.join(parts) + ' }'\n\n\ndef deploy(rule: dict, topic_arn: str) -> None:\n    metric = ''.join(w.capitalize() for w in rule['id'].split('-'))\n    pattern = to_filter_pattern(rule['detection'])\n\n    logs.put_metric_filter(\n        logGroupName=LOG_GROUP,\n        filterName=rule['id'],\n        filterPattern=pattern,\n        metricTransformations=[{\n            'metricName': metric,\n            'metricNamespace': NAMESPACE,\n            'metricValue': '1',\n        }],\n    )\n\n    cw.put_metric_alarm(\n        AlarmName=f\"detect-{rule['id']}\",\n        AlarmDescription=f\"[{rule['severity'].upper()}] {rule['title']}\",\n        MetricName=metric,\n        Namespace=NAMESPACE,\n        Statistic='Sum',\n        Period=PERIOD.get(rule['severity'], 300),\n        Threshold=rule.get('thresholds', {}).get('count', 1),\n        ComparisonOperator='GreaterThanOrEqualToThreshold',\n        EvaluationPeriods=1,\n        TreatMissingData='notBreaching',\n        AlarmActions=[topic_arn],\n    )\n    print(f\"  deployed  [{rule['severity']:8}] {rule['id']}\")\n\n\nif __name__ == '__main__':\n    topics = sns.list_topics()['Topics']\n    topic = next((t['TopicArn'] for t in topics\n                  if 'security-alerts' in t['TopicArn']), None)\n    if not topic:\n        sys.exit('No security-alerts SNS topic found (see project 02 step 8)')\n\n    for path in sorted(pathlib.Path('detections').rglob('*.yml')):\n        if path.name == 'schema.yml':\n            continue\n        rule = yaml.safe_load(open(path))\n        if rule.get('status') != 'production':\n            print(f\"  skipped   [{rule.get('status')}] {rule['id']}\")\n            continue\n        deploy(rule, topic)",
        },
        {
          lang: "bash",
          code: "pip install boto3\npython3 deploy_cloudwatch.py",
        },
      ],
      expect:
        "<p>Rules deployed, and non-production ones skipped. The <code>status</code> field lets a rule live in the repository and get reviewed before it starts alerting anyone.</p>",
      expectCode: "  deployed  [high    ] cloud-root-account-usage",
      fixes: [
        {
          problem: "InvalidParameterException on put_metric_filter",
          cause: "The generated filter pattern is malformed.",
          fix: "Print it before deploying and test with <code>aws logs test-metric-filter</code>. CloudWatch patterns are strict about quoting.",
        },
      ],
    },
    {
      title: "Add the rules that matter in cloud",
      time: "60 min",
      why: "Three detections is a demo. Cover the techniques that actually appear in cloud intrusions.",
      body: "<p>Write rules for the cloud-specific patterns you learned in earlier projects.</p>",
      commands: [
        {
          lang: "yaml",
          label: "detections/cloudtrail/logging-disabled.yml",
          code: "id: cloud-logging-disabled\ntitle: Audit logging stopped or deleted\nseverity: critical\nstatus: production\nattack: [T1562.008]\nsource: cloudtrail\ndescription: >\n  CloudTrail logging was stopped, deleted, or reconfigured. Attackers do\n  this before actions they do not want recorded. Outside a change window\n  it is almost never legitimate.\ndetection:\n  all:\n    - field: eventName\n      contains: StopLogging\nfalsepositives:\n  - Planned trail reconfiguration inside an approved change window\nresponse:\n  - Re-enable logging immediately\n  - Treat the acting identity as compromised until proven otherwise\n  - Review everything that identity did during the blind window\n  - Escalate\ntests:\n  should_match:\n    - eventName: StopLogging\n      userIdentity: { type: IAMUser }\n  should_not_match:\n    - eventName: StartLogging\n      userIdentity: { type: IAMUser }",
        },
        {
          lang: "yaml",
          label: "detections/cloudtrail/instance-creds-external.yml",
          code: "id: cloud-instance-creds-used-externally\ntitle: EC2 instance role credentials used from outside AWS\nseverity: critical\nstatus: production\nattack: [T1552.005]\nsource: cloudtrail\ndescription: >\n  Temporary credentials issued to an EC2 instance were used from an IP\n  address that is not the instance. This is the signature of SSRF-based\n  credential theft and has no benign explanation.\ndetection:\n  all:\n    - field: userIdentity.type\n      equals: AssumedRole\n    - field: userIdentity.arn\n      contains: ':i-'\nfalsepositives:\n  - None known. Investigate every occurrence.\nresponse:\n  - Revoke the instance role session immediately\n  - Isolate the instance and preserve it for analysis\n  - Enforce IMDSv2 on every instance\n  - Review everything the credentials did\ntests:\n  should_match:\n    - userIdentity:\n        type: AssumedRole\n        arn: 'arn:aws:sts::123456789012:assumed-role/app-role/i-0abc123'\n  should_not_match:\n    - userIdentity:\n        type: AssumedRole\n        arn: 'arn:aws:sts::123456789012:assumed-role/GitHubActionsDeploy/run-42'",
        },
      ],
      expect:
        "<p>A growing rule set with tests. Run the validator after each addition — the <code>should_not_match</code> case in the second rule is doing real work, distinguishing an instance role from a CI role.</p>",
    },
    {
      title: "Generate coverage reporting",
      time: "40 min",
      why: "Coverage that is computed from the rules cannot drift from the rules.",
      body: "<p>Produce both a summary and an ATT&amp;CK Navigator layer, straight from the rule files.</p>",
      commands: [
        {
          lang: "python",
          label: "coverage.py",
          code: "#!/usr/bin/env python3\nimport collections\nimport json\nimport pathlib\n\nimport yaml\n\nSCORE = {'critical': 100, 'high': 75, 'medium': 50, 'low': 25}\n\nrules = []\nfor p in pathlib.Path('detections').rglob('*.yml'):\n    if p.name != 'schema.yml':\n        rules.append(yaml.safe_load(open(p)))\n\nby_status = collections.Counter(r['status'] for r in rules)\nby_sev = collections.Counter(r['severity'] for r in rules)\nby_source = collections.Counter(r['source'] for r in rules)\n\nprint(f'{len(rules)} rules')\nprint(f'  status:   {dict(by_status)}')\nprint(f'  severity: {dict(by_sev)}')\nprint(f'  source:   {dict(by_source)}')\n\ntech = {}\nfor r in rules:\n    if r['status'] != 'production':\n        continue\n    for t in r['attack']:\n        e = tech.setdefault(t, {'score': 0, 'rules': []})\n        e['score'] = max(e['score'], SCORE[r['severity']])\n        e['rules'].append(r['id'])\n\nprint(f'\\n{len(tech)} ATT&CK techniques covered by production rules:')\nfor t, v in sorted(tech.items()):\n    print(f'  {t}: {\", \".join(v[\"rules\"])}')\n\nlayer = {\n    'name': 'Cloud detection coverage',\n    'versions': {'attack': '14', 'navigator': '4.9.1', 'layer': '4.5'},\n    'domain': 'enterprise-attack',\n    'description': f'Generated from {len(rules)} rules',\n    'techniques': [{'techniqueID': t, 'score': v['score'],\n                    'comment': ', '.join(v['rules'])}\n                   for t, v in sorted(tech.items())],\n}\npathlib.Path('build').mkdir(exist_ok=True)\npathlib.Path('build/coverage.json').write_text(json.dumps(layer, indent=2))",
        },
      ],
      expect:
        "<p>A summary and an importable Navigator layer, regenerated on every run.</p>",
      expectCode:
        "3 rules\n  status:   {'production': 3}\n  severity: {'high': 1, 'critical': 2}\n  source:   {'cloudtrail': 3}\n\n3 ATT&CK techniques covered by production rules:\n  T1078.004: cloud-root-account-usage\n  T1552.005: cloud-instance-creds-used-externally\n  T1562.008: cloud-logging-disabled",
    },
    {
      title: "Wire it into CI",
      time: "40 min",
      body: "<p>Validate on every pull request, deploy from main using the OIDC role from project 07.</p>",
      commands: [
        {
          lang: "yaml",
          label: ".github/workflows/detections.yml",
          code: "name: Detection pipeline\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\npermissions:\n  contents: read\n  id-token: write\n\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with: { python-version: '3.11' }\n      - run: pip install pyyaml\n      - name: Validate rules\n        run: python validate.py\n      - name: Report coverage\n        run: python coverage.py\n      - uses: actions/upload-artifact@v4\n        with:\n          name: coverage-layer\n          path: build/coverage.json\n\n  deploy:\n    needs: validate\n    if: github.ref == 'refs/heads/main'\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with: { python-version: '3.11' }\n      - run: pip install boto3 pyyaml\n      - uses: aws-actions/configure-aws-credentials@v4\n        with:\n          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeploy\n          aws-region: us-east-1\n      - run: python deploy_cloudwatch.py",
        },
      ],
      expect:
        "<p>Rules validated on every PR and deployed on merge. The coverage layer is downloadable from every run, so the current picture is always one click away.</p>",
      fixes: [
        {
          problem: "The deploy job cannot create metric filters",
          cause: "The OIDC role from project 07 has no CloudWatch Logs permissions.",
          fix: "Add <code>logs:PutMetricFilter</code>, <code>cloudwatch:PutMetricAlarm</code>, and <code>sns:ListTopics</code> to its policy, scoped to your log group.",
        },
      ],
    },
    {
      title: "Document the design",
      time: "35 min",
      body: "<p>Write the README explaining the architecture: why rules are platform-neutral, where platform knowledge lives, how status gates deployment, and how to add a rule. Include the coverage output.</p><p>The design argument is the valuable part — anyone can write a YAML loader, but explaining why the abstraction boundary sits where it does is what demonstrates architectural thinking.</p>",
      expect:
        "<p>A repository someone else could add a detection to, plus a coverage report generated from the rules themselves.</p>",
    },
  ],
  after: [
    "Write a second deployer for a different platform — even a partial one proves the abstraction holds.",
    "Add a scheduled job that fires a synthetic event weekly and confirms the alarm still triggers. Detections rot silently otherwise.",
    "Read about Panther and Matano — open-source cloud SIEMs built entirely around detection-as-code.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 11 — Cloud incident response simulation                                     */
/* -------------------------------------------------------------------------- */

export const c11: ProjectGuide = {
  slug: "cloud-incident-response",
  projectId: 11,
  intro:
    "<p>Cloud incident response differs from on-premises in ways that catch people out. Evidence is API calls rather than disk images. Containment can be a policy change rather than a network cable. And the blast radius is defined by IAM, not by network topology — an attacker with the right credential does not need to move laterally at all.</p><p>You are going to stage a realistic cloud compromise in your own account, respond to it end to end, and write the report. The scenario deliberately mirrors how these actually unfold: a leaked credential, reconnaissance, a persistence identity, and an attempt to disable logging.</p>",
  glossary: [
    {
      term: "Cloud evidence",
      plain:
        "Primarily API call records — CloudTrail. Also snapshots, flow logs, and configuration history. Almost all of it is retrievable after the fact, which is a genuine advantage over on-premises.",
    },
    {
      term: "Session revocation",
      plain:
        "Invalidating temporary credentials already issued. Deleting an access key does not kill sessions assumed with it — you need an explicit revocation policy.",
    },
    {
      term: "Snapshot",
      plain: "A point-in-time copy of a disk. The cloud equivalent of a forensic image, and far faster to take.",
    },
    {
      term: "Blast radius",
      plain: "Everything one compromised identity could reach. In cloud this is an IAM question, not a network one.",
    },
    {
      term: "Dwell time",
      plain: "Time between the attacker's first action and detection.",
    },
  ],
  before: [
    "<b>Projects 01–04 and 10 finished.</b> You need detections in place for the response to be realistic.",
    "About 8 hours across two sessions — stage it, then respond in a later session.",
  ],
  steps: [
    {
      title: "Prepare the response plan first",
      time: "50 min",
      why: "Written before the incident, this is a plan. Written during, it is an excuse. Cloud IR has specific steps that are easy to get wrong under pressure — particularly session revocation.",
      body: "<p>Write a cloud-specific runbook. The generic IR plan does not cover the parts that matter here.</p>",
      commands: [
        {
          lang: "bash",
          label: "cloud-ir-runbook.md",
          code: "cat > cloud-ir-runbook.md <<'EOF'\n# Cloud incident response runbook\n\n## 0. Before touching anything\n- [ ] Start an incident log (timestamp, action, actor, result)\n- [ ] Note the current time in UTC — CloudTrail is UTC\n- [ ] Do NOT delete anything yet\n\n## 1. Identify\n- [ ] Which identity? (user, role, instance role, federated)\n- [ ] What did it do?  aws cloudtrail lookup-events --lookup-attributes\n      AttributeKey=Username,AttributeValue=NAME\n- [ ] From where?  check sourceIPAddress on every event\n- [ ] Since when?  find the FIRST anomalous event, not the alerting one\n\n## 2. Preserve\n- [ ] Export the relevant CloudTrail window to a file — do this early\n- [ ] Snapshot any affected EBS volumes\n- [ ] Record current IAM state (policies, keys, roles) BEFORE changing it\n\n## 3. Contain — order matters\n- [ ] Deactivate access keys   (does NOT kill existing sessions)\n- [ ] Attach AWSRevokeOlderSessions policy  (this DOES kill them)\n- [ ] Remove the identity's permissions\n- [ ] Isolate affected compute with a deny-all security group\n- [ ] Do NOT terminate instances — you lose the evidence\n\n## 4. Eradicate\n- [ ] Enumerate ALL persistence: users, keys, roles, trust policies,\n      Lambda functions, EventBridge rules, launch templates\n- [ ] Remove each, recording what and when\n- [ ] Verify by re-enumerating\n\n## 5. Recover\n- [ ] Rotate every credential the identity could have read\n- [ ] Restore any deleted/modified resources\n- [ ] Confirm logging is running\n\n## 6. Lessons learned\n- [ ] Dwell time\n- [ ] What detected it, and what should have\n- [ ] Assigned, dated actions\nEOF",
        },
      ],
      expect:
        "<p>A runbook. The critical line is the session revocation one — deactivating a key while assumed sessions remain valid is the most common cloud IR mistake there is.</p>",
    },
    {
      title: "Stage the compromise",
      time: "50 min",
      warn: "Your own lab account only. Record everything you do in a sealed file, then wait — ideally respond in a different session.",
      body: "<p>Simulate a leaked developer credential and a realistic follow-on chain.</p>",
      commands: [
        {
          lang: "bash",
          label: "Stage 1 — the 'leaked' identity",
          code: "aws iam create-user --user-name dev-jenkins\naws iam attach-user-policy --user-name dev-jenkins \\\n  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess\n\nKEYS=$(aws iam create-access-key --user-name dev-jenkins)\necho \"$KEYS\" > /tmp/leaked-key.json\n\nexport AWS_ACCESS_KEY_ID=$(echo \"$KEYS\" | jq -r .AccessKey.AccessKeyId)\nexport AWS_SECRET_ACCESS_KEY=$(echo \"$KEYS\" | jq -r .AccessKey.SecretAccessKey)",
        },
        {
          lang: "bash",
          label: "Stage 2 — reconnaissance, as an attacker would",
          code: "aws sts get-caller-identity\naws iam list-users\naws iam list-roles\naws s3 ls\naws ec2 describe-instances\naws iam get-account-authorization-details --max-items 5",
        },
        {
          lang: "bash",
          label: "Stage 3 — persistence and defence evasion",
          code: "# A second identity, so losing the first does not matter\naws iam create-user --user-name svc-backup 2>/dev/null\naws iam attach-user-policy --user-name svc-backup \\\n  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess\naws iam create-access-key --user-name svc-backup\n\n# Try to stop logging\naws cloudtrail stop-logging --name lab-trail",
        },
        {
          lang: "bash",
          label: "Seal the ground truth and step away",
          code: "unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY\n\ncat > ground-truth.txt <<'EOF'\n(record every command and its UTC timestamp)\nEOF\nzip -e ground-truth.zip ground-truth.txt && rm ground-truth.txt",
        },
      ],
      expect:
        "<p>Your detections from projects 04 and 10 should have fired — check your email. If the logging-disabled alert arrived, that is your entry point.</p>",
    },
    {
      title: "Identify — scope before you act",
      time: "70 min",
      why: "The alert tells you one thing happened. Scoping tells you everything that happened, and acting before you know the scope is how you leave persistence behind.",
      body: "<p>Start the incident log. First entry, with a timestamp, before anything else.</p>",
      commands: [
        {
          lang: "bash",
          label: "Everything this identity did",
          code: "aws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=Username,AttributeValue=dev-jenkins \\\n  --max-results 200 --output json > /tmp/incident-events.json\n\njq -r '.Events[] | \"\\(.EventTime)  \\(.EventName)\"' /tmp/incident-events.json | sort",
        },
        {
          lang: "bash",
          label: "Find the FIRST action — this defines dwell time",
          code: "jq -r '.Events[].EventTime' /tmp/incident-events.json | sort | head -1",
        },
        {
          lang: "bash",
          label: "Where did the calls come from?",
          code: "jq -r '.Events[].CloudTrailEvent' /tmp/incident-events.json |\n  jq -r '.sourceIPAddress' | sort | uniq -c | sort -rn",
        },
        {
          lang: "bash",
          label: "What is the blast radius? What COULD this identity reach?",
          code: "aws iam list-attached-user-policies --user-name dev-jenkins\naws iam list-user-policies --user-name dev-jenkins\n\n# PowerUserAccess is everything except IAM — so: all data, all compute.\n# Note that in the log now; it determines the credential rotation scope.",
        },
      ],
      expect:
        "<p>A timeline and a blast radius. Crucially you should spot the <code>CreateUser</code> for <code>svc-backup</code> — that is the persistence, and containing only <code>dev-jenkins</code> would leave the attacker with full admin.</p>",
      expectCode:
        "2026-07-26T16:02:11Z  GetCallerIdentity\n2026-07-26T16:02:19Z  ListUsers\n2026-07-26T16:02:24Z  ListRoles\n2026-07-26T16:03:02Z  CreateUser          <- persistence\n2026-07-26T16:03:08Z  AttachUserPolicy    <- made it admin\n2026-07-26T16:03:15Z  CreateAccessKey\n2026-07-26T16:03:41Z  StopLogging         <- defence evasion",
      fixes: [
        {
          problem: "lookup-events returns nothing",
          cause: "Up to 15 minutes of delivery lag, or the username filter does not match.",
          fix: "Query CloudWatch Logs Insights instead — it is faster. Or search without the filter and grep the output.",
        },
      ],
    },
    {
      title: "Preserve the evidence",
      time: "35 min",
      why: "Containment is about to change IAM state. Record it first — you cannot reconstruct what a policy looked like before you detached it.",
      body: "<p>Capture the current state and hash it.</p>",
      commands: [
        {
          lang: "bash",
          label: "IAM state before you touch it",
          code: "mkdir -p evidence && cd evidence\n\naws iam get-account-authorization-details > iam-full-state.json\naws iam list-users > users.json\naws iam list-access-keys --user-name dev-jenkins > jenkins-keys.json\naws iam list-access-keys --user-name svc-backup > backup-keys.json\n\ncp /tmp/incident-events.json .\n\nsha256sum *.json > MANIFEST.sha256\ncat MANIFEST.sha256",
        },
        {
          lang: "bash",
          label: "Export the full CloudTrail window",
          code: "aws logs start-query \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --start-time $(($(date +%s) - 7200)) --end-time $(date +%s) \\\n  --query-string 'fields @timestamp, @message | sort @timestamp asc | limit 10000'\n# then get-query-results and save the output",
        },
      ],
      expect: "<p>An evidence folder with a hash manifest, captured before any change.</p>",
    },
    {
      title: "Contain — in the right order",
      time: "50 min",
      why: "This is where cloud IR differs most from on-premises, and where the common mistake lives.",
      warn: "Deactivating an access key does <b>not</b> invalidate sessions already assumed with it. Those remain valid until they expire — up to 12 hours. Session revocation is a separate, explicit step.",
      body: "<p>Contain both identities, and revoke sessions rather than only disabling keys.</p>",
      commands: [
        {
          lang: "bash",
          label: "Step 1 — deactivate keys",
          code: "for u in dev-jenkins svc-backup; do\n  for k in $(aws iam list-access-keys --user-name \"$u\" \\\n             --query 'AccessKeyMetadata[].AccessKeyId' --output text); do\n    aws iam update-access-key --user-name \"$u\" --access-key-id \"$k\" --status Inactive\n    echo \"deactivated $u / $k\"\n  done\ndone",
        },
        {
          lang: "bash",
          label: "Step 2 — the step people miss: kill existing sessions",
          code: "NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)\n\ncat > revoke.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Deny\",\n    \"Action\": \"*\",\n    \"Resource\": \"*\",\n    \"Condition\": {\n      \"DateLessThan\": { \"aws:TokenIssueTime\": \"$NOW\" }\n    }\n  }]\n}\nEOF\n\nfor u in dev-jenkins svc-backup; do\n  aws iam put-user-policy --user-name \"$u\" \\\n    --policy-name AWSRevokeOlderSessions \\\n    --policy-document file://revoke.json\ndone",
        },
        {
          lang: "bash",
          label: "Step 3 — remove permissions, and restore logging",
          code: "aws iam detach-user-policy --user-name dev-jenkins \\\n  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess\naws iam detach-user-policy --user-name svc-backup \\\n  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess\n\naws cloudtrail start-logging --name lab-trail\naws cloudtrail get-trail-status --name lab-trail --query IsLogging",
        },
      ],
      expect:
        "<p>Both identities neutralised and logging restored. The revocation policy is the interesting artefact — it denies everything for tokens issued before now, which is what actually stops an in-flight session.</p>",
      expectCode: "true",
      fixes: [
        {
          problem: "The attacker seems to still be active after key deactivation",
          cause: "Exactly the session problem — assumed-role sessions survive key deactivation.",
          fix: "Apply the revocation policy above. For roles rather than users, the equivalent is <code>aws iam put-role-policy</code> with the same document.",
        },
      ],
    },
    {
      title: "Eradicate — find everything",
      time: "45 min",
      why: "Miss one persistence mechanism and you are back here tomorrow. Cloud offers more hiding places than people expect.",
      body: "<p>Enumerate systematically rather than fixing what you happen to remember.</p>",
      commands: [
        {
          lang: "bash",
          label: "Recently created identities",
          code: "aws iam list-users \\\n  --query 'Users[?CreateDate>=`2026-07-26`].[UserName,CreateDate]' --output table\n\naws iam list-roles \\\n  --query 'Roles[?CreateDate>=`2026-07-26`].[RoleName,CreateDate]' --output table",
        },
        {
          lang: "bash",
          label: "Role trust policies — the subtle backdoor",
          code: "# A role whose trust policy allows an external account is a persistent\n# backdoor that survives deleting every user.\nfor r in $(aws iam list-roles --query 'Roles[].RoleName' --output text); do\n  trust=$(aws iam get-role --role-name \"$r\" \\\n          --query 'Role.AssumeRolePolicyDocument' --output json)\n  if echo \"$trust\" | grep -qE '\"AWS\": *\"arn:aws:iam::[0-9]+:root\"'; then\n    acct=$(echo \"$trust\" | grep -oE '[0-9]{12}' | head -1)\n    echo \"$r trusts account $acct\"\n  fi\ndone",
        },
        {
          lang: "bash",
          label: "Other persistence surfaces",
          code: "aws lambda list-functions --query 'Functions[].[FunctionName,LastModified]' --output table\naws events list-rules --query 'Rules[].[Name,ScheduleExpression]' --output table\naws ec2 describe-launch-templates --query 'LaunchTemplates[].LaunchTemplateName'",
        },
        {
          lang: "bash",
          label: "Remove, then verify",
          code: "for k in $(aws iam list-access-keys --user-name svc-backup \\\n           --query 'AccessKeyMetadata[].AccessKeyId' --output text); do\n  aws iam delete-access-key --user-name svc-backup --access-key-id \"$k\"\ndone\naws iam delete-user-policy --user-name svc-backup --policy-name AWSRevokeOlderSessions\naws iam delete-user --user-name svc-backup\n\naws iam list-users --query 'Users[].UserName' --output text",
        },
      ],
      expect:
        "<p><code>svc-backup</code> gone and no unexpected roles, functions, or rules. The trust-policy check is worth internalising — a cross-account trust is invisible in a user listing and survives everything else you delete.</p>",
    },
    {
      title: "Recover and rotate",
      time: "35 min",
      why: "The identity had PowerUserAccess. Anything it could read must be assumed read.",
      body: "<p>Rotate the credentials in the blast radius, not just the compromised one.</p>",
      commands: [
        {
          lang: "bash",
          label: "What could it have read?",
          code: "aws secretsmanager list-secrets --query 'SecretList[].Name' --output table 2>/dev/null\naws ssm describe-parameters \\\n  --query 'Parameters[?Type==`SecureString`].Name' --output table 2>/dev/null\n\n# Did it actually read any of them?\njq -r '.Events[] | select(.EventName | test(\"GetSecretValue|GetParameter\")) |\n  \"\\(.EventTime)  \\(.EventName)\"' /tmp/incident-events.json",
        },
        {
          lang: "bash",
          label: "Confirm the account is healthy again",
          code: "aws cloudtrail get-trail-status --name lab-trail --query IsLogging\naws s3control get-public-access-block --account-id \"$ACCT\" \\\n  --query 'PublicAccessBlockConfiguration'\naws cloudwatch describe-alarms \\\n  --query 'MetricAlarms[?starts_with(AlarmName, `detect-`)].[AlarmName,StateValue]' \\\n  --output table",
        },
      ],
      expect:
        "<p>Logging on, public access blocked, detections in OK state. If nothing was actually read, say so explicitly in the report — a scoped, evidence-based statement is far stronger than blanket rotation of everything.</p>",
    },
    {
      title: "Report, and check against ground truth",
      time: "60 min",
      why: "Now open the sealed file. Whatever you missed is the most valuable output of the project.",
      body: "<p>Write the report first, then unseal <code>ground-truth.zip</code> and produce a coverage comparison.</p><p>Structure it as: executive summary, timeline, root cause, blast radius, response actions with times, detection gaps, and prioritised recommendations. Lead with dwell time and blast radius — those are the two numbers leadership asks for.</p>",
      commands: [
        {
          lang: "bash",
          label: "Unseal and compare",
          code: "unzip ground-truth.zip\ndiff <(sort ground-truth.txt) <(sort my-findings.txt) || true",
        },
      ],
      expect:
        "<p>An honest gap list. Common misses on a first attempt: the role trust policy check, and the fact that key deactivation alone left sessions alive.</p>",
      expectCode:
        "GROUND TRUTH vs FINDINGS\n✓ leaked credential used from external IP     detected, 4m12s\n✓ reconnaissance (ListUsers, ListRoles)       found in timeline\n✓ svc-backup persistence user                 found\n✗ CreateAccessKey on svc-backup               MISSED initially\n✓ StopLogging                                 detected, alerted\n\nDwell time: 4 min 12 s.  Blast radius: PowerUserAccess (all data, all compute).",
    },
    {
      title: "Clean up and close the loop",
      time: "25 min",
      body: "<p>Remove the staged identities and complete at least one lessons-learned action before you call it done.</p>",
      commands: [
        {
          lang: "bash",
          code: "for k in $(aws iam list-access-keys --user-name dev-jenkins \\\n           --query 'AccessKeyMetadata[].AccessKeyId' --output text); do\n  aws iam delete-access-key --user-name dev-jenkins --access-key-id \"$k\"\ndone\naws iam delete-user-policy --user-name dev-jenkins --policy-name AWSRevokeOlderSessions 2>/dev/null\naws iam delete-user --user-name dev-jenkins\n\nrm -f /tmp/leaked-key.json\naws iam list-users --query 'Users[].UserName' --output table",
        },
      ],
      expect:
        "<p>A clean account, and one completed action from your lessons-learned list. Suggested first action: add a detection for <code>CreateUser</code> followed by <code>AttachUserPolicy</code> with an admin policy within five minutes — that pairing is a very high-fidelity persistence signal.</p>",
    },
  ],
  after: [
    "Re-run in a month without your notes. The dwell-time improvement is the number worth quoting.",
    "Read published cloud incident write-ups — the Capital One and Code Spaces incidents are both instructive and free to read about.",
    "Add the session-revocation step to any IR runbook you own. It is the single most commonly missed cloud containment action.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 12 — Data perimeter                                                         */
/* -------------------------------------------------------------------------- */

export const c12: ProjectGuide = {
  slug: "data-perimeter",
  projectId: 12,
  intro:
    "<p>Traditional security asks &ldquo;who can access this?&rdquo;. A <b>data perimeter</b> asks three sharper questions: only <b>trusted identities</b>, from <b>expected networks</b>, may access <b>my resources</b>. Any request failing one of those is denied regardless of what any permission policy says.</p><p>This matters because IAM policies alone cannot stop exfiltration. An identity with legitimate S3 access can copy data to a bucket in an attacker's account, and every permission check passes. A data perimeter closes that.</p><p>You are going to build all three edges, prove each one blocks what it should, and — importantly — measure what breaks, because a perimeter that blocks legitimate work gets removed within a week.</p>",
  glossary: [
    {
      term: "Data perimeter",
      plain:
        "A set of controls ensuring only trusted identities, from expected networks, reach your resources. Three overlapping boundaries, not one.",
    },
    {
      term: "Resource policy",
      plain:
        "A policy attached to the resource rather than the identity. This is what lets you restrict access by who is asking, from where — independent of their own permissions.",
    },
    {
      term: "VPC endpoint",
      plain:
        "A private path from your network to an AWS service that never traverses the internet. Endpoint policies are where the network edge of a perimeter is enforced.",
    },
    {
      term: "aws:PrincipalOrgID",
      plain:
        "A condition key matching any identity in your organisation. The cleanest way to express &ldquo;trusted identity&rdquo; without listing accounts.",
    },
    {
      term: "Confused deputy",
      plain:
        "A trusted AWS service tricked into accessing your resource for someone else. <code>aws:SourceArn</code> and <code>aws:SourceAccount</code> conditions are the defence.",
    },
  ],
  before: [
    "<b>Projects 01–03 and 09 finished.</b> You need an organisation for the identity perimeter.",
    "About 6 hours.",
  ],
  steps: [
    {
      title: "Understand the three edges",
      time: "30 min",
      why: "People implement one edge and believe they have a perimeter. Knowing which attack each edge stops is what makes the design defensible.",
      body: "<p>Three questions, three controls, three different attacks stopped:</p><table><tr><th>Edge</th><th>Question</th><th>Stops</th></tr><tr><td><b>Identity</b></td><td>Only identities I trust may access my resources</td><td>An external account reading your bucket</td></tr><tr><td><b>Resource</b></td><td>My identities may only access resources I trust</td><td>Exfiltration to an attacker's bucket</td></tr><tr><td><b>Network</b></td><td>Access happens only from expected networks</td><td>Stolen credentials used from anywhere else</td></tr></table><p>The <b>resource</b> edge is the one most often missed, and the one that stops exfiltration. Note that in your design document.</p>",
      expect: "<p>A one-page design naming each edge, the control implementing it, and the attack it stops.</p>",
    },
    {
      title: "Build the identity perimeter",
      time: "50 min",
      why: "The most common accidental exposure is a resource policy that trusts more than intended. This edge makes organisation membership a hard requirement.",
      body: "<p>Attach a resource policy requiring the caller to be in your organisation.</p>",
      commands: [
        {
          lang: "bash",
          label: "Set up",
          code: "ACCT=$(aws sts get-caller-identity --query Account --output text)\nORG=$(aws organizations describe-organization --query 'Organization.Id' --output text)\nBUCKET=\"perimeter-lab-$ACCT\"\n\naws s3api create-bucket --bucket \"$BUCKET\" --region us-east-1\necho 'perimeter test data' > test.txt\naws s3 cp test.txt \"s3://$BUCKET/\"\n\necho \"Org: $ORG  Bucket: $BUCKET\"",
        },
        {
          lang: "bash",
          label: "The identity perimeter policy",
          code: "cat > identity-perimeter.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"DenyOutsideMyOrganization\",\n      \"Effect\": \"Deny\",\n      \"Principal\": \"*\",\n      \"Action\": \"s3:*\",\n      \"Resource\": [\n        \"arn:aws:s3:::$BUCKET\",\n        \"arn:aws:s3:::$BUCKET/*\"\n      ],\n      \"Condition\": {\n        \"StringNotEqualsIfExists\": { \"aws:PrincipalOrgID\": \"$ORG\" },\n        \"BoolIfExists\": { \"aws:PrincipalIsAWSService\": \"false\" }\n      }\n    }\n  ]\n}\nEOF\n\naws s3api put-bucket-policy --bucket \"$BUCKET\" \\\n  --policy file://identity-perimeter.json",
        },
      ],
      expect:
        "<p>Applied. The two condition modifiers matter: <code>IfExists</code> so requests without the key are not accidentally denied, and the <code>PrincipalIsAWSService</code> exception so AWS services like CloudTrail can still write.</p>",
      fixes: [
        {
          problem: "You immediately lose access to your own bucket",
          cause: "Your account is not in the organisation, or the org ID is wrong.",
          fix: "Verify with <code>aws organizations describe-organization --query Organization.Id</code>. If you have no organisation, use <code>aws:PrincipalAccount</code> with your account ID instead.",
        },
      ],
    },
    {
      title: "Prove the identity edge blocks outsiders",
      time: "30 min",
      why: "Testing the deny path is the only way to know the policy works. A policy that fails open looks identical to one that works.",
      body: "<p>Confirm you still have access, then confirm an anonymous caller does not.</p>",
      commands: [
        {
          lang: "bash",
          label: "You should still work",
          code: "aws s3 ls \"s3://$BUCKET\"\naws s3 cp \"s3://$BUCKET/test.txt\" -",
        },
        {
          lang: "bash",
          label: "An outsider should not",
          code: "aws s3 ls \"s3://$BUCKET\" --no-sign-request\ncurl -s -o /dev/null -w '%{http_code}\\n' \"https://$BUCKET.s3.amazonaws.com/test.txt\"",
        },
      ],
      expect:
        "<p>You succeed; unauthenticated access is denied. This holds even if someone later adds a permissive Allow — an explicit Deny always wins in IAM evaluation, which is what makes this a perimeter rather than a preference.</p>",
      expectCode: "2026-07-26 16:20:11         20 test.txt\nperimeter test data\n\nAn error occurred (AccessDenied)\n403",
    },
    {
      title: "Build the resource perimeter — the anti-exfiltration edge",
      time: "60 min",
      why: "This is the edge that stops data leaving. Nothing else in your account does.",
      body: "<p>An SCP restricting which S3 buckets your identities may write to. Without it, any identity with S3 access can copy your data to a bucket the attacker controls, and every permission check passes.</p>",
      commands: [
        {
          lang: "bash",
          label: "The SCP",
          code: "cat > resource-perimeter.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Sid\": \"DenyS3OutsideMyOrganization\",\n    \"Effect\": \"Deny\",\n    \"Action\": [\"s3:PutObject\", \"s3:GetObject\"],\n    \"Resource\": \"*\",\n    \"Condition\": {\n      \"StringNotEqualsIfExists\": {\n        \"aws:ResourceOrgID\": \"$ORG\"\n      },\n      \"ForAllValues:StringNotEquals\": {\n        \"aws:CalledVia\": [\n          \"dataexchange.amazonaws.com\",\n          \"servicecatalog.amazonaws.com\"\n        ]\n      }\n    }\n  }]\nEOF\n\naws organizations create-policy --name ResourcePerimeter \\\n  --type SERVICE_CONTROL_POLICY \\\n  --description \"Identities may only read/write S3 inside the organisation\" \\\n  --content file://resource-perimeter.json",
        },
        {
          lang: "bash",
          label: "Attach to the Workloads OU from project 09",
          code: "WL=$(aws organizations list-organizational-units-for-parent \\\n     --parent-id $(aws organizations list-roots --query 'Roots[0].Id' --output text) \\\n     --query \"OrganizationalUnits[?Name=='Workloads'].Id\" --output text)\n\nPID=$(aws organizations list-policies --filter SERVICE_CONTROL_POLICY \\\n      --query \"Policies[?Name=='ResourcePerimeter'].Id\" --output text)\n\naws organizations attach-policy --policy-id \"$PID\" --target-id \"$WL\"",
        },
        {
          lang: "bash",
          label: "Test — try to exfiltrate to a public bucket outside your org",
          code: "# Assume into the member account from project 09 first, then:\naws s3 cp \"s3://$BUCKET/test.txt\" s3://some-external-bucket/stolen.txt 2>&1 | tail -2\n\n# A well-known public dataset — reading it should now also be denied\naws s3 ls s3://nyc-tlc/ --no-sign-request 2>&1 | tail -2",
        },
      ],
      expect:
        "<p>Denied by SCP. This is the control that turns &ldquo;an attacker with credentials can take the data&rdquo; into &ldquo;an attacker with credentials cannot take the data anywhere useful&rdquo;.</p>",
      fixes: [
        {
          problem: "Legitimate access to public datasets breaks",
          cause:
            "Working as designed — and this is exactly the trade-off to document rather than hide.",
          fix: "Add specific exceptions by ARN in the condition, or use <code>aws:ResourceAccount</code> with an allowlist. Record every exception and why it exists.",
        },
      ],
    },
    {
      title: "Build the network perimeter",
      time: "50 min",
      why: "The edge that neutralises stolen credentials. A key that only works from your VPC is far less useful to an attacker who exfiltrated it.",
      body: "<p>Restrict access to expected network paths using VPC endpoints and source IP conditions.</p>",
      commands: [
        {
          lang: "bash",
          label: "Create a VPC endpoint for S3",
          code: "VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true \\\n      --query 'Vpcs[0].VpcId' --output text)\nRT=$(aws ec2 describe-route-tables --filters Name=vpc-id,Values=\"$VPC\" \\\n     --query 'RouteTables[0].RouteTableId' --output text)\n\nVPCE=$(aws ec2 create-vpc-endpoint \\\n  --vpc-id \"$VPC\" \\\n  --service-name com.amazonaws.us-east-1.s3 \\\n  --route-table-ids \"$RT\" \\\n  --query 'VpcEndpoint.VpcEndpointId' --output text)\n\necho \"Endpoint: $VPCE\"",
        },
        {
          lang: "bash",
          label: "Bucket policy allowing only the endpoint or a known IP",
          code: "MY_IP=$(curl -s ifconfig.me)\n\ncat > network-perimeter.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"DenyOutsideMyOrganization\",\n      \"Effect\": \"Deny\",\n      \"Principal\": \"*\",\n      \"Action\": \"s3:*\",\n      \"Resource\": [\"arn:aws:s3:::$BUCKET\", \"arn:aws:s3:::$BUCKET/*\"],\n      \"Condition\": {\n        \"StringNotEqualsIfExists\": { \"aws:PrincipalOrgID\": \"$ORG\" },\n        \"BoolIfExists\": { \"aws:PrincipalIsAWSService\": \"false\" }\n      }\n    },\n    {\n      \"Sid\": \"DenyOutsideExpectedNetworks\",\n      \"Effect\": \"Deny\",\n      \"Principal\": \"*\",\n      \"Action\": \"s3:*\",\n      \"Resource\": [\"arn:aws:s3:::$BUCKET\", \"arn:aws:s3:::$BUCKET/*\"],\n      \"Condition\": {\n        \"StringNotEqualsIfExists\": { \"aws:SourceVpce\": \"$VPCE\" },\n        \"NotIpAddressIfExists\": { \"aws:SourceIp\": [\"$MY_IP/32\"] },\n        \"BoolIfExists\": { \"aws:PrincipalIsAWSService\": \"false\", \"aws:ViaAWSService\": \"false\" }\n      }\n    }\n  ]\n}\nEOF\n\naws s3api put-bucket-policy --bucket \"$BUCKET\" --policy file://network-perimeter.json",
        },
      ],
      warn: "This is where you can lock yourself out. If your IP changes — mobile network, VPN, DHCP lease — you lose access. Keep the management account available as a way back in, since SCPs and bucket policies can be removed from there.",
      expect:
        "<p>Access works from your IP and via the endpoint. Test the deny path by switching networks (mobile hotspot works) and confirming you are refused.</p>",
      expectCode:
        "# from your normal network\n2026-07-26 16:20:11         20 test.txt\n\n# from a different network\nAn error occurred (AccessDenied) when calling the ListObjectsV2 operation",
      fixes: [
        {
          problem: "You locked yourself out of the bucket",
          cause: "Your IP changed, or the endpoint ID is wrong.",
          fix: "Bucket policies can always be replaced by an identity with <code>s3:PutBucketPolicy</code> from an allowed context — or delete the policy from the management account: <code>aws s3api delete-bucket-policy --bucket $BUCKET</code>. This is why you test in a lab.",
        },
      ],
    },
    {
      title: "Measure what you broke",
      time: "45 min",
      why: "A perimeter that blocks legitimate work is removed within a week. Measuring the impact is what makes it survivable — and it is the step that distinguishes an architect from an enthusiast.",
      body: "<p>Query CloudTrail for denials caused by your perimeter and check whether any were legitimate.</p>",
      commands: [
        {
          lang: "bash",
          label: "What is being denied, and to whom?",
          code: "QID=$(aws logs start-query \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --start-time $(($(date +%s) - 86400)) --end-time $(date +%s) \\\n  --query-string '\n    fields @timestamp, userIdentity.arn, eventName, errorCode, sourceIPAddress\n    | filter errorCode = \"AccessDenied\"\n    | stats count() as denials by userIdentity.arn, eventName\n    | sort denials desc' \\\n  --query queryId --output text)\n\nsleep 8\naws logs get-query-results --query-id \"$QID\"",
        },
        {
          lang: "bash",
          label: "Test that normal work still functions",
          code: "aws s3 cp test.txt \"s3://$BUCKET/still-works.txt\"\naws s3 ls \"s3://$BUCKET\"\naws cloudtrail get-trail-status --name lab-trail --query IsLogging",
        },
      ],
      expect:
        "<p>Only your deliberate test denials. In a real rollout you would run the perimeter in a report-only mode first — deploy the conditions to a non-production OU, measure for two weeks, then enforce. Describe that phased approach in your write-up; it is what an interviewer is listening for.</p>",
    },
    {
      title: "Document the design",
      time: "40 min",
      why: "A data perimeter is an architecture, and architectures are judged on their documentation.",
      body: "<p>Write it up covering: the three edges and the attack each stops, the exact condition keys and why each modifier (<code>IfExists</code>, <code>ForAllValues</code>) is there, the exceptions you granted and why, the rollout plan you would use in production, and the ways back in if a control misfires.</p><p>The exceptions section is the most credible part. A perimeter with no documented exceptions has either not been tested against real traffic, or is quietly not enforced.</p>",
      commands: [
        {
          lang: "yaml",
          label: "data-perimeter-design.yml",
          code: "edges:\n  identity:\n    control: S3 bucket policy with aws:PrincipalOrgID\n    stops: External accounts reading our data\n    exceptions:\n      - aws:PrincipalIsAWSService — CloudTrail and Config must write logs\n    validated: \"anonymous read returns 403 (tested 2026-07-26)\"\n\n  resource:\n    control: SCP with aws:ResourceOrgID on s3:GetObject/PutObject\n    stops: Exfiltration to buckets outside the organisation\n    exceptions:\n      - dataexchange, servicecatalog via aws:CalledVia\n    known_impact: >\n      Public dataset access breaks. Accepted: no current workload needs it.\n      Exception process documented.\n    validated: \"copy to external bucket denied by SCP (tested 2026-07-26)\"\n\n  network:\n    control: Bucket policy with aws:SourceVpce and aws:SourceIp\n    stops: Stolen credentials used from outside expected networks\n    exceptions:\n      - aws:ViaAWSService — service-to-service calls have no source IP\n    known_impact: >\n      Breaks when an admin IP changes. Mitigated by using the VPC endpoint\n      as the primary path and IP only as a break-glass.\n    validated: \"access from a different network denied (tested 2026-07-26)\"\n\nrollout:\n  - phase: 1\n    what: Deploy to Development OU only, conditions in place, 2 weeks\n    measure: AccessDenied events attributable to perimeter conditions\n  - phase: 2\n    what: Review denials, add exceptions, extend to Production OU\n  - phase: 3\n    what: Alert on any change to perimeter policies\n\nbreak_glass: >\n  All controls are removable from the management account, which is not\n  subject to SCPs and is not covered by the bucket policies.",
        },
      ],
      expect:
        "<p>A design document with a validation date on every claim. That is what makes it an architecture rather than an aspiration.</p>",
    },
    {
      title: "Clean up",
      time: "20 min",
      warn: "Remove the network perimeter before you forget about it — a future IP change would lock you out of your own bucket with no obvious cause.",
      body: "<p>Tear down the lab pieces; keep what is genuinely useful.</p>",
      commands: [
        {
          lang: "bash",
          code: "aws s3 rm \"s3://$BUCKET\" --recursive\naws s3api delete-bucket --bucket \"$BUCKET\"\n\naws ec2 delete-vpc-endpoints --vpc-endpoint-ids \"$VPCE\"\n\n# Decide deliberately about the SCP:\n#   Keep it if you intend to keep using the organisation.\n#   Remove it if the public-dataset restriction will get in your way.\n# aws organizations detach-policy --policy-id \"$PID\" --target-id \"$WL\"\n\naws s3 ls\naws ec2 describe-vpc-endpoints --query 'VpcEndpoints[].VpcEndpointId'",
        },
      ],
      expect: "<p>Lab resources gone. The organisation and guardrails from project 09 remain.</p>",
    },
  ],
  after: [
    "Read the AWS data perimeter whitepaper and the accompanying policy examples repository — it is the reference on this topic and it is free.",
    "The same three-edge model maps onto Azure (Private Link plus Azure Policy) and GCP (VPC Service Controls). VPC Service Controls in particular is the most complete implementation of the resource edge of any provider.",
    "If you build one of these for real, insist on the report-only phase. Perimeters that go straight to enforce are perimeters that get rolled back.",
  ],
};
