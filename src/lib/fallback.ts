/**
 * Bundled seed content (from design_handoff_portfolio/README.md — real contact
 * details + placeholder portfolio content). Used so the site renders fully even
 * before the Laravel backend is available. The backend serves the same shapes;
 * when it's up, live data replaces these.
 */
import type {
  Certification,
  Experience,
  HeroSection,
  Post,
  Project,
  SiteSection,
  Stats,
} from "./types";

export const site: SiteSection = {
  wordmark: "FAISAL KHAN",
  email: "faisalkhan78612@gmail.com",
  phone: "+971 50 170 1165",
  linkedin: "linkedin.com/in/mohammedfaisalkhan",
  github: "github.com/samfaiz",
  location: "DXB",
};

export const hero: HeroSection = {
  boot_line: "> portfolio v2.0 — initializing…",
  status_pill: "DXB · OPEN TO WORK",
  name: "Faisal Khan",
  tagline: "cyber security analyst // full-stack + AI",
  photo: null,
  headline_line1: "CYBER SECURITY",
  headline_line2: "ANALYST",
  footnote: [
    "// I secure systems and ship products.",
    "// Threat analysis, hardening, and incident response by day.",
    "// Full-stack apps built with AI by night.",
  ],
  cta_primary: { label: "VIEW PROJECTS ↗", href: "/projects" },
  cta_secondary: { label: "RESUME ↓", href: "/resume.pdf" },
};

export const aboutIntro = {
  eyebrow: "/01",
  heading: "The analyst who builds.",
  body: "I'm Faisal — a cyber security analyst who treats software the way I treat systems: understand the threat model, remove the weak points, ship something that holds up. I pair defensive security work with a builder's habit of shipping full-stack products, increasingly with AI in the loop.",
  facts: [
    { label: "BASE", value: "Dubai, UAE" },
    { label: "FOCUS", value: "Blue-team + AppSec" },
    { label: "BUILDS", value: "Next.js · Laravel · AI" },
    { label: "STATUS", value: "Open to work", accent: true },
  ],
};

export const skills = [
  {
    label: "SECURITY",
    dot: "#22915f",
    items: [
      "Threat detection & triage",
      "Incident response",
      "Vulnerability assessment",
      "SIEM / log analysis",
      "Network & endpoint hardening",
    ],
  },
  {
    label: "DEVELOPMENT",
    dot: "#4b7bec",
    items: [
      "Next.js / React / TypeScript",
      "Laravel / PHP APIs",
      "Tailwind + design systems",
      "MySQL / Postgres",
      "CI/CD on Linux VPS",
    ],
  },
  {
    label: "AI WORKFLOW",
    dot: "#e0a23b",
    tinted: true,
    items: [
      "LLM-assisted development",
      "AI content & SEO pipelines",
      "Prompt design & guardrails",
      "Automation & agents",
      "RAG over private data",
    ],
  },
];

export const projects: Project[] = [
  {
    id: 1,
    title: "SOC Triage Dashboard",
    slug: "soc-triage-dashboard",
    category: "cyber-sec",
    description:
      "A real-time alert triage board that clusters SIEM events, scores severity, and suggests response playbooks.",
    url: "https://example.com",
    allow_iframe: true,
    tags: ["Next.js", "Laravel", "SIEM"],
    thumbnail: null,
    featured: true,
    order: 1,
  },
  {
    id: 2,
    title: "Phish Report Analyzer",
    slug: "phish-report-analyzer",
    category: "web-apps",
    description:
      "Users forward suspicious emails; the app extracts IOCs, checks reputation, and returns a verdict with evidence.",
    url: "https://example.com",
    allow_iframe: true,
    tags: ["React", "AI", "Threat Intel"],
    thumbnail: null,
    featured: false,
    order: 2,
  },
  {
    id: 3,
    title: "Portfolio CMS",
    slug: "portfolio-cms",
    category: "web-dev",
    description:
      "The headless CMS powering this very site — inline visual editing, AI SEO, and an AI blog writer.",
    url: "https://example.com",
    allow_iframe: true,
    tags: ["Laravel", "Filament", "Next.js"],
    thumbnail: null,
    featured: false,
    order: 3,
  },
];

export const posts: Post[] = [
  {
    id: 1,
    title: "Building an AI-assisted phishing triage pipeline",
    slug: "ai-phishing-triage",
    category: "ai-dev",
    excerpt:
      "How I combined IOC extraction, reputation APIs, and an LLM verdict layer to cut email triage time by 70%.",
    read_minutes: 7,
    featured: true,
    cover: null,
    published_at: "2026-06-18T00:00:00Z",
    author: { name: "Faisal Khan" },
  },
  {
    id: 2,
    title: "Hardening a Linux VPS the boring, effective way",
    slug: "hardening-linux-vps",
    category: "security",
    excerpt:
      "A checklist I actually use: SSH, firewall, fail2ban, unattended upgrades, and sane defaults that hold up.",
    read_minutes: 6,
    featured: false,
    cover: null,
    published_at: "2026-05-30T00:00:00Z",
    author: { name: "Faisal Khan" },
  },
  {
    id: 3,
    title: "CTF writeup: chaining an IDOR into account takeover",
    slug: "ctf-idor-ato",
    category: "ctf",
    excerpt:
      "A walkthrough of how a small authorization gap became a full takeover — and how to prevent it.",
    read_minutes: 9,
    featured: false,
    cover: null,
    published_at: "2026-05-12T00:00:00Z",
    author: { name: "Faisal Khan" },
  },
  {
    id: 4,
    title: "Prompt guardrails for LLM content pipelines",
    slug: "prompt-guardrails",
    category: "ai-dev",
    excerpt:
      "Keeping AI-generated content on-brand and factual: system prompts, validation, and human review gates.",
    read_minutes: 5,
    featured: false,
    cover: null,
    published_at: "2026-04-28T00:00:00Z",
    author: { name: "Faisal Khan" },
  },
];

export const experiences: Experience[] = [
  {
    id: 1,
    role: "Cyber Security Analyst",
    company: "confidential // DXB",
    date_label: "2024 — now",
    current: true,
    summary:
      "Threat detection, incident response, and hardening across cloud and endpoint. Automating triage with AI.",
    order: 1,
  },
  {
    id: 2,
    role: "Security & Full-stack Engineer",
    company: "freelance",
    date_label: "2022 — 2024",
    current: false,
    summary:
      "Shipped web apps and secured client infrastructure — from AppSec reviews to production Laravel + Next.js builds.",
    order: 2,
  },
];

export const certifications: Certification[] = [
  { id: 1, name: "CompTIA Security+", issuer: "CompTIA", year: "2024", status: "done", thumbnail: null, order: 1 },
  { id: 2, name: "eJPT", issuer: "INE", year: "2024", status: "done", thumbnail: null, order: 2 },
  { id: 3, name: "OSCP", issuer: "OffSec", year: "2026", status: "in-progress", thumbnail: null, order: 3 },
];

export const stats: Stats = {
  years_in_security: 3,
  incidents_handled: 120,
  apps_shipped_with_ai: 9,
  status: "open_to_work",
};
