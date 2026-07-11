import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { EditTokenBridge } from "@/components/edit-token-bridge";
import { api } from "@/lib/api";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://faisalkhan.dev"),
  title: {
    default: "Faisal Khan — Cyber Security Analyst",
    template: "%s — Faisal Khan",
  },
  description:
    "Faisal Khan — Cyber Security Analyst who builds full-stack products with AI. Threat detection, incident response, and shipped software.",
  openGraph: {
    title: "Faisal Khan — Cyber Security Analyst",
    description:
      "Cyber Security Analyst who builds full-stack products with AI.",
    type: "website",
  },
};

/**
 * Set theme before paint to avoid a light/dark flash. A visitor's saved choice
 * wins; otherwise fall back to the admin's configured default ('system' honours
 * the device preference). `%DEFAULT%` is replaced with the Site Settings value.
 */
const themeScript = (fallbackTheme: string) => `
(function(){try{
  var t = localStorage.getItem('theme');
  if(!t){ t = ${JSON.stringify(fallbackTheme)}; }
  if(t === 'system' || !t){ t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  if(t === 'dark'){ document.documentElement.classList.add('dark'); }
}catch(e){}})();
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [site, settings] = await Promise.all([api.site(), api.settings()]);
  const accent = settings.theme?.accent?.trim();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript(settings.theme?.default ?? "system"),
          }}
        />
        {/* Admin-chosen accent overrides the design token site-wide. */}
        {accent ? (
          <style dangerouslySetInnerHTML={{ __html: `:root,.dark{--accent:${accent};}` }} />
        ) : null}
      </head>
      <body className="min-h-full bg-paper text-ink">
        <EditTokenBridge />
        <Nav wordmark={site.wordmark} logo={settings.logo ?? site.logo ?? null} />
        <main>{children}</main>
        <Footer site={site} />
      </body>
    </html>
  );
}
