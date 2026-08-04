/**
 * Project 02 — Phishing email analyzer.
 *
 * The teaching point sits in the split: header parsing, authentication results,
 * URL extraction and attachment hashing are all deterministic code and none of
 * it is AI. The model interprets what that code found and writes the report.
 *
 * Code blocks use String.raw so Windows paths and regexes stay literal.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p02: ProjectGuide = {
  slug: "phishing-email-analyzer",
  projectId: 2,
  intro:
    "<p>You are going to build something that takes a raw email file and produces an analyst report: who really sent it, whether the sending domain authorised it, where the links go, what is attached, and whether it is phishing.</p>" +
    "<p>The part worth paying attention to is <b>how little of it is AI</b>. Parsing headers, reading SPF and DKIM results, tracing the delivery chain, extracting URLs, hashing attachments — every one of those is ordinary Python that gets the same answer every time. The model does exactly one job: it reads that structured evidence and explains what it means. Nothing more.</p>" +
    "<p>That split is not a limitation, it is the design. A model asked to <i>determine</i> whether SPF passed will sometimes say it passed when the header says <code>softfail</code>, because it is pattern-matching on plausible text. A model asked to <i>explain</i> a <code>softfail</code> that Python already extracted gets it right, because the fact is in front of it. Put the deterministic work in code, and you remove the failure mode instead of prompting around it.</p>",
  dataset: {
    name: "Your own junk folder, plus the SpamAssassin public corpus",
    url: "https://spamassassin.apache.org/old/publiccorpus/",
    note:
      "<p><b>Primary source: your own spam.</b> Every mail client can export a message as <code>.eml</code> — Gmail: <i>⋮ → Show original → Download Original</i>; Outlook desktop: drag the message onto your desktop; Thunderbird: <i>right-click → Save As</i>. You need modern mail for this project because <code>Authentication-Results</code> headers are where SPF, DKIM and DMARC verdicts actually live.</p>" +
      "<p><b>Secondary: the SpamAssassin public corpus.</b> Free, no signup, thousands of real messages. One honest caveat you should know before you download 2 GB — it was collected in 2002–2003, before SPF and DKIM existed, so those messages have <b>no</b> authentication headers at all. It is excellent for practising parsing at volume and useless for the authentication step. Use both, for different things.</p>" +
      "<p>Never open a phishing sample in a mail client. Everything here reads the file as bytes; nothing renders HTML or follows a link.</p>",
  },
  glossary: [
    {
      term: "EML",
      plain:
        "A plain text file containing one complete email — headers at the top, a blank line, then the body. It is the raw thing your mail client received, before it was made pretty. You can open one in Notepad.",
    },
    {
      term: "SPF (Sender Policy Framework)",
      plain:
        "The domain owner publishes a list of servers allowed to send mail as that domain. The receiving server checks the connecting server against that list. A pass means “this server was authorised”, not “this email is safe”.",
    },
    {
      term: "DKIM",
      plain:
        "The sending server cryptographically signs parts of the message. The receiver verifies the signature against a public key in DNS. A pass means the signed parts were not altered in transit and came from someone holding the key.",
    },
    {
      term: "DMARC",
      plain:
        "Ties SPF and DKIM to the domain the human actually sees in the From: field, and tells receivers what to do on failure. This is the one that matters, because SPF and DKIM alone can both pass on a domain the recipient never sees.",
    },
    {
      term: "Alignment",
      plain:
        "Whether the domain that passed SPF or DKIM matches the domain in the visible From: address. Unaligned pass is the classic phishing trick — the attacker authenticates their own domain perfectly and puts yours in the From:.",
    },
    {
      term: "Defanging",
      plain:
        "Rewriting a URL so it cannot be clicked or auto-fetched — hxxps://evil[.]com. A safety habit, and it also stops downstream tooling from resolving something it should not.",
    },
  ],
  before: [
    "<b>Project 01 finished.</b> This reuses the grounding validator you wrote there, unchanged.",
    "<b>Module 08 read.</b> The evidence bundle in step 6 is that module's normalisation applied to email.",
    "Python 3.11+. Everything except the model runs on the standard library plus two small packages.",
    "One phishing email you can export as <code>.eml</code>, and one <b>legitimate</b> email — you need both, and step 9 explains why the legitimate one is not optional.",
  ],
  steps: [
    {
      title: "Set up, and get one sample safely",
      time: "10 min",
      why: "The riskiest moment in this whole project is acquiring the sample, because the natural way to get it is to open it. Do it as a file operation instead.",
      body:
        "<p>Make a project folder next to your project 01 work, and export one phishing message into it. In Gmail, open the message, click the three dots, choose <b>Show original</b>, then <b>Download Original</b> — you get a <code>.eml</code> without ever rendering the HTML body or loading a tracking pixel.</p>" +
        "<p>Two packages beyond the standard library: <code>tldextract</code> to split hostnames correctly (you cannot do this with <code>split('.')</code> — <code>co.uk</code> exists), and <code>ollama</code> for the model.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows",
          code: String.raw`mkdir phish-analyzer; cd phish-analyzer
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install ollama pydantic rich tldextract

mkdir samples`,
        },
        {
          lang: "bash",
          where: "macOS / Linux",
          code: String.raw`mkdir phish-analyzer && cd phish-analyzer
python3 -m venv .venv
source .venv/bin/activate
pip install ollama pydantic rich tldextract

mkdir samples`,
        },
        {
          lang: "bash",
          label: "Confirm the file is what you think it is",
          code: String.raw`# The first line of a valid EML is a header, usually Received: or Delivered-To:
head -n 5 samples/suspect.eml`,
        },
      ],
      expect:
        "<p>Header lines, in plain text. If you see binary noise, the export saved a <code>.msg</code> (Outlook's proprietary format) rather than an <code>.eml</code> — see the fix below.</p>",
      expectCode: String.raw`Delivered-To: jbell@example.com
Received: by 2002:a05:6402:1234 with SMTP id x12csp;
        Sat, 1 Aug 2026 02:14:07 -0700 (PDT)
Authentication-Results: mx.google.com;
       dkim=pass header.i=@sendgrid.net header.s=smtpapi;`,
      fixes: [
        {
          problem: "The file is binary, or starts with a run of null bytes",
          cause:
            "Outlook saved a <code>.msg</code>, which is a compound OLE document rather than RFC822 text. Dragging a message to the desktop from the Outlook desktop client usually produces <code>.eml</code>; <i>File → Save As</i> usually produces <code>.msg</code>.",
          fix:
            "Either re-export by dragging, or convert with <code>pip install extract-msg</code> and <code>python -m extract_msg --out samples suspect.msg</code>. New Outlook and Outlook Web only offer <code>.eml</code>, so this is mostly a desktop-Outlook problem.",
        },
        {
          problem: "You do not have a phishing email to hand",
          cause: "A well-filtered mailbox is a good problem to have.",
          fix:
            "Grab the SpamAssassin corpus for structure practice, and for the authentication steps use any <b>legitimate</b> modern email — a receipt, a newsletter. You want to see a clean <code>dmarc=pass</code> before you look at a failing one, because the contrast is what teaches it.",
        },
      ],
    },
    {
      title: "Parse the envelope — the deterministic core",
      time: "20 min",
      why: "This is the foundation, and there is no AI in it anywhere. Python's email parser handles MIME, encoded words and folded headers correctly, and getting these facts right in code means the model never has to guess them.",
      body:
        "<p>Two things here that trip people up and are worth understanding rather than copying.</p>" +
        "<p>First, <b>display names lie</b>. <code>From: \"IT Support\" &lt;billing@random-domain.tld&gt;</code> shows as “IT Support” in every mail client. Parse the address and the display name separately and treat them as two different facts.</p>" +
        "<p>Second, headers can appear more than once. <code>msg['Received']</code> gives you one; <code>msg.get_all('Received')</code> gives you the chain. If you use the first form on <code>Received</code> you silently lose the entire delivery path.</p>",
      commands: [
        {
          lang: "python",
          label: "parse.py",
          code: String.raw`from email import policy
from email.parser import BytesParser
from email.utils import parseaddr, parsedate_to_datetime
from pathlib import Path

def load(path: str):
    """policy=default gives correct decoding of encoded-word headers.

    Without it, a Subject like =?utf-8?B?...?= comes back as that literal
    string instead of the text, and both you and the model read gibberish.
    """
    return BytesParser(policy=policy.default).parse(Path(path).open("rb"))

def envelope(msg) -> dict:
    from_name, from_addr = parseaddr(msg["From"] or "")
    _, reply_addr       = parseaddr(msg["Reply-To"] or "")
    _, return_path      = parseaddr(msg["Return-Path"] or "")

    return {
        "subject":      msg["Subject"],
        "from_display": from_name,          # what the human sees
        "from_addr":    from_addr,          # what the machine sees
        "reply_to":     reply_addr or None,
        "return_path":  return_path or None,
        "to":           msg["To"],
        "date":         msg["Date"],
        "message_id":   msg["Message-ID"],
        "hops":         len(msg.get_all("Received") or []),
    }

if __name__ == "__main__":
    from rich import print as rprint
    rprint(envelope(load("samples/suspect.eml")))`,
        },
        {
          lang: "bash",
          code: "python parse.py",
        },
      ],
      expect:
        "<p>A dictionary of facts. Read <code>from_display</code> against <code>from_addr</code> — on a phishing sample they usually disagree, and that disagreement is invisible in a mail client.</p>",
      expectCode: String.raw`{
    'subject': 'Action required: your mailbox will be deactivated',
    'from_display': 'Microsoft 365 Support',
    'from_addr': 'no-reply@m365-account-verify.top',
    'reply_to': 'recovery.desk@mail.ru',
    'return_path': 'bounce-8871@sendgrid.net',
    'to': 'jbell@example.com',
    'date': 'Sat, 1 Aug 2026 02:14:03 -0700',
    'message_id': '<a91f...@m365-account-verify.top>',
    'hops': 4
}`,
      fixes: [
        {
          problem: "UnicodeDecodeError while parsing",
          cause:
            "The message declares one charset and uses another, which is common in spam and occasionally deliberate.",
          fix:
            "You are already opening in binary mode, which handles most of it. If it still raises, the file is truncated — re-export it.",
        },
        {
          problem: "Everything is None",
          cause: "The file is not RFC822 — most likely still a <code>.msg</code>.",
          fix: "Go back to step 1's fix. <code>head -n 5</code> on the file settles it in two seconds.",
        },
      ],
    },
    {
      title: "Read the authentication results — and only trust one of them",
      time: "25 min",
      why: "This is the single most misunderstood part of email analysis, and getting it wrong in the obvious way makes your analyzer trivially spoofable.",
      body:
        "<p><code>Authentication-Results</code> headers are <b>plain text added by mail servers</b>. Anyone who can send you an email can put a beautiful <code>spf=pass dkim=pass dmarc=pass</code> header in it. It is a claim, not a check.</p>" +
        "<p>Exactly one of them is trustworthy: the one added by <b>your own receiving server</b>, which is the <i>topmost</i> one, because each hop prepends its headers. Every header below it was added by a machine you do not control, including possibly the attacker's.</p>" +
        "<p>So the rule is: take the first <code>Authentication-Results</code>, confirm its <code>authserv-id</code> is your mail provider, and ignore the rest. This is the kind of detail that separates someone who has read about email analysis from someone who has done it.</p>" +
        "<p>Then check <b>alignment</b>. SPF and DKIM can pass on a domain the recipient never sees. DMARC is the field that ties authentication back to the visible <code>From:</code>, which is why a <code>dmarc=fail</code> next to <code>spf=pass</code> is a much stronger phishing signal than either alone.</p>",
      commands: [
        {
          lang: "python",
          label: "auth.py",
          code: String.raw`import re
import tldextract

# Set this to YOUR mail provider's authserv-id. Look at the first
# Authentication-Results header in a legitimate email you received;
# the id is the first token, before the semicolon.
TRUSTED_AUTHSERV = "mx.google.com"

def auth_results(msg) -> dict:
    """Parse ONLY the topmost Authentication-Results header.

    Every other one was written by a server upstream of ours, which on a
    phishing sample may well be the attacker's. Reading them all and
    taking the best result is how an analyzer gets spoofed.
    """
    headers = msg.get_all("Authentication-Results") or []
    if not headers:
        return {"present": False, "trusted": False,
                "note": "No Authentication-Results. Pre-2005 mail, an "
                        "internal relay, or stripped in transit."}

    top = " ".join(headers[0].split())
    authserv = top.split(";")[0].strip()

    def method(name: str) -> str | None:
        m = re.search(rf"\b{name}=(\w+)", top)
        return m.group(1).lower() if m else None

    return {
        "present":  True,
        "authserv": authserv,
        "trusted":  authserv.lower().startswith(TRUSTED_AUTHSERV.lower()),
        "spf":      method("spf"),
        "dkim":     method("dkim"),
        "dmarc":    method("dmarc"),
        "dkim_domain": (m.group(1) if (m := re.search(
            r"header\.i=@?([\w.-]+)", top)) else None),
        "ignored_headers": len(headers) - 1,
    }

def alignment(from_addr: str, auth: dict) -> dict:
    """Does the domain that authenticated match the one the human sees?"""
    def reg(d: str | None) -> str | None:
        if not d:
            return None
        e = tldextract.extract(d)
        return f"{e.domain}.{e.suffix}" if e.suffix else None

    visible = reg(from_addr.split("@")[-1]) if "@" in from_addr else None
    signer  = reg(auth.get("dkim_domain"))

    return {
        "visible_domain": visible,
        "dkim_signer":    signer,
        "aligned": bool(visible and signer and visible == signer),
    }`,
        },
        {
          lang: "python",
          label: "Add to parse.py's main block",
          code: String.raw`from auth import auth_results, alignment

msg = load("samples/suspect.eml")
env = envelope(msg)
a   = auth_results(msg)

rprint(a)
rprint(alignment(env["from_addr"], a))`,
        },
      ],
      expect:
        "<p>Something like the block below. Read it carefully: <b>DKIM passed</b>, and the message is still phishing. It passed for <code>sendgrid.net</code>, which is who actually sent it — not for the domain in the <code>From:</code>. That is precisely what <code>aligned: False</code> and <code>dmarc: fail</code> are telling you.</p>",
      expectCode: String.raw`{
    'present': True,
    'authserv': 'mx.google.com',
    'trusted': True,
    'spf': 'pass',
    'dkim': 'pass',
    'dmarc': 'fail',
    'dkim_domain': 'sendgrid.net',
    'ignored_headers': 2
}
{
    'visible_domain': 'm365-account-verify.top',
    'dkim_signer': 'sendgrid.net',
    'aligned': False
}`,
      fixes: [
        {
          problem: "trusted comes back False on a legitimate email",
          cause:
            "<code>TRUSTED_AUTHSERV</code> does not match your provider. It is <code>mx.google.com</code> for Gmail, and typically something ending <code>.outlook.com</code> or <code>.protection.outlook.com</code> for Microsoft 365.",
          fix:
            "Open a known-good email you received, find the first <code>Authentication-Results</code> header, and copy the token before the first semicolon.",
        },
        {
          problem: "spf=pass on something obviously malicious",
          cause:
            "Working as designed, and worth sitting with. SPF authorises a <i>server</i>, not a message. An attacker who registers a domain and publishes an SPF record for their own sending host gets <code>spf=pass</code> every time, honestly.",
          fix:
            "Nothing to fix. This is why alignment and DMARC exist, and why an analyzer that reports “SPF passed, looks fine” is worse than no analyzer.",
        },
        {
          problem: "ignored_headers is 3 or more",
          cause:
            "Several servers each added their own verdict. Sometimes routine (a security gateway in front of your mailbox), sometimes an attempt to plant a favourable one.",
          fix:
            "Leave the code as is — ignoring them is correct. Do print them once and read them, because seeing a forged <code>spf=pass</code> in a lower header is the moment this step stops being theoretical.",
        },
      ],
    },
    {
      title: "Trace the delivery chain",
      time: "15 min",
      why: "The Received chain is the closest thing an email has to a routing history. It is also partly attacker-controlled, and knowing which part is which is the skill.",
      body:
        "<p>Each server prepends a <code>Received</code> header, so the list reads <b>newest first</b>. Everything from your own boundary inwards is trustworthy; everything before the first server you control is whatever the sender wrote.</p>" +
        "<p>What you are looking for: where the message actually entered your infrastructure, whether the originating IP has anything to do with the claimed sender, and unexplained gaps in time between hops.</p>",
      commands: [
        {
          lang: "python",
          label: "hops.py",
          code: String.raw`import re
from email.utils import parsedate_to_datetime

IP_RE = re.compile(r"\[?(\d{1,3}(?:\.\d{1,3}){3})\]?")

def hops(msg) -> list[dict]:
    """Delivery chain, oldest first, with the time delta between hops."""
    raw = list(reversed(msg.get_all("Received") or []))
    out = []

    for i, h in enumerate(raw):
        flat = " ".join(h.split())
        ips  = IP_RE.findall(flat)

        ts = None
        if ";" in flat:
            try:
                ts = parsedate_to_datetime(flat.rsplit(";", 1)[1].strip())
            except (ValueError, TypeError):
                pass   # malformed dates are common and not worth crashing on

        out.append({
            "n": i,
            "from": (m.group(1) if (m := re.search(r"\bfrom\s+(\S+)", flat)) else None),
            "by":   (m.group(1) if (m := re.search(r"\bby\s+(\S+)", flat)) else None),
            "ip":   ips[0] if ips else None,
            "ts":   ts.isoformat() if ts else None,
        })

    # Gaps between hops. A multi-hour pause mid-chain is worth a look.
    for prev, cur in zip(out, out[1:]):
        if prev["ts"] and cur["ts"]:
            delta = (parsedate_to_datetime(cur["ts"])
                     - parsedate_to_datetime(prev["ts"])).total_seconds()
            cur["seconds_since_previous"] = int(delta)

    return out`,
        },
      ],
      expect:
        "<p>A chain reading oldest to newest. Hop 0 is where the message claims to have originated — treat it as a claim. The hop where <code>by</code> becomes your own mail provider is where the trustworthy part starts.</p>",
      expectCode: String.raw`[
  {'n': 0, 'from': 'localhost',      'by': 'wrqvsmtp02.hostinger.io',
   'ip': '10.0.4.11',        'ts': '2026-08-01T02:13:41-07:00'},
  {'n': 1, 'from': 'o1.sg.sendgrid.net', 'by': 'mx.sendgrid.net',
   'ip': '167.89.115.42',    'ts': '2026-08-01T02:13:52-07:00',
   'seconds_since_previous': 11},
  {'n': 2, 'from': 'mail-sor-f41.google.com', 'by': 'mx.google.com',
   'ip': '209.85.220.41',    'ts': '2026-08-01T02:14:07-07:00',
   'seconds_since_previous': 15}
]`,
      fixes: [
        {
          problem: "Most fields come back None",
          cause:
            "Received headers have no enforced format beyond a loose grammar. Different MTAs write them very differently and some are barely parseable.",
          fix:
            "Expected, and not a bug worth chasing. You are extracting hints, not building a parser. Keep the raw header text in the bundle so the model — and you — can read what the regex missed.",
        },
      ],
    },
    {
      title: "Extract URLs and attachments — without touching either",
      time: "25 min",
      why: "This is where an analysis tool most easily becomes the delivery mechanism. Nothing here resolves a hostname, fetches a URL, or opens an attachment.",
      body:
        "<p>Three rules, and they are not negotiable.</p>" +
        "<ul><li><b>Defang every URL before it goes anywhere.</b> Not just for display — a defanged string cannot be accidentally fetched by something downstream, including a browser preview in your own notebook.</li>" +
        "<li><b>Hash attachments, never execute them.</b> The SHA-256 is what you take to VirusTotal. The file stays where it is.</li>" +
        "<li><b>Look for the display-vs-target mismatch.</b> In HTML mail, the visible link text and the <code>href</code> are independent, and a link reading <code>https://login.microsoft.com</code> pointing somewhere else is the oldest trick there is and still works.</li></ul>",
      commands: [
        {
          lang: "python",
          label: "artifacts.py",
          code: String.raw`import hashlib, re
from html.parser import HTMLParser
import tldextract

def defang(u: str) -> str:
    """Make a URL inert. Do this before it touches anything else."""
    return (u.replace("http://", "hxxp://")
             .replace("https://", "hxxps://")
             .replace(".", "[.]"))

class LinkGrabber(HTMLParser):
    """Collect href plus the text shown for it — the mismatch is the signal."""
    def __init__(self):
        super().__init__()
        self.links, self._href, self._text = [], None, []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._href = dict(attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href:
            self.links.append((self._href, "".join(self._text).strip()))
            self._href, self._text = None, []

def urls(msg) -> list[dict]:
    out, seen = [], set()

    for part in msg.walk():
        ctype = part.get_content_type()
        if ctype not in ("text/plain", "text/html"):
            continue
        try:
            body = part.get_content()
        except (LookupError, UnicodeDecodeError):
            continue

        pairs = []
        if ctype == "text/html":
            g = LinkGrabber()
            g.feed(body)
            pairs = g.links
        pairs += [(u, None) for u in
                  re.findall(r"https?://[^\s<>\"')]+", body)]

        for href, text in pairs:
            if not href.lower().startswith(("http://", "https://")):
                continue
            if href in seen:
                continue
            seen.add(href)

            host = re.sub(r"^https?://", "", href).split("/")[0].split(":")[0]
            e = tldextract.extract(host)

            # Does the visible text claim a different domain to the target?
            mismatch = False
            if text and (m := re.search(r"([\w-]+\.)+[a-z]{2,}", text, re.I)):
                shown = tldextract.extract(m.group(0))
                mismatch = bool(shown.suffix) and (
                    f"{shown.domain}.{shown.suffix}" != f"{e.domain}.{e.suffix}")

            out.append({
                "url_defanged": defang(href),
                "host": host,
                "registered_domain": f"{e.domain}.{e.suffix}" if e.suffix else host,
                "display_text": (text or "")[:80] or None,
                "display_mismatch": mismatch,
                "in_part": ctype,
            })
    return out

def attachments(msg) -> list[dict]:
    out = []
    for part in msg.iter_attachments():
        payload = part.get_payload(decode=True) or b""
        name = part.get_filename() or "(unnamed)"
        out.append({
            "filename": name,
            "content_type": part.get_content_type(),
            "bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest(),
            # Double extensions and the RTLO character both hide the real type.
            # U+202E reverses the display order, so "...fdp.exe" renders as
            # "...exe.pdf" and the user sees a PDF.
            "double_extension": len(re.findall(r"\.[A-Za-z0-9]{2,4}(?=\.|$)", name)) > 1,
            "rtlo": chr(0x202E) in name,
        })
    return out`,
        },
      ],
      expect:
        "<p>Defanged URLs with their registered domain, and attachments reduced to a name, type, size and hash. Note that the hash is computed from the decoded bytes in memory — the attachment is never written to disk.</p>",
      expectCode: String.raw`URLS
  hxxps://m365-account-verify[.]top/auth/session?id=8f2a
      display_text: 'https://login.microsoftonline.com/'
      display_mismatch: True          <-- the whole email in one field
  hxxps://sendgrid[.]net/wf/open?upn=...
      display_text: None

ATTACHMENTS
  Invoice_08471.pdf.htm  text/html  14210 bytes
      sha256: 9f2c4e...a71b
      double_extension: True`,
      fixes: [
        {
          problem: "No URLs found in an email that clearly has links",
          cause:
            "The body is base64-encoded and a decode step failed silently, or the links are inside an attached HTML file rather than the body.",
          fix:
            "Print <code>part.get_content_type()</code> for every part in <code>msg.walk()</code>. If there is a <code>text/html</code> part you are skipping, the exception handler is swallowing it — remove the try/except temporarily and read the error.",
        },
        {
          problem: "display_mismatch is True on legitimate marketing email",
          cause:
            "Genuine, and a useful false positive to meet. Every mailing list rewrites links through a click-tracking domain, so the text says <code>bbc.co.uk</code> and the href points at <code>list-manage.com</code>.",
          fix:
            "Do not special-case it away. Keep the signal and let step 7's context handle it — this is exactly the sort of thing a model interpreting the whole picture handles better than a rule. Step 9 tests whether it does.",
        },
      ],
    },
    {
      title: "Build the evidence bundle",
      time: "15 min",
      why: "Module 08 in practice. A raw phishing email with an HTML body runs 5,000–40,000 tokens, most of it inline CSS. The bundle below is about 400 and contains strictly more decision-relevant information.",
      body:
        "<p>Assemble the four extractors into one dictionary. Cap the list lengths — a spam email with 200 tracking URLs should not be able to push the important evidence out of the context window, and that is a real attack, not a hypothetical one.</p>",
      commands: [
        {
          lang: "python",
          label: "bundle.py",
          code: String.raw`import json
from parse import load, envelope
from auth import auth_results, alignment
from hops import hops
from artifacts import urls, attachments

MAX_URLS = 15

def bundle(path: str) -> dict:
    msg = load(path)
    env = envelope(msg)
    a   = auth_results(msg)
    u   = urls(msg)

    # Mismatched links first, so truncation never drops the interesting ones
    u.sort(key=lambda x: (not x["display_mismatch"], x["host"]))

    return {
        "envelope":    env,
        "auth":        a,
        "alignment":   alignment(env["from_addr"], a),
        "chain":       hops(msg)[:6],
        "urls":        u[:MAX_URLS],
        "urls_total":  len(u),
        "urls_truncated": max(0, len(u) - MAX_URLS),
        "attachments": attachments(msg),
    }

if __name__ == "__main__":
    import sys, tiktoken
    b = bundle(sys.argv[1])
    print(json.dumps(b, indent=2, default=str))

    enc = tiktoken.get_encoding("cl100k_base")
    raw = open(sys.argv[1], "rb").read().decode("utf-8", "replace")
    print(f"\nraw email  {len(enc.encode(raw)):>6} tokens")
    print(f"bundle     {len(enc.encode(json.dumps(b, default=str))):>6} tokens")`,
        },
        {
          lang: "bash",
          code: "pip install tiktoken\npython bundle.py samples/suspect.eml",
        },
      ],
      expect:
        "<p>The bundle, then the two token counts. Write the ratio down — it is the concrete version of module 08's argument, measured on your own data rather than taken on trust.</p>",
      expectCode: String.raw`raw email   18442 tokens
bundle        387 tokens`,
      fixes: [
        {
          problem: "urls_truncated is large",
          cause: "Bulk mail, usually. Tracking pixels and unsubscribe links add up fast.",
          fix:
            "The sort already protects the important ones. Do keep <code>urls_total</code> in the bundle — the model should know 200 links existed even when it only sees 15, and hiding that is how you get a confidently wrong verdict.",
        },
      ],
    },
    {
      title: "Let the model interpret — and only interpret",
      time: "20 min",
      why: "Everything up to here established facts. The model's job is to explain what they mean together, which is genuinely the thing it is good at and the thing a rule engine is bad at.",
      body:
        "<p>Same shape as project 01: a schema, temperature 0, and citations that must appear in the input. One addition — the prompt states explicitly that the authentication results are <b>already determined</b> and must not be re-evaluated. Without that line, models will happily narrate their own reading of SPF and contradict the parsed field.</p>" +
        "<p>Notice the <code>social_engineering</code> field. That is the part with no deterministic equivalent: urgency, authority, fear of account loss. A regex cannot score it and a model reads it well.</p>",
      commands: [
        {
          lang: "python",
          label: "analyze.py — schema",
          code: String.raw`from typing import Literal
from pydantic import BaseModel, Field

class Evidence(BaseModel):
    claim: str
    source_field: str = Field(
        description="Dotted path into the bundle, e.g. auth.dmarc")
    source_value: str = Field(
        description="The value at that path, copied EXACTLY")

class PhishVerdict(BaseModel):
    verdict: Literal["benign", "suspicious", "phishing", "insufficient_evidence"]
    confidence: float = Field(ge=0.0, le=1.0)
    primary_technique: str | None = Field(
        default=None,
        description="e.g. credential harvesting, BEC, malware delivery")
    evidence: list[Evidence]
    social_engineering: list[str] = Field(
        default_factory=list,
        description="Manipulation tactics in the subject or body")
    recommended_next_steps: list[str]
    unsupported_observations: list[str] = Field(default_factory=list)`,
        },
        {
          lang: "python",
          label: "analyze.py — the call",
          code: String.raw`import json, ollama
from bundle import bundle

MODEL = "llama3.1:8b"

SYSTEM = """You are a phishing analyst. You are given a structured evidence
bundle extracted from an email by deterministic code. You interpret it.
You do not re-derive it.

The fields under "auth" were produced by the receiving mail server and
parsed by code. Treat them as facts. Never state that SPF or DKIM passed
or failed differently from what those fields say.

"alignment.aligned" is the important one. SPF and DKIM can both pass on a
domain the recipient never sees; unaligned authentication with dmarc=fail
is a strong phishing indicator on its own.

For every item in "evidence", the field "source_field" must be a real path
into the bundle and "source_value" must be that value copied exactly.

If the bundle does not support a claim, put it in
"unsupported_observations". If fewer than two claims can be evidenced,
return "insufficient_evidence".

You MUST NOT recommend visiting any URL, opening any attachment, or
replying to the sender."""

def analyze(path: str) -> PhishVerdict:
    b = bundle(path)
    resp = ollama.chat(
        model=MODEL,
        format=PhishVerdict.model_json_schema(),
        options={"temperature": 0},
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user",
             "content": "EVIDENCE BUNDLE:\n" + json.dumps(b, indent=2, default=str)},
        ],
    )
    return PhishVerdict.model_validate_json(resp["message"]["content"])`,
        },
        {
          lang: "python",
          label: "analyze.py — the grounding validator, adapted from project 01",
          code: String.raw`class GroundingError(Exception):
    pass

def resolve(bundle_dict: dict, path: str):
    """Walk a dotted path like 'auth.dmarc' or 'urls.0.host'."""
    cur = bundle_dict
    for part in path.split("."):
        if isinstance(cur, list):
            if not part.isdigit() or int(part) >= len(cur):
                raise KeyError(path)
            cur = cur[int(part)]
        elif isinstance(cur, dict):
            if part not in cur:
                raise KeyError(path)
            cur = cur[part]
        else:
            raise KeyError(path)
    return cur

def assert_grounded(v: PhishVerdict, b: dict) -> None:
    for i, ev in enumerate(v.evidence):
        try:
            actual = resolve(b, ev.source_field)
        except KeyError:
            raise GroundingError(
                f"evidence[{i}]: field '{ev.source_field}' does not exist in "
                f"the bundle. The model invented a path. Reject.")

        if str(actual).strip().lower() != ev.source_value.strip().lower():
            raise GroundingError(
                f"evidence[{i}]: '{ev.source_field}' is {actual!r}, "
                f"model claimed {ev.source_value!r}. Reject.")`,
        },
      ],
      expect:
        "<p>A verdict whose every claim points at a field you can check yourself. Run the validator — on a bundle this structured, a fabricated path is the failure you will see rather than a paraphrased quote.</p>",
      expectCode: String.raw`{
  "verdict": "phishing",
  "confidence": 0.92,
  "primary_technique": "credential harvesting",
  "evidence": [
    {
      "claim": "DMARC failed, so authentication does not cover the visible sender",
      "source_field": "auth.dmarc",
      "source_value": "fail"
    },
    {
      "claim": "The signing domain is unrelated to the From: domain",
      "source_field": "alignment.aligned",
      "source_value": "False"
    },
    {
      "claim": "A link displays a Microsoft address but points elsewhere",
      "source_field": "urls.0.display_mismatch",
      "source_value": "True"
    }
  ],
  "social_engineering": [
    "Deadline pressure - 'will be deactivated'",
    "Impersonation of an IT authority the recipient is expected to obey"
  ],
  "recommended_next_steps": [
    "Submit the SHA-256 of the attachment to VirusTotal",
    "Search mail logs for other recipients of the same Message-ID pattern",
    "Check whether any recipient authenticated to the linked host"
  ],
  "unsupported_observations": [
    "The .top TLD is disproportionately abused, but that is prior knowledge
     rather than evidence from this message"
  ]
}`,
      fixes: [
        {
          problem: "The model contradicts the parsed auth fields",
          cause:
            "It has strong priors about what these headers usually look like and is overriding the input with them. Exactly the behaviour module 02 described.",
          fix:
            "Move the “treat them as facts” paragraph to the <b>end</b> of the system prompt and phrase it as a prohibition. If it still happens, that is a real finding about your model — write it down, and consider a larger one for this step.",
        },
        {
          problem: "GroundingError on source_field 'auth.spf_result'",
          cause: "The model invented a plausible field name. The key is <code>spf</code>.",
          fix:
            "The validator did its job. Add the actual key list to the prompt — the same schema-grounding fix as module 10, applied to a bundle instead of a SIEM table.",
        },
        {
          problem: "It recommends visiting the URL to check",
          cause: "A reasonable-sounding suggestion the prohibition should have caught.",
          fix:
            "Strengthen the last paragraph, and add a hard check in code: reject any <code>recommended_next_steps</code> entry matching <code>/visit|browse|open the link|click/i</code>. Prompts express intent; code enforces it.",
        },
      ],
    },
    {
      title: "Produce the analyst report",
      time: "15 min",
      why: "A JSON verdict is for machines. The deliverable in an actual SOC is a ticket someone else can act on without re-doing your work.",
      body:
        "<p>Render the validated verdict into Markdown. Note that the report is built from the <b>bundle</b> and the <b>validated</b> verdict — not from a second model call asking it to write a report. A second call would be a second opportunity to invent, and there is nothing here a template cannot do.</p>",
      commands: [
        {
          lang: "python",
          label: "report.py",
          code:
            "from datetime import datetime, timezone\n" +
            "\n" +
            "# The report is Markdown, so backticks are code spans in the output.\n" +
            "CODE = chr(96)\n" +
            "\n" +
            "def report(b: dict, v, model: str) -> str:\n" +
            "    env, auth = b[\"envelope\"], b[\"auth\"]\n" +
            "    L = []\n" +
            "    L.append(f\"# Phishing analysis - {env['subject']!r}\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(f\"**Verdict:** {v.verdict.upper()}  |  \"\n" +
            "             f\"**Confidence:** {v.confidence:.0%}  |  \"\n" +
            "             f\"**Technique:** {v.primary_technique or 'n/a'}\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(\"## Sender\")\n" +
            "    L.append(f\"- Displayed as: {CODE}{env['from_display']}{CODE}\")\n" +
            "    L.append(f\"- Actual address: {CODE}{env['from_addr']}{CODE}\")\n" +
            "    if env[\"reply_to\"] and env[\"reply_to\"] != env[\"from_addr\"]:\n" +
            "        L.append(f\"- **Reply-To differs:** {CODE}{env['reply_to']}{CODE}\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(\"## Authentication\")\n" +
            "    L.append(\"| SPF | DKIM | DMARC | Aligned |\")\n" +
            "    L.append(\"|---|---|---|---|\")\n" +
            "    L.append(f\"| {auth.get('spf')} | {auth.get('dkim')} | \"\n" +
            "             f\"{auth.get('dmarc')} | {b['alignment']['aligned']} |\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(f\"_As reported by {CODE}{auth.get('authserv')}{CODE}. \"\n" +
            "             f\"{auth.get('ignored_headers', 0)} upstream header(s) ignored._\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(\"## Evidence\")\n" +
            "    for e in v.evidence:\n" +
            "        L.append(f\"- {e.claim}  \\n  \"\n" +
            "                 f\"{CODE}{e.source_field}{CODE} = {CODE}{e.source_value}{CODE}\")\n" +
            "    if v.social_engineering:\n" +
            "        L.append(\"\")\n" +
            "        L.append(\"## Social engineering\")\n" +
            "        for s in v.social_engineering:\n" +
            "            L.append(f\"- {s}\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(\"## Indicators (defanged)\")\n" +
            "    for u in b[\"urls\"]:\n" +
            "        flag = \"  **[displayed domain differs]**\" if u[\"display_mismatch\"] else \"\"\n" +
            "        L.append(f\"- {CODE}{u['url_defanged']}{CODE}{flag}\")\n" +
            "    for a in b[\"attachments\"]:\n" +
            "        L.append(f\"- {CODE}{a['filename']}{CODE} ({a['bytes']} bytes) \"\n" +
            "                 f\"sha256 {CODE}{a['sha256']}{CODE}\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(\"## Next steps\")\n" +
            "    for s in v.recommended_next_steps:\n" +
            "        L.append(f\"- [ ] {s}\")\n" +
            "    if v.unsupported_observations:\n" +
            "        L.append(\"\")\n" +
            "        L.append(\"## Noted, not evidenced\")\n" +
            "        for o in v.unsupported_observations:\n" +
            "            L.append(f\"- {o}\")\n" +
            "    L.append(\"\")\n" +
            "    L.append(\"---\")\n" +
            "    L.append(f\"_AI-assisted. Model {CODE}{model}{CODE}, temperature 0. \"\n" +
            "             f\"Generated {datetime.now(timezone.utc).isoformat(timespec='seconds')}. \"\n" +
            "             f\"Every claim above cites a parsed field and was validated against it. \"\n" +
            "             f\"Requires analyst review before action._\")\n" +
            "    return \"\\n\".join(L)",
        },
      ],
      expect:
        "<p>A Markdown report you could paste into a ticket. The footer is not decoration — it is module 05's audit trail: which model, what settings, when, and an explicit statement that a human still owns the decision.</p>",
    },
    {
      title: "Run it against a legitimate email — the step people skip",
      time: "20 min",
      why: "Anything can find phishing in phishing. The number that decides whether this is usable is how often it cries wolf on the ordinary mail that makes up 99% of a mailbox.",
      body:
        "<p>Run the analyzer over a handful of genuine emails — a receipt, a newsletter, an internal message, and specifically <b>one marketing email with click tracking</b>, because that is the hardest legitimate case and it will trip your <code>display_mismatch</code> signal.</p>" +
        "<p>Then do the arithmetic from module 03. If one in ten legitimate emails comes back <code>suspicious</code>, and a mailbox receives 60 emails a day, that is six false alarms daily from one mailbox. Multiply by the organisation. That is not a tool anyone will keep using.</p>",
      commands: [
        {
          lang: "python",
          label: "fp_check.py",
          code: String.raw`from pathlib import Path
from collections import Counter
from analyze import analyze, assert_grounded, GroundingError
from bundle import bundle

counts, rejected = Counter(), 0

for f in sorted(Path("samples/legit").glob("*.eml")):
    b = bundle(str(f))
    try:
        v = analyze(str(f))
        assert_grounded(v, b)
        counts[v.verdict] += 1
        if v.verdict in ("phishing", "suspicious"):
            print(f"\nFALSE POSITIVE: {f.name}")
            print(f"  {v.verdict} @ {v.confidence:.0%} - {v.primary_technique}")
            for e in v.evidence:
                print(f"    {e.source_field} = {e.source_value}")
    except GroundingError as e:
        rejected += 1
        print(f"\nREJECTED (ungrounded): {f.name}\n  {e}")

total = sum(counts.values()) + rejected
fp = counts["phishing"] + counts["suspicious"]
print(f"\n{'-'*50}")
print(f"legitimate emails tested : {total}")
print(f"flagged                  : {fp}  ({fp/total:.0%})")
print(f"rejected by validator    : {rejected}")
print(f"breakdown                : {dict(counts)}")`,
        },
      ],
      expect:
        "<p>Ideally everything comes back <code>benign</code>. Realistically the marketing email gets flagged. Read <i>why</i> — the evidence paths tell you exactly which signal misfired, and that is a far more useful output than the count.</p>",
      expectCode: String.raw`FALSE POSITIVE: newsletter-guardian.eml
  suspicious @ 71% - credential harvesting
    urls.0.display_mismatch = True
    envelope.reply_to = noreply@e.theguardian.com

--------------------------------------------------
legitimate emails tested : 12
flagged                  : 1  (8%)
rejected by validator    : 0
breakdown                : {'benign': 11, 'suspicious': 1}`,
      fixes: [
        {
          problem: "Click-tracked marketing mail flags every time",
          cause:
            "Structurally identical to phishing: displayed domain differs from href, sender domain differs from signing domain. The difference is intent, and intent is not in the headers.",
          fix:
            "Give the model the missing context rather than special-casing the signal away. Add <code>dmarc</code> alignment prominence to the prompt — legitimate bulk senders are almost always DMARC-aligned via the tracking domain, phishers are not. Re-run and compare the two numbers.",
        },
        {
          problem: "Everything comes back benign, including the phishing sample",
          cause: "The prompt or the model is over-cautious, which is a real failure and not a safe one.",
          fix:
            "Check the bundle first — if <code>auth.present</code> is False the strongest signals are simply absent, which happens with internal or relayed mail. If the bundle is good and the verdict is still wrong, this is the calibration problem module 09 describes, and project 10 is where you measure it properly.",
        },
      ],
    },
  ],
  after: [
    "Keep the false-positive rate you measured in step 9 written down with the date and the model tag. It is the baseline every later change is compared against, and you will not remember it in a month.",
    "Point the analyzer at the SpamAssassin corpus and run a few hundred messages. The authentication step will be blank throughout — expected, and a good demonstration of how much of email security is post-2005 infrastructure.",
    "Add VirusTotal lookups on the attachment hashes. That is the first external call in this path; put it behind an explicit flag, because until now nothing left the machine.",
    "Project 07 reuses this bundle-then-interpret shape for sandbox reports. The structure transfers exactly.",
  ],
  enterprise: [
    {
      platform: "Microsoft Defender for Office 365",
      body:
        "<p>Threat Explorer already does the extraction — headers, URL detonation, attachment sandboxing — and Security Copilot summarises the result. You lose the ability to see the parsing, which is a genuine trade: you gain URL detonation you could not safely build yourself, and lose the visibility into <i>why</i> a verdict landed. The analyst skill it demands is different — reading someone else's determination critically rather than making your own.</p>",
    },
    {
      platform: "Proofpoint TAP / Mimecast",
      body:
        "<p>Both do the mechanical work upstream of the mailbox and expose it via API. The pattern that transfers directly: pull their structured verdict rather than the raw email, and treat their output as this project's bundle. Your value-add moves from extraction to correlation across messages — the same shift project 03 makes for logs.</p>",
    },
    {
      platform: "Any SOAR (Splunk SOAR, Cortex XSOAR, Tines)",
      body:
        "<p>This project is a phishing playbook, written by hand. The commercial versions are configuration over the same steps: parse, enrich, decide, report. Having built it manually means you can read a vendor playbook and see what it is actually doing — and, more usefully, spot the step it skipped.</p>",
    },
  ],
  cloudApi:
    "<p>Tempting here, because interpretation is the hardest step and hosted models do it better. But an email is the single worst thing to paste into a hosted API without thinking: it contains the recipient's address, often the sender's real identity, frequently an account number or an invoice, and sometimes the credentials someone already typed into a reply. <b>Module 05 is not optional for this project.</b></p><p>If you do use a hosted model, run Presidio over the bundle first and redact addresses and names to placeholders — the analysis works fine on <code>&lt;RECIPIENT&gt;</code> and <code>&lt;ORG_DOMAIN&gt;</code>, because the signal is in the structure, not the identities. Being able to say that in an interview is worth more than the accuracy you gained.</p>",
};
