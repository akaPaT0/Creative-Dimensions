# Decisions

## 2026-11-14 - Overlapping seasons share one homepage section as tabs

- Owner sells Berbara (Dec 4) and Christmas at the same time and chose one section with tabs over stacked sections. Christmas is first at the owner's request. Seasons end by date rather than by manual redeploy; Berbara reuses the Halloween catalogue.

## 2026-11-14 - Personalised names and price options are per-product opt-ins

- Owner: only custom items should ask for a name; non-custom items keep today's flow. Both features default off and are enabled per product in admin.
- Store settings in two nullable jsonb columns on `products` rather than overloading `variants`. Prices always come from the product on the server; the cart only carries the option label and typed text. Each distinct name is its own cart line.

## 2026-11-14 - Christmas publication and direct imagegen cutouts

- Owner rejected manual mask refinement and explicitly requested direct imagegen cutouts composited onto the exact saved background. Use generated RGB and alpha directly; no source RGB restoration or re-segmentation. This supersedes earlier original-photo-only rules for this Christmas batch. Preserve source references, cutouts, prompts and editable layers locally. Imagegen rejected the Stitch cutout; retain the supplied unmodified photo for that listing.
- Publish 33 new listings in top-level `christmas`: 18 supplied in chat plus all 15 distinct catalogue listings. Preserve their prices, $12 ornament set and $15 nine-bauble set. Spiral trees are $8 and tall gnomes $7, each in green/red/white; sculpted deer $6.50 white only. Tree clicker $6 includes a stylized exploded-view illustration using the existing fidget clicker's presentation. Per the parallel personalization release handoff, eight name-based listings use required per-product text fields; photo products retain the custom request flow. Price options remain off because each listing has one approved price.
- Use isolated `codex/christmas-release` based on current main and the existing category/product/checkout components. Insert only these new rows and immutable assets; preserve all existing products. The publisher is insert-only and must not be used to update future image changes.

## 2026-11-09 - Publish the Halloween collection

- Owner authorized publishing all eight prepared listings under the top-level category `halloween` (display label Halloween). Group them into candy-bowls, pots, figurines, wall-decor and lanterns. Retain the existing category/product page components, image-linked variant/cart behavior and canonical URL pattern.
- Prices: Ghost Bowl $20, Stitched Skull Bowl $20, Pumpkin Bowl $15, Skull Pot $13, Screaming Ghost Bowl $22, Flexi Skeleton $7, Bat Wall Decor Pack $5 per pack, Coffin Lantern $11 each with Green Bats, Orange Ghosts and Red Spiderweb options. The bat listing promises four designs; do not invent extra quantity, dimensions, mounting supplies, sweets or lantern power/light inclusion details.
- Preserve the owner's exact `2.png` composition and original product photo layers. Publish the 22 approved exports as pixel-identical lossless WebP files in the existing public Supabase product_images bucket. The public catalog manifest is `catalog/halloween-2026.json`; source photos and editable artwork remain in the original checkout's local product-drafts directory.
- Publish only these new rows; never replace the full products table. `scripts/publish-halloween.mjs` defaults to dry run, backs up the existing catalog under ignored .vercel, verifies asset hashes and existing rows, and inserts the batch atomically. Keep unfinished Google sign-in off production.

## 2026-11-08 - Release password recovery without Google sign-in

- Use a shop-specific Resend sender with Supabase recovery tokens and keep the shared Supabase mail configuration. Apply Turnstile only to the new reset request form. The reset link opens without consuming the token. Saving the new password consumes the token in a server-only session and returns the customer to the existing sign-in flow.
- Continue unfinished Google sign-in work on codex/creative-dimensions-google-sign-in. Keep production on main.

## 2026-10-28 - Canonical product navigation

- Keep www as the existing canonical production host. Use Vercel's permanent 308 apex-to-www redirect; preserve path and query.
- Reuse one lightweight product URL helper for server and client navigation. Preserve the established slug normalization used by product lookup, metadata and sitemaps; do not rewrite stored product data.
- Pass categories into recommendation cards instead of assuming keychains. Redirect legacy noncanonical product slugs permanently after confirming the product exists.
- Address demonstrated URL/navigation defects without claiming that they alone explain Google's scheduling. Indexing and branded sitelinks remain Google-controlled outcomes.
