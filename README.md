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
