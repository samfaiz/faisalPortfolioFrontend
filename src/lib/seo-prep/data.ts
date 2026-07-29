/**
 * SEO prep kit content. Tiered by seniority (Junior / Mid / Senior) and
 * weighted towards technical SEO, which is where the harder-to-fill roles sit.
 *
 * Every fundamental carries three things deliberately:
 *   plain      — what it is, in language that assumes no prior knowledge
 *   detail     — the depth an interviewer is actually probing for
 *   realWorld  — a concrete situation where it decides the outcome
 *
 * Several also carry `pitfall`: the thing people get wrong, which is usually
 * the follow-up question.
 *
 * Tooling assumes the free tier only — Search Console, GA4, Bing Webmaster
 * Tools, Screaming Frog (500 URLs), Ahrefs Webmaster Tools for a site you own,
 * PageSpeed Insights. Nothing here needs a paid subscription.
 *
 * String fields may contain inline HTML rendered inside .soc-prose containers.
 */

export type Level = "junior" | "mid" | "senior";

export const LEVEL_NAMES: Record<Level, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
};

export const LEVEL_ORDER: Level[] = ["junior", "mid", "senior"];

/** Broad discipline, used for filtering and for the deep-dive tabs. */
export type Pillar = "technical" | "content" | "authority" | "measurement";

export const PILLAR_NAMES: Record<Pillar, string> = {
  technical: "Technical",
  content: "Content & On-Page",
  authority: "Authority & Off-Page",
  measurement: "Measurement",
};

export interface Fundamental {
  level: Level;
  pillar: Pillar;
  category: string;
  title: string;
  /** No-prior-knowledge explanation. */
  plain: string;
  /** The depth an interview actually probes. */
  detail: string;
  /** A concrete situation where this decides the outcome. */
  realWorld: string;
  /** The common misunderstanding — usually the follow-up question. */
  pitfall?: string;
}

export interface Role {
  level: Level;
  title: string;
  /** Typical job titles you will see on postings. */
  titles: string[];
  /** What the job actually involves day to day. */
  items: string[];
  /** What an interviewer is really testing at this level. */
  probe: string;
  /** What separates a good candidate from an adequate one. */
  signal: string;
}

/* -------------------------------------------------------------------------- */
/* Fundamentals                                                                */
/* -------------------------------------------------------------------------- */

