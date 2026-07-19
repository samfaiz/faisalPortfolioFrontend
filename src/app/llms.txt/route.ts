/**
 * /llms.txt — a GEO (generative-engine optimisation) feature: a concise,
 * AI-readable guide to the site so answer engines and LLM crawlers can
 * understand and cite it. Markdown, regenerated hourly.
 * See https://llmstxt.org/.
 */
import { api } from "@/lib/api";

const SITE = "https://faisalkhan.dev";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const [site, posts] = await Promise.all([api.site(), api.posts()]);

  const brand = site.wordmark || "Faisal Khan";
  const tagline = site.tagline || "Cyber Security Analyst who builds full-stack products with AI.";

  const lines: string[] = [
    `# ${brand}`,
    "",
    `> ${tagline}`,
    "",
    "Faisal Khan is a cyber-security analyst who ships full-stack products with AI — threat detection, incident response, and deployed software. This site is his portfolio and technical blog.",
    "",
    "## Key pages",
    `- [Home](${SITE}/): overview, skills, and highlights`,
    `- [About](${SITE}/about): background, experience, and expertise`,
    `- [Projects](${SITE}/projects): live, in-page previews of deployed security tools and full-stack apps`,
    `- [Experience](${SITE}/experience): roles, certifications, and timeline`,
    `- [Blog](${SITE}/blog): writing on security, CTFs, and AI engineering`,
  ];

  if (posts.length) {
    lines.push("", "## Latest articles");
    for (const post of posts.slice(0, 15)) {
      const summary = (post.excerpt || "").replace(/\s+/g, " ").trim();
      lines.push(`- [${post.title}](${SITE}/blog/${post.slug})${summary ? `: ${summary}` : ""}`);
    }
  }

  if (site.email) {
    lines.push("", "## Contact", `- Email: ${site.email}`);
    if (site.github) lines.push(`- GitHub: ${site.github}`);
    if (site.linkedin) lines.push(`- LinkedIn: ${site.linkedin}`);
  }

  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
