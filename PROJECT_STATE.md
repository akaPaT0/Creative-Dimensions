# Project state

## SEO and indexing (2026-10-28)

- Canonical production origin: `https://www.creativedimensionslb.com`. Vercel apex-domain routing uses a permanent 308 redirect to www, verified by HTTP. Domain routing is hosted configuration, not a Next.js redirect rule.
- Public product navigation uses `app/lib/product-url.ts`, sharing slug normalization with metadata and sitemap generation. Category cards, homepage features, catalog search and recommendations must use canonical category/slug paths. Recommendations carry the actual category. Product routes permanently redirect legacy unnormalized slugs.
- Custom quote has its own title, description and canonical via `app/custom-quote/layout.tsx`.
- Search Console domain property is `sc-domain:creativedimensionslb.com`; the non-www URL-prefix property excludes the www production host. Indexing report dated Oct 23: 5 indexed pages, 32 discovered/unindexed, 3 redirected, 1 historical redirect error. Live sitemap: 37 URLs including 26 products. No indexing improvement has been claimed yet.
- Crawl stats updated Oct 27: hosts report no problems; 489 requests in the last 90 days, 244 ms average response, discovery below 1%. Google has mainly refreshed existing URLs. A server outage is not established as the cause of the indexing backlog.
- Direct indexing requests failed twice because Google's reCAPTCHA service could not connect. Retry through Search Console when verification works; do not record a submission without Google's success confirmation.
- Local verification: production build including TypeScript, URL regression tests, focused ESLint, HTTP checks for legacy redirect, canonical fidget link, recommendation categories and custom-quote metadata passed. Production release/readback must be recorded in WORKLOG.md after deployment.

## Collaboration

- This change was isolated from the dirty original checkout. Original uncommitted auth/commerce changes were neither copied nor released. Do not reset or synchronize that checkout without inspecting its state.
- Commerce architecture and setup are documented in README.md. This SEO change does not alter auth, database access, checkout, pricing, orders or admin behavior.