export const FUNDAMENTALS: Fundamental[] = [
  /* ---- How search works (8) --------------------------------------------- */
  {
    level: "junior",
    pillar: "technical",
    category: "How Search Works",
    title: "Crawling",
    plain:
      "Crawling is a search engine sending an automated program — a crawler, or for Google, Googlebot — to fetch pages from your website, the same way a browser does. It follows links from page to page to discover what exists.",
    detail:
      "A crawler starts from a list of known URLs (previous crawls, submitted sitemaps, links from other sites), requests each one, and extracts the links it finds to add to its queue. Crawling is <b>only fetching</b> — it is not the same as being indexed, and it is not the same as ranking. A page can be crawled and never indexed, and a page can be indexed without being crawled recently.",
    realWorld:
      "A client complains a new blog post is not on Google after two days. Before touching anything, you check the URL Inspection tool in Search Console. It says <code>Discovered — currently not indexed</code>. That tells you Google knows the URL exists but has not fetched it yet, which is a crawl-priority problem, not a content problem. Adding an internal link from a page Google crawls often will do more than rewriting the article.",
    pitfall:
      "&ldquo;Submit to Google&rdquo; is not a ranking action. Requesting indexing pushes a URL up the crawl queue; it does not guarantee indexing and has no effect on where the page ranks.",
  },
  {
    level: "junior",
    pillar: "technical",
    category: "How Search Works",
    title: "Rendering",
    plain:
      "Rendering is the step where Google runs your page's JavaScript to see the final content, the way a browser would. Pages that build their content with JavaScript need this step before Google can see what is on them.",
    detail:
      "Google fetches the raw HTML first, then queues the page for rendering in a headless Chromium. Historically this was a second wave that could lag by days; it is much faster now but it is still a separate, resource-limited step. Content that only exists after JavaScript runs is therefore <b>discovered later and less reliably</b> than content in the initial HTML.",
    realWorld:
      "A React site shows its product descriptions fine in a browser but the pages rank for nothing. You run <code>curl -s https://site.com/product/x | grep -c 'description text'</code> and get 0 — the HTML Google first receives contains an empty <code>&lt;div id=\"root\"&gt;</code>. The fix is server-side rendering or static generation, not more keywords.",
    pitfall:
      "&ldquo;Google can run JavaScript&rdquo; is true but incomplete. It can, at a cost and a delay, and other crawlers (Bing, social preview bots, most LLM crawlers) are far worse at it.",
  },
  {
    level: "junior",
    pillar: "technical",
    category: "How Search Works",
    title: "Indexing",
    plain:
      "Indexing is Google deciding to store your page in its database so it can be shown in results. If a page is not indexed, it cannot rank for anything — no exceptions.",
    detail:
      "After crawling and rendering, Google decides whether the page is worth storing. It can decline: duplicate of something already indexed, thin, low quality, blocked by <code>noindex</code>, or simply not judged worth the storage. Search Console's Pages report gives you the reason per URL, and the reasons are genuinely diagnostic rather than generic.",
    realWorld:
      "An e-commerce site has 40,000 URLs and 6,000 indexed. The Pages report shows 28,000 as <code>Duplicate without user-selected canonical</code> — faceted navigation generating a URL for every filter combination. The fix is canonical tags and robots rules on the facet parameters, not more content.",
    pitfall:
      "<code>Crawled — currently not indexed</code> is a quality signal, not a bug. Google fetched the page, looked at it, and decided against. Re-submitting will not change that; improving or consolidating the page might.",
  },
  {
    level: "junior",
    pillar: "technical",
    category: "How Search Works",
    title: "Ranking",
    plain:
      "Ranking is the order Google puts indexed pages in when someone searches. It is decided fresh for every query, so the same page can be first for one phrase and invisible for a near-identical one.",
    detail:
      "Google matches the query to indexed pages, then scores them on hundreds of signals — relevance to the query, the page's own quality, the site's authority, the user's location and language, and the device. Crucially, ranking is <b>per query</b>, not a fixed score attached to your page.",
    realWorld:
      "A page ranks 4th for &ldquo;home soc lab&rdquo; but nowhere for &ldquo;how to build a soc lab&rdquo;. Those are different intents — one navigational-ish, one instructional. Same page, same authority, different result, because the second query wants a step-by-step guide and the page is a summary.",
    pitfall:
      "There is no &ldquo;SEO score&rdquo;. Tools that give your page a number out of 100 are giving you their own heuristic, not anything Google computes.",
  },
  {
    level: "mid",
    pillar: "technical",
    category: "How Search Works",
    title: "Crawl budget",
    plain:
      "Crawl budget is roughly how many pages a search engine will fetch from your site in a given period. It matters when a site is large — for a 200-page site it is effectively unlimited.",
    detail:
      "It is the product of two things: <b>crawl capacity</b> (how much your server can take without slowing down, which Google backs off from automatically) and <b>crawl demand</b> (how much Google wants your pages, driven by popularity and staleness). Wasting it on parameter URLs, infinite calendars, or soft 404s means real pages get crawled less often.",
    realWorld:
      "A 500,000-URL retailer finds new products take three weeks to appear. Log analysis shows 60% of Googlebot requests going to <code>?sort=</code> and <code>?colour=</code> parameter URLs. Blocking those in robots.txt cut discovery time to two days without adding a single page.",
    pitfall:
      "Crawl budget is not a lever you can pull directly, and it is irrelevant for most sites. Bringing it up for a 300-page brochure site signals you have read about SEO rather than done it.",
  },
  {
    level: "mid",
    pillar: "technical",
    category: "How Search Works",
    title: "Index bloat",
    plain:
      "Index bloat is having far more pages indexed than you have valuable pages — usually low-quality, near-duplicate, or auto-generated URLs diluting the site.",
    detail:
      "Common sources: tag and author archives, internal search result pages, faceted navigation, paginated series indexed individually, staging URLs, and printer-friendly duplicates. The cost is twofold — crawl budget spent on junk, and a site-level quality impression formed from a mostly-thin sample.",
    realWorld:
      "A WordPress blog with 200 posts shows 4,800 indexed pages. The extras are <code>/tag/</code> archives, one per tag, each listing a single post. Setting those to <code>noindex</code> dropped indexed pages to 240 and organic traffic rose over the following two months.",
  },
  {
    level: "senior",
    pillar: "technical",
    category: "How Search Works",
    title: "JavaScript SEO",
    plain:
      "JavaScript SEO is making sure sites built with frameworks like React, Vue, or Angular are still fully visible to search engines — which do not run JavaScript as reliably as a browser does.",
    detail:
      "The decision is a rendering strategy: <b>client-side</b> (the browser builds everything — worst for SEO), <b>server-side rendering</b> (HTML arrives complete), <b>static generation</b> (HTML built at deploy time — best when content is not per-user), or <b>hydration</b> variants. The test is not &ldquo;does it look right&rdquo; but &ldquo;is the content in the initial HTML response&rdquo;.",
    realWorld:
      "A Next.js site uses <code>useEffect</code> to fetch and display product specs. In the browser it works perfectly. <code>view-source:</code> shows none of it. Moving the fetch to a server component put the specs in the HTML and the pages started ranking for spec-related long-tail queries within weeks.",
    pitfall:
      "Testing with Google's Rich Results Test or URL Inspection shows the <i>rendered</i> HTML, which can look fine while the initial response is empty. Always check <code>view-source:</code> or <code>curl</code> as well.",
  },
  {
    level: "mid",
    pillar: "technical",
    category: "How Search Works",
    title: "SERP features",
    plain:
      "SERP features are the results that are not the plain ten blue links — featured snippets, People Also Ask, image packs, video carousels, local map packs, and AI overviews.",
    detail:
      "They matter because they take clicks. Ranking first below a featured snippet, a map pack, and four ads can produce a fraction of the traffic that first place produced five years ago. Some features are winnable (featured snippets, PAA, rich results via structured data); some are not (ads, AI overviews you did not opt into).",
    realWorld:
      "A page moves from position 3 to 1 and traffic <i>falls</i>. The SERP gained an AI overview and a video carousel above the organic results, so position 1 is now below the fold. Reporting the ranking win without the traffic context would have been actively misleading.",
    pitfall:
      "Average position in Search Console counts your position among organic results only — it does not know how far down the page that actually is.",
  },

  /* ---- Technical (12) ---------------------------------------------------- */
  {
    level: "junior",
    pillar: "technical",
    category: "Crawl & Index Control",
    title: "robots.txt",
    plain:
      "A text file at the root of your domain that tells crawlers which parts of the site they may fetch. It is a request, not a lock — well-behaved crawlers obey it, malicious ones ignore it entirely.",
    detail:
      "Lives at <code>/robots.txt</code>, exactly. Directives are <code>User-agent</code>, <code>Disallow</code>, <code>Allow</code>, and <code>Sitemap</code>. The single most important thing to understand: <b>Disallow prevents crawling, not indexing.</b> A blocked URL can still appear in results — as a bare URL with no description — if other pages link to it.",
    realWorld:
      "A staging site gets indexed. Someone adds <code>Disallow: /</code> to robots.txt to remove it. Weeks later the URLs are still in Google, now with &ldquo;No information is available for this page&rdquo;. Because Google can no longer crawl them, it can never see the <code>noindex</code> that would actually remove them. The correct fix is to allow crawling and serve <code>noindex</code>, or use HTTP auth.",
    pitfall:
      "Never use robots.txt and <code>noindex</code> together on the same URL. Blocking the crawl means the noindex is never read, so the page stays indexed indefinitely.",
  },
  {
    level: "junior",
    pillar: "technical",
    category: "Crawl & Index Control",
    title: "XML sitemaps",
    plain:
      "A machine-readable list of the URLs on your site that you want search engines to know about, so they do not have to discover everything by following links.",
    detail:
      "Should contain only URLs that are <b>indexable and canonical</b> — 200 status, not <code>noindex</code>, not redirected, and self-canonical. Maximum 50,000 URLs or 50 MB per file, with sitemap index files above that. <code>lastmod</code> is used as a crawl hint when it is accurate; sites that touch it on every deploy have taught Google to ignore theirs.",
    realWorld:
      "Search Console shows a sitemap with 12,000 submitted and 3,000 indexed, which looks alarming. Crawling the sitemap reveals 8,000 URLs returning 301 and 1,000 returning 404. The submitted count was never a target — it was a list of mistakes. Regenerating it from live, canonical URLs only made the report meaningful.",
    pitfall:
      "A sitemap does not make pages index. It helps discovery. If a page is not indexed, adding it to a sitemap rarely changes that on its own.",
  },
  {
    level: "junior",
    pillar: "technical",
    category: "Crawl & Index Control",
    title: "Canonical tags",
    plain:
      "A tag telling search engines which version of a page is the real one, when the same or similar content is reachable at more than one URL.",
    detail:
      "<code>&lt;link rel=\"canonical\" href=\"...\"&gt;</code> in the <code>&lt;head&gt;</code>, or the equivalent HTTP header. It is a <b>hint, not a directive</b> — Google can and does override it when the signals disagree, which Search Console reports as <code>Google selected different canonical than user</code>. Every page should have one, including pages that point at themselves.",
    realWorld:
      "A product is reachable at <code>/shoes/red-trainer</code>, <code>/sale/red-trainer</code>, and <code>/shoes/red-trainer?colour=red</code>. Without canonicals, link signals split three ways and Google picks one arbitrarily — often not the one you would choose. Pointing all three at the first consolidated the signals and the page moved up.",
    pitfall:
      "Canonicalising to a URL that is itself redirected, noindexed, or 404 breaks the chain. Google then ignores the canonical entirely and decides for itself.",
  },
  {
    level: "junior",
    pillar: "technical",
    category: "Redirects & Status",
    title: "Redirect types — 301, 302, 307, 308",
    plain:
      "A redirect sends a visitor and a crawler from one URL to another. The number tells them whether the move is permanent, which decides whether ranking signals move with it.",
    detail:
      "<b>301</b> permanent, <b>302</b> temporary, <b>307</b> temporary preserving the request method, <b>308</b> permanent preserving the method. Google passes signals through all of them in practice, but a 302 tells it to keep the old URL indexed, so the wrong one leaves you with the old URL ranking and the new one ignored. Meta refresh and JavaScript redirects work but are slower and less reliable.",
    realWorld:
      "A site migration used 302s throughout because the developer thought it was safer to be reversible. Six weeks later Google was still serving old URLs, half of which now 404 behind the redirect. Switching to 301 recovered rankings over the following month.",
    pitfall:
      "Redirect chains (A→B→C) leak equity and slow crawling; redirect loops break the page entirely. Always redirect to the final destination in one hop.",
  },
  {
    level: "junior",
    pillar: "technical",
    category: "Redirects & Status",
    title: "HTTP status codes that matter for SEO",
    plain:
      "The three-digit number a server returns with every page. Search engines treat each one differently, and returning the wrong one causes problems that are invisible in a browser.",
    detail:
      "<b>200</b> OK, <b>301/308</b> permanent redirect, <b>302/307</b> temporary, <b>404</b> not found, <b>410</b> gone (a stronger, faster removal signal than 404), <b>500</b> server error, <b>503</b> temporarily unavailable — the correct code during planned maintenance because it tells Google to come back rather than drop the page.",
    realWorld:
      "A CMS serves a friendly &ldquo;Sorry, not found&rdquo; page with a <b>200</b> status. Google indexes thousands of these as real pages — a soft 404. The site looks to Google like it is mostly thin content. Returning a genuine 404 fixed it, and nothing changed visually for users.",
    pitfall:
      "What the user sees and what the server returns are different things. Always check with <code>curl -I</code> rather than trusting the page.",
  },
  {
    level: "mid",
    pillar: "technical",
    category: "Performance & Markup",
    title: "Core Web Vitals",
    plain:
      "Three measurements of how a page feels to use: how fast the main content appears, how quickly it responds to a tap or click, and how much things move around while loading.",
    detail:
      "<b>LCP</b> (Largest Contentful Paint) — main content rendered, target under 2.5s. <b>INP</b> (Interaction to Next Paint) — responsiveness, target under 200ms; replaced FID in March 2024. <b>CLS</b> (Cumulative Layout Shift) — visual stability, target under 0.1. They are a genuine ranking signal but a <b>weak</b> one, and they are measured on real users (field data), not lab tools.",
    realWorld:
      "A team spends six weeks getting PageSpeed Insights from 60 to 98 and sees no ranking movement. The field data in Search Console was already passing. The lab score was never the thing being measured — they optimised a number nobody ranks on.",
    pitfall:
      "Lab data (Lighthouse, PSI score) and field data (CrUX, the Core Web Vitals report) are different. Google uses field data. If you have no field data, you have too little traffic for CWV to be your problem.",
  },
  {
    level: "mid",
    pillar: "technical",
    category: "Performance & Markup",
    title: "Schema markup",
    plain:
      "Extra code on a page that describes what the page is about in a format machines understand — that this is a recipe, this number is the rating, this is the cooking time.",
    detail:
      "Usually JSON-LD in a <code>&lt;script type=\"application/ld+json\"&gt;</code> block. It does not directly improve rankings. What it does is make a page <b>eligible</b> for rich results — star ratings, FAQs, breadcrumbs, product prices — which change how much of the SERP you occupy and therefore your click-through rate.",
    realWorld:
      "Adding Product and AggregateRating markup to 400 product pages produced no ranking change and a 34% click-through-rate increase, because the results now showed price, availability, and stars. Same position, considerably more traffic.",
    pitfall:
      "Marking up content that is not visible on the page, or marking up the wrong type, gets rich results revoked and can trigger a structured-data manual action. The markup must describe what the user actually sees.",
  },
  {
    level: "mid",
    pillar: "technical",
    category: "Architecture & Scale",
    title: "hreflang",
    plain:
      "Tags telling search engines that a page has versions in other languages or for other countries, and which version to show to whom.",
    detail:
      "Every version must reference <b>every</b> version, including itself — the set has to be reciprocal or Google ignores it. Values are language, optionally with region: <code>en</code>, <code>en-GB</code>, <code>en-US</code>. <code>x-default</code> is the fallback for unmatched users. Can be implemented in the <code>&lt;head&gt;</code>, in HTTP headers, or in the XML sitemap — the sitemap route is far easier to maintain at scale.",
    realWorld:
      "A UK retailer's US customers keep landing on GBP pages and bouncing. Adding reciprocal hreflang between the <code>/uk/</code> and <code>/us/</code> trees fixed the wrong-country problem without changing rankings — hreflang is a <i>which version</i> signal, not a ranking one.",
    pitfall:
      "hreflang does not fix duplicate content between languages, and it is not a ranking booster. Non-reciprocal tags are silently ignored, which is why so many implementations do nothing.",
  },
  {
    level: "mid",
    pillar: "technical",
    category: "Architecture & Scale",
    title: "Site architecture and click depth",
    plain:
      "How pages are organised and linked, and how many clicks it takes to get from the homepage to any given page. Deeper pages get crawled less and rank worse.",
    detail:
      "A flat-ish architecture — most pages within three clicks of the homepage — helps crawling and distributes internal link equity. Hierarchy should follow how users think about the subject, not how the CMS stores it. Breadcrumbs make the hierarchy explicit to both users and crawlers.",
    realWorld:
      "A publisher's archive puts posts older than a month at click depth 8, reachable only through paginated listings. Those pages get crawled every few months. Adding topic hub pages linking to the best older content brought depth to 3 and revived traffic to articles that had been effectively invisible.",
  },
  {
    level: "senior",
    pillar: "technical",
    category: "Crawl & Index Control",
    title: "Faceted navigation",
    plain:
      "The filters on a category page — size, colour, price, brand. Each combination can generate a unique URL, which is how a 500-product shop ends up with two million crawlable URLs.",
    detail:
      "The classic solution is a decision per facet: which combinations are genuinely worth indexing (usually the ones with search demand, like &ldquo;red running shoes&rdquo;), which should be crawlable but not indexed, and which should not be crawlable at all. Implemented with a mix of canonicals, <code>noindex</code>, robots.txt parameter rules, and <code>rel=\"nofollow\"</code> on facet links.",
    realWorld:
      "Log analysis at a fashion retailer showed Googlebot spending 70% of its requests on multi-facet URLs nobody searches for. Allowing single-facet colour and size combinations while blocking everything deeper cut crawled URLs by 85% and halved the time new products took to index.",
    pitfall:
      "Blocking facets in robots.txt after they are already indexed leaves them indexed forever, for the same reason as any other robots-blocked page. Noindex first, let it process, then block.",
  },
  {
    level: "senior",
    pillar: "technical",
    category: "Architecture & Scale",
    title: "Site migrations",
    plain:
      "Moving a site to a new domain, new URL structure, new platform, or new design. It is the single highest-risk thing in SEO — most traffic disasters are botched migrations.",
    detail:
      "The non-negotiables: a complete old-to-new URL map with a 301 for every old URL, preserved page titles and content, updated internal links pointing directly at new URLs, an updated sitemap, and a change of address in Search Console for domain moves. Expect a temporary dip regardless; a 10–20% drop for a few weeks is normal, a 60% drop that does not recover is a redirect mapping failure.",
    realWorld:
      "A replatform mapped only the top 500 URLs by traffic and 404'd the rest, on the reasoning that the rest &ldquo;did not get traffic anyway&rdquo;. Those pages held the backlinks. Organic traffic fell 55% and took eight months to recover.",
    pitfall:
      "Never combine a migration with a redesign and a content rewrite. When traffic drops you will have no way of knowing which change caused it.",
  },
  {
    level: "senior",
    pillar: "technical",
    category: "Architecture & Scale",
    title: "Server log file analysis",
    plain:
      "Reading your web server's raw access logs to see exactly what search engine crawlers requested, when, and what they got back. It is the only source that shows crawler behaviour directly rather than inferring it.",
    detail:
      "Every request writes a line: IP, timestamp, URL, status code, user agent, bytes. Filtering to verified Googlebot (reverse-DNS the IP; the user agent alone is trivially spoofed) tells you which pages get crawled, how often, which return errors, and where crawl budget goes. No other tool shows this — Search Console's crawl stats are aggregated and sampled.",
    realWorld:
      "A site believed its blog was well crawled. The logs showed Googlebot hitting the same twelve category pages hundreds of times a day and individual posts once a month. The internal linking was funnelling everything to categories. Nothing in Search Console would have revealed that.",
    pitfall:
      "Verify the crawler. A large share of traffic claiming to be Googlebot is not, and drawing conclusions from spoofed hits produces confidently wrong answers.",
  },

  /* ---- Content & on-page (10) -------------------------------------------- */
  {
    level: "junior",
    pillar: "content",
    category: "On-Page",
    title: "Title tags",
    plain:
      "The clickable headline shown in search results, set with the <code>&lt;title&gt;</code> element. It is the strongest single on-page relevance signal and the main thing that decides whether anyone clicks.",
    detail:
      "Roughly 50–60 characters before truncation, though the real limit is pixel width. Put the primary term near the front, keep it a genuine description of the page, and make each one unique. Google rewrites titles for around a third of results when it thinks yours is unhelpful — a rewrite is feedback, not a bug.",
    realWorld:
      "Every page on a site had the title &ldquo;Home | Acme Ltd&rdquo; because the template never got finished. Writing unique, descriptive titles across 60 pages produced measurable impression growth within two weeks, with no other change.",
    pitfall:
      "Keyword stuffing the title (&ldquo;Plumber London | London Plumber | Plumbers in London&rdquo;) both reads badly and increases the chance Google replaces it.",
  },
  {
    level: "junior",
    pillar: "content",
    category: "On-Page",
    title: "Meta descriptions",
    plain:
      "The short summary under the title in search results. It is <b>not</b> a ranking factor — its only job is persuading someone to click.",
    detail:
      "Around 150–160 characters. Google ignores it and generates its own snippet more than half the time, usually when the page content answers the query better than your description does. Write it as ad copy: what the reader gets, and why this result rather than the other nine.",
    realWorld:
      "Two pages ranking at position 5 with the same impressions. The one with a description written as a benefit (&ldquo;A 12-step checklist you can run in an afternoon&rdquo;) had roughly double the click-through rate of the one describing the company.",
    pitfall:
      "Do not spend hours on meta descriptions for pages that rank badly. Fix the ranking first; CTR optimisation only pays once you have impressions.",
  },
  {
    level: "junior",
    pillar: "content",
    category: "On-Page",
    title: "Heading structure",
    plain:
      "The H1 to H6 elements that give a page its outline. They tell readers and search engines how the content is organised and what each part covers.",
    detail:
      "One H1 describing the page, H2s for main sections, H3s nested beneath them. The value is mostly structural rather than a direct ranking signal — a clear outline makes a page easier to parse, easier to extract a featured snippet from, and considerably more accessible to screen readers.",
    realWorld:
      "A long guide used styled <code>&lt;div&gt;</code>s for its section headings. Adding real H2s produced no ranking change but the page started winning featured snippets for its sub-questions, because Google could now identify discrete answerable sections.",
    pitfall:
      "Multiple H1s are not a penalty and never were. Do not spend time on it when the same hour could fix a genuine crawl problem.",
  },
  {
    level: "junior",
    pillar: "content",
    category: "Keyword Research",
    title: "Search intent",
    plain:
      "What someone actually wants when they type a query. The same words can mean &ldquo;explain this to me&rdquo;, &ldquo;let me buy this&rdquo;, or &ldquo;take me to that site&rdquo;, and the wrong format cannot rank however good it is.",
    detail:
      "Four broad types: <b>informational</b> (learn), <b>navigational</b> (go somewhere), <b>commercial</b> (compare before buying), <b>transactional</b> (buy now). The reliable way to determine it is not a tool's label but the SERP itself — whatever Google currently ranks <i>is</i> its judgement of the intent.",
    realWorld:
      "A team wrote a 3,000-word guide targeting &ldquo;best password manager&rdquo; and could not break the top 30. The SERP was entirely comparison listicles with tables. The intent was commercial-comparison, not instructional. Restructuring the same research as a comparison table reached page one in six weeks.",
    pitfall:
      "Never assume intent from the keyword alone. Search it, look at what ranks, and match the format before writing a word.",
  },
  {
    level: "junior",
    pillar: "content",
    category: "Keyword Research",
    title: "Keyword research on free tools",
    plain:
      "Finding the phrases people actually search for, and picking the ones you can realistically rank for. Paid tools make this faster but the free ones are enough to do it properly.",
    detail:
      "The free stack: <b>Search Console</b> is the best source you have, because it shows queries you already get impressions for — including ones you never targeted. Then Google autocomplete, People Also Ask, related searches at the SERP foot, and Bing Webmaster Tools' keyword data. Judge difficulty by looking at who ranks, not by a tool's number.",
    realWorld:
      "Filtering Search Console to queries with impressions above 100 and average position between 8 and 20 produces a list of pages that are close to page one already. Improving those beats writing new content, because the hard part — being indexed and relevant — is already done.",
    pitfall:
      "Search volume estimates are estimates, often wildly wrong for niche terms. A query with &ldquo;10 searches a month&rdquo; that converts is worth more than one with 10,000 that does not.",
  },
  {
    level: "mid",
    pillar: "content",
    category: "Content Quality",
    title: "Keyword cannibalisation",
    plain:
      "Two or more of your own pages competing for the same query, so neither ranks as well as one strong page would.",
    detail:
      "Diagnose it in Search Console: filter to a query and check how many of your URLs receive impressions for it, and whether the ranking URL keeps changing. Fixes, in order of preference: consolidate into one page and redirect, differentiate the intent so they target genuinely different queries, or canonicalise the weaker to the stronger.",
    realWorld:
      "A blog had four posts on &ldquo;how to build a home lab&rdquo; written over three years. All four hovered around position 15, and Google alternated between them. Merging them into one comprehensive guide and 301-ing the other three reached position 4 within a month.",
    pitfall:
      "Not every overlap is cannibalisation. Two pages ranking for the same query is fine if they serve different intents and both perform.",
  },
  {
    level: "mid",
    pillar: "content",
    category: "Content Quality",
    title: "E-E-A-T",
    plain:
      "Experience, Expertise, Authoritativeness, Trustworthiness — the framework Google's human quality raters use to judge whether content deserves to be trusted.",
    detail:
      "Not a ranking factor you can set. It is a description of what Google's systems are <i>aiming</i> at, drawn from the Search Quality Rater Guidelines. It matters most for <b>YMYL</b> (Your Money or Your Life) topics — health, finance, safety, legal. Made concrete: real named authors with credentials, cited sources, dates, a real about page, and demonstrable first-hand experience.",
    realWorld:
      "A finance site's traffic halved after a core update. Its articles were bylined &ldquo;Admin&rdquo; with no author pages and no sources. Adding named authors with genuine credentials, citations, and review dates preceded recovery over the following two updates.",
    pitfall:
      "You cannot add an &ldquo;E-E-A-T score&rdquo;. Adding an author box to thin, unoriginal content changes nothing.",
  },
  {
    level: "mid",
    pillar: "content",
    category: "On-Page",
    title: "Internal linking",
    plain:
      "Links from one page of your site to another. They are how crawlers find pages, how ranking signals flow around your site, and one of the few levers you fully control.",
    detail:
      "Descriptive anchor text tells Google what the target is about. Links from frequently-crawled pages pass more value. Orphan pages — no internal links at all — are effectively invisible regardless of quality. Unlike backlinks, this is entirely within your control and it is chronically underused.",
    realWorld:
      "A 400-page site had 60 orphan pages reachable only from the XML sitemap. They received almost no crawling and no traffic. Adding contextual links from related published articles brought most of them into the index within a month.",
    pitfall:
      "&ldquo;Click here&rdquo; anchors waste the strongest signal you can send. So does linking the same anchor to different destinations across the site.",
  },
  {
    level: "mid",
    pillar: "content",
    category: "Content Quality",
    title: "Thin and duplicate content",
    plain:
      "Thin content has little value of its own; duplicate content appears in more than one place. Both waste crawl budget and drag on the site's overall quality impression.",
    detail:
      "There is no duplicate content <i>penalty</i> — the effect is filtering, where Google picks one version and ignores the others. Common sources: manufacturer product descriptions used verbatim, location pages differing only by town name, and printer or AMP variants without canonicals. The fix is consolidation, canonicalisation, or genuine differentiation.",
    realWorld:
      "A trades directory generated 200 pages of &ldquo;Plumbers in {town}&rdquo; identical but for the town name. None ranked. Rewriting 20 of them with genuinely local content — actual firms, actual pricing, actual regulations — outperformed all 200.",
  },
  {
    level: "senior",
    pillar: "content",
    category: "Content Quality",
    title: "Content decay and refresh",
    plain:
      "Pages that used to perform slowly losing traffic as they age, competitors improve, and the information goes stale. Refreshing them is usually cheaper than writing new content.",
    detail:
      "Find it by comparing Search Console clicks for the same URLs across two comparable periods and sorting by decline. Then triage by cause: outdated facts, a SERP whose intent has shifted, competitors who published something better, or lost backlinks. Refresh means substantive updating — new data, restructuring for current intent — not changing the date.",
    realWorld:
      "A site with 300 posts found 40 accounting for 70% of the decline, all published 2–3 years earlier with statistics from before then. Updating those 40 recovered more traffic in six weeks than the previous quarter of new content.",
    pitfall:
      "Changing the published date without changing the content is transparent to Google and to readers, and it destroys trust when someone notices.",
  },

  /* ---- Authority & off-page (5) ------------------------------------------ */
  {
    level: "junior",
    pillar: "authority",
    category: "Links & Authority",
    title: "Backlinks",
    plain:
      "Links from other websites to yours. They remain one of the strongest ranking signals, because a link is a third party vouching for you in a way you cannot self-declare.",
    detail:
      "Quality dominates quantity by a wide margin. A link from a relevant, genuinely authoritative site is worth more than hundreds from directories. Signals that matter: the linking site's own authority, topical relevance, whether the link is editorial or paid, its position on the page, and its anchor text.",
    realWorld:
      "Two competing pages, both well optimised. One has 12 links from industry publications, the other 400 from directories and comment sections. The first outranks the second consistently — and the second is at risk of a manual action.",
    pitfall:
      "Buying links violates Google's spam policies and risks a manual action. &ldquo;Guest post packages&rdquo; and &ldquo;PBN links&rdquo; are buying links with extra steps.",
  },
  {
    level: "junior",
    pillar: "authority",
    category: "Links & Authority",
    title: "Anchor text",
    plain:
      "The visible, clickable words of a link. It tells search engines what the destination page is about — which is why manipulating it is both effective and dangerous.",
    detail:
      "A natural profile is mixed: branded (&ldquo;Acme&rdquo;), naked URLs, generic (&ldquo;this article&rdquo;), and some descriptive. A profile dominated by exact commercial phrases (&ldquo;cheap car insurance&rdquo; on 60% of links) is the classic manipulation footprint and a well-known trigger for Penguin-era filtering.",
    realWorld:
      "A site's link profile showed 70% exact-match commercial anchors, all from the same three low-quality blog networks, all acquired in one quarter. It received a manual action for unnatural links.",
  },
  {
    level: "mid",
    pillar: "authority",
    category: "Links & Authority",
    title: "Digital PR and earned links",
    plain:
      "Earning links by making something worth linking to — original research, a genuinely useful free tool, or data journalists want to cite — rather than asking for links.",
    detail:
      "The sustainable approach, because the links are editorial and therefore both higher value and lower risk. Formats that work: original survey or dataset, a free tool solving a real problem, and expert commentary supplied through services like journalist request platforms. Slower than buying links and it does not carry a penalty risk.",
    realWorld:
      "A security firm published an analysis of 50,000 breached passwords with a methodology anyone could reproduce. It earned links from national press and several universities — links no outreach campaign would have obtained.",
  },
  {
    level: "mid",
    pillar: "authority",
    category: "Links & Authority",
    title: "Toxic links and the disavow file",
    plain:
      "A way to tell Google to ignore specific links pointing at your site. It exists for cases where you cannot get harmful links removed.",
    detail:
      "Google has repeatedly said most sites never need it — its systems ignore spam links automatically. The legitimate use is narrow: you have an unnatural-links <b>manual action</b>, or you know you built manipulative links previously. Format is a text file uploaded in Search Console, with <code>domain:</code> entries preferred over individual URLs.",
    realWorld:
      "An agency disavowed 4,000 domains from a routine &ldquo;toxic link&rdquo; tool report on a site with no manual action. Traffic dropped — they had disavowed legitimate links the tool scored badly. Reversing it took months to recover.",
    pitfall:
      "&ldquo;Toxic link score&rdquo; is a vendor metric, not a Google one. Disavowing on the strength of it can do real damage. When in doubt, do nothing.",
  },
  {
    level: "senior",
    pillar: "authority",
    category: "Links & Authority",
    title: "Manual actions vs algorithmic suppression",
    plain:
      "Two different reasons traffic can collapse. A manual action is a human at Google penalising your site; algorithmic suppression is a ranking system judging you differently after an update. They look similar and are fixed differently.",
    detail:
      "A manual action appears in Search Console under Manual actions, names the problem, and requires a reconsideration request after fixing it. Algorithmic changes appear nowhere, correlate with a known update date, and recover only when the next update runs and your site is judged differently. Checking Search Console is therefore the first step in any traffic-drop investigation.",
    realWorld:
      "Traffic dropped 60% overnight. No manual action. The date matched a documented core update, and the loss concentrated on thin affiliate pages while product pages held steady. That combination identified the cause within an hour and pointed at the fix.",
    pitfall:
      "There is no way to appeal an algorithmic change and no reconsideration request for one. Anyone offering to &ldquo;get your penalty lifted&rdquo; without a manual action in Search Console is selling nothing.",
  },

  /* ---- Measurement (5) --------------------------------------------------- */
  {
    level: "junior",
    pillar: "measurement",
    category: "Measurement",
    title: "Search Console — the four metrics",
    plain:
      "Google's free tool showing how your site performs in search. It reports impressions, clicks, click-through rate, and average position — the only first-party ranking data that exists.",
    detail:
      "<b>Impressions</b>: your page appeared for a query. <b>Clicks</b>: someone clicked. <b>CTR</b>: clicks divided by impressions. <b>Average position</b>: mean rank across impressions, which can move for reasons unrelated to any page changing. Data is filterable by query, page, country, and device, and the combination of filters is where the real diagnosis happens.",
    realWorld:
      "Impressions up 40%, clicks flat. The site had started ranking for many broad queries at position 30+ where nobody clicks. Average position &ldquo;worsened&rdquo; while nothing had got worse — a pure mix effect, and reporting it as a decline would have been wrong.",
    pitfall:
      "Search Console position is averaged across every impression. A page can be first for its main query and show an average position of 18 because it also appears at 40 for a hundred others.",
  },
  {
    level: "junior",
    pillar: "measurement",
    category: "Measurement",
    title: "GA4 for organic traffic",
    plain:
      "Google Analytics 4 tracks what people do once they arrive. Search Console covers everything up to the click; GA4 covers everything after it.",
    detail:
      "Organic search is a default channel grouping. The essentials: sessions and users by landing page, engagement rate, and conversions. GA4 is event-based rather than session-based, which trips up anyone used to Universal Analytics. Note it will never tell you which <i>keyword</i> drove a visit — that has not been available since 2011.",
    realWorld:
      "A page bringing 5,000 monthly sessions with a 12% engagement rate and no conversions is a worse asset than one bringing 200 with a 60% engagement rate and 15 sign-ups. Reporting only sessions would have got the priority exactly backwards.",
    pitfall:
      "Search Console clicks and GA4 organic sessions never match. Different definitions, different attribution, ad blockers, consent banners. Use each for what it is good at rather than reconciling them.",
  },
  {
    level: "mid",
    pillar: "measurement",
    category: "Measurement",
    title: "Rank tracking and its limits",
    plain:
      "Monitoring where your pages rank for chosen queries over time. Useful for direction, misleading if treated as truth.",
    detail:
      "Results are personalised by location, device, history, and language, so there is no single &ldquo;position&rdquo; to measure. Trackers report a de-personalised approximation from a chosen location. Track a representative set rather than everything, and treat trend as the signal and any individual number as noise.",
    realWorld:
      "A client insisted rankings had &ldquo;collapsed&rdquo; because their tracker showed a fall from 3 to 11. Search Console clicks were unchanged. The tracker had switched to mobile SERPs, where the layout differed. Nothing had happened.",
  },
  {
    level: "mid",
    pillar: "measurement",
    category: "Measurement",
    title: "Vanity metrics vs business metrics",
    plain:
      "Numbers that look impressive but do not connect to anything the business cares about — and the ones that do.",
    detail:
      "Vanity: total impressions, keywords ranking, domain authority scores, and PageSpeed lab scores. Business: organic revenue or leads, conversions by landing page, non-branded organic clicks, and share of the queries that matter. The distinction matters most in reporting, where the wrong number gets a good programme cancelled.",
    realWorld:
      "A monthly report led with &ldquo;ranking for 12,000 keywords, up 3,000&rdquo;. Organic revenue was flat. The new rankings were all position 40+ for irrelevant long-tail terms. Leading with non-branded clicks and revenue would have shown the programme was not working, six months earlier.",
    pitfall:
      "&ldquo;Domain Authority&rdquo; and &ldquo;Domain Rating&rdquo; are third-party vendor scores. Google does not use them and does not have an equivalent.",
  },
  {
    level: "senior",
    pillar: "measurement",
    category: "Measurement",
    title: "Forecasting and the business case",
    plain:
      "Estimating what SEO work will return, in money, before it is approved. This is the skill that decides whether senior SEO roles get budget.",
    detail:
      "A defensible model: current non-branded clicks by query cluster, realistic position improvement, published CTR-by-position curves, existing conversion rate, and average order value — with the assumptions stated and a range rather than a single number. The credibility comes from making every assumption visible and challengeable.",
    realWorld:
      "&ldquo;We should fix the faceted navigation&rdquo; was declined twice. &ldquo;Our 12,000 filter URLs consume 70% of crawl budget; freeing it should index new products in 2 days rather than 21, worth roughly £40–90k annually at current conversion rates&rdquo; was approved the same week.",
    pitfall:
      "Never forecast a single confident number. Give a range, state the assumptions, and say what would make it wrong. A forecast that misses and was presented as certain destroys credibility for years.",
  },
];

