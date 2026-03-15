"use client";

type LinkCardProps = {
  title: string;
  description: string;
  url: string;
  image?: string;
  category?: string;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFavicon(url: string) {
  try {
    const u = new URL(url);
    return `${u.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

function getInitials(title: string) {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function pickGradient(seed: string) {
  const gradients = [
    "from-cyan-500/25 via-sky-500/10 to-transparent",
    "from-violet-500/25 via-fuchsia-500/10 to-transparent",
    "from-emerald-500/25 via-teal-500/10 to-transparent",
    "from-amber-500/25 via-orange-500/10 to-transparent",
    "from-rose-500/25 via-pink-500/10 to-transparent",
    "from-indigo-500/25 via-blue-500/10 to-transparent",
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

export default function LinkCard({
  title,
  description,
  url,
  category,
}: LinkCardProps) {
  const hostname = getHostname(url);
  const favicon = getFavicon(url);
  const initials = getInitials(title);
  const gradient = pickGradient(`${title}-${category}-${hostname}`);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10"
    >
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br ${gradient}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />

        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-6 -top-8 text-[110px] font-semibold tracking-tight text-white/10 transition duration-300 group-hover:scale-105">
            {initials}
          </div>
        </div>

        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
              {favicon ? (
                <img
                  src={favicon}
                  alt=""
                  className="h-4 w-4 rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <span className="truncate">{hostname}</span>
            </div>

            {category ? (
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-white/70">
                {category}
              </span>
            ) : null}
          </div>

          <div>
            <div className="mb-2 text-4xl font-semibold leading-none text-white/90">
              {initials}
            </div>
            <h3 className="max-w-[85%] text-xl font-semibold text-white">
              {title}
            </h3>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      <div className="p-4">
        <p className="text-sm text-white/65">{description}</p>
        <p className="mt-3 truncate text-xs text-white/40">{url}</p>
      </div>
    </a>
  );
}