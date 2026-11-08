import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 pb-16 pt-32 leading-relaxed text-white/80">
      <h1 className="text-4xl font-semibold text-white">Terms of Service</h1>
      <p>These terms cover your use of the Creative Dimensions shop and its account and ordering features.</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Accounts and orders</h2>
        <p>
          Use accurate account, contact and delivery details. Review the items, options and
          total shown at checkout before placing an order. Contact us promptly if your order
          details need correcting or you have a question about delivery or cancellation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Custom printing requests</h2>
        <p>
          Only share models, images and other material that you have permission to use.
          Before you confirm a custom order, we walk you through the printing process,
          share a design preview, and discuss the specifications, price, delivery and
          any policies that apply. Review the preview and quote, and ask us about anything
          you would like clarified before you approve the order.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Returns and order issues</h2>
        <p>
          We do not offer change-of-mind returns for 3D printed items, including custom
          prints, except where applicable law requires otherwise.
        </p>
        <p>
          If your print arrives damaged, has a defect, or differs from what we agreed,
          please <Link className="text-[#FF8B64] underline" href="/contact">contact us</Link>{" "}
          with your order details. We will review what happened and help you find a
          resolution. Your rights under applicable consumer protection law still apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Privacy and contact</h2>
        <p>
          See our <Link className="text-[#FF8B64] underline" href="/privacy">Privacy Policy</Link>{" "}
          for how the shop uses your information. Contact{" "}
          <a className="text-[#FF8B64] underline" href="mailto:support@creativedimensionslb.com">
            support@creativedimensionslb.com
          </a>{" "}with questions.
        </p>
      </section>
    </main>
  );
}
