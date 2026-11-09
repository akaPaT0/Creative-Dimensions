# Project state

## Halloween collection (2026-11-09)

- Owner authorized production publication of eight prepared products under `/shop/halloween`: Ghost Candy Bowl $20, Stitched Skull Candy Bowl $20, Pumpkin Candy Bowl $15, Skull Pot $13, Screaming Ghost Candy Bowl $22, Flexi Skeleton $7, Bat Wall Decor Pack $5 per pack, and Halloween Coffin Lantern $11 each. Coffin variants are Green Bats, Orange Ghosts and Red Spiderweb, using the existing image-linked selection/cart flow. Other products retain their single approved colour.
- Published eight new Supabase rows HA001–HA008 and 22 public lossless WebP images under product_images/halloween. Readback verified the 26 existing product rows were unchanged (34 total). Every uploaded hash matches a pixel-identical conversion of the approved original-photo-v2 export over the exact original 2.png background.
- Category/product routes reuse CategoryPage and ProductPage. Halloween is included in shop filters, footer, admin category choices, metadata labels and sitemap. `catalog/halloween-2026.json` records the public rows, assets and hashes; scripts/publish-halloween.mjs is an insert-only dry-run-by-default publisher, and scripts/verify-halloween.mjs audits storefront routes and variant mapping.
- Local source photos, layered artwork and draft JSON remain under C:/Users/Patrick/Desktop/CreativeDimensions/Creative-Dimensions/product-drafts. Unconfirmed dimensions, bat count beyond four designs, mounting supplies, sweets and lantern light/power details are omitted from product claims. Google sign-in remains outside this release.
- Code f2c1e35 is on main. Vercel production deployment dpl_HGs5MPzyWUnZv8hhx4kaUCH7uj7G is READY and serves www/apex. Production build/TypeScript, existing URL tests and manifest variant/cart checks passed. Local and live HTTP verification passed for all eight product pages, category, prices, canonical URLs, gallery references, lantern options, sitemap, existing pages and Next image optimization. Google /auth/google remains 404. New/clean touched files pass lint; two existing files retain pre-existing any-type lint errors (category edits add one line each).

## Sign-in navigation (2026-11-09)

- Standalone sign-in and sign-up pages send authenticated users to `/user` after the auth provider finishes loading. A successful login no longer leaves the closed form on the sign-in landing page.

## Shop password recovery (2026-11-08)

- Password recovery is live from code commit `23a4e7a`. Verified READY Git deployment `dpl_2cC8FETkFDLdjQ3JUf5ygPgNVNe6` serves www and apex. Production `CD_RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are configured. The live bot check completed, and Resend confirmed delivery from Creative Dimensions <support@creativedimensionslb.com> with the canonical reset link.
- Recovery links point to the canonical shop and keep the one-time Supabase token in the fragment. The server consumes it when the customer submits the new password. Customers sign in again after success.
- Google sign-in is being developed on codex/creative-dimensions-google-sign-in. Production continues to use the existing shop sign-in and account session.

## SEO and indexing (2026-10-28)

- Canonical production origin: `https://www.creativedimensionslb.com`. Vercel apex-domain routing uses a permanent 308 redirect to www, verified by HTTP. Domain routing is hosted configuration, not a Next.js redirect rule.
- Public product navigation uses `app/lib/product-url.ts`, sharing slug normalization with metadata and sitemap generation. Category cards, homepage features, catalog search and recommendations must use canonical category/slug paths. Recommendations carry the actual category. Product routes permanently redirect legacy unnormalized slugs.
- Custom quote has its own title, description and canonical via `app/custom-quote/layout.tsx`.
- Search Console domain property is `sc-domain:creativedimensionslb.com`; the non-www URL-prefix property excludes the www production host. Indexing report dated Oct 23: 5 indexed pages, 32 discovered/unindexed, 3 redirected, 1 historical redirect error. Live sitemap: 37 URLs including 26 products. No indexing improvement has been claimed yet.
- Crawl stats updated Oct 27: hosts report no problems; 489 requests in the last 90 days, 244 ms average response, discovery below 1%. Google has mainly refreshed existing URLs. A server outage is not established as the cause of the indexing backlog.
- Direct indexing requests failed twice because Google's reCAPTCHA service could not connect. Retry through Search Console when verification works; do not record a submission without Google's success confirmation.
- Released code: `e2bda8f` on main, verified READY production deployment `dpl_6kXE974AFCpdN9Xxgy3pWWpei2kE`. Production audit passed all 37 sitemap URLs, including all 26 products, with no observed canonical, status, noindex or JSON-LD parsing failures. The fidget product now has canonical links from two audited pages; all products have inbound links in the audited HTML.
- Local verification: production build including TypeScript, 3 URL regression tests, focused ESLint and HTTP checks passed. Deployed HTTP checks also passed for old-slug 308, canonical fidget link, recommendation categories and custom-quote metadata.
- Google confirmed successful resubmission of `https://www.creativedimensionslb.com/sitemap.xml` on Oct 28. This does not confirm indexing. Individual indexing requests remain blocked by reCAPTCHA connectivity; no automatic follow-up has been scheduled.

## Collaboration

- This change was isolated from the dirty original checkout. Original uncommitted auth/commerce changes were neither copied nor released. Do not reset or synchronize that checkout without inspecting its state.
- Commerce architecture and setup are documented in README.md. This SEO change does not alter auth, database access, checkout, pricing, orders or admin behavior.
