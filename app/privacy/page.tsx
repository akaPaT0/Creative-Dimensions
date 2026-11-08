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
        <h2 className="text-xl font-semibold text-white">Google sign-in</h2>
        <p>
          If you choose to sign in with Google, we request your Google account identifier,
          email address and basic profile information, such as your name and profile picture.
          Supabase Auth uses this information to create or recognize your shop account and
          stores it with your authentication record. The shop uses your account to connect
          you to features such as saved items, addresses and order history.
        </p>
        <p>Google sign-in does not give the shop access to your Gmail, Drive files or Google password.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Orders and support</h2>
        <p>
          We use the contact details, delivery address and items you provide to process and
          fulfill your order and respond to questions. Supabase stores shop account and order
          data. Our order system may send your order and contact details through Telegram
          to the team handling fulfillment. If you choose to contact us through WhatsApp,
          the details you send are also processed by WhatsApp.
        </p>
        <p>We use session cookies to keep you signed in and browser storage to remember your cart.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Questions and requests</h2>
        <p>
          To ask about your information or request access, correction or deletion, email{" "}
          <a className="text-[#FF8B64] underline" href="mailto:support@creativedimensionslb.com">
            support@creativedimensionslb.com
          </a>.
        </p>
      </section>
    </main>
  );
}
