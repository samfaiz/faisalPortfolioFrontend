/**
 * Free SEO resources. Everything here is genuinely free or has a free tier
 * that is useful on its own — no trials that expire mid-project, and no tools
 * whose free plan is really a demo.
 *
 * Shape is deliberately identical to ResourceGroup in soc-prep/data.ts so the
 * existing ResourceGroupList component renders it unchanged. That component
 * uses `url` as its React key and href, so every item needs one.
 */
import type { ResourceGroup } from "@/lib/soc-prep/data";

export const RESOURCES: ResourceGroup[] = [
  {
    group: "The tools you actually need",
    items: [
      {
        name: "Google Search Console",
        description:
          "The only first-party source of how Google sees your site — queries, impressions, indexing status, crawl errors. If you use one tool, use this one.",
        url: "https://search.google.com/search-console",
        tag: "ESSENTIAL",
      },
      {
        name: "Google Analytics 4",
        description:
          "What people do after they arrive. Pairs with Search Console, which stops at the click.",
        url: "https://analytics.google.com",
        tag: "ESSENTIAL",
      },
      {
        name: "Bing Webmaster Tools",
        description:
          "Underrated. Gives keyword data Google does not, and its site scan finds real technical issues.",
        url: "https://www.bing.com/webmasters",
        tag: "FREE",
      },
      {
        name: "Screaming Frog SEO Spider",
        description:
          "Free up to 500 URLs, which covers most small sites entirely. The standard desktop crawler.",
        url: "https://www.screamingfrog.co.uk/seo-spider/",
        tag: "FREE TIER",
      },
      {
        name: "Ahrefs Webmaster Tools",
        description:
          "Free backlink and site-audit data, but only for sites you verify ownership of. Enough to audit your own properly.",
        url: "https://ahrefs.com/webmaster-tools",
        tag: "FREE TIER",
      },
      {
        name: "PageSpeed Insights",
        description:
          "Shows both lab data and, where enough traffic exists, real-user field data. The field data is the part Google ranks on.",
        url: "https://pagespeed.web.dev",
        tag: "FREE",
      },
      {
        name: "Rich Results Test",
        description:
          "Validates structured data and shows which rich results a page qualifies for.",
        url: "https://search.google.com/test/rich-results",
        tag: "FREE",
      },
    ],
  },
  {
    group: "Documentation worth reading properly",
    items: [
      {
        name: "Google Search Central docs",
        description:
          "The official documentation. Dry, but it is the source everything else paraphrases — usually badly.",
        url: "https://developers.google.com/search/docs",
        tag: "PRIMARY",
      },
      {
        name: "Search Quality Rater Guidelines",
        description:
          "The manual Google's human raters work from. Long, and the single best explanation of what E-E-A-T means in practice.",
        url: "https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf",
        tag: "PRIMARY",
      },
      {
        name: "Google Search Status Dashboard",
        description:
          "Confirmed ranking and indexing incidents, with dates. Check it before diagnosing any sudden drop.",
        url: "https://status.search.google.com/summary",
        tag: "DIAGNOSTIC",
      },
      {
        name: "Google Search Central Blog",
        description:
          "Where core updates and policy changes are announced first.",
        url: "https://developers.google.com/search/blog",
        tag: "PRIMARY",
      },
      {
        name: "schema.org",
        description:
          "The structured data vocabulary itself. Reference rather than tutorial.",
        url: "https://schema.org",
        tag: "REFERENCE",
      },
    ],
  },
  {
    group: "Staying current",
    items: [
      {
        name: "Aleyda Solis — SEOFOMO",
        description:
          "Weekly newsletter. The most efficient way to stay current without reading twenty blogs.",
        url: "https://www.aleydasolis.com/en/seo-fomo/",
        tag: "NEWSLETTER",
      },
      {
        name: "Search Engine Roundtable",
        description:
          "Reports algorithm volatility and Google statements same-day. Where you check whether a drop is you or everyone.",
        url: "https://www.seroundtable.com",
        tag: "NEWS",
      },
      {
        name: "Google Search Central on YouTube",
        description: "Office hours and explainers direct from the search team.",
        url: "https://www.youtube.com/@GoogleSearchCentral",
        tag: "VIDEO",
      },
      {
        name: "Ahrefs blog",
        description:
          "Genuinely good technical content and original studies. Read past the product placement.",
        url: "https://ahrefs.com/blog/",
        tag: "BLOG",
      },
      {
        name: "web.dev",
        description:
          "Google's performance documentation. The authority on Core Web Vitals and how to actually fix them.",
        url: "https://web.dev",
        tag: "PERFORMANCE",
      },
    ],
  },
  {
    group: "Practice and data",
    items: [
      {
        name: "Your own site",
        description:
          "The best practice environment there is — real Search Console data, real consequences, and every result is yours to talk about in an interview.",
        url: "https://faisalkhan.cloud",
        tag: "PRACTICE",
      },
      {
        name: "Chrome UX Report (CrUX)",
        description:
          "Free real-user performance data for any public site, queryable in BigQuery's free tier. How you compare yourself to competitors on Core Web Vitals.",
        url: "https://developer.chrome.com/docs/crux",
        tag: "DATA",
      },
      {
        name: "Common Crawl",
        description:
          "Free petabyte-scale web crawl data. Overkill for most work, invaluable for original research that earns links.",
        url: "https://commoncrawl.org",
        tag: "DATA",
      },
      {
        name: "Wayback Machine",
        description:
          "Essential for migration forensics and for seeing what a page looked like before traffic changed.",
        url: "https://web.archive.org",
        tag: "FORENSICS",
      },
    ],
  },
];

export const RESOURCE_COUNT = RESOURCES.reduce(
  (n, g) => n + g.items.length,
  0
);
