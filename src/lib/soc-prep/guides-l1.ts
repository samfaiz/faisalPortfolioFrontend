/**
 * SOC-prep L1 guides, projects 02–04. Project 01 lives in guides.ts because
 * everything here assumes the lab it builds already exists.
 */
import type { ProjectGuide } from "@/lib/guides/types";

/* -------------------------------------------------------------------------- */
/* 02 — Detect a brute force, then the one that succeeded                      */
/* -------------------------------------------------------------------------- */

export const g02: ProjectGuide = {
  slug: "brute-force-detection",
  projectId: 2,
  intro:
    "<p>A brute-force attack is someone guessing passwords over and over until one works. It is the most common attack on the internet and the first thing almost every SOC analyst learns to spot.</p><p>You are going to attack your own lab machine, watch the failures pile up in Splunk, and write a search that catches them. Then you will do the part most beginners skip: find the attempt that <b>succeeded</b>.</p><p>That distinction is the whole job. A thousand failed logins is noise — annoying, but the attacker got nothing. A thousand failures <b>followed by a success</b> is an incident, because someone is now inside. Any alert that cannot tell those two apart is worse than useless: it buries the real one under the noise.</p>",
  glossary: [
    {
      term: "Event ID",
      plain:
        "Windows gives every kind of logged event a number. <code>4625</code> is a failed logon, <code>4624</code> is a successful one. You will memorise a handful of these; they come up in every interview.",
    },
    {
      term: "Logon type",
      plain:
        "How someone logged in. Type 2 is sitting at the keyboard, type 3 is over the network (file shares), type 10 is Remote Desktop. Type 3 and 10 from an unexpected address are the interesting ones.",
    },
    {
      term: "SPL",
      plain:
        "Search Processing Language — how you write searches in Splunk. Pipes (<code>|</code>) chain steps together, exactly like a Unix shell.",
    },
    {
      term: "Baseline",
      plain:
        "What normal looks like. You cannot call five failed logins suspicious until you know that a quiet day has zero.",
    },
    {
      term: "False positive",
      plain:
        "An alert that fires when nothing bad happened. A user who forgot their password after a holiday looks a lot like an attacker if your rule is naive.",
    },
  ],
  before: [
    "<b>Project 01 finished</b> — both VMs running and Windows events flowing into Splunk.",
    "A snapshot of both VMs taken before you start (VirtualBox → Snapshots → Take).",
    "Roughly 3 hours.",
  ],
  steps: [
    {
      title: "Establish what normal looks like",
      time: "15 min",
      why: "If you write the detection first, you will pick a threshold out of thin air. Measure the quiet state and the threshold picks itself.",
      body: "<p>Open Splunk (<code>http://192.168.56.10:8000</code>) → <b>Search &amp; Reporting</b>. Set the time range to <b>Last 24 hours</b> and count your failed logons.</p>",
      commands: [
        {
          lang: "spl",
          where: "Splunk search bar",
          code: "index=main EventCode=4625\n| stats count by Account_Name\n| sort - count",
        },
      ],
      expect:
        "<p>Almost certainly zero results, or a small handful from your own mistyped passwords in project 01. Write the number down. That is your baseline, and it is what makes the next 20 failures obviously abnormal.</p>",
      expectCode: "Account_Name    count\nlabuser         1",
      fixes: [
        {
          problem: "No results and no events at all in index=main",
          cause: "The forwarder stopped, usually because the Windows VM was reverted or rebooted.",
          fix: "On the Windows VM run <code>Get-Service SplunkForwarder</code>. If it is stopped, <code>Start-Service SplunkForwarder</code>. Then re-run the search.",
        },
        {
          problem: "Events exist but Account_Name is empty",
          cause:
            "Splunk has not parsed the Windows event into fields, which happens when the Splunk Add-on for Windows is missing.",
          fix: "Install the free <b>Splunk Add-on for Microsoft Windows</b> from <b>Apps → Find More Apps</b> on the Splunk server, then restart Splunk. Field extraction starts working immediately for new events.",
        },
      ],
    },
    {
      title: "Run the attack against your own machine",
      time: "20 min",
      warn: "Only ever run this against your own isolated lab VM. Password-guessing against any machine you do not own is a criminal offence in most countries, including under the UK Computer Misuse Act and the US CFAA.",
      why: "Generating the attack yourself means you know exactly what the logs should contain — so when your detection misses something, you know it is the detection that is wrong.",
      body: "<p>You need a second machine to attack <i>from</i>. The simplest option is the Splunk VM you already have. It can reach the Windows VM over the lab network, and running the attack from a different host makes the source address in the logs meaningful.</p><p>First make sure Windows is listening for network logons — enable file sharing on the victim:</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim, as Administrator",
          label: "Allow network logons so there is something to brute-force",
          code: "Enable-NetFirewallRule -DisplayGroup \"File and Printer Sharing\"\nNew-SmbShare -Name labshare -Path C:\\Users\\Public -FullAccess Everyone",
        },
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Install the SMB client, then guess passwords",
          code: "sudo apt update && sudo apt install -y smbclient\n\n# 20 deliberately wrong passwords\nfor i in $(seq 1 20); do\n  smbclient //192.168.56.20/labshare -U labuser%\"wrongpass$i\" -c 'ls' 2>/dev/null\n  echo \"attempt $i\"\ndone",
        },
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Now the one that works — this is the important part",
          code: "smbclient //192.168.56.20/labshare -U labuser%'Password123' -c 'ls'",
        },
      ],
      expect:
        "<p>The 20 attempts print <code>NT_STATUS_LOGON_FAILURE</code>. The final one lists the contents of the share instead. You have now produced exactly the pattern a real attack leaves behind: a burst of failures followed by one success.</p>",
      expectCode:
        "session setup failed: NT_STATUS_LOGON_FAILURE\nattempt 1\n...\nattempt 20\n\n# then the successful one:\n  .                                   D        0  Sat Jul 26 14:40:11 2026\n  ..                                  D        0  Sat Jul 26 14:40:11 2026",
      fixes: [
        {
          problem: "NT_STATUS_CONNECTION_REFUSED on every attempt, including the correct password",
          cause: "The Windows firewall is blocking SMB, or the share was not created.",
          fix: "On Windows confirm with <code>Get-SmbShare</code> and <code>Get-NetFirewallRule -DisplayGroup \"File and Printer Sharing\" | Where Enabled -eq True</code>. From Linux check the port is open: <code>nc -zv 192.168.56.20 445</code>.",
        },
        {
          problem: "The correct password also fails",
          cause:
            "The account got locked out by an account lockout policy after repeated failures.",
          fix: "On Windows run <code>net user labuser</code> and check <b>Account active</b>. Unlock with <code>net user labuser /active:yes</code>. Note this for later — lockout is itself a useful detection signal.",
        },
      ],
    },
    {
      title: "Find the failures",
      time: "20 min",
      why: "Before writing a clever detection, prove the raw data is there and learn which fields matter.",
      body: "<p>Set the Splunk time range to <b>Last 15 minutes</b> and look at what arrived.</p>",
      commands: [
        {
          lang: "spl",
          label: "The raw failures",
          code: "index=main EventCode=4625\n| table _time, Account_Name, Logon_Type, Source_Network_Address, Failure_Reason",
        },
        {
          lang: "spl",
          label: "Grouped — this is how an analyst actually looks at it",
          code: "index=main EventCode=4625\n| stats count,\n        earliest(_time) as first_seen,\n        latest(_time) as last_seen\n        by Account_Name, Source_Network_Address\n| eval duration_secs = last_seen - first_seen\n| convert ctime(first_seen), ctime(last_seen)\n| sort - count",
        },
      ],
      expect:
        "<p>One row: account <code>labuser</code>, source <code>192.168.56.10</code>, count 20, spread over just a few seconds. That speed is the tell — a human being cannot mistype a password twenty times in eight seconds.</p>",
      expectCode:
        "Account_Name  Source_Network_Address  count  first_seen            last_seen             duration_secs\nlabuser       192.168.56.10           20     07/26/2026 14:39:51   07/26/2026 14:39:59   8",
      fixes: [
        {
          problem: "Source_Network_Address is \"-\" or empty",
          cause:
            "Some logon types genuinely do not record a source address — local console logons, for instance.",
          fix: "Check <code>Logon_Type</code> instead. Type 3 (network) always carries a source. If yours is type 2 or 5, the attack did not arrive the way you thought it did.",
        },
        {
          problem: "Far more than 20 failures",
          cause: "smbclient retries internally, so one attempt can produce several 4625s.",
          fix: "Not a problem — it makes the burst more obvious. Adjust your expectations, not the data.",
        },
      ],
    },
    {
      title: "Write the brute-force detection",
      time: "25 min",
      why: "A detection is just a search plus a threshold plus a time window. Getting the window right is what separates a rule that works from one that alerts constantly.",
      body: "<p>The logic: <b>more than 10 failures, from one source, against one account, within 5 minutes</b>. Ten because your baseline was ~1 — a genuine forgotten password rarely exceeds three or four attempts before the person gives up or resets.</p><p><code>bucket</code> chops time into fixed windows so \"10 in 5 minutes\" means something precise.</p>",
      commands: [
        {
          lang: "spl",
          label: "The detection",
          code: "index=main EventCode=4625\n| bucket _time span=5m\n| stats count as failures,\n        dc(Account_Name) as accounts_targeted\n        by _time, Source_Network_Address\n| where failures > 10\n| sort - failures",
        },
      ],
      expect:
        "<p>One row for the 5-minute window containing your attack. Now test that it is not trigger-happy: change the time range to <b>Last 24 hours</b> and re-run. You should still get exactly one row — the attack — and nothing else. A rule that stays silent on normal activity is a rule people will actually keep enabled.</p>",
      expectCode:
        "_time                Source_Network_Address  failures  accounts_targeted\n2026-07-26 14:35:00  192.168.56.10           20        1",
      fixes: [
        {
          problem: "The search returns nothing even though failures exist",
          cause: "Usually the time range, or the threshold is above your actual count.",
          fix: "Drop <code>| where failures > 10</code> temporarily and look at the real numbers. Then set the threshold from what you see.",
        },
      ],
    },
    {
      title: "Find the success that followed — the part that matters",
      time: "35 min",
      why: "This is the difference between an analyst who reports \"we saw brute-force noise\" and one who reports \"the account was compromised at 14:39\". Only one of those gets escalated.",
      body: "<p>You need to correlate two different event types: failures (4625) and successes (4624) from the same source, close together in time.</p><p>Read the search below in pieces. <code>eval</code> creates a tag for each event, <code>stats</code> collapses everything from one source into a single row, and the final <code>where</code> keeps only sources that did both.</p>",
      commands: [
        {
          lang: "spl",
          label: "Failures followed by a success from the same source",
          code: "index=main (EventCode=4625 OR EventCode=4624)\n| eval outcome = if(EventCode==4625, \"fail\", \"success\")\n| stats count(eval(outcome==\"fail\"))    as failures,\n        count(eval(outcome==\"success\")) as successes,\n        latest(eval(if(outcome==\"success\", _time, null()))) as success_time,\n        earliest(_time) as first_attempt,\n        values(Account_Name) as accounts\n        by Source_Network_Address\n| where failures > 10 AND successes > 0\n| eval minutes_to_compromise = round((success_time - first_attempt) / 60, 1)\n| convert ctime(success_time), ctime(first_attempt)\n| table Source_Network_Address, accounts, failures, successes,\n        first_attempt, success_time, minutes_to_compromise",
        },
      ],
      expect:
        "<p>A single row that tells the whole story: which source, which account, how many guesses, and the exact moment it worked. <code>minutes_to_compromise</code> is the number an incident report is built around.</p>",
      expectCode:
        "Source_Network_Address  accounts  failures  successes  first_attempt         success_time          minutes_to_compromise\n192.168.56.10           labuser   20        1          07/26/2026 14:39:51   07/26/2026 14:40:14   0.4",
      fixes: [
        {
          problem: "successes is 0 even though the login worked",
          cause:
            "Network logons produce 4624 with logon type 3, but the account name may be recorded differently (machine account, or with a domain prefix).",
          fix: "Run <code>index=main EventCode=4624 | table _time, Account_Name, Logon_Type, Source_Network_Address</code> and look at what is actually there. Correlate on <code>Source_Network_Address</code> alone if the account names do not line up.",
        },
        {
          problem: "The search errors with \"Error in 'stats' command\"",
          cause: "A typo in the nested eval — these are fiddly.",
          fix: "Build it up one clause at a time. Start with just <code>stats count by Source_Network_Address</code> and add one aggregation at a time until it breaks; the last thing you added is the problem.",
        },
      ],
    },
    {
      title: "Save it as a real alert",
      time: "20 min",
      why: "A search you have to remember to run is not a detection. Scheduling it is what makes it operational — and being able to say you have done that is worth a lot in an interview.",
      body: "<p>With the correlation search in the bar, click <b>Save As → Alert</b>.</p><ul><li><b>Title:</b> Brute force followed by successful logon</li><li><b>Alert type:</b> Scheduled, run every 5 minutes</li><li><b>Time range:</b> Last 15 minutes (deliberately wider than the schedule, so an attack straddling two runs is not missed)</li><li><b>Trigger condition:</b> Number of Results is greater than 0</li><li><b>Trigger action:</b> Add to Triggered Alerts, severity <b>High</b></li></ul><p>Then write the description as if a colleague at 3am has to act on it: what happened, why it matters, what to do first. That habit — writing the runbook with the rule — is what separates detection engineering from search-writing.</p>",
      expect:
        "<p>The alert appears under <b>Alerts</b> in the Splunk app. Re-run your attack from step 2 and within five minutes it appears in <b>Activity → Triggered Alerts</b>.</p>",
      fixes: [
        {
          problem: "The alert never triggers although the search works manually",
          cause:
            "Nearly always the time range. A scheduled alert uses its own configured range, not whatever was in the UI when you saved it.",
          fix: "Open the alert, click <b>Edit → Edit Alert</b>, and confirm the time range is set to Last 15 minutes rather than the default.",
        },
      ],
    },
    {
      title: "Deliberately try to break your own rule",
      time: "25 min",
      why: "Every detection has a blind spot. Finding yours before an attacker does is the single most valuable habit in this project, and describing that process is what makes an interviewer take you seriously.",
      body: "<p>Attack again, but slowly — 3 attempts, then wait 6 minutes, then 3 more. This is called <b>low-and-slow</b>, and it is exactly what a competent attacker does.</p>",
      commands: [
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Low-and-slow attack",
          code: "for round in 1 2 3 4; do\n  for i in 1 2 3; do\n    smbclient //192.168.56.20/labshare -U labuser%\"slow$round$i\" -c 'ls' 2>/dev/null\n  done\n  echo \"round $round done, sleeping 6 minutes\"\n  sleep 360\ndone",
        },
        {
          lang: "spl",
          label: "A wider window catches what the 5-minute rule misses",
          code: "index=main EventCode=4625\n| bucket _time span=1h\n| stats count as failures, dc(Account_Name) as accounts\n        by _time, Source_Network_Address\n| where failures > 8",
        },
      ],
      expect:
        "<p>Your original 5-minute rule stays quiet — 3 failures never crosses a threshold of 10. The 1-hour version catches all 12. You have just demonstrated, with evidence, that a threshold is a trade-off rather than a right answer. Keep both rules: the fast one for noisy attacks, the slow one for patient ones.</p>",
      fixes: [
        {
          problem: "You do not want to wait 24 minutes",
          cause: "Nothing is wrong; the attack is genuinely slow by design.",
          fix: "Shorten the sleep to 60 seconds and use <code>span=10m</code> with a threshold of 8. The lesson is identical and it takes four minutes.",
        },
      ],
    },
    {
      title: "Write it up",
      time: "20 min",
      why: "The build is half the project. The write-up is what you actually show people, and it is the thing you will read again the night before an interview.",
      body: "<p>Write a one-page note covering:</p><ul><li>What you built and why the correlation matters more than the count</li><li>Your two rules, with the thresholds and <b>why you chose those numbers</b> (baseline was ~1/day)</li><li>The low-and-slow gap you found in your own detection, and what you did about it</li><li>What you would do differently with real traffic — you would need a real baseline per account, and you would exclude service accounts that fail constantly by design</li></ul><p>Take screenshots of the triggered alert and the correlation results. Put the SPL in a file. This is portfolio material.</p>",
      expect:
        "<p>A note you could hand to someone who has never seen your lab and have them understand what you did and why. If it does not explain the threshold choices, it is not finished.</p>",
    },
  ],
  after: [
    "Restore your VM snapshots if you want a clean slate, but keep the saved searches — export them with <b>Settings → Searches, reports and alerts</b>.",
    "Remove the SMB share you created: <code>Remove-SmbShare -Name labshare -Force</code>.",
    "Keep the SPL somewhere you can find it. \"Show me a detection you have written\" is a real interview question.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 03 — Phishing analysis workflow                                             */
/* -------------------------------------------------------------------------- */

export const g03: ProjectGuide = {
  slug: "phishing-analysis-workflow",
  projectId: 3,
  intro:
    "<p>Phishing is the single most common thing a L1 analyst handles. A user forwards a suspicious email, and you have to decide — usually in under ten minutes — whether it is junk, a credential-harvesting attempt, or malware delivery, and whether anyone clicked.</p><p>You are going to build a repeatable workflow for that decision, then run real phishing emails through it. Repeatable is the key word: doing this by instinct works until you are tired, and then you miss something.</p><p>Everything here is done on evidence you can safely handle — headers, URLs, and hashes. You will never open an attachment or visit a phishing link, and the guide is built so you do not need to.</p>",
  glossary: [
    {
      term: "Email header",
      plain:
        "Hidden metadata at the top of every email recording where it came from and which servers relayed it. This is where the truth lives — the visible &ldquo;From&rdquo; is trivially faked.",
    },
    {
      term: "SPF, DKIM, DMARC",
      plain:
        "Three checks that answer &ldquo;was this email really sent by the domain it claims?&rdquo; SPF checks the sending server's address, DKIM checks a cryptographic signature, DMARC ties them together and says what to do on failure.",
    },
    {
      term: "IOC",
      plain:
        "Indicator of Compromise — a concrete artefact you can search for: a sender address, a URL, a file hash, an IP. Extracting these is most of the job.",
    },
    {
      term: "Detonation",
      plain:
        "Opening something suspicious inside a disposable sandbox to see what it does. Services like Any.Run and Joe Sandbox do this for you, so you never have to.",
    },
    {
      term: "Typosquatting",
      plain:
        "Registering a domain that looks almost right — <code>micros0ft.com</code>, <code>paypa1.com</code> — and relying on people not reading carefully.",
    },
  ],
  before: [
    "Your lab VM from project 01, or any machine where you are careful.",
    "A few real phishing emails. Your own spam folder is the best source — you almost certainly have some right now.",
    "Free accounts (optional but useful): <a href=\"https://urlscan.io\" target=\"_blank\" rel=\"noopener noreferrer\">urlscan.io</a>, <a href=\"https://www.virustotal.com\" target=\"_blank\" rel=\"noopener noreferrer\">VirusTotal</a>, <a href=\"https://any.run\" target=\"_blank\" rel=\"noopener noreferrer\">Any.Run</a>.",
    "About 4 hours.",
  ],
  steps: [
    {
      title: "Collect samples safely",
      time: "20 min",
      warn: "Never click a link or open an attachment in a phishing email, even in a VM. Everything in this workflow is done from the text of the message.",
      why: "You need real material. Synthetic examples teach you the workflow but not the messiness of the real thing.",
      body: "<p>Open your email provider's spam folder and export a few messages as <code>.eml</code> files — the raw format that preserves headers.</p><ul><li><b>Gmail:</b> open the message → three-dot menu → <b>Download message</b></li><li><b>Outlook web:</b> three-dot menu → <b>Save as</b> (or drag the message to your desktop from the desktop client)</li><li><b>Apple Mail:</b> File → Save As → Raw Message Source</li></ul><p>If your spam folder is empty, public corpora work fine — search for the <b>PhishTank</b> archive or the <b>Nazario phishing corpus</b>.</p><p>Put them in one folder and name them <code>sample-01.eml</code>, <code>sample-02.eml</code>, and so on.</p>",
      expect:
        "<p>Three to five <code>.eml</code> files. Open one in a text editor — you should see dozens of lines of <code>Received:</code>, <code>From:</code>, <code>DKIM-Signature:</code> before the message body. That header block is your evidence.</p>",
      fixes: [
        {
          problem: "The downloaded file is .txt or has no headers",
          cause: "You copied the visible message rather than exporting the source.",
          fix: "In Gmail use <b>Show original</b> and then <b>Download original</b> — that gives you the full raw message.",
        },
      ],
    },
    {
      title: "Read the headers properly",
      time: "40 min",
      why: "The visible From address is decoration. The Received chain is the actual path the message took, and it is very hard to forge convincingly.",
      body: "<p>Read the <code>Received:</code> headers <b>bottom to top</b> — the bottom one is the first server that touched the message, the top is the last. Look for the point where the chain stops making sense: a message claiming to be from your bank that first appeared on a residential IP in another country, for example.</p><p>Then check the three authentication results, usually collected in an <code>Authentication-Results:</code> header.</p>",
      commands: [
        {
          lang: "bash",
          label: "Pull the headers that matter",
          code: "grep -iE '^(from|to|subject|return-path|reply-to|received|authentication-results|dkim-signature):' sample-01.eml",
        },
        {
          lang: "bash",
          label: "The single most useful check — does Reply-To match From?",
          code: "grep -iE '^(from|reply-to|return-path):' sample-01.eml",
        },
      ],
      expect:
        "<p>Look for the mismatch. A legitimate email from <code>support@paypal.com</code> has a Return-Path on a PayPal domain. Phishing very often has a display name of &ldquo;PayPal Support&rdquo;, a From on a lookalike domain, and a Reply-To on a completely unrelated free-mail address — because the attacker wants your reply to reach them.</p>",
      expectCode:
        "From: \"PayPal Support\" <service@paypa1-secure.com>\nReply-To: paypal.refund.dept@gmail.com\nReturn-Path: <bounce@mail-relay-77.xyz>\n\nAuthentication-Results: mx.google.com;\n       spf=fail (google.com: domain of bounce@mail-relay-77.xyz\n         does not designate 45.83.12.9 as permitted sender)\n       dkim=none\n       dmarc=fail (p=REJECT)",
      fixes: [
        {
          problem: "There is no Authentication-Results header",
          cause: "Not every provider adds one, and some strip it on export.",
          fix: "Check SPF by hand: find the first external <code>Received:</code> IP and run <code>dig TXT thedomain.com | grep spf</code> to see whether that IP is authorised.",
        },
        {
          problem: "SPF passes but the email is obviously phishing",
          cause:
            "SPF only proves the sending server is authorised for the <i>envelope</i> domain — which is the attacker's own domain, not the one they are impersonating. This trips up a lot of people.",
          fix: "Always check what SPF actually validated. <code>spf=pass</code> for <code>mail-relay-77.xyz</code> tells you nothing about PayPal. DMARC is the check that ties authentication to the visible From.",
        },
      ],
    },
    {
      title: "Extract the indicators without touching them",
      time: "30 min",
      why: "IOCs are what you hand to the rest of the team and what you search your logs for. Extracting them mechanically means you do not miss one at 2am.",
      body: "<p>Pull every URL, domain, and IP out of the message. Then <b>defang</b> them — rewrite <code>http</code> as <code>hxxp</code> and <code>.</code> as <code>[.]</code> — so that nobody, including you, accidentally clicks one when the list gets pasted into a ticket or a chat.</p>",
      commands: [
        {
          lang: "bash",
          label: "Extract and defang every URL",
          code: "grep -oE 'https?://[^\"<>[:space:]]+' sample-01.eml \\\n  | sort -u \\\n  | sed 's|http|hxxp|g; s|\\.|[.]|g'",
        },
        {
          lang: "bash",
          label: "Attachment names and types, without opening anything",
          code: "grep -iE 'filename=|Content-Type:' sample-01.eml | sort -u",
        },
        {
          lang: "bash",
          label: "If there is a base64 attachment, hash it — still without opening it",
          code: "# Extract the base64 block to a file, decode, and hash.\n# You are computing a fingerprint, not executing anything.\nsed -n '/^Content-Transfer-Encoding: base64/,/^--/p' sample-01.eml \\\n  | tail -n +3 | head -n -1 | base64 -d > /tmp/attach.bin\n\nsha256sum /tmp/attach.bin",
        },
      ],
      expect:
        "<p>A defanged list you could safely paste anywhere. Note how many distinct domains appear — legitimate marketing email uses one or two known tracking domains; phishing often chains through several throwaway ones.</p>",
      expectCode:
        "hxxps://paypa1-secure[.]com/verify?id=8823\nhxxps://bit[.]ly/3xK9pQr\nhxxp://45[.]83[.]12[.]9/collect[.]php\n\nSHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      fixes: [
        {
          problem: "The grep returns nothing but you can see links in the email",
          cause: "The message body is base64 or quoted-printable encoded.",
          fix: "Decode first. For quoted-printable: <code>python3 -c \"import quopri,sys; sys.stdout.buffer.write(quopri.decodestring(open('sample-01.eml','rb').read()))\" > decoded.txt</code>, then grep that.",
        },
      ],
    },
    {
      title: "Check the indicators against threat intelligence",
      time: "30 min",
      why: "Somebody has probably seen this campaign already. Checking takes two minutes and can turn a 30-minute investigation into a 5-minute one.",
      body: "<p>Take your defanged list, re-fang one entry at a time, and check it. <b>Paste the URL into these services — do not visit it.</b></p><ul><li><a href=\"https://urlscan.io\" target=\"_blank\" rel=\"noopener noreferrer\">urlscan.io</a> — visits the page in a sandbox and shows you a screenshot. This is how you see the fake login page without going near it.</li><li><a href=\"https://www.virustotal.com\" target=\"_blank\" rel=\"noopener noreferrer\">VirusTotal</a> — checks URLs, domains, IPs, and file hashes against ~70 engines.</li><li><a href=\"https://talosintelligence.com/reputation\" target=\"_blank\" rel=\"noopener noreferrer\">Talos Reputation</a> — sender IP reputation and history.</li></ul>",
      warn: "On urlscan.io, set the scan visibility to <b>Unlisted</b> or <b>Private</b>. Public scans are searchable, and submitting a URL that contains a colleague's email address publishes it.",
      commands: [
        {
          lang: "bash",
          label: "Domain age is one of the strongest single signals",
          code: "whois paypa1-secure.com | grep -iE 'creation|created|registered'",
        },
      ],
      expect:
        "<p>A domain registered <b>three days ago</b> that claims to be a major bank is essentially conclusive. Legitimate corporate domains are years old. Note the creation date for every domain — it is the fastest triage signal you have.</p>",
      expectCode:
        "Creation Date: 2026-07-23T09:14:22Z\nRegistrar: NameSilo, LLC\n\n→ registered 3 days before the email was sent",
      fixes: [
        {
          problem: "whois returns nothing or is not installed",
          cause: "The tool is missing, or the TLD's registry does not respond to CLI whois.",
          fix: "<code>sudo apt install whois</code>, or use the web form at <a href=\"https://who.is\" target=\"_blank\" rel=\"noopener noreferrer\">who.is</a>. VirusTotal also shows creation dates under the domain's Details tab.",
        },
        {
          problem: "VirusTotal shows 0/70 detections",
          cause:
            "The campaign is new. Detection lags reality by hours to days — a clean result is not an all-clear.",
          fix: "Weight your own evidence more heavily: domain age, header mismatches, and the urlscan screenshot. Being first to see a campaign is normal, not unusual.",
        },
      ],
    },
    {
      title: "Decide what it is, and write the verdict down",
      time: "30 min",
      why: "Consistent verdicts are what make a SOC's numbers mean anything. \"It looked dodgy\" is not a verdict.",
      body: "<p>Classify every sample into exactly one of four buckets, and record the evidence that drove it:</p><ul><li><b>Spam</b> — unwanted but not malicious. No credential harvesting, no payload.</li><li><b>Credential phishing</b> — a link to a fake login page. Most common by far.</li><li><b>Malware delivery</b> — an attachment or a link to a payload.</li><li><b>Business Email Compromise</b> — no link and no attachment, just a plausible request for money or data, often impersonating an executive. These evade almost every technical control, which is what makes them dangerous.</li></ul><p>Write one line per sample: verdict, the two or three pieces of evidence, and the confidence.</p>",
      expect:
        "<p>A table you could hand to a manager. Notice which decisions were hard — those are the ones worth talking about in an interview.</p>",
      expectCode:
        "sample-01  Credential phishing  HIGH   spf=fail, domain 3 days old, urlscan shows cloned O365 login\nsample-02  Spam                 HIGH   legitimate marketing sender, unsubscribe present, no creds requested\nsample-03  BEC                  MEDIUM no links at all; CEO display name + external reply-to; urgency language",
    },
    {
      title: "Answer the question that actually matters: did anyone click?",
      time: "40 min",
      why: "Nobody escalates \"we received a phishing email\". They escalate \"three users clicked and one entered credentials\". This step is what turns analysis into incident response.",
      body: "<p>In a real environment you would search proxy and DNS logs for the phishing domain. In your lab you can simulate it — and the simulation teaches the query, which is the transferable part.</p><p>Add a fake proxy log to Splunk so you have something to hunt through:</p>",
      commands: [
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Create a sample proxy log",
          code: "sudo mkdir -p /var/log/labproxy\ncat <<'EOF' | sudo tee /var/log/labproxy/access.log\n2026-07-26 09:14:22 10.0.0.51 alice GET https://paypa1-secure.com/verify 200\n2026-07-26 09:15:03 10.0.0.51 alice POST https://paypa1-secure.com/login 302\n2026-07-26 09:41:55 10.0.0.77 bob GET https://paypa1-secure.com/verify 200\n2026-07-26 10:02:11 10.0.0.19 carol GET https://news.bbc.co.uk/ 200\nEOF",
        },
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Tell Splunk to index it",
          code: "sudo /opt/splunk/bin/splunk add monitor /var/log/labproxy -index main -sourcetype labproxy -auth admin:YOUR_PASSWORD",
        },
        {
          lang: "spl",
          label: "Who touched the phishing domain?",
          code: "index=main sourcetype=labproxy \"paypa1-secure.com\"\n| rex field=_raw \"^(?<ts>\\S+ \\S+) (?<src_ip>\\S+) (?<user>\\S+) (?<method>\\S+) (?<url>\\S+) (?<status>\\d+)\"\n| stats values(method) as methods, count by user, src_ip\n| eval submitted_credentials = if(match(methods, \"POST\"), \"YES — TREAT AS COMPROMISED\", \"no\")",
        },
      ],
      expect:
        "<p>Two users visited; one of them POSTed. That POST is the difference between \"reset their password as a precaution\" and \"this account is compromised right now\". A GET means they looked at the page. A POST means they submitted something to it.</p>",
      expectCode:
        "user   src_ip     methods      count  submitted_credentials\nalice  10.0.0.51  GET, POST    2      YES — TREAT AS COMPROMISED\nbob    10.0.0.77  GET          1      no",
      fixes: [
        {
          problem: "The rex command extracts nothing",
          cause: "The regex does not match your log format exactly.",
          fix: "Test it incrementally: run the search without <code>| rex</code>, look at the raw events, and build the pattern up field by field. Splunk's <b>Extract New Fields</b> UI can generate the regex for you.",
        },
      ],
    },
    {
      title: "Turn the workflow into a checklist",
      time: "30 min",
      why: "This is the deliverable. A workflow in your head helps you; a written one helps the whole team and is something you can hand to an interviewer.",
      body: "<p>Write your triage checklist as a numbered document, in the order you actually do it, with a decision point at the end of each stage. Include:</p><ol><li>Preserve the original — never forward, always attach or export</li><li>Header check: From vs Reply-To vs Return-Path, SPF/DKIM/DMARC</li><li>Extract and defang all IOCs</li><li>Domain age and reputation</li><li>urlscan screenshot rather than visiting</li><li>Verdict, from the four categories</li><li>Impact: search proxy/DNS for clicks, and mail logs for who else received it</li><li>Containment: block the domain, reset any account that POSTed, purge the message from other mailboxes</li></ol><p>Add the target time for each stage. Realistic triage is 10–15 minutes; knowing where your time goes is how you get faster.</p>",
      expect:
        "<p>A one-page checklist someone else could follow on their first day. That, plus your three analysed samples, is the project.</p>",
    },
  ],
  after: [
    "Delete the sample emails when you are done, or keep them somewhere clearly marked and away from anything automatic.",
    "Report the phishing you analysed — most providers have a report button, and PhishTank accepts submissions. Real contribution, and it takes a minute.",
    "Keep the checklist. Being able to produce a written triage process is unusual at L1 and interviewers notice it.",
  ],
};

