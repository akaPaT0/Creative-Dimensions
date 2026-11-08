import TemphomeCustomRequestCta from "./TemphomeCustomRequestCta";

export default function CustomOrderBand({
  title = "Got something in mind?",
  text = "Send us a photo, sketch or idea. We’ll show you a preview and a price before we print.",
  id,
  className = "",
}: {
  title?: string;
  text?: string;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={className}>
      <div className="flex flex-col items-start gap-5 rounded-3xl border border-white/10 bg-[#141417]/90 p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
          <p className="mt-1.5 text-sm sm:text-base text-white/60">{text}</p>
        </div>
        <TemphomeCustomRequestCta
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center rounded-2xl bg-[#FF8B64] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          buttonLabel="Get a Quote"
        />
      </div>
    </section>
  );
}
