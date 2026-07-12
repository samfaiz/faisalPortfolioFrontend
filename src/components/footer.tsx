import type { SiteSection } from "@/lib/types";

export function Footer({ site }: { site: SiteSection }) {
  const cards = [
    { label: "EMAIL", value: site.email, href: `mailto:${site.email}` },
    { label: "PHONE", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    { label: "LINKEDIN", value: site.linkedin, href: `https://${site.linkedin}` },
    { label: "GITHUB", value: site.github, href: `https://${site.github}` },
  ];

  return (
    <footer id="hire" className="px-4 pb-5 pt-8 sm:px-5">
      <div className="scanlines mx-auto max-w-6xl rounded-page bg-panel p-8 text-on-dark sm:p-12">
        <span className="mono-label inline-block rounded-pill border border-on-dark-faint/40 px-3 py-1.5 text-on-dark-muted">
          &gt; want to hire me?_
        </span>

        <h2 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-6xl">
          LET&apos;S WORK TOGETHER<span className="text-accent-soft">.</span>
        </h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="rounded-md border border-on-dark-faint/25 p-4 transition-colors hover:border-accent-soft"
            >
              <div className="mono-label text-on-dark-faint">{c.label}</div>
              <div className="mt-2 break-words text-sm text-on-dark">{c.value}</div>
            </a>
          ))}
        </div>

        <div className="mono-label mt-10 flex flex-wrap gap-x-4 gap-y-1 text-on-dark-faint">
          <span>© 2026 FAISAL KHAN</span>
          <span className="text-accent-soft">● ALL SYSTEMS SECURE</span>
          <span>BUILT WITH AI</span>
          <span>SECURED BY HABIT</span>
        </div>
      </div>
    </footer>
  );
}
