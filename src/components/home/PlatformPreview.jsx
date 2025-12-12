//src/components/home/PlatformPreview.jsx

import React from "react";
import { platformPreviewScreens, benefitsData } from "../../data/homeData";

export function PlatformPreview({ activeTab, setActiveTab }) {
  const currentScreens = platformPreviewScreens[activeTab];
  const buyerIsActive = activeTab === "buyer";

  const handleTabClick = (key) => {
    setActiveTab(key);
  };

  return (
    <section
      className="bg-white py-16 sm:py-20"
      aria-labelledby="preview-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="preview-heading"
              className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-3"
            >
              Platform Preview
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Switch between the Buyer and Seller views to see how double-blind
              RFQs look inside HubGate.ae before and after acceptance.
            </p>
          </div>

          {/* Tab Switch (second tablist, synced with Benefits) */}
          <div
            role="tablist"
            aria-label="Select Buyer or Seller preview"
            className="inline-flex rounded-full bg-slate-100 p-1 text-xs sm:text-sm"
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
                  aria-controls={`preview-panel-${key}`}
                  id={`preview-tab-${key}`}
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

        {/* Screens */}
        <div
          id={`preview-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`preview-tab-${activeTab}`}
          className="grid gap-6 sm:grid-cols-3"
        >
          {currentScreens.map((screen) => (
            <article
              key={screen.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {screen.label}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    buyerIsActive
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-sky-500/10 text-sky-600"
                  }`}
                >
                  {buyerIsActive ? "Buyer View" : "Seller View"}
                </span>
              </div>
              <p className="text-xs text-slate-600">{screen.description}</p>

              {/* Browser-style placeholder (Style B) */}
              <div className="mt-1 flex-1 rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Top bar */}
                <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-rose-300" />
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  <div className="ml-3 h-4 flex-1 rounded-md bg-slate-100" />
                </div>

                {/* Inner content mock */}
                <div className="space-y-2 px-4 py-3 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="h-2 w-20 rounded-full bg-slate-100" />
                    <span className="h-2 w-10 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-2 w-32 rounded-full bg-slate-100" />
                  <div className="h-2 w-24 rounded-full bg-slate-100" />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-900/5 px-2 py-1 text-[10px] font-medium text-slate-700">
                      {screen.highlight}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        buyerIsActive
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-sky-500/10 text-sky-600"
                      }`}
                    >
                      AED • Double-Blind
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}