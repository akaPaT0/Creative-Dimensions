This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Commerce storage

Creative Dimensions uses Supabase project `ypevaawhxhupjxjgkwdp`. Apply
`supabase-commerce-schema.sql` before deploying the commerce routes. It creates
`cd_promo_codes`, `cd_filaments`, `cd_document_counters`, and the atomic
`cd_next_document_numbers()` function. The migration was applied on 2026-10-03.

Only server routes using `SUPABASE_SERVICE_ROLE_KEY` can access these tables;
admin mutations additionally require the existing verified admin session. Public
routes expose active promos and usable active filament colors. The app no longer
uses Vercel KV/Redis. An empty promo table means no discounts; storage failures
return errors and never reactivate hardcoded defaults. Orders without a promo
do not depend on promo-table reads.

The retired Upstash endpoint no longer resolves. Historical custom promos and
filaments could not be recovered; do not seed guessed discounts. Recover from an
owner-supplied backup or recreate explicitly through admin. Order and invoice
counters start above existing numeric values; allocation can leave gaps after
failed orders. Management credentials belong only in ignored local env files,
never in client variables, Git, or Vercel deployment uploads.

## Customer reviews

Apply `supabase-reviews-schema.sql` (additive, rerunnable) to create `cd_reviews`.
Clients submit at `/review` (prefill with `?product=...&order=...&name=...`;
Admin → Reviews builds this link from a picked order). Signed-in clients choose
from their own orders; otherwise the form asks no order number.
Submissions are Turnstile-checked (action `review`), rate limited, and saved as
`pending`; a Telegram alert is sent if configured. Nothing is public until the
admin approves it under Admin → Reviews. Approved reviews show on the homepage
(section hidden while there are none) and at `/reviews`, with surnames shortened
to an initial. Order numbers are stored for the admin only.

## AI traffic

Admin → AI traffic shows daily counts of visits that involve an AI assistant,
in three separate numbers: robots reading pages (`GPTBot`, `ClaudeBot`, ...),
assistants opening a page for someone's question (`ChatGPT-User`,
`Claude-User`, ...), and real visitors arriving from an assistant (referring
site or `utm_source`). Apply `supabase-ai-traffic-schema.sql` (additive,
rerunnable) to create `cd_ai_traffic` and `cd_ai_traffic_hit()`; until then the
tab says counting is not switched on and nothing is recorded.

`proxy.ts` does the counting. Its matcher only wakes it for public pages whose
request already names a known robot, AI referring site or AI `utm_source`, so
ordinary customer requests never run it. It adds 1 to a daily counter after the
response is sent, never changes the response and drops the count on any
failure. Only the production deployment counts. No IP address, cookie or
visitor identifier is stored, only day, service, robot/site, page and a number.

The robot and site lists live in `app/lib/ai-traffic.ts` and are repeated in
the `proxy.ts` matcher because Next.js needs literal values there;
`node --test scripts/ai-traffic.test.mjs` fails if the two drift apart.
Limits: robots are recognised by the name they send and are not verified by IP;
Gemini and Copilot crawl through the ordinary Google and Bing robots and cannot
be told apart; many apps strip the referring site, so visitor counts are a
minimum; a reload of a tagged landing URL counts again.

## Security notes

- Every response carries `X-Frame-Options: DENY`, `nosniff`, a referrer policy,
  a permissions policy and a small CSP (`frame-ancestors`, `base-uri`,
  `object-src`, `form-action`); see `next.config.ts`. There is no `script-src`
  rule: Next.js inline scripts would need per-request nonces.
- `/api/custom-request` (photo/3D uploads from the request form) needs a
  Turnstile token (action `custom_request`), accepts at most 6 files of 4 MB,
  only PNG/JPG/WebP/STL/3MF/OBJ/ZIP whose bytes match, and stores them with a
  server-chosen content type.
- `/api/promocodes?code=X` answers for one typed code only; the list of codes
  is never public. Orders are capped at 100 per item, 40 lines, 3 orders per
  10 minutes and 10 per day per account (counted in the `orders` table).
- The admin email exists only in the server variable `ADMIN_EMAIL`. Client
  code asks `/api/admin/me`; do not reintroduce `NEXT_PUBLIC_ADMIN_EMAIL`.
- In-memory rate limits (reviews, uploads, promo guesses, password reset) are
  per server instance and best-effort; Turnstile is the real bot barrier.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