/* -------------------------------------------------------------------------- */
/* Roles                                                                       */
/* -------------------------------------------------------------------------- */

export const ROLES: Role[] = [
  {
    level: "junior",
    title: "Junior — execution and measurement",
    titles: [
      "SEO Executive",
      "SEO Analyst",
      "SEO Assistant",
      "Digital Marketing Executive",
    ],
    items: [
      "Run technical audits with a crawler and triage what it finds",
      "Keyword research and content briefs for writers",
      "On-page optimisation — titles, descriptions, headings, internal links",
      "Set up and maintain Search Console and GA4, and check the data is trustworthy",
      "Monthly reporting on impressions, clicks, and rankings",
      "Fix the straightforward issues: broken links, missing metadata, redirect chains",
    ],
    probe:
      "Whether you understand the pipeline — crawling, rendering, indexing, ranking — and can tell which stage a problem sits at. Almost every junior interview question reduces to that.",
    signal:
      "Being able to say &ldquo;I would check Search Console's Pages report first, because if it is not indexed nothing else matters&rdquo; rather than jumping to keywords. Diagnosis order is the tell.",
  },
  {
    level: "mid",
    title: "Mid — ownership and diagnosis",
    titles: [
      "SEO Specialist",
      "SEO Manager",
      "Technical SEO Analyst",
      "Organic Growth Manager",
    ],
    items: [
      "Own a site's organic performance and its roadmap",
      "Diagnose traffic changes and distinguish cause from coincidence",
      "Server log analysis and crawl budget work on larger sites",
      "Plan and QA migrations and redirect maps",
      "Implement structured data and win rich results",
      "Brief developers in terms they can act on, and review what ships",
      "Content refresh programmes and cannibalisation cleanup",
    ],
    probe:
      "Whether you can investigate rather than guess. Expect an open-ended scenario — &ldquo;traffic dropped 40% last Tuesday, what do you do&rdquo; — where the answer they want is a systematic order of elimination, not a fix.",
    signal:
      "Asking clarifying questions before proposing anything: which pages, which queries, branded or not, does it match a known update date, was anything deployed. Candidates who jump straight to a solution fail this.",
  },
  {
    level: "senior",
    title: "Senior — strategy, forecasting, and influence",
    titles: [
      "Head of SEO",
      "SEO Director",
      "Principal / Lead Technical SEO",
      "Organic Acquisition Lead",
    ],
    items: [
      "Set the organic strategy and defend its budget with a forecast",
      "Prioritise across competing work using expected business value",
      "Own enterprise technical problems — crawl budget, faceted navigation, internationalisation",
      "Build monitoring so regressions are caught before they cost traffic",
      "Influence engineering and product roadmaps, where most SEO outcomes are actually decided",
      "Mentor the team and set the standards they work to",
    ],
    probe:
      "Whether you can translate SEO into money and get other teams to act. The technical questions get easier at this level, not harder — the hard ones are about prioritisation and persuasion.",
    signal:
      "Talking about trade-offs and opportunity cost rather than best practice. &ldquo;We did not fix that because the forecast did not justify the engineering time, and here is what we did instead&rdquo; is a senior answer.",
  },
];

/* -------------------------------------------------------------------------- */
/* Derived                                                                     */
/* -------------------------------------------------------------------------- */

export const FUNDAMENTAL_COUNT = FUNDAMENTALS.length;

export const FUNDAMENTAL_CATS = [
  ...new Set(FUNDAMENTALS.map((f) => f.category)),
];

export const PILLAR_COUNTS = FUNDAMENTALS.reduce<Record<string, number>>(
  (acc, f) => ({ ...acc, [f.pillar]: (acc[f.pillar] ?? 0) + 1 }),
  {}
);
