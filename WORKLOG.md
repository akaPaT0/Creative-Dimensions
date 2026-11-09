# Worklog

## 2026-11-09 - Publish the prepared Halloween product batch

- Owner requested all prepared products in production and proposed Halloween as the category. Added category, product and metadata routes using the shared storefront components, plus Halloween in the shop tabs, footer, admin category choices and sitemap. Kept unfinished Google work separate by starting codex/halloween-release from main 8c94b4e.
- Prepared the public catalog manifest and scripts/publish-halloween.mjs. Converted all 22 approved original-photo-v2 exports to lossless WebP and verified pixel equality and upload hashes. Backed up the catalog locally, atomically inserted HA001–HA008 and verified readback: eight listings, three coffin choices at $11 each, correct other prices/colours, 34 total products and all 26 prior rows unchanged.
- Production build/TypeScript, three existing URL tests and image-linked variant/cart mapping checks passed. Local HTTP checks passed for all eight product pages, category, canonical URLs, prices, gallery references, lantern options, refreshed sitemap, existing pages and Next image optimization. Focused lint passed for new files and clean touched files. Existing any-type violations remain in ShopCatalogClient and AdminProductForm; lint with that existing rule disabled reports two existing warnings. No auth, checkout or schema changes. Git-based deployment and live readback are the remaining release steps at this entry.
- Released code f2c1e35 to main. Vercel deployment dpl_HGs5MPzyWUnZv8hhx4kaUCH7uj7G is READY on www/apex. The same full storefront HTTP audit passed against production, including all eight products and their prices, category, canonicals, galleries, lantern options, sitemap, existing pages and optimized image delivery. Google /auth/google is 404. Original draft statuses were changed to published and now include production SKU, image URLs, product links and deployment evidence.

## 2026-11-09 - Redirect successful sign-in to the account

- Owner reported staying on the sign-in landing page after the form closed. Added auth-state navigation to `/user` in the standalone sign-in and sign-up pages. Applied the same two-file fix to the localhost:3002 checkout.
- TypeScript, focused ESLint and route-component checks passed for authenticated, signed-out, loading and manual-close cases. Local browser automation is disabled in Work settings, so a real interactive login was not exercised for this change.

## 2026-11-09 - Verify the production password reset release

- Owner requested a commit and production push for shop password recovery, with Google sign-in kept on a branch. Main contains release commit `23a4e7a`. Git deployment `dpl_2cC8FETkFDLdjQ3JUf5ygPgNVNe6` was READY on www and apex when checked. Production sender and Turnstile variables are configured.
- Production build, focused lint and three existing product URL tests passed. A disposable Supabase account confirmed password update, sign-in with the new password, and rejection of token reuse. The fixture was deleted. The staged endpoint rejected missing bot verification. The live form completed Turnstile, and Resend reported delivery from support@creativedimensionslb.com with the canonical reset link. Live /auth/google returned 404. The deployment error-log query returned no entries.
- The original checkout is on `codex/creative-dimensions-google-sign-in`. Its unfinished auth/session and admin changes are separate from the production release.

## 2026-11-08 - Release shop password recovery separately

- Owner requested committing and pushing the branded password reset, with Google sign-in excluded from production. Based the release on the latest main in codex/shop-password-reset and preserved existing sign-in, signup, and account sessions. Moved the original checkout with its pending work to codex/creative-dimensions-google-sign-in.
- Updated the sign-in modal, reset page, recovery API routes, and password and bot checks. Configured the domain-restricted Resend key and shop Turnstile widget for Vercel production. The recovery route validates the one-time token when saving the new password and keeps the temporary session server-side.

## 2026-10-28 - Product indexing repair

- Request: investigate poor product indexing, then perform the necessary fixes.
- Audit: signed-in Search Console domain report (Oct 23) lists 5 indexed / 36 excluded URLs. Indexed pages are Home, Shop, About, Contact and Shotgun Shell lighter cover. Main backlog: 32 discovered/unindexed. Both sitemap submissions report Success. Live sitemap contains 37 URLs / 26 products; all return 200 with Product schema on product pages, correct canonicals and no observed noindex. Custom quote lacked its own canonical/title. Google live-tested Ghost lighter cover successfully with valid product/merchant/breadcrumb markup; optional `validFrom` warning is not a blocker. Performance July 27-Oct 26: 16 site clicks / 316 site impressions; Shotgun product 43 impressions / 0 clicks.
- Crawl stats (updated Oct 27, last 90 days): 489 requests, 244 ms mean response; host status No problems; 92% responses 200, 2% 404, 99% refresh and less than 1% discovery. Does not establish host reliability as root cause.
- Hosted fix: changed verified Vercel apex redirect from default temporary 307 to explicit 308 to existing www target. Readback and HTTP verified. Initial PATCH of status alone unexpectedly cleared redirect; immediately restored target and status together, then verified. No DNS, project ownership or security changes.
- Code: `app/lib/product-url.ts` centralizes product paths; public home/catalog/category/search links use it; product route pages redirect old slug spellings; RecommendedRow receives actual product categories instead of hardcoding keychains; custom-quote layout adds metadata. Stored slugs/product data remain untouched. Shared context added in PROJECT_STATE.md and DECISIONS.md.
- Checks: production build and TypeScript passed; 3 Node URL regression tests passed; focused ESLint passed for URL helper, metadata, RecommendedRow and custom-quote layout; git diff whitespace check passed. Local built-server HTTP checks confirmed fidget card canonical link, old slug 308 to canonical then 200, accessory recommendations use accessories, quote canonical present. First uncached Node fetch observed a duplicate identical Location header; subsequent curl and fetch checks, including alternate old spellings, returned one correct location and followed to 200.
- Isolation: created branch `codex/product-indexing` from verified production/main `cbc3188` in a managed worktree. Original checkout's unrelated dirty auth/commerce files were preserved. No credentials committed; production env downloaded only to ignored local env file for build.
- Search Console actions: indexing request for www `/shop/keychains` failed twice (including after reload) because reCAPTCHA could not connect. No successful individual indexing submission is claimed. Canonical sitemap resubmission and production deployment/readback still pending at this entry.

### Release and readback

- Published `e2bda8f` to GitHub main; remote SHA verified. Vercel deployment `dpl_6kXE974AFCpdN9Xxgy3pWWpei2kE` is READY, target production, with matching Git SHA and www/apex domain aliases.
- Post-release live HTTP audit: 37/37 sitemap URLs return 200, with matching canonical URLs and no observed noindex or JSON-LD parse failures; all 26 products carry Product markup. Fidget canonical URL now has inbound links from two audited HTML pages (previously none). No orphan product URLs remain within this audited set.
- Production regression checks passed: old fidget slug returns 308 to lowercase hyphenated path; category card uses canonical slug; accessory recommendations point into accessories; custom quote canonical present. Apex domain returns 308 to www while retaining path and query, then 200.
- Search Console displayed “Sitemap submitted successfully” for the canonical www sitemap. Receipt saved locally at `C:/Users/Patrick/.codex/visualizations/2026/10/28/01a18464-647c-7160-ac3f-7398b8d478b1/sitemap-submitted.png`. This is submission confirmation, not an indexing guarantee.
- Remaining: manual Request indexing needs Google's reCAPTCHA service to work; retry important categories/products through Search Console. Monitor index changes after Google recrawls. No background automation was created. Original local checkout remains untouched apart from its earlier audit worklog.