/* -------------------------------------------------------------------------- */
/* 04 — Log analysis from raw files, no SIEM                                   */
/* -------------------------------------------------------------------------- */

export const g04: ProjectGuide = {
  slug: "raw-log-analysis",
  projectId: 4,
  intro:
    "<p>Every SOC has a SIEM, and every SOC has days when the SIEM does not have what you need — the source was not onboarded, the retention window expired, or you have been handed a folder of files from a machine that was never monitored.</p><p>This project is about being useful anyway. You are going to analyse real attack traffic using nothing but command-line tools that exist on every Linux machine: <code>grep</code>, <code>awk</code>, <code>sort</code>, <code>uniq</code>, <code>cut</code>.</p><p>There is a second reason to learn this. Understanding what a SIEM does <i>for</i> you — parsing, grouping, counting, sorting — makes you dramatically better at using one. Most people who are bad at SPL are bad at it because they never learned to think in these terms first.</p>",
  glossary: [
    {
      term: "stdout / pipe",
      plain:
        "Programs print to &ldquo;standard output&rdquo;. The pipe character <code>|</code> feeds one program's output into the next as input. Every command here is a chain of small tools.",
    },
    {
      term: "grep",
      plain: "Prints lines that match a pattern. Your filter.",
    },
    {
      term: "awk",
      plain:
        "Splits each line into fields and lets you print or calculate with them. <code>$1</code> is the first field, <code>$7</code> the seventh. Your column extractor.",
    },
    {
      term: "sort | uniq -c",
      plain:
        "The most useful pair in log analysis. <code>sort</code> groups identical lines together and <code>uniq -c</code> counts them. Together they are exactly what a SIEM's <code>stats count by</code> does.",
    },
    {
      term: "Log rotation",
      plain:
        "Systems compress and archive old logs, so <code>auth.log</code> becomes <code>auth.log.1</code> then <code>auth.log.2.gz</code>. Forgetting to search the archives is a classic way to miss the start of an incident.",
    },
  ],
  before: [
    "Any Linux machine or macOS terminal. Your Splunk VM from project 01 is perfect.",
    "On Windows, install WSL (<code>wsl --install</code> in an Administrator PowerShell) or use Git Bash.",
    "About 3 hours.",
  ],
  steps: [
    {
      title: "Get a real log to work with",
      time: "15 min",
      why: "Synthetic logs are too clean. Real ones have malformed lines, timezone confusion, and the noise that makes analysis hard — which is the skill.",
      body: "<p>Your own machine has genuine attack data if it has ever been exposed to the internet, but the reliable option is a public dataset. Use the SSH auth log from a honeypot, or generate your own by failing logins on the lab VM.</p>",
      commands: [
        {
          lang: "bash",
          label: "Option A — generate real failures on your own machine",
          code: "# From the Windows VM or another terminal, fail some SSH logins\n# against your Splunk VM. This writes genuine entries to auth.log.\nfor i in $(seq 1 15); do\n  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 \\\n      baduser$i@192.168.56.10 2>/dev/null\ndone",
        },
        {
          lang: "bash",
          where: "On soc-splunk",
          label: "Option B — copy your own auth log to a working folder",
          code: "mkdir -p ~/loganalysis && cd ~/loganalysis\nsudo cp /var/log/auth.log .\nsudo chown $USER auth.log\n\nwc -l auth.log",
        },
      ],
      expect:
        "<p>A file with at least a few hundred lines. If <code>wc -l</code> shows a small number, your system rotated the log recently — check for <code>auth.log.1</code> as well.</p>",
      expectCode: "1284 auth.log",
      fixes: [
        {
          problem: "/var/log/auth.log does not exist",
          cause:
            "Red Hat–family distributions (CentOS, Fedora, Amazon Linux) use <code>/var/log/secure</code> instead.",
          fix: "Use <code>sudo cp /var/log/secure .</code>. On systems with only journald, export it: <code>sudo journalctl -u ssh --no-pager > auth.log</code>.",
        },
      ],
    },
    {
      title: "Look before you filter",
      time: "20 min",
      why: "Every analyst who greps first ends up searching for the wrong thing. Two minutes spent reading actual lines saves twenty spent debugging a pattern.",
      body: "<p>Get a feel for the shape of the data before you touch it.</p>",
      commands: [
        {
          lang: "bash",
          label: "The orientation commands",
          code: "head -20 auth.log          # what does a line look like?\ntail -20 auth.log          # what happened most recently?\nwc -l auth.log             # how much is there?\n\n# What kinds of messages exist at all? Field 5 is usually the process.\nawk '{print $5}' auth.log | sort | uniq -c | sort -rn | head -20",
        },
      ],
      expect:
        "<p>You now know the line format and which processes are noisy. That last command is the single most useful thing in this guide — it tells you what a log is <i>about</i> in one line, and it works on almost any log format.</p>",
      expectCode:
        "    847 sshd[1234]:\n    203 sudo:\n    112 systemd-logind[891]:\n     45 CRON[2211]:",
      fixes: [
        {
          problem: "awk '{print $5}' prints nonsense",
          cause: "Your log's fields do not line up the way this one does.",
          fix: "Run <code>head -1 auth.log | awk '{for(i=1;i&lt;=NF;i++) print i\": \"$i}'</code> — it numbers every field on the first line so you can pick the right one.",
        },
      ],
    },
    {
      title: "Count the failures",
      time: "25 min",
      why: "This is the same brute-force question as project 02, answered without a SIEM. Doing it both ways is what makes the SIEM version click.",
      body: "<p>Failed SSH logins say <code>Failed password</code>. Build the pipeline one stage at a time and watch what each stage does.</p>",
      commands: [
        {
          lang: "bash",
          label: "Build it up in stages — run each line separately",
          code: "grep 'Failed password' auth.log | head -3\n# → see the raw matching lines first\n\ngrep 'Failed password' auth.log | wc -l\n# → how many in total?\n\ngrep 'Failed password' auth.log | awk '{print $(NF-3)}' | head -3\n# → NF is the last field; NF-3 is the source IP in this format",
        },
        {
          lang: "bash",
          label: "The finished pipeline — top attacking IPs",
          code: "grep 'Failed password' auth.log \\\n  | awk '{print $(NF-3)}' \\\n  | sort \\\n  | uniq -c \\\n  | sort -rn \\\n  | head -10",
        },
        {
          lang: "bash",
          label: "Which usernames are they guessing?",
          code: "grep 'Failed password' auth.log \\\n  | sed 's/invalid user //' \\\n  | awk '{print $(NF-5)}' \\\n  | sort | uniq -c | sort -rn | head -15",
        },
      ],
      expect:
        "<p>A ranked list. The usernames are informative: <code>root</code>, <code>admin</code>, <code>oracle</code>, <code>postgres</code> means an automated scanner working through a standard list. A single specific real username means somebody is targeting you, which is a different and more serious situation.</p>",
      expectCode:
        "    412 192.168.56.20\n     87 10.0.0.99\n      3 192.168.56.1\n\n    203 root\n     94 admin\n     41 test\n     18 oracle",
      fixes: [
        {
          problem: "awk prints usernames where you expected IPs",
          cause:
            "Lines with \"invalid user\" have one extra field, shifting everything.",
          fix: "Anchor on the word instead of the position: <code>grep -oE 'from [0-9.]+' auth.log | awk '{print $2}'</code>. Matching on content beats counting fields whenever the format varies.",
        },
      ],
    },
    {
      title: "Find the success hidden in the noise",
      time: "30 min",
      why: "Same lesson as project 02, and it is the most important one in the whole kit: failures are noise, a failure followed by a success is an incident.",
      body: "<p>Successful SSH logins say <code>Accepted password</code> or <code>Accepted publickey</code>. Find any IP that appears in both lists.</p>",
      commands: [
        {
          lang: "bash",
          label: "The correlation, using comm",
          code: "grep 'Failed password' auth.log | grep -oE 'from [0-9.]+' | awk '{print $2}' | sort -u > /tmp/failed_ips\ngrep 'Accepted'        auth.log | grep -oE 'from [0-9.]+' | awk '{print $2}' | sort -u > /tmp/success_ips\n\n# Lines present in BOTH files = tried, failed, then got in\ncomm -12 /tmp/failed_ips /tmp/success_ips",
        },
        {
          lang: "bash",
          label: "Then get the full timeline for that IP",
          code: "SUSPECT=$(comm -12 /tmp/failed_ips /tmp/success_ips | head -1)\necho \"Investigating $SUSPECT\"\n\ngrep \"$SUSPECT\" auth.log | grep -E 'Failed|Accepted|session opened'",
        },
      ],
      expect:
        "<p>If <code>comm</code> outputs an address, you have found a compromise: that IP guessed wrong repeatedly and then got in. The timeline shows exactly when, as which user, and what happened after — which is precisely the shape of an incident report.</p>",
      expectCode:
        "192.168.56.20\n\nJul 26 14:39:51 soc-splunk sshd[3021]: Failed password for invalid user admin from 192.168.56.20\n... (many)\nJul 26 14:41:07 soc-splunk sshd[3044]: Accepted password for analyst from 192.168.56.20\nJul 26 14:41:07 soc-splunk sshd[3044]: pam_unix(sshd:session): session opened for user analyst",
      fixes: [
        {
          problem: "comm complains the input is not sorted",
          cause: "<code>comm</code> requires sorted input and is strict about it.",
          fix: "Make sure both files were written with <code>sort -u</code>. If in doubt, re-sort in place: <code>sort -o /tmp/failed_ips /tmp/failed_ips</code>.",
        },
        {
          problem: "comm outputs nothing",
          cause: "Genuinely no overlap — the attacker never succeeded. That is a good result.",
          fix: "Nothing to fix. Say so explicitly in your write-up: absence of evidence, clearly stated, is a finding.",
        },
      ],
    },
    {
      title: "Build a timeline",
      time: "30 min",
      why: "Every incident report is a timeline. Being able to produce one from raw files, fast, is a genuinely differentiating skill at L1.",
      body: "<p>Merge everything relevant to your suspect into one time-ordered view, then look at what happened <b>after</b> the successful login — that is where the actual damage is.</p>",
      commands: [
        {
          lang: "bash",
          label: "Everything about one IP, in order",
          code: "grep \"$SUSPECT\" auth.log | sort -k1,1M -k2,2n -k3,3 > timeline.txt\nwc -l timeline.txt && head -5 timeline.txt",
        },
        {
          lang: "bash",
          label: "What did they do once inside? Check sudo and new accounts.",
          code: "grep -E 'sudo:|useradd|usermod|passwd|COMMAND=' auth.log \\\n  | grep -v 'pam_unix(sudo:session)' \\\n  | tail -20",
        },
        {
          lang: "bash",
          label: "Persistence check — did they add an SSH key?",
          code: "ls -la ~/.ssh/ 2>/dev/null\ncat ~/.ssh/authorized_keys 2>/dev/null\nsudo find /home /root -name authorized_keys -newermt '-2 days' 2>/dev/null",
        },
      ],
      expect:
        "<p>A file you can read top to bottom that tells the story. The post-access commands are the part that matters — an attacker who logged in and did nothing is very different from one who added an SSH key and created an account.</p>",
      fixes: [
        {
          problem: "sort -k1,1M fails with \"invalid month\"",
          cause: "Your locale is not English, so <code>M</code> cannot parse month names.",
          fix: "Prefix the command with <code>LC_ALL=C</code>, or sort the file as-is — syslog is written chronologically already, so plain <code>cat</code> is usually fine.",
        },
      ],
    },
    {
      title: "Do the same on Windows logs",
      time: "30 min",
      why: "Half of what you will read in a SOC is Windows, and the tooling is completely different. PowerShell is to Windows logs what grep is to Linux.",
      body: "<p>On the Windows VM, the equivalent commands use <code>Get-WinEvent</code>. The thinking is identical: filter, extract, group, count, sort.</p>",
      commands: [
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "Failed logons, grouped and counted",
          code: "Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4625} -MaxEvents 500 |\n  ForEach-Object {\n    [PSCustomObject]@{\n      Time    = $_.TimeCreated\n      Account = $_.Properties[5].Value\n      Source  = $_.Properties[19].Value\n    }\n  } |\n  Group-Object Account, Source |\n  Sort-Object Count -Descending |\n  Select-Object Count, Name -First 10",
        },
        {
          lang: "powershell",
          where: "On soc-victim",
          label: "Export to CSV so you can analyse it anywhere",
          code: "Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624,4625} -MaxEvents 1000 |\n  Select-Object TimeCreated, Id, @{N='Account';E={$_.Properties[5].Value}} |\n  Export-Csv -NoTypeInformation -Path C:\\logs\\logons.csv",
        },
      ],
      expect:
        "<p>The same brute-force pattern you found in Splunk, extracted with no SIEM at all. Learning that <code>Properties[5]</code> is the account name and <code>Properties[19]</code> is the source address is fiddly but worth knowing — those indices come up constantly.</p>",
      fixes: [
        {
          problem: "\"No events were found that match the specified selection criteria\"",
          cause: "Either there genuinely are none, or you lack permission to read the Security log.",
          fix: "Run PowerShell as Administrator — the Security log requires it. Then confirm events exist at all with <code>Get-WinEvent -LogName Security -MaxEvents 5</code>.",
        },
        {
          problem: "The Properties indices give the wrong values",
          cause: "Index positions differ between Windows versions and event types.",
          fix: "Inspect one event first: <code>$e = Get-WinEvent -FilterHashtable @{LogName='Security';ID=4625} -MaxEvents 1; $e.Properties | ForEach-Object {$i++; \"$i : $($_.Value)\"}</code>.",
        },
      ],
    },
    {
      title: "Package it as a reusable script",
      time: "30 min",
      why: "The point of learning this is speed under pressure. A script means the next investigation starts at minute zero instead of minute twenty.",
      body: "<p>Wrap what you learned into one triage script you can drop onto any Linux box.</p>",
      commands: [
        {
          lang: "bash",
          label: "quick-triage.sh",
          code: "#!/usr/bin/env bash\n# Fast SSH triage on a raw auth log.\n# Usage: ./quick-triage.sh /var/log/auth.log\nset -euo pipefail\nLOG=\"${1:-/var/log/auth.log}\"\n\n[[ -r \"$LOG\" ]] || { echo \"Cannot read $LOG\"; exit 1; }\n\necho \"=== $LOG — $(wc -l < \"$LOG\") lines ===\"\n\necho -e \"\\n--- Top sources of failed logins ---\"\ngrep 'Failed password' \"$LOG\" | grep -oE 'from [0-9.]+' | awk '{print $2}' \\\n  | sort | uniq -c | sort -rn | head -10\n\necho -e \"\\n--- Usernames targeted ---\"\ngrep 'Failed password' \"$LOG\" | grep -oE 'for (invalid user )?[a-z0-9_-]+' \\\n  | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10\n\necho -e \"\\n--- Successful logins ---\"\ngrep 'Accepted' \"$LOG\" | grep -oE 'for [a-z0-9_-]+ from [0-9.]+' \\\n  | sort | uniq -c | sort -rn | head -10\n\necho -e \"\\n--- !! IPs that failed then succeeded !! ---\"\ncomm -12 \\\n  <(grep 'Failed password' \"$LOG\" | grep -oE 'from [0-9.]+' | awk '{print $2}' | sort -u) \\\n  <(grep 'Accepted'        \"$LOG\" | grep -oE 'from [0-9.]+' | awk '{print $2}' | sort -u)\n\necho -e \"\\n--- Privilege escalation ---\"\ngrep -E 'sudo:.*COMMAND=|useradd|usermod' \"$LOG\" | tail -10",
        },
        {
          lang: "bash",
          label: "Make it executable and run it",
          code: "chmod +x quick-triage.sh\n./quick-triage.sh ~/loganalysis/auth.log",
        },
      ],
      expect:
        "<p>A single command that produces the whole triage picture in under a second. Run it against a log you have not looked at yet and see whether it tells you something you did not know — that is the test of whether it is actually useful.</p>",
      fixes: [
        {
          problem: "\"syntax error near unexpected token `('\"",
          cause:
            "The <code>&lt;(...)</code> process-substitution syntax is bash-only, and the script ran under <code>sh</code>.",
          fix: "Run it as <code>bash quick-triage.sh</code>, and keep the <code>#!/usr/bin/env bash</code> shebang line at the top.",
        },
      ],
    },
  ],
  after: [
    "Put the script in a git repository. A small, genuinely useful tool with a clear README is better portfolio evidence than a large unfinished one.",
    "Run it against the logs from project 02 and confirm both methods find the same attack. Agreement between two independent approaches is how you build confidence in either.",
    "Learn <code>jq</code> next — modern logs are JSON, and <code>jq</code> is the <code>awk</code> of the JSON world.",
  ],
};
