# Single-product catalogue publisher

This workflow stages **HA009 / Skull Apple Sculpture / $7** without changing existing entries.

## Required one-time setup

1. Add the approved 83,024-byte WebP to `catalog/pending/assets/skull-apple-sculpture-001.webp` on the default branch. Its SHA-256 must be `6ac4b0c44d700122ea194eecc468fbff9a55a549e878bd41b59dd5719d4b7d7b`. Do not substitute a different image.
2. Create an environment named `catalogue-production` under GitHub repository Settings → Environments. Require reviewer approval for safety if the plan supports it.
3. Configure an Actions secret named `SUPABASE_SERVICE_ROLE_KEY` for that environment, using the private value securely from the existing Vercel production project. Never commit the value or paste it in chat.
4. Open Actions → **Publish approved catalogue product** → Run workflow. Set SKU to `HA009` and keep Publish **false** to validate.
5. After green dry run, run again with Publish **true**. Verify the public storefront after cache revalidation (typically within 60 seconds).

The publisher checks the fixed Supabase project, SKU, slug, category, price, asset length/hash, existing duplicate records and image object hash. It creates a catalog backup in the runner's ephemeral `.vercel/catalog-backups` directory and inserts only HA009. It never updates/deletes other rows and can safely be rerun if the existing row matches exactly.

**Important:** GitHub Actions runner backups are ephemeral; download/store a persistent backup separately for production disaster recovery. If publication fails after uploading an image but before inserting the product, rerun the workflow; the image is verified and reused.

The manifest's image URL points to the production Supabase Storage bucket `product_images`; no website redeployment is required.
