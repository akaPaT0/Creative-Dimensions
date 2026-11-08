import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout, { PolicySection, policyLinkClass } from "@/app/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for Creative Dimensions shop accounts, custom prints, orders, and returns.",
  alternates: { canonical: "/terms" },
};

const sections = [
  { id: "accounts", title: "Accounts and orders" },
  { id: "custom-printing", title: "Custom printing requests" },
  { id: "returns", title: "Returns and order issues" },
  { id: "contact", title: "Privacy and contact" },
] as const;

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      description="These terms cover your use of the Creative Dimensions shop and its account and ordering features."
      updatedOn="2026-11-08"
      sections={sections}
      relatedLink={{ href: "/privacy", label: "Privacy Policy" }}
    >
      <PolicySection section={sections[0]} index={0}>
        <p>
          Use accurate account, contact and delivery details. Review the items, options and
          total shown at checkout before placing an order. Contact us promptly if your order
          details need correcting or you have a question about delivery or cancellation.
        </p>
      </PolicySection>

      <PolicySection section={sections[1]} index={1}>
        <p>
          Only share models, images and other material that you have permission to use.
          Before you confirm a custom order, we walk you through the printing process,
          share a design preview, and discuss the specifications, price, delivery and
          any policies that apply. Review the preview and quote, and ask us about anything
          you would like clarified before you approve the order.
        </p>
      </PolicySection>

      <PolicySection section={sections[2]} index={2}>
        <p>
          We do not offer change-of-mind returns for 3D printed items, including custom
          prints, except where applicable law requires otherwise.
        </p>
        <p>
          If your print arrives damaged, has a defect, or differs from what we agreed,
          please <Link className={policyLinkClass} href="/contact">contact us</Link>{" "}
          with your order details. We will review what happened and help you find a
          resolution. Your rights under applicable consumer protection law still apply.
        </p>
      </PolicySection>

      <PolicySection section={sections[3]} index={3}>
        <p>
          See our <Link className={policyLinkClass} href="/privacy">Privacy Policy</Link>{" "}
          for how the shop uses your information. Contact{" "}
          <a className={`${policyLinkClass} break-all sm:break-normal`} href="mailto:support@creativedimensionslb.com">
            support@creativedimensionslb.com
          </a>{" "}with questions.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
