import CustomRequestModal from "../components/CustomRequestModal";

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-32 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-white text-4xl font-semibold">Contact</h1>
        <p className="text-white/70 mt-3">
          If you visit /contact directly, you’ll see this page. From inside the
          site, it opens as a modal.
        </p>

        <div className="mt-6 space-y-3">
          <CustomRequestModal
            productName="Custom Order"
            productUrl="https://creativedimensionslb.com/contact"
            buttonLabel="Custom Request"
            className="block w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white hover:bg-white/10 transition"
          />

          <a
            className="block rounded-2xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white/10 transition"
            href="https://wa.me/96170304007?text=Hi%20Creative%20Dimensions%2C%20I%20want%20to%20ask%20about..."
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp: <span className="text-white/80">+961 70 304 007</span>
            <div className="mt-1 text-white/60 text-sm">
              Tap to chat with a prefilled message.
            </div>
          </a>

          <a
            className="block rounded-2xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white/10 transition"
            href="tel:+96170304007"
          >
            Call: <span className="text-white/80">+961 70 304 007</span>
            <div className="mt-1 text-white/60 text-sm">
              Direct phone call from your device.
            </div>
          </a>

          <a
            className="block rounded-2xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white/10 transition"
            href="https://instagram.com/creativedimensions.lb"
            target="_blank"
            rel="noreferrer"
          >
            Instagram:{" "}
            <span className="text-white/80">@creativedimensions.lb</span>
          </a>
        </div>
      </div>
    </main>
  );
}
