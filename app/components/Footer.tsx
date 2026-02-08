import Link from "next/link";
import { Instagram, MessageCircle, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-6 items-center text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
          {/* Left */}
          <div>
            <p className="text-white/85 text-sm">
              © 2026 Creative Dimensions. All rights reserved.
            </p>
            <p className="text-white/55 text-xs mt-1">
              Designed with taste. Printed with precision.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-wrap gap-3 justify-center sm:justify-end items-center">
            <a
              href="https://wa.me/96170304007"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-white/15 bg-transparent text-white/85 text-sm hover:bg-white/10 transition"
            >
              <MessageCircle size={18} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <a
              href="https://instagram.com/creativedimensions.lb"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-white/15 bg-transparent text-white/85 text-sm hover:bg-white/10 transition"
            >
              <Instagram size={18} />
              <span className="hidden sm:inline">Instagram</span>
            </a>

            <a
              href="tel:+96170304007"
              aria-label="Call"
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-white/15 bg-transparent text-white/85 text-sm hover:bg-white/10 transition"
            >
              <Phone size={18} />
              <span className="hidden sm:inline">Call</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

