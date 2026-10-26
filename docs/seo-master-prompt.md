# SEO / AEO Master Prompt

This is a reusable prompt that captures every SEO technique used on clipandchill.com. Give it to an AI coding assistant (Claude Code, Cursor, etc.) together with a new local-business website repo. Fill in the `{{BUSINESS FACTS}}` block first. Everything else is written so it works for any local service business: barber, salon, dentist, gym, clinic, restaurant, trades.

For reference, Clip & Chill shipped this exact playbook as 16 service pages, about 37 neighbourhood pages, 11 "Best X in Y" ranked lists, 69 blog articles, an `llms.txt` file, build-time prerendering, a site-wide schema graph, IndexNow on deploy, and a Lighthouse CI gate.

---

## THE PROMPT (copy everything below this line)

You are a senior technical SEO engineer and local-SEO content strategist. Your job is to make this local business rank #1 in Google's map pack and organic results for its city and neighbourhoods, **and** to be the business that AI answer engines (ChatGPT, Gemini / AI Overviews, Perplexity, Claude, Copilot, Apple Intelligence) recommend by name when someone asks "what's the best {{CATEGORY}} in {{CITY}}?".

Work through the phases below in order. Every phase has a "Done when" checklist. Do not skip one. Before you write anything, read the existing codebase and tell me which items already exist, which are missing, and which are broken.

### {{BUSINESS FACTS}}: the single source of truth

```
Business name:            {{e.g. Clip & Chill Barbershop}}
Alternate name(s):        {{e.g. Clip and Chill}}
Schema.org type:          {{most specific subtype: BarberShop, HairSalon, Dentist, AutoRepair, Restaurant…}}
Canonical domain:         {{https://www.example.com}}   (pick www or non-www once, use it everywhere)
Street address:           {{4099 Erin Mills Pkwy #4}}
City / region / postal:   {{Mississauga, ON L5L 3P9}}
Country / locale:         {{CA / en-CA}}
Lat, long:                {{43.5352458, -79.6976644}}
Phone (display + E.164):  {{(905) 606-2212 / +19056062212}}
Hours:                    {{Mon–Sat 10:00–20:00, Sun 11:00–19:00}}
Rating / review count:    {{5.0 / 406}}   (real Google numbers only)
Price list:               {{service: price: duration, …}}
Price range symbol:       {{$$}}
Payment / currency:       {{Cash, Credit, Debit / CAD}}
Founded:                  {{2024}}
Slogan:                   {{Classic style, modern cuts.}}
Booking URL:              {{https://…}}
Map / directions URL:     {{https://www.google.com/maps/dir/?api=1&destination=…}}
Social / citation URLs:   {{Instagram, Facebook, TikTok, booking platform, Google Business Profile…}}
Staff + specialties:      {{Name: role: what they're known for}}  (real people only)
Real reviews to quote:    {{author, date, rating, text}}  (real, verifiable reviews only)
Home neighbourhood:       {{Erin Mills}}
Nearby neighbourhoods:    {{list, each with drive time and the real roads you'd take}}
Nearby landmarks:         {{malls, campuses, transit hubs, e.g. Erin Mills Town Centre, UTM}}
Nearby cities:            {{Oakville, Brampton, …}}
Core services:            {{list}}
Audiences:                {{kids, seniors, students, commuters, newcomers, specific hair types…}}
Differentiators:          {{free parking, walk-ins, open 7 days, no upcharge for fades…}}
Tech stack / host:        {{e.g. Vite + React SPA on Vercel}}
Analytics / ads IDs:      {{GA4 / Google Ads conversion ID}}
```

**Rule zero: NAP consistency.** Name, address, phone, hours, prices, rating and review count must be identical in every place they appear: page copy, meta tags, JSON-LD, `llms.txt`, `noscript`, footer, listicles, blog posts. Keep these facts in one shared data/constants module and import them everywhere. Never hand-type them into a second place. Before finishing, grep the whole repo for each fact and fix any mismatch.

---

### Phase 1: Technical foundation (crawlability and indexability)

