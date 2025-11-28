import React from "react";
import { heroData } from "../../data/homeData";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-slate-950 pt-28 pb-20 text-slate-50"
      aria-labelledby="hero-heading"
    >
      {/* Subtle gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_55%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        {/* Left: Copy */}
        <div className="max-w-xl">
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4"
          >
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              {heroData.headline}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mb-6">
            {heroData.subheadline}
          </p>

          {/* Split CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <a
              href="/signup?role=buyer"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {heroData.buyerCta}
            </a>
            <a
              href="/signup?role=seller"
              className="inline-flex items-center justify-center rounded-full border border-cyan-400/70 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-slate-900/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {heroData.sellerCta}
            </a>
          </div>

          {/* Trust Bar */}
          <div
            className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-900/70 p-4 ring-1 ring-emerald-500/10"
            aria-label="Pre-launch trust signals"
          >
            {heroData.trustBarItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-xs sm:text-sm text-slate-200"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 text-xs">
                  ✓
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stylized preview card */}
        <div className="relative flex-1">
          <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-emerald-500/10 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="ml-2 text-xs text-slate-400">HubGate RFQ View</span>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                  Buyer ID: Anonymous #18
                </span>
                <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[11px] text-sky-300">
                  Supplier: Hidden
                </span>
              </div>

              <div className="rounded-2xl bg-slate-800/80 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                    Office Supplies RFQ • Dubai
                  </span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300">
                    AED
                  </span>
                </div>
                <div className="mb-3 h-2 w-2/3 rounded-full bg-slate-700" />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="h-2 w-24 rounded-full bg-slate-700" />
                    <span className="h-2 w-10 rounded-full bg-slate-700" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="h-2 w-28 rounded-full bg-slate-700" />
                    <span className="h-2 w-16 rounded-full bg-slate-700" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="h-2 w-20 rounded-full bg-slate-700" />
                    <span className="h-2 w-12 rounded-full bg-emerald-500/60" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[11px] font-semibold text-white shadow-md">
                  Double-Blind · No Sales Noise
                </span>
              </div>
            </div>
          </div>

          {/* Soft glow accent */}
          <div className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),_transparent_60%)]" />
        </div>
      </div>
    </section>
  );
}