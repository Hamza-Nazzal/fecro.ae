import React from "react";
import { benefitsData } from "../../data/homeData";

export function BenefitsTabs({ activeTab, setActiveTab }) {
  const current = benefitsData[activeTab];

  const handleTabClick = (key) => {
    setActiveTab(key);
  };

  return (
    <section
      id="benefits"
      className="bg-slate-50 py-16 sm:py-20"
      aria-labelledby="benefits-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="benefits-heading"
              className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-3"
            >
              Dual Benefits for Buyers & Sellers
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              HubGate.ae removes the friction on both sides. Switch between
              Buyer and Seller to see how the platform works for you.
            </p>
          </div>

          {/* Main tablist (controls both sections) */}
          <div
            role="tablist"
            aria-label="Select Buyer or Seller benefits"
            className="inline-flex rounded-full bg-white p-1 text-xs sm:text-sm shadow-sm ring-1 ring-slate-200"
          >
            {["buyer", "seller"].map((key) => {
              const config = benefitsData[key];
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`benefits-panel-${key}`}
                  id={`benefits-tab-${key}`}
                  onClick={() => handleTabClick(key)}
                  className={`relative rounded-full px-4 py-1.5 font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${config.gradientClass} text-white shadow-sm`
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tab content */}
        <div
          id={`benefits-panel-${current.key}`}
          role="tabpanel"
          aria-labelledby={`benefits-tab-${current.key}`}
        >
          <h3 className="mb-6 text-lg sm:text-xl font-semibold text-slate-900">
            {current.title}
          </h3>

          <div className="grid gap-6 sm:grid-cols-3">
            {current.benefits.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${
                    current.key === "buyer"
                      ? "from-emerald-500/10 to-teal-500/20 text-emerald-500"
                      : "from-sky-500/10 to-cyan-500/20 text-sky-500"
                  } group-hover:from-100/20 group-hover:to-100/30`}
                >
                  <span className="text-lg">●</span>
                </div>
                <h4 className="mb-2 text-base font-semibold text-slate-900">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}