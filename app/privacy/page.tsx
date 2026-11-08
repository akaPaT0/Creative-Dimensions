import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 pb-16 pt-32 leading-relaxed text-white/80">
      <h1 className="text-4xl font-semibold text-white">Privacy Policy</h1>
      <p>Creative Dimensions operates this online shop for 3D printed products and custom printing requests.</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">What we receive from Google</h2>
        <p>
          If you choose Sign in with Google, we request basic identity information through the
          OpenID, email and profile permissions. Google provides your account identifier and
          email address, including whether the email is verified, and may provide your name and
          profile picture.
        </p>
        <p>Google sign-in does not give the shop access to your Gmail, Drive files or Google password.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">How we use and store Google information</h2>
        <p>
          Supabase Auth processes Google sign-in for Creative Dimensions and stores your linked
          identity and profile information with your authentication record. The shop uses that
          record to recognize your account, display your name and profile picture when available,
          and connect you to your saved items, addresses and orders. Our team can use your account
          name and email to identify your account when managing orders or responding to support requests.
        </p>
        <p>
          We use HTTPS for the shop, require a signed-in session for access to your account data,
          and check staff permissions separately for administrative tools.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Orders, service providers and support</h2>
        <p>
          We use the delivery and contact details you enter at checkout to process your order.
          Supabase stores shop account and order data. When you place an order, our fulfillment
          team receives order details through Telegram. These messages and the invoice can include
          your account email, which may be your Google email if you signed in with Google.
          If you contact us through WhatsApp, WhatsApp also processes the details you send there.
        </p>
        <p>We use session cookies to keep you signed in and browser storage to remember your cart.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Retention, deletion and contact</h2>
        <p>
          We keep your linked Google information while we need it to provide your shop account
          and sign-in. We may keep order and invoice records longer to fulfill orders, resolve
          disputes or meet legal obligations. You can remove Creative Dimensions from the
          third-party connections in your Google Account. To remove information already held
          by the shop, send us a deletion request.
        </p>
        <p>
          To request access, correction or deletion of your data, email{" "}
          <a className="text-[#FF8B64] underline" href="mailto:support@creativedimensionslb.com">
            support@creativedimensionslb.com
          </a>. We may ask you to verify that you control the shop account before we act on your request.
        </p>
      </section>
    </main>
  );
}
