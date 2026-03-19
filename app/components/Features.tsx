export default function Features() {
  const cards = [
    {
      title: "Precision Prints",
      description: "Calibrated machines and tuned profiles for cleaner layers and better fit.",
    },
    {
      title: "Custom Workflow",
      description: "Send your idea, image, or sketch and get a practical print-ready outcome.",
    },
    {
      title: "Local Fulfillment",
      description: "Pickup or delivery with clear timing and safe packaging in Lebanon.",
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-white">Features</h2>
        <p className="mt-2 text-white/70">What this setup gives you out of the box.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
          >
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
