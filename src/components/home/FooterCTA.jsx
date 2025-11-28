import React from "react";
import { footerCtaData } from "../../data/homeData";

export function FooterCTA() {
  return (
    <footer
      className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-20"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center text-slate-50">
        <h2
          id="cta-heading"
          className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3"
        >
          {footerCtaData.headline}
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-sm sm:text-base text-slate-300">
          {footerCtaData.subheadline}
        </p>
        <a
          href="/signup"
          className="inline-flex items-center justify-center rounded-full bg-white px-7 py-2.5 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {footerCtaData.ctaLabel}
        </a>

        <p className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} HubGate.ae — Double-Blind RFQs for the UAE.
        </p>
      </div>
    </footer>
  );
}