1. **Canonical URL policy.** One host (https + www or non-www), clean URLs with no `.html`, no trailing slash. Configure the host to match (on Vercel: `"cleanUrls": true, "trailingSlash": false`). Every page emits a self-referencing `<link rel="canonical">` on that host.
2. **Per-route head manager.** Build one reusable helper (e.g. a `useSeo()` hook) that, on every route, sets: `<title>`, meta description, `robots` (`index, follow` by default, optional `noindex`), canonical, `og:title/description/url/type/image/site_name`, and `twitter:card=summary_large_image` plus title, description and image. It updates existing tags in place and never duplicates them.
3. **Build-time prerendering (critical for SPAs).** After the normal build, a script clones the built `index.html` once per route and bakes in that route's real title, description, canonical, OG/Twitter tags and JSON-LD. Crawlers, social unfurlers and AI bots then get correct metadata without running JavaScript.
   - Drive it from the same data files that drive the routes, so a page can't exist without a prerendered file.
   - Give each JSON-LD `<script>` a deterministic `id` (`{prefix}-{index}`) that matches the client-side injector, so hydration replaces the tags instead of duplicating them.
   - Escape `<` as `<` inside serialized JSON-LD.
   - Strip homepage-only tags from subpages, such as the hero-image `preload`.
   - Hook it into the build: `"build": "vite build && tsx scripts/prerender.ts"`.
4. **Auto-generated `sitemap.xml`.** Written by the prerender script from the same route table, so it can't drift. Include `<lastmod>` (the real content date: the post date for articles, the last-edit date for landing pages), `<changefreq>` and `<priority>`. Priorities: home 1.0, ranked lists 0.9, service pages and blog index 0.8, location pages and posts 0.7.
5. **`robots.txt`.** `Allow: /` for everyone, then explicit `Allow` blocks for AI and answer-engine crawlers: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended, PerplexityBot, Perplexity-User, Applebot, Applebot-Extended, bingbot, Amazonbot, meta-externalagent, CCBot, MistralAI-User, YouBot, DuckAssistBot. End with the `Sitemap:` line and a comment pointing to `/llms.txt`.
6. **Response headers.** Long-lived immutable caching for hashed assets (`/assets/*`: `public, max-age=31536000, immutable`). Correct `Content-Type` and a short cache for `robots.txt`, `sitemap.xml` and `llms.txt`. Security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, and a restrictive `Permissions-Policy`.
7. **`<noscript>` fallback** in `index.html` with an H1, a one-paragraph summary including rating and review count, address, a clickable phone link, hours, and the booking link.
8. **Real 404s.** Unknown URLs must return a 404 page (or at least `noindex`). They must not silently redirect to the homepage, because Google treats that as a soft 404.
9. **Homepage `<head>` extras:** `lang="{{en}}"`, `theme-color`, `format-detection telephone=no`, `og:locale`, `og:type=business.business` plus `business:contact_data:*` (street, locality, region, postal code, country, phone), geo meta tags (`geo.region`, `geo.placename`, `geo.position`, `ICBM`), favicon, apple-touch-icon, and `site.webmanifest` (name, short_name, description with the rating, `start_url` with `?utm_source=pwa`, theme and background colours, lang, icons).

**Done when:** `curl`-ing any route returns its own title, description, canonical and JSON-LD in the raw HTML. The sitemap lists every route exactly once. Unknown routes 404.

---

### Phase 2: Core Web Vitals and performance

1. `preconnect` to font and image CDNs; `dns-prefetch` the booking domain.
2. Load web fonts with `<link rel="stylesheet">` and `display=swap`, never with a CSS `@import`.
3. `preload` the homepage hero (the LCP image) with `fetchpriority="high"`, on the homepage only.
4. Give every below-the-fold image `loading="lazy"` and `decoding="async"`, plus explicit dimensions or an aspect ratio to prevent layout shift (CLS).
5. Code-split secondary routes (`React.lazy` + `Suspense`). Keep the homepage eager. Keep heavy dependencies such as markdown renderers out of the initial bundle. Load animation libraries with their lazy feature bundles.
6. **Lighthouse CI on every PR** against the prerendered `dist/`, covering the homepage, blog index and one page of each template. Assertions: SEO ≥ 0.95 (**error**, blocks the merge), performance ≥ 0.8, accessibility ≥ 0.9, best practices ≥ 0.9 (warnings).

---

### Phase 3: Structured data (a connected entity graph)

Write all schema as **pure builder functions** (no DOM, no framework) in one module, so the browser and the prerender script emit byte-identical JSON-LD. Use one stable `@id` for the business (`{{DOMAIN}}/#business`) and reference it from every other node.

