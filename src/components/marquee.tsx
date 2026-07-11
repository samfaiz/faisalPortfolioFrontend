const KEYWORDS = [
  "THREAT DETECTION",
  "INCIDENT RESPONSE",
  "APPSEC",
  "NEXT.JS",
  "LARAVEL",
  "AI WORKFLOWS",
  "SIEM",
  "HARDENING",
  "CTF",
  "FULL-STACK",
];

export function Marquee() {
  // Duplicate the list so the -50% translate loops seamlessly.
  const row = [...KEYWORDS, ...KEYWORDS];
  return (
    <div className="overflow-hidden bg-accent py-2.5 text-paper">
      <div className="animate-marquee flex w-max gap-6 whitespace-nowrap">
        {row.map((k, i) => (
          <span key={i} className="mono-label font-medium">
            {k} <span aria-hidden>✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}
