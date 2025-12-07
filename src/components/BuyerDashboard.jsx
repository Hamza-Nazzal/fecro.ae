// src/components/BuyerDashboard.jsx
import React from "react";
import BuyerRFQsInline from "./BuyerRFQsInline";

export default function BuyerDashboard({ onViewQuotations, ...rest }) {
  return (
    <div className="p-4">
      <BuyerRFQsInline onViewQuotations={onViewQuotations} />
    </div>
  );
}