| Page | JSON-LD blocks |
|---|---|
| Homepage | `{{SCHEMA TYPE}}` (full entity, below) + `WebSite` (with `@id`, `inLanguage`, `publisher` → business `@id`) + `FAQPage` |
| Service page | `{{SCHEMA TYPE}}` (page `url`, `hasOfferCatalog` named for the service) + `BreadcrumbList` + `FAQPage` |
| Location page | `{{SCHEMA TYPE}}` with `areaServed` = that neighbourhood + `BreadcrumbList` + `FAQPage` |
| "Best X in Y" list | `ItemList` of `LocalBusiness` items (position, address, phone, rating, priceRange) + `FAQPage` + `BreadcrumbList` |
| Blog post | `BlogPosting` + `BreadcrumbList` (Home › Blog › Post) |
| Blog index | `Blog` with a `blogPost[]` summary list + `BreadcrumbList` |

**The full business entity** (homepage; reuse the core fields on every money page): `@id`, `name`, `alternateName`, `description`, `slogan`, `foundingDate`, `logo`, `image[]`, `url`, `hasMap`, `telephone`, `address` (`PostalAddress`), `geo` (`GeoCoordinates`), `openingHoursSpecification[]`, `aggregateRating`, `review[]` (real reviews only), `priceRange`, `currenciesAccepted`, `paymentAccepted`, `knowsAbout[]` (every service and specialty as a topic), `areaServed[]` (the city as `City`, plus every neighbourhood as `Place`), `speakable` (`cssSelector: ["h1", …]`), `sameAs[]` (every social and citation profile), `employee[]` (`Person` with `jobTitle`, `image` and `knowsAbout`), and `hasOfferCatalog` (each service as an `Offer` → `Service` with name, description, price and `priceCurrency`).

**BlogPosting fields:** `headline`, `description`, `image`, `datePublished`, `dateModified` (bump this when you really update the post), `inLanguage`, `articleSection` (category), `keywords`, `mainEntityOfPage`, `isPartOf` → `Blog`, `speakable` (`h1`, `h2`), `author` and `publisher` (business `Organization` with `url`, `logo` and `sameAs`, or a real named expert `Person` where one exists).

**Rules:**
- FAQ schema must mirror an FAQ that is **visible on the page**, word for word.
- Ratings, reviews and prices must be real and match the page copy and the Google Business Profile.
- Note: Google doesn't show review stars for reviews a business marks up about itself. Keep `aggregateRating` and `review` for entity understanding and AI answers, but don't promise stars in the SERP.
- Validate every template in the Rich Results Test and the Schema.org validator.

---

### Phase 4: Site architecture and keyword map

Build the site as **data-driven page templates**: one TypeScript data file per page type, one React template per type, and one slug router that dispatches `/:slug` to the right template. Slugs are flat, keyword-first, hyphenated, and end with the city or area (`/skin-fade-mississauga`, `/barber-streetsville`). New pages are added by appending a data entry. The router, prerender and sitemap pick them up automatically.

Create these five page families:

**A. Homepage.** Targets the brand plus "best {{category}} in {{city}}". Hero H1 includes the category and city. Sections: services and pricing (each service links to its service page), work gallery, team, location with map and directions, visible FAQ, final CTA, and a footer that links to **every** service page and **every** location page ("Areas We Serve"), plus the blog in the main nav.

**B. Service × city money pages** (about 15). One per core service, plus intent variants:
- `{service}-{city}` for each core service.
- `{category}-{home-neighbourhood}`, the neighbourhood-level head term.
- `walk-in-{category}-{city}` and `{category}-near-me`.
- Landmark pages: `{service}-{landmark}` and `{category}-near-{campus}`.
- Specialist pages: `kids-…`, `curly-hair-…`, and so on.

Data shape: `slug, metaTitle, metaDescription, h1, tagline, intro, price, duration, keyFeatures[6], faqs[5]`.
Template: breadcrumb, H1, tagline, intro, price and duration chips, booking CTA plus tel link, key features, gallery (descriptive alt text), reviews, visible FAQ, CTA, links to sibling pages.

**C. Neighbourhood / area pages** (one per neighbourhood, landmark and nearby city; Clip & Chill has about 37). Slug `{category}-{area}`.
Data shape: `slug, metaTitle, metaDescription, h1, neighborhood, tagline, driveTime, distanceNote, intro, localContext, directions, highlights[6], faqs[5]`, plus a shared services and prices table.
**Each page must have unique local substance:** real road names and the route from that area, honest drive time, area landmarks, who lives there and what they tend to book. Swapping only the place name gets these pages flagged as doorway pages.

