// Static content for the HubGate.ae homepage

export const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "About", href: "#about" },
];

export const heroData = {
  headline: "Unlock True Market Prices. Cut the Sales Noise.",
  subheadline:
    "The secure, double-blind platform for Office Supplies & FM Products in the UAE.",
  buyerCta: "Post Your RFQ Now",
  sellerCta: "View Anonymous RFQs",
  trustBarItems: [
    { label: "100% Anonymous Until You Decide" },
    { label: "Verified UAE Licensed Businesses" },
    { label: "1 Quote Per License – No Spam" },
  ],
};

export const trustCards = [
  {
    title: "Verified Businesses",
    description:
      "All Buyers and Suppliers are real, licensed UAE businesses. No fake profiles. No grey-area intermediaries.",
  },
  {
    title: "Secure & Unbiased",
    description:
      "Double-blind RFQs protect your identity and guarantee true market prices without bias or pressure.",
  },
  {
    title: "Market Efficiency",
    description:
      "One quote per license prevents spam and ensures only serious, qualified offers reach you.",
  },
];

export const howItWorksSteps = [
  {
    step: 1,
    title: "Post Privately",
    description:
      "Create your RFQ with full line-item detail while keeping your Buyer identity hidden from suppliers.",
  },
  {
    step: 2,
    title: "Quote Unbiased",
    description:
      "Sellers view the RFQ and submit quotes. Seller identities stay hidden, focusing purely on price and terms.",
  },
  {
    step: 3,
    title: "Accept & Connect",
    description:
      "You accept the best quote. Only then are both Buyer and Seller identities revealed for direct business.",
  },
];

export const platformPreviewScreens = {
  buyer: [
    {
      id: "buyer-rfq-form",
      label: "RFQ Creation Form",
      description:
        'Create a detailed RFQ with a clear "Keep my identity private" control front and center.',
      highlight: "Keep my identity private",
    },
    {
      id: "buyer-anonymous-inbox",
      label: "Anonymous Quote Inbox",
      description:
        "See all incoming quotes with clear pricing and lead times, while supplier names remain masked.",
      highlight: "Verified Seller #42",
    },
    {
      id: "buyer-acceptance-view",
      label: "Acceptance & Reveal",
      description:
        'Compare offers side by side and confirm with a prominent "Reveal & Connect" action.',
      highlight: "Reveal & Connect",
    },
  ],
  seller: [
    {
      id: "seller-rfq-dashboard",
      label: "Live RFQ Dashboard",
      description:
        "View live RFQs with clear requirements, quantities, and delivery locations like DXB, AUH, and more.",
      highlight: "Delivery Location: DXB",
    },
    {
      id: "seller-quick-quote",
      label: "Quick Quote Form",
      description:
        "Respond in seconds with price and lead time using a standardized, streamlined quoting interface.",
      highlight: "Price & Lead Time",
    },
    {
      id: "seller-buyer-profile",
      label: "Buyer Profile (Post-Acceptance)",
      description:
        "Once accepted, see the full Buyer company name and contact person — qualified, verified leads only.",
      highlight: "Buyer Company & Contact",
    },
  ],
};

export const benefitsData = {
  buyer: {
    key: "buyer",
    label: "For Buyers",
    title: "Procurement Simplified",
    gradientClass: "from-emerald-500 to-teal-500",
    benefits: [
      {
        title: "Price Transparency",
        description:
          "Double-blind RFQs reveal the true market price without sales noise, pressure, or bias.",
      },
      {
        title: "Noise Reduction",
        description:
          "One quote per license cuts spam, follow-up calls, and endless negotiation loops.",
      },
      {
        title: "Supplier Discovery",
        description:
          "Access new, verified suppliers for Office Supplies & FM products across the UAE and GCC.",
      },
    ],
  },
  seller: {
    key: "seller",
    label: "For Sellers",
    title: "Maximize Conversions",
    gradientClass: "from-sky-500 to-cyan-500",
    benefits: [
      {
        title: "Qualified Leads",
        description:
          "Every RFQ is posted by a verified Buyer with a real, licensed UAE company profile.",
      },
      {
        title: "Maximum Efficiency",
        description:
          "Standardized RFQs and quote forms mean less admin, more time pricing and closing deals.",
      },
      {
        title: "Market Expansion",
        description:
          "Tap into new sectors and buyers without cold-calling or expensive field sales.",
      },
    ],
  },
};

export const footerCtaData = {
  headline: "Ready to Modernize Your B2B Sourcing?",
  subheadline: "Join HubGate.ae — the smarter way to buy and sell in the UAE.",
  ctaLabel: "Get Started Now",
};