# Decisions

## 2026-10-28 - Canonical product navigation

- Keep www as the existing canonical production host. Use Vercel's permanent 308 apex-to-www redirect; preserve path and query.
- Reuse one lightweight product URL helper for server and client navigation. Preserve the established slug normalization used by product lookup, metadata and sitemaps; do not rewrite stored product data.
- Pass categories into recommendation cards instead of assuming keychains. Redirect legacy noncanonical product slugs permanently after confirming the product exists.
- Address demonstrated URL/navigation defects without claiming that they alone explain Google's scheduling. Indexing and branded sitelinks remain Google-controlled outcomes.
