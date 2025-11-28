import React, { useState } from "react";
import { useScrollHeader } from "../hooks/useScrollHeader";
import { Navbar } from "../components/home/Navbar";
import { Hero } from "../components/home/Hero";
import { TrustSection } from "../components/home/TrustSection";
import { HowItWorks } from "../components/home/HowItWorks";
import { PlatformPreview } from "../components/home/PlatformPreview";
import { BenefitsTabs } from "../components/home/BenefitsTabs";
import { FooterCTA } from "../components/home/FooterCTA";

export default function HomePage() {
  const { isScrolled, sentinelRef } = useScrollHeader();
  const [activeTab, setActiveTab] = useState("buyer"); // shared Buyer/Seller tab state

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar isScrolled={isScrolled} />

      {/* Sentinel for scroll detection (invisible) */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="h-1 w-full"
      />

      <main className="bg-slate-950 text-slate-50">
        {/* A. Hero */}
        <Hero />

        {/* B. Trust & Credibility (About) */}
        <TrustSection />

        {/* C. How It Works */}
        <HowItWorks />

        {/* D. Platform Preview (synced tabs) */}
        <PlatformPreview activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* E. Dual Benefits (main tab controller) */}
        <BenefitsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>

      {/* F. Final CTA Footer */}
      <FooterCTA />
    </div>
  );
}