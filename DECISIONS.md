# Decisions

## 2026-11-09 - Keep Google work separate from the reset release

- Production main ships the shop-branded password reset with the existing sign-in/session system. Its server consumes the recovery token when a new password is submitted. This supersedes the earlier two-step local recovery exchange for production.
- Continue Google/SSR auth development on `codex/creative-dimensions-google-sign-in`. Merge current main and reconcile its recovery implementation before a future auth release. Existing branch changes and pending acceptance checks remain documented.

## 2026-11-08 - Google sign-in flow

- Reuse existing Supabase SSR sessions and admin authorization. Google sign-in uses PKCE with server-side code exchange; accept only internal return paths, keep production origin canonical, and never expose provider error details. Email/password and Turnstile remain in place for their existing flows.
- Keep Google Cloud branding/clients separate from Real Ones. Use `support@creativedimensionslb.com` as the proposed public support address; branded Google account creation requires the owner's request/confirmation.
- Stay within the owner's existing free-plan/two-project constraint. Supabase project `ypevaawhxhupjxjgkwdp` stays shared with Canvas; use a dedicated custom Google OIDC provider `custom:creative-dimensions-google` for the shop. Current official docs permit 3 custom providers per free project. Preserve Canvas's Site URL/provider configuration; add shop-specific callback allow-list entries. Separate providers do not partition the project-wide Auth user directory or replace app authorization/RLS. No new Supabase account/project, paid upgrade, or database migration is required for this OAuth approach.
- The owner approved Google OAuth audience promotion to production with basic identity scopes. Google verifies and publishes branding separately. Keep the domain ownership TXT record in Cloudflare and release the corrected privacy copy independently of the unfinished sign-in changes.
- Serve `/privacy` and `/terms` as public, server-rendered HTML through the shared `PolicyLayout`. Keep the disclosure headings and stable section links visible without client scripts. Review policy text separately from visual changes.
- For the shop’s password recovery, generate the one-time token with Supabase Auth and send it through a Resend key restricted to `creativedimensionslb.com`. Keep shared SMTP and Auth hooks in place for other apps. The shop link keeps the token in its fragment and exchanges it only after the user confirms, so opening or prefetching the link alone does not consume the token.

## 2026-10-28 - Canonical product navigation

- Keep www as the existing canonical production host. Use Vercel's permanent 308 apex-to-www redirect; preserve path and query.
- Reuse one lightweight product URL helper for server and client navigation. Preserve the established slug normalization used by product lookup, metadata and sitemaps; do not rewrite stored product data.
- Pass categories into recommendation cards instead of assuming keychains. Redirect legacy noncanonical product slugs permanently after confirming the product exists.
- Address demonstrated URL/navigation defects without claiming that they alone explain Google's scheduling. Indexing and branded sitelinks remain Google-controlled outcomes.