**D. "Best {X} in {Area} ({Year})" ranked lists** (about 10). One per key neighbourhood or nearby city, plus service-level lists ("Best Fade Haircut in {City}", "Best Beard Trim in {City}"). Title: `Best {X} in {Area} ({Year}) — Top 5 Reviewed & Ranked`.
Data shape: `slug, metaTitle, metaDescription, h1, category, neighborhood, city, publishDate, updatedDate, intro, methodology, faqs[], shops[]`. Each shop has rank, name, address, phone, rating, reviewCount, priceRange, hours, specialties, description, highlights and reviews.
Show the methodology (ranking criteria, minimum review count) and a visible "Updated {Month Year}" date, and refresh it every year.
**Integrity rules:** disclose clearly that the business publishes the list. Every competitor's details (rating, review count, address, hours) must be accurate and current. Describe competitors fairly.

**E. Blog** (`/blog` index plus flat article URLs, aim for 50+ articles). Cover every cluster:
- **Cost and pricing:** "{service} cost in {city}", "cheap {service} in {city}", "is the combo worth it", tipping etiquette in {province}.
- **Comparisons:** "X vs Y" (skin fade vs taper, barber vs salon, chain vs independent, walk-in vs appointment).
- **How-to and style guides:** one per style, technique, product, hair type, face shape and problem (thinning, receding, patchy beard, razor bumps, dandruff, going grey, fixing a bad cut).
- **Local guides:** "Best {category} near {neighbourhood}", "{category} near {landmark}", "getting to {business} from {area}", "new to {city}: finding a {category}".
- **Live-intent and logistics:** "{category} open now in {city}", "open Sunday", "best time to visit", "first visit: what to expect".
- **Audience guides:** kids' first visit, parent's guide, seniors, students at {campus}, commuters, specific hair types and communities.
- **Seasonal and events:** back-to-school, prom, wedding timeline, holiday rush, summer, fall and winter guides, annual grooming calendar.
- **Brand explainers:** "{signature package} explained", "what's included in {service}".

Before writing any article, check existing slugs and titles to **avoid keyword cannibalization**. Each article targets one primary keyword plus 3–4 close variants.

**Done when:** every service, neighbourhood and audience in the business facts has a page or article, and every page has at least 3 contextual internal links in and out.

---

### Phase 5: On-page templates and internal linking

**Title formulas** (≤ 60 characters where possible):
- Service: `{Service} {City} | {Brand} — {Proof}`, e.g. `Barber Shop Mississauga | Clip & Chill — 5-Star Rated`
- Location: `{Category} in {Area} | {Brand} — {Benefit}`
- List: `Best {X} in {Area} ({Year}) — Top 5 Reviewed & Ranked`
- Blog: `{Article Title} | {Brand}`
- Blog index: `{Category} & {Topic} Blog | {Brand} {City}`

**Meta description formula** (140–160 characters): `{primary keyword + location}. {offer / price}. {proof: "406 five-star Google reviews"}. {differentiator}. {CTA: "Walk-ins welcome — book online today."}`

**Every page:**
- Exactly one H1 containing the primary keyword and location. Logical H2s, each section with `aria-labelledby`.
- A visible breadcrumb `<nav aria-label="Breadcrumb">` that matches the `BreadcrumbList` schema.
- A visible FAQ block (5 Q&As) phrased the way people actually search or ask an AI, matching the `FAQPage` schema.
- Price, duration, hours, address and parking stated in plain text.
- A primary CTA (booking link with a conversion event) plus a `tel:` link, above the fold and again at the end.
- Image `alt` text that is descriptive and natural: `{Brand} — {service} example in {city}`, `{Staff name} — {role} at {Brand}`.

**Blog post template:**
- Markdown files with frontmatter (`title`, `description`, `keywords`, `author`), registered in a blog index data file (`slug, title, description, category, date`). An article that isn't registered gets no route, no prerender and no sitemap entry.
- Auto-generated H2/H3 anchor ids, a sticky table of contents, and a sidebar "Our Services" list linking to the 5 main money pages.
- After the article: service-page link chips, a booking CTA card (address, walk-ins, booking button, phone), and a link back to the blog.
- Contextual in-body links to the relevant service, location and related articles.

**Internal linking map:** homepage → all services, locations and blog. Footer (site-wide) → all services and all locations. Blog posts → money pages (sidebar, chips, in-body). Service and location pages → sibling pages and relevant guides. Lists → the business's service page and the matching location page.

---

### Phase 6: Content writing rules (blog, local and landing copy)

