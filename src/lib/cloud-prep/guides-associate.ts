/**
 * Cloud-prep Associate guides, projects 02–04. Project 01 lives in guides.ts
 * because everything here assumes the account and guardrails it sets up.
 *
 * Every guide keeps the cost discipline: teardown is a numbered step, not an
 * afterthought.
 */
import type { ProjectGuide } from "@/lib/guides/types";

/* -------------------------------------------------------------------------- */
/* 02 — Expose it, detect it, then make it impossible                          */
/* -------------------------------------------------------------------------- */

export const c02: ProjectGuide = {
  slug: "expose-detect-prevent",
  projectId: 2,
  intro:
    "<p>Publicly readable storage is the single most common cause of cloud data breaches. Not a clever exploit — a checkbox someone ticked to make a file share work, and then forgot.</p><p>You are going to do the whole loop on your own account: deliberately expose a storage bucket, prove it is exposed from outside, detect it two different ways, and then apply a control that makes the mistake <b>impossible to repeat</b>.</p><p>That last part is what matters. Anyone can find a public bucket. The valuable skill is knowing which control prevents it from ever happening again, and being able to explain why prevention beats detection here.</p>",
  glossary: [
    {
      term: "Object storage",
      plain:
        "Cloud file storage addressed by name rather than by folder path. AWS calls it S3, Azure calls it Blob Storage, Google calls it Cloud Storage.",
    },
    {
      term: "Bucket / container",
      plain: "The top-level grouping for objects. Roughly a folder, but with its own permissions.",
    },
    {
      term: "ACL",
      plain:
        "Access Control List — an older, per-object permission model. Largely superseded by policies, and a frequent source of accidental exposure because it can be set per-file.",
    },
    {
      term: "Bucket policy",
      plain:
        "A JSON document attached to the bucket saying who can do what. <code>\"Principal\": \"*\"</code> means everyone on the internet.",
    },
    {
      term: "Preventive vs detective control",
      plain:
        "A detective control tells you a mistake happened. A preventive control stops it happening. Both matter, but prevention is what you reach for when the mistake is this common.",
    },
  ],
  before: [
    "<b>Project 01 finished</b> — a cloud account with a budget alert, audit logging, and a working CLI.",
    "About 2–3 hours.",
  ],
  steps: [
    {
      title: "Create the test bucket",
      time: "10 min",
      warn: "Put nothing real in it. Use obviously fake data — you are about to make this readable by the entire internet.",
      body: "<p>Create a bucket and a harmless test file.</p>",
      commands: [
        {
          lang: "bash",
          label: "AWS",
          code: "ACCT=$(aws sts get-caller-identity --query Account --output text)\nBUCKET=\"exposure-lab-$ACCT\"\n\naws s3api create-bucket --bucket \"$BUCKET\" --region us-east-1\n\necho 'This is fake test data for a security lab. Nothing real.' > test.txt\naws s3 cp test.txt \"s3://$BUCKET/test.txt\"\n\necho \"Bucket: $BUCKET\"",
        },
        {
          lang: "bash",
          label: "Azure",
          code: "az group create --name exposure-lab --location eastus\naz storage account create --name exposurelab$RANDOM \\\n  --resource-group exposure-lab --sku Standard_LRS",
        },
        {
          lang: "bash",
          label: "GCP",
          code: "gsutil mb -l us-central1 gs://exposure-lab-$RANDOM\necho 'fake test data' > test.txt\ngsutil cp test.txt gs://YOUR_BUCKET/",
        },
      ],
      expect: "<p>The bucket exists and contains one file, currently private.</p>",
      expectCode: "$ aws s3 ls s3://$BUCKET\n2026-07-26 15:02:11         55 test.txt",
      fixes: [
        {
          problem: "BucketAlreadyExists",
          cause: "S3 bucket names are globally unique across every AWS customer.",
          fix: "Append something random: <code>BUCKET=\"exposure-lab-$ACCT-$RANDOM\"</code>.",
        },
        {
          problem: "IllegalLocationConstraintException",
          cause: "Outside <code>us-east-1</code>, S3 requires an explicit location constraint.",
          fix: "Add <code>--create-bucket-configuration LocationConstraint=eu-west-1</code> matching your region.",
        },
      ],
    },
    {
      title: "Confirm it is private before you break it",
      time: "10 min",
      why: "You need a known-good baseline. Otherwise, when the exposure test succeeds, you cannot be sure your change caused it.",
      body: "<p>Try to read the file with no credentials at all — the way a stranger would.</p>",
      commands: [
        {
          lang: "bash",
          label: "Anonymous access attempt",
          code: "curl -s -o /dev/null -w '%{http_code}\\n' \\\n  \"https://$BUCKET.s3.amazonaws.com/test.txt\"\n\n# And with the CLI, explicitly unsigned\naws s3 ls \"s3://$BUCKET\" --no-sign-request",
        },
      ],
      expect: "<p><code>403</code>, and an Access Denied from the CLI. That is the correct starting state.</p>",
      expectCode:
        "403\n\nAn error occurred (AccessDenied) when calling the ListObjectsV2 operation: Access Denied",
    },
    {
      title: "Expose it — the mistake, made deliberately",
      time: "20 min",
      warn: "This bucket is now readable by anyone on the internet. Do not leave it this way, and do not put anything real in it. Step 7 removes the exposure.",
      why: "Making the mistake yourself, and seeing exactly how few steps it takes, is what makes the lesson stick.",
      body: "<p>AWS blocks public access by default now, which is a good default. You have to override it twice — that friction is itself the lesson.</p>",
      commands: [
        {
          lang: "bash",
          label: "Step 1 — remove the safety net",
          code: "aws s3api put-public-access-block --bucket \"$BUCKET\" \\\n  --public-access-block-configuration \\\n  \"BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false\"",
        },
        {
          lang: "bash",
          label: "Step 2 — the policy that actually exposes it",
          code: "cat > public-policy.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Sid\": \"PublicReadForLab\",\n    \"Effect\": \"Allow\",\n    \"Principal\": \"*\",\n    \"Action\": \"s3:GetObject\",\n    \"Resource\": \"arn:aws:s3:::$BUCKET/*\"\n  }]\n}\nEOF\n\naws s3api put-bucket-policy --bucket \"$BUCKET\" --policy file://public-policy.json",
        },
      ],
      expect:
        "<p>Two commands. That is genuinely all it takes, and it is why this breach class is so common — the same two clicks exist in the console, and both look reasonable to someone trying to make a file share work.</p>",
      fixes: [
        {
          problem: "AccessDenied on put-bucket-policy",
          cause: "The public access block is still on — it blocks the policy itself.",
          fix: "The first command must succeed before the second. Confirm with <code>aws s3api get-public-access-block --bucket $BUCKET</code>; all four values must be <code>false</code>.",
        },
      ],
    },
    {
      title: "Prove the exposure from outside",
      time: "15 min",
      why: "Verifying from an unauthenticated position is what makes it a finding rather than a theory. \"The policy looks wrong\" is weaker than \"here is the file, downloaded with no credentials\".",
      body: "<p>Read the file with no credentials, and note the URL — that is the finding.</p>",
      commands: [
        {
          lang: "bash",
          label: "Anonymous read",
          code: "curl -s \"https://$BUCKET.s3.amazonaws.com/test.txt\"\n\n# Can the whole bucket be listed, or only known filenames read?\ncurl -s \"https://$BUCKET.s3.amazonaws.com/\" | head -20",
        },
      ],
      expect:
        "<p>The file contents come back. Note the distinction the second command tests: this policy grants <code>GetObject</code> but not <code>ListBucket</code>, so an attacker must guess filenames. A policy granting both is considerably worse, and knowing the difference is exactly the kind of nuance that separates a good finding from a generic one.</p>",
      expectCode:
        "This is fake test data for a security lab. Nothing real.\n\n<Error><Code>AccessDenied</Code>...  <- listing still denied",
    },
    {
      title: "Detect it — method 1, ask the provider",
      time: "20 min",
      why: "Every provider has a built-in answer to \"which of my buckets are public?\" and it is the fastest check you can run.",
      body: "<p>Query the exposure status of every bucket in the account.</p>",
      commands: [
        {
          lang: "bash",
          label: "AWS — check every bucket",
          code: "for b in $(aws s3api list-buckets --query 'Buckets[].Name' --output text); do\n  pab=$(aws s3api get-public-access-block --bucket \"$b\" \\\n        --query 'PublicAccessBlockConfiguration.BlockPublicPolicy' \\\n        --output text 2>/dev/null || echo \"NONE\")\n  status=$(aws s3api get-bucket-policy-status --bucket \"$b\" \\\n           --query 'PolicyStatus.IsPublic' --output text 2>/dev/null || echo \"no-policy\")\n  printf '%-40s block=%-6s public=%s\\n' \"$b\" \"$pab\" \"$status\"\ndone",
        },
        {
          lang: "bash",
          label: "Azure / GCP",
          code: "# Azure — containers allowing anonymous access\naz storage container list --account-name YOUR_ACCOUNT \\\n  --query \"[?properties.publicAccess!=null].[name,properties.publicAccess]\" -o table\n\n# GCP — buckets granting allUsers\ngsutil iam get gs://YOUR_BUCKET | grep -A2 allUsers",
        },
      ],
      expect:
        "<p>Your lab bucket reports <code>public=True</code> while the CloudTrail bucket from project 01 reports <code>block=True</code>. That contrast is the check working.</p>",
      expectCode:
        "cloudtrail-lab-123456789012              block=True   public=no-policy\nexposure-lab-123456789012                block=false  public=True",
    },
    {
      title: "Detect it — method 2, from the audit log",
      time: "25 min",
      why: "Method 1 tells you the current state. The audit log tells you <b>who</b> made it public and <b>when</b> — which is what an incident actually needs.",
      body: "<p>This is the query that matters in a real investigation.</p>",
      commands: [
        {
          lang: "bash",
          label: "AWS — who changed the bucket policy?",
          code: "aws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=EventName,AttributeValue=PutBucketPolicy \\\n  --max-results 10 \\\n  --query 'Events[].[EventTime,Username,Resources[0].ResourceName]' \\\n  --output table",
        },
        {
          lang: "bash",
          label: "And who removed the public access block?",
          code: "aws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=EventName,AttributeValue=DeletePublicAccessBlock \\\n  --max-results 10 --output json |\n  jq -r '.Events[] | \"\\(.EventTime)  \\(.Username)  \\(.Resources[0].ResourceName // \"?\")\"'",
        },
      ],
      expect:
        "<p>Your own username and the exact timestamp. In a real incident this is the difference between \"a bucket is public\" and \"lab-admin made it public at 15:14 on 26 July\" — one is a finding, the other is an investigation.</p>",
      expectCode:
        "|  2026-07-26T15:14:02+00:00 |  lab-admin |  arn:aws:s3:::exposure-lab-123456789012  |",
      fixes: [
        {
          problem: "No events returned",
          cause: "CloudTrail delivers in batches — up to 15 minutes.",
          fix: "Wait and retry. Confirm the trail is live with <code>aws cloudtrail get-trail-status --name lab-trail --query IsLogging</code>.",
        },
        {
          problem: "jq: command not found",
          cause: "Not installed.",
          fix: "<code>sudo apt install jq</code> / <code>brew install jq</code>, or drop the jq pipe and use <code>--output table</code>.",
        },
      ],
    },
    {
      title: "Fix it, then make it impossible",
      time: "30 min",
      why: "This is the whole point of the project. Fixing the bucket helps once; the account-level control helps forever.",
      body: "<p>First remove the exposure. Then apply the preventive control that stops it recurring — and test that the control actually blocks you.</p>",
      commands: [
        {
          lang: "bash",
          label: "Remove the exposure",
          code: "aws s3api delete-bucket-policy --bucket \"$BUCKET\"\n\naws s3api put-public-access-block --bucket \"$BUCKET\" \\\n  --public-access-block-configuration \\\n  \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
        },
        {
          lang: "bash",
          label: "The preventive control — account-wide, covers every future bucket",
          code: "aws s3control put-public-access-block \\\n  --account-id \"$ACCT\" \\\n  --public-access-block-configuration \\\n  \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
        },
        {
          lang: "bash",
          label: "Now PROVE the control works — this must fail",
          code: "aws s3api put-bucket-policy --bucket \"$BUCKET\" --policy file://public-policy.json\n\n# And confirm the outside world is locked out again\ncurl -s -o /dev/null -w '%{http_code}\\n' \"https://$BUCKET.s3.amazonaws.com/test.txt\"",
        },
      ],
      expect:
        "<p>The policy is rejected at the account level, and anonymous access returns 403 again. You have moved from &ldquo;we would notice&rdquo; to &ldquo;it cannot happen&rdquo;, and you have the failed command as evidence.</p>",
      expectCode:
        "An error occurred (AccessDenied) when calling the PutBucketPolicy operation:\nAccess Denied  <- the account-level block rejected it. This is the win.\n\n403",
      fixes: [
        {
          problem: "The put-bucket-policy still succeeds",
          cause: "The account-level block did not apply, or you used the wrong account ID.",
          fix: "Verify with <code>aws s3control get-public-access-block --account-id $ACCT</code>. All four values must be <code>true</code>.",
        },
      ],
    },
    {
      title: "Write the alert for the case where it slips through",
      time: "25 min",
      why: "Preventive controls can be turned off by someone with enough privilege. You want to know the moment that happens.",
      body: "<p>Alert on the account-level block being modified — a rare, high-signal, almost-never-legitimate event.</p>",
      commands: [
        {
          lang: "bash",
          label: "EventBridge rule + email",
          code: "aws sns create-topic --name security-alerts\nTOPIC=$(aws sns list-topics --query \"Topics[?contains(TopicArn,'security-alerts')].TopicArn\" --output text)\naws sns subscribe --topic-arn \"$TOPIC\" --protocol email --notification-endpoint you@example.com\n# → confirm the subscription from your inbox before continuing\n\naws events put-rule --name detect-public-access-change \\\n  --event-pattern '{\n    \"source\": [\"aws.s3\"],\n    \"detail-type\": [\"AWS API Call via CloudTrail\"],\n    \"detail\": {\n      \"eventName\": [\"PutBucketPolicy\", \"DeletePublicAccessBlock\",\n                    \"PutBucketAcl\", \"DeleteAccountPublicAccessBlock\"]\n    }\n  }'\n\naws events put-targets --rule detect-public-access-change \\\n  --targets \"Id\"=\"1\",\"Arn\"=\"$TOPIC\"",
        },
      ],
      expect:
        "<p>Trigger it by re-running the exposure command from step 3 — you should get an email within a minute or two. Then undo it again.</p>",
      fixes: [
        {
          problem: "No email arrives",
          cause: "Almost always the unconfirmed SNS subscription.",
          fix: "Check with <code>aws sns list-subscriptions-by-topic --topic-arn $TOPIC</code> — a SubscriptionArn of <code>PendingConfirmation</code> means you have not clicked the link in the email.",
        },
      ],
    },
    {
      title: "Tear it all down",
      time: "10 min",
      warn: "Do not skip this. An empty S3 bucket costs almost nothing, but the habit of always cleaning up is what keeps a cloud lab from quietly becoming a bill.",
      body: "<p>Delete everything except the account-level public access block, which you should keep permanently.</p>",
      commands: [
        {
          lang: "bash",
          label: "Teardown",
          code: "aws s3 rm \"s3://$BUCKET\" --recursive\naws s3api delete-bucket --bucket \"$BUCKET\"\n\naws events remove-targets --rule detect-public-access-change --ids 1\naws events delete-rule --name detect-public-access-change\n\n# Keep the account-level block. Keep the SNS topic — later projects use it.\n\naws s3 ls          # confirm only expected buckets remain",
        },
      ],
      expect:
        "<p>Only your CloudTrail bucket remains. The account-level public access block stays on permanently — it is the one artefact of this project worth keeping forever.</p>",
    },
  ],
  after: [
    "<b>Keep the account-level block on.</b> Every real account should have it, and turning it off should require a documented exception.",
    "Search for &ldquo;S3 bucket breach&rdquo; and read two real incidents. Recognising your own two commands in a news story is a useful jolt.",
    "The same pattern applies far beyond storage: expose, verify from outside, detect, prevent, alert on the prevention being removed. Reuse it.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 03 — Least-privilege audit                                                  */
/* -------------------------------------------------------------------------- */

export const c03: ProjectGuide = {
  slug: "least-privilege-audit",
  projectId: 3,
  intro:
    "<p>Cloud IAM is where nearly every serious cloud incident either starts or escalates. The pattern is almost always the same: an identity has far more permission than it needs, an attacker gets hold of it, and the excess permission is what turns a small foothold into a full compromise.</p><p>You are going to find over-permissioned identities in your own account, work out what each one <b>actually</b> uses, and write a right-sized policy to replace the oversized one. Then you will verify the replacement without breaking anything.</p><p>&ldquo;What did it actually use?&rdquo; is the key question. Guessing at least privilege produces broken applications; measuring it produces policies people accept.</p>",
  glossary: [
    {
      term: "Principal",
      plain: "Anything that can act — a user, a role, a service account, an application.",
    },
    {
      term: "Policy",
      plain:
        "A document listing allowed or denied actions. Attached to a principal (identity-based) or a resource (resource-based).",
    },
    {
      term: "Wildcard",
      plain:
        "<code>*</code> means everything. <code>\"Action\": \"*\"</code> on <code>\"Resource\": \"*\"</code> is administrator — and is what an audit is looking for.",
    },
    {
      term: "Privilege escalation path",
      plain:
        "A chain where limited permissions can be used to obtain greater ones. <code>iam:PassRole</code> plus the ability to launch compute is the classic example.",
    },
    {
      term: "Least privilege",
      plain:
        "Exactly the permissions needed for the job, and nothing more. Measured, not guessed.",
    },
  ],
  before: [
    "<b>Project 01 finished.</b>",
    "A week or so of account activity helps — the access-analysis data in step 4 needs history to be meaningful.",
    "About 3–4 hours.",
  ],
  steps: [
    {
      title: "Inventory every identity",
      time: "25 min",
      why: "You cannot audit what you have not listed. Most people are surprised by what is in an account they thought they knew.",
      body: "<p>List every user, role, and access key, along with when each was last used.</p>",
      commands: [
        {
          lang: "bash",
          label: "AWS — the credential report is the fastest complete picture",
          code: "aws iam generate-credential-report >/dev/null\nsleep 5\naws iam get-credential-report --query Content --output text | base64 -d > cred-report.csv\n\ncolumn -s, -t cred-report.csv | cut -c1-160",
        },
        {
          lang: "bash",
          label: "Every role, and when it was last used",
          code: "for r in $(aws iam list-roles --query 'Roles[].RoleName' --output text); do\n  last=$(aws iam get-role --role-name \"$r\" \\\n         --query 'Role.RoleLastUsed.LastUsedDate' --output text)\n  printf '%-55s %s\\n' \"$r\" \"${last:-NEVER USED}\"\ndone",
        },
        {
          lang: "bash",
          label: "Azure / GCP",
          code: "# Azure\naz role assignment list --all \\\n  --query \"[].{principal:principalName, role:roleDefinitionName, scope:scope}\" -o table\n\n# GCP\ngcloud projects get-iam-policy $(gcloud config get-value project) \\\n  --flatten=\"bindings[].members\" \\\n  --format='table(bindings.role, bindings.members)'",
        },
      ],
      expect:
        "<p>A complete list. Flag anything unused for 90+ days — unused identities are pure risk with zero benefit, and deleting them is the easiest win in the whole audit.</p>",
      expectCode:
        "AWSServiceRoleForSupport                                NEVER USED\nlab-admin-role                                          2026-07-26T14:22:00+00:00\ncloudtrail-role                                         2026-07-19T08:11:00+00:00",
    },
    {
      title: "Find the wildcards",
      time: "30 min",
      why: "A wildcard on both action and resource is administrator access wearing a different name. Finding these is the highest-value part of the audit.",
      body: "<p>Walk every attached policy and flag the dangerous patterns.</p>",
      commands: [
        {
          lang: "bash",
          label: "Which identities have AdministratorAccess?",
          code: "aws iam list-entities-for-policy \\\n  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess \\\n  --query '{Users:PolicyUsers[].UserName, Roles:PolicyRoles[].RoleName, Groups:PolicyGroups[].GroupName}'",
        },
        {
          lang: "bash",
          label: "Find wildcards in every customer-managed policy",
          code: "for p in $(aws iam list-policies --scope Local \\\n           --query 'Policies[].Arn' --output text); do\n  ver=$(aws iam get-policy --policy-arn \"$p\" \\\n        --query 'Policy.DefaultVersionId' --output text)\n  doc=$(aws iam get-policy-version --policy-arn \"$p\" --version-id \"$ver\" \\\n        --query 'PolicyVersion.Document' --output json)\n\n  if echo \"$doc\" | jq -e '.Statement[]? | select(.Effect==\"Allow\") |\n       select((.Action == \"*\") or (.Action[]? == \"*\"))' >/dev/null 2>&1; then\n    echo \"WILDCARD ACTION: $p\"\n  fi\ndone",
        },
        {
          lang: "bash",
          label: "The privilege escalation check people forget",
          code: "# iam:PassRole + a compute service = escalate to any role\naws iam list-policies --scope Local --query 'Policies[].Arn' --output text |\n  tr '\\t' '\\n' | while read -r p; do\n    ver=$(aws iam get-policy --policy-arn \"$p\" --query 'Policy.DefaultVersionId' --output text)\n    if aws iam get-policy-version --policy-arn \"$p\" --version-id \"$ver\" \\\n         --query 'PolicyVersion.Document' --output json | grep -q 'iam:PassRole'; then\n      echo \"PassRole granted by: $p\"\n    fi\n  done",
        },
      ],
      expect:
        "<p>Your <code>lab-admin</code> user shows up with AdministratorAccess, which is expected — you created it that way in project 01. That is the identity you are going to right-size.</p>",
      expectCode:
        "{\n    \"Users\": [\"lab-admin\"],\n    \"Roles\": [],\n    \"Groups\": []\n}",
      fixes: [
        {
          problem: "The jq expression errors on some policies",
          cause:
            "<code>Action</code> is sometimes a string and sometimes an array — a classic IAM parsing trap.",
          fix: "The <code>?</code> operators above handle both. If it still fails, inspect the specific policy manually: <code>aws iam get-policy-version --policy-arn ARN --version-id v1</code>.",
        },
      ],
    },
    {
      title: "Measure what is actually used",
      time: "40 min",
      why: "This is what makes the difference. A policy written from guesswork breaks things and gets reverted; a policy written from measured usage gets accepted.",
      body: "<p>AWS records which services each identity has actually called, and when. Use that rather than your intuition.</p>",
      commands: [
        {
          lang: "bash",
          label: "Which services has this identity ever touched?",
          code: "ARN=$(aws iam get-user --user-name lab-admin --query 'User.Arn' --output text)\n\nJOB=$(aws iam generate-service-last-accessed-details --arn \"$ARN\" \\\n      --query JobId --output text)\nsleep 10\n\naws iam get-service-last-accessed-details --job-id \"$JOB\" \\\n  --query 'ServicesLastAccessed[?TotalAuthenticatedEntities>`0`].[ServiceName,LastAuthenticated]' \\\n  --output table",
        },
        {
          lang: "bash",
          label: "The precise version — every distinct API call, from CloudTrail",
          code: "aws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=Username,AttributeValue=lab-admin \\\n  --max-results 200 --output json |\n  jq -r '.Events[] | \"\\(.EventSource | split(\".\")[0]):\\(.EventName)\"' |\n  sort -u",
        },
      ],
      expect:
        "<p>A short list — probably S3, CloudTrail, IAM, Budgets, and STS. Compare that against AdministratorAccess, which grants access to <b>every</b> AWS service. The gap between those two is your finding, and it is usually enormous.</p>",
      expectCode:
        "budgets:CreateBudget\ncloudtrail:CreateTrail\ncloudtrail:GetTrailStatus\niam:CreateAccessKey\ns3:CreateBucket\ns3:PutBucketPolicy\nsts:GetCallerIdentity\n\n→ 7 distinct actions vs AdministratorAccess granting ~13,000",
      fixes: [
        {
          problem: "Service-last-accessed returns almost nothing",
          cause: "The account is new; this data needs history to be useful.",
          fix: "Use the CloudTrail method instead — it works from the first day. Note the limitation in your write-up.",
        },
      ],
    },
    {
      title: "Write the right-sized policy",
      time: "40 min",
      why: "Now you are writing from evidence rather than opinion, which is what makes the policy defensible.",
      body: "<p>Build the replacement from the measured list, and scope resources rather than using <code>*</code> wherever you can.</p>",
      commands: [
        {
          lang: "json",
          label: "least-privilege-policy.json",
          code: "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"ReadOwnIdentity\",\n      \"Effect\": \"Allow\",\n      \"Action\": [\"sts:GetCallerIdentity\"],\n      \"Resource\": \"*\"\n    },\n    {\n      \"Sid\": \"ManageLabBucketsOnly\",\n      \"Effect\": \"Allow\",\n      \"Action\": [\n        \"s3:CreateBucket\",\n        \"s3:ListBucket\",\n        \"s3:GetObject\",\n        \"s3:PutObject\",\n        \"s3:DeleteObject\",\n        \"s3:GetBucketPolicyStatus\",\n        \"s3:GetBucketPublicAccessBlock\"\n      ],\n      \"Resource\": [\n        \"arn:aws:s3:::*-lab-*\",\n        \"arn:aws:s3:::*-lab-*/*\"\n      ]\n    },\n    {\n      \"Sid\": \"ReadAuditTrail\",\n      \"Effect\": \"Allow\",\n      \"Action\": [\n        \"cloudtrail:LookupEvents\",\n        \"cloudtrail:GetTrailStatus\",\n        \"cloudtrail:DescribeTrails\"\n      ],\n      \"Resource\": \"*\"\n    },\n    {\n      \"Sid\": \"ReadBudgets\",\n      \"Effect\": \"Allow\",\n      \"Action\": [\"budgets:ViewBudget\", \"budgets:DescribeBudgets\"],\n      \"Resource\": \"*\"\n    },\n    {\n      \"Sid\": \"DenyPublicAccessBlockChanges\",\n      \"Effect\": \"Deny\",\n      \"Action\": [\n        \"s3:PutAccountPublicAccessBlock\",\n        \"s3:DeleteAccountPublicAccessBlock\"\n      ],\n      \"Resource\": \"*\"\n    }\n  ]\n}",
        },
        {
          lang: "bash",
          label: "Create it (do not attach yet)",
          code: "aws iam create-policy --policy-name lab-least-privilege \\\n  --policy-document file://least-privilege-policy.json",
        },
      ],
      expect:
        "<p>Note two design choices worth being able to explain. The S3 resources are scoped by name pattern rather than <code>*</code>. And there is an explicit <code>Deny</code> on removing the account-level public access block — in IAM an explicit Deny always wins, so this cannot be overridden by any Allow.</p>",
    },
    {
      title: "Test before you cut over",
      time: "30 min",
      why: "Applying a least-privilege policy without testing it is how you take an application down at 4pm on a Friday. The policy simulator lets you check first.",
      body: "<p>Simulate each action against the new policy and confirm the answers are what you intend — both the allows and the denies.</p>",
      commands: [
        {
          lang: "bash",
          label: "Simulate — these should be ALLOWED",
          code: "POL=$(aws iam list-policies --scope Local \\\n      --query \"Policies[?PolicyName=='lab-least-privilege'].Arn\" --output text)\n\naws iam simulate-custom-policy \\\n  --policy-input-list \"$(cat least-privilege-policy.json)\" \\\n  --action-names s3:GetObject cloudtrail:LookupEvents sts:GetCallerIdentity \\\n  --resource-arns \"arn:aws:s3:::exposure-lab-123456789012/test.txt\" \\\n  --query 'EvaluationResults[].[EvalActionName,EvalDecision]' --output table",
        },
        {
          lang: "bash",
          label: "And these should be DENIED",
          code: "aws iam simulate-custom-policy \\\n  --policy-input-list \"$(cat least-privilege-policy.json)\" \\\n  --action-names ec2:RunInstances iam:CreateUser s3:PutAccountPublicAccessBlock \\\n  --query 'EvaluationResults[].[EvalActionName,EvalDecision]' --output table",
        },
      ],
      expect:
        "<p>The first set allowed, the second set denied. Testing the denies matters as much as the allows — a policy that fails open is worse than no policy, because it creates false confidence.</p>",
      expectCode:
        "|  s3:GetObject                     |  allowed      |\n|  cloudtrail:LookupEvents          |  allowed      |\n\n|  ec2:RunInstances                 |  implicitDeny |\n|  iam:CreateUser                   |  implicitDeny |\n|  s3:PutAccountPublicAccessBlock   |  explicitDeny |",
    },
    {
      title: "Cut over safely",
      time: "25 min",
      warn: "Keep a way back in. Removing your own administrator access without a fallback can lock you out of your own account.",
      why: "The safe cutover pattern — add the new, verify, then remove the old — is the same in every environment and worth doing properly once.",
      body: "<p>Attach the new policy alongside the old one, verify real operations still work, then detach the old one. If anything breaks, re-attach and investigate.</p>",
      commands: [
        {
          lang: "bash",
          label: "Add new, keep old",
          code: "aws iam attach-user-policy --user-name lab-admin --policy-arn \"$POL\"\n\n# Confirm both are attached\naws iam list-attached-user-policies --user-name lab-admin --output table",
        },
        {
          lang: "bash",
          label: "Remove the old one, then immediately verify",
          code: "aws iam detach-user-policy --user-name lab-admin \\\n  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess\n\n# These must still work\naws sts get-caller-identity\naws s3 ls\naws cloudtrail get-trail-status --name lab-trail --query IsLogging\n\n# This must now FAIL — that is the proof it worked\naws ec2 describe-instances 2>&1 | head -2",
        },
        {
          lang: "bash",
          label: "The way back in, if you need it",
          code: "# Sign in as root in the console and re-attach:\n# IAM → Users → lab-admin → Add permissions → AdministratorAccess\n#\n# This is why you kept root MFA working in project 01.",
        },
      ],
      expect:
        "<p>Everyday operations still work; EC2 is denied. You have reduced roughly 13,000 permitted actions to about 15, using measured evidence — and that sentence, with the numbers, is a very good interview answer.</p>",
      expectCode:
        "An error occurred (UnauthorizedOperation) when calling the DescribeInstances\noperation: You are not authorized to perform this operation.",
      fixes: [
        {
          problem: "Something you need is now denied",
          cause: "The action was not in your measured window — usage data only covers what you actually did.",
          fix: "Add the specific action to the policy and create a new version. This iteration is normal and expected; that is why you test in a lab first.",
        },
        {
          problem: "You locked yourself out entirely",
          cause: "The new policy did not include the IAM actions needed to fix itself.",
          fix: "Sign in as root and re-attach AdministratorAccess. Then add <code>iam:GetPolicy</code>, <code>iam:CreatePolicyVersion</code>, and <code>iam:AttachUserPolicy</code> to the least-privilege policy scoped to that policy's own ARN.",
        },
      ],
    },
    {
      title: "Write the audit report",
      time: "30 min",
      why: "The report is what makes this a portfolio piece rather than an afternoon of CLI commands.",
      body: "<p>Cover: how many identities you inventoried, how many had wildcards, how many were unused, the measured-versus-granted comparison for the one you fixed, the before/after permission count, and the residual risk you did not address.</p><p>Lead with numbers. &ldquo;Reduced one identity from ~13,000 permitted actions to 15, based on 30 days of measured usage&rdquo; is concrete; &ldquo;improved IAM hygiene&rdquo; is not.</p>",
      expect:
        "<p>A one-page report with a before/after table. Note explicitly what you did <i>not</i> do — that is what shows you understand scope.</p>",
    },
  ],
  after: [
    "Run the inventory monthly. Permissions accumulate; nobody ever removes them voluntarily.",
    "Read about IAM Access Analyzer's policy generation — it automates step 3 from CloudTrail data and is worth knowing exists.",
    "Learn the common privilege escalation paths (Rhino Security Labs published the definitive list for AWS). Knowing them changes how you read a policy.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 04 — Cloud logging pipeline and first detections                            */
/* -------------------------------------------------------------------------- */

export const c04: ProjectGuide = {
  slug: "cloud-logging-pipeline",
  projectId: 4,
  intro:
    "<p>In project 01 you turned audit logging on. Logs sitting in a storage bucket are not detection, though — they are just a bill you pay in case you ever need them.</p><p>This project turns that raw audit trail into working detections: three alerts that fire on genuinely suspicious cloud activity, delivered to your inbox, with the false positives already thought through.</p><p>You will use the provider's own tooling rather than shipping everything to an external SIEM. That is both cheaper and closer to how most small teams actually operate — and understanding the native path makes you better at the SIEM path later.</p>",
  glossary: [
    {
      term: "Management vs data events",
      plain:
        "Management events are changes to the account (create a user, change a policy). Data events are access to the contents (read an object). Management events are cheap and always on; data events are voluminous and cost money.",
    },
    {
      term: "Log group / log stream",
      plain:
        "CloudWatch Logs organises records into groups (a log source) containing streams (one writer). Detections run against a group.",
    },
    {
      term: "Metric filter",
      plain:
        "A pattern that turns matching log lines into a number you can alarm on. This is how you build a detection without any external tooling.",
    },
    {
      term: "Alarm",
      plain: "Fires when a metric crosses a threshold for a set period, and notifies you.",
    },
    {
      term: "Detection as data",
      plain:
        "The idea that a detection is just: a filter, a threshold, and an action. Every platform expresses those three things differently, but it is always those three.",
    },
  ],
  before: [
    "<b>Projects 01 and 02 finished.</b> You need the trail, and the SNS topic from project 02 step 8.",
    "About 4 hours.",
  ],
  steps: [
    {
      title: "Send the audit trail somewhere searchable",
      time: "30 min",
      warn: "CloudWatch Logs charges for ingestion (~$0.50/GB) and storage. A quiet lab account produces a tiny amount, but set the retention in step 2 so it cannot accumulate.",
      why: "Logs in a bucket are archival. Logs in a log group are queryable in near real time, which is what a detection needs.",
      body: "<p>Point CloudTrail at CloudWatch Logs, which needs a role granting it permission to write.</p>",
      commands: [
        {
          lang: "bash",
          label: "Create the log group and the role",
          code: "ACCT=$(aws sts get-caller-identity --query Account --output text)\n\naws logs create-log-group --log-group-name /aws/cloudtrail/lab\n\ncat > trust.json <<'EOF'\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Principal\": {\"Service\": \"cloudtrail.amazonaws.com\"},\n    \"Action\": \"sts:AssumeRole\"\n  }]\n}\nEOF\n\naws iam create-role --role-name CloudTrailToCloudWatch \\\n  --assume-role-policy-document file://trust.json",
        },
        {
          lang: "bash",
          label: "Grant it write access, then connect the trail",
          code: "cat > write.json <<EOF\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Action\": [\"logs:CreateLogStream\", \"logs:PutLogEvents\"],\n    \"Resource\": \"arn:aws:logs:us-east-1:$ACCT:log-group:/aws/cloudtrail/lab:*\"\n  }]\n}\nEOF\n\naws iam put-role-policy --role-name CloudTrailToCloudWatch \\\n  --policy-name WriteLogs --policy-document file://write.json\n\nsleep 10   # IAM is eventually consistent; this avoids a spurious failure\n\naws cloudtrail update-trail --name lab-trail \\\n  --cloud-watch-logs-log-group-arn \"arn:aws:logs:us-east-1:$ACCT:log-group:/aws/cloudtrail/lab:*\" \\\n  --cloud-watch-logs-role-arn \"arn:aws:iam::$ACCT:role/CloudTrailToCloudWatch\"",
        },
      ],
      expect:
        "<p>Within about 10 minutes, log streams appear in the group. Generate some activity (run a few CLI commands) and confirm.</p>",
      expectCode:
        "$ aws logs describe-log-streams --log-group-name /aws/cloudtrail/lab \\\n    --query 'logStreams[].logStreamName'\n[\n    \"123456789012_CloudTrail_us-east-1\"\n]",
      fixes: [
        {
          problem: "InvalidCloudWatchLogsRoleArnException",
          cause: "IAM role propagation — the role exists but CloudTrail cannot see it yet.",
          fix: "Wait 30 seconds and retry the <code>update-trail</code>. This is normal IAM eventual consistency, not a mistake on your part.",
        },
        {
          problem: "No log streams after 15 minutes",
          cause: "Nothing has happened in the account to log.",
          fix: "Generate activity: <code>aws s3 ls; aws iam list-users; aws sts get-caller-identity</code>, then wait five minutes.",
        },
      ],
    },
    {
      title: "Cap the retention immediately",
      time: "5 min",
      warn: "The default retention is <b>never expire</b>. In a lab that is a slow, permanent cost leak.",
      body: "<p>Thirty days is plenty for a lab, and the S3 copy from project 01 remains as the long-term archive.</p>",
      commands: [
        {
          lang: "bash",
          code: "aws logs put-retention-policy \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --retention-in-days 30\n\naws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail \\\n  --query 'logGroups[].[logGroupName,retentionInDays,storedBytes]' --output table",
        },
      ],
      expect: "<p>Retention shows 30 days.</p>",
      expectCode:
        "|  /aws/cloudtrail/lab  |  30  |  184320  |",
    },
    {
      title: "Learn to query before you alert",
      time: "40 min",
      why: "You cannot write a good detection for data you have not explored. Fifteen minutes of querying prevents an hour of debugging a rule that was never going to match.",
      body: "<p>CloudWatch Logs Insights is the query language. Learn it on questions you already know the answer to.</p>",
      commands: [
        {
          lang: "bash",
          label: "What API calls are happening at all?",
          code: "aws logs start-query \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --start-time $(($(date +%s) - 86400)) \\\n  --end-time $(date +%s) \\\n  --query-string 'fields eventName, userIdentity.userName\n    | stats count() as calls by eventName\n    | sort calls desc\n    | limit 20'",
        },
        {
          lang: "bash",
          label: "Fetch the results (use the queryId from above)",
          code: "aws logs get-query-results --query-id THE_QUERY_ID",
        },
        {
          lang: "bash",
          label: "Failed calls — the most useful single query in cloud security",
          code: "QID=$(aws logs start-query \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --start-time $(($(date +%s) - 86400)) --end-time $(date +%s) \\\n  --query-string 'fields @timestamp, userIdentity.userName, eventName, errorCode\n    | filter ispresent(errorCode)\n    | sort @timestamp desc\n    | limit 50' \\\n  --query queryId --output text)\n\nsleep 6\naws logs get-query-results --query-id \"$QID\" --output json | jq -r '.results[][] | select(.field==\"@message\")' 2>/dev/null | head",
        },
      ],
      expect:
        "<p>The failed-calls query should surface the <code>UnauthorizedOperation</code> from your project 03 cutover test. Recognising your own past actions in the audit trail is a good way to build confidence that the pipeline works.</p>",
      fixes: [
        {
          problem: "get-query-results returns status Running",
          cause: "The query has not finished.",
          fix: "Wait a few seconds and call it again. Queries over larger windows take longer.",
        },
      ],
    },
    {
      title: "Detection 1 — root account used",
      time: "30 min",
      why: "Root should be used essentially never after initial setup. That makes it the highest-signal, lowest-noise detection available in a cloud account — the ideal first rule.",
      body: "<p>A metric filter converts matching log lines into a number; an alarm watches that number.</p>",
      commands: [
        {
          lang: "bash",
          label: "The filter",
          code: "aws logs put-metric-filter \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --filter-name RootAccountUsage \\\n  --filter-pattern '{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }' \\\n  --metric-transformations \\\n      metricName=RootAccountUsageCount,metricNamespace=SecurityDetections,metricValue=1",
        },
        {
          lang: "bash",
          label: "The alarm",
          code: "TOPIC=$(aws sns list-topics \\\n  --query \"Topics[?contains(TopicArn,'security-alerts')].TopicArn\" --output text)\n\naws cloudwatch put-metric-alarm \\\n  --alarm-name detect-root-account-usage \\\n  --alarm-description 'Root account was used to make an API call' \\\n  --metric-name RootAccountUsageCount \\\n  --namespace SecurityDetections \\\n  --statistic Sum --period 300 --threshold 1 \\\n  --comparison-operator GreaterThanOrEqualToThreshold \\\n  --evaluation-periods 1 \\\n  --treat-missing-data notBreaching \\\n  --alarm-actions \"$TOPIC\"",
        },
        {
          lang: "bash",
          label: "Test it — sign in as root and run one read-only command",
          code: "# In the console, sign in as root and visit any page, or run:\n#   aws sts get-caller-identity   (with root credentials)\n#\n# Then watch the alarm state:\naws cloudwatch describe-alarms --alarm-names detect-root-account-usage \\\n  --query 'MetricAlarms[].[StateValue,StateReason]' --output table",
        },
      ],
      expect:
        "<p>Within about 5–10 minutes the alarm moves to <code>ALARM</code> and you get an email. Note <code>--treat-missing-data notBreaching</code>: without it the alarm sits in INSUFFICIENT_DATA forever in a quiet account, which is the most common reason a first alarm appears not to work.</p>",
      expectCode:
        "|  ALARM  |  Threshold Crossed: 1 datapoint [1.0] was greater than or equal to the threshold (1.0).  |",
      fixes: [
        {
          problem: "The alarm never leaves INSUFFICIENT_DATA",
          cause: "Metric filters only emit a datapoint when they match — silence produces no data at all.",
          fix: "That is exactly what <code>--treat-missing-data notBreaching</code> handles. Confirm it is set with <code>aws cloudwatch describe-alarms --alarm-names detect-root-account-usage</code>.",
        },
        {
          problem: "The filter pattern is rejected",
          cause: "JSON filter patterns are whitespace- and quote-sensitive.",
          fix: "Keep the single quotes around the whole pattern exactly as written. Test with <code>aws logs test-metric-filter --filter-pattern '...' --log-event-messages '{\"userIdentity\":{\"type\":\"Root\"}}'</code>.",
        },
      ],
    },
    {
      title: "Detection 2 — IAM changes",
      time: "30 min",
      why: "Attackers who gain access almost always create a persistence identity. IAM changes are infrequent in a stable account, which makes them a good detection with manageable noise.",
      body: "<p>Watch for identity creation and permission changes.</p>",
      commands: [
        {
          lang: "bash",
          label: "Filter and alarm",
          code: "aws logs put-metric-filter \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --filter-name IAMChanges \\\n  --filter-pattern '{ ($.eventName = CreateUser) || ($.eventName = CreateAccessKey) || ($.eventName = AttachUserPolicy) || ($.eventName = AttachRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreateRole) || ($.eventName = UpdateAssumeRolePolicy) }' \\\n  --metric-transformations \\\n      metricName=IAMChangeCount,metricNamespace=SecurityDetections,metricValue=1\n\naws cloudwatch put-metric-alarm \\\n  --alarm-name detect-iam-changes \\\n  --alarm-description 'An IAM identity or permission was created or modified' \\\n  --metric-name IAMChangeCount --namespace SecurityDetections \\\n  --statistic Sum --period 300 --threshold 1 \\\n  --comparison-operator GreaterThanOrEqualToThreshold \\\n  --evaluation-periods 1 --treat-missing-data notBreaching \\\n  --alarm-actions \"$TOPIC\"",
        },
        {
          lang: "bash",
          label: "Test it",
          code: "aws iam create-user --user-name detection-test-user\n\n# ...wait for the email, then clean up\naws iam delete-user --user-name detection-test-user",
        },
      ],
      expect:
        "<p>An email naming the change. This rule is noisier than the root one — in an environment using infrastructure-as-code it fires on every deployment. Note that trade-off in your write-up; the fix is to exclude the automation role, not to delete the rule.</p>",
    },
    {
      title: "Detection 3 — audit logging disabled",
      time: "25 min",
      why: "Turning off logging is what an attacker does before doing something worse. It is also almost never legitimate, which makes it a critical-severity, near-zero-noise detection.",
      body: "<p>This one deserves the highest severity you have.</p>",
      commands: [
        {
          lang: "bash",
          label: "Filter and alarm",
          code: "aws logs put-metric-filter \\\n  --log-group-name /aws/cloudtrail/lab \\\n  --filter-name CloudTrailTampering \\\n  --filter-pattern '{ ($.eventName = StopLogging) || ($.eventName = DeleteTrail) || ($.eventName = UpdateTrail) || ($.eventName = PutEventSelectors) }' \\\n  --metric-transformations \\\n      metricName=TrailTamperCount,metricNamespace=SecurityDetections,metricValue=1\n\naws cloudwatch put-metric-alarm \\\n  --alarm-name detect-cloudtrail-tampering \\\n  --alarm-description 'CRITICAL: audit logging was stopped, deleted or modified' \\\n  --metric-name TrailTamperCount --namespace SecurityDetections \\\n  --statistic Sum --period 60 --threshold 1 \\\n  --comparison-operator GreaterThanOrEqualToThreshold \\\n  --evaluation-periods 1 --treat-missing-data notBreaching \\\n  --alarm-actions \"$TOPIC\"",
        },
        {
          lang: "bash",
          label: "Test — stop and immediately restart logging",
          code: "aws cloudtrail stop-logging --name lab-trail\nsleep 5\naws cloudtrail start-logging --name lab-trail\n\naws cloudtrail get-trail-status --name lab-trail --query IsLogging",
        },
      ],
      expect:
        "<p>An alert within a minute or two, and <code>IsLogging</code> back to <code>true</code>. There is a genuine subtlety worth understanding here: stopping the trail is itself recorded <i>before</i> logging stops, which is why this detection works at all.</p>",
      expectCode: "true",
    },
    {
      title: "Document the detections properly",
      time: "35 min",
      why: "An alert with no runbook is an alert that gets ignored. Writing the response alongside the rule is what makes it operational.",
      body: "<p>For each of the three, record: what it detects, why it matters, expected false positives, severity, and — most importantly — the first three things an analyst should do when it fires.</p>",
      commands: [
        {
          lang: "yaml",
          label: "detections.yml",
          code: "- name: detect-root-account-usage\n  severity: HIGH\n  attack_mapping: [T1078.004]   # Valid Accounts: Cloud Accounts\n  detects: >\n    Any API call made by the account root user. Root should be used only\n    for the handful of tasks that require it (closing the account,\n    changing support plan) and never for day-to-day work.\n  false_positives:\n    - Genuine root-only administrative tasks, which should be pre-announced\n  response:\n    - Confirm with the account owner whether the use was intentional\n    - If not: rotate the root password, re-issue MFA, review CloudTrail\n      for everything root did in the surrounding hour\n    - Check whether any root access key exists (there should be none)\n\n- name: detect-iam-changes\n  severity: MEDIUM\n  attack_mapping: [T1136.003, T1098.001]\n  detects: Creation or modification of identities and permissions.\n  false_positives:\n    - Infrastructure-as-code deployments — exclude the automation role\n    - Legitimate onboarding\n  response:\n    - Identify the actor from the CloudTrail event\n    - Check whether a change ticket exists\n    - If unexplained, disable the created identity and investigate the actor\n\n- name: detect-cloudtrail-tampering\n  severity: CRITICAL\n  attack_mapping: [T1562.008]   # Impair Defenses: Disable Cloud Logs\n  detects: Audit logging stopped, deleted, or reconfigured.\n  false_positives:\n    - Planned trail reconfiguration during a change window\n  response:\n    - Re-enable logging immediately\n    - Treat the acting identity as compromised until proven otherwise\n    - Review everything that identity did in the blind window\n    - Escalate — this is almost never benign",
        },
      ],
      expect:
        "<p>Three documented detections. The <code>response</code> sections are what an interviewer will actually ask about, because they show you have thought past the alert.</p>",
    },
    {
      title: "Tear down what costs money",
      time: "10 min",
      warn: "Keep the detections — they cost pennies and they protect the account you are still using. Only remove the test artefacts.",
      body: "<p>Check what is actually accruing, and clean up the tests.</p>",
      commands: [
        {
          lang: "bash",
          label: "What is this costing?",
          code: "aws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail \\\n  --query 'logGroups[].[logGroupName,storedBytes]' --output table\n\naws cloudwatch describe-alarms \\\n  --query 'MetricAlarms[].[AlarmName,StateValue]' --output table",
        },
        {
          lang: "bash",
          label: "Remove test leftovers only",
          code: "aws iam delete-user --user-name detection-test-user 2>/dev/null || true\n\n# If you want to remove the pipeline entirely:\n# aws logs delete-log-group --log-group-name /aws/cloudtrail/lab\n# aws cloudwatch delete-alarms --alarm-names detect-root-account-usage \\\n#     detect-iam-changes detect-cloudtrail-tampering",
        },
      ],
      expect:
        "<p>A few hundred kilobytes stored and three alarms in OK state. At this volume the whole pipeline costs well under a dollar a month, which is why keeping it is the right call.</p>",
    },
  ],
  after: [
    "Add detections as you learn what matters: security group opened to 0.0.0.0/0, console login without MFA, access key created for a service account.",
    "Look at the CIS AWS Foundations Benchmark — sections 3 and 4 are essentially a list of the detections every account should have, and you have just built three of them.",
    "When you outgrow metric filters, the path is EventBridge → Lambda → your SIEM. The three components of a detection stay the same; only the plumbing changes.",
  ],
};
