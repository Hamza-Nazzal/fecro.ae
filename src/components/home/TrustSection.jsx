//src/components/home/TrustSection.jsx

import React from "react";
import { trustCards } from "../../data/homeData";

export function TrustSection() {
  return (
    <section
      id="about"
      className="bg-white py-16 sm:py-20"
      aria-labelledby="trust-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h2
            id="trust-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-3"
          >
            Built for Real, Licensed UAE Businesses
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            HubGate.ae is a double-blind RFQ marketplace for Office Supplies and
            Facility Management products. We verify every Buyer and Seller so
            both sides can trust the process, the price, and the partner.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {trustCards.map((card) => (
            <article
              key={card.title}
              className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-400/20 text-emerald-500 group-hover:from-emerald-500/20 group-hover:to-teal-400/30">
                <span className="text-lg">★</span>
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-900">
                {card.title}
              </h3>
              <p className="text-sm text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}