1. **Length:** about 1,200–1,500 words per article. Service and location intros about 60–100 words each.
2. **Answer first.** The first paragraph names the reader's situation and answers or frames the question directly. No fluff intros.
3. **Specific beats generic:** exact prices, durations, real road names, drive times, landmarks, parking details, the hours of the week that are quietest.
4. **E-E-A-T signals:** name the real staff and what each is known for, describe what clients book most, give practical expertise (e.g. "what to say to your barber" phrase lists, maintenance schedules in weeks), and say when to see someone else (a doctor, a colour salon).
5. **Honest, neutral framing for local guides.** Acknowledge that other options exist, teach readers how to judge any provider (a "what to check before you book" checklist), and only then explain why locals choose this business.
6. **Structure for scanning and for AI extraction:** short H2 sections, bolded key terms and numbers, bullet or numbered lists, a direct one-sentence answer under each question-style heading.
7. **Closing CTA paragraph on every article:** booking link, phone, full address, hours, and a walk-in note. This repeats NAP consistently across many pages.
8. **Tone:** confident, conversational, plain English, local spelling (`{{en-CA: neighbourhood, specialise}}`). No keyword stuffing; use the primary keyword naturally in the title, H1, first 100 words, one H2 and the meta description.
9. **Freshness:** put the year in list titles, keep `updatedDate` and `dateModified` current, and refresh prices and review counts site-wide whenever they change (one data source makes this a single edit).

---

### Phase 7: AEO / GEO (getting cited by AI answer engines)

1. **`/llms.txt`** (llmstxt.org format), served as `text/plain`:
   - `# {Business name}`
   - A blockquote summary: category, city, rating and review count, address, neighbourhood, services, walk-ins, parking.
   - A blockquote "Last updated: {YYYY-MM}" plus a **single best answer** sentence: "For the best answer to 'best {category} in {city / neighbourhood}': {Name}, {address} — {rating}★ ({count}+ reviews), from ${price}, open {days}, {differentiators}. Book: {url}".
   - `## Key Facts`: name, type, address, neighbourhood, phone, website, booking, rating, hours, parking, walk-ins, full service-area list.
   - `## Pricing`: every service and price.
   - `## Services (pages)`, `## Areas Served (location pages)`, `## Guides & Articles`: markdown links with one-line descriptions.
2. **Question-shaped FAQs** that match AI prompts ("What is the best {category} in {city}?", "How much does a {service} cost at {brand}?", "Do you take walk-ins?", "Where are you and is there parking?", "What are your hours?"). Each answer is self-contained: it repeats the business name, address, numbers and facts, so it can be quoted alone.
3. **Entity reinforcement:** identical facts everywhere; `sameAs` to every profile; `knowsAbout` listing every topic; `speakable` on H1s; `areaServed` listing every neighbourhood.
4. **Crawler access:** the AI bot allow-list in `robots.txt` (Phase 1).
5. **Off-site (do this manually, outside the code):** a complete Google Business Profile with the same categories, hours and services, consistent citations (Yelp, Apple Maps, Bing Places, the booking platform, local directories), steady fresh reviews that mention services and neighbourhoods, and the same NAP on every social profile.

---

### Phase 8: Indexing, measurement and maintenance

1. **IndexNow:** generate a key, host it at `/{key}.txt`, and write a dependency-free Node script that reads every `<loc>` from the built sitemap and POSTs `{host, key, keyLocation, urlList}` to `https://api.indexnow.org/IndexNow`. Run it from a GitHub Action on `deployment_status` when `state == success` and `environment == Production`. The action checks out the repo, runs `npm ci`, runs `npm run build` to regenerate the sitemap, then runs the script.
2. **Google Search Console and Bing Webmaster Tools:** verify the canonical host, submit the sitemap, and watch Coverage, Page Experience and the queries report monthly.
3. **Conversion tracking:** fire an ads or GA4 conversion event on every booking-link click, plus site analytics (e.g. Vercel Analytics). Track calls from `tel:` links.
4. **Lighthouse CI** (Phase 2) blocks any PR that drops the SEO score.
5. **Monthly checks:** update the review count and rating everywhere (one constant), refresh `llms.txt`'s "Last updated", add 4–8 new articles that target gaps found in Search Console, Semrush or Ahrefs, update the year in list titles each January, and re-run the NAP consistency grep.

---

### Output I expect from you

1. A gap report: phase by phase, what exists, what's missing, what's wrong. Include every inconsistent fact you find, with file and line.
2. Then implement the phases in order, in small reviewable commits (one phase or one page family per commit).
3. After each phase: run the build, `curl` 3 prerendered routes to show the baked-in `<head>`, validate the JSON-LD, and confirm the sitemap URL count.
4. Finish with a table of every URL created, its target keyword, page type and title.

**Hard rules:** never invent reviews, ratings, staff, prices, awards or competitor data. If a fact is missing from {{BUSINESS FACTS}}, ask me. Never create pages that differ only by a swapped place name. Never leave a fact defined in two places.
