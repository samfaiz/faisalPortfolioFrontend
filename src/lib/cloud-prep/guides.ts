/**
 * Long-form, follow-along guides for the Cloud Security prep projects.
 *
 * Same rules as the SOC guides (see src/lib/guides/types.ts), plus one that
 * only applies here: **cloud costs real money**. Every guide that can incur
 * charges says so before the first command, puts the spend guardrail in step
 * one, and ends with teardown. A home SOC lab that you forget about wastes
 * disk. A cloud lab that you forget about bills you every hour until you
 * notice.
 *
 * Slugs are permanent: they are the public URL
 * (/cloud-security-prep/projects/<slug>).
 */
import type { ProjectGuide } from "@/lib/guides/types";
import { c02, c03, c04 } from "./guides-associate";
import { c05, c06, c07, c08 } from "./guides-engineer";
import { c09, c10, c11, c12 } from "./guides-architect";

/* -------------------------------------------------------------------------- */
/* 01 — Build a safe multi-cloud lab (with a spend guardrail first)            */
/* -------------------------------------------------------------------------- */

const g01: ProjectGuide = {
  slug: "safe-cloud-lab",
  projectId: 1,
  intro:
    "<p>Every other cloud project on this page runs inside the account you are about to create. So this guide does two jobs: it gets you a working cloud account with the security basics switched on, and it puts a hard spend guardrail around it <b>before</b> you can build anything expensive.</p><p>That ordering is deliberate. The most common beginner cloud story is not a breach — it is a $400 bill from a machine somebody left running. You are going to make that impossible on day one.</p><p>The guide covers AWS as the main path, with the equivalent Azure and GCP steps alongside. <b>Pick one cloud and finish it.</b> One cloud understood properly is worth far more in an interview than three set up halfway.</p>",
  glossary: [
    {
      term: "Cloud provider",
      plain:
        "A company that rents you computers, storage, and networking over the internet, billed by the hour or by usage. AWS, Microsoft Azure, and Google Cloud (GCP) are the three big ones.",
    },
    {
      term: "Region",
      plain:
        "A physical location where a provider has data centres — <code>us-east-1</code> is Northern Virginia, <code>eu-west-1</code> is Ireland. Pick one close to you and stay in it; resources in a forgotten region are the classic way to leave something running.",
    },
    {
      term: "Root account",
      plain:
        "The email address you signed up with. It can do absolutely anything, including closing the account and changing billing. You use it once to set things up and then essentially never again.",
    },
    {
      term: "IAM",
      plain:
        "Identity and Access Management — the system that decides who can do what. Nearly every cloud breach traces back to an IAM mistake, which is why it is the first thing you secure.",
    },
    {
      term: "MFA",
      plain:
        "Multi-Factor Authentication. A second proof of identity beyond the password, usually a 6-digit code from a phone app. On a cloud root account it is not optional.",
    },
    {
      term: "CLI",
      plain:
        "Command Line Interface — a program you type commands into instead of clicking. Cloud work is far faster and far more repeatable from the CLI, and every guide here uses it.",
    },
    {
      term: "Free tier",
      plain:
        "A monthly allowance of resources that costs nothing. Generous, but easy to exceed accidentally — which is exactly what the budget alert in step 2 is for.",
    },
  ],
  before: [
    "<b>A payment card.</b> All three providers require one even for the free tier. You will not be charged if you stay inside the limits, and step 2 makes sure you find out immediately if you drift outside them.",
    "A phone that can run an authenticator app (Google Authenticator, Microsoft Authenticator, Authy — any of them).",
    "An email address you control and check.",
    "About 3–4 hours, most of it waiting for account verification.",
  ],
  steps: [
    {
      title: "Create the account",
      time: "30 min (plus verification wait)",
      warn: "Use a real payment card. Virtual or prepaid cards are frequently rejected and will stall you here.",
      body: "<p><b>AWS:</b> go to <a href=\"https://aws.amazon.com/free\" target=\"_blank\" rel=\"noopener noreferrer\">aws.amazon.com/free</a> and click <b>Create a Free Account</b>. You will enter an email, a card, and a phone number for a verification call or SMS. Choose the <b>Basic support — Free</b> plan at the end.</p><p><b>Azure:</b> <a href=\"https://azure.microsoft.com/free\" target=\"_blank\" rel=\"noopener noreferrer\">azure.microsoft.com/free</a> — includes $200 of credit for 30 days.</p><p><b>GCP:</b> <a href=\"https://cloud.google.com/free\" target=\"_blank\" rel=\"noopener noreferrer\">cloud.google.com/free</a> — includes $300 of credit for 90 days.</p><p>Account approval is usually instant but can take a few hours. Do not create a second account if it is slow; you will end up with two to manage.</p>",
      expect:
        "<p>You can sign in and reach the console home page. For AWS that is a page listing recently visited services, with your account number in the top-right menu.</p>",
      fixes: [
        {
          problem: "\"We were unable to validate your payment method\"",
          cause:
            "Prepaid, virtual, and some debit cards are rejected. Providers place a small temporary authorisation (~$1) that these cards refuse.",
          fix: "Use a standard credit or debit card from a bank. The charge is reversed within a few days.",
        },
        {
          problem: "Verification SMS never arrives",
          cause: "Some carriers block the shortcode.",
          fix: "Choose the <b>voice call</b> option instead — it reads the code aloud and works when SMS does not.",
        },
      ],
    },
    {
      title: "Set a budget alert before you build anything",
      time: "15 min",
      why: "This is the single most important step in the guide. Do it now, while the account is empty, because after this you will be creating things that cost money and you want the alarm wired up first.",
      warn: "Do not continue past this step until the budget exists. This is the guardrail that turns a possible $400 surprise into a $5 email.",
      body: "<p><b>AWS:</b> open <b>Billing and Cost Management → Budgets → Create budget</b>. Choose <b>Customize (advanced)</b> → <b>Cost budget</b>. Set the period to Monthly, the amount to <b>$5</b>, and add alert thresholds at 50%, 80%, and 100% of budgeted amount, each emailing you.</p><p>Why $5 and not $0: a few cents of unavoidable charges would make a $0 budget alert constantly, and you would learn to ignore it. $5 stays quiet until something is genuinely wrong.</p><p>Also turn on the free <b>Zero-Spend Budget</b> template if offered — it emails you the moment anything at all is charged.</p>",
      commands: [
        {
          lang: "bash",
          label: "AWS — the same thing from the CLI, once step 4 is done",
          code: "cat > budget.json <<'EOF'\n{\n  \"BudgetName\": \"lab-guardrail\",\n  \"BudgetLimit\": { \"Amount\": \"5\", \"Unit\": \"USD\" },\n  \"TimeUnit\": \"MONTHLY\",\n  \"BudgetType\": \"COST\"\n}\nEOF\n\naws budgets create-budget \\\n  --account-id $(aws sts get-caller-identity --query Account --output text) \\\n  --budget file://budget.json",
        },
        {
          lang: "bash",
          label: "Azure",
          code: "az consumption budget create \\\n  --budget-name lab-guardrail \\\n  --amount 5 \\\n  --time-grain Monthly \\\n  --category Cost",
        },
        {
          lang: "bash",
          label: "GCP",
          code: "# GCP budgets are set per billing account in the console:\n# Billing → Budgets & alerts → Create budget → $5 monthly,\n# alert at 50 / 90 / 100 percent.\ngcloud billing budgets list --billing-account=YOUR_BILLING_ACCOUNT_ID",
        },
      ],
      expect:
        "<p>The budget appears in the list showing <b>$0.00 of $5.00</b>. Within a day or so you will also get a confirmation email that alerting is active.</p>",
      fixes: [
        {
          problem: "AWS: \"You are not authorized to perform this operation\"",
          cause:
            "Billing data is restricted to the root user until you explicitly allow IAM access to it.",
          fix: "Sign in as root, go to <b>Account settings → IAM user and role access to Billing Information</b>, and tick <b>Activate IAM Access</b>.",
        },
        {
          problem: "No budget option visible at all",
          cause: "The account is still being verified.",
          fix: "Wait for the activation email. Do not create resources in the meantime.",
        },
      ],
    },
    {
      title: "Lock down the root account",
      time: "15 min",
      why: "The root account can delete everything you build and run up unlimited charges. It is the highest-value credential you own, and stolen root credentials are how most small cloud accounts get taken over for crypto-mining.",
      body: "<p><b>AWS:</b> click your account name (top right) → <b>Security credentials</b>.</p><ol><li><b>Assign MFA.</b> Choose Authenticator app, scan the QR code with your phone app, enter two consecutive codes.</li><li><b>Delete any root access keys.</b> If the page lists any, delete them. Root should never have programmatic access keys — there is no legitimate use for them.</li><li>Confirm the contact email and phone are correct, because that is how you recover the account.</li></ol><p><b>Azure:</b> the equivalent is enabling MFA on your Global Administrator in <b>Entra ID → Security → Multifactor authentication</b>. <b>GCP:</b> enable 2-Step Verification on the Google account that owns the project.</p>",
      expect:
        "<p>The Security credentials page shows MFA as <b>Assigned</b> and lists <b>zero</b> access keys. Sign out and back in — you should now be prompted for a 6-digit code.</p>",
      fixes: [
        {
          problem: "\"The MFA code is invalid\" even though you typed it correctly",
          cause:
            "Your phone's clock has drifted. These codes are generated from the current time, so a few seconds of drift breaks them.",
          fix: "On the phone, enable automatic date/time. In Google Authenticator specifically: <b>Settings → Time correction for codes → Sync now</b>.",
        },
        {
          problem: "You lost the phone after enabling MFA",
          cause: "No backup factor was registered.",
          fix: "Use the account recovery flow with your registered email and phone — it takes a few days. Avoid this by registering a second MFA device now, while you can.",
        },
      ],
    },
    {
      title: "Create a daily-use admin user (and stop using root)",
      time: "20 min",
      why: "Working as root is like doing your daily browsing as the machine's administrator. You want an identity that is powerful enough to build things but can be revoked without losing the account.",
      body: "<p><b>AWS:</b> go to <b>IAM → Users → Create user</b>.</p><ol><li>Name: <code>lab-admin</code></li><li>Tick <b>Provide user access to the AWS Management Console</b> and set a password</li><li>Permissions: <b>Attach policies directly</b> → <code>AdministratorAccess</code></li><li>Create the user, then open it → <b>Security credentials</b> → assign MFA to this user too</li><li>On the same tab, <b>Create access key</b> → choose <b>Command Line Interface</b>. Copy both the Access key ID and the Secret access key now — the secret is shown exactly once.</li></ol>",
      warn: "An access key is a username and password in text form. Never paste one into a chat, a screenshot, a support ticket, or a git repository. Bots scan public GitHub for these within seconds of a commit.",
      expect:
        "<p>You have two new pieces of information saved somewhere safe (a password manager, not a text file on the desktop): an Access key ID beginning <code>AKIA</code>, and a much longer secret.</p>",
      expectCode: "Access key ID:      AKIAIOSFODNN7EXAMPLE\nSecret access key:  wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      fixes: [
        {
          problem: "You closed the page without copying the secret key",
          cause: "It genuinely cannot be retrieved afterwards — that is by design.",
          fix: "Delete that access key and create a new one. There is no recovery, and that is a feature, not a bug.",
        },
      ],
    },
    {
      title: "Install and connect the CLI",
      time: "20 min",
      why: "Everything from here runs from the command line. It is faster than clicking, it is repeatable, and it is what the job actually looks like.",
      body: "<p>Install the CLI for your provider, then authenticate it with the keys from the previous step.</p>",
      commands: [
        {
          lang: "bash",
          label: "Install — AWS",
          code: "# macOS\nbrew install awscli\n\n# Windows (PowerShell as Administrator)\nwinget install -e --id Amazon.AWSCLI\n\n# Linux\ncurl \"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip\" -o awscliv2.zip\nunzip awscliv2.zip && sudo ./aws/install",
        },
        {
          lang: "bash",
          label: "Connect — AWS",
          code: "aws configure\n\n# AWS Access Key ID     [None]: AKIA...       <- paste yours\n# AWS Secret Access Key [None]: wJal...       <- paste yours\n# Default region name   [None]: us-east-1     <- pick one and stick to it\n# Default output format [None]: json",
        },
        {
          lang: "bash",
          label: "Install and connect — Azure",
          code: "# macOS: brew install azure-cli\n# Windows: winget install -e --id Microsoft.AzureCLI\n# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash\n\naz login   # opens a browser to sign in",
        },
        {
          lang: "bash",
          label: "Install and connect — GCP",
          code: "# See https://cloud.google.com/sdk/docs/install for your platform\n\ngcloud init      # walks through login and project selection\ngcloud auth application-default login",
        },
      ],
      expect: "<p>The CLI can prove who you are:</p>",
      expectCode:
        "$ aws sts get-caller-identity\n{\n    \"UserId\": \"AIDAI23HXD2O5EXAMPLE\",\n    \"Account\": \"123456789012\",\n    \"Arn\": \"arn:aws:iam::123456789012:user/lab-admin\"\n}",
      fixes: [
        {
          problem: "\"Unable to locate credentials\"",
          cause: "<code>aws configure</code> did not complete, or it wrote to a different user's home directory.",
          fix: "Run <code>aws configure list</code> to see what it thinks it has, and check the file <code>~/.aws/credentials</code> exists (<code>%USERPROFILE%\\.aws\\credentials</code> on Windows).",
        },
        {
          problem: "\"InvalidClientTokenId: The security token included in the request is invalid\"",
          cause:
            "The access key was mistyped, or it was deleted, or you pasted the key ID into the secret field.",
          fix: "Re-run <code>aws configure</code> and paste both values carefully. Watch for a trailing space — copy-paste from the console often adds one.",
        },
        {
          problem: "Windows: 'aws' is not recognized",
          cause: "The installer updated PATH but your terminal was already open.",
          fix: "Close and reopen the terminal. PATH is read once at launch.",
        },
      ],
    },
    {
      title: "Turn on audit logging",
      time: "20 min",
      why: "An audit log records every action taken in the account — who did what, from where, and when. Without it you cannot investigate anything, and every project after this one depends on it. It is also nearly free.",
      body: "<p><b>AWS CloudTrail</b> is on by default for the last 90 days of management events, but it does not keep them. Create a trail that writes to storage so the history survives.</p>",
      commands: [
        {
          lang: "bash",
          label: "AWS — bucket, then trail",
          code: "# 1. A bucket to hold the logs. Bucket names are globally unique,\n#    so add your account number to avoid a clash.\nACCT=$(aws sts get-caller-identity --query Account --output text)\naws s3api create-bucket --bucket cloudtrail-lab-$ACCT --region us-east-1\n\n# 2. Block all public access on it — logs are the last thing you want exposed.\naws s3api put-public-access-block --bucket cloudtrail-lab-$ACCT \\\n  --public-access-block-configuration \\\n  \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
        },
        {
          lang: "bash",
          label: "AWS — create and start the trail",
          code: "aws cloudtrail create-trail \\\n  --name lab-trail \\\n  --s3-bucket-name cloudtrail-lab-$ACCT \\\n  --is-multi-region-trail\n\naws cloudtrail start-logging --name lab-trail",
        },
        {
          lang: "bash",
          label: "Azure / GCP equivalents",
          code: "# Azure — Activity Log is on by default; export it so it persists:\naz monitor diagnostic-settings subscription create \\\n  --name lab-activity --location eastus \\\n  --logs '[{\"category\":\"Administrative\",\"enabled\":true}]'\n\n# GCP — Cloud Audit Logs admin activity is always on and free.\n# Confirm you can read it:\ngcloud logging read 'logName:\"cloudaudit.googleapis.com\"' --limit 5",
        },
      ],
      expect:
        "<p>The trail reports as logging. Give it 10–15 minutes and the first log files appear in the bucket — CloudTrail batches writes, so an empty bucket immediately after creation is normal, not a failure.</p>",
      expectCode:
        "$ aws cloudtrail get-trail-status --name lab-trail\n{\n    \"IsLogging\": true,\n    \"LatestDeliveryTime\": \"2026-07-26T14:22:31+00:00\"\n}",
      fixes: [
        {
          problem: "\"InsufficientS3BucketPolicyException\"",
          cause:
            "CloudTrail needs explicit permission to write into the bucket, and creating the bucket by hand does not grant it.",
          fix: "Easiest path: delete the trail and recreate it from the console (<b>CloudTrail → Create trail</b>), which writes the bucket policy for you. Then continue from the CLI.",
        },
        {
          problem: "\"BucketAlreadyExists\"",
          cause: "S3 bucket names are globally unique across all AWS customers.",
          fix: "Add something distinctive: <code>cloudtrail-lab-$ACCT-$(date +%s)</code>.",
        },
      ],
    },
    {
      title: "Tag everything and set a teardown reminder",
      time: "10 min",
      why: "In two weeks you will not remember which of eleven resources belongs to which project. Tags are how you find and delete them, and forgetting to delete things is what generates bills.",
      body: "<p>Adopt one tag now and use it on everything you create: <code>Project=cloud-lab</code>.</p><p>Then set a calendar reminder — genuinely, right now — titled <b>&ldquo;Check cloud bill and delete unused lab resources&rdquo;</b>, repeating weekly. The budget alert catches disasters; the reminder catches the slow $3/month leaks that the budget never trips.</p>",
      commands: [
        {
          lang: "bash",
          label: "Find everything you have tagged (AWS)",
          code: "aws resourcegroupstaggingapi get-resources \\\n  --tag-filters Key=Project,Values=cloud-lab \\\n  --query 'ResourceTagMappingList[].ResourceARN' \\\n  --output table",
        },
        {
          lang: "bash",
          label: "Find things you might have forgotten",
          code: "# Running instances in your default region\naws ec2 describe-instances \\\n  --filters Name=instance-state-name,Values=running \\\n  --query 'Reservations[].Instances[].[InstanceId,InstanceType,LaunchTime]' \\\n  --output table\n\n# All buckets\naws s3 ls",
        },
      ],
      expect:
        "<p>The instance query returns an empty table — you have not created any yet — and <code>aws s3 ls</code> lists only your CloudTrail bucket. That is the baseline you compare against next week.</p>",
    },
    {
      title: "Verify the whole thing",
      time: "10 min",
      why: "Confirm each control actually works rather than assuming it does. A guardrail you never tested is a guardrail you are trusting on faith.",
      body: "<p>Walk the checklist. Every line should pass before you call this project done.</p>",
      commands: [
        {
          lang: "bash",
          label: "The full check",
          code: "# 1. Who am I? Should be lab-admin, NOT root.\naws sts get-caller-identity\n\n# 2. Is the budget in place?\naws budgets describe-budgets \\\n  --account-id $(aws sts get-caller-identity --query Account --output text) \\\n  --query 'Budgets[].[BudgetName,BudgetLimit.Amount]' --output table\n\n# 3. Is audit logging on?\naws cloudtrail get-trail-status --name lab-trail --query IsLogging\n\n# 4. Does the audit log actually contain my activity?\naws cloudtrail lookup-events --max-results 5 \\\n  --query 'Events[].[EventTime,Username,EventName]' --output table",
        },
      ],
      expect:
        "<p>Query 4 is the interesting one — you should see your own recent actions, including the CloudTrail and budget calls you just made. That is your first real piece of cloud detection work: proving the evidence trail exists and contains what you expect.</p>",
      expectCode:
        "|  2026-07-26T14:22:31+00:00 |  lab-admin |  CreateTrail        |\n|  2026-07-26T14:19:02+00:00 |  lab-admin |  CreateBucket       |\n|  2026-07-26T14:05:47+00:00 |  lab-admin |  CreateAccessKey    |",
      fixes: [
        {
          problem: "lookup-events returns nothing",
          cause: "CloudTrail delivers in batches; events can take up to 15 minutes to appear.",
          fix: "Wait 15 minutes and run it again. If it is still empty after that, re-check <code>IsLogging</code>.",
        },
        {
          problem: "get-caller-identity shows :root",
          cause: "The CLI is configured with root credentials.",
          fix: "Stop and fix this now. Delete the root access key in the console, then <code>aws configure</code> again with the <code>lab-admin</code> key.",
        },
      ],
    },
  ],
  after: [
    "<b>Check the bill weekly.</b> Not because you expect a problem — because the habit is what makes you trustworthy with production accounts later.",
    "Never commit credentials. Add <code>.aws/</code>, <code>*.pem</code>, and <code>*.tfvars</code> to your global gitignore now, before you have anything to leak.",
    "Keep this account for the rest of the projects. Do not create a new one per project — one account you understand beats five you have lost track of.",
    "When you finish the whole track, delete the lab resources and consider closing the account. An unattended cloud account with valid credentials is a liability.",
  ],
};

export const CLOUD_GUIDES: ProjectGuide[] = [
  g01, c02, c03, c04, c05, c06, c07, c08, c09, c10, c11, c12,
];

export const CLOUD_GUIDE_SLUGS = new Set(CLOUD_GUIDES.map((g) => g.slug));

/** Does this project have a full written guide yet? */
export function cloudGuideSlug(projectId: number): string | undefined {
  return CLOUD_GUIDES.find((g) => g.projectId === projectId)?.slug;
}
