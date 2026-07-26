/**
 * Long-form, follow-along guides for the SOC-prep projects.
 *
 * These assume near-zero prior knowledge — the reader may never have opened a
 * terminal. See src/lib/guides/types.ts for the rules the content follows.
 *
 * Slugs are permanent: they are the public URL (/soc-prep/projects/<slug>).
 */
import type { ProjectGuide } from "@/lib/guides/types";
import { g02, g03, g04 } from "./guides-l1";
import { g05, g06, g07, g08 } from "./guides-l2";
import { g09, g10, g11, g12 } from "./guides-l3";

/* -------------------------------------------------------------------------- */
/* 01 — Build your own home SOC lab                                            */
/* -------------------------------------------------------------------------- */

const g01: ProjectGuide = {
  slug: "home-soc-lab",
  projectId: 1,
  intro:
    "<p>A SOC (Security Operations Centre) is a team that watches computers for signs of attack. To watch anything, you need two things: a machine that <b>generates</b> activity, and a machine that <b>collects and searches</b> that activity. That is all you are building here.</p><p>You will run two virtual machines on your own laptop — a Windows one that acts as the &ldquo;company computer&rdquo;, and a Linux one running <b>Splunk</b>, the software that stores and searches the logs. Then you will connect them, so that anything happening on Windows shows up as a searchable record in Splunk.</p><p>Everything you build in the other eleven projects runs on top of this lab. Do this one first.</p>",
  glossary: [
    {
      term: "Virtual machine (VM)",
      plain:
        "A whole computer that runs as a program inside your real computer. It has its own operating system, its own disk, its own network. If you break it, your real laptop is unaffected — you just delete it and make a new one.",
    },
    {
      term: "Hypervisor",
      plain:
        "The program that runs virtual machines. VirtualBox is a free one; that is what this guide uses.",
    },
    {
      term: "Log",
      plain:
        "A line of text a computer writes down when something happens — a user logged in, a program started, a file was deleted. Security work is almost entirely about reading these.",
    },
    {
      term: "SIEM",
      plain:
        "Security Information and Event Management. Software that collects logs from many machines into one place so you can search them all at once. Splunk is a SIEM. So are Elastic, Sentinel, and QRadar.",
    },
    {
      term: "Forwarder",
      plain:
        "A small program installed on a machine whose job is to send that machine's logs to the SIEM. Splunk's is called the Universal Forwarder.",
    },
    {
      term: "Host-only network",
      plain:
        "A private network that only your virtual machines can see. They can talk to each other and to your laptop, but not to the internet. This is what keeps a lab safe.",
    },
  ],
  before: [
    "A laptop or desktop with <b>at least 16 GB of RAM</b>. 8 GB will technically work but both VMs will be painfully slow.",
    "<b>60 GB of free disk space.</b> Check this now — running out halfway through an install corrupts the VM and you start over.",
    "A 64-bit processor with virtualisation enabled in BIOS/UEFI. Most machines from the last decade have this on by default; step 1 tells you how to check.",
    "A stable internet connection for the downloads (roughly 6 GB in total).",
    "About 6 hours. You do not have to do it in one sitting — VMs can be paused and resumed.",
  ],
  steps: [
    {
      title: "Check your computer can run virtual machines",
      time: "5 min",
      why: "Virtualisation is a CPU feature that is sometimes switched off in firmware. Finding out now takes two minutes; finding out after a 3 GB download does not.",
      body: "<p>Open a terminal and run the command for your operating system. On Windows, press the <b>Windows key</b>, type <code>cmd</code>, and press Enter — that black window is the terminal.</p>",
      commands: [
        {
          lang: "cmd",
          where: "Windows",
          label: "Check virtualisation support",
          code: "systeminfo | findstr /C:\"Hyper-V\"",
        },
        {
          lang: "bash",
          where: "macOS / Linux",
          label: "Check virtualisation support",
          code: "# macOS\nsysctl -a | grep -o VMX\n\n# Linux\ngrep -Eoc '(vmx|svm)' /proc/cpuinfo",
        },
      ],
      expect:
        "<p>On Windows you want <b>&ldquo;A hypervisor has been detected&rdquo;</b> or all four Hyper-V requirements saying <b>Yes</b>. On macOS you want the word <code>VMX</code> to appear. On Linux you want a number greater than 0.</p>",
      expectCode:
        "Hyper-V Requirements:  VM Monitor Mode Extensions: Yes\n                       Virtualization Enabled In Firmware: Yes\n                       Second Level Address Translation: Yes\n                       Data Execution Prevention Available: Yes",
      fixes: [
        {
          problem: "\"Virtualization Enabled In Firmware: No\"",
          cause:
            "The CPU supports it but your BIOS/UEFI has it turned off. Very common on prebuilt PCs and laptops.",
          fix: "Restart, and as the machine boots press the setup key (usually <code>F2</code>, <code>F10</code>, <code>Del</code>, or <code>Esc</code> — the boot screen says which). Find a setting called <b>Intel VT-x</b>, <b>AMD-V</b>, <b>SVM Mode</b>, or <b>Virtualization Technology</b> and enable it. Save and exit.",
        },
        {
          problem: "The command prints nothing at all",
          cause: "You typed it into PowerShell rather than Command Prompt, where <code>findstr</code> behaves differently.",
          fix: "Use <code>systeminfo | Select-String Hyper-V</code> in PowerShell, or open Command Prompt (<code>cmd</code>) and run the original.",
        },
      ],
    },
    {
      title: "Install VirtualBox",
      time: "10 min",
      why: "VirtualBox is the program that will run both of your virtual machines. It is free and works the same on Windows, macOS, and Linux.",
      body: "<p>Go to <a href=\"https://www.virtualbox.org/wiki/Downloads\" target=\"_blank\" rel=\"noopener noreferrer\">virtualbox.org/wiki/Downloads</a> and download the package for your operating system. Run the installer and accept every default — you do not need to change anything.</p><p>During installation your network will briefly disconnect. That is expected: VirtualBox is installing a virtual network adapter.</p><p>Also download the <b>VirtualBox Extension Pack</b> from the same page. Once VirtualBox is installed, double-click the downloaded <code>.vbox-extpack</code> file and it installs itself.</p>",
      expect:
        "<p>VirtualBox opens and shows an empty machine list with a <b>New</b> button in the toolbar. Check <b>File → Tools → Extension Pack Manager</b> and you should see one entry listed.</p>",
      fixes: [
        {
          problem: "Windows: \"This app can't run on your PC\"",
          cause: "You downloaded the macOS or Linux build.",
          fix: "Download the file under <b>Windows hosts</b> specifically.",
        },
        {
          problem: "macOS: \"System Extension Blocked\"",
          cause:
            "macOS blocks kernel extensions from new developers until you approve them.",
          fix: "Go to <b>System Settings → Privacy &amp; Security</b>, scroll to the bottom, and click <b>Allow</b> next to the Oracle message. Then reinstall VirtualBox.",
        },
      ],
    },
    {
      title: "Download the two operating system images",
      time: "30 min (mostly waiting)",
      why: "An ISO is a disk image — the equivalent of an installation DVD as a single file. You need one for each VM.",
      body: "<p>Start both downloads now and continue reading; they are large and will take a while.</p><p><b>Ubuntu Server 22.04 LTS</b> — this will run Splunk. Get it from <a href=\"https://ubuntu.com/download/server\" target=\"_blank\" rel=\"noopener noreferrer\">ubuntu.com/download/server</a> (about 2 GB). Use Server, not Desktop: it has no graphical interface, which means it needs far less memory.</p><p><b>Windows 10/11 Enterprise Evaluation</b> — this is your victim machine. Get it from <a href=\"https://www.microsoft.com/en-us/evalcenter/evaluate-windows-11-enterprise\" target=\"_blank\" rel=\"noopener noreferrer\">Microsoft's Evaluation Center</a> (about 5 GB). It is a free 90-day trial and needs no licence key.</p><p>When each download finishes, verify it arrived intact:</p>",
      commands: [
        {
          lang: "bash",
          label: "Verify the download (compare against the checksum on the download page)",
          code: "# macOS / Linux\nsha256sum ubuntu-22.04.4-live-server-amd64.iso\n\n# Windows PowerShell\nGet-FileHash .\\ubuntu-22.04.4-live-server-amd64.iso -Algorithm SHA256",
        },
      ],
      expect:
        "<p>A long string of letters and numbers that matches the one published on the download page. If it matches, the file is complete and untampered.</p>",
      expectCode:
        "45f873de9f8cb637345d6e66a583762730bbea30277ef7b32c9c3bd6700a32b2  ubuntu-22.04.4-live-server-amd64.iso",
      fixes: [
        {
          problem: "The hash does not match",
          cause:
            "The download was interrupted or corrupted. This is common on flaky connections.",
          fix: "Delete the file and download it again. Do not try to install from a file whose hash is wrong — you will get strange errors much later and never connect them to this.",
        },
      ],
    },
    {
      title: "Create the private lab network",
      time: "5 min",
      why: "This is the single most important safety step in the whole project. Your lab will contain deliberately weak passwords and later, real malware samples. A host-only network means nothing in the lab can reach the internet — or your home network.",
      warn: "Do not skip this. A lab VM on your normal network is a lab VM your neighbours can reach.",
      body: "<p>In VirtualBox, open <b>File → Tools → Network Manager</b>. Click <b>Create</b> to add a host-only network. It will be named something like <code>vboxnet0</code> (macOS/Linux) or <code>VirtualBox Host-Only Ethernet Adapter</code> (Windows).</p><p>Select it and confirm these settings on the <b>Adapter</b> tab:</p><ul><li>IPv4 Address: <code>192.168.56.1</code></li><li>IPv4 Network Mask: <code>255.255.255.0</code></li></ul><p>On the <b>DHCP Server</b> tab, <b>untick</b> Enable Server. You will assign addresses by hand so you always know which machine is which — that matters a lot when you are reading logs.</p>",
      expect:
        "<p>One network listed in the Network Manager, with address <code>192.168.56.1</code> and DHCP disabled.</p>",
      fixes: [
        {
          problem: "Windows: \"Could not create host-only network interface\"",
          cause: "VirtualBox needs administrator rights to create a network adapter.",
          fix: "Close VirtualBox, right-click its icon, choose <b>Run as administrator</b>, and try again.",
        },
      ],
    },
    {
      title: "Create the Splunk virtual machine",
      time: "20 min",
      body: "<p>In VirtualBox click <b>New</b> and fill in:</p><ul><li><b>Name:</b> <code>soc-splunk</code></li><li><b>Type:</b> Linux &nbsp;·&nbsp; <b>Version:</b> Ubuntu (64-bit)</li><li><b>Memory:</b> <code>4096</code> MB (Splunk will not start reliably with less)</li><li><b>Hard disk:</b> Create a virtual hard disk now, <b>40 GB</b>, VDI, dynamically allocated</li></ul><p>Before starting it, select the VM and click <b>Settings</b>:</p><ul><li><b>System → Processor:</b> set to 2 CPUs</li><li><b>Network → Adapter 1:</b> Attached to <b>NAT</b> — this is temporary, so the VM can download Splunk from the internet</li><li><b>Network → Adapter 2:</b> tick Enable, Attached to <b>Host-only Adapter</b>, and pick the network you made in step 4</li><li><b>Storage:</b> click the empty CD icon, then the disc icon on the right, and choose your Ubuntu ISO</li></ul>",
      expect:
        "<p>The VM appears in the list with 4096 MB memory and two network adapters shown in its details panel.</p>",
      fixes: [
        {
          problem: "The Version dropdown has no \"Ubuntu (64-bit)\", only 32-bit options",
          cause: "Virtualisation is still disabled in firmware — VirtualBox hides 64-bit guests when it cannot use them.",
          fix: "Go back to step 1 and enable VT-x/AMD-V in your BIOS.",
        },
      ],
    },
    {
      title: "Install Ubuntu",
      time: "25 min (mostly waiting)",
      body: "<p>Start the VM. The Ubuntu installer boots. Work through it with the arrow keys and Enter — the mouse does not work in this installer, which is normal.</p><ul><li>Language: English</li><li>Keyboard: match your actual keyboard layout</li><li>Installation type: <b>Ubuntu Server</b> (not minimised)</li><li><b>Network:</b> you will see two interfaces. Leave the first (NAT) on DHCP. Select the second one, choose <b>Edit IPv4 → Manual</b>, and enter:<br />Subnet <code>192.168.56.0/24</code>, Address <code>192.168.56.10</code>, Gateway blank, Name servers blank</li><li>Proxy: leave blank &nbsp;·&nbsp; Mirror: accept the default</li><li>Storage: <b>Use an entire disk</b>, accept the layout, confirm the destructive write (it is only writing to the virtual disk)</li><li>Profile: name <code>analyst</code>, server name <code>soc-splunk</code>, username <code>analyst</code>, and a password you will remember</li><li><b>Tick &ldquo;Install OpenSSH server&rdquo;</b> — without this you cannot connect from your laptop</li><li>Snaps: select none</li></ul><p>Installation takes 10–20 minutes. When it says <b>Reboot Now</b>, press Enter. If it hangs asking you to remove the installation medium, just press Enter again.</p>",
      expect:
        "<p>A plain text login prompt. Log in with the username and password you chose, then confirm the lab address is set:</p>",
      commands: [
        {
          lang: "bash",
          where: "On the soc-splunk VM",
          code: "ip -4 addr show | grep inet",
        },
      ],
      expectCode:
        "inet 127.0.0.1/8 scope host lo\ninet 10.0.2.15/24 ... scope global enp0s3\ninet 192.168.56.10/24 ... scope global enp0s8",
      fixes: [
        {
          problem: "192.168.56.10 is missing from the output",
          cause: "The manual IPv4 configuration did not save during install.",
          fix: "Edit the network config with <code>sudo nano /etc/netplan/00-installer-config.yaml</code>, set the second interface to <code>addresses: [192.168.56.10/24]</code>, save with <b>Ctrl+O</b> then <b>Ctrl+X</b>, and apply with <code>sudo netplan apply</code>.",
        },
        {
          problem: "The installer never finishes and sits at a black screen",
          cause: "Too little memory assigned.",
          fix: "Power off the VM, raise memory to at least 4096 MB in Settings → System, and restart the install.",
        },
      ],
    },
    {
      title: "Install Splunk",
      time: "20 min",
      why: "Splunk is the SIEM — the searchable home for every log your lab produces. The free licence indexes 500 MB per day, which is far more than a home lab generates.",
      body: "<p>You can work in the VirtualBox window, but copy-paste does not work there, and you are about to type long commands. Connect over SSH from your own terminal instead:</p>",
      commands: [
        {
          lang: "bash",
          where: "On your laptop",
          label: "Connect to the VM",
          code: "ssh analyst@192.168.56.10",
        },
        {
          lang: "bash",
          where: "On the soc-splunk VM",
          label: "Download and install Splunk",
          code: "sudo apt update && sudo apt install -y wget\n\ncd /tmp\nwget -O splunk.deb 'https://download.splunk.com/products/splunk/releases/9.2.1/linux/splunk-9.2.1-78803f08aabb-linux-2.6-amd64.deb'\n\nsudo dpkg -i splunk.deb",
        },
        {
          lang: "bash",
          where: "On the soc-splunk VM",
          label: "Start it and enable boot-time startup",
          code: "sudo /opt/splunk/bin/splunk start --accept-license\n# It will ask you to create an administrator username and password.\n# Use 'admin' and a password you write down — you need it every time.\n\nsudo /opt/splunk/bin/splunk enable boot-start",
        },
      ],
      expect:
        "<p>After a minute or two of startup messages, the last lines tell you the web interface is up. Open <code>http://192.168.56.10:8000</code> in the browser <b>on your laptop</b> and log in with the admin account you just created.</p>",
      expectCode:
        "Waiting for web server at http://127.0.0.1:8000 to be available.... Done\n\nThe Splunk web interface is at http://soc-splunk:8000",
      fixes: [
        {
          problem: "The download URL 404s",
          cause: "Splunk moves release URLs as versions age.",
          fix: "Go to <a href=\"https://www.splunk.com/en_us/download/splunk-enterprise.html\" target=\"_blank\" rel=\"noopener noreferrer\">splunk.com/download/splunk-enterprise</a>, choose Linux <code>.deb</code>, and copy the current link from the &ldquo;download via command line (wget)&rdquo; box.",
        },
        {
          problem: "The browser on your laptop cannot reach port 8000",
          cause:
            "Almost always the host-only adapter. Splunk is listening, but your laptop has no route to it.",
          fix: "On the VM run <code>curl -I http://localhost:8000</code>. If that works, Splunk is fine and the problem is networking — confirm the VM has <code>192.168.56.10</code> and that VirtualBox Adapter 2 is set to your host-only network.",
        },
        {
          problem: "\"Insufficient memory\" or Splunk starts then dies",
          cause: "4 GB is Splunk's practical floor and the VM has less.",
          fix: "Shut the VM down, raise memory in Settings → System, and start again.",
        },
      ],
    },
    {
      title: "Create the Windows victim machine",
      time: "45 min (mostly waiting)",
      body: "<p>Back in VirtualBox, click <b>New</b>:</p><ul><li><b>Name:</b> <code>soc-victim</code></li><li><b>Type:</b> Microsoft Windows &nbsp;·&nbsp; <b>Version:</b> Windows 11 (64-bit)</li><li><b>Memory:</b> <code>4096</code> MB &nbsp;·&nbsp; <b>CPUs:</b> 2 &nbsp;·&nbsp; <b>Disk:</b> 50 GB dynamically allocated</li><li><b>Network → Adapter 1:</b> Host-only Adapter, your lab network. <b>Only one adapter.</b> This machine never needs the internet, and not giving it one is what makes it safe to attack later.</li><li><b>Storage:</b> attach the Windows ISO to the CD drive</li></ul><p>Start it and install Windows. Two things to watch for:</p><ul><li>At the product key screen choose <b>I don't have a product key</b> — the evaluation build activates itself for 90 days.</li><li>Windows 11 will try to force a Microsoft account. With no internet it cannot, and it falls back to a local account. Name it <code>labuser</code> with the password <code>Password123</code> — deliberately weak, because you are going to brute-force it in project 02.</li></ul><p>Once at the desktop, set a fixed address so log entries always point at a known machine. Open <b>Settings → Network &amp; internet → Ethernet → IP assignment → Edit → Manual</b>, turn on IPv4, and enter address <code>192.168.56.20</code>, mask <code>255.255.255.0</code>, gateway blank.</p>",
      expect: "<p>From the Windows VM, you can reach the Splunk VM:</p>",
      commands: [
        {
          lang: "powershell",
          where: "On the soc-victim VM",
          code: "ping 192.168.56.10",
        },
      ],
      expectCode:
        "Reply from 192.168.56.10: bytes=32 time<1ms TTL=64\nReply from 192.168.56.10: bytes=32 time<1ms TTL=64",
      fixes: [
        {
          problem: "Request timed out",
          cause:
            "Usually the Ubuntu firewall, or the two VMs are on different VirtualBox networks.",
          fix: "On the Splunk VM run <code>sudo ufw status</code>. If it is active, run <code>sudo ufw allow from 192.168.56.0/24</code>. Then re-check that both VMs' adapters point at the same host-only network.",
        },
        {
          problem: "Windows 11 refuses to install: \"This PC can't run Windows 11\"",
          cause: "Windows 11 requires TPM 2.0 and Secure Boot, which VirtualBox does not enable by default.",
          fix: "Power off the VM and in <b>Settings → System → Motherboard</b> tick <b>Enable EFI</b>, then in <b>Security</b> enable TPM 2.0 (VirtualBox 7 and later). If your VirtualBox is older, install Windows 10 instead — everything in these projects works identically.",
        },
      ],
    },
    {
      title: "Send Windows logs to Splunk",
      time: "25 min",
      why: "This is the step that turns two disconnected VMs into a SOC. The forwarder is a small agent that reads the Windows Event Log and ships every entry to Splunk.",
      body: "<p>First, tell Splunk to listen for incoming logs.</p>",
      commands: [
        {
          lang: "bash",
          where: "On the soc-splunk VM",
          label: "Open the receiving port",
          code: "sudo /opt/splunk/bin/splunk enable listen 9997 -auth admin:YOUR_PASSWORD",
        },
        {
          lang: "powershell",
          where: "On the soc-victim VM",
          label: "Install the forwarder (run PowerShell as Administrator)",
          code: "# The victim VM has no internet, so download the Universal Forwarder MSI\n# on your laptop from splunk.com/download/universal-forwarder and copy it in\n# via a VirtualBox shared folder, then run:\n\nmsiexec.exe /i splunkforwarder.msi `\n  RECEIVING_INDEXER=\"192.168.56.10:9997\" `\n  AGREETOLICENSE=Yes `\n  SPLUNKUSERNAME=admin `\n  SPLUNKPASSWORD=YOUR_PASSWORD `\n  /quiet",
        },
        {
          lang: "powershell",
          where: "On the soc-victim VM",
          label: "Tell it which logs to send",
          code: "cd \"C:\\Program Files\\SplunkUniversalForwarder\\bin\"\n\n.\\splunk.exe add monitor \"WinEventLog://Security\" -index main -auth admin:YOUR_PASSWORD\n.\\splunk.exe add monitor \"WinEventLog://System\" -index main -auth admin:YOUR_PASSWORD\n.\\splunk.exe add monitor \"WinEventLog://Application\" -index main -auth admin:YOUR_PASSWORD\n\n.\\splunk.exe restart",
        },
      ],
      expect:
        "<p>In the Splunk web interface, click <b>Search &amp; Reporting</b>, set the time range to <b>Last 15 minutes</b>, and run <code>index=main host=soc-victim</code>. Several hundred events appear, and the count grows as you watch.</p>",
      expectCode:
        "index=main host=soc-victim          ✓ 847 events (15 minutes ago to now)\n\n7/26/26 2:28:14.000 PM  EventCode=4624  Account_Name=labuser\n7/26/26 2:28:09.000 PM  EventCode=4672  Account_Name=SYSTEM",
      fixes: [
        {
          problem: "No events at all",
          cause:
            "Either the forwarder is not running, or it cannot reach Splunk on port 9997.",
          fix: "On Windows run <code>Get-Service SplunkForwarder</code> — it should say Running. Then test the path with <code>Test-NetConnection 192.168.56.10 -Port 9997</code>; <code>TcpTestSucceeded : True</code> means the network is fine and the problem is the forwarder's config.",
        },
        {
          problem: "Events appear but stop after a few minutes",
          cause: "You exceeded the 500 MB/day free licence — unusual, but possible if you enabled very chatty log sources.",
          fix: "Check <b>Settings → Licensing</b> in Splunk. Remove noisy monitors with <code>.\\splunk.exe remove monitor \"WinEventLog://Application\"</code>.",
        },
        {
          problem: "\"The system cannot find the file specified\" running msiexec",
          cause: "You are not in the folder containing the MSI.",
          fix: "<code>cd</code> to wherever you copied the file first, or give msiexec the full path.",
        },
      ],
    },
    {
      title: "Prove it works end to end",
      time: "10 min",
      why: "A lab you have not tested is a lab that will fail silently in project 02. Generate a known event and find it.",
      body: "<p>On the Windows VM, deliberately fail a login: lock the screen with <b>Windows+L</b>, type a wrong password, then log in properly.</p><p>Now find that failure in Splunk. Event ID <b>4625</b> means &ldquo;an account failed to log on&rdquo;; <b>4624</b> means a successful logon.</p>",
      commands: [
        {
          lang: "spl",
          where: "Splunk search bar",
          label: "Find the failed logon",
          code: "index=main EventCode=4625\n| table _time, Account_Name, Failure_Reason, Source_Network_Address",
        },
        {
          lang: "spl",
          label: "Then find the success that followed it",
          code: "index=main EventCode=4624\n| table _time, Account_Name, Logon_Type, Source_Network_Address\n| sort - _time",
        },
      ],
      expect:
        "<p>One 4625 with the account you mistyped, followed shortly after by a 4624 for the successful login. Seeing both — and the gap between them — is the whole basis of the brute-force detection you build next.</p>",
      expectCode:
        "_time                 Account_Name  Failure_Reason               \n2026-07-26 14:31:02   labuser       Unknown user name or bad password",
      fixes: [
        {
          problem: "4624 events appear but no 4625",
          cause:
            "Windows does not audit logon failures by default in every edition.",
          fix: "On the Windows VM open <code>secpol.msc</code> → <b>Advanced Audit Policy Configuration → Logon/Logoff → Audit Logon</b> and tick both <b>Success</b> and <b>Failure</b>. Then run <code>gpupdate /force</code> and try again.",
        },
      ],
    },
    {
      title: "Take a snapshot",
      time: "5 min",
      why: "A snapshot is a saved state you can return to instantly. Later projects deliberately break these machines — with a clean snapshot, recovery is thirty seconds instead of six hours.",
      body: "<p>Shut both VMs down cleanly (<code>sudo shutdown -h now</code> on Ubuntu; Start → Power → Shut down on Windows).</p><p>For each VM in VirtualBox: select it, open the <b>Snapshots</b> tab, click <b>Take</b>, and name it <code>clean-build</code> with a description of what is installed.</p>",
      expect:
        "<p>Both VMs show a snapshot named <code>clean-build</code>. Right-clicking it offers <b>Restore</b> — that is your undo button for every project after this one.</p>",
    },
  ],
  after: [
    "<b>Always take a snapshot before starting a new project.</b> It costs nothing and it will save you hours.",
    "Suspend rather than shut down the VMs (<b>Machine → Save State</b>) — they resume in seconds.",
    "If your laptop struggles, run only the VM you need. Splunk keeps data on disk, so shutting the Windows VM down loses nothing.",
    "Write down what you built while it is fresh. That note becomes your interview answer.",
  ],
};

export const SOC_GUIDES: ProjectGuide[] = [
  g01, g02, g03, g04, g05, g06, g07, g08, g09, g10, g11, g12,
];

export const SOC_GUIDE_SLUGS = new Set(SOC_GUIDES.map((g) => g.slug));

/** Does this project have a full written guide yet? */
export function socGuideSlug(projectId: number): string | undefined {
  return SOC_GUIDES.find((g) => g.projectId === projectId)?.slug;
}
