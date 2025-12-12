//src/components/home/HowItWorks.jsx

import React from "react";
import { howItWorksSteps } from "../../data/homeData";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-slate-50 py-16 sm:py-20"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h2
            id="how-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-3"
          >
            How the Double-Blind RFQ Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            HubGate.ae keeps identities hidden until there is a mutual decision
            to work together. The result: clean RFQs, honest quotes, and
            efficient deals.
          </p>
        </div>

        <ol className="grid gap-6 sm:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <li key={step.step} className="relative">
              {/* Connecting line */}
              {index < howItWorksSteps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden sm:block absolute top-8 right-[-14%] h-px w-1/4 bg-gradient-to-r from-emerald-300 to-cyan-300"
                />
              )}

              <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-sm font-semibold text-white">
                    {step.step}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600">{step.description}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}